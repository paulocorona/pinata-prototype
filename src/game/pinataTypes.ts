import type { PinataSkinId } from "../world/pinataAssets";

/** Inclusive candy range with a band weight (percent of total loot rolls). */
export interface LootBand {
  min: number;
  max: number;
  weight: number;
}

export interface PinataTypeDef {
  id: string;
  name: string;
  hp: number;
  /** Break candy table. Band weights should sum to ~100. */
  loot: LootBand[];
  /** Texture pack on the shared mesh. Defaults to normal. */
  skin?: PinataSkinId;
  /** Roams to grab floor candy; break loot is grabbed × payoutMult when full. */
  thief?: boolean;
}

/** 6th type: fills for fillDurationSec, then smash pays grabbed candy × payoutMult. */
export const THIEF = {
  fillDurationSec: 5,
  payoutMult: 1.5,
} as const;

/**
 * Compact loot format:
 *   1-3 (66%)
 *   4-6 (30%)
 *   15-22 (4%)
 * → pick a band by weight, then roll uniformly among integers in [min, max].
 */
export const BASIC_PINATA: PinataTypeDef = {
  id: "basic",
  name: "Normal",
  hp: 5,
  skin: "normal",
  loot: [
    { min: 1, max: 3, weight: 66 },
    { min: 4, max: 6, weight: 30 },
    { min: 15, max: 22, weight: 4 },
  ],
};

/** 2nd unlock (130 candy from run start). */
export const WOODEN_PINATA: PinataTypeDef = {
  id: "wooden",
  name: "Fur",
  hp: 20,
  skin: "fur",
  loot: [
    { min: 10, max: 17, weight: 65 },
    { min: 19, max: 27, weight: 32 },
    { min: 110, max: 160, weight: 3 },
  ],
};

/** 3rd unlock (3500 candy, counting from when Fur unlocks). */
export const TIGER_PINATA: PinataTypeDef = {
  id: "tiger",
  name: "Wood",
  hp: 70,
  skin: "wood",
  loot: [
    { min: 72, max: 101, weight: 47.9 },
    { min: 114, max: 167, weight: 30 },
    { min: 205, max: 273, weight: 20 },
    { min: 715, max: 1072, weight: 2.1 },
  ],
};

/** 4th unlock (10000 candy, counting from when Wood unlocks). */
export const NEXT_PINATA: PinataTypeDef = {
  id: "next",
  name: "Jade",
  hp: 105,
  skin: "jade",
  loot: [
    { min: 3, max: 14, weight: 18.8 },
    { min: 34, max: 64, weight: 20 },
    { min: 130, max: 254, weight: 20 },
    { min: 320, max: 551, weight: 20 },
    { min: 804, max: 1288, weight: 21.2 },
  ],
};

/** 5th unlock (20k candy, counting from when the previous type unlocks). */
export const NEXT5_PINATA: PinataTypeDef = {
  id: "next5",
  name: "Angry",
  hp: 190,
  skin: "angry",
  loot: [
    { min: 498, max: 794, weight: 63.9 },
    { min: 901, max: 1399, weight: 35 },
    { min: 2370, max: 3555, weight: 1.1 },
  ],
};

/** 6th unlock (30k candy). Roams 5s grabbing floor candy (later); pays 1.5× when full. */
export const NEXT6_PINATA: PinataTypeDef = {
  id: "next6",
  name: "Rock",
  hp: 80,
  skin: "rock",
  thief: true,
  loot: [],
};

/** 7th unlock (50k candy, counting from when the previous type unlocks). */
export const NEXT7_PINATA: PinataTypeDef = {
  id: "next7",
  name: "Ice",
  hp: 420,
  skin: "ice",
  loot: [
    { min: 1299, max: 1740, weight: 66.6 },
    { min: 2156, max: 3014, weight: 31 },
    { min: 10045, max: 14455, weight: 2.4 },
  ],
};

/** 8th unlock (180k candy, counting from when the previous type unlocks). */
export const NEXT8_PINATA: PinataTypeDef = {
  id: "next8",
  name: "Circuit",
  hp: 840,
  skin: "circuit",
  loot: [
    { min: 2491, max: 3487, weight: 48.2 },
    { min: 4109, max: 5603, weight: 30 },
    { min: 6848, max: 9463, weight: 20 },
    { min: 9463, max: 14443, weight: 1.8 },
  ],
};

/** 9th unlock (600k candy, counting from when the previous type unlocks). */
export const NEXT9_PINATA: PinataTypeDef = {
  id: "next9",
  name: "Carbon Fiber",
  hp: 1680,
  skin: "carbonFiber",
  loot: [
    { min: 5250, max: 7750, weight: 46.2 },
    { min: 8500, max: 12125, weight: 33 },
    { min: 14125, max: 18250, weight: 19 },
    { min: 52500, max: 85000, weight: 1.8 },
  ],
};

/** 10th unlock (1M candy, counting from when the previous type unlocks). */
export const NEXT10_PINATA: PinataTypeDef = {
  id: "next10",
  name: "Electric",
  hp: 3000,
  skin: "electric",
  loot: [
    { min: 10801, max: 18001, weight: 62.8 },
    { min: 20401, max: 30001, weight: 36 },
    { min: 132001, max: 199201, weight: 1.2 },
  ],
};

/** 11th unlock (2M candy, counting from when the previous type unlocks). */
export const NEXT11_PINATA: PinataTypeDef = {
  id: "next11",
  name: "Gingerbread",
  hp: 3360,
  skin: "gingerbread",
  loot: [
    { min: 12876, max: 17511, weight: 46.8 },
    { min: 19313, max: 28068, weight: 33 },
    { min: 30257, max: 43132, weight: 19 },
    { min: 151926, max: 224026, weight: 1.2 },
  ],
};

/** 12th unlock (5M candy, counting from when the previous type unlocks). */
export const NEXT12_PINATA: PinataTypeDef = {
  id: "next12",
  name: "Rainbow",
  hp: 748,
  skin: "rainbow",
  loot: [
    { min: 96001, max: 144001, weight: 35 },
    { min: 156001, max: 252001, weight: 46.8 },
    { min: 288001, max: 384001, weight: 12 },
    { min: 420001, max: 540001, weight: 6 },
    { min: 2760000, max: 3960000, weight: 0.3 },
  ],
};

/** 13th unlock (6M candy, counting from when the previous type unlocks). */
export const NEXT13_PINATA: PinataTypeDef = {
  id: "next13",
  name: "Lava",
  hp: 748,
  skin: "lava",
  loot: [
    { min: 101001, max: 151501, weight: 34.9 },
    { min: 164126, max: 265126, weight: 46.8 },
    { min: 303001, max: 404001, weight: 12 },
    { min: 441876, max: 568126, weight: 6 },
    { min: 2900000, max: 4170000, weight: 0.3 },
  ],
};

/** 14th unlock (10M candy, counting from when the previous type unlocks). */
export const NEXT14_PINATA: PinataTypeDef = {
  id: "next14",
  name: "Galaxy",
  hp: 26880,
  skin: "galaxy",
  loot: [
    { min: 100050, max: 135700, weight: 34.9 },
    { min: 147200, max: 237050, weight: 46.5 },
    { min: 264500, max: 324300, weight: 12 },
    { min: 354200, max: 441600, weight: 6 },
    { min: 1770000, max: 2710000, weight: 0.6 },
  ],
};

/** 15th unlock (25M candy, counting from when the previous type unlocks). */
export const NEXT15_PINATA: PinataTypeDef = {
  id: "next15",
  name: "Gold",
  hp: 53760,
  skin: "gold",
  loot: [
    { min: 194350, max: 282900, weight: 34.9 },
    { min: 305900, max: 494402, weight: 46.5 },
    { min: 570400, max: 706100, weight: 12 },
    { min: 788900, max: 1010000, weight: 6 },
    { min: 5300000, max: 7650000, weight: 0.6 },
  ],
};

export const PINATA_TYPES = {
  basic: BASIC_PINATA,
  wooden: WOODEN_PINATA,
  tiger: TIGER_PINATA,
  next: NEXT_PINATA,
  next5: NEXT5_PINATA,
  next6: NEXT6_PINATA,
  next7: NEXT7_PINATA,
  next8: NEXT8_PINATA,
  next9: NEXT9_PINATA,
  next10: NEXT10_PINATA,
  next11: NEXT11_PINATA,
  next12: NEXT12_PINATA,
  next13: NEXT13_PINATA,
  next14: NEXT14_PINATA,
  next15: NEXT15_PINATA,
} as const;

export type PinataTypeId = keyof typeof PINATA_TYPES;

export function isThiefPinata(typeId: string): boolean {
  return typeId in PINATA_TYPES && PINATA_TYPES[typeId as PinataTypeId].thief === true;
}

/** Static type portrait from the provided renders. */
export function pinataPortraitSrc(typeId: string): string {
  const skin =
    typeId in PINATA_TYPES
      ? PINATA_TYPES[typeId as PinataTypeId].skin ?? "normal"
      : "normal";
  return `/pinata/portraits/${skin}.png`;
}

/** Floor candy collected this life, × payoutMult only after the fill timer. */
export function thiefBreakLoot(grabbedCandy: number, full: boolean): number {
  const grabbed = Math.max(0, Math.round(grabbedCandy));
  return full ? Math.round(grabbed * THIEF.payoutMult) : grabbed;
}

export function rollLoot(
  loot: LootBand[],
  roll01: number,
  intRoll: (min: number, max: number) => number,
  luck = 0,
  luckRoll01 = 1,
): number {
  if (loot.length === 0) return 0;
  const total = loot.reduce((sum, band) => sum + band.weight, 0);
  let cursor = roll01 * total;
  let index = loot.length - 1;
  for (let i = 0; i < loot.length; i++) {
    cursor -= loot[i]!.weight;
    if (cursor <= 0) {
      index = i;
      break;
    }
  }
  if (luck > 0 && index < loot.length - 1 && luckRoll01 < luck) {
    index += 1;
  }
  const band = loot[index]!;
  return intRoll(band.min, band.max);
}

/** Highest loot-tier roll (glowing / jackpot pinatas). */
export function rollJackpot(loot: LootBand[], intRoll: (min: number, max: number) => number): number {
  const band = loot[loot.length - 1] ?? loot[0];
  if (!band) return 0;
  return intRoll(band.min, band.max);
}
