import type { GameState } from "../game/GameState";
import { FIESTA_ORDERS } from "../game/balance";
import { assetUrl } from "../util/assetUrl";
import { formatNumber } from "../util/math";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ORDER_PAID_HOLD_MS = 2000;
const ORDER_COMPLETE_ART = "art/T_OrderComplete.png";
const CONFETTI_COLORS = ["#f419a1", "#f38605", "#fddd04", "#40e50e", "#03aafc", "#8c0ef7", "#ff4d8a", "#fff8ef"];

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
  private paidTimer = 0;
  private paidDone: (() => void) | null = null;
  private celebrating = false;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-order hidden";
    root.appendChild(this.el);
    const preload = new Image();
    preload.src = assetUrl(ORDER_COMPLETE_ART);
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
    this.clearPaidHold();
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
    if (this.celebrating) return;
    if (!this.el.classList.contains("hidden")) this.render();
  }

  /**
   * Swap to the paid poster, burst confetti, and hold for 2s before continuing.
   */
  playPaidCelebration(onDone: () => void): void {
    if (this.celebrating) return;
    this.celebrating = true;
    this.paidDone = onDone;
    this.applyPaidVisuals();
    this.burstConfetti();
    window.clearTimeout(this.paidTimer);
    this.paidTimer = window.setTimeout(() => {
      this.paidTimer = 0;
      const done = this.paidDone;
      this.paidDone = null;
      this.celebrating = false;
      this.hide();
      done?.();
    }, ORDER_PAID_HOLD_MS);
  }

  private render(): void {
    const state = this.state!;
    const ready = state.orderFulfilled();

    if (state.isFirstOrder() || state.isUnpaidDueOrder()) {
      this.renderPaymentDue(state);
      return;
    }
    if (state.isScheduledOrder() && !ready) {
      this.renderUpcomingOrder(state);
      return;
    }
    this.renderStandardOrder(state);
  }

  /** Due now: Give Candy, plus Give Up if they cannot cover the order. */
  private renderPaymentDue(state: GameState): void {
    const broke = !state.canFillOrder();
    this.el.innerHTML = `
      <div class="panel panel-order">
        ${this.storyHtml(state)}
        ${this.posterHtml(state)}
        <div class="order-poster-actions">
          <button class="btn btn-fill-order interactive" data-fill>
            Give Candy
          </button>
          ${
            broke
              ? `<button class="btn btn-give-up interactive" data-give-up>Give Up</button>`
              : ""
          }
        </div>
      </div>
    `;
    this.bindFill(state);
    this.el.querySelector("[data-give-up]")?.addEventListener("click", () => {
      this.hide();
      this.onSkip?.();
    });
  }

  /** Scheduled next payment: Give Candy now, or Not Yet to return to Round Complete. */
  private renderUpcomingOrder(state: GameState): void {
    this.el.innerHTML = `
      <div class="panel panel-order">
        ${this.storyHtml(state)}
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
        ${this.storyHtml(state)}
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
      if (!state.orderFulfilled() || this.celebrating) return;
      this.playPaidCelebration(() => this.onStart?.());
    });
    this.el.querySelector("[data-skip]")?.addEventListener("click", () => {
      this.hide();
      this.onSkip?.();
    });
  }

  private storyHtml(state: GameState): string {
    if (state.isFirstOrder()) return "";
    const order = state.getOrder();
    return `
      <div class="order-story">
        <div class="order-story-name">${escapeHtml(order.name)}</div>
        <p class="order-story-flavor">${escapeHtml(order.flavor)}</p>
      </div>
    `;
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
      if (this.celebrating) return;
      if (state.orderFulfilled()) return;
      if (!state.canFillOrder()) {
        this.showNotEnough();
        return;
      }
      this.onFillOrder?.();
    });
  }

  private applyPaidVisuals(): void {
    this.el.classList.add("is-paid");
    const img = this.el.querySelector(".order-poster-art");
    if (img instanceof HTMLImageElement) img.src = assetUrl(ORDER_COMPLETE_ART);
    this.el.querySelector(".order-poster")?.classList.add("is-paid");
  }

  private burstConfetti(): void {
    this.el.querySelector(".order-confetti")?.remove();
    const layer = document.createElement("div");
    layer.className = "order-confetti";
    const overlayBox = this.el.getBoundingClientRect();
    const poster = this.el.querySelector(".order-poster");
    const posterBox = poster?.getBoundingClientRect();
    const originX = posterBox
      ? posterBox.left - overlayBox.left + posterBox.width * 0.5
      : overlayBox.width * 0.5;
    const originY = posterBox
      ? posterBox.top - overlayBox.top + posterBox.height * 0.36
      : overlayBox.height * 0.34;

    const count = 72;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "order-confetti-piece";
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.55;
      const dist = 90 + Math.random() * 240;
      const dx = Math.cos(angle) * dist;
      const up = -(70 + Math.random() * 140);
      const dy = Math.sin(angle) * dist * 0.7 + 160 + Math.random() * 120;
      const w = 5 + Math.random() * 8;
      const h = 9 + Math.random() * 14;
      const dur = 0.95 + Math.random() * 0.7;
      piece.style.setProperty("--dx", dx.toFixed(1));
      piece.style.setProperty("--up", up.toFixed(1));
      piece.style.setProperty("--dy", dy.toFixed(1));
      piece.style.setProperty("--rot", `${(Math.random() * 840 - 420).toFixed(0)}`);
      piece.style.setProperty("--dur", `${dur}s`);
      piece.style.left = `${originX}px`;
      piece.style.top = `${originY}px`;
      piece.style.width = `${w}px`;
      piece.style.height = `${h}px`;
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
      piece.style.animationDelay = `${Math.random() * 0.1}s`;
      if (i % 5 === 0) piece.classList.add("is-round");
      layer.appendChild(piece);
    }
    this.el.appendChild(layer);
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

  private clearPaidHold(): void {
    window.clearTimeout(this.paidTimer);
    this.paidTimer = 0;
    this.paidDone = null;
    this.celebrating = false;
    this.el.classList.remove("is-paid");
    this.el.querySelector(".order-confetti")?.remove();
  }

  hide(): void {
    window.clearTimeout(this.notEnoughTimer);
    this.el.querySelector(".order-not-enough")?.remove();
    this.clearPaidHold();
    this.el.classList.add("hidden");
    this.el.classList.remove("overlay-order-popup");
  }
}
