import type { GameState } from "../game/GameState";
import { formatPercent, formatSwingRate, hitRadiusMultFor } from "../game/balance";
import { formatNumber } from "../util/math";

export class SummaryScreen {
  readonly el: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay hidden";
    root.appendChild(this.el);
  }

  show(state: GameState, onRestart: () => void): void {
    const hitRate =
      state.totalSwings > 0
        ? Math.min(100, Math.round((state.totalHits / state.totalSwings) * 100))
        : 0;
    const finished = state.history.length >= 5;
    this.el.innerHTML = `
      <div class="panel boot-title">
        <div class="brand">${finished ? "Fiesta Complete!" : "Fiesta Over!"}</div>
        <p class="sub">${
          finished
            ? "Five rounds of upward chaos. Here's the party report."
            : `You wrapped after ${state.history.length} round${state.history.length === 1 ? "" : "s"}. Here's the party report.`
        }</p>
        <div class="stats-row" style="justify-content:center">
          <div class="stat-chip"><div class="label">Total Candy</div><div class="value">${formatNumber(state.totalCandyEarned)}</div></div>
          <div class="stat-chip"><div class="label">Breaks</div><div class="value">${formatNumber(state.totalBreaks)}</div></div>
          <div class="stat-chip"><div class="label">Hit Rate</div><div class="value">${hitRate}%</div></div>
          <div class="stat-chip"><div class="label">Best Aim</div><div class="value">${Math.round(state.bestBreakRate * 100)}%</div></div>
        </div>
        <div class="stats-row" style="justify-content:center">
          <div class="stat-chip"><div class="label">Damage</div><div class="value">${formatNumber(state.getPower())}</div></div>
          <div class="stat-chip"><div class="label">Swing</div><div class="value">${formatSwingRate(state.getSwingRate())}</div></div>
          <div class="stat-chip"><div class="label">Energy</div><div class="value">${formatNumber(state.getMaxStamina())}</div></div>
          <div class="stat-chip"><div class="label">Reach</div><div class="value">${hitRadiusMultFor(state.upgrades).toFixed(1)}</div></div>
          <div class="stat-chip"><div class="label">Loot</div><div class="value">${formatPercent(state.getCandyMultiplier())}</div></div>
        </div>
        <button class="btn btn-primary interactive" data-restart>Play Again</button>
      </div>
    `;
    this.el.classList.remove("hidden");
    this.el.querySelector("[data-restart]")!.addEventListener("click", () => {
      this.hide();
      onRestart();
    });
  }

  hide(): void {
    this.el.classList.add("hidden");
  }
}
