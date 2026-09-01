import type { GameState } from "../game/GameState";
import { ORDER_CURRENCY, orderCurrencyName } from "../game/balance";
import { TICKET_UPGRADES } from "../game/ticketShop";
import { formatNumber } from "../util/math";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Post-loss shop: spend Tickets on permanent upgrades. */
export class TicketShopScreen {
  readonly el: HTMLElement;
  private state: GameState | null = null;
  private onBuy: ((id: string) => void) | null = null;
  private onContinue: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-ticket-shop hidden";
    root.appendChild(this.el);
  }

  show(
    state: GameState,
    handlers: {
      onBuy: (id: string) => void;
      onContinue: () => void;
    },
  ): void {
    this.state = state;
    this.onBuy = handlers.onBuy;
    this.onContinue = handlers.onContinue;
    this.build();
    this.el.classList.remove("hidden");
  }

  refresh(): void {
    if (this.el.classList.contains("hidden") || !this.state) return;
    this.renderList();
    this.renderBalance();
  }

  hide(): void {
    this.el.classList.add("hidden");
    this.state = null;
    this.onBuy = null;
    this.onContinue = null;
  }

  private build(): void {
    const noun = ORDER_CURRENCY.name;
    this.el.innerHTML = `
      <div class="panel panel-ticket-shop">
        <h1>Ticket Shop</h1>
        <p class="sub">${noun} stay with you. Spend them on upgrades that last across runs.</p>
        <div class="ticket-shop-balance" data-balance></div>
        <div class="ticket-shop-list" data-list></div>
        <p class="ticket-shop-soon">MORE COMING SOON...</p>
        <button class="btn btn-primary interactive" data-continue>Continue</button>
      </div>
    `;
    this.el.querySelector("[data-continue]")!.addEventListener("click", () => {
      const next = this.onContinue;
      this.hide();
      next?.();
    });
    this.renderBalance();
    this.renderList();
  }

  private renderBalance(): void {
    const state = this.state;
    const el = this.el.querySelector("[data-balance]");
    if (!state || !el) return;
    el.innerHTML = `
      <span class="ticket-icon" aria-hidden="true"></span>
      <span>${formatNumber(state.tickets)} ${orderCurrencyName(state.tickets)}</span>
    `;
  }

  private renderList(): void {
    const state = this.state;
    const list = this.el.querySelector("[data-list]");
    if (!state || !list) return;

    if (TICKET_UPGRADES.length === 0) {
      list.innerHTML = `<p class="ticket-shop-empty">Permanent upgrades will show up here.</p>`;
      return;
    }

    list.innerHTML = TICKET_UPGRADES.map((def) => {
      const level = state.ticketUpgradeLevel(def.id);
      const maxed = level >= def.maxLevel;
      const cost = def.costs[level];
      const canBuy = state.canBuyTicketUpgrade(def.id);
      const costLabel = maxed
        ? "Owned"
        : `${formatNumber(cost ?? 0)} ${orderCurrencyName(cost ?? 0)}`;
      const meta =
        def.maxLevel > 1
          ? `<div class="ticket-shop-item-meta">Lv ${level}/${def.maxLevel}</div>`
          : "";
      return `
        <div class="ticket-shop-item">
          <div class="ticket-shop-item-copy">
            <div class="ticket-shop-item-name">${escapeHtml(def.name)}</div>
            <div class="ticket-shop-item-desc">${escapeHtml(def.description)}</div>
            ${meta}
          </div>
          <button class="btn btn-accent interactive" data-buy="${escapeHtml(def.id)}" ${canBuy ? "" : "disabled"}>
            ${costLabel}
          </button>
        </div>
      `;
    }).join("");

    list.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.buy;
        if (id) this.onBuy?.(id);
      });
    });
  }
}
