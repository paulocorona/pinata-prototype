import type { GameState } from "../game/GameState";
import { FIESTA_ORDERS } from "../game/balance";
import { assetUrl } from "../util/assetUrl";
import { formatNumber } from "../util/math";

/** Between-rounds Fiesta Order contribution screen (upgrades live on the skill tree). */
export class OrderScreen {
  readonly el: HTMLElement;
  private state: GameState | null = null;
  private onStart: (() => void) | null = null;
  private onSkip: (() => void) | null = null;
  private onContribute: ((all: boolean) => void) | null = null;
  private onFillOrder: (() => void) | null = null;
  private onContinue: (() => void) | null = null;

  private notEnoughTimer = 0;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-order hidden";
    root.appendChild(this.el);
  }

  show(
    state: GameState,
    handlers: {
      onFillOrder: () => void;
      onContribute: (all: boolean) => void;
      onStart: () => void;
      onSkip: () => void;
      onContinue: () => void;
    },
    opts?: { popup?: boolean },
  ): void {
    this.state = state;
    this.onFillOrder = handlers.onFillOrder;
    this.onContribute = handlers.onContribute;
    this.onStart = handlers.onStart;
    this.onSkip = handlers.onSkip;
    this.onContinue = handlers.onContinue;
    this.el.classList.toggle("overlay-order-popup", !!opts?.popup);
    this.render();
    this.el.classList.remove("hidden");
  }

  refresh(): void {
    if (!this.el.classList.contains("hidden")) this.render();
  }

  private render(): void {
    const state = this.state!;
    const ready = state.orderFulfilled();

    if (state.isFirstOrder()) {
      this.renderPaymentDue(state);
      return;
    }
    if (state.isScheduledOrder() && !ready) {
      this.renderUpcomingOrder(state);
      return;
    }
    this.renderStandardOrder(state);
  }

  /** Due now: mandatory pay — Give Candy only, no skip/back. */
  private renderPaymentDue(state: GameState): void {
    this.el.innerHTML = `
      <div class="panel panel-order">
        ${this.posterHtml(state)}
        <div class="order-poster-actions">
          <button class="btn btn-fill-order interactive" data-fill>
            Give Candy
          </button>
        </div>
      </div>
    `;
    this.bindFill(state);
  }

  /** Scheduled next payment: Give Candy now, or Not Yet and pay later. */
  private renderUpcomingOrder(state: GameState): void {
    this.el.innerHTML = `
      <div class="panel panel-order">
        ${this.posterHtml(state)}
        <div class="order-poster-actions">
          <button class="btn btn-fill-order interactive" data-fill>
            Give Candy
          </button>
          <button class="btn btn-not-yet interactive" data-continue>
            Not Yet
          </button>
        </div>
      </div>
    `;
    this.bindFill(state);
    this.el.querySelector("[data-continue]")?.addEventListener("click", () => {
      this.hide();
      this.onContinue?.();
    });
  }

  private renderStandardOrder(state: GameState): void {
    const ready = state.orderFulfilled();
    const isFinal = state.orderIndex >= FIESTA_ORDERS.length - 1 && ready && !state.hasPaidFinalOrder();
    const contribute = ready
      ? ""
      : `
          <div class="order-actions">
            <button class="btn btn-accent interactive" data-pay-half ${state.candy <= 0 ? "disabled" : ""}>Contribute Half</button>
            <button class="btn btn-accent interactive" data-pay-all ${state.candy <= 0 ? "disabled" : ""}>Contribute All</button>
          </div>
        `;

    this.el.innerHTML = `
      <div class="panel panel-order">
        ${this.posterHtml(state)}
        ${contribute}
        <div class="order-poster-actions">
          <button class="btn btn-primary interactive" data-start ${ready ? "" : "disabled"}>
            ${isFinal ? "Unlock Upgrades" : ready ? `Advance to Round ${state.round + 1}` : "Fulfill Order to Continue"}
          </button>
          <button class="btn btn-secondary interactive" data-skip>Skip Order</button>
        </div>
      </div>
    `;

    this.el.querySelector("[data-pay-half]")?.addEventListener("click", () => {
      this.onContribute?.(false);
      this.render();
    });
    this.el.querySelector("[data-pay-all]")?.addEventListener("click", () => {
      this.onContribute?.(true);
      this.render();
    });
    this.el.querySelector("[data-start]")?.addEventListener("click", () => {
      if (!state.orderFulfilled()) return;
      this.hide();
      this.onStart?.();
    });
    this.el.querySelector("[data-skip]")?.addEventListener("click", () => {
      this.hide();
      this.onSkip?.();
    });
  }

  private posterHtml(state: GameState): string {
    const candy = formatNumber(state.getOrder().target);
    const dueNow = state.orderDueInRounds <= 0;
    const len = candy.length;
    const sizeClass = len >= 9 ? " is-xl" : len >= 6 ? " is-long" : "";
    return `
      <div class="order-poster" role="img" aria-label="This kid needs ${candy} candy. ${state.orderDueText()}">
        <img class="order-poster-art" src="${assetUrl("art/T_Order.png")}" alt="" draggable="false" />
        <div class="order-poster-candy${sizeClass}">${candy}</div>
        <div class="order-poster-due${dueNow ? " is-now" : ""}">${state.orderDueValueText()}</div>
      </div>
    `;
  }

  private bindFill(state: GameState): void {
    this.el.querySelector("[data-fill]")?.addEventListener("click", () => {
      if (!state.canFillOrder()) {
        this.showNotEnough();
        return;
      }
      this.hide();
      this.onFillOrder?.();
    });
  }

  private showNotEnough(): void {
    this.el.querySelector(".order-not-enough")?.remove();
    const toast = document.createElement("div");
    toast.className = "order-not-enough";
    toast.textContent = "NOT ENOUGH CANDY";
    this.el.appendChild(toast);
    window.clearTimeout(this.notEnoughTimer);
    this.notEnoughTimer = window.setTimeout(() => toast.remove(), 1500);
  }

  hide(): void {
    window.clearTimeout(this.notEnoughTimer);
    this.el.querySelector(".order-not-enough")?.remove();
    this.el.classList.add("hidden");
    this.el.classList.remove("overlay-order-popup");
  }
}
