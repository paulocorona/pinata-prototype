import type { GameState } from "../game/GameState";
import { orderCurrencyName } from "../game/balance";
import { formatNumber } from "../util/math";

/** Shown when a Fiesta order comes due unpaid — payout for bills paid this run. */
export class LoseScreen {
  readonly el: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-lose hidden";
    root.appendChild(this.el);
  }

  show(state: GameState, onContinue: () => void): void {
    const earned = state.ticketsEarnedThisRun;
    const noun = orderCurrencyName(earned);
    this.el.innerHTML = `
      <div class="panel boot-title">
        <div class="brand brand-lose">YOU LOSE</div>
        <p class="sub">A Fiesta Order came due and was not paid. The party is over.</p>
        <div class="ticket-payout">
          <div class="ticket-payout-label">Earned this run for paying those bills</div>
          <div class="ticket-payout-row">
            <span class="ticket-icon" aria-hidden="true"></span>
            <span class="ticket-payout-value">${formatNumber(earned)}</span>
          </div>
          <div class="ticket-payout-noun">${noun}</div>
        </div>
        <button class="btn btn-primary interactive" data-continue>Continue</button>
      </div>
    `;
    this.el.classList.remove("hidden");
    this.el.querySelector("[data-continue]")!.addEventListener("click", () => {
      this.hide();
      onContinue();
    });
  }

  hide(): void {
    this.el.classList.add("hidden");
  }
}
