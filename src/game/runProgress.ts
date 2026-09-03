import type { UpgradeLevels } from "./balance";
import type { BreaksByType, Phase, RoundStats } from "./GameState";
import type { PinataTypeId } from "./pinataTypes";
import type { PinataUnlockDef } from "./unlocks";

const STORAGE_KEY = "pinata-run-progress-v1";

export interface RunProgressSave {
  phase: Phase;
  round: number;
  candy: number;
  roundCandy: number;
  ticketProgress: number;
  ticketsEarnedThisRun: number;
  orderIndex: number;
  orderContributed: number;
  orderDueInRounds: number;
  ordersAssigned: boolean;
  firstKidWarningPending: boolean;
  nextOrderAwaitingRound: boolean;
  finalOrderPaid: boolean;
  upgrades: UpgradeLevels;
  stamina: number;
  maxStamina: number;
  combo: number;
  roundFirstHitUsed: boolean;
  bestBreakRate: number;
  totalBreaks: number;
  totalBreaksByType: BreaksByType;
  totalCandyEarned: number;
  candyAtUnlock: (number | null)[];
  spawnPinataTypes: PinataTypeId[];
  /** Smash round when each type first entered the spawn pool. */
  firstSpawnRoundByType: Partial<Record<string, number>>;
  roundStartUnlockedIds: string[];
  newlyUnlockedThisRound: PinataUnlockDef[];
  totalHits: number;
  totalSwings: number;
  stickHits: number;
  luckySevenHits: number;
  comboSaverUsed: boolean;
  brightStartPending: boolean;
  secondWindUsed: boolean;
  rockRainBlockedRemaining: number;
  lastStickHitType: string | null;
  rageRemaining: number;
  consecutiveMisses: number;
  tantrumRemaining: number;
  secondWindBoostRemaining: number;
  candyRainBank: number;
  staminaUsedThisRun: number;
  candyRainBreaks: number;
  roundStats: RoundStats;
  history: RoundStats[];
}

export function hasRunProgressSave(): boolean {
  return loadRunProgressSave() != null;
}

export function loadRunProgressSave(): RunProgressSave | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RunProgressSave>;
    if (parsed.phase === "boot" || typeof parsed.round !== "number" || parsed.round < 1) {
      return null;
    }
    return parsed as RunProgressSave;
  } catch {
    return null;
  }
}

export function saveRunProgressSave(save: RunProgressSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Ignore private-mode / quota failures.
  }
}

export function clearRunProgressSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore private-mode / quota failures.
  }
}
