import type { GameState } from "../game/GameState";
import { ORDER_CURRENCY } from "../game/balance";
import { formatNumber } from "../util/math";

function countNoun(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Shown when a Fiesta order comes due unpaid — payout for bills paid this run. */
export class LoseScreen {
  readonly el: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-lose hidden";
    root.appendChild(this.el);
  }

  show(state: GameState, onContinue: () => void): void {
    const candy = state.candyPaidThisRun();
    const kids = state.ordersCompletedThisRun();
    const tickets = state.ticketsEarnedThisRun;
    const kidsNoun = countNoun(kids, "kid", "kids");
    const ticketNoun = countNoun(tickets, "ticket", "tickets");
    this.el.innerHTML = `
      <div class="panel boot-title">
        <div class="brand brand-lose">YOU LOSE</div>
        <p class="sub">The kids went home crying, with empty candy bags.</p>
        <p class="sub lose-recap">But you gave ${formatNumber(candy)} candy to ${formatNumber(kids)} ${kidsNoun}. That gives you a total of ${formatNumber(tickets)} ${ticketNoun}. You get 1 ticket for each $${ORDER_CURRENCY.candyPerUnit} candy given to kids.</p>
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
