import type { GameState } from "../game/GameState";
import { formatNumber } from "../util/math";

export class RoundHud {
  readonly el: HTMLElement;
  readonly energyCard: HTMLElement;
  onGoEnded: (() => void) | null = null;
  private energyFill: HTMLElement;
  private energyValue: HTMLElement;
  private countdownEl: HTMLElement;
  private countdownBeat = "";
  private goEndTimer = 0;
  private goPending = false;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "hud hidden";
    this.el.innerHTML = `
      <div class="hud-card hud-card-energy">
        <h3>Energy</h3>
        <div class="hud-value" data-energy-value>100/100</div>
        <div class="energy-bar"><div class="energy-fill" data-energy-fill></div></div>
      </div>
      <div class="hud-countdown-veil" aria-hidden="true"></div>
      <div class="hud-countdown hidden" data-countdown aria-hidden="true"></div>
    `;
    root.appendChild(this.el);
    this.energyCard = this.el.querySelector(".hud-card-energy")!;
    this.energyFill = this.el.querySelector("[data-energy-fill]")!;
    this.energyValue = this.el.querySelector("[data-energy-value]")!;
    this.countdownEl = this.el.querySelector("[data-countdown]")!;
    this.countdownEl.addEventListener("animationend", () => {
      if (!this.countdownEl.classList.contains("is-go")) return;
      this.finishGo();
    });
  }

  show(): void {
    this.el.classList.remove("hidden");
  }

  hide(): void {
    this.el.classList.add("hidden");
    this.hideCountdown();
  }

  /** Dim the arena and hide energy before the first 3 / 2 / 1 beat. */
  beginCountdown(): void {
    this.clearGoWait();
    this.countdownBeat = "";
    this.setCountingDown(true);
    this.el.classList.remove("is-go-beat");
    this.countdownEl.textContent = "";
    this.countdownEl.classList.add("hidden");
    this.countdownEl.classList.remove("is-slam", "is-go");
  }

  /** Slam a countdown beat (3 / 2 / 1 / GO) in huge, then scale it down. */
  showCountdownBeat(label: string, kind: "count" | "go" = "count"): void {
    if (this.countdownBeat === label) return;
    this.countdownBeat = label;
    this.setCountingDown(true);
    this.el.classList.toggle("is-go-beat", kind === "go");
    this.countdownEl.textContent = label;
    this.countdownEl.classList.toggle("is-go", kind === "go");
    this.countdownEl.classList.remove("hidden", "is-slam");
    void this.countdownEl.offsetWidth;
    this.countdownEl.classList.add("is-slam");
    if (kind === "go") {
      this.goPending = true;
      window.clearTimeout(this.goEndTimer);
      this.goEndTimer = window.setTimeout(() => this.finishGo(), 800);
    }
  }

  hideCountdown(): void {
    this.clearGoWait();
    this.hideCountdownNumber();
    this.setCountingDown(false);
  }

  private finishGo(): void {
    if (!this.goPending) return;
    this.clearGoWait();
    this.hideCountdownNumber();
    this.endCountdownDim();
    this.onGoEnded?.();
  }

  private clearGoWait(): void {
    this.goPending = false;
    window.clearTimeout(this.goEndTimer);
    this.goEndTimer = 0;
  }

  /** Hide 3 / 2 / 1 / GO without lifting the dim. */
  hideCountdownNumber(): void {
    this.countdownBeat = "";
    this.countdownEl.textContent = "";
    this.countdownEl.classList.add("hidden");
    this.countdownEl.classList.remove("is-slam", "is-go");
  }

  /** Lift the dim and show energy. */
  endCountdownDim(): void {
    this.setCountingDown(false);
  }

  private setCountingDown(active: boolean): void {
    this.el.classList.toggle("is-counting-down", active);
    if (!active) this.el.classList.remove("is-go-beat");
  }

  sync(state: GameState): void {
    const pct = state.maxStamina > 0 ? state.stamina / state.maxStamina : 0;
    this.energyFill.style.transform = `scaleX(${pct})`;
    this.energyFill.classList.toggle("is-low-bonus", state.getLowStaminaLootBonus() > 0);
    this.energyValue.textContent = `${formatNumber(Math.max(0, Math.ceil(state.stamina)))}/${formatNumber(state.maxStamina)}`;
  }

  flashCombo(_combo: number): void {}

  flashRage(): void {}

  flashTantrum(): void {}

  flashCandyRain(_payout: number): void {}
}
