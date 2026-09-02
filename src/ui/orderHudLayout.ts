export type OrderHudLayout = {
  boxWidth: number;
  boxHeight: number;
  bottom: number;
  shiftX: number;
  kidWidth: number;
  kidRight: number;
  kidBottom: number;
  clockSize: number;
  candySize: number;
  candyIcon: number;
  candyTop: number;
  dueKicker: number;
  dueValue: number;
  dueBottom: number;
  dueGap: number;
  contentLeft: number;
  contentRight: number;
  frameY: number;
  frameX: number;
};

/** Factory values matching the last hand-tuned CSS. */
export const ORDER_HUD_DEFAULT: OrderHudLayout = {
  boxWidth: 216,
  boxHeight: 112,
  bottom: 22,
  shiftX: 0,
  kidWidth: 78,
  kidRight: -36,
  kidBottom: -2,
  clockSize: 44,
  candySize: 26,
  candyIcon: 28,
  candyTop: 14,
  dueKicker: 11,
  dueValue: 20,
  dueBottom: 10,
  dueGap: 5,
  contentLeft: 8,
  contentRight: 10,
  frameY: 24,
  frameX: 32,
};

export { ORDER_HUD_LAYOUT } from "./orderHudLayoutData";

export function cloneOrderHudLayout(layout: OrderHudLayout): OrderHudLayout {
  return { ...layout };
}

export function orderHudLayoutsEqual(a: OrderHudLayout, b: OrderHudLayout): boolean {
  const keys = Object.keys(a) as (keyof OrderHudLayout)[];
  return keys.every((key) => a[key] === b[key]);
}

export function applyOrderHudLayout(layout: OrderHudLayout): void {
  const root = document.documentElement.style;
  const kidOverhang = Math.max(0, -layout.kidRight);
  const overlayPad = layout.bottom + layout.boxHeight + Math.max(0, -layout.kidBottom) + 8;
  root.setProperty("--oh-box-w", `${layout.boxWidth}px`);
  root.setProperty("--oh-box-h", `${layout.boxHeight}px`);
  root.setProperty("--oh-bottom", `${layout.bottom}px`);
  root.setProperty("--oh-shift", `${layout.shiftX}px`);
  root.setProperty("--oh-kid-w", `${layout.kidWidth}px`);
  root.setProperty("--oh-kid-right", `${layout.kidRight}px`);
  root.setProperty("--oh-kid-bottom", `${layout.kidBottom}px`);
  root.setProperty("--oh-kid-overhang", `${kidOverhang}px`);
  root.setProperty("--oh-clock", `${layout.clockSize}px`);
  root.setProperty("--oh-candy-size", `${layout.candySize}px`);
  root.setProperty("--oh-candy-icon", `${layout.candyIcon}px`);
  root.setProperty("--oh-candy-top", `${layout.candyTop}px`);
  root.setProperty("--oh-due-kicker", `${layout.dueKicker}px`);
  root.setProperty("--oh-due-value", `${layout.dueValue}px`);
  root.setProperty("--oh-due-bottom", `${layout.dueBottom}px`);
  root.setProperty("--oh-due-gap", `${layout.dueGap}px`);
  root.setProperty("--oh-pad-l", `${layout.contentLeft}px`);
  root.setProperty("--oh-pad-r", `${layout.contentRight}px`);
  root.setProperty("--oh-frame-y", `${layout.frameY}px`);
  root.setProperty("--oh-frame-x", `${layout.frameX}px`);
  root.setProperty("--oh-overlay-pad", `${overlayPad}px`);
}
