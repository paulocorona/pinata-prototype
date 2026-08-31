import { SKILL_TREE_EDGES, UPGRADES, upgradeDescription, upgradeDisplayName, upgradeNameById } from "../game/balance";
import type { GameState } from "../game/GameState";
import type { UpgradeId } from "../game/balance";
import { upgradePosition } from "../game/upgradeGrid";
import { formatNumber } from "../util/math";

const PAN_THRESHOLD_PX = 6;
const ZOOM_MIN = 0.08;
const ZOOM_MAX = 2.4;
const FIT_PAD_PX = 28;
const FIT_ZOOM_SCALE = 0.5;
const TOOLTIP_GAP_PX = 10;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class UpgradeScreen {
  readonly el: HTMLElement;
  private state: GameState | null = null;
  private onBuy: ((id: UpgradeId) => void) | null = null;
  private onBack: (() => void) | null = null;
  private panX = 0;
  private panY = 0;
  private zoom = 1;
  private keepPan = false;
  private suppressClick = false;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-upgrades hidden";
    root.appendChild(this.el);
  }

  show(
    state: GameState,
    handlers: {
      onBuy: (id: UpgradeId) => void;
      onBack: () => void;
    },
  ): void {
    this.state = state;
    this.onBuy = handlers.onBuy;
    this.onBack = handlers.onBack;
    this.keepPan = false;
    this.el.classList.remove("hidden");
    this.render();
  }

  refresh(): void {
    if (!this.el.classList.contains("hidden")) this.render();
  }

  private render(): void {
    const state = this.state!;
    const visible = new Set(
      UPGRADES.filter((u) => this.isUpgradeVisible(u.id)).map((u) => u.id),
    );

    const edges = SKILL_TREE_EDGES.filter(
      ([from, to]) => visible.has(from) && visible.has(to),
    )
      .map(([from, to]) => {
        const a = upgradePosition(from);
        const b = upgradePosition(to);
        const lit = state.upgrades[from] >= 1;
        return `
        <line
          class="skill-edge${lit ? " lit" : ""}"
          x1="${a.x}%" y1="${a.y}%"
          x2="${b.x}%" y2="${b.y}%"
        />`;
      })
      .join("");

    const nodes = UPGRADES.filter((u) => visible.has(u.id))
      .map((u) => {
        const lvl = state.upgrades[u.id];
        const cost = state.upgradeCost(u.id);
        const maxed = cost === null;
        const unlocked = state.isUpgradeUnlocked(u.id);
        const can = state.canBuy(u.id);
        const owned = lvl > 0;
        const center = u.id === "power";
        const classes = [
          "skill-node",
          "interactive",
          center ? "skill-node-center" : "",
          owned ? "owned" : "",
          maxed ? "maxed" : "",
          !unlocked ? "locked" : "",
          can ? "affordable" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const desc = upgradeDescription(
          u,
          state.upgrades,
          state.unlockedPinataTypeCount(),
          state.totalBreaks,
          state.staminaUsedThisRun,
        );
        const missingAll =
          u.requires
            ?.filter((req) => state.upgrades[req] < 1)
            .map((req) => upgradeNameById(req)) ?? [];
        const anyNames =
          u.requiresAny?.map((req) => upgradeNameById(req)) ?? [];
        const missingAny = u.requiresAny?.length
          ? !u.requiresAny.some((req) => state.upgrades[req] >= 1)
          : false;
        const missingFinale = !!u.requiresFinalPayment && !state.hasPaidFinalOrder();

        const lockReason = missingFinale
          ? "Locked — pay the final Fiesta order first"
          : missingAny
          ? `Locked — buy ${anyNames.join(" or ") || "a connected upgrade"} first`
          : missingAll.length
            ? `Locked — buy ${missingAll.join(", ") || "a connected upgrade"} first`
            : `Locked — buy a connected upgrade first`;

        const price = maxed ? "Owned" : `${formatNumber(cost)} candy`;
        const tipParts = [desc];
        if (!unlocked) tipParts.push(lockReason);
        else if (!maxed && !can) {
          tipParts.push(`Need ${formatNumber(cost! - state.candy)} more candy`);
        }
        const tip = tipParts.join("\n\n");
        const name = upgradeDisplayName(u);

        const pos = upgradePosition(u.id);
        return `
        <button
          class="${classes}"
          data-upgrade="${u.id}"
          data-tip="${escapeHtml(tip)}"
          style="left:${pos.x}%;top:${pos.y}%"
          ${!can ? "disabled" : ""}
          aria-label="${escapeHtml(`${name}. ${desc}`)}"
        >
          <span class="skill-node-ring" aria-hidden="true"></span>
          <span class="skill-node-name">${escapeHtml(name)}</span>
          <span class="skill-node-cost">${escapeHtml(price)}</span>
        </button>
      `;
      })
      .join("");

    this.el.innerHTML = `
      <div class="panel panel-upgrades">
        <h1>Upgrades</h1>
        <div class="skill-tree interactive" data-skill-tree>
          <div class="skill-tree-map">
            <svg class="skill-tree-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              ${edges}
            </svg>
            ${nodes}
          </div>
        </div>
        <button class="btn btn-primary interactive" data-back>Continue</button>
      </div>
      <div class="skill-node-tooltip hidden" data-skill-tooltip role="tooltip"></div>
    `;

    this.el.querySelectorAll("[data-upgrade]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        if (this.suppressClick) {
          ev.preventDefault();
          ev.stopPropagation();
          return;
        }
        ev.stopPropagation();
        const id = (btn as HTMLElement).dataset.upgrade as UpgradeId;
        this.onBuy?.(id);
        this.keepPan = true;
        this.render();
      });
    });
    this.el.querySelector("[data-back]")!.addEventListener("click", () => {
      this.hide();
      this.onBack?.();
    });

    this.bindTreePan();
    this.bindNodeTooltips();
    if (!this.keepPan) this.fitVisibleTree();
    else this.clampPan();
    this.applyPan();
    this.keepPan = false;
  }

  /** Purchased nodes, tree roots, and locked nodes adjacent to a purchase. */
  private isUpgradeVisible(id: UpgradeId): boolean {
    const state = this.state!;
    const def = UPGRADES.find((u) => u.id === id)!;
    if (def.requiresFinalPayment && !state.hasPaidFinalOrder()) return false;
    if (state.upgrades[id] >= 1) return true;
    const hasPrereq = (def.requires?.length ?? 0) > 0 || (def.requiresAny?.length ?? 0) > 0;
    if (!hasPrereq) return true;
    return SKILL_TREE_EDGES.some(([from, to]) => {
      const other = from === id ? to : to === id ? from : null;
      return other !== null && state.upgrades[other] >= 1;
    });
  }

  private bindTreePan(): void {
    const viewport = this.el.querySelector("[data-skill-tree]") as HTMLElement | null;
    if (!viewport) return;

    let dragging = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    const endDrag = (ev: PointerEvent): void => {
      if (pointerId === null || ev.pointerId !== pointerId) return;
      if (dragging) {
        this.suppressClick = true;
        window.setTimeout(() => {
          this.suppressClick = false;
        }, 0);
      }
      dragging = false;
      pointerId = null;
      viewport.classList.remove("is-dragging");
      try {
        viewport.releasePointerCapture(ev.pointerId);
      } catch {
        /* already released */
      }
    };

    viewport.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      this.suppressClick = false;
      pointerId = ev.pointerId;
      dragging = false;
      startX = ev.clientX;
      startY = ev.clientY;
      originX = this.panX;
      originY = this.panY;
      // Capture only after the drag threshold so node clicks still fire.
    });

    viewport.addEventListener("pointermove", (ev) => {
      if (pointerId === null || ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging) {
        if (dx * dx + dy * dy < PAN_THRESHOLD_PX * PAN_THRESHOLD_PX) return;
        dragging = true;
        this.hideTooltip();
        viewport.classList.add("is-dragging");
        try {
          viewport.setPointerCapture(ev.pointerId);
        } catch {
          /* capture not available */
        }
      }
      ev.preventDefault();
      this.panX = originX + dx;
      this.panY = originY + dy;
      this.clampPan();
      this.applyPan();
    });

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    viewport.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.hideTooltip();
        this.zoomAt(ev.clientX, ev.clientY, ev.deltaY);
      },
      { passive: false },
    );

    viewport.addEventListener(
      "click",
      (ev) => {
        if (!this.suppressClick) return;
        ev.preventDefault();
        ev.stopPropagation();
        this.suppressClick = false;
      },
      true,
    );
  }

  private bindNodeTooltips(): void {
    const tooltip = this.tooltipEl();
    if (!tooltip) return;

    this.el.querySelectorAll("[data-upgrade]").forEach((btn) => {
      const node = btn as HTMLElement;
      node.addEventListener("pointerenter", () => {
        this.showTooltip(node);
      });
      node.addEventListener("pointerleave", () => {
        this.hideTooltip();
      });
    });
  }

  private showTooltip(node: HTMLElement): void {
    const tooltip = this.tooltipEl();
    const text = node.dataset.tip ?? "";
    if (!tooltip || !text) return;
    tooltip.style.visibility = "hidden";
    tooltip.textContent = text;
    tooltip.classList.remove("hidden");
    this.placeTooltip(tooltip, node);
    tooltip.style.visibility = "";
  }

  private hideTooltip(): void {
    this.tooltipEl()?.classList.add("hidden");
  }

  private placeTooltip(tooltip: HTMLElement, node: HTMLElement): void {
    const host = this.el;
    const hostRect = host.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    const sx = host.clientWidth / Math.max(hostRect.width, 1e-6);
    const sy = host.clientHeight / Math.max(hostRect.height, 1e-6);
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    let left = (rect.left - hostRect.left) * sx + (rect.width * sx) / 2 - tw / 2;
    let top = (rect.top - hostRect.top) * sy - th - TOOLTIP_GAP_PX;
    if (top < 8) top = (rect.bottom - hostRect.top) * sy + TOOLTIP_GAP_PX;
    left = Math.max(8, Math.min(left, host.clientWidth - tw - 8));
    top = Math.max(8, Math.min(top, host.clientHeight - th - 8));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  private tooltipEl(): HTMLElement | null {
    return this.el.querySelector("[data-skill-tooltip]");
  }

  private zoomAt(clientX: number, clientY: number, deltaY: number): void {
    const viewport = this.treeViewport();
    const map = this.treeMap();
    if (!viewport || !map) return;

    const rect = viewport.getBoundingClientRect();
    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;
    const mapX = (cursorX - this.panX) / this.zoom;
    const mapY = (cursorY - this.panY) / this.zoom;
    const next = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, this.zoom * Math.exp(-deltaY * 0.0018)),
    );
    if (next === this.zoom) return;

    this.zoom = next;
    this.panX = cursorX - mapX * this.zoom;
    this.panY = cursorY - mapY * this.zoom;
    this.clampPan();
    this.applyPan();
  }

  private fitVisibleTree(): void {
    const viewport = this.treeViewport();
    const map = this.treeMap();
    if (!viewport || !map) return;

    const nodes = [...this.el.querySelectorAll<HTMLElement>(".skill-node")];
    if (nodes.length === 0) {
      this.zoom = ZOOM_MIN;
      this.clampPan();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
      const hw = node.offsetWidth / 2;
      const hh = node.offsetHeight / 2;
      minX = Math.min(minX, node.offsetLeft - hw);
      minY = Math.min(minY, node.offsetTop - hh);
      maxX = Math.max(maxX, node.offsetLeft + hw);
      maxY = Math.max(maxY, node.offsetTop + hh);
    }

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const fitted = Math.min((vw - FIT_PAD_PX * 2) / bw, (vh - FIT_PAD_PX * 2) / bh);
    this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fitted * FIT_ZOOM_SCALE));
    this.panX = vw / 2 - ((minX + maxX) / 2) * this.zoom;
    this.panY = vh / 2 - ((minY + maxY) / 2) * this.zoom;
    this.clampPan();
  }

  private clampPan(): void {
    const viewport = this.treeViewport();
    const map = this.treeMap();
    if (!viewport || !map) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const mw = map.offsetWidth * this.zoom;
    const mh = map.offsetHeight * this.zoom;
    this.panX =
      mw <= vw ? (vw - mw) / 2 : Math.min(0, Math.max(vw - mw, this.panX));
    this.panY =
      mh <= vh ? (vh - mh) / 2 : Math.min(0, Math.max(vh - mh, this.panY));
  }

  private applyPan(): void {
    const map = this.treeMap();
    if (!map) return;
    map.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  private treeViewport(): HTMLElement | null {
    return this.el.querySelector("[data-skill-tree]");
  }

  private treeMap(): HTMLElement | null {
    return this.el.querySelector(".skill-tree-map");
  }

  hide(): void {
    this.hideTooltip();
    this.el.classList.add("hidden");
  }
}
