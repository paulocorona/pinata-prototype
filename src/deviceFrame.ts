/** iPhone 15 CSS viewport (points). */
export const PHONE_WIDTH = 393;
export const PHONE_HEIGHT = 852;

function isHandheld(): boolean {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function isLandscape(): boolean {
  return window.matchMedia("(orientation: landscape)").matches;
}

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait" | "portrait-primary") => Promise<void>;
};

async function tryLockPortrait(): Promise<void> {
  const orientation = window.screen.orientation as LockableOrientation | undefined;
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    await orientation.lock("portrait");
  } catch {
    try {
      await orientation.lock("portrait-primary");
    } catch {
      /* iOS and non-fullscreen browsers reject the lock. */
    }
  }
}

/**
 * Lock to portrait when the browser allows it, and cover the screen on
 * handheld landscape so the game never switches to a rotated layout.
 */
export function installPortraitLock(gate: HTMLElement): void {
  const syncGate = () => {
    const block = isHandheld() && isLandscape();
    gate.classList.toggle("is-open", block);
    gate.setAttribute("aria-hidden", block ? "false" : "true");
  };

  void tryLockPortrait();
  window.addEventListener("pointerdown", () => void tryLockPortrait(), {
    passive: true,
    once: true,
  });

  window.addEventListener("resize", syncGate);
  window.addEventListener("orientationchange", () => {
    void tryLockPortrait();
    syncGate();
  });
  window.screen.orientation?.addEventListener("change", () => {
    void tryLockPortrait();
    syncGate();
  });
  window.visualViewport?.addEventListener("resize", syncGate);
  syncGate();
}

export function phoneScale(): number {
  const margin = 24;
  return Math.min(
    (window.innerWidth - margin) / PHONE_WIDTH,
    (window.innerHeight - margin) / PHONE_HEIGHT,
  );
}

/** Size the letterboxed phone slot and scale the screen to fit the window. */
export function fitPhoneFrame(slot: HTMLElement): void {
  const apply = () => {
    slot.style.setProperty("--phone-scale", String(phoneScale()));
  };
  apply();
  window.addEventListener("resize", apply);
}

/** Convert a viewport client point into an element's local CSS pixels. */
export function localPointFromClient(
  el: HTMLElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  const w = el.clientWidth || rect.width || 1;
  const h = el.clientHeight || rect.height || 1;
  return {
    x: ((clientX - rect.left) / Math.max(rect.width, 1e-6)) * w,
    y: ((clientY - rect.top) / Math.max(rect.height, 1e-6)) * h,
  };
}
