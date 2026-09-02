import { Game } from "./game/Game";
import { fitPhoneFrame, installPortraitLock } from "./deviceFrame";
import { applyOrderHudLayout, ORDER_HUD_LAYOUT } from "./ui/orderHudLayout";
import { applyAssetCssVars } from "./util/assetUrl";

applyAssetCssVars();
applyOrderHudLayout(ORDER_HUD_LAYOUT);

if (import.meta.hot) {
  import.meta.hot.accept("./ui/orderHudLayout", (mod) => {
    if (mod?.ORDER_HUD_LAYOUT) applyOrderHudLayout(mod.ORDER_HUD_LAYOUT);
  });
}

const phoneSlot = document.querySelector<HTMLElement>("#phone-slot");
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const uiRoot = document.querySelector<HTMLElement>("#ui-root");
const reticle = document.querySelector<HTMLElement>("#reticle");
const rotateGate = document.querySelector<HTMLElement>("#rotate-gate");

if (!phoneSlot || !canvas || !uiRoot || !reticle || !rotateGate) {
  throw new Error("Missing required DOM nodes");
}

fitPhoneFrame(phoneSlot);
installPortraitLock(rotateGate);
new Game(canvas, uiRoot, reticle);
