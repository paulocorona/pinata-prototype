import type { GameState } from "../game/GameState";
import {
  STICKS,
  stickById,
  stickHueCss,
  type StickDef,
  type StickId,
} from "../game/sticks";
import { formatPercent, formatSwingRate } from "../game/balance";
import { formatNumber } from "../util/math";
import { StickPreview } from "./StickPreview";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class ShopScreen {
  readonly el: HTMLElement;
  private state: GameState | null = null;
  private selectedId: StickId = "stick1";
  private preview: StickPreview | null = null;
  private onBack: (() => void) | null = null;
  private onBuy: ((id: StickId) => void) | null = null;
  private onEquip: ((id: StickId) => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-shop hidden";
    root.appendChild(this.el);
  }

  show(
    state: GameState,
    handlers: {
      onBack: () => void;
      onBuy: (id: StickId) => void;
      onEquip: (id: StickId) => void;
    },
  ): void {
    this.state = state;
    this.onBack = handlers.onBack;
    this.onBuy = handlers.onBuy;
    this.onEquip = handlers.onEquip;
    this.selectedId = state.equippedStickId;
    this.build();
    this.el.classList.remove("hidden");
    this.mountPreview();
  }

  refresh(): void {
    if (this.el.classList.contains("hidden") || !this.state) return;
    this.renderDetail();
    this.renderList();
    this.preview?.setHue(stickById(this.selectedId).hue);
  }

  hide(): void {
    this.disposePreview();
    this.el.classList.add("hidden");
    this.state = null;
    this.onBack = null;
    this.onBuy = null;
    this.onEquip = null;
  }

  private build(): void {
    this.disposePreview();
    this.el.innerHTML = `
      <div class="panel panel-shop">
        <h1>Shop</h1>
        <p class="sub">Pinata sticks</p>
        <div class="shop-preview" data-preview></div>
        <div class="shop-detail" data-detail></div>
        <div class="shop-list" data-list></div>
        <button class="btn btn-secondary interactive" data-back>Back</button>
      </div>
    `;
    this.renderDetail();
    this.renderList();
    this.el.querySelector("[data-back]")!.addEventListener("click", () => {
      const back = this.onBack;
      this.hide();
      back?.();
    });
    this.el.querySelector("[data-list]")!.addEventListener("click", (ev) => {
      const row = (ev.target as HTMLElement).closest("[data-stick]");
      if (!(row instanceof HTMLElement)) return;
      const id = row.dataset.stick as StickId | undefined;
      if (!id) return;
      this.selectedId = id;
      this.refresh();
    });
  }

  private renderDetail(): void {
    const state = this.state!;
    const stick = stickById(this.selectedId);
    const owned = state.ownsStick(stick.id);
    const equipped = state.equippedStickId === stick.id;
    const canBuy = state.canBuyStick(stick.id);
    let action = "";
    if (equipped) {
      action = `<button class="btn btn-primary interactive" data-action disabled>Equipped</button>`;
    } else if (owned) {
      action = `<button class="btn btn-primary interactive" data-action data-equip>Equip</button>`;
    } else {
      action = `<button class="btn btn-accent interactive" data-action data-buy ${canBuy ? "" : "disabled"}>Buy ${formatNumber(stick.cost)}</button>`;
    }

    const host = this.el.querySelector("[data-detail]");
    if (!(host instanceof HTMLElement)) return;
    host.innerHTML = `
      <div class="shop-detail-name">${escapeHtml(stick.name)}</div>
      <div class="shop-stats">
        <div class="shop-stat"><span class="label">Damage</span><span class="value">${formatNumber(stick.baseDamage)}</span></div>
        <div class="shop-stat"><span class="label">Speed</span><span class="value">${formatSwingRate(stick.attackSpeed)}</span></div>
        <div class="shop-stat"><span class="label">Crit</span><span class="value">${formatPercent(stick.critChance)}</span></div>
      </div>
      ${action}
    `;
    host.querySelector("[data-equip]")?.addEventListener("click", () => {
      this.onEquip?.(stick.id);
    });
    host.querySelector("[data-buy]")?.addEventListener("click", () => {
      this.onBuy?.(stick.id);
    });
  }

  private renderList(): void {
    const state = this.state!;
    const host = this.el.querySelector("[data-list]");
    if (!(host instanceof HTMLElement)) return;
    host.innerHTML = STICKS.map((stick) => this.rowHtml(state, stick)).join("");
  }

  private rowHtml(state: GameState, stick: StickDef): string {
    const owned = state.ownsStick(stick.id);
    const equipped = state.equippedStickId === stick.id;
    const selected = this.selectedId === stick.id;
    const classes = [
      "shop-row",
      "interactive",
      selected ? "selected" : "",
      equipped ? "equipped" : "",
      owned ? "owned" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const badge = equipped ? "Equipped" : owned ? "Owned" : formatNumber(stick.cost);
    return `
      <button type="button" class="${classes}" data-stick="${stick.id}">
        <span class="shop-row-swatch" style="background:${stickHueCss(stick.hue)}"></span>
        <span class="shop-row-copy">
          <span class="shop-row-name">${escapeHtml(stick.name)}</span>
          <span class="shop-row-stats">${formatNumber(stick.baseDamage)} dmg · ${formatSwingRate(stick.attackSpeed)} · ${formatPercent(stick.critChance)} crit</span>
        </span>
        <span class="shop-row-badge">${escapeHtml(badge)}</span>
      </button>
    `;
  }

  private mountPreview(): void {
    const host = this.el.querySelector("[data-preview]");
    if (!(host instanceof HTMLElement)) return;
    this.preview = new StickPreview();
    void this.preview.mount(host, stickById(this.selectedId).hue);
  }

  private disposePreview(): void {
    this.preview?.dispose();
    this.preview = null;
  }
}
