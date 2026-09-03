import type { GameState } from "../game/GameState";
import { ORDER_CURRENCY } from "../game/balance";
import { assetUrl } from "../util/assetUrl";
import { formatNumber } from "../util/math";

function cssHex(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

/** Candy bank HUD — below energy during a round, top on round-end, bottom on upgrades/shop. */
export class CandyBalance {
  readonly el: HTMLElement;
  private uiRoot: HTMLElement;
  private valueEl: HTMLElement;
  private ticketEl: HTMLElement;
  private iconEl: HTMLElement;
  private flyLayer: HTMLElement;
  private dockAnchor: HTMLElement | null = null;
  private heldCandy: number | null = null;
  private pendingCredit = 0;
  private creditRaf = 0;
  private flyGen = 0;

  constructor(root: HTMLElement) {
    this.uiRoot = root;
    this.el = document.createElement("div");
    this.el.className = "candy-balance hidden";
    this.el.innerHTML = `
      <img class="candy-coin-icon candy-balance-icon" data-icon src="${assetUrl("art/T_CandyCoin.png")}" alt="" draggable="false" aria-hidden="true" />
      <span class="candy-balance-value" data-value>0</span>
      <span class="candy-balance-divider" aria-hidden="true"></span>
      <span class="ticket-icon" aria-hidden="true"></span>
      <span class="ticket-balance-value" data-tickets>0</span>
    `;
    root.appendChild(this.el);
    this.flyLayer = document.createElement("div");
    this.flyLayer.className = "hud-candy-flies hidden";
    this.flyLayer.setAttribute("aria-hidden", "true");
    root.appendChild(this.flyLayer);
    this.valueEl = this.el.querySelector("[data-value]")!;
    this.ticketEl = this.el.querySelector("[data-tickets]")!;
    this.iconEl = this.el.querySelector("[data-icon]")!;
    this.ticketEl.setAttribute("title", ORDER_CURRENCY.name);
  }

  show(): void {
    this.el.classList.remove("hidden");
  }

  hide(): void {
    this.flushFlies();
    this.heldCandy = null;
    this.flyLayer.classList.add("hidden");
    this.el.classList.add("hidden");
    this.place("bottom");
  }

  place(where: "top" | "bottom"): void {
    this.dockAnchor = null;
    this.el.classList.remove("is-under-energy");
    this.el.style.removeProperty("top");
    this.el.classList.toggle("is-top", where === "top");
  }

  /** Snapshot the bank and start collecting smash loot into this HUD. */
  beginRound(state: GameState, under: HTMLElement): void {
    this.flushFlies();
    this.heldCandy = state.candy;
    this.placeUnder(under);
    this.show();
    this.flyLayer.classList.remove("hidden");
    this.writeCandy();
    requestAnimationFrame(() => this.syncDock());
  }

  /** Sit the round-complete candy pill just below the energy card. */
  placeUnder(anchor: HTMLElement): void {
    this.dockAnchor = anchor;
    this.el.classList.remove("is-top");
    this.el.classList.add("is-under-energy");
    this.syncDock();
  }

  syncDock(): void {
    if (!this.dockAnchor) return;
    const rootRect = this.uiRoot.getBoundingClientRect();
    const anchorRect = this.dockAnchor.getBoundingClientRect();
    const sy = this.uiRoot.clientHeight / Math.max(1, rootRect.height);
    const top = (anchorRect.bottom - rootRect.top) * sy + 10;
    this.el.style.top = `${top}px`;
  }

  /** Stop the delayed round total so sync uses the banked amount. */
  endRound(): void {
    this.flushFlies();
    this.heldCandy = null;
    this.flyLayer.classList.add("hidden");
  }

  /** Instant HUD credit (lucky-seven hits, leftover particles). */
  creditCandy(amount: number): void {
    if (amount <= 0) return;
    this.heldCandy = (this.heldCandy ?? 0) + amount;
    this.writeCandy();
    this.pulseCandy();
  }

  /** 2D cube from a floor piece into the candy counter. */
  flyCandy(fromX: number, fromY: number, color: number, payout: number): void {
    const target = this.candyTarget();
    const piece = document.createElement("div");
    piece.className = "hud-candy-fly";
    piece.style.background = cssHex(color);
    const dur = 280 + Math.random() * 80;
    const mx = fromX + (target.x - fromX) * 0.42 + (Math.random() - 0.5) * 48;
    const my = fromY + (target.y - fromY) * 0.38 - 28 - Math.random() * 18;
    piece.style.setProperty("--sx", `${fromX}px`);
    piece.style.setProperty("--sy", `${fromY}px`);
    piece.style.setProperty("--mx", `${mx}px`);
    piece.style.setProperty("--my", `${my}px`);
    piece.style.setProperty("--ex", `${target.x}px`);
    piece.style.setProperty("--ey", `${target.y}px`);
    piece.style.setProperty("--dur", `${dur}ms`);
    const gen = this.flyGen;
    piece.addEventListener(
      "animationend",
      () => {
        piece.remove();
        if (gen !== this.flyGen) return;
      },
      { once: true },
    );
    this.flyLayer.appendChild(piece);
    this.queueCredit(payout);
  }

  private queueCredit(amount: number): void {
    if (amount <= 0) return;
    this.pendingCredit += amount;
    if (this.creditRaf) return;
    this.creditRaf = requestAnimationFrame(() => {
      this.creditRaf = 0;
      const add = this.pendingCredit;
      this.pendingCredit = 0;
      this.creditCandy(add);
    });
  }

  sync(state: GameState, source: "run" | "shop" | "tickets" = "run"): void {
    const candy =
      source === "shop"
        ? state.shopCandy
        : this.heldCandy != null && source === "run"
          ? this.heldCandy
          : state.candy;
    this.valueEl.textContent = formatNumber(candy);
    this.ticketEl.textContent = formatNumber(state.tickets);
    this.el.classList.toggle("is-shop", source === "shop");
    this.el.classList.toggle("is-tickets", source === "tickets");
  }

  flushFlies(): void {
    this.flyGen += 1;
    if (this.creditRaf) {
      cancelAnimationFrame(this.creditRaf);
      this.creditRaf = 0;
    }
    const leftover = this.pendingCredit;
    this.pendingCredit = 0;
    this.flyLayer.replaceChildren();
    if (leftover > 0) this.creditCandy(leftover);
  }

  private writeCandy(): void {
    this.valueEl.textContent = formatNumber(this.heldCandy ?? 0);
  }

  private pulseCandy(): void {
    this.valueEl.classList.remove("is-pulse");
    void this.valueEl.offsetWidth;
    this.valueEl.classList.add("is-pulse");
  }

  private candyTarget(): { x: number; y: number } {
    const rootRect = this.uiRoot.getBoundingClientRect();
    const iconRect = this.iconEl.getBoundingClientRect();
    const sx = this.uiRoot.clientWidth / Math.max(1, rootRect.width);
    const sy = this.uiRoot.clientHeight / Math.max(1, rootRect.height);
    return {
      x: (iconRect.left + iconRect.width * 0.5 - rootRect.left) * sx,
      y: (iconRect.top + iconRect.height * 0.5 - rootRect.top) * sy,
    };
  }
}
