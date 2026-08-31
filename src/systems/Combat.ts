import type { GameState } from "../game/GameState";
import type { PinataEntity } from "../world/PinataFactory";
import type { Weapon } from "../world/Weapon";
import type { PinataFactory } from "../world/PinataFactory";
import { getPinataHitWorld } from "../world/PinataFactory";
import { BASE, BURNING_CHAIN, DOUBLE_HIT_CHANCE, FIRST_HIT_MULTIPLIER, IGNITE, LUCKY_CRIT, LUCKY_SEVEN, ROCK_RAIN, RAGE_MODE, RESTORE_CHANCE, RESTORE_CHANCE_2, RESTORE_CHANCE_3, SUPER_JACKPOT } from "../game/balance";
import { rollJackpot, rollLoot, isThiefPinata, thiefBreakLoot } from "../game/pinataTypes";
import { rng } from "../util/rng";

export type HitSource = "swing" | "double" | "lightning" | "shockwave" | "phantom" | "ignite" | "rock" | "lastStand";

export interface HitEvent {
  pinata: PinataEntity;
  damage: number;
  broke: boolean;
  candy: number;
  screenX: number;
  screenY: number;
  source: HitSource;
  chainFrom?: PinataEntity;
  staminaRestored: number;
  doubleLoot: boolean;
  jackpot: boolean;
  superJackpot: boolean;
  glowingBonus: boolean;
  lowStaminaBonus: boolean;
  crit: boolean;
  ignited: boolean;
  candyRainPayout: number;
  spreadTargets?: PinataEntity[];
  igniteSpreadTargets?: PinataEntity[];
  luckySeven: boolean;
  oneSmash: boolean;
  rockOrigin?: { x: number; y: number; z: number };
}

export class Combat {
  cooldown = 0;
  hitStop = 0;
  rageTriggered = false;
  tantrumTriggered = false;
  private comboTimer = 0;

  update(dt: number): number {
    // Returns scaled dt after hit-stop
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      return dt * 0.15;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) {
      // combo decay handled by caller via state
    }
    return dt;
  }

  trySwing(
    state: GameState,
    inRange: PinataEntity[],
    allPinatas: PinataEntity[],
    weapon: Weapon,
    factory: PinataFactory,
  ): HitEvent[] {
    if (state.phase !== "roundActive") return [];
    this.rageTriggered = false;
    this.tantrumTriggered = false;
    if (this.cooldown > 0 || weapon.isSwinging) return [];

    const rate = state.getSwingRate();
    this.cooldown = 1 / rate;
    weapon.startSwing(Math.min(0.315, this.cooldown * 0.375));
    state.roundStats.swings += 1;
    state.totalSwings += 1;

    const alive = inRange.filter((t) => t.alive);
    const doubleProc = state.hasUpgrade("doubleHit") && rng.chance(DOUBLE_HIT_CHANCE);

    if (alive.length === 0) {
      if (state.hasUpgrade("combo")) {
        if (!state.tryComboSaver()) {
          state.combo = 0;
          this.comboTimer = 0;
        }
      }
      this.tantrumTriggered = state.noteMiss();
      // Missed extra hit does not add another swing to accuracy.
      return [];
    }

    // One connecting swing = one hit for accuracy (multi-target swings must not exceed 100%).
    state.roundStats.hits += 1;
    state.totalHits += 1;
    state.noteConnect();

    this.hitStop = BASE.hitStopMs / 1000;
    this.comboTimer = BASE.comboWindowMs / 1000;
    state.combo += 1;

    const onScreen = allPinatas.filter((t) => t.alive).length;
    const damage =
      state.getPower() +
      (alive.length >= 2 ? state.getCollateralBonus() : 0) +
      state.getComboBonus() +
      state.getStackingDamageBonus() +
      state.getCrowdDamageBonus(onScreen);

    const hits: HitEvent[] = [];
    for (const target of alive) {
      hits.push(this.stickStrike(state, target, factory, damage, "swing", allPinatas));
      this.tryPhantom(state, allPinatas, factory, hits);
    }

    if (doubleProc) {
      for (const target of alive) {
        if (!target.alive) continue;
        hits.push(this.stickStrike(state, target, factory, damage, "double", allPinatas));
        this.tryPhantom(state, allPinatas, factory, hits);
      }
    }

    if (state.hasUpgrade("lightningStrike") && rng.chance(state.getLightningChance())) {
      const struck = new Set(alive.map((p) => p.id));
      const boltDamage = state.getLightningDamage();
      const rays = state.getLightningRays();
      const perRay = state.getLightningTargets();
      for (let ray = 0; ray < rays; ray++) {
        const origin = alive[ray % alive.length]!;
        const originPos = getPinataHitWorld(origin).clone();
        const nearby = allPinatas
          .filter((p) => p.alive && !struck.has(p.id))
          .map((p) => ({ p, d2: getPinataHitWorld(p).distanceToSquared(originPos) }))
          .sort((a, b) => a.d2 - b.d2)
          .slice(0, perRay);
        for (const { p } of nearby) {
          struck.add(p.id);
          hits.push(this.strike(state, p, factory, boltDamage, "lightning", allPinatas, origin));
        }
      }
    }

    if (state.hasUpgrade("shockwave") && rng.chance(state.getShockwaveChance())) {
      const origin = alive[0]!;
      const waveDamage = state.getShockwaveDamage();
      for (const p of allPinatas) {
        if (!p.alive) continue;
        hits.push(this.strike(state, p, factory, waveDamage, "shockwave", allPinatas, origin));
      }
    }

    this.applyPinataShockwaves(state, factory, allPinatas, hits);
    this.tryRockRain(state, alive[0]!, factory, allPinatas, hits);
    return hits;
  }

  /** Chance per player-stick hit to spawn phantom hands at random living piñatas. */
  private tryPhantom(
    state: GameState,
    allPinatas: PinataEntity[],
    factory: PinataFactory,
    hits: HitEvent[],
  ): void {
    if (!state.hasUpgrade("phantomStick") || !rng.chance(state.getPhantomChance())) return;
    const candidates = allPinatas.filter((p) => p.alive);
    if (candidates.length === 0) return;
    const count = Math.min(state.getPhantomTargets(), candidates.length);
    for (let i = 0; i < count; i++) {
      const idx = rng.int(0, candidates.length - 1);
      const target = candidates.splice(idx, 1)[0]!;
      let damage = state.getPhantomDamage();
      const hpRatio = target.maxHp > 0 ? target.hp / target.maxHp : 0;
      const crit = rng.chance(state.getCritChance(hpRatio));
      if (crit) damage = state.applyCrit(damage);
      hits.push(this.strike(state, target, factory, damage, "phantom", allPinatas, undefined, crit));
    }
  }

  /** Player stick hit: first-hit bonus, then crit. */
  private stickStrike(
    state: GameState,
    target: PinataEntity,
    factory: PinataFactory,
    baseDamage: number,
    source: "swing" | "double",
    allPinatas: PinataEntity[],
  ): HitEvent {
    let damage = baseDamage;
    if (target.playerHits === 0) damage += state.getFirstHitBonus();
    damage += state.getSwitchDamageBonus(target.typeId);
    damage += state.getTantrumBonus();
    damage += state.getSecondWindBoostBonus();
    damage += state.getLowStaminaDamageBonus();
    if (state.consumeRoundFirstHitMultiplier()) damage *= FIRST_HIT_MULTIPLIER;
    state.stickHits += 1;
    const hpRatio = target.maxHp > 0 ? target.hp / target.maxHp : 0;
    damage += state.getLowHpDamageBonus(hpRatio);
    let crit = rng.chance(state.getCritChance(hpRatio));
    if (!crit && state.tryLuckyCrit() && rng.chance(LUCKY_CRIT.chance)) crit = true;
    if (crit) damage = state.applyCrit(damage);
    target.playerHits += 1;
    const hit = this.strike(state, target, factory, damage, source, allPinatas, undefined, crit);
    if (target.alive && state.hasUpgrade("ignite") && rng.chance(state.getIgniteChance())) {
      this.applyIgnite(state, target);
      hit.ignited = true;
    }
    this.tryLuckySeven(state, target, hit);
    this.tryRage(state);
    return hit;
  }

  private tryRage(state: GameState): void {
    if (!state.hasUpgrade("rageMode")) return;
    if (state.stickHits % RAGE_MODE.everyNthHit !== 0) return;
    if (!rng.chance(state.getRageChance())) return;
    state.activateRage();
    this.rageTriggered = true;
    this.cooldown = Math.min(this.cooldown, 1 / state.getSwingRate());
  }

  private applyIgnite(state: GameState, target: PinataEntity): void {
    target.burnRemaining = state.getIgniteDuration();
    if (target.burnTickTimer <= 0) target.burnTickTimer = IGNITE.tickIntervalSec;
  }

  tickBurns(
    state: GameState,
    pinatas: PinataEntity[],
    factory: PinataFactory,
    dt: number,
  ): HitEvent[] {
    const hits: HitEvent[] = [];
    const damage = state.getIgniteDamage();
    for (const p of pinatas) {
      if (!p.alive || p.burnRemaining <= 0) continue;
      p.burnRemaining -= dt;
      p.burnTickTimer -= dt;
      while (p.alive && p.burnTickTimer <= 0) {
        p.burnTickTimer += IGNITE.tickIntervalSec;
        hits.push(this.strike(state, p, factory, damage, "ignite", pinatas));
        if (p.burnRemaining <= 0) break;
      }
      if (!p.alive || p.burnRemaining <= 0) {
        p.burnRemaining = 0;
        p.burnTickTimer = 0;
      }
    }
    this.applyPinataShockwaves(state, factory, pinatas, hits);
    return hits;
  }

  /** Every 10s: chance to drop lightning on random living piñatas. */
  tryDivineRay(
    state: GameState,
    allPinatas: PinataEntity[],
    factory: PinataFactory,
  ): HitEvent[] {
    if (state.phase !== "roundActive") return [];
    if (!state.hasUpgrade("divineRay") || !rng.chance(state.getDivineRayChance())) return [];
    const candidates = allPinatas.filter((p) => p.alive);
    if (candidates.length === 0) return [];
    const strikes = Math.min(state.getDivineRayStrikes(), candidates.length);
    const damage = state.getDivineRayDamage();
    const radius = state.getDivineRayRadius();
    const hits: HitEvent[] = [];
    const struck = new Set<number>();
    for (let i = 0; i < strikes; i++) {
      const idx = rng.int(0, candidates.length - 1);
      const target = candidates.splice(idx, 1)[0]!;
      struck.add(target.id);
      hits.push(this.strike(state, target, factory, damage, "lightning", allPinatas));
    }
    if (radius > 0) {
      const radius2 = radius * radius;
      const origins = hits.map((h) => getPinataHitWorld(h.pinata).clone());
      for (const origin of origins) {
        for (const p of allPinatas) {
          if (!p.alive || struck.has(p.id)) continue;
          if (getPinataHitWorld(p).distanceToSquared(origin) > radius2) continue;
          struck.add(p.id);
          hits.push(this.strike(state, p, factory, damage, "lightning", allPinatas));
        }
      }
    }
    this.applyPinataShockwaves(state, factory, allPinatas, hits);
    return hits;
  }

  fireLastStand(
    state: GameState,
    allPinatas: PinataEntity[],
    factory: PinataFactory,
  ): HitEvent[] {
    if (!state.hasUpgrade("lastStand")) return [];
    const damage = state.getLastStandDamage();
    const hits: HitEvent[] = [];
    for (const p of allPinatas) {
      if (!p.alive) continue;
      hits.push(this.strike(state, p, factory, damage, "lastStand", allPinatas));
    }
    this.applyPinataShockwaves(state, factory, allPinatas, hits);
    return hits;
  }

  /** Destroyed piñatas may pulse a nearby shockwave; cascades if those also break. */
  private applyPinataShockwaves(
    state: GameState,
    factory: PinataFactory,
    allPinatas: PinataEntity[],
    hits: HitEvent[],
  ): void {
    if (!state.hasUpgrade("pinataShockwave")) return;
    const radius = state.getPinataShockwaveRadius();
    const radius2 = radius * radius;
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i]!;
      if (!hit.broke || !rng.chance(state.getPinataShockwaveChance())) continue;
      const origin = hit.pinata;
      const originPos = getPinataHitWorld(origin).clone();
      const damage = state.getPinataShockwaveDamage();
      for (const p of allPinatas) {
        if (!p.alive) continue;
        if (getPinataHitWorld(p).distanceToSquared(originPos) > radius2) continue;
        hits.push(this.strike(state, p, factory, damage, "shockwave", allPinatas, origin));
      }
    }
  }

  private strike(
    state: GameState,
    target: PinataEntity,
    factory: PinataFactory,
    damage: number,
    source: HitSource,
    allPinatas: PinataEntity[],
    chainFrom?: PinataEntity,
    crit = false,
  ): HitEvent {
    let dealt = damage;
    let oneSmash = false;
    if (rng.chance(state.getOneSmashChance())) {
      dealt = Math.max(dealt, target.hp);
      oneSmash = true;
    }
    const wasBurning = target.burnRemaining > 0;
    target.hp -= dealt;
    target.squash = 1;
    target.damageFlash = 1;
    target.swingVel += (rng.next() < 0.5 ? -1 : 1) * 8;
    factory.applyDamageVisual(target, dealt);

    let candy = 0;
    let broke = false;
    let staminaRestored = 0;
    let doubleLoot = false;
    let jackpot = false;
    let superJackpot = false;
    let glowingBonus = false;
    let lowStaminaBonus = false;
    let candyRainPayout = 0;
    let spreadTargets: PinataEntity[] | undefined;
    let igniteSpreadTargets: PinataEntity[] | undefined;
    const luckySeven = false;

    if (target.hp <= 0) {
      broke = true;
      target.alive = false;
      target.hp = 0;
      const intRoll = (min: number, max: number) => rng.int(min, max);
      const lowStaminaLoot = state.getLowStaminaLootBonus();
      const thief = isThiefPinata(target.typeId);
      const thiefLoot = thief ? thiefBreakLoot(target.grabbedCandy, target.thiefFull) : 0;
      if (state.hasUpgrade("superJackpot") && rng.chance(state.getSuperJackpotChance())) {
        candy = thief ? thiefLoot * SUPER_JACKPOT.lootMultiplier : rollJackpot(target.loot, intRoll) * SUPER_JACKPOT.lootMultiplier;
        superJackpot = true;
      } else if (target.glowing) {
        jackpot = true;
        candy = thief ? thiefLoot : rollJackpot(target.loot, intRoll);
        const bonusChance = state.getGlowingBonusChance();
        if (bonusChance > 0 && rng.chance(bonusChance)) {
          candy = Math.round(candy * (1 + state.getGlowingBonusExtra()));
          glowingBonus = true;
        }
      } else {
        candy = thief ? thiefLoot : rollLoot(target.loot, rng.next(), intRoll, state.getLuck(), rng.next());
      }
      if (target.extraLoot) {
        candy = Math.round(candy * (1 + state.getSpawnExtraLootBonus()));
      }
      if (target.glowing && state.hasUpgrade("glowingSpread") && rng.chance(state.getGlowingSpreadChance())) {
        spreadTargets = this.tryGlowingSpread(state, target, factory, allPinatas);
      }
      if (wasBurning && state.hasUpgrade("burningChain") && rng.chance(BURNING_CHAIN.chance)) {
        igniteSpreadTargets = this.tryBurningChain(state, target, allPinatas);
      }
      if (lowStaminaLoot > 0) {
        candy = Math.round(candy * (1 + lowStaminaLoot));
        lowStaminaBonus = true;
      }
      const doubleChance = state.getCritKillDoubleLootChance(crit);
      if (doubleChance > 0 && rng.chance(doubleChance)) {
        candy *= 2;
        doubleLoot = true;
      }
      state.recordBreak(target.typeId);
      let restoreAmount = 0;
      if (state.hasUpgrade("restoreChance") && rng.chance(RESTORE_CHANCE.chance)) {
        restoreAmount += RESTORE_CHANCE.amount;
      }
      if (state.hasUpgrade("restoreChance2") && rng.chance(RESTORE_CHANCE_2.chance)) {
        restoreAmount += RESTORE_CHANCE_2.amount;
      }
      if (state.hasUpgrade("restoreChance3") && rng.chance(RESTORE_CHANCE_3.chance)) {
        restoreAmount += RESTORE_CHANCE_3.amount;
      }
      if (restoreAmount > 0) staminaRestored = state.addStamina(restoreAmount);
    }

    if (candy > 0) candy = state.addCandy(candy, target.typeId);
    if (broke && state.hasUpgrade("candyRain")) {
      candyRainPayout = state.bankCandyRain(candy);
    }

    return {
      pinata: target,
      damage: dealt,
      broke,
      candy,
      screenX: target.screen.x,
      screenY: target.screen.y,
      source,
      chainFrom,
      staminaRestored,
      doubleLoot,
      jackpot,
      superJackpot,
      glowingBonus,
      lowStaminaBonus,
      crit,
      ignited: false,
      candyRainPayout,
      spreadTargets,
      igniteSpreadTargets,
      luckySeven,
      oneSmash,
    };
  }

  /** Make the nearest living non-glowing piñatas glow. */
  private tryGlowingSpread(
    state: GameState,
    origin: PinataEntity,
    factory: PinataFactory,
    allPinatas: PinataEntity[],
  ): PinataEntity[] | undefined {
    const originPos = getPinataHitWorld(origin).clone();
    const nearby = allPinatas
      .filter((p) => p.alive && !p.glowing)
      .map((p) => ({ p, d2: getPinataHitWorld(p).distanceToSquared(originPos) }))
      .sort((a, b) => a.d2 - b.d2)
      .slice(0, state.getGlowingSpreadTargets());
    if (nearby.length === 0) return undefined;
    const picks: PinataEntity[] = [];
    for (const { p } of nearby) {
      factory.applyGlow(p);
      picks.push(p);
    }
    return picks;
  }

  private tryBurningChain(
    state: GameState,
    origin: PinataEntity,
    allPinatas: PinataEntity[],
  ): PinataEntity[] | undefined {
    const originPos = getPinataHitWorld(origin).clone();
    const radius2 = BURNING_CHAIN.radius * BURNING_CHAIN.radius;
    const picks: PinataEntity[] = [];
    for (const p of allPinatas) {
      if (!p.alive || p.burnRemaining > 0) continue;
      if (getPinataHitWorld(p).distanceToSquared(originPos) > radius2) continue;
      this.applyIgnite(state, p);
      picks.push(p);
    }
    return picks.length > 0 ? picks : undefined;
  }

  private tryLuckySeven(state: GameState, target: PinataEntity, hit: HitEvent): void {
    if (!state.hasUpgrade("luckySeven")) return;
    if (isThiefPinata(target.typeId) || target.loot.length === 0) return;
    state.luckySevenHits += 1;
    if (state.luckySevenHits % LUCKY_SEVEN.everyNthHit !== 0) return;
    if (!rng.chance(LUCKY_SEVEN.chance)) return;
    const bonus = state.getLuckySevenLootBonus();
    if (bonus <= 0) return;
    const intRoll = (min: number, max: number) => rng.int(min, max);
    const shaken = Math.max(
      1,
      Math.round(rollLoot(target.loot, rng.next(), intRoll, state.getLuck(), rng.next()) * bonus),
    );
    hit.candy += state.addCandy(shaken, target.typeId);
    hit.luckySeven = true;
  }

  private tryRockRain(
    state: GameState,
    originPinata: PinataEntity,
    factory: PinataFactory,
    allPinatas: PinataEntity[],
    hits: HitEvent[],
  ): void {
    if (!state.hasUpgrade("rockRain") || state.isRockRainBlocked()) return;
    if (!rng.chance(state.getRockRainChance())) return;
    const origin = getPinataHitWorld(originPinata).clone();
    const damage = state.getRockRainDamage();
    const rocks = state.getRockRainRocks();
    const radius = state.getRockRainRadius();
    const hitR2 = radius * radius;
    for (let i = 0; i < rocks; i++) {
      const ang = (i / rocks) * Math.PI * 2 + rng.range(-0.1, 0.1);
      const dist = ROCK_RAIN.spread * rng.range(0.28, 1);
      const x = origin.x + Math.cos(ang) * dist;
      const y = origin.y + Math.sin(ang) * dist;
      const z = origin.z;
      for (const p of allPinatas) {
        if (!p.alive) continue;
        const pos = getPinataHitWorld(p);
        const dx = pos.x - x;
        const dy = pos.y - y;
        const dz = pos.z - z;
        if (dx * dx + dy * dy + dz * dz > hitR2) continue;
        const hit = this.strike(state, p, factory, damage, "rock", allPinatas, originPinata);
        hit.rockOrigin = { x, y, z };
        hits.push(hit);
      }
    }
  }

  get comboActive(): boolean {
    return this.comboTimer > 0;
  }
}
