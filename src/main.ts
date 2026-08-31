import { Game } from "./game/Game";
import { fitPhoneFrame } from "./deviceFrame";

const phoneSlot = document.querySelector<HTMLElement>("#phone-slot");
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const uiRoot = document.querySelector<HTMLElement>("#ui-root");
const reticle = document.querySelector<HTMLElement>("#reticle");

if (!phoneSlot || !canvas || !uiRoot || !reticle) {
  throw new Error("Missing required DOM nodes");
}

fitPhoneFrame(phoneSlot);
new Game(canvas, uiRoot, reticle);
