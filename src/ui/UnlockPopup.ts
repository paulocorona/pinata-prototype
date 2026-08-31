import type { PinataUnlockDef } from "../game/unlocks";
import { UnlockPinataPreview, skinForUnlockType } from "./UnlockPinataPreview";

export class UnlockPopup {
  readonly el: HTMLElement;
  private preview: UnlockPinataPreview | null = null;
  private onContinue: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay hidden";
    root.appendChild(this.el);
  }

  show(entry: PinataUnlockDef, onContinue: () => void): void {
    this.disposePreview();
    this.onContinue = onContinue;
    this.el.innerHTML = `
      <div class="panel panel-unlock">
        <div class="unlock-popup-kicker">New Pinata Unlocked</div>
        <h1>${entry.name}</h1>
        <div class="unlock-popup-preview" data-unlock-preview></div>
        <p class="sub">It can appear starting next round.</p>
        <button class="btn btn-primary interactive" data-continue>Continue</button>
      </div>
    `;
    this.el.classList.remove("hidden");
    const previewHost = this.el.querySelector("[data-unlock-preview]");
    if (previewHost instanceof HTMLElement) {
      this.preview = new UnlockPinataPreview();
      void this.preview.mount(previewHost, {
        skin: skinForUnlockType(entry.id),
        fill: 1,
      });
    }
    this.el.querySelector("[data-continue]")!.addEventListener("click", () => {
      this.hide();
      this.onContinue?.();
    });
  }

  hide(): void {
    this.disposePreview();
    this.el.classList.add("hidden");
  }

  private disposePreview(): void {
    this.preview?.dispose();
    this.preview = null;
  }
}
