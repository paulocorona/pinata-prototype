import { PINATA_TYPES, type PinataTypeId } from "./pinataTypes";
import { unlockedDefinedPinataTypes, type UnlockRunStats } from "./unlocks";

/** Breaks to go from level 1 → 2. */
export const PINATA_LEVEL_BASE_BREAKS = 20;
/** Each next level costs this times the previous requirement. */
export const PINATA_LEVEL_GROWTH = 1.75;
/** Requirements snap to this after applying growth. */
export const PINATA_LEVEL_ROUND_TO = 5;
/** Extra loot per rank above 1 (level 2 = +5%, level 3 = +10%, …). */
export const PINATA_LEVEL_LOOT_PER_RANK = 0.05;

export interface PinataLevelProgress {
  /** 1-based rank. */
  level: number;
  /** Breaks counted toward the current level. */
  into: number;
  /** Breaks needed to leave the current level. */
  need: number;
  /** 0–1 fill of the current level. */
  fill: number;
}

export interface PinataLevelRow extends PinataLevelProgress {
  typeId: string;
  name: string;
  /** False until this type is on the spawn ladder. */
  unlocked: boolean;
  /** Breaks of this type during the round that just ended. */
  roundBreaks: number;
  /** Fill at the start of the round, or 0 if the type ranked up. */
  previousFill: number;
  /** How many levels this type gained during the round. */
  levelsGained: number;
  /** Extra loot from ranks above 1 (0.05 per rank). */
  lootBonus: number;
}

function roundToNearestMultiple(value: number, multiple: number): number {
  if (multiple <= 0) return Math.round(value);
  return Math.round(value / multiple) * multiple;
}

/**
 * Breaks required to go from `fromLevel` to `fromLevel + 1`.
 * Sequence: 20, 35, 60, 105, 185, …
 */
export function breaksToNextLevel(fromLevel: number): number {
  const level = Math.max(1, Math.floor(fromLevel));
  let need = PINATA_LEVEL_BASE_BREAKS;
  for (let i = 1; i < level; i++) {
    need = roundToNearestMultiple(need * PINATA_LEVEL_GROWTH, PINATA_LEVEL_ROUND_TO);
    need = Math.max(PINATA_LEVEL_ROUND_TO, need);
  }
  return need;
}

/** Additive loot bonus from ranks above 1. Level 1 → 0, level 2 → 0.05. */
export function pinataLevelLootBonus(level: number): number {
  return Math.max(0, Math.floor(level) - 1) * PINATA_LEVEL_LOOT_PER_RANK;
}

export function pinataLevelLootMultiplier(level: number): number {
  return 1 + pinataLevelLootBonus(level);
}

export function pinataLevelFromBreaks(totalBreaks: number): PinataLevelProgress {
  let remaining = Math.max(0, Math.floor(totalBreaks));
  let level = 1;
  for (;;) {
    const need = breaksToNextLevel(level);
    if (remaining < need) {
      return {
        level,
        into: remaining,
        need,
        fill: need > 0 ? remaining / need : 0,
      };
    }
    remaining -= need;
    level += 1;
    if (level > 10_000) {
      return { level, into: 0, need, fill: 0 };
    }
  }
}

export function describePinataLevel(
  typeId: string,
  totalBreaks: number,
  roundBreaks = 0,
  unlocked = true,
): PinataLevelRow {
  const def = typeId in PINATA_TYPES ? PINATA_TYPES[typeId as PinataTypeId] : null;
  const current = pinataLevelFromBreaks(totalBreaks);
  const priorBreaks = Math.max(0, Math.floor(totalBreaks) - Math.max(0, Math.floor(roundBreaks)));
  const previous = pinataLevelFromBreaks(priorBreaks);
  const sameLevel = previous.level === current.level;
  return {
    typeId,
    name: def?.name ?? typeId,
    unlocked,
    ...current,
    roundBreaks: Math.max(0, Math.floor(roundBreaks)),
    previousFill: sameLevel ? previous.fill : 0,
    levelsGained: Math.max(0, current.level - previous.level),
    lootBonus: pinataLevelLootBonus(current.level),
  };
}

export function pinataLevelRows(
  stats: UnlockRunStats,
  totalBreaksByType: Partial<Record<string, number>>,
  roundBreaksByType: Partial<Record<string, number>>,
): PinataLevelRow[] {
  const unlocked = new Set<string>(unlockedDefinedPinataTypes(stats));
  return (Object.keys(PINATA_TYPES) as PinataTypeId[]).map((id) =>
    describePinataLevel(id, totalBreaksByType[id] ?? 0, roundBreaksByType[id] ?? 0, unlocked.has(id)),
  );
}

const TYPE_ACCENTS: Record<string, string> = {
  basic: "#ff4d8a",
  wooden: "#d4a054",
  tiger: "#ff9f1c",
  next: "#2ec4b6",
  next5: "#7ad7f0",
  next6: "#c084fc",
  next7: "#fb7185",
  next8: "#34d399",
  next9: "#fbbf24",
  next10: "#60a5fa",
  next11: "#f472b6",
  next12: "#a3e635",
  next13: "#38bdf8",
  next14: "#f97316",
  next15: "#e879f9",
};

export function accentForPinataType(typeId: string): string {
  return TYPE_ACCENTS[typeId] ?? "#ffd166";
}
