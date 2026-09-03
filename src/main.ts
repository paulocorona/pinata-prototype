import { Game } from "./game/Game";
import { fitPhoneFrame, installPortraitLock } from "./deviceFrame";
import { clearStickShopSave } from "./game/sticks";
import { clearTicketShopSave } from "./game/ticketShop";
import { clearRunProgressSave } from "./game/runProgress";
import { clearRound1Tutorial } from "./game/tutorialProgress";
import { applyOrderHudLayout, ORDER_HUD_LAYOUT } from "./ui/orderHudLayout";
import { applyAssetCssVars } from "./util/assetUrl";

const PROGRESS_WIPE_FLAG = "pinata-fresh-start-2026-09-03";

function wipePersistedProgressOnce(): void {
  try {
    if (localStorage.getItem(PROGRESS_WIPE_FLAG) === "1") return;
    clearTicketShopSave();
    clearStickShopSave();
    clearRunProgressSave();
    clearRound1Tutorial();
    localStorage.setItem(PROGRESS_WIPE_FLAG, "1");
  } catch {
    // Ignore private-mode / quota failures.
  }
}

wipePersistedProgressOnce();

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
