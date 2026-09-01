import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GameState } from "./GameState";
import { getRoundConfig } from "./rounds";
import { PINATA_TYPES, THIEF, isThiefPinata } from "./pinataTypes";
import { pickSpawnPinataType, type PinataUnlockDef } from "./unlocks";
import { CameraRig } from "../world/CameraRig";
import { Arena, PLAY_Z, WALL_Z } from "../world/Arena";
import { localPointFromClient } from "../deviceFrame";
import {
  PinataFactory,
  PINATA_DEPTH_WORLD,
  PINATA_HIT_RADIUS_WORLD,
  getPinataHitWorld,
  type PinataEntity,
} from "../world/PinataFactory";
import { Weapon } from "../world/Weapon";
import { Targeting } from "../systems/Targeting";
import { Combat, type HitEvent } from "../systems/Combat";
import { Stamina } from "../systems/Stamina";
import { PinataMovement } from "../systems/PinataMovement";
import { CandyBurst } from "../systems/CandyBurst";
import { LightningFx } from "../systems/LightningFx";
import { GhostStickFx } from "../systems/GhostStickFx";
import { FireFx } from "../systems/FireFx";
import { AudioManager } from "../audio/AudioManager";
import { RoundHud } from "../ui/RoundHud";
import { Reticle } from "../ui/Reticle";
import { RoundEndOverlay } from "../ui/RoundEndOverlay";
import { UnlockPopup } from "../ui/UnlockPopup";
import { UpgradeScreen } from "../ui/UpgradeScreen";
import { OrderScreen } from "../ui/OrderScreen";
import { SummaryScreen } from "../ui/SummaryScreen";
import { LoseScreen } from "../ui/LoseScreen";
import { TicketShopScreen } from "../ui/TicketShopScreen";
import { BootScreen, spawnCandyFloatText, spawnFloatText } from "../ui/BootScreen";
import { ShopScreen } from "../ui/ShopScreen";
import { SettingsScreen } from "../ui/SettingsScreen";
import { CandyBalance } from "../ui/CandyBalance";
import { rng } from "../util/rng";
import { formatNumber } from "../util/math";
import type { UpgradeId } from "./balance";
import type { StickId } from "./sticks";
import {
  DIVINE_RAY,
  LOW_STAMINA_BONUS,
  formatPercent,
  timedSpawnIntervalFor,
} from "./balance";

/** Sequential pinata intro before combat. Spawn gap = this / starting count. */
const ROUND_WARMUP_SEC = 3;
/** After GO disappears, wait this long before the arena brightens and swings start. */
const ROUND_GO_HOLD_SEC = 0.5;
/** Drop-in height so warmup spawns read as hanging from the beam. */
const WARMUP_DROP_Y = 1.85;
/** Consider another pinata "nearby" for depth packing within this XY radius. */
const SPAWN_Z_NEAR_XY = 2.6;

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cameraRig: CameraRig;
  private arena = new Arena();
  private factory = new PinataFactory();
  private weapon = new Weapon();
  private targeting = new Targeting();
  private combat = new Combat();
  private staminaSys = new Stamina();
  private movement = new PinataMovement();
  private candyBurst = new CandyBurst();
  private lightningFx = new LightningFx();
  private ghostStickFx = new GhostStickFx();
  private fireFx = new FireFx();
  private audio = new AudioManager();
  private state = new GameState();

  private pinatas: PinataEntity[] = [];
  private pinataRoot = new THREE.Group();

  private hud: RoundHud;
  private candyBalance: CandyBalance;
  private reticle: Reticle;
  private roundEnd: RoundEndOverlay;
  private unlockPopup: UnlockPopup;
  private upgrades: UpgradeScreen;
  private orderPrep: OrderScreen;
  private summary: SummaryScreen;
  private lose: LoseScreen;
  private ticketShop: TicketShopScreen;
  private boot: BootScreen;
  private shop: ShopScreen;
  private settings: SettingsScreen;
  private uiRoot: HTMLElement;
  private canvas: HTMLCanvasElement;
  private assetsReady: Promise<void>;

  private width = 1;
  private height = 1;
  private pointer = { x: 0.5, y: 0.5 };
  private lastTime = 0;
  private endingRound = false;
  /** Delay before the next singleton pinata after the opening wave is gone. */
  private respawnTimer = 0;
  /** Countdown to the next Timed Spawn pinata. */
  private timedSpawnTimer = 0;
  /** Countdown to the next Fiesta Bolt roll. */
  private divineRayTimer = 0;
  /** Seconds left in the pre-round pinata intro. */
  private warmupRemaining = 0;
  /** Opening-wave pinatas still waiting to appear. */
  private warmupSpawnsLeft = 0;
  /** Gap between warmup spawns (ROUND_WARMUP_SEC / count). */
  private warmupSpawnInterval = 0;
  /** Time until the next warmup spawn. */
  private warmupSpawnTimer = 0;
  private warmupMotionStyle: 0 | 1 | 2 = 0;
  /** Last 3 / 2 / 1 beat shown during warmup (0 = none). */
  private warmupCountdownBeat = 0;
  /** Seconds left after GO vanishes before combat and the bright arena. */
  private goHoldRemaining = 0;
  /** GO is on screen; hold starts when its animation ends. */
  private goAwaitingEnd = false;

  constructor(
    canvas: HTMLCanvasElement,
    uiRoot: HTMLElement,
    reticleEl: HTMLElement,
  ) {
    this.uiRoot = uiRoot;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      stencil: true,
    });
    this.renderer.autoClearStencil = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.localClippingEnabled = true;

    this.width = Math.max(1, canvas.clientWidth);
    this.height = Math.max(1, canvas.clientHeight);
    this.pointer = { x: this.width * 0.5, y: this.height * 0.5 };
    this.cameraRig = new CameraRig(this.width / this.height);
    this.renderer.setSize(this.width, this.height, false);
    this.syncPlayBounds();

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.background = new THREE.Color(0xe07830);
    this.scene.fog = null;

    this.scene.add(this.arena.group);
    this.scene.add(this.pinataRoot);
    this.scene.add(this.weapon.group);
    this.scene.add(this.candyBurst.group);
    this.scene.add(this.lightningFx.group);
    this.scene.add(this.ghostStickFx.group);
    this.scene.add(this.fireFx.group);
    this.scene.add(this.cameraRig.perspective);
    this.scene.add(this.cameraRig.orthographic);

    const hemi = new THREE.HemisphereLight(0xfff0dd, 0xc4a574, 0.9);
    this.scene.add(hemi);
    // Key light matches the painting: warm sun from the upper-left, so
    // pinata shadows fall down and slightly right like the baked arch shade.
    const sun = new THREE.DirectionalLight(0xffe8c4, 1.15);
    sun.position.set(-7, 12.5, 15);
    sun.target.position.set(0, 6.2, -2.8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    sun.shadow.camera.near = 4;
    sun.shadow.camera.far = 44;
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -8;
    sun.shadow.camera.updateProjectionMatrix();
    this.scene.add(sun);
    this.scene.add(sun.target);
    const fill = new THREE.DirectionalLight(0xffd0a8, 0.32);
    fill.position.set(7, 5, 8);
    this.scene.add(fill);

    this.hud = new RoundHud(uiRoot);
    this.hud.onGoEnded = () => {
      if (!this.goAwaitingEnd) return;
      this.goAwaitingEnd = false;
      this.goHoldRemaining = ROUND_GO_HOLD_SEC;
    };
    this.candyBalance = new CandyBalance(uiRoot);
    this.candyBalance.sync(this.state);
    this.reticle = new Reticle(reticleEl);
    this.reticle.move(this.pointer.x, this.pointer.y);
    this.roundEnd = new RoundEndOverlay(uiRoot);
    this.unlockPopup = new UnlockPopup(uiRoot);
    this.upgrades = new UpgradeScreen(uiRoot);
    this.orderPrep = new OrderScreen(uiRoot);
    this.summary = new SummaryScreen(uiRoot);
    this.lose = new LoseScreen(uiRoot);
    this.ticketShop = new TicketShopScreen(uiRoot);
    this.boot = new BootScreen(uiRoot);
    this.shop = new ShopScreen(uiRoot);
    this.settings = new SettingsScreen(uiRoot);

    this.bindInput();
    requestAnimationFrame(() => this.onResize());

    this.assetsReady = Promise.all([
      this.factory.load(this.renderer),
      this.arena.load(this.cameraRig.perspective),
      this.weapon.load(this.renderer),
      this.ghostStickFx.load(this.renderer),
    ]).then(() => {
      this.syncWeaponStick();
    });

    this.showBootScreen();

    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);

    (window as unknown as { __pinataHitDebug?: () => unknown }).__pinataHitDebug = () => {
      return this.pinatas.filter((p) => p.alive).map((p) => {
        return {
          screen: [p.screen.x, p.screen.y],
          hitMeshTimer: p.hitMeshTimer,
          hitVisible: p.hitVisual.visible,
          idleVisible: p.idleVisual.visible,
        };
      });
    };
  }

  private bindInput(): void {
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("pointermove", (e) => {
      const pt = localPointFromClient(this.canvas, e.clientX, e.clientY);
      this.pointer.x = pt.x;
      this.pointer.y = pt.y;
      this.targeting.setCursor(pt.x, pt.y, this.width, this.height);
      this.reticle.move(pt.x, pt.y);
      const ndcX = (pt.x / this.width) * 2 - 1;
      const ndcY = -((pt.y / this.height) * 2 - 1);
      this.weapon.setAimFromScreen(ndcX, ndcY);
    });
    // Unlock audio on first gesture anywhere
    const unlock = () => {
      void this.audio.unlock();
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
  }

  private onResize(): void {
    this.width = Math.max(1, this.canvas.clientWidth);
    this.height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(this.width, this.height, false);
    this.cameraRig.applyAspect(this.width / this.height);
    this.arena.syncBackdrop(this.cameraRig.perspective);
    this.syncPlayBounds();
  }

  /** Keep spawn/travel inside the portrait camera frame. */
  private syncPlayBounds(): void {
    // Hang-point NDC: below the energy card, down toward the terracotta tiles.
    // Bodies hang down from this point, so minY is inset extra from the floor.
    const box = this.cameraRig.playBoundsAtZ(PLAY_Z, {
      minX: -0.84,
      maxX: 0.84,
      minY: -0.74,
      maxY: 0.58,
    });
    this.movement.boundMinX = box.minX;
    this.movement.boundMaxX = box.maxX;
    this.movement.boundMinY = box.minY;
    this.movement.boundMaxY = box.maxY;
    const spanX = Math.max(0.4, box.maxX - box.minX);
    const spanY = Math.max(0.4, box.maxY - box.minY);
    this.movement.travelRangeX = spanX * 0.18;
    this.movement.travelRangeY = spanY * 0.32;
  }

  private clearPinatas(): void {
    for (const p of this.pinatas) this.factory.dispose(p);
    this.pinatas = [];
  }

  private pruneDeadPinatas(): void {
    const kept: PinataEntity[] = [];
    for (const p of this.pinatas) {
      if (p.alive) kept.push(p);
      else this.factory.dispose(p);
    }
    this.pinatas = kept;
  }

  /** Home position inside play bounds, away from living pinatas. */
  private pickHome(): THREE.Vector3 {
    const { boundMinX, boundMaxX, boundMinY, boundMaxY } = this.movement;
    // Oscillation is clamped, so homes can sit near the play edges.
    const spanX = boundMaxX - boundMinX;
    const spanY = boundMaxY - boundMinY;
    const marginX = Math.min(0.45, spanX * 0.14);
    const marginY = Math.min(0.28, spanY * 0.06);
    const minX = boundMinX + marginX;
    const maxX = boundMaxX - marginX;
    const minY = boundMinY + marginY;
    const maxY = boundMaxY - marginY;
    const minSep = Math.min(1.35, Math.max(0.95, Math.min(spanX, spanY) * 0.48));
    const minSep2 = minSep * minSep;
    const { minZSep } = this.spawnZRange();

    let x = rng.range(minX, maxX) * 0.85;
    let y = rng.range(minY, maxY);
    let z = this.pickSpawnZ(x, y);
    for (let attempt = 0; attempt < 36; attempt++) {
      const cx = rng.range(minX, maxX);
      const cy = rng.range(minY, maxY);
      const cz = this.pickSpawnZ(cx, cy);
      const clear = this.pinatas.every((p) => {
        if (!p.alive) return true;
        const dx = p.home.x - cx;
        const dy = p.home.y - cy;
        if (dx * dx + dy * dy >= minSep2) return true;
        return Math.abs(p.home.z - cz) >= minZSep;
      });
      if (clear) {
        x = cx;
        y = cy;
        z = cz;
        break;
      }
    }

    return new THREE.Vector3(x, y, z);
  }

  /** Hang-depth slab in front of the wall, thick enough to stack full meshes. */
  private spawnZRange(): { zMin: number; zMax: number; minZSep: number } {
    const depth = Math.max(0.35, PINATA_DEPTH_WORLD);
    const zMin = WALL_Z + depth * 0.5 + 0.12;
    const zMax = PLAY_Z + Math.max(0.55, PLAY_Z - zMin);
    return { zMin, zMax, minZSep: depth * 0.92 };
  }

  /**
   * Hang depth in the play slab. Nearby pinatas take the emptiest depth slot
   * so overlapping bodies don't occupy the same Z.
   */
  private pickSpawnZ(x: number, y: number): number {
    const { zMin, zMax, minZSep } = this.spawnZRange();
    const span = Math.max(0.2, zMax - zMin);
    const slotCount = Math.max(2, Math.floor(span / minZSep) + 1);
    const slots: number[] = [];
    for (let i = 0; i < slotCount; i++) {
      slots.push(zMin + (i / Math.max(1, slotCount - 1)) * span);
    }

    const near2 = SPAWN_Z_NEAR_XY * SPAWN_Z_NEAR_XY;
    const nearbyZ: number[] = [];
    for (const p of this.pinatas) {
      if (!p.alive) continue;
      const dx = p.home.x - x;
      const dy = p.home.y - y;
      if (dx * dx + dy * dy < near2) nearbyZ.push(p.home.z);
    }

    let bestI = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < slots.length; i++) {
      const z = slots[i];
      let minDist = span;
      let occupants = 0;
      for (const oz of nearbyZ) {
        const d = Math.abs(oz - z);
        minDist = Math.min(minDist, d);
        if (d < minZSep * 0.5) occupants += 1;
      }
      const score = -occupants * 10 + minDist;
      if (score > bestScore) {
        bestScore = score;
        bestI = i;
      }
    }
    return slots[bestI];
  }

  private spawnOne(motionStyle: 0 | 1 | 2, intro = false): void {
    const pinataTypeId = pickSpawnPinataType(this.state.spawnPinataTypes, rng.next());
    const type = PINATA_TYPES[pinataTypeId];
    const home = this.pickHome();
    const glowingChance = this.state.getGlowingSpawnChance();
    const glowing =
      this.state.consumeBrightStart() || (glowingChance > 0 && rng.chance(glowingChance));
    const ent = this.factory.create(home, type, motionStyle, 1, glowing);
    const extraLootChance = this.state.getSpawnExtraLootChance();
    ent.extraLoot = extraLootChance > 0 && rng.chance(extraLootChance);
    if (intro) {
      ent.dropY = WARMUP_DROP_Y;
      ent.dropVelY = 0;
      ent.group.position.y = home.y + WARMUP_DROP_Y;
      ent.swingVel = rng.range(-2.8, 2.8);
    }
    this.pinataRoot.add(ent.group);
    this.pinatas.push(ent);
    if (intro) this.cameraRig.addImpulse(0.04);
  }

  private spawnWarmupPinata(): void {
    if (this.warmupSpawnsLeft <= 0) return;
    this.spawnOne(this.warmupMotionStyle, true);
    this.warmupSpawnsLeft -= 1;
    this.warmupSpawnTimer += this.warmupSpawnInterval;
  }

  private beginWarmup(): void {
    const cfg = getRoundConfig(this.state.round);
    const count = Math.max(0, this.state.getStartingPinataCount());
    this.warmupMotionStyle = cfg.motionStyle;
    this.warmupRemaining = ROUND_WARMUP_SEC;
    this.warmupSpawnsLeft = count;
    this.warmupSpawnInterval = count > 0 ? ROUND_WARMUP_SEC / count : ROUND_WARMUP_SEC;
    this.warmupSpawnTimer = 0;
    this.warmupCountdownBeat = 0;
    this.goHoldRemaining = 0;
    this.goAwaitingEnd = false;
    this.hud.beginCountdown();
    this.spawnWarmupPinata();
    this.syncWarmupCountdown();
  }

  private syncWarmupCountdown(): void {
    const elapsed = ROUND_WARMUP_SEC - this.warmupRemaining;
    const beat = Math.max(1, 3 - Math.floor(elapsed + 1e-4));
    if (beat === this.warmupCountdownBeat) return;
    this.warmupCountdownBeat = beat;
    this.hud.showCountdownBeat(String(beat));
    this.audio.countdown("count");
    this.cameraRig.addImpulse(0.07);
  }

  private tickWarmup(dt: number): void {
    if (this.goHoldRemaining > 0) {
      this.goHoldRemaining -= dt;
      if (this.goHoldRemaining <= 0) this.beginPlayFromCountdown();
      return;
    }
    if (this.goAwaitingEnd) return;
    this.warmupSpawnTimer -= dt;
    while (this.warmupSpawnsLeft > 0 && this.warmupSpawnTimer <= 0) {
      this.spawnWarmupPinata();
    }
    this.warmupRemaining -= dt;
    if (this.warmupRemaining > 0) {
      this.syncWarmupCountdown();
      return;
    }
    while (this.warmupSpawnsLeft > 0) this.spawnWarmupPinata();
    this.warmupRemaining = 0;
    this.goAwaitingEnd = true;
    this.hud.showCountdownBeat("GO", "go");
    this.audio.countdown("go");
    this.cameraRig.addImpulse(0.1);
  }

  private beginPlayFromCountdown(): void {
    this.goHoldRemaining = 0;
    this.combat.cooldown = 0;
    this.state.beginPlay();
  }

  private startRound(): void {
    this.endingRound = false;
    this.respawnTimer = 0.25;
    this.timedSpawnTimer = timedSpawnIntervalFor(this.state.upgrades);
    this.divineRayTimer = DIVINE_RAY.intervalSec;
    this.clearPinatas();
    this.state.beginRound();
    this.hud.show();
    this.candyBalance.hide();
    this.syncCandyUi();
    this.reticle.move(this.pointer.x, this.pointer.y);
    this.syncReticleSize(this.state.getHitRadius());
    this.reticle.setLocked(false);
    this.reticle.show();
    this.beginWarmup();
    this.roundEnd.hide();
    this.unlockPopup.hide();
    this.upgrades.hide();
    this.orderPrep.hide();
    this.summary.hide();
    this.lose.hide();
    this.ticketShop.hide();
    this.shop.hide();
    this.settings.hide();
  }

  private finishRound(): void {
    if (this.endingRound) return;
    this.endingRound = true;
    // Brief beat then tally
    window.setTimeout(() => {
      this.state.endRound();
      this.hud.hide();
      this.reticle.hide();
      this.showRoundEnd();
    }, 650);
  }

  private showRoundEnd(): void {
    this.upgrades.hide();
    this.orderPrep.hide();
    const newly = this.state.newlyUnlockedThisRound;
    if (newly.length > 0) {
      this.candyBalance.hide();
      this.showUnlockQueue(newly, () => this.presentRoundEnd());
      return;
    }
    this.presentRoundEnd();
  }

  private showUnlockQueue(queue: PinataUnlockDef[], then: () => void): void {
    const [first, ...rest] = queue;
    if (!first) {
      then();
      return;
    }
    this.unlockPopup.show(first, () => {
      this.audio.ui();
      this.showUnlockQueue(rest, then);
    });
  }

  private presentRoundEnd(): void {
    this.unlockPopup.hide();
    this.syncCandyUi();
    const firstOrderReady =
      this.state.isFirstOrderReadyToPresent() && this.state.tryAssignOrders();
    if (!firstOrderReady) this.candyBalance.show();
    this.roundEnd.show(this.state, {
      onUpgrades: () => this.afterRoundEnd(),
      onOrders: () => {
        this.roundEnd.hide();
        this.openOrderScreen();
      },
      onContinue: () => this.openDueOrderOrContinue(),
    });
    if (firstOrderReady) this.openOrderScreen({ keepRoundEnd: true });
  }

  private afterRoundEnd(): void {
    this.roundEnd.hide();
    this.orderPrep.hide();
    this.openUpgradeScreen();
  }

  private openUpgradeScreen(): void {
    this.roundEnd.hide();
    this.orderPrep.hide();
    this.syncCandyUi();
    this.candyBalance.show();
    this.upgrades.show(this.state, {
      onBuy: (id: UpgradeId) => {
        if (this.state.buyUpgrade(id)) {
          this.audio.ui();
          this.syncCandyUi();
        }
      },
      onBack: () => {
        this.state.goBetweenRounds();
        this.leaveUpgrades();
      },
    });
  }

  /** After upgrades: play on, or collect a payment that is already due. */
  private leaveUpgrades(): void {
    this.candyBalance.hide();
    if (this.state.isUnpaidDueOrder()) {
      this.openOrderScreen();
      return;
    }
    this.continueToNextRound();
  }

  private openDueOrderOrContinue(): void {
    this.roundEnd.hide();
    if (this.state.isUnpaidDueOrder()) {
      this.openOrderScreen();
      return;
    }
    this.continueToNextRound();
  }

  private continueToNextRound(): void {
    this.roundEnd.hide();
    this.upgrades.hide();
    this.orderPrep.hide();
    this.candyBalance.hide();
    this.state.advanceWithoutOrder();
    this.startRound();
  }

  private openOrderScreen(opts?: { keepRoundEnd?: boolean }): void {
    this.candyBalance.show();
    this.syncCandyUi();
    if (!opts?.keepRoundEnd) this.roundEnd.hide();
    this.state.nextOrderAwaitingRound = false;
    this.orderPrep.show(
      this.state,
      {
        onFillOrder: () => {
          const first = this.state.isFirstOrder();
          const needed = this.state.orderRemaining();
          if (this.state.contributeToOrder(needed) <= 0 || !this.state.orderFulfilled()) return;
          this.audio.ui();
          this.syncCandyUi();
          if (first) {
            if (!this.state.advanceOrder()) return;
            this.openUpgradeScreen();
            return;
          }
          this.afterPayingOrder();
        },
        onContribute: (all: boolean) => {
          const amount = all ? this.state.candy : Math.floor(this.state.candy / 2);
          if (this.state.contributeToOrder(amount) > 0) {
            this.audio.ui();
            this.syncCandyUi();
          }
        },
        onStart: () => {
          this.afterPayingOrder();
        },
        onSkip: () => {
          this.audio.ui();
          if (this.state.isUnpaidDueOrder()) {
            this.showLose();
            return;
          }
          this.state.endRunEarly();
          this.candyBalance.hide();
          this.summary.show(this.state, () => this.restart());
        },
        onContinue: () => {
          this.audio.ui();
          if (this.state.isUnpaidDueOrder()) {
            this.showLose();
            return;
          }
          this.continueToNextRound();
        },
      },
      { popup: !!opts?.keepRoundEnd },
    );
  }

  private afterPayingOrder(): void {
    if (this.state.hasPaidFinalOrder()) {
      this.openUpgradeScreen();
      return;
    }
    if (!this.state.advanceOrder()) return;
    if (this.state.hasPaidFinalOrder()) {
      this.openUpgradeScreen();
      return;
    }
    this.continueToNextRound();
  }

  private showLose(): void {
    this.roundEnd.hide();
    this.unlockPopup.hide();
    this.upgrades.hide();
    this.orderPrep.hide();
    this.hud.hide();
    this.reticle.hide();
    this.candyBalance.hide();
    this.summary.hide();
    this.state.endRunEarly();
    this.state.persistTickets();
    this.lose.show(this.state, () => {
      this.audio.ui();
      this.openTicketShop();
    });
  }

  private openTicketShop(): void {
    this.lose.hide();
    this.candyBalance.show();
    this.candyBalance.sync(this.state, "tickets");
    this.ticketShop.show(this.state, {
      onBuy: (id) => {
        if (!this.state.buyTicketUpgrade(id)) return;
        this.audio.ui();
        this.candyBalance.sync(this.state, "tickets");
        this.ticketShop.refresh();
      },
      onContinue: () => {
        this.audio.ui();
        this.restart();
      },
    });
  }

  private restart(): void {
    this.state.bankRunCandy();
    this.state.resetRun();
    this.clearPinatas();
    this.candyBalance.hide();
    this.roundEnd.hide();
    this.unlockPopup.hide();
    this.upgrades.hide();
    this.orderPrep.hide();
    this.summary.hide();
    this.lose.hide();
    this.ticketShop.hide();
    this.shop.hide();
    this.hud.hide();
    this.reticle.hide();
    this.settings.hide();
    this.showBootScreen();
  }

  private showBootScreen(): void {
    this.shop.hide();
    this.ticketShop.hide();
    this.settings.hide();
    this.candyBalance.hide();
    this.boot.show(
      () => {
        void (async () => {
          await this.assetsReady;
          void this.audio.unlock();
          this.startRound();
        })();
      },
      () => this.openShop(),
      () => this.openSettings(),
    );
  }

  private openSettings(): void {
    void this.audio.unlock();
    this.boot.setBehindSettings(true);
    this.settings.show(this.audio, () => {
      this.boot.setBehindSettings(false);
    });
  }

  private openShop(): void {
    this.settings.hide();
    this.boot.hide();
    this.candyBalance.show();
    this.candyBalance.sync(this.state, "shop");
    this.shop.show(this.state, {
      onBack: () => this.showBootScreen(),
      onBuy: (id: StickId) => {
        if (!this.state.buyStick(id)) return;
        this.syncWeaponStick();
        this.candyBalance.sync(this.state, "shop");
        this.shop.refresh();
      },
      onEquip: (id: StickId) => {
        if (!this.state.equipStick(id)) return;
        this.syncWeaponStick();
        this.shop.refresh();
      },
    });
  }

  private syncWeaponStick(): void {
    this.weapon.setHue(this.state.getEquippedStick().hue);
  }

  private syncCandyUi(): void {
    this.hud.sync(this.state);
    this.candyBalance.sync(this.state);
  }

  private tickThieves(dt: number): void {
    for (const p of this.pinatas) {
      if (!p.alive || !isThiefPinata(p.typeId) || p.thiefFull) continue;
      p.fillTimer += dt;
      if (p.fillTimer >= THIEF.fillDurationSec) {
        p.thiefFull = true;
      }
    }
  }

  private presentLootText(hit: HitEvent): void {
    if (hit.candy > 0) {
      const candyColor = hit.superJackpot
        ? "#ffb703"
        : hit.jackpot
          ? "#ffe566"
          : hit.doubleLoot
            ? "#ff9f1c"
            : "#ffe600";
      spawnCandyFloatText(
        this.uiRoot,
        hit.screenX,
        hit.screenY + 10,
        hit.doubleLoot || hit.superJackpot ? `${formatNumber(hit.candy)} x2` : formatNumber(hit.candy),
        candyColor,
        1400,
      );
      if (hit.superJackpot) {
        spawnFloatText(
          this.uiRoot,
          hit.screenX,
          hit.screenY - 48,
          "FIESTA JACKPOT",
          "#ffb703",
          1100,
        );
      } else if (hit.jackpot) {
        const extraPct = Math.round(this.state.getGlowingBonusExtra() * 100);
        spawnFloatText(
          this.uiRoot,
          hit.screenX,
          hit.screenY - 48,
          hit.glowingBonus ? `JACKPOT +${extraPct}%` : "JACKPOT",
          "#ffd166",
          1100,
        );
      }
      if (hit.lowStaminaBonus) {
        spawnFloatText(
          this.uiRoot,
          hit.screenX,
          hit.screenY - (hit.jackpot || hit.superJackpot ? 72 : 48),
          `+${formatPercent(LOW_STAMINA_BONUS.lootBonus)} LOOT`,
          "#3dd68c",
          1100,
        );
      }
    }
    if (hit.spreadTargets) {
      for (const target of hit.spreadTargets) {
        spawnFloatText(
          this.uiRoot,
          target.screen.x,
          target.screen.y - 24,
          "GLOW",
          "#ffd166",
          1100,
        );
      }
    }
    if (hit.staminaRestored > 0) {
      spawnFloatText(
        this.uiRoot,
        hit.screenX,
        hit.screenY - 36,
        `+${formatNumber(hit.staminaRestored)}`,
        "#3dd68c",
      );
    }
  }

  private presentCandyRain(hit: HitEvent): void {
    const hitPos = getPinataHitWorld(hit.pinata).clone();
    this.candyBurst.rain(hitPos, 42);
    this.audio.candyRain();
    this.hud.flashCandyRain(hit.candyRainPayout);
    spawnFloatText(
      this.uiRoot,
      hit.screenX,
      hit.screenY - 72,
      `+${formatNumber(hit.candyRainPayout)}`,
      "#ff9f1c",
      1600,
      "float-text-candy",
    );
  }

  /** Project base pinata hit radius at play depth so the dotted circle matches targeting. */
  private syncReticleSize(hitRadiusScalar: number): void {
    const camera = this.cameraRig.active;
    // Typical mesh-center height (hang ~4.2, body hangs ~0.5 below)
    const center = new THREE.Vector3(0, 4.7, -2.2);
    const edge = center.clone();
    edge.x += PINATA_HIT_RADIUS_WORLD * hitRadiusScalar;
    center.project(camera);
    edge.project(camera);
    const cx = (center.x * 0.5 + 0.5) * this.width;
    const ex = (edge.x * 0.5 + 0.5) * this.width;
    const radiusPx = Math.abs(ex - cx);
    this.reticle.setSize(radiusPx * 2);
  }

  private spawnDuringRound(): void {
    const cfg = getRoundConfig(this.state.round);
    this.spawnOne(cfg.motionStyle);
  }

  private tryBreakRespawn(): void {
    const chance = this.state.getBreakRespawnChance();
    if (chance > 0 && rng.chance(chance)) this.spawnDuringRound();
  }

  private maybeRespawn(dt: number): void {
    const aliveCount = this.pinatas.reduce((n, p) => n + (p.alive ? 1 : 0), 0);
    if (aliveCount > 0) return;

    this.respawnTimer -= dt;
    if (this.respawnTimer > 0) return;

    this.pruneDeadPinatas();
    this.spawnDuringRound();
    this.respawnTimer = 0.25;
  }

  private maybeTimedSpawn(dt: number): void {
    if (!this.state.hasUpgrade("timedSpawn")) return;
    this.timedSpawnTimer -= dt;
    if (this.timedSpawnTimer > 0) return;
    this.timedSpawnTimer += timedSpawnIntervalFor(this.state.upgrades);
    this.spawnDuringRound();
  }

  private maybeDivineRay(dt: number): void {
    if (!this.state.hasUpgrade("divineRay")) return;
    this.divineRayTimer -= dt;
    if (this.divineRayTimer > 0) return;
    this.divineRayTimer += DIVINE_RAY.intervalSec;
    const hits = this.combat.tryDivineRay(this.state, this.pinatas, this.factory);
    if (hits.length === 0) return;
    this.presentHits(hits);
    this.syncCandyUi();
  }

  private presentHits(hits: HitEvent[]): void {
    let anyBroke = false;
    let anyLightning = false;
    let anyPhantom = false;
    let anyCrit = false;
    let anyIgnite = false;
    const shockwaveSeen = new Set<number>();
    const shockwaveOrigins: PinataEntity[] = [];
    for (const hit of hits) {
      this.cameraRig.addImpulse(
        hit.broke
          ? 0.22
          : hit.source === "lightning" ||
              hit.source === "shockwave" ||
              hit.source === "phantom" ||
              hit.source === "ignite"
            ? 0.08
            : hit.source === "rock" || hit.source === "lastStand"
              ? 0.08
              : 0.12,
      );
      const hitPos = getPinataHitWorld(hit.pinata).clone();
      this.candyBurst.confetti(hitPos);
      if (hit.source === "lightning") {
        anyLightning = true;
        const from = hit.chainFrom
          ? getPinataHitWorld(hit.chainFrom).clone()
          : hitPos.clone().add(new THREE.Vector3(0, 5.5, 0));
        this.lightningFx.zap(from, hitPos);
      }
      if (hit.source === "phantom") {
        anyPhantom = true;
        this.ghostStickFx.strike(hitPos);
      }
      if (hit.source === "shockwave" || hit.source === "lastStand") {
        const origin = hit.chainFrom ?? hit.pinata;
        if (!shockwaveSeen.has(origin.id)) {
          shockwaveSeen.add(origin.id);
          shockwaveOrigins.push(origin);
        }
      }
      if (hit.source === "rock" && hit.rockOrigin) {
        this.candyBurst.rock(
          new THREE.Vector3(hit.rockOrigin.x, hit.rockOrigin.y + 2.4, hit.rockOrigin.z),
          new THREE.Vector3(hit.rockOrigin.x, hit.rockOrigin.y, hit.rockOrigin.z),
        );
      }
      if (hit.crit) anyCrit = true;
      if (hit.ignited) {
        anyIgnite = true;
        spawnFloatText(this.uiRoot, hit.screenX, hit.screenY - 52, "IGNITE", "#ff7a18", 900);
      }
      const yOff =
        hit.source === "double"
          ? -28
          : hit.source === "lightning"
            ? -4
            : hit.source === "shockwave"
              ? 16
              : hit.source === "phantom"
                ? -40
                : hit.source === "ignite"
                  ? 22
                  : hit.source === "rock"
                    ? 8
                    : hit.source === "lastStand"
                      ? 18
                      : -12;
      const dmgColor = hit.crit
        ? "#ff6b4a"
        : hit.source === "lightning"
          ? "#7ee8ff"
          : hit.source === "shockwave" || hit.source === "lastStand"
            ? "#ffc14d"
            : hit.source === "phantom"
              ? "#c9e7ff"
              : hit.source === "ignite"
                ? "#ff7a18"
                : hit.source === "rock"
                  ? "#c4a574"
                  : "#fff5e6";
      spawnFloatText(this.uiRoot, hit.screenX, hit.screenY + yOff, formatNumber(hit.damage), dmgColor);
      if (hit.crit) {
        spawnFloatText(this.uiRoot, hit.screenX, hit.screenY + yOff - 22, "CRIT", "#ff6b4a", 900);
      }
      this.presentLootText(hit);
      if (hit.luckySeven) {
        spawnFloatText(this.uiRoot, hit.screenX, hit.screenY - 88, "LUCKY 7", "#3dd68c", 1100);
      }
      if (hit.oneSmash) {
        spawnFloatText(this.uiRoot, hit.screenX, hit.screenY + yOff - 22, "SMASH", "#ff6b4a", 900);
      }
      if (hit.candyRainPayout > 0) {
        this.presentCandyRain(hit);
        this.state.beginCandyRainStorm();
      }
      if (hit.igniteSpreadTargets) {
        for (const target of hit.igniteSpreadTargets) {
          spawnFloatText(
            this.uiRoot,
            target.screen.x,
            target.screen.y - 24,
            "IGNITE",
            "#ff7a18",
            900,
          );
        }
      }
      if (hit.broke) {
        anyBroke = true;
        this.candyBurst.burst(hitPos, 28, true);
        hit.pinata.group.visible = false;
        this.tryBreakRespawn();
      }
    }
    if (anyLightning) this.audio.zap();
    if (anyPhantom) this.audio.phantom();
    if (anyCrit) this.audio.crit();
    if (anyIgnite) this.audio.ignite();
    if (shockwaveOrigins.length > 0) {
      for (const origin of shockwaveOrigins) {
        this.lightningFx.shockwave(getPinataHitWorld(origin).clone());
      }
      this.audio.shockwave();
    }
    if (anyBroke) {
      this.audio.break();
      if (this.state.combo >= 3) {
        this.audio.combo();
        this.hud.flashCombo(this.state.combo);
      }
    }
  }

  private frame = (now: number): void => {
    requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    const scaledDt = this.combat.update(dt);

    const cfg = getRoundConfig(this.state.round);
    this.movement.update(this.pinatas, scaledDt, cfg.movementMultiplier);
    this.candyBurst.update(scaledDt, this.arena);
    this.lightningFx.update(scaledDt);
    this.ghostStickFx.update(scaledDt);
    this.fireFx.update(scaledDt, this.pinatas);
    this.cameraRig.update(scaledDt);

    const inArena =
      (this.state.phase === "warmup" || this.state.phase === "roundActive") && !this.endingRound;
    if (inArena) {
      this.reticle.show();
      const hitRadius = this.state.getHitRadius();
      const target = this.targeting.update(
        scaledDt,
        this.cameraRig.active,
        this.pinatas,
        hitRadius,
        this.width,
        this.height,
      );
      this.syncReticleSize(hitRadius);
      this.reticle.setLocked(!!target);
      this.weapon.setLockedTarget(target ? getPinataHitWorld(target) : null);

      if (this.state.phase === "warmup") {
        this.tickWarmup(dt);
      } else {
        this.tickThieves(scaledDt);

        const hits = this.combat.trySwing(
          this.state,
          this.targeting.inRange,
          this.pinatas,
          this.weapon,
          this.factory,
        );
        if (this.combat.tantrumTriggered) {
          this.audio.tantrum();
          this.hud.flashTantrum();
        }
        if (hits.length > 0) {
          this.audio.hit();
          this.presentHits(hits);
          if (this.combat.rageTriggered) {
            this.audio.rage();
            this.hud.flashRage();
          }
          this.syncCandyUi();
        }

        this.state.tickRage(scaledDt);
        this.state.tickTantrum(scaledDt);
        this.state.tickSecondWindBoost(scaledDt);
        this.state.tickRockRainBlock(scaledDt);
        const burnHits = this.combat.tickBurns(this.state, this.pinatas, this.factory, scaledDt);
        if (burnHits.length > 0) {
          this.presentHits(burnHits);
          this.syncCandyUi();
        }

        if (!this.state.hasUpgrade("combo") && !this.combat.comboActive) this.state.combo = 0;

        if (this.staminaSys.update(this.state, scaledDt)) {
          const lastStandHits = this.combat.fireLastStand(
            this.state,
            this.pinatas,
            this.factory,
          );
          if (lastStandHits.length > 0) {
            this.presentHits(lastStandHits);
            this.syncCandyUi();
          }
          if (this.state.trySecondWind()) {
            this.combat.cooldown = Math.min(this.combat.cooldown, 1 / this.state.getSwingRate());
            spawnFloatText(
              this.uiRoot,
              this.width * 0.5,
              this.height * 0.22,
              "SECOND WIND",
              "#3dd68c",
              1400,
            );
          } else {
            this.finishRound();
          }
        }
        this.syncCandyUi();
        this.pruneDeadPinatas();
        this.maybeRespawn(scaledDt);
        this.maybeTimedSpawn(scaledDt);
        this.maybeDivineRay(scaledDt);
      }
    } else {
      this.weapon.setLockedTarget(null);
    }

    this.weapon.update(dt, this.cameraRig.active);
    this.renderer.render(this.scene, this.cameraRig.active);
  };
}
