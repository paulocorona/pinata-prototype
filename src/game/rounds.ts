export interface RoundConfig {
  round: number;
  movementMultiplier: number;
  /** 0 = horizontal only, 1 = +vertical, 2 = mixed fast */
  motionStyle: 0 | 1 | 2;
}

export const ROUNDS: RoundConfig[] = [
  { round: 1, movementMultiplier: 1, motionStyle: 2 },
  { round: 2, movementMultiplier: 1, motionStyle: 2 },
  { round: 3, movementMultiplier: 1, motionStyle: 2 },
  { round: 4, movementMultiplier: 1, motionStyle: 2 },
  { round: 5, movementMultiplier: 1, motionStyle: 2 },
];

export function getRoundConfig(round: number): RoundConfig {
  return ROUNDS[Math.max(0, Math.min(ROUNDS.length - 1, round - 1))]!;
}
