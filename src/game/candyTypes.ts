/** Candy pieces with fixed denominations — economy still uses total value. */
export interface CandyTypeDef {
  id: string;
  name: string;
  /** Value contributed to the candy bank / orders */
  value: number;
  color: string;
}

/**
 * Highest denomination first for greedy splits.
 * Blue=1, Yellow=5, Red=25, Gold=100.
 */
export const CANDY_TYPES = [
  { id: "gold", name: "Gold", value: 100, color: "#ffd166" },
  { id: "red", name: "Red", value: 25, color: "#ff4d8a" },
  { id: "yellow", name: "Yellow", value: 5, color: "#ff9f1c" },
  { id: "blue", name: "Blue", value: 1, color: "#4db8e8" },
] as const satisfies readonly CandyTypeDef[];

export type CandyTypeId = (typeof CANDY_TYPES)[number]["id"];

export type CandyPieceCounts = Partial<Record<CandyTypeId, number>>;

export function emptyCandyPieces(): CandyPieceCounts {
  return {};
}

/** Split a candy value into denomination piece counts (greedy). */
export function splitCandyValue(amount: number): CandyPieceCounts {
  let remaining = Math.max(0, Math.floor(amount));
  const pieces: CandyPieceCounts = {};
  for (const type of CANDY_TYPES) {
    if (remaining < type.value) continue;
    const count = Math.floor(remaining / type.value);
    pieces[type.id] = count;
    remaining -= count * type.value;
  }
  return pieces;
}

export function mergeCandyPieces(into: CandyPieceCounts, add: CandyPieceCounts): void {
  for (const type of CANDY_TYPES) {
    const n = add[type.id] ?? 0;
    if (n <= 0) continue;
    into[type.id] = (into[type.id] ?? 0) + n;
  }
}

export function candyPiecesValue(pieces: CandyPieceCounts): number {
  let total = 0;
  for (const type of CANDY_TYPES) {
    total += (pieces[type.id] ?? 0) * type.value;
  }
  return total;
}

/** Display order: common → rare (blue first). */
export function candyTypesForDisplay(): readonly (typeof CANDY_TYPES)[number][] {
  return [...CANDY_TYPES].reverse();
}
