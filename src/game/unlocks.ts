import { PINATA_TYPES, type PinataTypeId } from "./pinataTypes";

export type UnlockMetric = "breaks" | "candy";

/** Lifetime requirement for a type (basic starts unlocked). */
export interface PinataUnlockDef {
  id: PinataTypeId | string;
  name: string;
  metric: UnlockMetric;
  required: number;
}

/**
 * Unlock ladder. Breaks are lifetime totals.
 * Candy for each type starts at 0 when the previous type unlocks — extra candy
 * past a threshold does not count toward the next type.
 * Types without a def in PINATA_TYPES stay UI-only (progress + name).
 */
export const PINATA_UNLOCK_LADDER: readonly PinataUnlockDef[] = [
  { id: "basic", name: "Normal", metric: "breaks", required: 0 },
  { id: "wooden", name: "Fur", metric: "candy", required: 130 },
  { id: "tiger", name: "Wood", metric: "candy", required: 3500 },
  { id: "next", name: "Jade", metric: "candy", required: 10000 },
  { id: "next5", name: "Angry", metric: "candy", required: 20000 },
  { id: "next6", name: "Rock", metric: "candy", required: 30000 },
  { id: "next7", name: "Ice", metric: "candy", required: 50000 },
  { id: "next8", name: "Circuit", metric: "candy", required: 180000 },
  { id: "next9", name: "Carbon Fiber", metric: "candy", required: 600000 },
  { id: "next10", name: "Electric", metric: "candy", required: 1000000 },
  { id: "next11", name: "Gingerbread", metric: "candy", required: 2000000 },
  { id: "next12", name: "Rainbow", metric: "candy", required: 5000000 },
  { id: "next13", name: "Lava", metric: "candy", required: 6000000 },
  { id: "next14", name: "Galaxy", metric: "candy", required: 10000000 },
  { id: "next15", name: "Gold", metric: "candy", required: 25000000 },
] as const;

export interface UnlockRunStats {
  totalBreaks: number;
  totalCandyEarned: number;
  /**
   * Lifetime candy when each ladder entry unlocked.
   * Index matches PINATA_UNLOCK_LADDER. Null until that entry unlocks.
   */
  candyAtUnlock: readonly (number | null)[];
}

export function emptyCandyAtUnlock(): (number | null)[] {
  return PINATA_UNLOCK_LADDER.map(() => null);
}

function metricValue(entry: PinataUnlockDef, index: number, stats: UnlockRunStats): number {
  if (entry.metric === "breaks") return Math.max(0, Math.floor(stats.totalBreaks));
  const prev = index > 0 ? stats.candyAtUnlock[index - 1] : 0;
  if (prev == null) return 0;
  return Math.max(0, Math.floor(stats.totalCandyEarned) - prev);
}

export function isPinataUnlockReached(
  entry: PinataUnlockDef,
  index: number,
  stats: UnlockRunStats,
): boolean {
  if (index > 0 && stats.candyAtUnlock[index - 1] == null) return false;
  return metricValue(entry, index, stats) >= entry.required;
}

/** Snapshot candy totals for newly reached ladder entries, in order. */
export function captureUnlockCandy(
  candyAtUnlock: (number | null)[],
  totalCandyEarned: number,
  totalBreaks: number,
): void {
  const stats: UnlockRunStats = { totalBreaks, totalCandyEarned, candyAtUnlock };
  for (let i = 0; i < PINATA_UNLOCK_LADDER.length; i++) {
    if (candyAtUnlock[i] != null) continue;
    const entry = PINATA_UNLOCK_LADDER[i]!;
    if (!isPinataUnlockReached(entry, i, stats)) break;
    candyAtUnlock[i] = totalCandyEarned;
  }
}

export function initialCandyAtUnlock(): (number | null)[] {
  const candy = emptyCandyAtUnlock();
  captureUnlockCandy(candy, 0, 0);
  return candy;
}

/** Ladder ids reached so far, in order, stopping at the first locked entry. */
export function reachedUnlockIds(stats: UnlockRunStats): string[] {
  const ids: string[] = [];
  for (let i = 0; i < PINATA_UNLOCK_LADDER.length; i++) {
    const entry = PINATA_UNLOCK_LADDER[i]!;
    if (!isPinataUnlockReached(entry, i, stats)) break;
    ids.push(entry.id);
  }
  return ids;
}

/** Types that crossed their goal since `previouslyReachedIds` (skips Normal). */
export function newlyReachedUnlocks(
  stats: UnlockRunStats,
  previouslyReachedIds: readonly string[],
): PinataUnlockDef[] {
  const prev = new Set(previouslyReachedIds);
  const newly: PinataUnlockDef[] = [];
  for (let i = 0; i < PINATA_UNLOCK_LADDER.length; i++) {
    const entry = PINATA_UNLOCK_LADDER[i]!;
    if (!isPinataUnlockReached(entry, i, stats)) break;
    if (entry.required <= 0 || prev.has(entry.id)) continue;
    newly.push(entry);
  }
  return newly;
}

/** Unlocked ladder entries that have a spawnable type def. */
export function unlockedDefinedPinataTypes(stats: UnlockRunStats): PinataTypeId[] {
  const types: PinataTypeId[] = [];
  for (let i = 0; i < PINATA_UNLOCK_LADDER.length; i++) {
    const entry = PINATA_UNLOCK_LADDER[i]!;
    if (!isPinataUnlockReached(entry, i, stats)) break;
    if (entry.id in PINATA_TYPES) types.push(entry.id as PinataTypeId);
  }
  return types.length > 0 ? types : ["basic"];
}

export function unlockedPinataTypeCount(stats: UnlockRunStats): number {
  return unlockedDefinedPinataTypes(stats).length;
}

export function pickSpawnPinataType(types: readonly PinataTypeId[], roll01: number): PinataTypeId {
  const pool = types.length > 0 ? types : (["basic"] as const);
  const t = Math.min(1, Math.max(0, roll01));
  const index = Math.min(pool.length - 1, Math.floor(t * pool.length));
  return pool[index]!;
}

export interface UnlockProgress {
  /** Next type in the ladder, or null when fully unlocked. */
  next: PinataUnlockDef | null;
  /** Progress toward the next threshold (clamped). */
  current: number;
  required: number;
  /** 0–1 fill for the silhouette. */
  progress: number;
  /** True when every ladder entry is unlocked. */
  complete: boolean;
}

export function getUnlockProgress(stats: UnlockRunStats): UnlockProgress {
  const nextIndex = PINATA_UNLOCK_LADDER.findIndex(
    (entry, i) => !isPinataUnlockReached(entry, i, stats),
  );
  if (nextIndex < 0) {
    return { next: null, current: 0, required: 0, progress: 1, complete: true };
  }
  const next = PINATA_UNLOCK_LADDER[nextIndex]!;
  const current = Math.min(next.required, metricValue(next, nextIndex, stats));
  return {
    next,
    current,
    required: next.required,
    progress: Math.min(1, current / Math.max(1, next.required)),
    complete: false,
  };
}
