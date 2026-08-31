import {
  BASE,
  CRIT_KILL_DOUBLE_LOOT,
  CANDY_RAIN,
  FIESTA_ORDERS,
  LOW_HP_CRITS,
  LUCKY_CRIT,
  ORDERS_UNLOCK_UPGRADES,
  TANTRUM,
  UPGRADES,
  breakRespawnChanceFor,
  candyRainLootRateFor,
  comboBonusFor,
  collateralBonusFor,
  COMBO_SAVER,
  COMBO_SPEED_BONUS,
  crowdDamageBonusFor,
  critChanceFor,
  critDamageMultFor,
  doubleLootChanceFor,
  drainRateFor,
  divineRayChanceFor,
  divineRayDamageFor,
  divineRayRadiusFor,
  divineRayStrikesFor,
  glowingBonusChanceFor,
  glowingBonusExtraFor,
  glowingSpawnChanceFor,
  glowingSpreadChanceFor,
  glowingSpreadTargetsFor,
  emptyUpgrades,
  firstHitBonusFor,
  switchDamageBonusFor,
  hitRadiusFor,
  igniteChanceFor,
  igniteDamageFor,
  igniteDurationFor,
  lastStandDamageFor,
  lightningChanceFor,
  lightningDamageFor,
  lightningRaysFor,
  lightningTargetsFor,
  lootMultiplierFor,
  lowHpDamageBonusFor,
  lowStaminaDamageBonusFor,
  lowStaminaLootBonusFor,
  lowStaminaSpeedBonusFor,
  luckySevenLootBonusFor,
  luckFor,
  maxStaminaFor,
  phantomChanceFor,
  phantomDamageFor,
  phantomTargetsFor,
  oneSmashChanceFor,
  pinataShockwaveChanceFor,
  pinataShockwaveDamageFor,
  pinataShockwaveRadiusFor,
  powerFor,
  rageChanceFor,
  rageDurationFor,
  rageSpeedBonusFor,
  ROCK_RAIN,
  SECOND_WIND_BOOST,
  secondWindBoostDamageFor,
  secondWindRestoreFor,
  shockwaveChanceFor,
  shockwaveDamageFor,
  spawnExtraLootChanceFor,
  spawnExtraLootBonusFor,
  startingPinataCountFor,
  stackingDamageFor,
  rockRainChanceFor,
  rockRainDamageFor,
  rockRainRadiusFor,
  rockRainRocksFor,
  superJackpotChanceFor,
  swingRateFor,
  tantrumDamageFor,
  tantrumDurationFor,
  type UpgradeId,
  type UpgradeLevels,
} from "./balance";
import {
  emptyCandyPieces,
  mergeCandyPieces,
  splitCandyValue,
  type CandyPieceCounts,
} from "./candyTypes";
import type { PinataTypeId } from "./pinataTypes";
import {
  pinataLevelFromBreaks,
  pinataLevelLootMultiplier,
  pinataLevelRows,
  type PinataLevelRow,
} from "./pinataLevels";
import {
  captureUnlockCandy,
  initialCandyAtUnlock,
  getUnlockProgress,
  newlyReachedUnlocks,
  reachedUnlockIds,
  unlockedDefinedPinataTypes,
  unlockedPinataTypeCount as countUnlockedPinataTypes,
  type PinataUnlockDef,
  type UnlockProgress,
  type UnlockRunStats,
} from "./unlocks";
import {
  DEFAULT_STICK_ID,
  getEquippedStick,
  loadStickShopSave,
  saveStickShopSave,
  stickById,
  syncEquippedStick,
  type StickDef,
  type StickId,
} from "./sticks";

export type Phase = "boot" | "warmup" | "roundActive" | "roundEnd" | "betweenRounds" | "runSummary";

export type BreaksByType = Partial<Record<PinataTypeId | string, number>>;

export interface RoundStats {
  candyEarned: number;
  candyPieces: CandyPieceCounts;
  breaks: number;
  breaksByType: BreaksByType;
  /** Connecting swings (landed on ≥1 piñata); used for accuracy */
  hits: number;
  swings: number;
  /** Perfect-accuracy candy granted at round end (0 if not 100%). */
  accuracyBonus: number;
}

function emptyRoundStats(): RoundStats {
  return {
    candyEarned: 0,
    candyPieces: emptyCandyPieces(),
    breaks: 0,
    breaksByType: {},
    hits: 0,
    swings: 0,
    accuracyBonus: 0,
  };
}

/** Debug: skip candy spend on upgrades; listed prices stay unchanged. */
const DEBUG_FREE_UPGRADES = false;
/** Debug: force this many pinatas at the start of rounds 1–2. 0 = normal starting count. */
const DEBUG_ROUND_PINATAS = 0;

function cloneRoundStats(stats: RoundStats): RoundStats {
  return {
    candyEarned: stats.candyEarned,
    candyPieces: { ...stats.candyPieces },
    breaks: stats.breaks,
    breaksByType: { ...stats.breaksByType },
    hits: stats.hits,
    swings: stats.swings,
    accuracyBonus: stats.accuracyBonus,
  };
}

export class GameState {
  phase: Phase = "boot";
  round = 1;
  candy = 0;
  roundCandy = 0;
  /** Index into FIESTA_ORDERS — independent of round so early rounds can skip orders. */
  orderIndex = 0;
  orderContributed = 0;
  /** Smash rounds remaining until the current order is due (0 = due now). */
  orderDueInRounds = 0;
  /** Sticky: once the first order is assigned, the order track stays on for the run. */
  ordersAssigned = false;
  /** Show the newly assigned scheduled order after the next upgrade screen. */
  pendingOrderReveal = false;
  /** After paying an order, wait one smash round before presenting the next. */
  nextOrderAwaitingRound = false;
  /** True after the last Fiesta payment is paid — unlocks the finale upgrade tree. */
  finalOrderPaid = false;
  upgrades: UpgradeLevels = emptyUpgrades();
  stamina = BASE.maxStamina;
  maxStamina = BASE.maxStamina;
  combo = 0;
  /** True after the first player-stick hit this round (First Hit Multiplier). */
  roundFirstHitUsed = false;
  bestBreakRate = 0;
  totalBreaks = 0;
  /** Lifetime (this run) breaks per piñata type — drives type levels. */
  totalBreaksByType: BreaksByType = {};
  totalCandyEarned = 0;
  /** Lifetime candy when each ladder type unlocked. */
  candyAtUnlock: (number | null)[] = initialCandyAtUnlock();
  /**
   * Types allowed to spawn this round. Frozen at round start so a candy goal
   * reached mid-round only appears on the following round.
   */
  spawnPinataTypes: PinataTypeId[] = ["basic"];
  /** Ladder ids already unlocked when the current round began. */
  roundStartUnlockedIds: string[] = ["basic"];
  /** Types that crossed their goal during the round just ended. */
  newlyUnlockedThisRound: PinataUnlockDef[] = [];
  totalHits = 0;
  totalSwings = 0;
  /** Connecting stick strikes this run (swing / double). Used by Fiesta Frenzy. */
  stickHits = 0;
  /** Stick hits counted toward Lucky Swing. */
  luckySevenHits = 0;
  /** Streak Saver already used since the last connecting hit. */
  comboSaverUsed = false;
  /** Bright Start still waiting to glow the first spawn of this run. */
  brightStartPending = false;
  /** Catch Breath already consumed this run. */
  secondWindUsed = false;
  /** Seconds remaining where Shard Rain cannot trigger (Candy Rain storm + after). */
  rockRainBlockedRemaining = 0;
  /** Type of the last stick-hit piñata this round. Used by Type Switch. */
  lastStickHitType: string | null = null;
  /** Seconds of Fiesta Frenzy remaining. */
  rageRemaining = 0;
  /** Consecutive missed swings. Used by Blindfold Fury. */
  consecutiveMisses = 0;
  /** Seconds of Blindfold Fury remaining. */
  tantrumRemaining = 0;
  /** Seconds of Catch Breath Boost II remaining. */
  secondWindBoostRemaining = 0;
  /** Extra loot banked by Candy Rain until the cloud bursts. */
  candyRainBank = 0;
  /** Stamina drained this run (restores do not subtract). Used by Winded Speed / Winded Damage. */
  staminaUsedThisRun = 0;
  /** Destroyed piñatas counted toward the next Candy Rain burst. */
  candyRainBreaks = 0;
  roundStats: RoundStats = emptyRoundStats();
  history: RoundStats[] = [];
  shopCandy = 0;
  ownedStickIds: StickId[] = [DEFAULT_STICK_ID];
  equippedStickId: StickId = DEFAULT_STICK_ID;

  constructor() {
    this.restoreShop();
  }

  resetRun(): void {
    this.phase = "boot";
    this.round = 1;
    this.candy = 0;
    this.roundCandy = 0;
    this.orderIndex = 0;
    this.orderContributed = 0;
    this.orderDueInRounds = 0;
    this.ordersAssigned = false;
    this.pendingOrderReveal = false;
    this.nextOrderAwaitingRound = false;
    this.finalOrderPaid = false;
    this.upgrades = emptyUpgrades();
    this.maxStamina = this.getMaxStamina();
    this.stamina = this.maxStamina;
    this.combo = 0;
    this.roundFirstHitUsed = false;
    this.bestBreakRate = 0;
    this.totalBreaks = 0;
    this.totalBreaksByType = {};
    this.totalCandyEarned = 0;
    this.candyAtUnlock = initialCandyAtUnlock();
    this.refreshSpawnPinataTypes();
    this.roundStartUnlockedIds = reachedUnlockIds(this.unlockStats());
    this.newlyUnlockedThisRound = [];
    this.totalHits = 0;
    this.totalSwings = 0;
    this.stickHits = 0;
    this.luckySevenHits = 0;
    this.comboSaverUsed = false;
    this.brightStartPending = false;
    this.secondWindUsed = false;
    this.rockRainBlockedRemaining = 0;
    this.lastStickHitType = null;
    this.rageRemaining = 0;
    this.consecutiveMisses = 0;
    this.tantrumRemaining = 0;
    this.secondWindBoostRemaining = 0;
    this.candyRainBank = 0;
    this.staminaUsedThisRun = 0;
    this.candyRainBreaks = 0;
    this.roundStats = emptyRoundStats();
    this.history = [];
  }

  accuracy(stats: RoundStats = this.roundStats): number {
    if (stats.swings <= 0) return 0;
    return Math.min(1, stats.hits / stats.swings);
  }

  /** True only when every swing connected (matches a displayed 100%). */
  isPerfectAccuracy(stats: RoundStats = this.roundStats): boolean {
    return stats.swings > 0 && stats.hits >= stats.swings;
  }

  /** Percent for UI — 100 only when actually perfect (no rounding up from 99.5%). */
  accuracyPercent(stats: RoundStats = this.roundStats): number {
    if (this.isPerfectAccuracy(stats)) return 100;
    return Math.floor(this.accuracy(stats) * 100);
  }

  unlockStats(): UnlockRunStats {
    return {
      totalBreaks: this.totalBreaks,
      totalCandyEarned: this.totalCandyEarned,
      candyAtUnlock: this.candyAtUnlock,
    };
  }

  unlockProgress(): UnlockProgress {
    return getUnlockProgress(this.unlockStats());
  }

  unlockedPinataTypeCount(): number {
    return countUnlockedPinataTypes(this.unlockStats());
  }

  getPower(): number {
    return powerFor(this.upgrades, this.unlockedPinataTypeCount(), this.totalBreaks);
  }

  /** Extra damage added when a swing connects with 2+ piñatas. */
  getCollateralBonus(): number {
    if (!this.hasUpgrade("collateralDamage")) return 0;
    return collateralBonusFor(this.getPower());
  }

  /** 0–1 chance for a swing or Ghost Stick hit to crit. Pass HP ratio for Cracked Crits. */
  getCritChance(hpRatio?: number): number {
    let chance = critChanceFor(this.upgrades);
    if (
      this.hasUpgrade("lowHpCrits") &&
      hpRatio != null &&
      hpRatio < LOW_HP_CRITS.hpThreshold
    ) {
      chance += LOW_HP_CRITS.chance;
    }
    return chance;
  }

  getCritDamageMult(): number {
    return critDamageMultFor(this.upgrades);
  }

  applyCrit(damage: number): number {
    return Math.max(1, Math.round(damage * this.getCritDamageMult()));
  }

  tryLuckyCrit(): boolean {
    if (!this.hasUpgrade("luckyCrit")) return false;
    if (this.stickHits % LUCKY_CRIT.everyNthHit !== 0) return false;
    return true;
  }

  getLowHpDamageBonus(hpRatio: number): number {
    return lowHpDamageBonusFor(this.getPower(), hpRatio, this.upgrades);
  }

  getOneSmashChance(): number {
    return oneSmashChanceFor(this.upgrades);
  }

  getRockRainChance(): number {
    return rockRainChanceFor(this.upgrades);
  }

  getCritKillDoubleLootChance(crit: boolean): number {
    const chance = this.getDoubleLootChance();
    if (crit && this.hasUpgrade("moreCritDamage4")) {
      return Math.max(chance, CRIT_KILL_DOUBLE_LOOT);
    }
    return chance;
  }

  /** Extra damage on the first player-stick hit against a piñata. */
  getFirstHitBonus(): number {
    return firstHitBonusFor(this.getPower(), this.upgrades);
  }

  /** Consume the round's first stick hit; true when First Hit Multiplier should 2x this strike. */
  consumeRoundFirstHitMultiplier(): boolean {
    if (this.roundFirstHitUsed) return false;
    this.roundFirstHitUsed = true;
    return this.hasUpgrade("firstHitMultiplier");
  }

  /**
   * Extra stick damage when this hit's type differs from the previous stick target.
   * Always records `typeId` as the new last target.
   */
  getSwitchDamageBonus(typeId: string): number {
    const last = this.lastStickHitType;
    this.lastStickHitType = typeId;
    if (!this.hasUpgrade("switchDamage")) return 0;
    if (last == null || last === typeId) return 0;
    return switchDamageBonusFor(this.getPower());
  }

  /** Extra stick damage from combo stacks (every 10 hits). */
  getComboBonus(): number {
    if (!this.hasUpgrade("combo")) return 0;
    return comboBonusFor(this.getPower(), this.combo, this.upgrades);
  }

  /** Extra stick damage while stamina is below 15% (Empty-Arm Damage). */
  getLowStaminaDamageBonus(): number {
    return lowStaminaDamageBonusFor(this.getPower(), this.upgrades, this.stamina, this.maxStamina);
  }

  /** Extra stick damage from stamina used this run (Winded Damage). */
  getStackingDamageBonus(): number {
    if (!this.hasUpgrade("stackingDamage")) return 0;
    return stackingDamageFor(this.getPower(), this.staminaUsedThisRun);
  }

  /** Extra stick damage per living piñata on screen (Packed Party). */
  getCrowdDamageBonus(pinataCount: number): number {
    return crowdDamageBonusFor(this.getPower(), pinataCount, this.upgrades);
  }

  getPhantomDamage(): number {
    return phantomDamageFor(this.getPower(), this.upgrades);
  }

  getPhantomChance(): number {
    return phantomChanceFor(this.upgrades);
  }

  getPhantomTargets(): number {
    return phantomTargetsFor(this.upgrades);
  }

  /** True when every AND-prerequisite is owned, and at least one OR-prerequisite if listed. */
  isUpgradeUnlocked(id: UpgradeId): boolean {
    const def = UPGRADES.find((u) => u.id === id)!;
    if (def.requiresFinalPayment && !this.finalOrderPaid) return false;
    if (def.requiresAny?.length && !def.requiresAny.some((req) => this.upgrades[req] >= 1)) {
      return false;
    }
    if (!def.requires?.length) return true;
    return def.requires.every((req) => this.upgrades[req] >= 1);
  }

  hasUpgrade(id: UpgradeId): boolean {
    return this.upgrades[id] >= 1;
  }

  getSwingRate(): number {
    const rate = swingRateFor(this.upgrades, this.staminaUsedThisRun);
    const lowSpeed = lowStaminaSpeedBonusFor(this.upgrades, this.stamina, this.maxStamina);
    const baseRate = getEquippedStick().attackSpeed;
    let withLow = lowSpeed > 0 ? rate + baseRate * lowSpeed : rate;
    if (
      this.hasUpgrade("comboSpeedBonus") &&
      this.combo >= COMBO_SPEED_BONUS.combo
    ) {
      withLow += baseRate * COMBO_SPEED_BONUS.speedBonus;
    }
    if (this.secondWindBoostRemaining > 0) {
      withLow += baseRate * SECOND_WIND_BOOST.speedBonus;
    }
    if (this.rageRemaining > 0) return withLow * (1 + rageSpeedBonusFor(this.upgrades));
    return withLow;
  }

  isRageActive(): boolean {
    return this.rageRemaining > 0;
  }

  tickRage(dt: number): void {
    this.rageRemaining = Math.max(0, this.rageRemaining - dt);
  }

  activateRage(): void {
    this.rageRemaining = rageDurationFor(this.upgrades);
  }

  getRageChance(): number {
    return rageChanceFor(this.upgrades);
  }

  isTantrumActive(): boolean {
    return this.tantrumRemaining > 0;
  }

  tickTantrum(dt: number): void {
    this.tantrumRemaining = Math.max(0, this.tantrumRemaining - dt);
  }

  activateTantrum(): void {
    this.tantrumRemaining = tantrumDurationFor(this.upgrades);
  }

  tickSecondWindBoost(dt: number): void {
    this.secondWindBoostRemaining = Math.max(0, this.secondWindBoostRemaining - dt);
  }

  /** Extra stick damage while Catch Breath Boost II is active. */
  getSecondWindBoostBonus(): number {
    if (this.secondWindBoostRemaining <= 0) return 0;
    return secondWindBoostDamageFor(this.getPower());
  }

  /** Extra stick damage while Blindfold Fury is active. */
  getTantrumBonus(): number {
    if (this.tantrumRemaining <= 0) return 0;
    return tantrumDamageFor(this.getPower());
  }

  /** Count a missed swing. Returns true when Blindfold Fury triggers. */
  noteMiss(): boolean {
    if (!this.hasUpgrade("tantrum")) return false;
    this.consecutiveMisses += 1;
    if (this.consecutiveMisses < TANTRUM.missesRequired) return false;
    this.consecutiveMisses = 0;
    this.activateTantrum();
    return true;
  }

  /** Connecting swing resets the Blindfold Fury miss streak. */
  noteConnect(): void {
    this.consecutiveMisses = 0;
    this.comboSaverUsed = false;
  }

  /** True when Streak Saver absorbs this miss. */
  tryComboSaver(): boolean {
    if (!this.hasUpgrade("comboSaver") || this.comboSaverUsed) return false;
    if (this.maxStamina <= 0) return false;
    if (this.stamina / this.maxStamina >= COMBO_SAVER.staminaThreshold) return false;
    this.comboSaverUsed = true;
    return true;
  }

  getIgniteDamage(): number {
    return igniteDamageFor(this.getPower(), this.upgrades);
  }

  getIgniteChance(): number {
    return igniteChanceFor(this.upgrades);
  }

  getIgniteDuration(): number {
    return igniteDurationFor(this.upgrades);
  }

  getLightningChance(): number {
    return lightningChanceFor(this.upgrades);
  }

  getLightningTargets(): number {
    return lightningTargetsFor(this.upgrades);
  }

  getLightningRays(): number {
    return lightningRaysFor(this.upgrades);
  }

  /** Sky Spark damage: 25% of current base damage, plus Sky Spark Damage. */
  getLightningDamage(): number {
    return lightningDamageFor(this.getPower(), this.upgrades);
  }

  getDivineRayDamage(): number {
    return divineRayDamageFor(this.getPower(), this.upgrades);
  }

  getDivineRayChance(): number {
    return divineRayChanceFor(this.upgrades);
  }

  getDivineRayStrikes(): number {
    return divineRayStrikesFor(this.upgrades);
  }

  getDivineRayRadius(): number {
    return divineRayRadiusFor(this.upgrades);
  }

  getPinataShockwaveDamage(): number {
    return pinataShockwaveDamageFor(this.getPower(), this.upgrades);
  }

  getPinataShockwaveChance(): number {
    return pinataShockwaveChanceFor(this.upgrades);
  }

  getPinataShockwaveRadius(): number {
    return pinataShockwaveRadiusFor(this.upgrades);
  }

  getRockRainDamage(): number {
    return rockRainDamageFor(this.getPower(), this.upgrades);
  }

  getRockRainRocks(): number {
    return rockRainRocksFor(this.upgrades);
  }

  getRockRainRadius(): number {
    return rockRainRadiusFor(this.upgrades);
  }

  getLastStandDamage(): number {
    return lastStandDamageFor(this.getPower(), this.upgrades);
  }

  getLuckySevenLootBonus(): number {
    return luckySevenLootBonusFor(this.upgrades);
  }

  getSuperJackpotChance(): number {
    return superJackpotChanceFor(this.upgrades);
  }

  isRockRainBlocked(): boolean {
    return this.rockRainBlockedRemaining > 0;
  }

  tickRockRainBlock(dt: number): void {
    this.rockRainBlockedRemaining = Math.max(0, this.rockRainBlockedRemaining - dt);
  }

  beginCandyRainStorm(): void {
    this.rockRainBlockedRemaining = ROCK_RAIN.stormSec + ROCK_RAIN.afterStormSec;
  }

  consumeBrightStart(): boolean {
    if (!this.brightStartPending || !this.hasUpgrade("brightStart")) return false;
    this.brightStartPending = false;
    return true;
  }

  trySecondWind(): boolean {
    if (!this.hasUpgrade("secondWind") || this.secondWindUsed) return false;
    this.secondWindUsed = true;
    if (this.hasUpgrade("secondWindBoost2")) {
      this.secondWindBoostRemaining = SECOND_WIND_BOOST.durationSec;
    }
    const restore = this.maxStamina * secondWindRestoreFor(this.upgrades);
    return this.addStamina(restore) > 0;
  }

  getBreakRespawnChance(): number {
    return breakRespawnChanceFor(this.upgrades);
  }

  getShockwaveChance(): number {
    return shockwaveChanceFor(this.upgrades);
  }

  getShockwaveDamage(): number {
    return shockwaveDamageFor(this.getPower(), this.upgrades);
  }

  /** Absolute aim / hit scalar (BASE.hitRadius × upgrade multiplier). */
  getHitRadius(): number {
    return hitRadiusFor(this.upgrades);
  }

  getMaxStamina(): number {
    return maxStaminaFor(this.upgrades);
  }

  /** Concurrent pinatas at round start / after a full wipe refill. */
  getStartingPinataCount(): number {
    if (DEBUG_ROUND_PINATAS > 0 && this.round <= 2) return DEBUG_ROUND_PINATAS;
    return startingPinataCountFor(this.upgrades);
  }

  /** Round length in seconds at the current stamina pool and drain. */
  getRoundDuration(): number {
    return this.getMaxStamina() / this.getDrainRate();
  }

  /** Base drain so +stamina extends the round; Steady Stick / Firmer Grip lower this rate. */
  getDrainRate(): number {
    return drainRateFor(this.upgrades, this.staminaUsedThisRun);
  }

  /** Restore stamina up to the current max. Returns the amount actually gained. */
  addStamina(amount: number): number {
    const before = this.stamina;
    this.stamina = Math.min(this.maxStamina, Math.max(0, this.stamina + amount));
    return this.stamina - before;
  }

  /** Multiplier applied to candy from every source. */
  getCandyMultiplier(): number {
    return lootMultiplierFor(this.upgrades, this.unlockedPinataTypeCount(), this.totalBreaks);
  }

  getPinataTypeLevel(typeId: string): number {
    return pinataLevelFromBreaks(this.totalBreaksByType[typeId] ?? 0).level;
  }

  /** Extra yield for breaks of this type from its ranks above 1. */
  getPinataTypeLootMultiplier(typeId: string): number {
    return pinataLevelLootMultiplier(this.getPinataTypeLevel(typeId));
  }

  /** Extra destroy-loot rate while stamina is below 10% (0 if inactive). */
  getLowStaminaLootBonus(): number {
    return lowStaminaLootBonusFor(this.upgrades, this.stamina, this.maxStamina);
  }

  /** 0–1 luck. Chance to bump a loot roll up one tier. */
  getLuck(): number {
    return luckFor(this.upgrades);
  }

  /** 0–1 chance for a destroyed piñata to drop double loot. */
  getDoubleLootChance(): number {
    return doubleLootChanceFor(this.upgrades);
  }

  /** 0–1 chance for a spawned piñata to be glowing. */
  getGlowingSpawnChance(): number {
    return glowingSpawnChanceFor(this.upgrades);
  }

  getGlowingSpreadChance(): number {
    return glowingSpreadChanceFor(this.upgrades);
  }

  getGlowingSpreadTargets(): number {
    return glowingSpreadTargetsFor(this.upgrades);
  }

  /** 0–1 chance for a spawned piñata to pay extra loot. */
  getSpawnExtraLootChance(): number {
    return spawnExtraLootChanceFor(this.upgrades);
  }

  /** Extra loot multiplier when a piñata spawned with Extra Loot. */
  getSpawnExtraLootBonus(): number {
    return spawnExtraLootBonusFor(this.upgrades);
  }

  /** 0–1 chance for a destroyed glowing piñata to pay extra loot. */
  getGlowingBonusChance(): number {
    return glowingBonusChanceFor(this.upgrades);
  }

  /** Extra jackpot payout when Glowing Bonus procs (0.5 = +50%). */
  getGlowingBonusExtra(): number {
    return glowingBonusExtraFor(this.upgrades);
  }

  candyRainProgress(): number {
    return this.candyRainBreaks / CANDY_RAIN.burstAfterBreaks;
  }

  candyRainBankedDisplay(): number {
    return Math.floor(this.candyRainBank);
  }

  /**
   * Bank extra loot from a break. When the cloud is full, pays out and returns
   * the candy granted (already in the round total).
   */
  bankCandyRain(loot: number): number {
    this.candyRainBank += Math.max(0, loot) * candyRainLootRateFor(this.upgrades);
    this.candyRainBreaks += 1;
    if (this.candyRainBreaks < CANDY_RAIN.burstAfterBreaks) return 0;
    const payout = Math.max(1, Math.round(this.candyRainBank));
    this.candyRainBank = 0;
    this.candyRainBreaks = 0;
    return this.grantCandy(payout);
  }

  /** Total upgrade levels purchased this run. */
  totalUpgradeLevels(): number {
    return (Object.values(this.upgrades) as number[]).reduce((sum, n) => sum + n, 0);
  }

  /** Enough upgrades to be eligible for the order track. */
  ordersUnlocked(): boolean {
    return this.totalUpgradeLevels() >= ORDERS_UNLOCK_UPGRADES;
  }

  /** Whether an order is currently assigned to the player. */
  hasAssignedOrder(): boolean {
    return this.ordersAssigned;
  }

  /**
   * First payment appears once 2+ upgrades are owned and the bank has 20 candy.
   * If the player is short, keep playing until they can cover it.
   */
  isFirstOrderReadyToPresent(): boolean {
    return !this.ordersAssigned && this.ordersUnlocked() && this.candy >= this.getOrder().target;
  }

  /**
   * Assign the first order only when it is ready to present. Later orders
   * stay assigned for the run.
   */
  tryAssignOrders(): boolean {
    if (this.ordersAssigned) return true;
    if (!this.isFirstOrderReadyToPresent()) return false;
    this.ordersAssigned = true;
    this.orderDueInRounds = this.getOrder().dueInRounds;
    return true;
  }

  /** Continue appears on Round Complete starting after round 2. */
  hasContinueOnRoundEnd(): boolean {
    return this.round >= 2;
  }

  /**
   * After the first Fiesta payment is paid, Round Complete offers
   * Upgrades / Next Order / Continue.
   */
  hasPaidFirstOrder(): boolean {
    return this.orderIndex > 0 || this.finalOrderPaid;
  }

  hasRoundEndHub(): boolean {
    return this.hasPaidFirstOrder();
  }

  /** True when the current order should show on the in-round HUD. */
  isCurrentOrderVisible(): boolean {
    return this.hasAssignedOrder() && !this.nextOrderAwaitingRound && !this.finalOrderPaid;
  }

  /** True after the last Fiesta payment is paid. */
  hasPaidFinalOrder(): boolean {
    return this.finalOrderPaid;
  }

  isFirstOrder(): boolean {
    return this.orderIndex === 0;
  }

  /** True when the current order must be paid before continuing. */
  isOrderDue(): boolean {
    return this.hasAssignedOrder() && this.orderDueInRounds <= 0;
  }

  /** Due now and still unpaid — player must fill it or lose. */
  isUnpaidDueOrder(): boolean {
    return this.isOrderDue() && !this.orderFulfilled();
  }

  /** Scheduled orders use a future due date (e.g. 45 candy in 5 rounds). */
  isScheduledOrder(): boolean {
    return this.getOrder().dueInRounds > 0;
  }

  tickOrderDue(): void {
    if (this.orderDueInRounds > 0) this.orderDueInRounds -= 1;
  }

  orderDueText(): string {
    if (this.orderDueInRounds <= 0) return "DUE DATE: NOW!";
    if (this.orderDueInRounds === 1) return "DUE IN 1 ROUND";
    return `DUE IN ${this.orderDueInRounds} ROUNDS`;
  }

  canFillOrder(): boolean {
    return this.candy >= this.orderRemaining();
  }

  getOrder() {
    return FIESTA_ORDERS[Math.max(0, Math.min(FIESTA_ORDERS.length - 1, this.orderIndex))]!;
  }

  orderProgress(): number {
    const order = this.getOrder();
    return Math.min(1, this.orderContributed / order.target);
  }

  orderFulfilled(): boolean {
    return this.orderContributed >= this.getOrder().target;
  }

  orderRemaining(): number {
    return Math.max(0, this.getOrder().target - this.orderContributed);
  }

  upgradeCost(id: UpgradeId): number | null {
    const def = UPGRADES.find((u) => u.id === id)!;
    const lvl = this.upgrades[id];
    if (lvl >= def.maxLevel) return null;
    return def.costs[lvl] ?? null;
  }

  canBuy(id: UpgradeId): boolean {
    if (!this.isUpgradeUnlocked(id)) return false;
    const cost = this.upgradeCost(id);
    if (cost === null) return false;
    return DEBUG_FREE_UPGRADES || this.candy >= cost;
  }

  buyUpgrade(id: UpgradeId): boolean {
    if (!this.isUpgradeUnlocked(id)) return false;
    const cost = this.upgradeCost(id);
    if (cost === null) return false;
    if (!DEBUG_FREE_UPGRADES) {
      if (this.candy < cost) return false;
      this.candy -= cost;
    }
    this.upgrades[id] += 1;
    if (id === "brightStart") this.brightStartPending = true;
    return true;
  }

  getEquippedStick(): StickDef {
    return stickById(this.equippedStickId);
  }

  ownsStick(id: StickId): boolean {
    return this.ownedStickIds.includes(id);
  }

  canBuyStick(id: StickId): boolean {
    if (this.ownsStick(id)) return false;
    const cost = stickById(id).cost;
    return DEBUG_FREE_UPGRADES || this.shopCandy >= cost;
  }

  buyStick(id: StickId): boolean {
    if (!this.canBuyStick(id)) return false;
    const cost = stickById(id).cost;
    if (!DEBUG_FREE_UPGRADES) this.shopCandy -= cost;
    if (!this.ownedStickIds.includes(id)) this.ownedStickIds.push(id);
    this.equippedStickId = id;
    syncEquippedStick(id);
    this.persistShop();
    return true;
  }

  equipStick(id: StickId): boolean {
    if (!this.ownsStick(id)) return false;
    this.equippedStickId = id;
    syncEquippedStick(id);
    this.persistShop();
    return true;
  }

  /** Move leftover run candy into the persistent shop bank. */
  bankRunCandy(): void {
    if (this.candy <= 0) return;
    this.shopCandy += this.candy;
    this.candy = 0;
    this.persistShop();
  }

  private restoreShop(): void {
    const save = loadStickShopSave();
    this.shopCandy = save.candy;
    this.ownedStickIds = save.owned;
    this.equippedStickId = save.equipped;
    syncEquippedStick(this.equippedStickId);
  }

  private persistShop(): void {
    saveStickShopSave({
      candy: this.shopCandy,
      owned: this.ownedStickIds,
      equipped: this.equippedStickId,
    });
  }

  contributeToOrder(amount: number): number {
    const remaining = this.orderRemaining();
    const spent = Math.min(amount, remaining, this.candy);
    this.candy -= spent;
    this.orderContributed += spent;
    return spent;
  }

  contributeAllToOrder(): number {
    return this.contributeToOrder(this.candy);
  }

  private refreshSpawnPinataTypes(): void {
    this.spawnPinataTypes = unlockedDefinedPinataTypes(this.unlockStats());
  }

  beginRound(): void {
    this.roundStartUnlockedIds = reachedUnlockIds(this.unlockStats());
    this.refreshSpawnPinataTypes();
    this.newlyUnlockedThisRound = [];
    this.phase = "warmup";
    this.roundCandy = 0;
    this.combo = 0;
    this.roundFirstHitUsed = false;
    this.lastStickHitType = null;
    this.maxStamina = this.getMaxStamina();
    this.stamina = this.maxStamina;
    this.rageRemaining = 0;
    this.consecutiveMisses = 0;
    this.tantrumRemaining = 0;
    this.secondWindBoostRemaining = 0;
    this.rockRainBlockedRemaining = 0;
    this.roundStats = emptyRoundStats();
  }

  /** Warmup intro finished — stamina drain and swings begin. */
  beginPlay(): void {
    if (this.phase !== "warmup") return;
    this.phase = "roundActive";
  }

  /** Grant candy with no loot multiplier. Returns amount added. */
  grantCandy(amount: number): number {
    const n = Math.max(0, Math.floor(amount));
    if (n <= 0) return 0;
    const pieces = splitCandyValue(n);
    this.roundCandy += n;
    this.roundStats.candyEarned += n;
    this.totalCandyEarned += n;
    mergeCandyPieces(this.roundStats.candyPieces, pieces);
    this.syncUnlockBaselines();
    return n;
  }

  /** Grant candy after applying the candy-yield multiplier. Returns amount added. */
  addCandy(amount: number, typeId?: string): number {
    const typeMult = typeId ? this.getPinataTypeLootMultiplier(typeId) : 1;
    return this.grantCandy(amount * this.getCandyMultiplier() * typeMult);
  }

  recordBreak(typeId: string): void {
    this.roundStats.breaks += 1;
    this.totalBreaks += 1;
    this.roundStats.breaksByType[typeId] = (this.roundStats.breaksByType[typeId] ?? 0) + 1;
    this.totalBreaksByType[typeId] = (this.totalBreaksByType[typeId] ?? 0) + 1;
    this.syncUnlockBaselines();
  }

  /** All types with rank progress; locked types are included. */
  pinataLevels(): PinataLevelRow[] {
    return pinataLevelRows(this.unlockStats(), this.totalBreaksByType, this.roundStats.breaksByType);
  }

  /** Snapshot candy totals when a ladder type first unlocks. */
  private syncUnlockBaselines(): void {
    captureUnlockCandy(this.candyAtUnlock, this.totalCandyEarned, this.totalBreaks);
  }

  endRound(): void {
    if (this.phase === "roundEnd" || this.phase === "runSummary") return;

    if (this.hasAssignedOrder() && this.orderDueInRounds > 0 && !this.nextOrderAwaitingRound) {
      this.tickOrderDue();
    }

    if (this.isPerfectAccuracy()) {
      // 10% of smash loot; at least 1 candy when anything was earned.
      const raw = this.roundStats.candyEarned * BASE.accuracyPerfectBonusRate;
      const bonus =
        this.roundStats.candyEarned > 0 ? Math.max(1, Math.round(raw)) : 0;
      if (bonus > 0) {
        this.roundStats.accuracyBonus = bonus;
        this.roundCandy += bonus;
        this.totalCandyEarned += bonus;
        this.syncUnlockBaselines();
      }
    }
    // Bank smash loot (+ perfect-aim bonus) when the round-complete UI appears.
    this.candy += this.roundCandy;
    this.roundCandy = 0;
    this.history.push(cloneRoundStats(this.roundStats));
    this.bestBreakRate = Math.max(this.bestBreakRate, this.accuracy());
    this.newlyUnlockedThisRound = newlyReachedUnlocks(
      this.unlockStats(),
      this.roundStartUnlockedIds,
    );
    this.phase = "roundEnd";
  }

  goBetweenRounds(): void {
    this.phase = "betweenRounds";
  }

  /**
   * Move to the next Fiesta Order without starting the next smash round.
   * Completing the final order unlocks the finale upgrade tree and keeps the run going.
   */
  advanceOrder(): boolean {
    if (!this.hasAssignedOrder() || !this.orderFulfilled()) return false;
    if (this.finalOrderPaid) return false;
    if (this.orderIndex >= FIESTA_ORDERS.length - 1) {
      this.finalOrderPaid = true;
      this.pendingOrderReveal = false;
      this.nextOrderAwaitingRound = false;
      return true;
    }
    const fromFirst = this.orderIndex === 0;
    this.orderIndex += 1;
    this.orderContributed = 0;
    this.orderDueInRounds = this.getOrder().dueInRounds;
    if (fromFirst) {
      this.pendingOrderReveal = true;
      this.nextOrderAwaitingRound = false;
    } else {
      this.pendingOrderReveal = false;
      this.nextOrderAwaitingRound = true;
    }
    return true;
  }

  /**
   * Advance after fulfilling the current order (orders must be unlocked).
   * Completing the final order unlocks the finale upgrades instead of ending the run.
   */
  tryAdvanceRound(): boolean {
    if (!this.advanceOrder()) return false;
    this.round += 1;
    this.pendingOrderReveal = false;
    return true;
  }

  /** Advance to the next smash round while orders are still locked. */
  advanceWithoutOrder(): void {
    this.round += 1;
  }

  /** End the run without fulfilling the current order (skip Fiesta Prep). */
  endRunEarly(): void {
    this.phase = "runSummary";
  }
}
