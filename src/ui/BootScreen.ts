import { assetUrl } from "../util/assetUrl";

const BOOT_MARKUP = `
  <div class="boot-hero">
    <img class="boot-logo" src="${assetUrl("art/T_Logo.png")}" alt="Piñata Payday" draggable="false" />
    <div class="boot-actions">
      <button class="btn btn-primary boot-play interactive" data-start>PLAY</button>
      <button class="btn boot-shop interactive" data-shop>SHOP</button>
      <button class="btn boot-settings interactive" data-settings>SETTINGS</button>
    </div>
  </div>
`;

export class BootScreen {
  readonly el: HTMLElement;
  private playButton: HTMLButtonElement;

  constructor(root: HTMLElement) {
    this.el = root.querySelector(".overlay-boot") ?? document.createElement("div");
    this.el.className = "overlay overlay-boot";
    if (!this.el.querySelector("[data-start]")) {
      this.el.innerHTML = BOOT_MARKUP;
    }
    if (!this.el.parentElement) root.appendChild(this.el);

    const logo = this.el.querySelector<HTMLImageElement>(".boot-logo");
    if (logo) logo.src = assetUrl("art/T_Logo.png");

    this.playButton = this.el.querySelector("[data-start]") as HTMLButtonElement;

    this.playButton.addEventListener("click", () => {
      if (!this.onStart) return;
      this.hide();
      this.onStart();
    });
    this.el.querySelector("[data-shop]")!.addEventListener("click", () => {
      if (!this.onShop) return;
      this.hide();
      this.onShop();
    });
    this.el.querySelector("[data-settings]")!.addEventListener("click", () => {
      this.onSettings?.();
    });
  }

  private onStart: (() => void) | null = null;
  private onShop: (() => void) | null = null;
  private onSettings: (() => void) | null = null;

  setPlayLabel(continueRound?: number): void {
    const isContinue = continueRound != null && continueRound >= 1;
    this.playButton.classList.toggle("is-continue", isContinue);
    if (isContinue) {
      this.playButton.innerHTML = `
        <span class="boot-play-label">CONTINUE</span>
        <span class="boot-play-round">Round ${continueRound}</span>
      `;
    } else {
      this.playButton.textContent = "PLAY";
    }
  }

  show(
    onStart: () => void,
    onShop: (() => void) | null,
    onSettings: () => void,
    continueRound?: number,
  ): void {
    this.onStart = onStart;
    this.onShop = onShop;
    this.onSettings = onSettings;
    this.setPlayLabel(continueRound);
    this.el.classList.remove("hidden");
  }

  hide(): void {
    this.el.classList.add("hidden");
    this.el.classList.remove("is-behind-settings");
  }

  setBehindSettings(active: boolean): void {
    this.el.classList.toggle("is-behind-settings", active);
  }

  showError(message: string): void {
    this.el.classList.remove("hidden");
    let err = this.el.querySelector(".boot-error");
    if (!err) {
      err = document.createElement("p");
      err.className = "boot-error";
      this.el.querySelector(".boot-actions")?.prepend(err);
    }
    err.textContent = message;
  }
}

function placeFloatText(
  root: HTMLElement,
  el: HTMLElement,
  x: number,
  y: number,
  color: string,
  durationMs: number,
): void {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  root.appendChild(el);
  window.setTimeout(() => el.remove(), durationMs);
}

export function spawnFloatText(
  root: HTMLElement,
  x: number,
  y: number,
  text: string,
  color = "#ffd166",
  durationMs = 700,
  extraClass = "",
): void {
  const el = document.createElement("div");
  el.className = extraClass ? `float-text ${extraClass}` : "float-text";
  el.textContent = text;
  placeFloatText(root, el, x, y, color, durationMs);
}

/** Piñata-destroy loot popup: candy icon + amount (no leading +). */
export function spawnCandyFloatText(
  root: HTMLElement,
  x: number,
  y: number,
  amount: string,
  color = "#ffe600",
  durationMs = 1400,
): void {
  const el = document.createElement("div");
  el.className = "float-text float-text-candy";
  const icon = document.createElement("img");
  icon.className = "float-text-coin";
  icon.src = assetUrl("art/T_CandyCoin.png");
  icon.alt = "";
  icon.draggable = false;
  const label = document.createElement("span");
  label.className = "float-text-candy-amount";
  label.textContent = amount;
  el.append(icon, label);
  placeFloatText(root, el, x, y, color, durationMs);
}
