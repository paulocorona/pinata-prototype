const STORAGE_KEY = "pinata-tutorial-v1";

export function hasCompletedRound1Tutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markRound1TutorialComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export function clearRound1Tutorial(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode / quota */
  }
}
