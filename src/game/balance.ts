import { formatNumber } from "../util/math";
import { getEquippedStick } from "./sticks";

export type UpgradeId =
  | "power"
  | "swing"
  | "stamina"
  | "hitRadius"
  | "candyYield"
  | "sugarRush"
  | "lightningStrike"
  | "lightningChance"
  | "lightningChance2"
  | "lightningChance3"
  | "lightningMoreTargets"
  | "lightningMoreTargets2"
  | "lightningMoreRays"
  | "lightningDamage"
  | "lightningDamage2"
  | "lightningDamage3"
  | "moreSpeed"
  | "moreSpeed2"
  | "moreSpeed3"
  | "moreSpeed4"
  | "moreSpeed5"
  | "moreSpeed6"
  | "efficientWings"
  | "tantrum"
  | "tantrumDuration"
  | "rageMode"
  | "rageDuration"
  | "rageDuration2"
  | "rageChance"
  | "rageChance2"
  | "rageSpeed"
  | "rageSpeed2"
  | "ignite"
  | "igniteChance"
  | "igniteChance2"
  | "fireDuration"
  | "fireDuration2"
  | "fireDamage"
  | "fireDamage2"
  | "burningChain"
  | "doubleHit"
  | "combo"
  | "moreComboDamage"
  | "moreComboDamage2"
  | "moreComboDamage3"
  | "moreComboDamage4"
  | "comboSaver"
  | "comboSpeedBonus"
  | "energyDrink"
  | "restoreChance"
  | "restoreChance2"
  | "restoreChance3"
  | "moreStamina"
  | "moreStamina2"
  | "moreStamina3"
  | "speedFromStamina"
  | "stackingDamage"
  | "gripStrength"
  | "megaGrip"
  | "lowStaminaBonus"
  | "lowStaminaDamage"
  | "lowStaminaSpeed"
  | "secondWind"
  | "secondWindBoost"
  | "secondWindBoost2"
  | "lastStand"
  | "partingShot"
  | "lastStandDamage"
  | "moreLoot"
  | "extraLoot"
  | "moreLoot3"
  | "lootPerPinataType"
  | "lootBonusDamage"
  | "lootPerDestroy"
  | "luckySeven"
  | "luckySeven2"
  | "doubleLoot"
  | "doubleLoot2"
  | "doubleLoot3"
  | "candyRain"
  | "moreCandy"
  | "moreCandy2"
  | "moreCandy3"
  | "moreCandy4"
  | "moreCandy5"
  | "glowingPinatas"
  | "moreGlowingChance"
  | "moreGlowingChance2"
  | "glowingBonus"
  | "glowingSpread"
  | "moreGlowingSpread"
  | "moreGlowingSpread2"
  | "moreGlowingBonus"
  | "brightStart"
  | "spawnExtraLoot"
  | "spawnExtraLoot2"
  | "spawnExtraLoot3"
  | "spawnExtraLoot4"
  | "bornLucky"
  | "moreLuck"
  | "superLuck"
  | "superJackpot"
  | "superJackpotChance"
  | "superJackpotChance2"
  | "superJackpotChance3"
  | "morePinatas"
  | "morePinatas2"
  | "morePinatas3"
  | "morePinatas4"
  | "morePinatas5"
  | "morePinatas6"
  | "morePinatas7"
  | "morePinatas8"
  | "morePinatas9"
  | "timedSpawn"
  | "fasterSpawns"
  | "respawnChance"
  | "respawnChance2"
  | "respawnChance3"
  | "respawnChance4"
  | "respawnChance5"
  | "moreDamage"
  | "collateralDamage"
  | "shockwave"
  | "shockwaveChance"
  | "shockwaveChance2"
  | "shockwaveChance3"
  | "shockwaveDamage"
  | "shockwaveDamage2"
  | "shockwaveDamage3"
  | "shockwaveDamage4"
  | "shockwaveDamage5"
  | "biggerStick2"
  | "biggerStick3"
  | "switchDamage"
  | "divineRay"
  | "divineRayStrikes"
  | "moreDivineRayStrikes"
  | "moreDivineRayStrikes2"
  | "divineRayRadius"
  | "divineRayRadius2"
  | "divineRayDamage"
  | "divineRayDamage2"
  | "divineRayChance"
  | "divineRayChance2"
  | "pinataShockwave"
  | "pinataShockwaveRadius"
  | "pinataShockwaveRadius2"
  | "pinataShockwaveRadius3"
  | "pinataShockwaveDamage"
  | "pinataShockwaveDamage2"
  | "pinataShockwaveDamage3"
  | "pinataShockwaveChance"
  | "pinataShockwaveChance2"
  | "pinataShockwaveChance3"
  | "moreHitRadius"
  | "biggerStick4"
  | "moreDamage2"
  | "moreDamage3"
  | "damagePerDestroy"
  | "crowdDamage"
  | "moreCrowdDamage"
  | "rockRain"
  | "rockRainChance"
  | "rockRainChance2"
  | "moreRocks"
  | "moreRocks2"
  | "biggerBlast"
  | "biggerBlast2"
  | "rockRainDamage"
  | "rockRainDamage2"
  | "firstHitMultiplier"
  | "moreDamage4"
  | "moreDamage5"
  | "moreDamage6"
  | "moreDamage7"
  | "moreDamage8"
  | "moreDamage9"
  | "moreDamage10"
  | "oneSmash"
  | "oneSmashChance"
  | "oneSmashChance2"
  | "moreFirstHitDamage"
  | "phantomStick"
  | "phantomHandChance"
  | "phantomHandChance2"
  | "phantomHandChance3"
  | "phantomHandChance4"
  | "phantomHandDamage"
  | "phantomHandDamage2"
  | "phantomHandDamage3"
  | "phantomMoreTargets"
  | "critChance"
  | "critDamage"
  | "critDamage2"
  | "moreCritDamage"
  | "moreCritDamage2"
  | "moreCritDamage3"
  | "moreCritDamage4"
  | "moreCritDamage5"
  | "moreCritDamage6"
  | "moreCritDamage7"
  | "moreCritChance"
  | "moreCritChance3"
  | "moreCritChance4"
  | "moreCritChance5"
  | "moreCritChance6"
  | "moreCritChance7"
  | "luckyCrit"
  | "lowHpCrits"
  | "firstHitDamage";

export type UpgradeLevels = Record<UpgradeId, number>;

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  /**
   * Same-family grouping for auto I/II/III labels. Defaults to `name`.
   * Set a unique family when two nodes share a display name but should not be numbered.
   */
  family?: string;
  description:
    | string
    | ((
        upgrades: UpgradeLevels,
        unlockedPinataTypes?: number,
        totalBreaks?: number,
        staminaUsed?: number,
      ) => string);
  maxLevel: number;
  /** Candy cost for purchasing level n (1-based index into this array) */
  costs: number[];
  /** Must own ≥1 level of each listed upgrade before this node unlocks */
  requires?: readonly UpgradeId[];
  /** Unlocks if the player owns ≥1 level of any listed upgrade */
  requiresAny?: readonly UpgradeId[];
  /** Hidden until the last Fiesta payment is paid. */
  requiresFinalPayment?: boolean;
}

export const BASE = {
  power: 1,
  /** Hits per second before attack-speed upgrades */
  swingRate: 0.75,
  /**
   * Absolute aim / hit scalar at multiplier 1.0 (current size).
   * Upgrade multipliers scale this; tune here if the baseline size changes.
   */
  hitRadius: 0.56,
  /** Energy is a 0–100 bar that empties over the round */
  maxStamina: 100,
  /** Base round length in seconds (energy 100 → 0 at base drain) */
  roundDurationSec: 15,
  basicPinataHp: 5,
  targetLockMs: 120,
  hitStopMs: 45,
  comboWindowMs: 900,
  particleCap: 220,
  /** Fraction of round candy awarded when accuracy is exactly 100% (with ≥1 swing). */
  accuracyPerfectBonusRate: 0.1,
  /** Candy granted at the end of round 1 if the player earned nothing (AFK / no loot). */
  round1PityCandy: 1,
  /** Concurrent pinatas at round start. After that wave, only one at a time. */
  startingPinatas: 4,
};

/** Flat +1 damage per power level (base 1 → 2 after first upgrade). */
export const POWER_PER_LEVEL = 1;
/** Additive attack-speed bonuses from the Faster Swings branch (of base 0.75/s). */
export const SWING_SPEED_BONUS: Partial<Record<UpgradeId, number>> = {
  swing: 0.25,
  sugarRush: 0.2,
  moreSpeed: 0.15,
  moreSpeed2: 0.1,
  moreSpeed3: 0.05,
  moreSpeed4: 0.05,
  moreSpeed5: 0.05,
  moreSpeed6: 0.05,
};
export const RAGE_MODE = {
  everyNthHit: 10,
  chance: 0.05,
  speedBonus: 0.5,
  durationSec: 3,
} as const;
/** Additive Rage trigger chance from Rage Chance I / II. */
export const RAGE_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  rageChance: 0.02,
  rageChance2: 0.02,
};
/** Extra Rage seconds from Rage Duration I / II. */
export const RAGE_DURATION_BONUS: Partial<Record<UpgradeId, number>> = {
  rageDuration: 1,
  rageDuration2: 1,
};
/** Extra Rage attack-speed bonus from Rage Speed I / II. */
export const RAGE_SPEED_BONUS: Partial<Record<UpgradeId, number>> = {
  rageSpeed: 0.1,
  rageSpeed2: 0.5,
};
export const TANTRUM = {
  missesRequired: 2,
  damageRatio: 0.2,
  durationSec: 3,
  minDamage: 1,
} as const;
/** Fury Duration multiplies base duration. */
export const TANTRUM_DURATION_MULT: Partial<Record<UpgradeId, number>> = {
  tantrumDuration: 1.5,
};
export const IGNITE = {
  chance: 0.02,
  damageRatio: 0.25,
  tickIntervalSec: 0.5,
  durationSec: 3,
  minDamage: 1,
} as const;
/** Additive Sparkler trigger chance from Sparkler Chance I / II. */
export const IGNITE_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  igniteChance: 0.02,
  igniteChance2: 0.02,
};
/** Extra Sparkler seconds from Sparkler Duration I / II. */
export const IGNITE_DURATION_BONUS: Partial<Record<UpgradeId, number>> = {
  fireDuration: 1,
  fireDuration2: 1,
};
/** Extra Sparkler damage as a fraction of base damage (Sparkler Damage I / II). */
export const IGNITE_DAMAGE_BONUS = {
  fireDamage: 0.15,
  fireDamage2: 0.15,
} as const satisfies Partial<Record<UpgradeId, number>>;
/** When a burning piñata is destroyed, fire may spread to nearby piñatas. */
export const BURNING_CHAIN = {
  chance: 0.1,
  radius: 2.8,
} as const;
export const LIGHTNING = {
  chance: 0.05,
  targets: 4,
  damageRatio: 0.25,
  damageBonusRatio: 0.35,
  minDamage: 1,
} as const;
/** Additive Sky Spark trigger chance from Sky Spark Chance I / II / III. */
export const LIGHTNING_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  lightningChance: 0.02,
  lightningChance2: 0.02,
  lightningChance3: 0.02,
};
/** Extra piñatas struck when Sky Spark procs. */
export const LIGHTNING_TARGETS_BONUS: Partial<Record<UpgradeId, number>> = {
  lightningMoreTargets: 2,
  lightningMoreTargets2: 2,
};
/** Extra independent lightning rays from Extra Sparks. */
export const LIGHTNING_RAYS_BONUS: Partial<Record<UpgradeId, number>> = {
  lightningMoreRays: 1,
};
/** Extra lightning damage as a fraction of base damage (Sky Spark Damage I / II / III). */
export const LIGHTNING_DAMAGE_BONUS = {
  lightningDamage: 0.35,
  lightningDamage2: 0.15,
  lightningDamage3: 0.1,
} as const satisfies Partial<Record<UpgradeId, number>>;
export const DOUBLE_HIT_CHANCE = 0.05;
export const COMBO = {
  hitsPerStack: 10,
  damageRatio: 0.02,
  minDamage: 1,
} as const;
/** Streak Damage I–IV — each adds another 2% of base damage per 10 combo hits. */
export const MORE_COMBO_DAMAGE_IDS: readonly UpgradeId[] = [
  "moreComboDamage",
  "moreComboDamage2",
  "moreComboDamage3",
  "moreComboDamage4",
];
/** Streak Saver — one free miss while energy is below this fraction. */
export const COMBO_SAVER = {
  staminaThreshold: 0.25,
} as const;
/** Streak Speed — extra attack speed at high combo. */
export const COMBO_SPEED_BONUS = {
  combo: 35,
  speedBonus: 0.05,
} as const;
/** Additive max-energy bonuses from the Party Energy branch. */
export const STAMINA_MAX_BONUS: Partial<Record<UpgradeId, number>> = {
  stamina: 20,
  energyDrink: 10,
  moreStamina: 10,
  moreStamina2: 10,
  moreStamina3: 10,
};
export const RESTORE_CHANCE = {
  chance: 0.04,
  amount: 2,
} as const;
export const RESTORE_CHANCE_2 = {
  chance: 0.04,
  amount: 3,
} as const;
export const RESTORE_CHANCE_3 = {
  chance: 0.04,
  amount: 3,
} as const;
/** +1% attack speed per 20 energy used this run (Winded Speed). */
export const SPEED_FROM_STAMINA = {
  speedPerStack: 0.01,
  staminaPerStack: 20,
} as const;
/** +2% of base damage (min +1) per 25 energy used this run (Winded Damage). */
export const STACKING_DAMAGE = {
  damageRatio: 0.02,
  minDamage: 1,
  staminaPerStack: 25,
} as const;
/** Flat drain reduction from the Steady Stick branch (energy per second). */
export const STAMINA_DRAIN_REDUCTION: Partial<Record<UpgradeId, number>> = {
  gripStrength: 0.5,
  megaGrip: 0.5,
};
/** Destroy-loot bonus while energy is below the threshold (Empty-Arm Loot). */
export const LOW_STAMINA_BONUS = {
  staminaThreshold: 0.1,
  lootBonus: 0.2,
} as const;
/** Extra stick damage while energy is below the threshold (Empty-Arm Damage). */
export const LOW_STAMINA_DAMAGE = {
  staminaThreshold: 0.15,
  damageRatio: 0.5,
  minDamage: 1,
} as const;
/** Extra attack speed while energy is below the threshold (Empty-Arm Speed). */
export const LOW_STAMINA_SPEED = {
  staminaThreshold: 0.2,
  speedBonus: 0.1,
} as const;
/** Additive loot bonuses from the Candy Shake branch (of 1.0 base). */
export const LOOT_BONUS: Partial<Record<UpgradeId, number>> = {
  candyYield: 0.35,
  moreLoot: 0.3,
  extraLoot: 0.15,
  moreLoot3: 0.1,
};
/** Extra loot per unlocked spawnable piñata type (Loot per Pinata Type). */
export const LOOT_PER_PINATA_TYPE = 0.005;
/** Extra loot per lifetime breaks this run (Loot Per Destroy). */
export const LOOT_PER_DESTROY = {
  lootPerStack: 0.01,
  breaksPerStack: 10,
} as const;
export const LOOT_BONUS_DAMAGE = {
  damageRatio: 0.05,
  minDamage: 1,
  lootPerStack: 0.3,
} as const;
/** Additive luck from Party Luck / Extra Luck / Big Luck (chance to upgrade a loot band). */
export const LUCK_BONUS: Partial<Record<UpgradeId, number>> = {
  bornLucky: 0.06,
  moreLuck: 0.03,
  superLuck: 0.09,
};
/** Fiesta Jackpot — chance to replace a break's loot with 2× the highest band. */
export const SUPER_JACKPOT = {
  chance: 0.005,
  lootMultiplier: 2,
} as const;
export const SUPER_JACKPOT_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  superJackpotChance: 0.005,
  superJackpotChance2: 0.005,
  superJackpotChance3: 0.005,
};
/** Additive double-loot chance from Double Loot I / II / III. */
export const DOUBLE_LOOT_BONUS: Partial<Record<UpgradeId, number>> = {
  doubleLoot: 0.07,
  doubleLoot2: 0.02,
  doubleLoot3: 0.02,
};
/** Chance for a spawned piñata to pay extra loot (Extra Loot I). */
export const SPAWN_EXTRA_LOOT = {
  chance: 0.025,
  lootBonus: 0.25,
} as const;
/** Extra spawn-loot bonus from Extra Loot I / II / III / IV. */
export const SPAWN_EXTRA_LOOT_BONUS: Partial<Record<UpgradeId, number>> = {
  spawnExtraLoot: 0.25,
  spawnExtraLoot2: 0.25,
  spawnExtraLoot3: 0.25,
  spawnExtraLoot4: 0.5,
};
/** Extra spawn chance from Extra Loot IV. */
export const SPAWN_EXTRA_LOOT_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  spawnExtraLoot4: 0.02,
};
export const CANDY_RAIN = {
  lootRate: 0.1,
  burstAfterBreaks: 5,
} as const;
/** Extra Candy Rain bank rate from More Candy. */
export const CANDY_RAIN_LOOT_BONUS: Partial<Record<UpgradeId, number>> = {
  moreCandy: 0.02,
  moreCandy2: 0.02,
  moreCandy3: 0.02,
  moreCandy4: 0.02,
  moreCandy5: 0.02,
};
/** Additive glowing-spawn chance from Glowing Pinatas / More Glowing Chance. */
export const GLOWING_SPAWN_BONUS: Partial<Record<UpgradeId, number>> = {
  glowingPinatas: 0.03,
  moreGlowingChance: 0.02,
  moreGlowingChance2: 0.015,
};
/** Chance for a destroyed glowing piñata to pay extra loot. */
export const GLOWING_BONUS_CHANCE: Partial<Record<UpgradeId, number>> = {
  glowingBonus: 0.01,
};
/** Extra jackpot payout when Glowing Bonus procs (additive). */
export const GLOWING_BONUS_EXTRA: Partial<Record<UpgradeId, number>> = {
  glowingBonus: 0.5,
  moreGlowingBonus: 0.5,
};
/** Destroying a glowing piñata can spread glow to a nearby one. */
export const GLOWING_SPREAD = {
  chance: 0.2,
  targets: 1,
} as const;
/** Additive Glowing Spread chance from More Glowing Spread I / II. */
export const GLOWING_SPREAD_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  moreGlowingSpread: 0.04,
  moreGlowingSpread2: 0.024,
};
/** Extra Glowing Spread targets from More Glowing Spread I / II. */
export const GLOWING_SPREAD_TARGETS_BONUS: Partial<Record<UpgradeId, number>> = {
  moreGlowingSpread: 1,
  moreGlowingSpread2: 1,
};
export const MORE_PINATAS_BONUS = 2;
/** More Pinatas I–IX — each adds +2 at round start. */
export const MORE_PINATAS_IDS: readonly UpgradeId[] = [
  "morePinatas",
  "morePinatas2",
  "morePinatas3",
  "morePinatas4",
  "morePinatas5",
  "morePinatas6",
  "morePinatas7",
  "morePinatas8",
  "morePinatas9",
];
export const TIMED_SPAWN_INTERVAL_SEC = 7;
export const FASTER_SPAWNS_INTERVAL_SEC = 5;
/** Additive break-respawn chance from Respawn Chance I–V. */
export const BREAK_RESPAWN_BONUS: Partial<Record<UpgradeId, number>> = {
  respawnChance: 0.1,
  respawnChance2: 0.05,
  respawnChance3: 0.1,
  respawnChance4: 0.1,
  respawnChance5: 0.1,
};
export const MORE_DAMAGE_RATIO = 0.1;
export const MORE_DAMAGE_IV_RATIO = 0.15;
export const MORE_DAMAGE_MIN = 1;
export const COLLATERAL_DAMAGE_RATIO = 0.25;
export const COLLATERAL_DAMAGE_MIN = 1;
export const SHOCKWAVE = {
  chance: 0.05,
  damageRatio: 0.25,
  damageBonusRatio: 0.3,
  minDamage: 1,
} as const;
/** Periodic sky lightning from Fiesta Bolt. */
export const DIVINE_RAY = {
  intervalSec: 10,
  chance: 0.05,
  damageRatio: 0.5,
  minDamage: 1,
  strikes: 1,
  radius: 0,
} as const;
export const DIVINE_RAY_STRIKES_BONUS: Partial<Record<UpgradeId, number>> = {
  divineRayStrikes: 2,
  moreDivineRayStrikes: 2,
  moreDivineRayStrikes2: 2,
};
export const DIVINE_RAY_RADIUS_BONUS: Partial<Record<UpgradeId, number>> = {
  divineRayRadius: 2,
  divineRayRadius2: 2,
};
export const DIVINE_RAY_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  divineRayChance: 0.02,
  divineRayChance2: 0.02,
};
/** Extra Fiesta Bolt damage as a fraction of base damage (Bolt Damage I / II). */
export const DIVINE_RAY_DAMAGE_BONUS = {
  divineRayDamage: 1,
  divineRayDamage2: 1,
} as const satisfies Partial<Record<UpgradeId, number>>;
/** On-destroy nearby shockwave from Pinata Shockwave. */
export const PINATA_SHOCKWAVE = {
  chance: 0.01,
  damageRatio: 0.25,
  minDamage: 1,
  radius: 2.8,
} as const;
export const PINATA_SHOCKWAVE_RADIUS_BONUS: Partial<Record<UpgradeId, number>> = {
  pinataShockwaveRadius: 0.2,
  pinataShockwaveRadius2: 0.2,
  pinataShockwaveRadius3: 0.2,
};
export const PINATA_SHOCKWAVE_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  pinataShockwaveChance: 0.01,
  pinataShockwaveChance2: 0.01,
  pinataShockwaveChance3: 0.01,
};
/** Extra pinata-shockwave damage as a fraction of base damage. */
export const PINATA_SHOCKWAVE_DAMAGE_BONUS = {
  pinataShockwaveDamage: 0.1,
  pinataShockwaveDamage2: 0.1,
  pinataShockwaveDamage3: 0.1,
} as const satisfies Partial<Record<UpgradeId, number>>;
/** Additive crackwave trigger chance from Crackwave Chance I / II / III. */
export const SHOCKWAVE_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  shockwaveChance: 0.02,
  shockwaveChance2: 0.02,
  shockwaveChance3: 0.01,
};
/** Extra crackwave damage as a fraction of base damage (Crackwave Damage I–V). */
export const SHOCKWAVE_DAMAGE_BONUS = {
  shockwaveDamage: 0.3,
  shockwaveDamage2: 0.3,
  shockwaveDamage3: 0.2,
  shockwaveDamage4: 0.1,
  shockwaveDamage5: 0.1,
} as const satisfies Partial<Record<UpgradeId, number>>;
export const PHANTOM_STICK = {
  chance: 0.05,
  damageRatio: 1.5,
  damageBonusRatio: 0.25,
  minDamage: 1,
  targets: 1,
} as const;
/** Additive Ghost Stick trigger chance from Ghost Stick Chance I–IV. */
export const PHANTOM_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  phantomHandChance: 0.02,
  phantomHandChance2: 0.02,
  phantomHandChance3: 0.02,
  phantomHandChance4: 0.02,
};
/** Extra Ghost Stick damage as a fraction of base damage (Ghost Stick Damage I / II / III). */
export const PHANTOM_DAMAGE_BONUS = {
  phantomHandDamage: 0.25,
  phantomHandDamage2: 0.3,
  phantomHandDamage3: 0.3,
} as const satisfies Partial<Record<UpgradeId, number>>;
/** Extra random piñatas struck when Ghost Stick procs. */
export const PHANTOM_TARGETS_BONUS: Partial<Record<UpgradeId, number>> = {
  phantomMoreTargets: 1,
};
/** Additive crit chance from Lucky Crack / More Lucky Cracks. */
export const CRIT_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  critChance: 0.1,
  moreCritChance: 0.05,
  moreCritChance3: 0.05,
  moreCritChance4: 0.02,
  moreCritChance5: 0.02,
  moreCritChance6: 0.02,
  moreCritChance7: 0.02,
};
/** Extra crit chance vs piñatas below the HP threshold (Cracked Crits). */
export const LOW_HP_CRITS = {
  hpThreshold: 0.25,
  chance: 0.1,
} as const;
/** Extra stick damage vs piñatas below the HP threshold (Heavier Hits VII). */
export const LOW_HP_DAMAGE = {
  hpThreshold: 0.25,
  damageRatio: 0.5,
  minDamage: 1,
} as const;
export const CRIT_DAMAGE_MULT = 2;
/** Additive crit-damage bonuses from Crack Damage / Harder Cracks (of the 2x base). */
export const CRIT_DAMAGE_BONUS: Partial<Record<UpgradeId, number>> = {
  critDamage: 0.25,
  moreCritDamage: 0.15,
  critDamage2: 0.1,
  moreCritDamage2: 0.1,
  moreCritDamage3: 0.1,
  moreCritDamage5: 0.5,
  moreCritDamage6: 0.5,
  moreCritDamage7: 0.5,
};
export const LUCKY_CRIT = {
  everyNthHit: 8,
  chance: 0.77,
} as const;
/** Crit kills use at least this double-loot chance (Harder Cracks III). */
export const CRIT_KILL_DOUBLE_LOOT = 0.77;
export const FIRST_HIT_DAMAGE_RATIO = 0.25;
export const MORE_FIRST_HIT_DAMAGE_RATIO = 0.5;
export const FIRST_HIT_MULTIPLIER = 2;
/** Extra stick damage when the hit target's type differs from the last stick target. */
export const SWITCH_DAMAGE_RATIO = 0.25;
/** Additive hit-radius multiplier bonuses (1 = current size). */
export const HIT_RADIUS_BONUS: Partial<Record<UpgradeId, number>> = {
  hitRadius: 0.6,
  biggerStick2: 0.4,
  biggerStick3: 0.2,
  moreHitRadius: 0.22,
  biggerStick4: 0.25,
};
/** Extra base damage per piñata destroyed this run (Damage per Destroy). */
export const DAMAGE_PER_DESTROY = {
  damageRatio: 0.01,
  minDamage: 1,
  maxStacks: 25,
} as const;
/** Extra stick damage per living piñata on screen (Packed Party / Pack Damage). */
export const CROWD_DAMAGE = {
  damageRatio: 0.01,
  minDamage: 1,
} as const;
export const CROWD_DAMAGE_IDS: readonly UpgradeId[] = ["crowdDamage", "moreCrowdDamage"];
/** Shard Rain — shards fall around a stick hit. Blocked during Candy Rain and shortly after. */
export const ROCK_RAIN = {
  chance: 0.05,
  rocks: 18,
  damageRatio: 0.5,
  minDamage: 1,
  spread: 1.65,
  hitRadius: 0.9,
  stormSec: 1.5,
  afterStormSec: 3,
} as const;
export const ROCK_RAIN_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  rockRainChance: 0.02,
  rockRainChance2: 0.02,
};
export const ROCK_RAIN_ROCKS_BONUS: Partial<Record<UpgradeId, number>> = {
  moreRocks: 8,
  moreRocks2: 8,
};
export const ROCK_RAIN_RADIUS_BONUS: Partial<Record<UpgradeId, number>> = {
  biggerBlast: 0.5,
  biggerBlast2: 0.5,
};
export const ROCK_RAIN_DAMAGE_BONUS = {
  rockRainDamage: 1,
  rockRainDamage2: 1,
} as const satisfies Partial<Record<UpgradeId, number>>;
export const ONE_SMASH = {
  chance: 0.002,
} as const;
export const ONE_SMASH_CHANCE_BONUS: Partial<Record<UpgradeId, number>> = {
  oneSmashChance: 0.01,
  oneSmashChance2: 0.01,
};
export const LAST_STAND = {
  damageRatio: 0.25,
  minDamage: 1,
} as const;
export const LAST_STAND_DAMAGE_BONUS: Partial<Record<UpgradeId, number>> = {
  partingShot: 0.2,
  lastStandDamage: 0.3,
};
export const SECOND_WIND_RESTORE = 0.1;
export const SECOND_WIND_RESTORE_BONUS: Partial<Record<UpgradeId, number>> = {
  secondWindBoost: 0.1,
};
export const SECOND_WIND_BOOST = {
  durationSec: 4,
  damageRatio: 0.25,
  minDamage: 1,
  speedBonus: 0.1,
} as const;
export const LUCKY_SEVEN = {
  everyNthHit: 7,
  chance: 0.07,
  lootBonus: 0.25,
  lootBonus2: 0.4,
} as const;
/**
 * Light Stick: drain cut per 1.0 (100%) attack-speed bonus.
 * Tuned so the Faster Swings tree through Quicker Swings III (75% AS) is ~1.6% (4.95/s → 4.87/s).
 */
export const EFFICIENT_WINGS_DRAIN_PER_SPEED = (4.95 - 4.87) / 4.95 / 0.75;
/** Heavier Hits I–VI plus the post-finale node — I–III add +10% (min +1), IV–VI add +15% (min +1), finale adds +50% (min +1), applied in unlock order. */
export const MORE_DAMAGE_FINALE_RATIO = 0.5;
export const MORE_DAMAGE_RATIO_BY_ID: Partial<Record<UpgradeId, number>> = {
  moreDamage: MORE_DAMAGE_RATIO,
  moreDamage2: MORE_DAMAGE_RATIO,
  moreDamage3: MORE_DAMAGE_RATIO,
  moreDamage4: MORE_DAMAGE_IV_RATIO,
  moreDamage5: MORE_DAMAGE_IV_RATIO,
  moreDamage6: MORE_DAMAGE_IV_RATIO,
  moreDamage8: MORE_DAMAGE_FINALE_RATIO,
  moreDamage9: MORE_DAMAGE_FINALE_RATIO,
  moreDamage10: MORE_DAMAGE_FINALE_RATIO,
};
export const MORE_DAMAGE_IDS: readonly UpgradeId[] = [
  "moreDamage",
  "moreDamage2",
  "moreDamage3",
  "moreDamage4",
  "moreDamage5",
  "moreDamage6",
  "moreDamage8",
  "moreDamage9",
  "moreDamage10",
];

/**
 * Skill-tree upgrades. Central node is Damage (+1), cost 1.
 * Layer-2 branch nodes unlock after Damage is purchased — each costs 12.
 */
export function emptyUpgrades(): UpgradeLevels {
  return {
    power: 0,
    swing: 0,
    stamina: 0,
    hitRadius: 0,
    candyYield: 0,
    sugarRush: 0,
    lightningStrike: 0,
    lightningChance: 0,
    lightningChance2: 0,
    lightningChance3: 0,
    lightningMoreTargets: 0,
    lightningMoreTargets2: 0,
    lightningMoreRays: 0,
    lightningDamage: 0,
    lightningDamage2: 0,
    lightningDamage3: 0,
    moreSpeed: 0,
    moreSpeed2: 0,
    moreSpeed3: 0,
    moreSpeed4: 0,
    moreSpeed5: 0,
    moreSpeed6: 0,
    efficientWings: 0,
    tantrum: 0,
    tantrumDuration: 0,
    rageMode: 0,
    rageDuration: 0,
    rageDuration2: 0,
    rageChance: 0,
    rageChance2: 0,
    rageSpeed: 0,
    rageSpeed2: 0,
    ignite: 0,
    igniteChance: 0,
    igniteChance2: 0,
    fireDuration: 0,
    fireDuration2: 0,
    fireDamage: 0,
    fireDamage2: 0,
    burningChain: 0,
    doubleHit: 0,
    combo: 0,
    moreComboDamage: 0,
    moreComboDamage2: 0,
    moreComboDamage3: 0,
    moreComboDamage4: 0,
    comboSaver: 0,
    comboSpeedBonus: 0,
    energyDrink: 0,
    restoreChance: 0,
    restoreChance2: 0,
    restoreChance3: 0,
    moreStamina: 0,
    moreStamina2: 0,
    moreStamina3: 0,
    speedFromStamina: 0,
    stackingDamage: 0,
    gripStrength: 0,
    megaGrip: 0,
    lowStaminaBonus: 0,
    lowStaminaDamage: 0,
    lowStaminaSpeed: 0,
    secondWind: 0,
    secondWindBoost: 0,
    secondWindBoost2: 0,
    lastStand: 0,
    partingShot: 0,
    lastStandDamage: 0,
    moreLoot: 0,
    extraLoot: 0,
    moreLoot3: 0,
    lootPerPinataType: 0,
    lootBonusDamage: 0,
    lootPerDestroy: 0,
    luckySeven: 0,
    luckySeven2: 0,
    doubleLoot: 0,
    doubleLoot2: 0,
    doubleLoot3: 0,
    candyRain: 0,
    moreCandy: 0,
    moreCandy2: 0,
    moreCandy3: 0,
    moreCandy4: 0,
    moreCandy5: 0,
    glowingPinatas: 0,
    moreGlowingChance: 0,
    moreGlowingChance2: 0,
    glowingBonus: 0,
    glowingSpread: 0,
    moreGlowingSpread: 0,
    moreGlowingSpread2: 0,
    moreGlowingBonus: 0,
    brightStart: 0,
    spawnExtraLoot: 0,
    spawnExtraLoot2: 0,
    spawnExtraLoot3: 0,
    spawnExtraLoot4: 0,
    bornLucky: 0,
    moreLuck: 0,
    superLuck: 0,
    superJackpot: 0,
    superJackpotChance: 0,
    superJackpotChance2: 0,
    superJackpotChance3: 0,
    morePinatas: 0,
    morePinatas2: 0,
    morePinatas3: 0,
    morePinatas4: 0,
    morePinatas5: 0,
    morePinatas6: 0,
    morePinatas7: 0,
    morePinatas8: 0,
    morePinatas9: 0,
    timedSpawn: 0,
    fasterSpawns: 0,
    respawnChance: 0,
    respawnChance2: 0,
    respawnChance3: 0,
    respawnChance4: 0,
    respawnChance5: 0,
    moreDamage: 0,
    collateralDamage: 0,
    shockwave: 0,
    shockwaveChance: 0,
    shockwaveChance2: 0,
    shockwaveChance3: 0,
    shockwaveDamage: 0,
    shockwaveDamage2: 0,
    shockwaveDamage3: 0,
    shockwaveDamage4: 0,
    shockwaveDamage5: 0,
    biggerStick2: 0,
    biggerStick3: 0,
    switchDamage: 0,
    divineRay: 0,
    divineRayStrikes: 0,
    moreDivineRayStrikes: 0,
    moreDivineRayStrikes2: 0,
    divineRayRadius: 0,
    divineRayRadius2: 0,
    divineRayDamage: 0,
    divineRayDamage2: 0,
    divineRayChance: 0,
    divineRayChance2: 0,
    pinataShockwave: 0,
    pinataShockwaveRadius: 0,
    pinataShockwaveRadius2: 0,
    pinataShockwaveRadius3: 0,
    pinataShockwaveDamage: 0,
    pinataShockwaveDamage2: 0,
    pinataShockwaveDamage3: 0,
    pinataShockwaveChance: 0,
    pinataShockwaveChance2: 0,
    pinataShockwaveChance3: 0,
    moreHitRadius: 0,
    biggerStick4: 0,
    moreDamage2: 0,
    moreDamage3: 0,
    damagePerDestroy: 0,
    crowdDamage: 0,
    moreCrowdDamage: 0,
    rockRain: 0,
    rockRainChance: 0,
    rockRainChance2: 0,
    moreRocks: 0,
    moreRocks2: 0,
    biggerBlast: 0,
    biggerBlast2: 0,
    rockRainDamage: 0,
    rockRainDamage2: 0,
    firstHitMultiplier: 0,
    moreDamage4: 0,
    moreDamage5: 0,
    moreDamage6: 0,
    moreDamage7: 0,
    moreDamage8: 0,
    moreDamage9: 0,
    moreDamage10: 0,
    oneSmash: 0,
    oneSmashChance: 0,
    oneSmashChance2: 0,
    moreFirstHitDamage: 0,
    phantomStick: 0,
    phantomHandChance: 0,
    phantomHandChance2: 0,
    phantomHandChance3: 0,
    phantomHandChance4: 0,
    phantomHandDamage: 0,
    phantomHandDamage2: 0,
    phantomHandDamage3: 0,
    phantomMoreTargets: 0,
    critChance: 0,
    critDamage: 0,
    critDamage2: 0,
    moreCritDamage: 0,
    moreCritDamage2: 0,
    moreCritDamage3: 0,
    moreCritDamage4: 0,
    moreCritDamage5: 0,
    moreCritDamage6: 0,
    moreCritDamage7: 0,
    moreCritChance: 0,
    moreCritChance3: 0,
    moreCritChance4: 0,
    moreCritChance5: 0,
    moreCritChance6: 0,
    moreCritChance7: 0,
    luckyCrit: 0,
    lowHpCrits: 0,
    firstHitDamage: 0,
  };
}

export function attackSpeedBonusFor(upgrades: UpgradeLevels, staminaUsed = 0): number {
  let bonus = 0;
  for (const [id, pct] of Object.entries(SWING_SPEED_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) bonus += pct;
  }
  bonus += speedFromStaminaBonusFor(upgrades, staminaUsed);
  return bonus;
}

function equippedSwingRate(): number {
  return getEquippedStick().attackSpeed;
}

export function swingRateFor(upgrades: UpgradeLevels, staminaUsed = 0): number {
  return equippedSwingRate() * (1 + attackSpeedBonusFor(upgrades, staminaUsed));
}

export function formatSwingRate(rate: number): string {
  return `${(Math.round(rate * 100) / 100).toFixed(2)}/s`;
}

function attackSpeedDescription(id: UpgradeId, pctLabel: string) {
  return (upgrades: UpgradeLevels, _types = 0, _breaks = 0, staminaUsed = 0): string => {
    const without = swingRateFor({ ...upgrades, [id]: 0 }, staminaUsed);
    const withIt = swingRateFor({ ...upgrades, [id]: 1 }, staminaUsed);
    return `+${pctLabel} attack speed (${formatSwingRate(without)} → ${formatSwingRate(withIt)}).`;
  };
}

export function speedFromStaminaStacksFor(staminaUsed = 0): number {
  return Math.floor(Math.max(0, staminaUsed) / SPEED_FROM_STAMINA.staminaPerStack);
}

export function speedFromStaminaBonusFor(upgrades: UpgradeLevels, staminaUsed = 0): number {
  if (upgrades.speedFromStamina < 1) return 0;
  return speedFromStaminaStacksFor(staminaUsed) * SPEED_FROM_STAMINA.speedPerStack;
}

export function stackingDamageStacksFor(staminaUsed = 0): number {
  return Math.floor(Math.max(0, staminaUsed) / STACKING_DAMAGE.staminaPerStack);
}

export function stackingDamagePerStackFor(basePower: number): number {
  return Math.max(STACKING_DAMAGE.minDamage, Math.round(basePower * STACKING_DAMAGE.damageRatio));
}

export function stackingDamageFor(basePower: number, staminaUsed = 0): number {
  const stacks = stackingDamageStacksFor(staminaUsed);
  if (stacks <= 0) return 0;
  return stacks * stackingDamagePerStackFor(basePower);
}

export function maxStaminaFor(upgrades: UpgradeLevels): number {
  let bonus = 0;
  for (const [id, amount] of Object.entries(STAMINA_MAX_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) bonus += amount;
  }
  return BASE.maxStamina + bonus;
}

export function baseDrainRate(): number {
  return BASE.maxStamina / Math.max(0.001, BASE.roundDurationSec);
}

export function drainRateFor(upgrades: UpgradeLevels, staminaUsed = 0): number {
  let reduction = 0;
  for (const [id, amount] of Object.entries(STAMINA_DRAIN_REDUCTION) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) reduction += amount;
  }
  let rate = Math.max(0.001, baseDrainRate() - reduction);
  if (upgrades.efficientWings >= 1) {
    const cut = attackSpeedBonusFor(upgrades, staminaUsed) * EFFICIENT_WINGS_DRAIN_PER_SPEED;
    rate *= Math.max(0, 1 - cut);
  }
  return Math.max(0.001, rate);
}

export function efficientWingsDrainCutFor(upgrades: UpgradeLevels, staminaUsed = 0): number {
  if (upgrades.efficientWings < 1) return 0;
  return attackSpeedBonusFor(upgrades, staminaUsed) * EFFICIENT_WINGS_DRAIN_PER_SPEED;
}

export function formatDrainRate(rate: number): string {
  return `${(Math.round(rate * 100) / 100).toFixed(2)}/s`;
}

function drainReductionDescription(id: UpgradeId, amountLabel: string, flavor?: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = drainRateFor({ ...upgrades, [id]: 0 });
    const withIt = drainRateFor({ ...upgrades, [id]: 1 });
    const bonus = `-${amountLabel} energy drain per second (${formatDrainRate(without)} → ${formatDrainRate(withIt)}).`;
    return flavor ? `${flavor} ${bonus}` : bonus;
  };
}

function maxStaminaDescription(id: UpgradeId, amount: number, extraWord = "") {
  return (upgrades: UpgradeLevels): string => {
    const without = maxStaminaFor({ ...upgrades, [id]: 0 });
    const withIt = maxStaminaFor({ ...upgrades, [id]: 1 });
    const more = extraWord ? `${extraWord} ` : "";
    return `+${formatNumber(amount)} ${more}max energy (${formatNumber(without)} → ${formatNumber(withIt)}).`;
  };
}

export function lowStaminaLootBonusFor(
  upgrades: UpgradeLevels,
  stamina: number,
  maxStamina: number,
): number {
  if (upgrades.lowStaminaBonus < 1 || maxStamina <= 0) return 0;
  if (stamina / maxStamina >= LOW_STAMINA_BONUS.staminaThreshold) return 0;
  return LOW_STAMINA_BONUS.lootBonus;
}

export function lowStaminaDamageBonusFor(
  basePower: number,
  upgrades: UpgradeLevels,
  stamina: number,
  maxStamina: number,
): number {
  if (upgrades.lowStaminaDamage < 1 || maxStamina <= 0) return 0;
  if (stamina / maxStamina >= LOW_STAMINA_DAMAGE.staminaThreshold) return 0;
  return Math.max(
    LOW_STAMINA_DAMAGE.minDamage,
    Math.round(basePower * LOW_STAMINA_DAMAGE.damageRatio),
  );
}

export function lowStaminaSpeedBonusFor(
  upgrades: UpgradeLevels,
  stamina: number,
  maxStamina: number,
): number {
  if (upgrades.lowStaminaSpeed < 1 || maxStamina <= 0) return 0;
  if (stamina / maxStamina >= LOW_STAMINA_SPEED.staminaThreshold) return 0;
  return LOW_STAMINA_SPEED.speedBonus;
}

export function lootPerDestroyBonusFor(upgrades: UpgradeLevels, totalBreaks = 0): number {
  if (upgrades.lootPerDestroy < 1) return 0;
  return (
    Math.floor(Math.max(0, totalBreaks) / LOOT_PER_DESTROY.breaksPerStack) *
    LOOT_PER_DESTROY.lootPerStack
  );
}

export function lootMultiplierFor(
  upgrades: UpgradeLevels,
  unlockedPinataTypes = 0,
  totalBreaks = 0,
): number {
  let bonus = 0;
  for (const [id, amount] of Object.entries(LOOT_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) bonus += amount;
  }
  if (upgrades.lootPerPinataType >= 1) {
    bonus += Math.max(0, unlockedPinataTypes) * LOOT_PER_PINATA_TYPE;
  }
  bonus += lootPerDestroyBonusFor(upgrades, totalBreaks);
  return 1 + bonus;
}

export function lootBonusRateFor(
  upgrades: UpgradeLevels,
  unlockedPinataTypes = 0,
  totalBreaks = 0,
): number {
  return lootMultiplierFor(upgrades, unlockedPinataTypes, totalBreaks) - 1;
}

export function luckFor(upgrades: UpgradeLevels): number {
  let luck = 0;
  for (const [id, amount] of Object.entries(LUCK_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) luck += amount;
  }
  return luck;
}

export function formatPercent(rate: number): string {
  const pct = Math.round(rate * 1000) / 10;
  return `${formatNumber(pct)}%`;
}

export function doubleLootChanceFor(upgrades: UpgradeLevels): number {
  let chance = 0;
  for (const [id, amount] of Object.entries(DOUBLE_LOOT_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function glowingSpawnChanceFor(upgrades: UpgradeLevels): number {
  let chance = 0;
  for (const [id, amount] of Object.entries(GLOWING_SPAWN_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function glowingSpreadChanceFor(upgrades: UpgradeLevels): number {
  let chance = GLOWING_SPREAD.chance;
  for (const [id, amount] of Object.entries(GLOWING_SPREAD_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function glowingSpreadTargetsFor(upgrades: UpgradeLevels): number {
  let targets = GLOWING_SPREAD.targets;
  for (const [id, amount] of Object.entries(GLOWING_SPREAD_TARGETS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) targets += amount;
  }
  return targets;
}

export function spawnExtraLootChanceFor(upgrades: UpgradeLevels): number {
  if (upgrades.spawnExtraLoot < 1) return 0;
  let chance = SPAWN_EXTRA_LOOT.chance;
  for (const [id, amount] of Object.entries(SPAWN_EXTRA_LOOT_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function spawnExtraLootBonusFor(upgrades: UpgradeLevels): number {
  let extra = 0;
  for (const [id, amount] of Object.entries(SPAWN_EXTRA_LOOT_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += amount;
  }
  return extra;
}

export function glowingBonusChanceFor(upgrades: UpgradeLevels): number {
  let chance = 0;
  for (const [id, amount] of Object.entries(GLOWING_BONUS_CHANCE) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function glowingBonusExtraFor(upgrades: UpgradeLevels): number {
  let extra = 0;
  for (const [id, amount] of Object.entries(GLOWING_BONUS_EXTRA) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += amount;
  }
  return extra;
}

export function candyRainLootRateFor(upgrades: UpgradeLevels): number {
  let rate = CANDY_RAIN.lootRate;
  for (const [id, amount] of Object.entries(CANDY_RAIN_LOOT_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) rate += amount;
  }
  return rate;
}

function lootBonusDescription(id: UpgradeId, pctLabel: string) {
  return (upgrades: UpgradeLevels, unlockedPinataTypes = 0, totalBreaks = 0): string => {
    const without = lootMultiplierFor({ ...upgrades, [id]: 0 }, unlockedPinataTypes, totalBreaks);
    const withIt = lootMultiplierFor({ ...upgrades, [id]: 1 }, unlockedPinataTypes, totalBreaks);
    return `+${pctLabel} loot from all sources (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function doubleLootDescription(id: UpgradeId, pctLabel: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = doubleLootChanceFor({ ...upgrades, [id]: 0 });
    const withIt = doubleLootChanceFor({ ...upgrades, [id]: 1 });
    return `Destroyed piñatas have a +${pctLabel} chance to drop double loot (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function candyRainLootDescription(id: UpgradeId, pctLabel: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = candyRainLootRateFor({ ...upgrades, [id]: 0 });
    const withIt = candyRainLootRateFor({ ...upgrades, [id]: 1 });
    return `Candy Rain banks an extra +${pctLabel} of every piñata's loot (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function glowingSpawnDescription(id: UpgradeId, pctLabel: string, flavor?: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = glowingSpawnChanceFor({ ...upgrades, [id]: 0 });
    const withIt = glowingSpawnChanceFor({ ...upgrades, [id]: 1 });
    const rates = `(${formatPercent(without)} → ${formatPercent(withIt)})`;
    if (flavor) return `Piñatas have a +${pctLabel} chance to spawn glowing. ${flavor} ${rates}.`;
    return `Adds +${pctLabel} glowing spawn chance ${rates}.`;
  };
}

function glowingBonusDescription(id: UpgradeId, chanceLabel: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = glowingBonusChanceFor({ ...upgrades, [id]: 0 });
    const withIt = glowingBonusChanceFor({ ...upgrades, [id]: 1 });
    const extra = glowingBonusExtraFor({ ...upgrades, [id]: 1 });
    return `Destroyed glowing piñatas have a +${chanceLabel} chance to pay +${formatPercent(extra)} extra (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function glowingBonusExtraDescription(id: UpgradeId, extraLabel: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = glowingBonusExtraFor({ ...upgrades, [id]: 0 });
    const withIt = glowingBonusExtraFor({ ...upgrades, [id]: 1 });
    return `Glowing Bonus pays +${extraLabel} extra (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function luckDescription(id: UpgradeId, pctLabel: string, flavor?: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = luckFor({ ...upgrades, [id]: 0 });
    const withIt = luckFor({ ...upgrades, [id]: 1 });
    const rates = `(${formatPercent(without)} → ${formatPercent(withIt)})`;
    if (flavor) return `+${pctLabel} luck. ${flavor} ${rates}.`;
    return `+${pctLabel} luck ${rates}.`;
  };
}

export function basePowerFor(upgrades: UpgradeLevels): number {
  return getEquippedStick().baseDamage + upgrades.power * POWER_PER_LEVEL;
}

export function moreDamageBonusFor(basePower: number, ratio = MORE_DAMAGE_RATIO): number {
  return Math.max(MORE_DAMAGE_MIN, Math.round(basePower * ratio));
}

function moreDamageDescription(id: UpgradeId) {
  return (upgrades: UpgradeLevels, unlockedPinataTypes = 0, totalBreaks = 0): string => {
    const ratio = MORE_DAMAGE_RATIO_BY_ID[id] ?? MORE_DAMAGE_RATIO;
    const without = powerFor({ ...upgrades, [id]: 0 }, unlockedPinataTypes, totalBreaks);
    const withIt = powerFor({ ...upgrades, [id]: 1 }, unlockedPinataTypes, totalBreaks);
    return `+${formatPercent(ratio)} more damage (minimum +1) (${formatNumber(without)} → ${formatNumber(withIt)}).`;
  };
}

export function damagePerDestroyStacksFor(totalBreaks = 0): number {
  return Math.min(DAMAGE_PER_DESTROY.maxStacks, Math.max(0, Math.floor(totalBreaks)));
}

export function damagePerDestroyPerStackFor(basePower: number): number {
  return Math.max(
    DAMAGE_PER_DESTROY.minDamage,
    Math.round(basePower * DAMAGE_PER_DESTROY.damageRatio),
  );
}

export function damagePerDestroyBonusFor(basePower: number, totalBreaks = 0): number {
  const stacks = damagePerDestroyStacksFor(totalBreaks);
  if (stacks <= 0) return 0;
  return stacks * damagePerDestroyPerStackFor(basePower);
}

export function crowdDamagePerPinataFor(basePower: number): number {
  return Math.max(CROWD_DAMAGE.minDamage, Math.round(basePower * CROWD_DAMAGE.damageRatio));
}

export function crowdDamageStacksFor(upgrades: UpgradeLevels): number {
  let stacks = 0;
  for (const id of CROWD_DAMAGE_IDS) {
    if (upgrades[id] >= 1) stacks += 1;
  }
  return stacks;
}

export function crowdDamageBonusFor(
  basePower: number,
  pinataCount: number,
  upgrades?: UpgradeLevels,
): number {
  const count = Math.max(0, Math.floor(pinataCount));
  if (count <= 0) return 0;
  const stacks = upgrades ? crowdDamageStacksFor(upgrades) : 1;
  if (stacks <= 0) return 0;
  return count * crowdDamagePerPinataFor(basePower) * stacks;
}

export function lootBonusDamageStacksFor(lootBonus: number): number {
  return Math.floor((Math.max(0, lootBonus) + 1e-9) / LOOT_BONUS_DAMAGE.lootPerStack);
}

export function lootBonusDamagePerStackFor(basePower: number): number {
  return Math.max(
    LOOT_BONUS_DAMAGE.minDamage,
    Math.round(basePower * LOOT_BONUS_DAMAGE.damageRatio),
  );
}

export function lootBonusDamageFor(basePower: number, lootBonus: number): number {
  const stacks = lootBonusDamageStacksFor(lootBonus);
  if (stacks <= 0) return 0;
  return stacks * lootBonusDamagePerStackFor(basePower);
}

export function powerFor(
  upgrades: UpgradeLevels,
  unlockedPinataTypes = 0,
  totalBreaks = 0,
): number {
  let power = basePowerFor(upgrades);
  for (const id of MORE_DAMAGE_IDS) {
    if (upgrades[id] >= 1) {
      power += moreDamageBonusFor(power, MORE_DAMAGE_RATIO_BY_ID[id] ?? MORE_DAMAGE_RATIO);
    }
  }
  if (upgrades.lootBonusDamage >= 1) {
    power += lootBonusDamageFor(power, lootBonusRateFor(upgrades, unlockedPinataTypes, totalBreaks));
  }
  if (upgrades.damagePerDestroy >= 1) {
    power += damagePerDestroyBonusFor(power, totalBreaks);
  }
  return power;
}

export function hitRadiusMultFor(upgrades: UpgradeLevels): number {
  let bonus = 0;
  for (const [id, amount] of Object.entries(HIT_RADIUS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) bonus += amount;
  }
  return 1 + bonus;
}

export function hitRadiusFor(upgrades: UpgradeLevels): number {
  return BASE.hitRadius * hitRadiusMultFor(upgrades);
}

function formatHitRadiusMult(mult: number): string {
  const rounded = Math.round(mult * 100) / 100;
  return formatNumber(rounded);
}

function hitRadiusDescription(id: UpgradeId, amountLabel: string, flavor?: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = hitRadiusMultFor({ ...upgrades, [id]: 0 });
    const withIt = hitRadiusMultFor({ ...upgrades, [id]: 1 });
    const bonus = `+${amountLabel} hit radius (${formatHitRadiusMult(without)} → ${formatHitRadiusMult(withIt)}).`;
    return flavor ? `${flavor} ${bonus}` : bonus;
  };
}

export function collateralBonusFor(power: number): number {
  return Math.max(COLLATERAL_DAMAGE_MIN, Math.round(power * COLLATERAL_DAMAGE_RATIO));
}

export function critChanceFor(upgrades: UpgradeLevels): number {
  let chance = getEquippedStick().critChance;
  for (const [id, amount] of Object.entries(CRIT_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function critDamageMultFor(upgrades: UpgradeLevels): number {
  let bonus = 0;
  for (const [id, amount] of Object.entries(CRIT_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) bonus += amount;
  }
  return CRIT_DAMAGE_MULT * (1 + bonus);
}

export function formatCritMult(mult: number): string {
  const rounded = Math.round(mult * 100) / 100;
  return `${formatNumber(rounded)}x`;
}

export function firstHitBonusFor(power: number, upgrades?: UpgradeLevels): number {
  if (!upgrades) return Math.max(1, Math.round(power * FIRST_HIT_DAMAGE_RATIO));
  let bonus = 0;
  if (upgrades.firstHitDamage >= 1) {
    bonus += Math.max(1, Math.round(power * FIRST_HIT_DAMAGE_RATIO));
  }
  if (upgrades.moreFirstHitDamage >= 1) {
    bonus += Math.max(1, Math.round(power * MORE_FIRST_HIT_DAMAGE_RATIO));
  }
  return bonus;
}

export function switchDamageBonusFor(power: number): number {
  return Math.max(1, Math.round(power * SWITCH_DAMAGE_RATIO));
}

export function divineRayStrikesFor(upgrades: UpgradeLevels): number {
  let strikes = DIVINE_RAY.strikes;
  for (const [id, amount] of Object.entries(DIVINE_RAY_STRIKES_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) strikes += amount;
  }
  return strikes;
}

export function divineRayRadiusFor(upgrades: UpgradeLevels): number {
  let radius = DIVINE_RAY.radius;
  for (const [id, amount] of Object.entries(DIVINE_RAY_RADIUS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) radius += amount;
  }
  return radius;
}

export function divineRayChanceFor(upgrades: UpgradeLevels): number {
  let chance = DIVINE_RAY.chance;
  for (const [id, amount] of Object.entries(DIVINE_RAY_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function divineRayDamageBonusFor(power: number, ratio: number): number {
  return Math.max(DIVINE_RAY.minDamage, Math.floor(power * ratio));
}

export function divineRayDamageFor(power: number, upgrades: UpgradeLevels = emptyUpgrades()): number {
  const base = Math.max(DIVINE_RAY.minDamage, Math.floor(power * DIVINE_RAY.damageRatio));
  let extra = 0;
  for (const [id, ratio] of Object.entries(DIVINE_RAY_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += divineRayDamageBonusFor(power, ratio);
  }
  return base + extra;
}

export function pinataShockwaveRadiusFor(upgrades: UpgradeLevels): number {
  let radius = PINATA_SHOCKWAVE.radius;
  for (const [id, amount] of Object.entries(PINATA_SHOCKWAVE_RADIUS_BONUS) as [
    UpgradeId,
    number,
  ][]) {
    if (upgrades[id] >= 1) radius += amount;
  }
  return radius;
}

export function pinataShockwaveChanceFor(upgrades: UpgradeLevels): number {
  let chance = PINATA_SHOCKWAVE.chance;
  for (const [id, amount] of Object.entries(PINATA_SHOCKWAVE_CHANCE_BONUS) as [
    UpgradeId,
    number,
  ][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function pinataShockwaveDamageBonusFor(power: number, ratio: number): number {
  return Math.max(PINATA_SHOCKWAVE.minDamage, Math.floor(power * ratio));
}

export function pinataShockwaveDamageFor(
  power: number,
  upgrades: UpgradeLevels = emptyUpgrades(),
): number {
  const base = Math.max(PINATA_SHOCKWAVE.minDamage, Math.floor(power * PINATA_SHOCKWAVE.damageRatio));
  let extra = 0;
  for (const [id, ratio] of Object.entries(PINATA_SHOCKWAVE_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += pinataShockwaveDamageBonusFor(power, ratio);
  }
  return base + extra;
}

export function rockRainDamageBonusFor(power: number, ratio: number): number {
  return Math.max(ROCK_RAIN.minDamage, Math.round(power * ratio));
}

export function rockRainDamageFor(
  power: number,
  upgrades: UpgradeLevels = emptyUpgrades(),
): number {
  const base = Math.max(ROCK_RAIN.minDamage, Math.round(power * ROCK_RAIN.damageRatio));
  let extra = 0;
  for (const [id, ratio] of Object.entries(ROCK_RAIN_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += rockRainDamageBonusFor(power, ratio);
  }
  return base + extra;
}

export function rockRainChanceFor(upgrades: UpgradeLevels): number {
  let chance = ROCK_RAIN.chance;
  for (const [id, amount] of Object.entries(ROCK_RAIN_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function rockRainRocksFor(upgrades: UpgradeLevels): number {
  let rocks = ROCK_RAIN.rocks;
  for (const [id, amount] of Object.entries(ROCK_RAIN_ROCKS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) rocks += amount;
  }
  return rocks;
}

export function rockRainRadiusFor(upgrades: UpgradeLevels): number {
  let radius = ROCK_RAIN.hitRadius;
  for (const [id, amount] of Object.entries(ROCK_RAIN_RADIUS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) radius += amount;
  }
  return radius;
}

export function oneSmashChanceFor(upgrades: UpgradeLevels): number {
  if (upgrades.oneSmash < 1) return 0;
  let chance = ONE_SMASH.chance;
  for (const [id, amount] of Object.entries(ONE_SMASH_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function lowHpDamageBonusFor(
  power: number,
  hpRatio: number,
  upgrades: UpgradeLevels,
): number {
  if (upgrades.moreDamage7 < 1) return 0;
  if (hpRatio >= LOW_HP_DAMAGE.hpThreshold) return 0;
  return Math.max(LOW_HP_DAMAGE.minDamage, Math.round(power * LOW_HP_DAMAGE.damageRatio));
}

export function lastStandDamageRatioFor(upgrades: UpgradeLevels): number {
  let ratio = LAST_STAND.damageRatio;
  for (const [id, amount] of Object.entries(LAST_STAND_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) ratio += amount;
  }
  return ratio;
}

export function lastStandDamageFor(power: number, upgrades: UpgradeLevels = emptyUpgrades()): number {
  return Math.max(LAST_STAND.minDamage, Math.round(power * lastStandDamageRatioFor(upgrades)));
}

export function luckySevenLootBonusFor(upgrades: UpgradeLevels): number {
  if (upgrades.luckySeven2 >= 1) return LUCKY_SEVEN.lootBonus2;
  if (upgrades.luckySeven >= 1) return LUCKY_SEVEN.lootBonus;
  return 0;
}

export function superJackpotChanceFor(upgrades: UpgradeLevels): number {
  let chance = SUPER_JACKPOT.chance;
  for (const [id, amount] of Object.entries(SUPER_JACKPOT_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function comboBonusPerStackFor(basePower: number): number {
  return Math.max(COMBO.minDamage, Math.round(basePower * COMBO.damageRatio));
}

export function comboBonusFor(basePower: number, combo: number, upgrades?: UpgradeLevels): number {
  const stacks = Math.floor(Math.max(0, combo) / COMBO.hitsPerStack);
  if (stacks <= 0) return 0;
  let perStack = comboBonusPerStackFor(basePower);
  if (upgrades) {
    for (const id of MORE_COMBO_DAMAGE_IDS) {
      if (upgrades[id] >= 1) perStack += comboBonusPerStackFor(basePower);
    }
  }
  return stacks * perStack;
}

export function shockwaveChanceFor(upgrades: UpgradeLevels): number {
  let chance = SHOCKWAVE.chance;
  for (const [id, amount] of Object.entries(SHOCKWAVE_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function shockwaveDamageBonusFor(
  power: number,
  ratio: number = SHOCKWAVE.damageBonusRatio,
): number {
  return Math.max(SHOCKWAVE.minDamage, Math.floor(power * ratio));
}

export function shockwaveDamageFor(power: number, upgrades: UpgradeLevels): number {
  const base = Math.max(SHOCKWAVE.minDamage, Math.floor(power * SHOCKWAVE.damageRatio));
  let extra = 0;
  for (const [id, ratio] of Object.entries(SHOCKWAVE_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += shockwaveDamageBonusFor(power, ratio);
  }
  return base + extra;
}

function shockwaveChanceDescription(id: UpgradeId, pctLabel: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = shockwaveChanceFor({ ...upgrades, [id]: 0 });
    const withIt = shockwaveChanceFor({ ...upgrades, [id]: 1 });
    return `Crackwaves are +${pctLabel} more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

export function phantomChanceFor(upgrades: UpgradeLevels): number {
  let chance = PHANTOM_STICK.chance;
  for (const [id, amount] of Object.entries(PHANTOM_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function phantomTargetsFor(upgrades: UpgradeLevels): number {
  let targets = PHANTOM_STICK.targets;
  for (const [id, amount] of Object.entries(PHANTOM_TARGETS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) targets += amount;
  }
  return targets;
}

export function phantomDamageBonusFor(power: number, ratio: number = PHANTOM_STICK.damageBonusRatio): number {
  return Math.max(PHANTOM_STICK.minDamage, Math.round(power * ratio));
}

export function phantomDamageFor(power: number, upgrades: UpgradeLevels): number {
  const base = Math.max(PHANTOM_STICK.minDamage, Math.round(power * PHANTOM_STICK.damageRatio));
  let extra = 0;
  for (const [id, ratio] of Object.entries(PHANTOM_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += phantomDamageBonusFor(power, ratio);
  }
  return base + extra;
}

function phantomChanceDescription(id: UpgradeId) {
  return (upgrades: UpgradeLevels): string => {
    const without = phantomChanceFor({ ...upgrades, [id]: 0 });
    const withIt = phantomChanceFor({ ...upgrades, [id]: 1 });
    return `Ghost Stick is +2% more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

export function igniteDamageBonusFor(power: number, ratio: number): number {
  return Math.max(IGNITE.minDamage, Math.floor(power * ratio));
}

export function igniteDamageFor(power: number, upgrades: UpgradeLevels = emptyUpgrades()): number {
  const base = Math.max(IGNITE.minDamage, Math.floor(power * IGNITE.damageRatio));
  let extra = 0;
  for (const [id, ratio] of Object.entries(IGNITE_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += igniteDamageBonusFor(power, ratio);
  }
  return base + extra;
}

export function igniteChanceFor(upgrades: UpgradeLevels): number {
  let chance = IGNITE.chance;
  for (const [id, amount] of Object.entries(IGNITE_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function igniteDurationFor(upgrades: UpgradeLevels): number {
  let duration = IGNITE.durationSec;
  for (const [id, amount] of Object.entries(IGNITE_DURATION_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) duration += amount;
  }
  return duration;
}

export function lightningChanceFor(upgrades: UpgradeLevels): number {
  let chance = LIGHTNING.chance;
  for (const [id, amount] of Object.entries(LIGHTNING_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function lightningTargetsFor(upgrades: UpgradeLevels): number {
  let targets = LIGHTNING.targets;
  for (const [id, amount] of Object.entries(LIGHTNING_TARGETS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) targets += amount;
  }
  return targets;
}

export function lightningRaysFor(upgrades: UpgradeLevels): number {
  let rays = 1;
  for (const [id, amount] of Object.entries(LIGHTNING_RAYS_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) rays += amount;
  }
  return rays;
}

export function lightningDamageBonusFor(
  power: number,
  ratio: number = LIGHTNING.damageBonusRatio,
): number {
  return Math.max(LIGHTNING.minDamage, Math.floor(power * ratio));
}

export function lightningDamageFor(power: number, upgrades: UpgradeLevels): number {
  const base = Math.max(LIGHTNING.minDamage, Math.floor(power * LIGHTNING.damageRatio));
  let extra = 0;
  for (const [id, ratio] of Object.entries(LIGHTNING_DAMAGE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) extra += lightningDamageBonusFor(power, ratio);
  }
  return base + extra;
}

function lightningChanceDescription(id: UpgradeId, flavor?: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = lightningChanceFor({ ...upgrades, [id]: 0 });
    const withIt = lightningChanceFor({ ...upgrades, [id]: 1 });
    const bonus = `+2% trigger chance (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    return flavor ? `${flavor} ${bonus}` : `Sky Spark is +2% more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

export function rageChanceFor(upgrades: UpgradeLevels): number {
  let chance = RAGE_MODE.chance;
  for (const [id, amount] of Object.entries(RAGE_CHANCE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

export function rageDurationFor(upgrades: UpgradeLevels): number {
  let duration = RAGE_MODE.durationSec;
  for (const [id, amount] of Object.entries(RAGE_DURATION_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) duration += amount;
  }
  return duration;
}

export function rageSpeedBonusFor(upgrades: UpgradeLevels): number {
  let bonus = RAGE_MODE.speedBonus;
  for (const [id, amount] of Object.entries(RAGE_SPEED_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) bonus += amount;
  }
  return bonus;
}

function rageChanceDescription(id: UpgradeId) {
  return (upgrades: UpgradeLevels): string => {
    const without = rageChanceFor({ ...upgrades, [id]: 0 });
    const withIt = rageChanceFor({ ...upgrades, [id]: 1 });
    return `Fiesta Frenzy is +2% more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

export function tantrumDamageFor(power: number): number {
  return Math.max(TANTRUM.minDamage, Math.round(power * TANTRUM.damageRatio));
}

export function secondWindRestoreFor(upgrades: UpgradeLevels): number {
  if (upgrades.secondWind < 1) return 0;
  let restore = SECOND_WIND_RESTORE;
  for (const [id, amount] of Object.entries(SECOND_WIND_RESTORE_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) restore += amount;
  }
  return restore;
}

export function secondWindBoostDamageFor(power: number): number {
  return Math.max(SECOND_WIND_BOOST.minDamage, Math.round(power * SECOND_WIND_BOOST.damageRatio));
}

export function tantrumDurationFor(upgrades: UpgradeLevels): number {
  let duration = TANTRUM.durationSec;
  for (const [id, amount] of Object.entries(TANTRUM_DURATION_MULT) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) duration *= amount;
  }
  return duration;
}

export function breakRespawnChanceFor(upgrades: UpgradeLevels): number {
  let chance = 0;
  for (const [id, amount] of Object.entries(BREAK_RESPAWN_BONUS) as [UpgradeId, number][]) {
    if (upgrades[id] >= 1) chance += amount;
  }
  return chance;
}

function respawnChanceDescription(id: UpgradeId, pctLabel: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = breakRespawnChanceFor({ ...upgrades, [id]: 0 });
    const withIt = breakRespawnChanceFor({ ...upgrades, [id]: 1 });
    return `When a piñata is destroyed, there is a +${pctLabel} chance a new one spawns (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function rockRainChanceDescription(id: UpgradeId) {
  return (upgrades: UpgradeLevels): string => {
    const without = rockRainChanceFor({ ...upgrades, [id]: 0 });
    const withIt = rockRainChanceFor({ ...upgrades, [id]: 1 });
    return `Shard Rain is +2% more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function oneSmashChanceDescription(id: UpgradeId) {
  return (upgrades: UpgradeLevels): string => {
    const without = oneSmashChanceFor({ ...upgrades, [id]: 0 });
    const withIt = oneSmashChanceFor({ ...upgrades, [id]: 1 });
    return `+1% chance to instantly shatter any piñata (${formatPercent(without)} → ${formatPercent(withIt)}).`;
  };
}

function critChanceDescription(id: UpgradeId, pctLabel: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = critChanceFor({ ...upgrades, [id]: 0 });
    const withIt = critChanceFor({ ...upgrades, [id]: 1 });
    return `+${pctLabel} critical chance (${formatPercent(without)} → ${formatPercent(withIt)}). Critical hits deal ${formatCritMult(critDamageMultFor(upgrades))} damage.`;
  };
}

function critDamageDescription(id: UpgradeId, pctLabel: string, flavor?: string) {
  return (upgrades: UpgradeLevels): string => {
    const without = critDamageMultFor({ ...upgrades, [id]: 0 });
    const withIt = critDamageMultFor({ ...upgrades, [id]: 1 });
    const bonus = `Crits do +${pctLabel} more damage (${formatCritMult(without)} → ${formatCritMult(withIt)}).`;
    return flavor ? `${flavor} ${bonus}` : bonus;
  };
}

export function startingPinataCountFor(upgrades: UpgradeLevels): number {
  let count = BASE.startingPinatas;
  for (const id of MORE_PINATAS_IDS) {
    if (upgrades[id] >= 1) count += MORE_PINATAS_BONUS;
  }
  return count;
}

export function timedSpawnIntervalFor(upgrades: UpgradeLevels): number {
  if (upgrades.fasterSpawns >= 1) return FASTER_SPAWNS_INTERVAL_SEC;
  return TIMED_SPAWN_INTERVAL_SEC;
}

function morePinatasDescription(id: UpgradeId) {
  return (upgrades: UpgradeLevels): string => {
    const without = startingPinataCountFor({ ...upgrades, [id]: 0 });
    const withIt = startingPinataCountFor({ ...upgrades, [id]: 1 });
    return `Start each round with +2 more piñatas (${formatNumber(without)} → ${formatNumber(withIt)}).`;
  };
}

export function upgradeDescription(
  def: UpgradeDef,
  upgrades: UpgradeLevels,
  unlockedPinataTypes = 0,
  totalBreaks = 0,
  staminaUsed = 0,
): string {
  return typeof def.description === "function"
    ? def.description(upgrades, unlockedPinataTypes, totalBreaks, staminaUsed)
    : def.description;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "power",
    name: "Harder Hits",
    description: "+1 damage per hit.",
    maxLevel: 1,
    costs: [1],
  },
  {
    id: "swing",
    name: "Faster Swings",
    description: attackSpeedDescription("swing", "25%"),
    maxLevel: 1,
    costs: [12],
    requires: ["power"],
  },
  {
    id: "sugarRush",
    name: "Candy Buzz",
    description: attackSpeedDescription("sugarRush", "20%"),
    maxLevel: 1,
    costs: [50],
    requires: ["swing"],
  },
  {
    id: "lightningStrike",
    name: "Sky Spark",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const chance = formatPercent(lightningChanceFor(upgrades));
      const targets = lightningTargetsFor(upgrades);
      const rays = lightningRaysFor(upgrades);
      const dmg = lightningDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks), upgrades);
      if (rays > 1) {
        return `${chance} chance on hit to split Sky Spark into ${formatNumber(rays)} rays that each hit ${formatNumber(targets)} nearby piñatas for ${formatNumber(dmg)} damage (minimum 1).`;
      }
      return `${chance} chance on hit to chain Sky Spark to ${formatNumber(targets)} nearby piñatas for ${formatNumber(dmg)} damage each (minimum 1).`;
    },
    maxLevel: 1,
    costs: [600],
    requires: ["sugarRush"],
  },
  {
    id: "lightningChance",
    name: "Sky Spark Chance",
    description: lightningChanceDescription("lightningChance"),
    maxLevel: 1,
    costs: [1600],
    requires: ["lightningStrike"],
  },
  {
    id: "lightningChance2",
    name: "Sky Spark Chance",
    description: lightningChanceDescription("lightningChance2", "More frequent sparks."),
    maxLevel: 1,
    costs: [3100],
    requires: ["lightningChance"],
  },
  {
    id: "lightningChance3",
    name: "Sky Spark Chance",
    description: lightningChanceDescription("lightningChance3", "Constant sparks."),
    maxLevel: 1,
    costs: [1000000],
    requires: ["lightningChance2"],
  },
  {
    id: "lightningMoreTargets",
    name: "More Sparks",
    description: (upgrades) => {
      const without = lightningTargetsFor({ ...upgrades, lightningMoreTargets: 0 });
      const withIt = lightningTargetsFor({ ...upgrades, lightningMoreTargets: 1 });
      return `Sky Spark arcs to +2 extra targets (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["lightningStrike"],
  },
  {
    id: "lightningMoreTargets2",
    name: "More Sparks",
    description: (upgrades) => {
      const without = lightningTargetsFor({ ...upgrades, lightningMoreTargets2: 0 });
      const withIt = lightningTargetsFor({ ...upgrades, lightningMoreTargets2: 1 });
      return `Sky Spark hits +2 extra targets (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [6500],
    requires: ["lightningMoreTargets"],
  },
  {
    id: "lightningMoreRays",
    name: "Extra Sparks",
    description: (upgrades) => {
      const without = lightningRaysFor({ ...upgrades, lightningMoreRays: 0 });
      const withIt = lightningRaysFor({ ...upgrades, lightningMoreRays: 1 });
      return `Sky Spark splits into +1 extra rays (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [1000000],
    requires: ["lightningMoreTargets2"],
  },
  {
    id: "lightningDamage",
    name: "Sky Spark Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = lightningDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        LIGHTNING_DAMAGE_BONUS.lightningDamage,
      );
      return `+${formatNumber(extra)} damage on each lightning ray (35% of your base damage).`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["lightningStrike"],
  },
  {
    id: "lightningDamage2",
    name: "Sky Spark Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = lightningDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        LIGHTNING_DAMAGE_BONUS.lightningDamage2,
      );
      return `+${formatNumber(extra)} damage on each lightning ray (15% of your base damage).`;
    },
    maxLevel: 1,
    costs: [6500],
    requires: ["lightningDamage"],
  },
  {
    id: "lightningDamage3",
    name: "Sky Spark Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = lightningDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        LIGHTNING_DAMAGE_BONUS.lightningDamage3,
      );
      return `+${formatNumber(extra)} damage on each lightning ray (10% of your base damage).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["lightningDamage2"],
  },
  {
    id: "moreSpeed",
    name: "Quicker Swings",
    description: attackSpeedDescription("moreSpeed", "15%"),
    maxLevel: 1,
    costs: [450],
    requires: ["sugarRush"],
  },
  {
    id: "rageMode",
    name: "Fiesta Frenzy",
    description: (upgrades) => {
      const chance = formatPercent(rageChanceFor(upgrades));
      const duration = rageDurationFor(upgrades);
      const speed = formatPercent(rageSpeedBonusFor(upgrades));
      return `Every 10th hit has a ${chance} chance to trigger Fiesta Frenzy, granting +${speed} attack speed for ${duration}s.`;
    },
    maxLevel: 1,
    costs: [1600],
    requires: ["moreSpeed"],
  },
  {
    id: "rageDuration",
    name: "Frenzy Duration",
    description: (upgrades) => {
      const without = rageDurationFor({ ...upgrades, rageDuration: 0 });
      const withIt = rageDurationFor({ ...upgrades, rageDuration: 1 });
      return `Fiesta Frenzy lasts longer (${without}s → ${withIt}s).`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["rageMode"],
  },
  {
    id: "rageDuration2",
    name: "Frenzy Duration",
    description: (upgrades) => {
      const without = rageDurationFor({ ...upgrades, rageDuration2: 0 });
      const withIt = rageDurationFor({ ...upgrades, rageDuration2: 1 });
      return `Even longer Fiesta Frenzy (${without}s → ${withIt}s).`;
    },
    maxLevel: 1,
    costs: [100000],
    requires: ["rageDuration"],
  },
  {
    id: "rageChance",
    name: "Frenzy Chance",
    description: rageChanceDescription("rageChance"),
    maxLevel: 1,
    costs: [3100],
    requires: ["rageMode"],
  },
  {
    id: "rageChance2",
    name: "Frenzy Chance",
    description: rageChanceDescription("rageChance2"),
    maxLevel: 1,
    costs: [200000],
    requires: ["rageChance"],
  },
  {
    id: "rageSpeed",
    name: "Frenzy Speed",
    description: (upgrades) => {
      const without = rageSpeedBonusFor({ ...upgrades, rageSpeed: 0 });
      const withIt = rageSpeedBonusFor({ ...upgrades, rageSpeed: 1 });
      return `+10% attack speed bonus during Fiesta Frenzy (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [200000],
    requires: ["rageDuration", "rageChance"],
  },
  {
    id: "rageSpeed2",
    name: "Frenzy Speed",
    description: (upgrades) => {
      const without = rageSpeedBonusFor({ ...upgrades, rageSpeed2: 0 });
      const withIt = rageSpeedBonusFor({ ...upgrades, rageSpeed2: 1 });
      return `+50% attack speed bonus during Fiesta Frenzy (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [330000],
    requires: ["rageSpeed"],
  },
  {
    id: "moreSpeed2",
    name: "Quicker Swings",
    description: attackSpeedDescription("moreSpeed2", "10%"),
    maxLevel: 1,
    costs: [1300],
    requires: ["moreSpeed"],
  },
  {
    id: "tantrum",
    name: "Blindfold Fury",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = tantrumDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      const duration = tantrumDurationFor(upgrades);
      return `Miss 2 swings in a row and fly into a Blindfold Fury! +${formatNumber(extra)} damage on every hit (20% of your base damage) for ${duration}s.`;
    },
    maxLevel: 1,
    costs: [6000],
    requires: ["moreSpeed2"],
  },
  {
    id: "tantrumDuration",
    name: "Fury Duration",
    description: (upgrades) => {
      const without = tantrumDurationFor({ ...upgrades, tantrumDuration: 0 });
      const withIt = tantrumDurationFor({ ...upgrades, tantrumDuration: 1 });
      return `Blindfold Fury lasts 50% longer (${without}s → ${withIt}s).`;
    },
    maxLevel: 1,
    costs: [200000],
    requires: ["tantrum"],
  },
  {
    id: "moreSpeed3",
    name: "Quicker Swings",
    description: attackSpeedDescription("moreSpeed3", "5%"),
    maxLevel: 1,
    costs: [600000],
    requires: ["tantrum"],
  },
  {
    id: "efficientWings",
    name: "Light Stick",
    description: (upgrades, _types = 0, _breaks = 0, staminaUsed = 0) => {
      const without = drainRateFor({ ...upgrades, efficientWings: 0 }, staminaUsed);
      const withIt = drainRateFor({ ...upgrades, efficientWings: 1 }, staminaUsed);
      const cut = efficientWingsDrainCutFor({ ...upgrades, efficientWings: 1 }, staminaUsed);
      return `Attack speed bonuses reduce energy drain by ${formatPercent(cut)} (${formatDrainRate(without)} → ${formatDrainRate(withIt)}).`;
    },
    maxLevel: 1,
    costs: [330000],
    requires: ["moreSpeed3"],
  },
  {
    id: "ignite",
    name: "Sparkler",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const dmg = igniteDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks), upgrades);
      const chance = formatPercent(igniteChanceFor(upgrades));
      const duration = igniteDurationFor(upgrades);
      return `Stick hits have a ${chance} chance to set piñatas on fire, dealing ${formatNumber(dmg)} damage (25% of your base damage) every 0.5s for ${duration}s.`;
    },
    maxLevel: 1,
    costs: [2000],
    requires: ["moreSpeed"],
  },
  {
    id: "igniteChance",
    name: "Sparkler Chance",
    description: (upgrades) => {
      const without = igniteChanceFor({ ...upgrades, igniteChance: 0 });
      const withIt = igniteChanceFor({ ...upgrades, igniteChance: 1 });
      return `Stick hits gain +2% sparkler chance (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["ignite"],
  },
  {
    id: "igniteChance2",
    name: "Sparkler Chance",
    description: (upgrades) => {
      const without = igniteChanceFor({ ...upgrades, igniteChance2: 0 });
      const withIt = igniteChanceFor({ ...upgrades, igniteChance2: 1 });
      return `Stick hits gain +2% sparkler chance (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [200000],
    requires: ["igniteChance"],
  },
  {
    id: "fireDuration",
    name: "Sparkler Duration",
    description: (upgrades) => {
      const without = igniteDurationFor({ ...upgrades, fireDuration: 0 });
      const withIt = igniteDurationFor({ ...upgrades, fireDuration: 1 });
      return `Sparkler lasts longer (${without}s → ${withIt}s).`;
    },
    maxLevel: 1,
    costs: [100000],
    requires: ["igniteChance"],
  },
  {
    id: "fireDuration2",
    name: "Sparkler Duration",
    description: (upgrades) => {
      const without = igniteDurationFor({ ...upgrades, fireDuration2: 0 });
      const withIt = igniteDurationFor({ ...upgrades, fireDuration2: 1 });
      return `Sparkler lasts longer (${without}s → ${withIt}s).`;
    },
    maxLevel: 1,
    costs: [165000],
    requires: ["fireDuration"],
  },
  {
    id: "fireDamage",
    name: "Sparkler Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = igniteDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        IGNITE_DAMAGE_BONUS.fireDamage,
      );
      return `+${formatNumber(extra)} damage when Sparkler deals damage (15% of your base damage).`;
    },
    maxLevel: 1,
    costs: [600000],
    requires: ["fireDuration"],
  },
  {
    id: "fireDamage2",
    name: "Sparkler Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = igniteDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        IGNITE_DAMAGE_BONUS.fireDamage2,
      );
      return `+${formatNumber(extra)} damage when Sparkler deals damage (15% of your base damage).`;
    },
    maxLevel: 1,
    costs: [850000],
    requires: ["fireDamage"],
  },
  {
    id: "burningChain",
    name: "Sparkler Spread",
    description: `When a burning piñata is destroyed, fire has a +${formatPercent(BURNING_CHAIN.chance)} chance to spread to nearby piñatas.`,
    maxLevel: 1,
    costs: [950000],
    requires: ["fireDamage2", "fireDuration2", "igniteChance2"],
  },
  {
    id: "doubleHit",
    name: "Double Swing",
    description: "5% chance to hit twice. A missed double swing doesn't count toward accuracy.",
    maxLevel: 1,
    costs: [1200],
    requires: ["sugarRush"],
  },
  {
    id: "combo",
    name: "Hit Streak",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = comboBonusPerStackFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `Unlock Hit Streak. Every 10 streak hits add +${formatNumber(extra)} damage (2% of your base damage, minimum +1). Miss and it resets to 0.`;
    },
    maxLevel: 1,
    costs: [2000],
    requires: ["doubleHit"],
  },
  {
    id: "moreComboDamage",
    name: "Streak Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = comboBonusPerStackFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `Every 10 streak hits add +${formatNumber(extra)} more damage (2% of your base damage, minimum +1).`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["combo"],
  },
  {
    id: "moreComboDamage2",
    name: "Streak Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = comboBonusPerStackFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `Every 10 streak hits add +${formatNumber(extra)} more of your base damage (2% of your base damage, minimum +1).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["moreComboDamage"],
  },
  {
    id: "moreComboDamage3",
    name: "Streak Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = comboBonusPerStackFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `Building momentum. Every 10 streak hits add +${formatNumber(extra)} damage (2% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1150000],
    requires: ["moreComboDamage2"],
  },
  {
    id: "comboSaver",
    name: "Streak Saver",
    description: `While your energy is below ${formatPercent(COMBO_SAVER.staminaThreshold)}, one missed swing does not break your hit streak.`,
    maxLevel: 1,
    costs: [330000],
    requires: ["moreComboDamage2"],
  },
  {
    id: "moreComboDamage4",
    name: "Streak Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = comboBonusPerStackFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `Unstoppable momentum. Every 10 streak hits add +${formatNumber(extra)} damage (2% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1500000],
    requires: ["moreComboDamage3"],
  },
  {
    id: "comboSpeedBonus",
    name: "Streak Speed",
    description: `At ${COMBO_SPEED_BONUS.combo}+ hit streak: +${formatPercent(COMBO_SPEED_BONUS.speedBonus)} attack speed.`,
    maxLevel: 1,
    costs: [1600000],
    requires: ["moreComboDamage4", "comboSaver"],
  },
  {
    id: "stamina",
    name: "Party Energy",
    description: maxStaminaDescription("stamina", 20),
    maxLevel: 1,
    costs: [12],
    requires: ["power"],
  },
  {
    id: "energyDrink",
    name: "Sugar Fuel",
    description: maxStaminaDescription("energyDrink", 10),
    maxLevel: 1,
    costs: [25],
    requires: ["stamina"],
  },
  {
    id: "restoreChance",
    name: "Candy Restore",
    description: "Destroying a piñata has a +4% chance to restore +2 energy.",
    maxLevel: 1,
    costs: [1100],
    requires: ["energyDrink"],
  },
  {
    id: "restoreChance2",
    name: "Candy Restore",
    description: "Destroying a piñata has an extra +4% chance to restore +3 energy.",
    maxLevel: 1,
    costs: [2700],
    requires: ["restoreChance"],
  },
  {
    id: "restoreChance3",
    name: "Candy Restore",
    description: "Destroying a piñata has an extra +4% chance to restore +3 energy.",
    maxLevel: 1,
    costs: [50000],
    requires: ["restoreChance2"],
  },
  {
    id: "moreStamina",
    name: "Bigger Energy I",
    description: maxStaminaDescription("moreStamina", 10, "more"),
    maxLevel: 1,
    costs: [1500],
    requires: ["energyDrink"],
  },
  {
    id: "moreStamina2",
    name: "Bigger Energy II",
    description: maxStaminaDescription("moreStamina2", 10),
    maxLevel: 1,
    costs: [3500],
    requires: ["moreStamina"],
  },
  {
    id: "speedFromStamina",
    name: "Winded Speed",
    description: (upgrades, _types = 0, _breaks = 0, staminaUsed = 0) => {
      const without = swingRateFor({ ...upgrades, speedFromStamina: 0 }, staminaUsed);
      const withIt = swingRateFor({ ...upgrades, speedFromStamina: 1 }, staminaUsed);
      const used = Math.max(0, Math.floor(staminaUsed));
      return `+1% attack speed per 20 energy used this run (${formatNumber(used)} used, ${formatSwingRate(without)} → ${formatSwingRate(withIt)}).`;
    },
    maxLevel: 1,
    costs: [6500],
    requires: ["moreStamina2"],
  },
  {
    id: "stackingDamage",
    name: "Winded Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0, staminaUsed = 0) => {
      const extra = stackingDamagePerStackFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
      );
      const used = Math.max(0, Math.floor(staminaUsed));
      const bonus = stackingDamageFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        staminaUsed,
      );
      return `+${formatNumber(extra)} damage per 25 energy used this run (2% of your base damage, minimum +1) (${formatNumber(used)} used, +${formatNumber(bonus)}).`;
    },
    maxLevel: 1,
    costs: [4500],
    requires: ["moreStamina2"],
  },
  {
    id: "moreStamina3",
    name: "Bigger Energy III",
    description: maxStaminaDescription("moreStamina3", 10),
    maxLevel: 1,
    costs: [1000000],
    requires: ["speedFromStamina", "stackingDamage"],
  },
  {
    id: "gripStrength",
    name: "Steady Stick",
    description: drainReductionDescription("gripStrength", "0.5"),
    maxLevel: 1,
    costs: [800],
    requires: ["energyDrink"],
  },
  {
    id: "megaGrip",
    name: "Firmer Grip",
    description: drainReductionDescription("megaGrip", "0.5", "A firmer grip, less effort."),
    maxLevel: 1,
    costs: [1250],
    requires: ["gripStrength"],
  },
  {
    id: "lowStaminaBonus",
    name: "Empty-Arm Loot",
    description: `Destroy piñatas while your energy is below ${formatPercent(LOW_STAMINA_BONUS.staminaThreshold)} to gain +${formatPercent(LOW_STAMINA_BONUS.lootBonus)} bonus loot.`,
    maxLevel: 1,
    costs: [25000],
    requires: ["megaGrip"],
  },
  {
    id: "lowStaminaDamage",
    name: "Empty-Arm Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = Math.max(
        LOW_STAMINA_DAMAGE.minDamage,
        Math.round(
          powerFor(upgrades, unlockedPinataTypes, totalBreaks) * LOW_STAMINA_DAMAGE.damageRatio,
        ),
      );
      return `While your energy is below ${formatPercent(LOW_STAMINA_DAMAGE.staminaThreshold)}, every hit deals +${formatNumber(extra)} extra damage (50% of your base damage).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["lowStaminaBonus"],
  },
  {
    id: "lastStand",
    name: "Last Swing",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const dmg = lastStandDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks), upgrades);
      const ratio = lastStandDamageRatioFor(upgrades);
      return `Unlock Last Swing. When energy runs out, fire at every piñata for ${formatNumber(dmg)} damage each (${formatPercent(ratio)} of your base damage).`;
    },
    maxLevel: 1,
    costs: [5000000],
    requires: ["lowStaminaDamage"],
  },
  {
    id: "partingShot",
    name: "Last Swing Shot I",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const power = powerFor(upgrades, unlockedPinataTypes, totalBreaks);
      const without = lastStandDamageFor(power, { ...upgrades, partingShot: 0 });
      const withIt = lastStandDamageFor(power, { ...upgrades, partingShot: 1 });
      return `+20% of your base damage on each Last Swing shot (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [30000000],
    requires: ["lastStand"],
  },
  {
    id: "lastStandDamage",
    name: "Last Swing Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const power = powerFor(upgrades, unlockedPinataTypes, totalBreaks);
      const without = lastStandDamageFor(power, { ...upgrades, lastStandDamage: 0 });
      const withIt = lastStandDamageFor(power, { ...upgrades, lastStandDamage: 1 });
      return `+30% of your base damage on each Last Swing shot (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [35000000],
    requires: ["partingShot"],
  },
  {
    id: "lowStaminaSpeed",
    name: "Empty-Arm Speed",
    description: (upgrades, _types = 0, _breaks = 0, staminaUsed = 0) => {
      const without = swingRateFor({ ...upgrades, lowStaminaSpeed: 0 }, staminaUsed);
      const withIt = without + BASE.swingRate * LOW_STAMINA_SPEED.speedBonus;
      return `While your energy is below ${formatPercent(LOW_STAMINA_SPEED.staminaThreshold)}, gain +10% attack speed (${formatSwingRate(without)} → ${formatSwingRate(withIt)}).`;
    },
    maxLevel: 1,
    costs: [600000],
    requires: ["lowStaminaBonus"],
  },
  {
    id: "secondWind",
    name: "Catch Breath",
    description: (upgrades) => {
      const restore = secondWindRestoreFor({ ...upgrades, secondWind: 1 });
      return `When energy runs out, restore ${formatPercent(restore)}. Once per run.`;
    },
    maxLevel: 1,
    costs: [1100000],
    requires: ["lowStaminaSpeed"],
  },
  {
    id: "secondWindBoost",
    name: "Catch Breath Boost",
    description: (upgrades) => {
      const without = secondWindRestoreFor({ ...upgrades, secondWindBoost: 0, secondWind: 1 });
      const withIt = secondWindRestoreFor({ ...upgrades, secondWindBoost: 1, secondWind: 1 });
      return `Catch Breath restores +10% more energy (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [4000000],
    requires: ["secondWind"],
  },
  {
    id: "secondWindBoost2",
    name: "Catch Breath Boost",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = secondWindBoostDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `Catch Breath grants ${formatNumber(extra)} bonus damage (25% of your base damage) and +10% attack speed for ${SECOND_WIND_BOOST.durationSec}s.`;
    },
    maxLevel: 1,
    costs: [6000000],
    requires: ["secondWindBoost"],
  },
  {
    id: "hitRadius",
    name: "Bigger Stick",
    description: hitRadiusDescription("hitRadius", "0.6"),
    maxLevel: 1,
    costs: [12],
    requires: ["power"],
  },
  {
    id: "morePinatas",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas"),
    maxLevel: 1,
    costs: [30],
    requiresAny: ["swing", "hitRadius"],
  },
  {
    id: "morePinatas2",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas2"),
    maxLevel: 1,
    costs: [350],
    requires: ["morePinatas"],
  },
  {
    id: "morePinatas3",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas3"),
    maxLevel: 1,
    costs: [850],
    requires: ["morePinatas2"],
  },
  {
    id: "morePinatas4",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas4"),
    maxLevel: 1,
    costs: [1500],
    requires: ["morePinatas3"],
  },
  {
    id: "morePinatas5",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas5"),
    maxLevel: 1,
    costs: [17000],
    requires: ["morePinatas4"],
  },
  {
    id: "morePinatas6",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas6"),
    maxLevel: 1,
    costs: [40000],
    requires: ["morePinatas5"],
  },
  {
    id: "morePinatas7",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas7"),
    maxLevel: 1,
    costs: [90000],
    requires: ["morePinatas6"],
  },
  {
    id: "morePinatas8",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas8"),
    maxLevel: 1,
    costs: [450000],
    requires: ["morePinatas7"],
  },
  {
    id: "morePinatas9",
    name: "More Pinatas",
    description: morePinatasDescription("morePinatas9"),
    maxLevel: 1,
    costs: [6000000],
    requires: ["morePinatas8"],
  },
  {
    id: "timedSpawn",
    name: "Timed Drop",
    description: `New piñatas arrive every ${TIMED_SPAWN_INTERVAL_SEC} seconds during a round.`,
    maxLevel: 1,
    costs: [400],
    requires: ["morePinatas"],
  },
  {
    id: "fasterSpawns",
    name: "Faster Drops",
    description: `New piñatas arrive every ${FASTER_SPAWNS_INTERVAL_SEC} seconds during a round.`,
    maxLevel: 1,
    costs: [10000],
    requires: ["timedSpawn"],
  },
  {
    id: "respawnChance",
    name: "Extra Drop Chance",
    description: respawnChanceDescription("respawnChance", "10%"),
    maxLevel: 1,
    costs: [550],
    requires: ["morePinatas"],
  },
  {
    id: "respawnChance2",
    name: "Extra Drop Chance",
    description: respawnChanceDescription("respawnChance2", "5%"),
    maxLevel: 1,
    costs: [6500],
    requires: ["respawnChance"],
  },
  {
    id: "respawnChance3",
    name: "Extra Drop Chance",
    description: respawnChanceDescription("respawnChance3", "10%"),
    maxLevel: 1,
    costs: [350000],
    requires: ["respawnChance2"],
  },
  {
    id: "respawnChance4",
    name: "Extra Drop Chance",
    description: respawnChanceDescription("respawnChance4", "10%"),
    maxLevel: 1,
    costs: [5000000],
    requires: ["respawnChance3"],
  },
  {
    id: "respawnChance5",
    name: "Extra Drop Chance",
    description: respawnChanceDescription("respawnChance5", "10%"),
    maxLevel: 1,
    costs: [40000000],
    requires: ["respawnChance4"],
  },
  {
    id: "moreDamage",
    name: "Heavier Hits",
    description: moreDamageDescription("moreDamage"),
    maxLevel: 1,
    costs: [60],
    requires: ["hitRadius"],
  },
  {
    id: "shockwave",
    name: "Crackwave",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const chance = formatPercent(shockwaveChanceFor(upgrades));
      const dmg = shockwaveDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks), upgrades);
      return `${chance} chance on hit to unleash a crackwave for ${formatNumber(dmg)} damage to all piñatas on screen.`;
    },
    maxLevel: 1,
    costs: [600],
    requires: ["moreDamage"],
  },
  {
    id: "shockwaveChance",
    name: "Crackwave Chance",
    description: shockwaveChanceDescription("shockwaveChance", "2%"),
    maxLevel: 1,
    costs: [3100],
    requires: ["shockwave"],
  },
  {
    id: "shockwaveChance2",
    name: "Crackwave Chance",
    description: shockwaveChanceDescription("shockwaveChance2", "2%"),
    maxLevel: 1,
    costs: [6500],
    requires: ["shockwaveChance"],
  },
  {
    id: "shockwaveChance3",
    name: "Crackwave Chance",
    description: shockwaveChanceDescription("shockwaveChance3", "1%"),
    maxLevel: 1,
    costs: [1000000],
    requires: ["shockwaveChance2"],
  },
  {
    id: "shockwaveDamage",
    name: "Crackwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = shockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        SHOCKWAVE_DAMAGE_BONUS.shockwaveDamage,
      );
      return `+${formatNumber(extra)} damage on each crackwave (30% of your base damage).`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["shockwave"],
  },
  {
    id: "shockwaveDamage2",
    name: "Crackwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = shockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        SHOCKWAVE_DAMAGE_BONUS.shockwaveDamage2,
      );
      return `+${formatNumber(extra)} damage on each crackwave (30% of your base damage).`;
    },
    maxLevel: 1,
    costs: [12500],
    requires: ["shockwaveDamage"],
  },
  {
    id: "shockwaveDamage3",
    name: "Crackwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = shockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        SHOCKWAVE_DAMAGE_BONUS.shockwaveDamage3,
      );
      return `+${formatNumber(extra)} damage on each crackwave (20% of your base damage).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["shockwaveDamage2"],
  },
  {
    id: "shockwaveDamage4",
    name: "Crackwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = shockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        SHOCKWAVE_DAMAGE_BONUS.shockwaveDamage4,
      );
      return `+${formatNumber(extra)} damage on each crackwave (10% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1150000],
    requires: ["shockwaveDamage3"],
  },
  {
    id: "shockwaveDamage5",
    name: "Crackwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = shockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        SHOCKWAVE_DAMAGE_BONUS.shockwaveDamage5,
      );
      return `+${formatNumber(extra)} damage on each crackwave (10% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1600000],
    requires: ["shockwaveDamage4"],
  },
  {
    id: "biggerStick2",
    name: "Bigger Stick",
    description: hitRadiusDescription("biggerStick2", "0.4"),
    maxLevel: 1,
    costs: [450],
    requires: ["moreDamage"],
  },
  {
    id: "biggerStick3",
    name: "Bigger Stick",
    description: hitRadiusDescription("biggerStick3", "0.2", "Wider swing area."),
    maxLevel: 1,
    costs: [2500],
    requires: ["biggerStick2"],
  },
  {
    id: "switchDamage",
    name: "Type Switch",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = switchDamageBonusFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `+${formatNumber(extra)} damage when you hit a different piñata type than your last target (25% of your base damage).`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["biggerStick3"],
  },
  {
    id: "divineRay",
    name: "Fiesta Bolt",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const chance = formatPercent(divineRayChanceFor(upgrades));
      const dmg = divineRayDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks), upgrades);
      const strikes = divineRayStrikesFor(upgrades);
      const radius = divineRayRadiusFor(upgrades);
      const strikeText = strikes === 1 ? "lightning" : `${formatNumber(strikes)} lightning strikes`;
      const radiusText = radius > 0 ? ` with ${formatNumber(radius)} radius` : "";
      return `Unlock Fiesta Bolt. Every ${DIVINE_RAY.intervalSec}s, ${chance} chance to call down ${strikeText}${radiusText} for ${formatNumber(dmg)} damage (50% of your base damage).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["switchDamage"],
  },
  {
    id: "divineRayStrikes",
    name: "Bolt Strikes",
    description: (upgrades) => {
      const without = divineRayStrikesFor({ ...upgrades, divineRayStrikes: 0 });
      const withIt = divineRayStrikesFor({ ...upgrades, divineRayStrikes: 1 });
      return `Fiesta Bolt fires +2 more strikes at once (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["divineRay"],
  },
  {
    id: "moreDivineRayStrikes",
    name: "More Bolt Strikes",
    description: (upgrades) => {
      const without = divineRayStrikesFor({ ...upgrades, moreDivineRayStrikes: 0 });
      const withIt = divineRayStrikesFor({ ...upgrades, moreDivineRayStrikes: 1 });
      return `Fiesta Bolt fires +2 more strikes at once (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [500000],
    requires: ["divineRayStrikes"],
  },
  {
    id: "moreDivineRayStrikes2",
    name: "More Bolt Strikes",
    description: (upgrades) => {
      const without = divineRayStrikesFor({ ...upgrades, moreDivineRayStrikes2: 0 });
      const withIt = divineRayStrikesFor({ ...upgrades, moreDivineRayStrikes2: 1 });
      return `Fiesta Bolt fires +2 more strikes at once (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [3750000],
    requires: ["moreDivineRayStrikes"],
  },
  {
    id: "divineRayRadius",
    name: "Bolt Radius",
    description: (upgrades) => {
      const without = divineRayRadiusFor({ ...upgrades, divineRayRadius: 0 });
      const withIt = divineRayRadiusFor({ ...upgrades, divineRayRadius: 1 });
      return `+2 Fiesta Bolt Radius (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["divineRay"],
  },
  {
    id: "divineRayRadius2",
    name: "Bolt Radius",
    description: (upgrades) => {
      const without = divineRayRadiusFor({ ...upgrades, divineRayRadius2: 0 });
      const withIt = divineRayRadiusFor({ ...upgrades, divineRayRadius2: 1 });
      return `Wider Fiesta Bolt blast. +2 Fiesta Bolt radius (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [600000],
    requires: ["divineRayRadius"],
  },
  {
    id: "divineRayDamage",
    name: "Bolt Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = divineRayDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        DIVINE_RAY_DAMAGE_BONUS.divineRayDamage,
      );
      return `+${formatNumber(extra)} damage on each Fiesta Bolt hit (100% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1150000],
    requires: ["divineRay"],
  },
  {
    id: "divineRayDamage2",
    name: "Bolt Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = divineRayDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        DIVINE_RAY_DAMAGE_BONUS.divineRayDamage2,
      );
      return `+${formatNumber(extra)} damage on each Fiesta Bolt hit (100% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1600000],
    requires: ["divineRayDamage"],
  },
  {
    id: "divineRayChance",
    name: "Bolt Chance",
    description: (upgrades) => {
      const without = divineRayChanceFor({ ...upgrades, divineRayChance: 0 });
      const withIt = divineRayChanceFor({ ...upgrades, divineRayChance: 1 });
      return `Fiesta Bolt triggers more often. +2% Fiesta Bolt chance (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["divineRay"],
  },
  {
    id: "divineRayChance2",
    name: "Bolt Chance",
    description: (upgrades) => {
      const without = divineRayChanceFor({ ...upgrades, divineRayChance2: 0 });
      const withIt = divineRayChanceFor({ ...upgrades, divineRayChance2: 1 });
      return `Fiesta Bolt triggers more often. +2% Fiesta Bolt chance (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [1600000],
    requires: ["divineRayChance"],
  },
  {
    id: "pinataShockwave",
    name: "Pinata Shockwave",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const chance = formatPercent(pinataShockwaveChanceFor(upgrades));
      const dmg = pinataShockwaveDamageFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        upgrades,
      );
      return `Destroyed piñatas have a ${chance} chance to release a shockwave, dealing ${formatNumber(dmg)} damage to nearby piñatas (25% of your base damage).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["switchDamage"],
  },
  {
    id: "pinataShockwaveRadius",
    name: "Pinata Shockwave Radius",
    description: (upgrades) => {
      const without = pinataShockwaveRadiusFor({ ...upgrades, pinataShockwaveRadius: 0 });
      const withIt = pinataShockwaveRadiusFor({ ...upgrades, pinataShockwaveRadius: 1 });
      return `Shockwaves reach farther. +0.2 shockwave radius (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["pinataShockwave"],
  },
  {
    id: "pinataShockwaveRadius2",
    name: "Pinata Shockwave Radius",
    description: (upgrades) => {
      const without = pinataShockwaveRadiusFor({ ...upgrades, pinataShockwaveRadius2: 0 });
      const withIt = pinataShockwaveRadiusFor({ ...upgrades, pinataShockwaveRadius2: 1 });
      return `Shockwaves reach further. +0.2 shockwave radius (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [600000],
    requires: ["pinataShockwaveRadius"],
  },
  {
    id: "pinataShockwaveRadius3",
    name: "Pinata Shockwave Radius",
    description: (upgrades) => {
      const without = pinataShockwaveRadiusFor({ ...upgrades, pinataShockwaveRadius3: 0 });
      const withIt = pinataShockwaveRadiusFor({ ...upgrades, pinataShockwaveRadius3: 1 });
      return `Shockwaves reach further. +0.2 shockwave radius (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [2000000],
    requires: ["pinataShockwaveRadius2"],
  },
  {
    id: "pinataShockwaveDamage",
    name: "Pinata Shockwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = pinataShockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        PINATA_SHOCKWAVE_DAMAGE_BONUS.pinataShockwaveDamage,
      );
      return `+${formatNumber(extra)} damage on each pinata shockwave (10% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1500000],
    requires: ["pinataShockwave"],
  },
  {
    id: "pinataShockwaveDamage2",
    name: "Pinata Shockwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = pinataShockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        PINATA_SHOCKWAVE_DAMAGE_BONUS.pinataShockwaveDamage2,
      );
      return `+${formatNumber(extra)} damage on each pinata shockwave (10% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1600000],
    requires: ["pinataShockwaveDamage"],
  },
  {
    id: "pinataShockwaveDamage3",
    name: "Pinata Shockwave Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = pinataShockwaveDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        PINATA_SHOCKWAVE_DAMAGE_BONUS.pinataShockwaveDamage3,
      );
      return `+${formatNumber(extra)} damage on each pinata shockwave (10% of your base damage).`;
    },
    maxLevel: 1,
    costs: [5000000],
    requires: ["pinataShockwaveDamage2"],
  },
  {
    id: "pinataShockwaveChance",
    name: "Pinata Shockwave Chance",
    description: (upgrades) => {
      const without = pinataShockwaveChanceFor({ ...upgrades, pinataShockwaveChance: 0 });
      const withIt = pinataShockwaveChanceFor({ ...upgrades, pinataShockwaveChance: 1 });
      return `Increases Pinata Shockwave chance by +1% (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [400000],
    requires: ["pinataShockwave"],
  },
  {
    id: "pinataShockwaveChance2",
    name: "Pinata Shockwave Chance",
    description: (upgrades) => {
      const without = pinataShockwaveChanceFor({ ...upgrades, pinataShockwaveChance2: 0 });
      const withIt = pinataShockwaveChanceFor({ ...upgrades, pinataShockwaveChance2: 1 });
      return `Increases Pinata Shockwave chance by +1% (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [500000],
    requires: ["pinataShockwaveChance"],
  },
  {
    id: "pinataShockwaveChance3",
    name: "Pinata Shockwave Chance",
    description: (upgrades) => {
      const without = pinataShockwaveChanceFor({ ...upgrades, pinataShockwaveChance3: 0 });
      const withIt = pinataShockwaveChanceFor({ ...upgrades, pinataShockwaveChance3: 1 });
      return `Increases Pinata Shockwave chance by +1% (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [3750000],
    requires: ["pinataShockwaveChance2"],
  },
  {
    id: "moreHitRadius",
    name: "Wider Swings",
    description: hitRadiusDescription("moreHitRadius", "0.22", "Wider swing area."),
    maxLevel: 1,
    costs: [100000],
    requires: ["switchDamage"],
  },
  {
    id: "biggerStick4",
    name: "Bigger Stick",
    description: hitRadiusDescription("biggerStick4", "0.25", "Wider swing area."),
    maxLevel: 1,
    costs: [165000],
    requires: ["moreHitRadius"],
  },
  {
    id: "moreDamage2",
    name: "Heavier Hits",
    description: moreDamageDescription("moreDamage2"),
    maxLevel: 1,
    costs: [500],
    requires: ["moreDamage"],
  },
  {
    id: "collateralDamage",
    name: "Multi-Smash",
    description: "+25% of your base damage (minimum +1) when your swing hits 2+ piñatas.",
    maxLevel: 1,
    costs: [70],
    requires: ["hitRadius"],
  },
  {
    id: "critChance",
    name: "Lucky Crack",
    description: critChanceDescription("critChance", "10%"),
    maxLevel: 1,
    costs: [450],
    requires: ["collateralDamage"],
  },
  {
    id: "critDamage",
    name: "Crack Damage",
    description: critDamageDescription("critDamage", "25%"),
    maxLevel: 1,
    costs: [1300],
    requires: ["critChance"],
  },
  {
    id: "moreCritDamage",
    name: "Harder Cracks",
    description: critDamageDescription("moreCritDamage", "15%", "Even harder crits."),
    maxLevel: 1,
    costs: [3100],
    requires: ["critDamage"],
  },
  {
    id: "moreCritChance",
    name: "More Lucky Cracks",
    description: critChanceDescription("moreCritChance", "5%"),
    maxLevel: 1,
    costs: [3100],
    requires: ["critDamage"],
  },
  {
    id: "lowHpCrits",
    name: "Cracked Crits",
    description: `+${formatPercent(LOW_HP_CRITS.chance)} crit chance against piñatas below ${formatPercent(LOW_HP_CRITS.hpThreshold)} HP.`,
    maxLevel: 1,
    costs: [400000],
    requires: ["moreCritDamage", "moreCritChance"],
  },
  {
    id: "moreCritChance3",
    name: "More Lucky Cracks I",
    description: critChanceDescription("moreCritChance3", "5%"),
    maxLevel: 1,
    costs: [1150000],
    requires: ["lowHpCrits"],
  },
  {
    id: "moreCritChance4",
    name: "More Lucky Cracks II",
    description: critChanceDescription("moreCritChance4", "2%"),
    maxLevel: 1,
    costs: [1600000],
    requires: ["moreCritChance3"],
  },
  {
    id: "luckyCrit",
    name: "Party Crit",
    description: `Every ${LUCKY_CRIT.everyNthHit}th hit has a ${formatPercent(LUCKY_CRIT.chance)} chance to crit.`,
    maxLevel: 1,
    costs: [3750000],
    requires: ["moreCritChance4"],
  },
  {
    id: "critDamage2",
    name: "Crack Damage",
    family: "critDamage2",
    description: critDamageDescription("critDamage2", "10%", "Crits hit harder."),
    maxLevel: 1,
    costs: [1150000],
    requires: ["lowHpCrits"],
  },
  {
    id: "moreCritDamage2",
    name: "Harder Cracks I",
    description: critDamageDescription("moreCritDamage2", "10%", "Gain +10% critical damage."),
    maxLevel: 1,
    costs: [1150000],
    requires: ["critDamage2"],
  },
  {
    id: "moreCritDamage3",
    name: "Harder Cracks II",
    description: critDamageDescription("moreCritDamage3", "10%", "Gain +10% critical damage."),
    maxLevel: 1,
    costs: [13000000],
    requires: ["moreCritDamage2"],
  },
  {
    id: "moreCritDamage4",
    name: "Harder Cracks III",
    description: `Piñatas destroyed by critical hits have at least a ${formatPercent(CRIT_KILL_DOUBLE_LOOT)} chance to drop double loot.`,
    maxLevel: 1,
    costs: [40000000],
    requires: ["moreCritDamage3"],
  },
  {
    id: "phantomStick",
    name: "Ghost Stick",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const dmg = phantomDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks), upgrades);
      const chance = formatPercent(phantomChanceFor(upgrades));
      const targets = phantomTargetsFor(upgrades);
      const targetText = targets === 1 ? "a random piñata" : `${formatNumber(targets)} random piñatas`;
      return `${chance} chance per hit to spawn a ghost stick that strikes ${targetText} for ${formatNumber(dmg)} damage (150% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1000],
    requires: ["collateralDamage"],
  },
  {
    id: "phantomHandChance",
    name: "Ghost Stick Chance",
    description: phantomChanceDescription("phantomHandChance"),
    maxLevel: 1,
    costs: [1600],
    requires: ["phantomStick"],
  },
  {
    id: "phantomHandDamage",
    name: "Ghost Stick Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = phantomDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        PHANTOM_DAMAGE_BONUS.phantomHandDamage,
      );
      return `+${formatNumber(extra)} damage on each Ghost Stick hit (25% of your base damage).`;
    },
    maxLevel: 1,
    costs: [6500],
    requires: ["phantomHandChance"],
  },
  {
    id: "phantomHandDamage2",
    name: "Ghost Stick Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = phantomDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        PHANTOM_DAMAGE_BONUS.phantomHandDamage2,
      );
      return `+${formatNumber(extra)} damage on each Ghost Stick hit (30% of your base damage).`;
    },
    maxLevel: 1,
    costs: [330000],
    requires: ["phantomHandDamage"],
  },
  {
    id: "phantomHandDamage3",
    name: "Ghost Stick Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = phantomDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        PHANTOM_DAMAGE_BONUS.phantomHandDamage3,
      );
      return `+${formatNumber(extra)} damage on each Ghost Stick hit (30% of your base damage).`;
    },
    maxLevel: 1,
    costs: [700000],
    requires: ["phantomHandDamage2"],
  },
  {
    id: "phantomHandChance2",
    name: "Ghost Stick Chance",
    description: phantomChanceDescription("phantomHandChance2"),
    maxLevel: 1,
    costs: [3100],
    requires: ["phantomHandChance"],
  },
  {
    id: "phantomHandChance3",
    name: "Ghost Stick Chance",
    description: phantomChanceDescription("phantomHandChance3"),
    maxLevel: 1,
    costs: [200000],
    requires: ["phantomHandChance2"],
  },
  {
    id: "phantomHandChance4",
    name: "Ghost Stick Chance",
    description: phantomChanceDescription("phantomHandChance4"),
    maxLevel: 1,
    costs: [10000000],
    requires: ["phantomHandChance3"],
  },
  {
    id: "phantomMoreTargets",
    name: "Extra Ghost Hits",
    description: (upgrades) => {
      const without = phantomTargetsFor({ ...upgrades, phantomMoreTargets: 0 });
      const withIt = phantomTargetsFor({ ...upgrades, phantomMoreTargets: 1 });
      return `Ghost Stick strikes +1 additional targets (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [12500],
    requires: ["phantomHandChance"],
  },
  {
    id: "firstHitDamage",
    name: "Opening Crack",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = Math.max(
        1,
        Math.round(powerFor(upgrades, unlockedPinataTypes, totalBreaks) * FIRST_HIT_DAMAGE_RATIO),
      );
      return `Your first hit on each piñata deals +${formatNumber(extra)} extra damage (25% of your base damage).`;
    },
    maxLevel: 1,
    costs: [1200],
    requires: ["collateralDamage"],
  },
  {
    id: "moreDamage3",
    name: "Heavier Hits",
    description: moreDamageDescription("moreDamage3"),
    maxLevel: 1,
    costs: [1600],
    requires: ["firstHitDamage"],
  },
  {
    id: "damagePerDestroy",
    name: "Break Bonus",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const breaks = Math.max(0, Math.floor(totalBreaks));
      const without = powerFor(
        { ...upgrades, damagePerDestroy: 0 },
        unlockedPinataTypes,
        breaks,
      );
      const withIt = powerFor(
        { ...upgrades, damagePerDestroy: 1 },
        unlockedPinataTypes,
        breaks,
      );
      const extra = damagePerDestroyPerStackFor(without);
      const noun = breaks === 1 ? "piñata" : "piñatas";
      return `+${formatNumber(extra)} damage (1% of your base damage, min +1) per piñata destroyed this run. Max ${formatNumber(DAMAGE_PER_DESTROY.maxStacks)}. (${formatNumber(breaks)} ${noun}, ${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [35000],
    requires: ["moreDamage3"],
  },
  {
    id: "moreDamage5",
    name: "Heavier Hits",
    description: moreDamageDescription("moreDamage5"),
    maxLevel: 1,
    costs: [400000],
    requires: ["damagePerDestroy"],
  },
  {
    id: "oneSmash",
    name: "Instant Burst",
    description: (upgrades) => {
      const chance = formatPercent(oneSmashChanceFor({ ...upgrades, oneSmash: 1 }));
      return `${chance} chance on every hit to instantly shatter any piñata.`;
    },
    maxLevel: 1,
    costs: [700000],
    requires: ["moreDamage5"],
  },
  {
    id: "oneSmashChance",
    name: "Instant Burst Chance",
    description: oneSmashChanceDescription("oneSmashChance"),
    maxLevel: 1,
    costs: [5000000],
    requires: ["oneSmash"],
  },
  {
    id: "oneSmashChance2",
    name: "Instant Burst Chance",
    description: oneSmashChanceDescription("oneSmashChance2"),
    maxLevel: 1,
    costs: [10000000],
    requires: ["oneSmashChance"],
  },
  {
    id: "moreFirstHitDamage",
    name: "Harder Opening",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = Math.max(
        1,
        Math.round(
          powerFor(upgrades, unlockedPinataTypes, totalBreaks) * MORE_FIRST_HIT_DAMAGE_RATIO,
        ),
      );
      return `Your first hit on each piñata deals +${formatNumber(extra)} extra damage (50% of your base damage).`;
    },
    maxLevel: 1,
    costs: [330000],
    requires: ["moreDamage5"],
  },
  {
    id: "moreDamage6",
    name: "Heavier Hits VI",
    description: moreDamageDescription("moreDamage6"),
    maxLevel: 1,
    costs: [5000000],
    requires: ["moreFirstHitDamage"],
  },
  {
    id: "crowdDamage",
    name: "Packed Party",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = crowdDamagePerPinataFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `+${formatNumber(extra)} damage (1% of your base damage, min +1) per piñata on screen.`;
    },
    maxLevel: 1,
    costs: [200000],
    requires: ["damagePerDestroy"],
  },
  {
    id: "moreCrowdDamage",
    name: "Pack Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = crowdDamagePerPinataFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks));
      return `Adds +${formatNumber(extra)} damage (1% of your base damage, min +1) per piñata on screen.`;
    },
    maxLevel: 1,
    costs: [330000],
    requires: ["crowdDamage"],
  },
  {
    id: "rockRain",
    name: "Shard Rain",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const dmg = rockRainDamageFor(powerFor(upgrades, unlockedPinataTypes, totalBreaks), upgrades);
      const chance = formatPercent(rockRainChanceFor(upgrades));
      const rocks = rockRainRocksFor(upgrades);
      return `${chance} chance on stick hit to drop ${formatNumber(rocks)} shards around your hit, each dealing ${formatNumber(dmg)} damage (50% of your base damage). Cannot trigger during the storm or for ${ROCK_RAIN.afterStormSec}s afterward.`;
    },
    maxLevel: 1,
    costs: [3000000],
    requires: ["moreCrowdDamage"],
  },
  {
    id: "rockRainChance",
    name: "Shard Rain Chance",
    description: rockRainChanceDescription("rockRainChance"),
    maxLevel: 1,
    costs: [3750000],
    requires: ["rockRain"],
  },
  {
    id: "rockRainChance2",
    name: "Shard Rain Chance",
    description: rockRainChanceDescription("rockRainChance2"),
    maxLevel: 1,
    costs: [40000000],
    requires: ["rockRainChance"],
  },
  {
    id: "moreRocks",
    name: "More Shards",
    description: (upgrades) => {
      const without = rockRainRocksFor({ ...upgrades, moreRocks: 0 });
      const withIt = rockRainRocksFor({ ...upgrades, moreRocks: 1 });
      return `Shard Rain drops +8 more shards per activation (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [4000000],
    requires: ["rockRain"],
  },
  {
    id: "moreRocks2",
    name: "More Shards",
    description: (upgrades) => {
      const without = rockRainRocksFor({ ...upgrades, moreRocks2: 0 });
      const withIt = rockRainRocksFor({ ...upgrades, moreRocks2: 1 });
      return `Shard Rain drops +8 more shards per activation (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [40000000],
    requires: ["moreRocks"],
  },
  {
    id: "biggerBlast",
    name: "Wider Hail",
    description: (upgrades) => {
      const without = rockRainRadiusFor({ ...upgrades, biggerBlast: 0 });
      const withIt = rockRainRadiusFor({ ...upgrades, biggerBlast: 1 });
      return `+0.5m blast radius on every shard (${formatNumber(without)}m → ${formatNumber(withIt)}m).`;
    },
    maxLevel: 1,
    costs: [3750000],
    requires: ["rockRain"],
  },
  {
    id: "biggerBlast2",
    name: "Wider Hail",
    description: (upgrades) => {
      const without = rockRainRadiusFor({ ...upgrades, biggerBlast2: 0 });
      const withIt = rockRainRadiusFor({ ...upgrades, biggerBlast2: 1 });
      return `+0.5m blast radius on every shard (${formatNumber(without)}m → ${formatNumber(withIt)}m).`;
    },
    maxLevel: 1,
    costs: [40000000],
    requires: ["biggerBlast"],
  },
  {
    id: "rockRainDamage",
    name: "Shard Rain Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = rockRainDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        ROCK_RAIN_DAMAGE_BONUS.rockRainDamage,
      );
      return `+${formatNumber(extra)} damage on each falling shard (100% of your base damage).`;
    },
    maxLevel: 1,
    costs: [15000000],
    requires: ["rockRain"],
  },
  {
    id: "rockRainDamage2",
    name: "Shard Rain Damage",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = rockRainDamageBonusFor(
        powerFor(upgrades, unlockedPinataTypes, totalBreaks),
        ROCK_RAIN_DAMAGE_BONUS.rockRainDamage2,
      );
      return `+${formatNumber(extra)} damage on each falling shard (100% of your base damage).`;
    },
    maxLevel: 1,
    costs: [40000000],
    requires: ["rockRainDamage"],
  },
  {
    id: "firstHitMultiplier",
    name: "Opening Blow",
    description: "First hit of each round deals 2x damage.",
    maxLevel: 1,
    costs: [3100],
    requires: ["moreDamage3"],
  },
  {
    id: "moreDamage4",
    name: "Heavier Hits",
    description: moreDamageDescription("moreDamage4"),
    maxLevel: 1,
    costs: [400000],
    requires: ["firstHitMultiplier"],
  },
  {
    id: "moreDamage7",
    name: "Heavier Hits VII",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const extra = Math.max(
        LOW_HP_DAMAGE.minDamage,
        Math.round(powerFor(upgrades, unlockedPinataTypes, totalBreaks) * LOW_HP_DAMAGE.damageRatio),
      );
      return `+${formatNumber(extra)} damage when a piñata is below ${formatPercent(LOW_HP_DAMAGE.hpThreshold)} HP (50% of your base damage).`;
    },
    maxLevel: 1,
    costs: [250000],
    requires: ["moreDamage4"],
  },
  {
    id: "candyYield",
    name: "Candy Shake",
    description: lootBonusDescription("candyYield", "35%"),
    maxLevel: 1,
    costs: [12],
    requires: ["power"],
  },
  {
    id: "moreLoot",
    name: "Richer Breaks",
    description: lootBonusDescription("moreLoot", "30%"),
    maxLevel: 1,
    costs: [40],
    requires: ["candyYield"],
  },
  {
    id: "bornLucky",
    name: "Party Luck",
    description: luckDescription("bornLucky", "6%", "Higher chance for better loot"),
    maxLevel: 1,
    costs: [35],
    requires: ["candyYield"],
  },
  {
    id: "extraLoot",
    name: "Richer Breaks",
    description: lootBonusDescription("extraLoot", "15%"),
    maxLevel: 1,
    costs: [250],
    requires: ["moreLoot"],
  },
  {
    id: "candyRain",
    name: "Candy Rain",
    description: (upgrades) => {
      const rate = candyRainLootRateFor(upgrades);
      return `Candy Rain banks an extra ${formatPercent(rate)} of each destroyed piñata's loot. Keep smashing until it bursts and pays out.`;
    },
    maxLevel: 1,
    costs: [1600],
    requires: ["extraLoot"],
  },
  {
    id: "moreCandy",
    name: "More Candy",
    description: candyRainLootDescription("moreCandy", "2%"),
    maxLevel: 1,
    costs: [3100],
    requires: ["candyRain"],
  },
  {
    id: "moreCandy2",
    name: "More Candy",
    description: candyRainLootDescription("moreCandy2", "2%"),
    maxLevel: 1,
    costs: [250000],
    requires: ["moreCandy"],
  },
  {
    id: "moreCandy3",
    name: "More Candy",
    description: candyRainLootDescription("moreCandy3", "2%"),
    maxLevel: 1,
    costs: [750000],
    requires: ["moreCandy2"],
  },
  {
    id: "moreCandy4",
    name: "More Candy",
    description: candyRainLootDescription("moreCandy4", "2%"),
    maxLevel: 1,
    costs: [3000000],
    requires: ["moreCandy3"],
  },
  {
    id: "moreCandy5",
    name: "More Candy",
    description: candyRainLootDescription("moreCandy5", "2%"),
    maxLevel: 1,
    costs: [25000000],
    requires: ["moreCandy4"],
  },
  {
    id: "moreLoot3",
    name: "Richer Breaks",
    description: lootBonusDescription("moreLoot3", "10%"),
    maxLevel: 1,
    costs: [1200],
    requires: ["extraLoot"],
  },
  {
    id: "lootPerPinataType",
    name: "Loot per Pinata Type",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const types = Math.max(0, unlockedPinataTypes);
      const without = lootMultiplierFor({ ...upgrades, lootPerPinataType: 0 }, types, totalBreaks);
      const withIt = lootMultiplierFor({ ...upgrades, lootPerPinataType: 1 }, types, totalBreaks);
      const noun = types === 1 ? "type" : "types";
      return `+0.5% loot for every unlocked pinata type (${formatNumber(types)} ${noun}, ${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [120000],
    requires: ["moreLoot3"],
  },
  {
    id: "lootBonusDamage",
    name: "Candy Power",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const without = powerFor({ ...upgrades, lootBonusDamage: 0 }, unlockedPinataTypes, totalBreaks);
      const withIt = powerFor({ ...upgrades, lootBonusDamage: 1 }, unlockedPinataTypes, totalBreaks);
      return `5% of your base damage (minimum 1) per 30% loot bonus (${formatNumber(without)} → ${formatNumber(withIt)}).`;
    },
    maxLevel: 1,
    costs: [3150],
    requires: ["moreLoot3"],
  },
  {
    id: "lootPerDestroy",
    name: "Breaker Bonus",
    description: (upgrades, unlockedPinataTypes = 0, totalBreaks = 0) => {
      const breaks = Math.max(0, Math.floor(totalBreaks));
      const without = lootMultiplierFor(
        { ...upgrades, lootPerDestroy: 0 },
        unlockedPinataTypes,
        breaks,
      );
      const withIt = lootMultiplierFor(
        { ...upgrades, lootPerDestroy: 1 },
        unlockedPinataTypes,
        breaks,
      );
      const noun = breaks === 1 ? "piñata" : "piñatas";
      return `+1% loot for every 10 piñatas destroyed this run (${formatNumber(breaks)} ${noun}, ${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [1400000],
    requires: ["lootBonusDamage"],
  },
  {
    id: "luckySeven",
    name: "Lucky Swing",
    description: `Every ${LUCKY_SEVEN.everyNthHit}th hit has a ${formatPercent(LUCKY_SEVEN.chance)} chance to shake ${formatPercent(LUCKY_SEVEN.lootBonus)} bonus loot from piñatas.`,
    maxLevel: 1,
    costs: [330000],
    requires: ["lootPerDestroy"],
  },
  {
    id: "luckySeven2",
    name: "Lucky Swing",
    description: `Your bonus on every ${LUCKY_SEVEN.everyNthHit}th hit increases from ${formatPercent(LUCKY_SEVEN.lootBonus)} to ${formatPercent(LUCKY_SEVEN.lootBonus2)}.`,
    maxLevel: 1,
    costs: [2000000],
    requires: ["luckySeven"],
  },
  {
    id: "doubleLoot",
    name: "Double Candy",
    description: doubleLootDescription("doubleLoot", "7%"),
    maxLevel: 1,
    costs: [250],
    requires: ["moreLoot"],
  },
  {
    id: "doubleLoot2",
    name: "Double Candy",
    description: doubleLootDescription("doubleLoot2", "2%"),
    maxLevel: 1,
    costs: [1600],
    requires: ["extraLoot"],
  },
  {
    id: "doubleLoot3",
    name: "Double Candy",
    description: doubleLootDescription("doubleLoot3", "2%"),
    maxLevel: 1,
    costs: [15000],
    requires: ["doubleLoot2"],
  },
  {
    id: "spawnExtraLoot",
    name: "Surprise Candy I",
    description: (upgrades) => {
      const bonus = spawnExtraLootBonusFor({ ...upgrades, spawnExtraLoot: 1 });
      return `Piñatas have a +${formatPercent(SPAWN_EXTRA_LOOT.chance)} chance to spawn with +${formatPercent(bonus)} extra loot.`;
    },
    maxLevel: 1,
    costs: [200000],
    requires: ["doubleLoot3"],
  },
  {
    id: "spawnExtraLoot2",
    name: "Surprise Candy II",
    description: (upgrades) => {
      const without = spawnExtraLootBonusFor({ ...upgrades, spawnExtraLoot2: 0 });
      const withIt = spawnExtraLootBonusFor({ ...upgrades, spawnExtraLoot2: 1 });
      return `Piñatas spawn with +25% more extra loot (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [10000000],
    requires: ["spawnExtraLoot"],
  },
  {
    id: "spawnExtraLoot3",
    name: "Surprise Candy III",
    description: (upgrades) => {
      const without = spawnExtraLootBonusFor({ ...upgrades, spawnExtraLoot3: 0 });
      const withIt = spawnExtraLootBonusFor({ ...upgrades, spawnExtraLoot3: 1 });
      return `Piñatas spawn with +25% more extra loot (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [10000000],
    requires: ["spawnExtraLoot"],
  },
  {
    id: "spawnExtraLoot4",
    name: "Surprise Candy IV",
    description: (upgrades) => {
      const chanceWithout = spawnExtraLootChanceFor({ ...upgrades, spawnExtraLoot4: 0 });
      const chanceWith = spawnExtraLootChanceFor({ ...upgrades, spawnExtraLoot4: 1 });
      const bonusWithout = spawnExtraLootBonusFor({ ...upgrades, spawnExtraLoot4: 0 });
      const bonusWith = spawnExtraLootBonusFor({ ...upgrades, spawnExtraLoot4: 1 });
      return `Piñatas have a +2% chance to spawn with +50% extra loot (${formatPercent(chanceWithout)} → ${formatPercent(chanceWith)} chance, ${formatPercent(bonusWithout)} → ${formatPercent(bonusWith)} bonus).`;
    },
    maxLevel: 1,
    costs: [4000000],
    requires: ["spawnExtraLoot2", "spawnExtraLoot3"],
  },
  {
    id: "glowingPinatas",
    name: "Glowing Pinatas",
    description: glowingSpawnDescription(
      "glowingPinatas",
      "3%",
      "Glowing piñatas are guaranteed jackpot, dropping the highest possible loot tier",
    ),
    maxLevel: 1,
    costs: [600],
    requires: ["moreLoot"],
  },
  {
    id: "moreGlowingChance",
    name: "More Glowing Chance",
    description: glowingSpawnDescription("moreGlowingChance", "2%"),
    maxLevel: 1,
    costs: [1600],
    requires: ["glowingPinatas"],
  },
  {
    id: "brightStart",
    name: "Bright Start",
    description: "The first piñata each run spawns glowing.",
    maxLevel: 1,
    costs: [6000000],
    requires: ["moreGlowingChance2"],
  },
  {
    id: "glowingBonus",
    name: "Glowing Bonus",
    description: glowingBonusDescription("glowingBonus", "1%"),
    maxLevel: 1,
    costs: [1600],
    requires: ["glowingPinatas"],
  },
  {
    id: "glowingSpread",
    name: "Glowing Spread",
    description: (upgrades) => {
      const chance = formatPercent(glowingSpreadChanceFor(upgrades));
      const targets = glowingSpreadTargetsFor(upgrades);
      const noun = targets === 1 ? "piñata" : "piñatas";
      return `Unlock Glowing Spread. Destroying a glowing piñata has a ${chance} chance to make ${formatNumber(targets)} nearby ${noun} glow.`;
    },
    maxLevel: 1,
    costs: [3100],
    requires: ["moreGlowingChance", "glowingBonus"],
  },
  {
    id: "moreGlowingChance2",
    name: "More Glowing Chance II",
    description: glowingSpawnDescription("moreGlowingChance2", "1.5%"),
    maxLevel: 1,
    costs: [200000],
    requires: ["glowingSpread"],
  },
  {
    id: "moreGlowingBonus",
    name: "More Glowing Bonus",
    description: glowingBonusExtraDescription("moreGlowingBonus", "50%"),
    maxLevel: 1,
    costs: [25000],
    requires: ["glowingBonus"],
  },
  {
    id: "moreGlowingSpread",
    name: "More Glowing Spread",
    description: (upgrades) => {
      const withoutChance = glowingSpreadChanceFor({ ...upgrades, moreGlowingSpread: 0 });
      const withChance = glowingSpreadChanceFor({ ...upgrades, moreGlowingSpread: 1 });
      const withoutTargets = glowingSpreadTargetsFor({ ...upgrades, moreGlowingSpread: 0 });
      const withTargets = glowingSpreadTargetsFor({ ...upgrades, moreGlowingSpread: 1 });
      return `Adds +4% Glowing Spread chance and +1 range (${formatPercent(withoutChance)} → ${formatPercent(withChance)}, ${formatNumber(withoutTargets)} → ${formatNumber(withTargets)}).`;
    },
    maxLevel: 1,
    costs: [200000],
    requires: ["moreGlowingBonus"],
  },
  {
    id: "moreGlowingSpread2",
    name: "More Glowing Spread",
    description: (upgrades) => {
      const withoutChance = glowingSpreadChanceFor({ ...upgrades, moreGlowingSpread2: 0 });
      const withChance = glowingSpreadChanceFor({ ...upgrades, moreGlowingSpread2: 1 });
      const withoutTargets = glowingSpreadTargetsFor({ ...upgrades, moreGlowingSpread2: 0 });
      const withTargets = glowingSpreadTargetsFor({ ...upgrades, moreGlowingSpread2: 1 });
      return `Adds +2.4% Glowing Spread chance and +1 range (${formatPercent(withoutChance)} → ${formatPercent(withChance)}, ${formatNumber(withoutTargets)} → ${formatNumber(withTargets)}).`;
    },
    maxLevel: 1,
    costs: [330000],
    requires: ["moreGlowingSpread"],
  },
  {
    id: "moreLuck",
    name: "Extra Luck",
    description: luckDescription("moreLuck", "3%"),
    maxLevel: 1,
    costs: [460],
    requires: ["bornLucky"],
  },
  {
    id: "superLuck",
    name: "Big Luck",
    description: luckDescription("superLuck", "9%", "Higher chance for better loot"),
    maxLevel: 1,
    costs: [4500],
    requires: ["moreLuck"],
  },
  {
    id: "superJackpot",
    name: "Fiesta Jackpot",
    description: (upgrades) => {
      const chance = formatPercent(superJackpotChanceFor(upgrades));
      return `Unlock Fiesta Jackpot. Each destroyed piñata has a ${chance} chance to drop 2x its best loot.`;
    },
    maxLevel: 1,
    costs: [2000000],
    requires: ["superLuck"],
  },
  {
    id: "superJackpotChance",
    name: "Jackpot Chance",
    description: (upgrades) => {
      const without = superJackpotChanceFor({ ...upgrades, superJackpotChance: 0 });
      const withIt = superJackpotChanceFor({ ...upgrades, superJackpotChance: 1 });
      return `Fiesta Jackpot is 0.5% more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [4500000],
    requires: ["superJackpot"],
  },
  {
    id: "superJackpotChance2",
    name: "Jackpot Chance",
    description: (upgrades) => {
      const without = superJackpotChanceFor({ ...upgrades, superJackpotChance2: 0 });
      const withIt = superJackpotChanceFor({ ...upgrades, superJackpotChance2: 1 });
      return `Fiesta Jackpot is 0.5% more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [20000000],
    requires: ["superJackpotChance"],
  },
  {
    id: "superJackpotChance3",
    name: "Jackpot Chance",
    description: (upgrades) => {
      const without = superJackpotChanceFor({ ...upgrades, superJackpotChance3: 0 });
      const withIt = superJackpotChanceFor({ ...upgrades, superJackpotChance3: 1 });
      return `Fiesta Jackpot is 0.5% more likely to trigger (${formatPercent(without)} → ${formatPercent(withIt)}).`;
    },
    maxLevel: 1,
    costs: [100000000],
    requires: ["superJackpotChance2"],
  },
  {
    id: "moreDamage8",
    name: "Heavier Hits",
    family: "finaleMoreDamage",
    description: moreDamageDescription("moreDamage8"),
    maxLevel: 1,
    costs: [25000000],
    requiresFinalPayment: true,
  },
  {
    id: "moreDamage9",
    name: "Heavier Hits",
    family: "finaleMoreDamage",
    description: moreDamageDescription("moreDamage9"),
    maxLevel: 1,
    costs: [50000000],
    requires: ["moreDamage8"],
    requiresFinalPayment: true,
  },
  {
    id: "moreDamage10",
    name: "Heavier Hits",
    family: "finaleMoreDamage",
    description: moreDamageDescription("moreDamage10"),
    maxLevel: 1,
    costs: [100000000],
    requires: ["moreDamage9"],
    requiresFinalPayment: true,
  },
  {
    id: "moreCritChance5",
    name: "More Lucky Cracks",
    family: "finaleMoreCritChance",
    description: critChanceDescription("moreCritChance5", "2%"),
    maxLevel: 1,
    costs: [25000000],
    requiresFinalPayment: true,
  },
  {
    id: "moreCritChance6",
    name: "More Lucky Cracks",
    family: "finaleMoreCritChance",
    description: critChanceDescription("moreCritChance6", "2%"),
    maxLevel: 1,
    costs: [50000000],
    requires: ["moreCritChance5"],
    requiresFinalPayment: true,
  },
  {
    id: "moreCritChance7",
    name: "More Lucky Cracks",
    family: "finaleMoreCritChance",
    description: critChanceDescription("moreCritChance7", "2%"),
    maxLevel: 1,
    costs: [100000000],
    requires: ["moreCritChance6"],
    requiresFinalPayment: true,
  },
  {
    id: "moreCritDamage5",
    name: "Harder Cracks",
    family: "finaleMoreCritDamage",
    description: critDamageDescription("moreCritDamage5", "50%"),
    maxLevel: 1,
    costs: [25000000],
    requiresFinalPayment: true,
  },
  {
    id: "moreCritDamage6",
    name: "Harder Cracks",
    family: "finaleMoreCritDamage",
    description: critDamageDescription("moreCritDamage6", "50%"),
    maxLevel: 1,
    costs: [50000000],
    requires: ["moreCritDamage5"],
    requiresFinalPayment: true,
  },
  {
    id: "moreCritDamage7",
    name: "Harder Cracks",
    family: "finaleMoreCritDamage",
    description: critDamageDescription("moreCritDamage7", "50%"),
    maxLevel: 1,
    costs: [100000000],
    requires: ["moreCritDamage6"],
    requiresFinalPayment: true,
  },
  {
    id: "moreSpeed4",
    name: "Quicker Swings",
    family: "finaleMoreSpeed",
    description: attackSpeedDescription("moreSpeed4", "5%"),
    maxLevel: 1,
    costs: [50000000],
    requiresFinalPayment: true,
  },
  {
    id: "moreSpeed5",
    name: "Quicker Swings",
    family: "finaleMoreSpeed",
    description: attackSpeedDescription("moreSpeed5", "5%"),
    maxLevel: 1,
    costs: [50000000],
    requires: ["moreSpeed4"],
    requiresFinalPayment: true,
  },
  {
    id: "moreSpeed6",
    name: "Quicker Swings",
    family: "finaleMoreSpeed",
    description: attackSpeedDescription("moreSpeed6", "5%"),
    maxLevel: 1,
    costs: [100000000],
    requires: ["moreSpeed5"],
    requiresFinalPayment: true,
  },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

function upgradePrereqs(def: UpgradeDef): readonly UpgradeId[] {
  return [...(def.requires ?? []), ...(def.requiresAny ?? [])];
}

function upgradeUnlockDepth(id: UpgradeId, seen: Set<UpgradeId> = new Set()): number {
  if (seen.has(id)) return 0;
  const next = new Set(seen);
  next.add(id);
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return 0;
  const preds = upgradePrereqs(def);
  if (!preds.length) return 0;
  return 1 + Math.min(...preds.map((p) => upgradeUnlockDepth(p, new Set(next))));
}

/** Same-named nodes get I, II, III… in unlock order. Unique names stay unchanged. */
export function upgradeDisplayName(def: UpgradeDef): string {
  const familyKey = def.family ?? def.name;
  const family = UPGRADES.filter((u) => (u.family ?? u.name) === familyKey);
  if (family.length <= 1) return def.name;
  const ranked = [...family].sort((a, b) => {
    const da = upgradeUnlockDepth(a.id);
    const db = upgradeUnlockDepth(b.id);
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
  const index = ranked.findIndex((u) => u.id === def.id);
  const numeral = ROMAN[Math.max(0, index)] ?? String(index + 1);
  return `${def.name} ${numeral}`;
}

/** Split a display name onto two lines that fit a square node. */
export function upgradeTitleLines(def: UpgradeDef): [string, string] {
  const name = upgradeDisplayName(def);
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return [name, ""];
  let best = 1;
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(" ").length;
    const right = words.slice(i).join(" ").length;
    const score = Math.abs(left - right);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

export function upgradeNameById(id: UpgradeId): string {
  const def = UPGRADES.find((u) => u.id === id);
  return def ? upgradeDisplayName(def) : id;
}

/** Pairs of upgrade ids connected by skill-tree edges (from → to). */
export const SKILL_TREE_EDGES: readonly [UpgradeId, UpgradeId][] = [
  ["power", "swing"],
  ["power", "stamina"],
  ["power", "hitRadius"],
  ["power", "candyYield"],
  ["swing", "sugarRush"],
  ["sugarRush", "lightningStrike"],
  ["lightningStrike", "lightningChance"],
  ["lightningChance", "lightningChance2"],
  ["lightningChance2", "lightningChance3"],
  ["lightningStrike", "lightningMoreTargets"],
  ["lightningMoreTargets", "lightningMoreTargets2"],
  ["lightningMoreTargets2", "lightningMoreRays"],
  ["lightningStrike", "lightningDamage"],
  ["lightningDamage", "lightningDamage2"],
  ["lightningDamage2", "lightningDamage3"],
  ["sugarRush", "moreSpeed"],
  ["sugarRush", "doubleHit"],
  ["doubleHit", "combo"],
  ["combo", "moreComboDamage"],
  ["moreComboDamage", "moreComboDamage2"],
  ["moreComboDamage2", "moreComboDamage3"],
  ["moreComboDamage2", "comboSaver"],
  ["moreComboDamage3", "moreComboDamage4"],
  ["moreComboDamage4", "comboSpeedBonus"],
  ["comboSaver", "comboSpeedBonus"],
  ["moreSpeed", "rageMode"],
  ["rageMode", "rageDuration"],
  ["rageDuration", "rageDuration2"],
  ["rageMode", "rageChance"],
  ["rageChance", "rageChance2"],
  ["rageDuration", "rageSpeed"],
  ["rageChance", "rageSpeed"],
  ["rageSpeed", "rageSpeed2"],
  ["moreSpeed", "moreSpeed2"],
  ["moreSpeed2", "tantrum"],
  ["tantrum", "tantrumDuration"],
  ["tantrum", "moreSpeed3"],
  ["moreSpeed3", "efficientWings"],
  ["moreSpeed", "ignite"],
  ["ignite", "igniteChance"],
  ["igniteChance", "igniteChance2"],
  ["igniteChance", "fireDuration"],
  ["fireDuration", "fireDuration2"],
  ["fireDuration", "fireDamage"],
  ["fireDamage", "fireDamage2"],
  ["fireDamage2", "burningChain"],
  ["fireDuration2", "burningChain"],
  ["igniteChance2", "burningChain"],
  ["stamina", "energyDrink"],
  ["energyDrink", "restoreChance"],
  ["restoreChance", "restoreChance2"],
  ["restoreChance2", "restoreChance3"],
  ["energyDrink", "moreStamina"],
  ["moreStamina", "moreStamina2"],
  ["moreStamina2", "speedFromStamina"],
  ["moreStamina2", "stackingDamage"],
  ["speedFromStamina", "moreStamina3"],
  ["stackingDamage", "moreStamina3"],
  ["energyDrink", "gripStrength"],
  ["gripStrength", "megaGrip"],
  ["megaGrip", "lowStaminaBonus"],
  ["lowStaminaBonus", "lowStaminaDamage"],
  ["lowStaminaBonus", "lowStaminaSpeed"],
  ["lowStaminaDamage", "lastStand"],
  ["lastStand", "partingShot"],
  ["partingShot", "lastStandDamage"],
  ["lowStaminaSpeed", "secondWind"],
  ["secondWind", "secondWindBoost"],
  ["secondWindBoost", "secondWindBoost2"],
  ["candyYield", "moreLoot"],
  ["candyYield", "bornLucky"],
  ["moreLoot", "extraLoot"],
  ["moreLoot", "doubleLoot"],
  ["moreLoot", "glowingPinatas"],
  ["glowingPinatas", "moreGlowingChance"],
  ["moreGlowingChance2", "brightStart"],
  ["glowingPinatas", "glowingBonus"],
  ["moreGlowingChance", "glowingSpread"],
  ["glowingBonus", "glowingSpread"],
  ["glowingBonus", "moreGlowingBonus"],
  ["moreGlowingBonus", "moreGlowingSpread"],
  ["moreGlowingSpread", "moreGlowingSpread2"],
  ["glowingSpread", "moreGlowingChance2"],
  ["extraLoot", "candyRain"],
  ["candyRain", "moreCandy"],
  ["moreCandy", "moreCandy2"],
  ["moreCandy2", "moreCandy3"],
  ["moreCandy3", "moreCandy4"],
  ["moreCandy4", "moreCandy5"],
  ["extraLoot", "moreLoot3"],
  ["moreLoot3", "lootPerPinataType"],
  ["moreLoot3", "lootBonusDamage"],
  ["lootBonusDamage", "lootPerDestroy"],
  ["lootPerDestroy", "luckySeven"],
  ["luckySeven", "luckySeven2"],
  ["extraLoot", "doubleLoot2"],
  ["doubleLoot2", "doubleLoot3"],
  ["doubleLoot3", "spawnExtraLoot"],
  ["spawnExtraLoot", "spawnExtraLoot2"],
  ["spawnExtraLoot", "spawnExtraLoot3"],
  ["spawnExtraLoot2", "spawnExtraLoot4"],
  ["spawnExtraLoot3", "spawnExtraLoot4"],
  ["bornLucky", "moreLuck"],
  ["moreLuck", "superLuck"],
  ["superLuck", "superJackpot"],
  ["superJackpot", "superJackpotChance"],
  ["superJackpotChance", "superJackpotChance2"],
  ["superJackpotChance2", "superJackpotChance3"],
  ["swing", "morePinatas"],
  ["hitRadius", "morePinatas"],
  ["morePinatas", "morePinatas2"],
  ["morePinatas2", "morePinatas3"],
  ["morePinatas3", "morePinatas4"],
  ["morePinatas4", "morePinatas5"],
  ["morePinatas5", "morePinatas6"],
  ["morePinatas6", "morePinatas7"],
  ["morePinatas7", "morePinatas8"],
  ["morePinatas8", "morePinatas9"],
  ["morePinatas", "timedSpawn"],
  ["timedSpawn", "fasterSpawns"],
  ["morePinatas", "respawnChance"],
  ["respawnChance", "respawnChance2"],
  ["respawnChance2", "respawnChance3"],
  ["respawnChance3", "respawnChance4"],
  ["respawnChance4", "respawnChance5"],
  ["hitRadius", "moreDamage"],
  ["hitRadius", "collateralDamage"],
  ["collateralDamage", "critChance"],
  ["critChance", "critDamage"],
  ["critDamage", "moreCritDamage"],
  ["critDamage", "moreCritChance"],
  ["moreCritDamage", "lowHpCrits"],
  ["moreCritChance", "lowHpCrits"],
  ["lowHpCrits", "moreCritChance3"],
  ["moreCritChance3", "moreCritChance4"],
  ["moreCritChance4", "luckyCrit"],
  ["lowHpCrits", "critDamage2"],
  ["critDamage2", "moreCritDamage2"],
  ["moreCritDamage2", "moreCritDamage3"],
  ["moreCritDamage3", "moreCritDamage4"],
  ["collateralDamage", "phantomStick"],
  ["phantomStick", "phantomHandChance"],
  ["phantomHandChance", "phantomHandDamage"],
  ["phantomHandDamage", "phantomHandDamage2"],
  ["phantomHandDamage2", "phantomHandDamage3"],
  ["phantomHandChance", "phantomHandChance2"],
  ["phantomHandChance2", "phantomHandChance3"],
  ["phantomHandChance3", "phantomHandChance4"],
  ["phantomHandChance", "phantomMoreTargets"],
  ["collateralDamage", "firstHitDamage"],
  ["firstHitDamage", "moreDamage3"],
  ["moreDamage3", "damagePerDestroy"],
  ["damagePerDestroy", "moreDamage5"],
  ["moreDamage5", "oneSmash"],
  ["oneSmash", "oneSmashChance"],
  ["oneSmashChance", "oneSmashChance2"],
  ["moreDamage5", "moreFirstHitDamage"],
  ["moreFirstHitDamage", "moreDamage6"],
  ["damagePerDestroy", "crowdDamage"],
  ["crowdDamage", "moreCrowdDamage"],
  ["moreCrowdDamage", "rockRain"],
  ["rockRain", "rockRainChance"],
  ["rockRainChance", "rockRainChance2"],
  ["rockRain", "moreRocks"],
  ["moreRocks", "moreRocks2"],
  ["rockRain", "biggerBlast"],
  ["biggerBlast", "biggerBlast2"],
  ["rockRain", "rockRainDamage"],
  ["rockRainDamage", "rockRainDamage2"],
  ["moreDamage3", "firstHitMultiplier"],
  ["firstHitMultiplier", "moreDamage4"],
  ["moreDamage4", "moreDamage7"],
  ["moreDamage", "shockwave"],
  ["shockwave", "shockwaveChance"],
  ["shockwaveChance", "shockwaveChance2"],
  ["shockwaveChance2", "shockwaveChance3"],
  ["shockwave", "shockwaveDamage"],
  ["shockwaveDamage", "shockwaveDamage2"],
  ["shockwaveDamage2", "shockwaveDamage3"],
  ["shockwaveDamage3", "shockwaveDamage4"],
  ["shockwaveDamage4", "shockwaveDamage5"],
  ["moreDamage", "biggerStick2"],
  ["biggerStick2", "biggerStick3"],
  ["biggerStick3", "switchDamage"],
  ["switchDamage", "divineRay"],
  ["divineRay", "divineRayStrikes"],
  ["divineRayStrikes", "moreDivineRayStrikes"],
  ["moreDivineRayStrikes", "moreDivineRayStrikes2"],
  ["divineRay", "divineRayRadius"],
  ["divineRayRadius", "divineRayRadius2"],
  ["divineRay", "divineRayDamage"],
  ["divineRayDamage", "divineRayDamage2"],
  ["divineRay", "divineRayChance"],
  ["divineRayChance", "divineRayChance2"],
  ["switchDamage", "pinataShockwave"],
  ["pinataShockwave", "pinataShockwaveRadius"],
  ["pinataShockwaveRadius", "pinataShockwaveRadius2"],
  ["pinataShockwaveRadius2", "pinataShockwaveRadius3"],
  ["pinataShockwave", "pinataShockwaveDamage"],
  ["pinataShockwaveDamage", "pinataShockwaveDamage2"],
  ["pinataShockwaveDamage2", "pinataShockwaveDamage3"],
  ["pinataShockwave", "pinataShockwaveChance"],
  ["pinataShockwaveChance", "pinataShockwaveChance2"],
  ["pinataShockwaveChance2", "pinataShockwaveChance3"],
  ["switchDamage", "moreHitRadius"],
  ["moreHitRadius", "biggerStick4"],
  ["moreDamage", "moreDamage2"],
  ["moreDamage8", "moreDamage9"],
  ["moreDamage9", "moreDamage10"],
  ["moreCritChance5", "moreCritChance6"],
  ["moreCritChance6", "moreCritChance7"],
  ["moreCritDamage5", "moreCritDamage6"],
  ["moreCritDamage6", "moreCritDamage7"],
  ["moreSpeed4", "moreSpeed5"],
  ["moreSpeed5", "moreSpeed6"],
];

export const FINALE_UPGRADE_IDS = [
  "moreDamage8",
  "moreCritChance5",
  "moreCritDamage5",
  "moreSpeed4",
] as const satisfies readonly UpgradeId[];

/** Secondary currency from Fiesta order payments. Spends in the post-loss ticket shop. */
export const ORDER_CURRENCY = {
  candyPerUnit: 50,
  name: "Tickets",
  singular: "Ticket",
} as const;

export function orderCurrencyName(amount: number): string {
  return amount === 1 ? ORDER_CURRENCY.singular : ORDER_CURRENCY.name;
}

export const FIESTA_ORDERS = [
  { round: 1, name: "Neighborhood Kids", flavor: "It's Fiesta Day, and the neighborhood is out of candy.", target: 20, dueInRounds: 0 },
  { round: 2, name: "School Fiesta", flavor: "Supply the neighborhood school celebration.", target: 45, dueInRounds: 5 },
  { round: 3, name: "Block Party", flavor: "A much bigger crowd is coming.", target: 200, dueInRounds: 5 },
  { round: 4, name: "Grand Fiesta", flavor: "Decorations are ready; the candy table is not.", target: 750, dueInRounds: 9 },
  { round: 5, name: "City Carnival", flavor: "The whole town is coming. Keep the candy tables full.", target: 1000, dueInRounds: 5 },
  { round: 6, name: "Street Parade", flavor: "Floats are rolling; the candy cannons are empty.", target: 2700, dueInRounds: 4 },
  { round: 7, name: "Stadium Fiesta", flavor: "A packed house wants souvenir bags at every seat.", target: 5800, dueInRounds: 5 },
  { round: 8, name: "Harbor Carnival", flavor: "Piers, boats, and a boardwalk all need filling.", target: 12000, dueInRounds: 5 },
  { round: 9, name: "State Fair", flavor: "Every booth on the midway is waiting on candy.", target: 34000, dueInRounds: 5 },
  { round: 10, name: "Capital Parade", flavor: "The capital is throwing a parade. Don't let the floats run dry.", target: 65000, dueInRounds: 5 },
  { round: 11, name: "National Holiday", flavor: "The whole country is celebrating. Keep the tables full.", target: 250000, dueInRounds: 6 },
  { round: 12, name: "World's Fair", flavor: "Pavilions from every nation need a candy drop.", target: 700000, dueInRounds: 5 },
  { round: 13, name: "Continental Carnival", flavor: "A coast-to-coast carnival tour with no off days.", target: 1000000, dueInRounds: 7 },
  { round: 14, name: "Royal Wedding", flavor: "A palace celebration. The guest list is enormous.", target: 4400000, dueInRounds: 5 },
  { round: 15, name: "Global Gala", flavor: "Simultaneous parties on every continent.", target: 7000000, dueInRounds: 5 },
  { round: 16, name: "Century Carnival", flavor: "A hundred-year fiesta. Stockpile like it lasts forever.", target: 16000000, dueInRounds: 5 },
  { round: 17, name: "World Parade", flavor: "One parade, every city, same weekend.", target: 24000000, dueInRounds: 5 },
  { round: 18, name: "Super Fiesta", flavor: "The biggest crowd yet. Empty every warehouse.", target: 36000000, dueInRounds: 5 },
  { round: 19, name: "Fiesta Finale", flavor: "Over-the-top final order; empty the rafters.", target: 56000000, dueInRounds: 5 },
] as const;

/** Orders unlock after this many upgrade purchases (Damage + one branch). */
export const ORDERS_UNLOCK_UPGRADES = 2;

/** Debug: Fiesta orders cost 0 candy and skip unlock/bank gates. */
export const DEBUG_FREE_ORDERS = false;

export const CAMERA_DEFAULTS = {
  fov: 16,
  height: 0.35,
  distance: 18,
  lookAtY: 5.2,
  orthographic: false,
  orthoSize: 6.5,
};

export const MOVEMENT_DEFAULTS = {
  horizontalSpeed: 1.0,
  verticalSpeed: 0.55,
  travelRangeX: 0.42,
  travelRangeY: 1.05,
  overlapPadding: 0.85,
  /** Portrait play AABB at play depth — Game overwrites from the camera frustum. */
  boundMinX: -1.15,
  boundMaxX: 1.15,
  boundMinY: 3.45,
  boundMaxY: 7.15,
};
