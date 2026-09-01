import type { GameState } from "../game/GameState";
import { ORDER_CURRENCY } from "../game/balance";
import { assetUrl } from "../util/assetUrl";
import { formatNumber } from "../util/math";

/** Bottom-center candy bank — shown on round-end and upgrades screens only. */
export class CandyBalance {
  readonly el: HTMLElement;
  private valueEl: HTMLElement;
  private ticketEl: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "candy-balance hidden";
    this.el.innerHTML = `
      <img class="candy-coin-icon candy-balance-icon" src="${assetUrl("art/T_CandyCoin.png")}" alt="" draggable="false" aria-hidden="true" />
      <span class="candy-balance-value" data-value>0</span>
      <span class="candy-balance-divider" aria-hidden="true"></span>
      <span class="ticket-icon" aria-hidden="true"></span>
      <span class="ticket-balance-value" data-tickets>0</span>
    `;
    root.appendChild(this.el);
    this.valueEl = this.el.querySelector("[data-value]")!;
    this.ticketEl = this.el.querySelector("[data-tickets]")!;
    this.ticketEl.setAttribute("title", ORDER_CURRENCY.name);
  }

  show(): void {
    this.el.classList.remove("hidden");
  }

  hide(): void {
    this.el.classList.add("hidden");
  }

  sync(state: GameState, source: "run" | "shop" | "tickets" = "run"): void {
    this.valueEl.textContent = formatNumber(source === "shop" ? state.shopCandy : state.candy);
    this.ticketEl.textContent = formatNumber(state.tickets);
    this.el.classList.toggle("is-shop", source === "shop");
    this.el.classList.toggle("is-tickets", source === "tickets");
  }
}
