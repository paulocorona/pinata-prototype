/** iPhone 15 CSS viewport (points). */
export const PHONE_WIDTH = 393;
export const PHONE_HEIGHT = 852;
/** Bezel around the screen in CSS pixels, before scale. */
export const PHONE_BEZEL = 14;

export function phoneScale(): number {
  const dw = PHONE_WIDTH + PHONE_BEZEL * 2;
  const dh = PHONE_HEIGHT + PHONE_BEZEL * 2;
  const margin = 24;
  return Math.min(
    (window.innerWidth - margin) / dw,
    (window.innerHeight - margin) / dh,
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
