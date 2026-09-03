import type { GameState } from "../game/GameState";
import { formatPercent } from "../game/balance";
import { candyTypesForDisplay } from "../game/candyTypes";
import { PINATA_TYPES, THIEF, pinataPortraitSrc, type PinataTypeDef, type PinataTypeId } from "../game/pinataTypes";
import { accentForPinataType, PINATA_LEVEL_LOOT_PER_RANK, type PinataLevelRow } from "../game/pinataLevels";
import { assetUrl } from "../util/assetUrl";
import { formatNumber } from "../util/math";
import { UnlockPinataPreview, skinForUnlockType } from "./UnlockPinataPreview";
import { pinataSilhouetteSrc } from "./pinataSilhouette";

const HOME_ICON = `<svg class="round-end-home-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.15 2.45 11.2c-.36.3-.15.9.26.9H5.2v7.35c0 .55.45 1 1 1h4.05v-5.2h3.5v5.2H17.8c.55 0 1-.45 1-1V12.1h2.49c.41 0 .62-.6.26-.9L12 3.15Z"/></svg>`;

export class RoundEndOverlay {
  readonly el: HTMLElement;
  private onUpgrades: (() => void) | null = null;
  private onOrders: (() => void) | null = null;
  private onContinue: (() => void) | null = null;
  private onHome: (() => void) | null = null;
  private onLevelsToggle: ((open: boolean) => void) | null = null;
  private onPinataDetail: ((open: boolean) => void) | null = null;
  private unlockPreview: UnlockPinataPreview | null = null;
  private fillRaf = 0;
  private silhouetteGen = 0;
  private levelRows: PinataLevelRow[] = [];

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "overlay overlay-round-end hidden";
    root.appendChild(this.el);
  }

  show(
    state: GameState,
    handlers: {
      onUpgrades: () => void;
      onOrders: () => void;
      onContinue: () => void;
      onHome: () => void;
      onLevelsToggle?: (open: boolean) => void;
      onPinataDetail?: (open: boolean) => void;
    },
  ): void {
    this.disposePreview();
    if (this.fillRaf) {
      cancelAnimationFrame(this.fillRaf);
      this.fillRaf = 0;
    }
    this.onUpgrades = handlers.onUpgrades;
    this.onOrders = handlers.onOrders;
    this.onContinue = handlers.onContinue;
    this.onHome = handlers.onHome;
    this.onLevelsToggle = handlers.onLevelsToggle ?? null;
    this.onPinataDetail = handlers.onPinataDetail ?? null;
    const s = state.roundStats;
    const accuracyPct = state.accuracyPercent();
    const perfect = s.accuracyBonus > 0;
    const candyBanked = s.candyEarned + s.accuracyBonus;
    const unlock = state.unlockProgress();
    const unlockPct = Math.round(unlock.progress * 100);

    const breakEntries = Object.entries(s.breaksByType)
      .filter((entry): entry is [PinataTypeId, number] => (entry[1] ?? 0) > 0 && entry[0] in PINATA_TYPES)
      .sort(
        (a, b) =>
          (Object.keys(PINATA_TYPES) as PinataTypeId[]).indexOf(a[0]) -
          (Object.keys(PINATA_TYPES) as PinataTypeId[]).indexOf(b[0]),
      );

    const candyBreakdown = candyTypesForDisplay()
      .filter((t) => (s.candyPieces[t.id] ?? 0) > 0)
      .map(
        (t) => `
          <span class="piece-chip" style="--piece:${t.color}">
            <span class="swatch"></span>${formatNumber(s.candyPieces[t.id] ?? 0)} ${t.name}
          </span>`,
      )
      .join("");

    const pinataBreakdown = breakEntries
      .map(([typeId, count]) => {
        const name = PINATA_TYPES[typeId].name;
        return `
          <div class="break-type">
            <span class="break-type-count">${formatNumber(count)}</span>
            <img class="break-type-preview" src="${pinataPortraitSrc(typeId)}" alt="${name}" />
          </div>`;
      })
      .join("");

    const unlockTitle = unlock.complete
      ? "All Types Unlocked"
      : `Next Unlock: ${unlock.next?.name ?? "???"}`;

    const dueIn = state.orderDueInRounds;
    const dueKicker = dueIn <= 0 ? "DUE" : "DUE IN";
    const dueValue = dueIn <= 0 ? "NOW!" : dueIn === 1 ? "1 ROUND" : `${dueIn} ROUNDS`;
    const dueUrgent = dueIn <= 2;
    const orderPrice = formatNumber(state.orderRemaining());
    const showOrders = state.isCurrentOrderVisible();

    this.el.classList.add("has-top-candy");
    this.el.classList.toggle("has-order-banner", showOrders);
    this.el.innerHTML = `
      <div class="round-end-stack">
      <div class="panel panel-round-end">
        <h1>Round ${state.round} Complete!</h1>
        <p class="sub">${
          showOrders
            ? "Candy tallied. Choose upgrades, the next payment, or the next round."
            : "Candy tallied. Choose upgrades or the next round."
        }</p>
        <div class="round-end-grid">
          <div class="stat-chip stat-chip-accuracy">
            <div class="label">Accuracy</div>
            <div class="value">${accuracyPct}%</div>
            ${perfect ? `<div class="stat-bonus">+${formatNumber(s.accuracyBonus)} Perfect Aim</div>` : ""}
          </div>
          <div class="stat-chip stat-chip-candy">
            <div class="label">Candy</div>
            <div class="value candy-chip-value">
              +${formatNumber(candyBanked)}
              <img class="candy-coin-icon" src="${assetUrl("art/T_CandyCoin.png")}" alt="" draggable="false" />
            </div>
            <div class="piece-row">${candyBreakdown || `<span class="piece-empty">No candy this round</span>`}</div>
          </div>
          <div class="stat-chip stat-chip-breaks">
            <div class="label">Piñatas Destroyed</div>
            <div class="value">${formatNumber(s.breaks)}</div>
            ${pinataBreakdown ? `<div class="break-type-row">${pinataBreakdown}</div>` : ""}
          </div>
          <div class="stat-chip unlock-chip" data-unlock-chip>
            <div class="label">${unlockTitle}</div>
            <div class="unlock-hero">
              <div class="unlock-preview" data-unlock-preview></div>
              <div class="unlock-pct">${unlockPct}%</div>
            </div>
          </div>
        </div>
        <div class="round-end-actions">
          <button class="btn btn-primary interactive" data-upgrades>Upgrades</button>
          <button class="btn btn-blue interactive" data-continue>NEXT ROUND</button>
        </div>
      </div>
      <button type="button" class="btn btn-secondary interactive pinata-level-open" data-levels-toggle aria-expanded="false" aria-haspopup="dialog" aria-controls="pinata-level-hud">
        Piñata Levels
      </button>
      </div>
      <button type="button" class="btn btn-secondary interactive round-end-home" data-home aria-label="Home">
        ${HOME_ICON}
      </button>
      ${this.renderLevelHud(state.pinataLevels())}
      ${
        showOrders
          ? `
      <button type="button" class="round-end-order-banner interactive" data-orders aria-label="Next order, ${orderPrice} candy, ${dueKicker} ${dueValue}">
        <span class="round-end-order-frame" aria-hidden="true"></span>
        <span class="round-end-order-candy">
          <img class="candy-coin-icon" src="${assetUrl("art/T_CandyCoin.png")}" alt="" draggable="false" />
          <span class="round-end-order-candy-value">${orderPrice}</span>
        </span>
        <span class="round-end-order-due">
          <img class="round-end-order-clock" src="${assetUrl("art/T_Clock.png")}" alt="" draggable="false" />
          <span class="round-end-order-due-copy">
            <span class="round-end-order-due-kicker">${dueKicker}</span>
            <span class="round-end-order-due-value${dueUrgent ? " is-urgent is-warn" : ""}">${dueValue}</span>
          </span>
        </span>
        <img class="round-end-order-kid-art" src="${assetUrl("art/T_OrderKid.png")}" alt="" draggable="false" />
      </button>`
          : ""
      }
    `;
    this.el.classList.remove("hidden");
    const previewHost = this.el.querySelector("[data-unlock-preview]");
    if (previewHost instanceof HTMLElement) {
      this.unlockPreview = new UnlockPinataPreview();
      void this.unlockPreview.mount(previewHost, {
        skin: skinForUnlockType(unlock.next?.id ?? "next"),
        fill: unlock.progress,
      });
    }
    this.el.querySelector("[data-upgrades]")!.addEventListener("click", () => {
      this.hide();
      this.onUpgrades?.();
    });
    this.el.querySelector("[data-orders]")?.addEventListener("click", () => {
      this.onOrders?.();
    });
    this.el.querySelector("[data-continue]")?.addEventListener("click", () => {
      this.hide();
      this.onContinue?.();
    });
    this.el.querySelector("[data-home]")?.addEventListener("click", () => {
      this.showHomeConfirm();
    });
    this.bindLevelHud();
    this.applyLockedSilhouettes();
  }

  private showHomeConfirm(): void {
    const existing = this.el.querySelector("[data-home-confirm]");
    existing?.remove();

    const confirm = document.createElement("div");
    confirm.className = "round-end-home-confirm";
    confirm.dataset.homeConfirm = "";
    confirm.innerHTML = `
      <div class="panel panel-round-end-confirm">
        <p class="round-end-home-confirm-copy">Go back to main screen?</p>
        <button type="button" class="btn btn-primary interactive" data-home-yes>YES</button>
        <button type="button" class="btn btn-secondary interactive" data-home-no>NO</button>
      </div>
    `;
    this.el.appendChild(confirm);

    const dismiss = () => confirm.remove();
    confirm.querySelector("[data-home-yes]")?.addEventListener("click", () => {
      dismiss();
      this.hide();
      this.onHome?.();
    });
    confirm.querySelector("[data-home-no]")?.addEventListener("click", dismiss);
    confirm.addEventListener("click", (event) => {
      if (event.target === confirm) dismiss();
    });
  }

  upgradesButton(): HTMLElement | null {
    return this.el.querySelector("[data-upgrades]");
  }

  continueButton(): HTMLElement | null {
    return this.el.querySelector("[data-continue]");
  }

  unlockChip(): HTMLElement | null {
    return this.el.querySelector("[data-unlock-chip]");
  }

  levelsButton(): HTMLElement | null {
    return this.el.querySelector("[data-levels-toggle]");
  }

  firstLevelRow(): HTMLElement | null {
    return (
      this.el.querySelector(".pinata-level-row:not(.is-locked)") ??
      this.el.querySelector(".pinata-level-row")
    );
  }

  levelsCloseButton(): HTMLElement | null {
    return this.el.querySelector("[data-levels-hide]");
  }

  pinataDetailPanel(): HTMLElement | null {
    return this.el.querySelector("[data-pinata-detail-panel]");
  }

  closeLevelsHud(): void {
    this.setLevelsHudOpen(false);
  }

  private setLevelsHudOpen(open: boolean): void {
    const hud = this.el.querySelector("[data-levels-hud]");
    const toggleBtn = this.el.querySelector("[data-levels-toggle]");
    if (!(hud instanceof HTMLElement) || !(toggleBtn instanceof HTMLElement)) return;
    if (!open) this.hidePinataDetail();
    hud.classList.toggle("hidden", !open);
    toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) this.animateLevelFills();
  }

  hide(): void {
    this.silhouetteGen += 1;
    if (this.fillRaf) {
      cancelAnimationFrame(this.fillRaf);
      this.fillRaf = 0;
    }
    this.disposePreview();
    this.hidePinataDetail();
    this.el.querySelector("[data-levels-hud]")?.classList.add("hidden");
    this.el.querySelector("[data-levels-toggle]")?.setAttribute("aria-expanded", "false");
    this.el.classList.add("hidden");
    this.el.classList.remove("has-order-banner", "has-top-candy");
  }

  private renderLevelHud(rows: PinataLevelRow[]): string {
    this.levelRows = rows;
    const items = rows
      .map((row) => {
        const locked = !row.unlocked;
        const fromPct = Math.round(Math.min(1, Math.max(0, row.previousFill)) * 1000) / 10;
        const toPct = Math.round(Math.min(1, Math.max(0, row.fill)) * 1000) / 10;
        const accent = accentForPinataType(row.typeId);
        const upClass = !locked && row.levelsGained > 0 ? " is-levelup" : "";
        const loot =
          !locked && row.lootBonus > 0
            ? `<span class="pinata-level-loot">+${formatPercent(row.lootBonus)} loot</span>`
            : "";
        const portrait = `<img class="pinata-level-preview" src="${pinataPortraitSrc(row.typeId)}" alt="" ${
          locked ? `data-silhouette data-type-id="${row.typeId}"` : ""
        } />`;
        if (locked) {
          return `
          <div class="pinata-level-row is-locked" style="--accent:${accent}" aria-label="Locked">
            ${portrait}
            <span class="pinata-level-name">Locked</span>
          </div>`;
        }
        return `
          <div class="pinata-level-row${upClass} interactive" style="--accent:${accent}" data-pinata-open="${row.typeId}" role="button" tabindex="0" aria-haspopup="dialog" aria-label="${row.name}">
            <div class="pinata-level-head">
              <span class="pinata-level-name">${row.name}</span>
              <span class="pinata-level-lv">Lv ${formatNumber(row.level)}</span>
            </div>
            ${portrait}
            ${loot ? `<div class="pinata-level-meta">${loot}</div>` : ""}
            <div class="pinata-level-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${row.need}" aria-valuenow="${row.into}">
              <div class="pinata-level-fill" data-fill-from="${fromPct}" data-fill-to="${toPct}"></div>
            </div>
          </div>`;
      })
      .join("");

    return `
      <div class="pinata-level-hud hidden" id="pinata-level-hud" data-levels-hud role="dialog" aria-modal="true" aria-labelledby="pinata-level-title" aria-describedby="pinata-level-copy">
        <div class="panel panel-pinata-levels">
          <h1 id="pinata-level-title">Piñata Levels</h1>
          <p class="sub" id="pinata-level-copy">Level up pinatas by breaking them, to increase their loot by ${formatPercent(PINATA_LEVEL_LOOT_PER_RANK)} per level.</p>
          <div class="pinata-level-list">${items}</div>
          <button type="button" class="btn btn-secondary interactive" data-levels-hide>Close</button>
        </div>
        <div class="pinata-detail-hud hidden" data-pinata-detail role="dialog" aria-modal="true" aria-labelledby="pinata-detail-title">
          <div class="panel panel-pinata-detail" data-pinata-detail-panel></div>
        </div>
      </div>`;
  }

  private bindLevelHud(): void {
    const hud = this.el.querySelector("[data-levels-hud]");
    const toggleBtn = this.el.querySelector("[data-levels-toggle]");
    const list = this.el.querySelector(".pinata-level-list");
    const detail = this.el.querySelector("[data-pinata-detail]");
    if (!(hud instanceof HTMLElement) || !(toggleBtn instanceof HTMLElement)) return;
    const setOpen = (open: boolean) => this.setLevelsHudOpen(open);
    toggleBtn.addEventListener("click", () => {
      setOpen(true);
      this.onLevelsToggle?.(true);
    });
    this.el.querySelector("[data-levels-hide]")?.addEventListener("click", () => {
      setOpen(false);
      this.onLevelsToggle?.(false);
    });
    hud.addEventListener("click", (event) => {
      if (event.target !== hud) return;
      setOpen(false);
      this.onLevelsToggle?.(false);
    });
    const openFromTarget = (target: EventTarget | null) => {
      const row = target instanceof Element ? target.closest("[data-pinata-open]") : null;
      if (!(row instanceof HTMLElement)) return;
      const typeId = row.dataset.pinataOpen;
      if (typeId) this.showPinataDetail(typeId);
    };
    list?.addEventListener("click", (event) => openFromTarget(event.target));
    list?.addEventListener("keydown", (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openFromTarget(event.target);
    });
    detail?.addEventListener("click", (event) => {
      if (event.target === detail) this.hidePinataDetail();
    });
  }

  private showPinataDetail(typeId: string): void {
    if (!(typeId in PINATA_TYPES)) return;
    const def = PINATA_TYPES[typeId as PinataTypeId];
    const hud = this.el.querySelector("[data-pinata-detail]");
    const panel = this.el.querySelector("[data-pinata-detail-panel]");
    if (!(hud instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;
    const row = this.levelRows.find((entry) => entry.typeId === typeId);
    const accent = accentForPinataType(typeId);
    const coin = `<img class="candy-coin-icon" src="${assetUrl("art/T_CandyCoin.png")}" alt="" draggable="false" />`;
    const level = row?.level ?? 1;
    panel.style.setProperty("--accent", accent);
    hud.setAttribute("aria-describedby", "pinata-detail-level");
    panel.innerHTML = `
      <img class="pinata-detail-preview" src="${pinataPortraitSrc(typeId)}" alt="" draggable="false" />
      <h1 id="pinata-detail-title">${def.name}</h1>
      <p class="pinata-detail-level" id="pinata-detail-level">Level ${formatNumber(level)}</p>
      <div class="pinata-detail-stat">
        <span class="label">HP</span>
        <span class="value">${formatNumber(def.hp)}</span>
      </div>
      <div class="pinata-detail-loot">
        <div class="pinata-detail-loot-title">Loot</div>
        ${this.pinataLootHtml(def, row, coin)}
      </div>
      <button type="button" class="btn btn-secondary interactive" data-pinata-detail-hide>Close</button>
    `;
    hud.classList.remove("hidden");
    panel.querySelector("[data-pinata-detail-hide]")?.addEventListener("click", () => {
      this.hidePinataDetail();
    });
    this.onPinataDetail?.(true);
  }

  private pinataLootHtml(def: PinataTypeDef, row: PinataLevelRow | undefined, coin: string): string {
    const bonus =
      row && row.lootBonus > 0
        ? `<div class="pinata-detail-loot-bonus">Level bonus +${formatPercent(row.lootBonus)}</div>`
        : "";
    if (def.thief) {
      return `
        <p class="pinata-detail-loot-note">
          Roams for ${formatNumber(THIEF.fillDurationSec)}s grabbing floor candy.
          Breaking it pays what it grabbed, or ${THIEF.payoutMult}× if it's full.
        </p>
        ${bonus}`;
    }
    if (def.loot.length === 0) {
      return `<p class="pinata-detail-loot-note">No candy loot.</p>${bonus}`;
    }
    const total = def.loot.reduce((sum, band) => sum + band.weight, 0) || 1;
    const bands = def.loot
      .map((band) => {
        const range =
          band.min === band.max
            ? formatNumber(band.min)
            : `${formatNumber(band.min)}–${formatNumber(band.max)}`;
        return `
          <div class="pinata-detail-loot-row">
            <span class="pinata-detail-loot-range">${coin}${range}</span>
            <span class="pinata-detail-loot-chance">${formatPercent(band.weight / total)}</span>
          </div>`;
      })
      .join("");
    return `${bands}${bonus}`;
  }

  private hidePinataDetail(): void {
    const hud = this.el.querySelector("[data-pinata-detail]");
    if (!(hud instanceof HTMLElement) || hud.classList.contains("hidden")) return;
    hud.classList.add("hidden");
    this.onPinataDetail?.(false);
  }

  private applyLockedSilhouettes(): void {
    const gen = ++this.silhouetteGen;
    const imgs = this.el.querySelectorAll<HTMLImageElement>("[data-silhouette]");
    for (const img of imgs) {
      const typeId = img.dataset.typeId;
      if (!typeId) continue;
      void pinataSilhouetteSrc(typeId).then((url) => {
        if (gen !== this.silhouetteGen) return;
        img.src = url;
        img.classList.add("is-ready");
      });
    }
  }

  private animateLevelFills(): void {
    const fills = this.el.querySelectorAll<HTMLElement>("[data-fill-from]");
    for (const fill of fills) {
      fill.style.width = `${fill.dataset.fillFrom ?? "0"}%`;
    }
    this.fillRaf = requestAnimationFrame(() => {
      this.fillRaf = requestAnimationFrame(() => {
        this.fillRaf = 0;
        for (const fill of fills) {
          fill.style.width = `${fill.dataset.fillTo ?? "0"}%`;
        }
      });
    });
  }

  private disposePreview(): void {
    this.unlockPreview?.dispose();
    this.unlockPreview = null;
  }
}
