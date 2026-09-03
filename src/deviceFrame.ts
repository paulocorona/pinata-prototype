/** iPhone 15 CSS viewport (points). Desktop letterbox target. */
export const PHONE_WIDTH = 393;
export const PHONE_HEIGHT = 852;

const HANDHELD_MQ = "(hover: none) and (pointer: coarse)";

export function isHandheld(): boolean {
  return window.matchMedia(HANDHELD_MQ).matches;
}

function isLandscape(): boolean {
  return window.matchMedia("(orientation: landscape)").matches;
}

function viewportRect(): { width: number; height: number; left: number; top: number } {
  const vv = window.visualViewport;
  if (vv) {
    return { width: vv.width, height: vv.height, left: vv.offsetLeft, top: vv.offsetTop };
  }
  return { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };
}

/** Fire when the visible area moves or resizes (including iOS Safari chrome). */
export function onViewportChange(cb: () => void): void {
  window.addEventListener("resize", cb);
  window.addEventListener("orientationchange", cb);
  window.visualViewport?.addEventListener("resize", cb);
  window.visualViewport?.addEventListener("scroll", cb);
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

  onViewportChange(syncGate);
  window.screen.orientation?.addEventListener("change", () => {
    void tryLockPortrait();
    syncGate();
  });
  syncGate();
}

export function phoneScale(): number {
  const { width, height } = viewportRect();
  const margin = 24;
  return Math.min((width - margin) / PHONE_WIDTH, (height - margin) / PHONE_HEIGHT);
}

function clearHandheldSlot(slot: HTMLElement): void {
  slot.style.removeProperty("position");
  slot.style.removeProperty("left");
  slot.style.removeProperty("top");
  slot.style.removeProperty("width");
  slot.style.removeProperty("height");
}

/**
 * Desktop: letterbox the 393×852 frame in the window.
 * Handheld: fill the visual viewport (Safari chrome, notches, URL bar).
 */
export function fitPhoneFrame(slot: HTMLElement): void {
  const apply = () => {
    const handheld = isHandheld();
    document.documentElement.classList.toggle("is-handheld", handheld);
    const view = viewportRect();
    document.documentElement.style.setProperty(
      "--vv-offset-top",
      handheld ? `${Math.max(0, Math.round(view.top))}px` : "0px",
    );
    if (handheld) {
      slot.style.position = "fixed";
      slot.style.left = `${view.left}px`;
      slot.style.top = `${view.top}px`;
      slot.style.width = `${Math.max(1, view.width)}px`;
      slot.style.height = `${Math.max(1, view.height)}px`;
      slot.style.setProperty("--phone-scale", "1");
      return;
    }
    clearHandheldSlot(slot);
    slot.style.setProperty("--phone-scale", String(phoneScale()));
  };

  apply();
  onViewportChange(apply);
  window.matchMedia(HANDHELD_MQ).addEventListener("change", apply);
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
