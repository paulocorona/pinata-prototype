import type { GameState } from "../game/GameState";
import { FIESTA_ORDERS } from "../game/balance";
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



  constructor(root: HTMLElement) {

    this.el = document.createElement("div");

    this.el.className = "overlay hidden";

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



  /** Due now: mandatory pay — Fill Order only, no skip/back. */

  private renderPaymentDue(state: GameState): void {

    const order = state.getOrder();

    const canFill = state.canFillOrder();



    this.el.innerHTML = `

      <div class="panel">

        <h1>Fiesta Order</h1>

        <p class="sub">Payment required to continue. Balance: <strong>${formatNumber(state.candy)}</strong></p>

        <div class="order-box order-box-urgent">

          <div class="order-due">DUE DATE: NOW!</div>

          <div class="title">${order.name}</div>

          <div style="opacity:.8;margin-bottom:8px">${order.flavor}</div>

          <div style="font-weight:800">CANDY NEEDED: ${formatNumber(order.target)}</div>

        </div>

        <button class="btn btn-primary interactive" data-fill ${canFill ? "" : "disabled"}>

          Fill Payment

        </button>

      </div>

    `;



    this.el.querySelector("[data-fill]")?.addEventListener("click", () => {

      if (!state.canFillOrder()) return;

      this.hide();

      this.onFillOrder?.();

    });

  }



  /** Scheduled next payment: Fill Order now, or Continue and pay later. */

  private renderUpcomingOrder(state: GameState): void {

    const order = state.getOrder();

    const due = state.isOrderDue();

    const canFill = state.canFillOrder();



    this.el.innerHTML = `

      <div class="panel">

        <h1>Fiesta Order</h1>

        <p class="sub">${due ? "Payment due now. Fill it or the fiesta ends." : "Next payment assigned. Fill now or keep playing."} Balance: <strong>${formatNumber(state.candy)}</strong></p>

        <div class="order-box${due ? " order-box-urgent" : ""}">

          <div class="order-due${due ? "" : " order-due-later"}">${state.orderDueText()}</div>

          <div class="title">${order.name}</div>

          <div style="opacity:.8;margin-bottom:8px">${order.flavor}</div>

          <div style="font-weight:800">CANDY NEEDED: ${formatNumber(order.target)}</div>

        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">

          <button class="btn btn-primary interactive" data-fill ${canFill ? "" : "disabled"}>

            ${due ? "Fill Payment" : "Fill Order"}

          </button>

          <button class="btn btn-secondary interactive" data-continue>

            Continue

          </button>

        </div>

      </div>

    `;



    this.el.querySelector("[data-fill]")?.addEventListener("click", () => {

      if (!state.canFillOrder()) return;

      this.hide();

      this.onFillOrder?.();

    });

    this.el.querySelector("[data-continue]")?.addEventListener("click", () => {

      this.hide();

      this.onContinue?.();

    });

  }



  private renderStandardOrder(state: GameState): void {

    const order = state.getOrder();

    const ready = state.orderFulfilled();

    const isFinal = state.orderIndex >= FIESTA_ORDERS.length - 1 && ready && !state.hasPaidFinalOrder();



    this.el.innerHTML = `

      <div class="panel">

        <h1>Fiesta Prep</h1>

        <p class="sub">Fulfill the order to continue. Balance: <strong>${formatNumber(state.candy)}</strong></p>

        <div class="order-box">

          <div class="title">${ready ? "READY!" : "NEXT ORDER"} — ${order.name}</div>

          <div style="opacity:.8;margin-bottom:8px">${order.flavor}</div>

          <div style="font-weight:800">CANDY NEEDED: ${formatNumber(state.orderContributed)} / ${formatNumber(order.target)}</div>

          <div class="order-bar"><div class="order-fill" style="width:${state.orderProgress() * 100}%"></div></div>

          <div class="order-actions">

            <button class="btn btn-accent interactive" data-pay-half ${state.candy <= 0 || ready ? "disabled" : ""}>Contribute Half</button>

            <button class="btn btn-accent interactive" data-pay-all ${state.candy <= 0 || ready ? "disabled" : ""}>Contribute All</button>

          </div>

        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">

          <button class="btn btn-primary interactive" data-start ${ready ? "" : "disabled"}>

            ${isFinal ? "Unlock Upgrades" : ready ? `Advance to Round ${state.round + 1}` : "Fulfill Order to Continue"}

          </button>

          <button class="btn btn-secondary interactive" data-skip>Skip Order</button>

        </div>

      </div>

    `;



    const startBtn = this.el.querySelector("[data-start]") as HTMLButtonElement;

    const skipBtn = this.el.querySelector("[data-skip]") as HTMLButtonElement;



    this.el.querySelector("[data-pay-half]")?.addEventListener("click", () => {

      this.onContribute?.(false);

      this.render();

    });

    this.el.querySelector("[data-pay-all]")?.addEventListener("click", () => {

      this.onContribute?.(true);

      this.render();

    });

    startBtn.addEventListener("click", () => {

      if (!state.orderFulfilled()) return;

      this.hide();

      this.onStart?.();

    });

    skipBtn.addEventListener("click", () => {

      this.hide();

      this.onSkip?.();

    });

  }



  hide(): void {

    this.el.classList.add("hidden");

    this.el.classList.remove("overlay-order-popup");

  }

}

