import {
  SKILL_TREE_EDGES,
  UPGRADES,
  emptyUpgrades,
  upgradeDescription,
  upgradeDisplayName,
  type UpgradeId,
} from "../game/balance";
import { SKILL_TREE_GRID, UPGRADE_LAYOUT } from "../game/upgradeLayout";
import { formatUpgradeLayoutSource } from "../game/upgradeLayoutFile";
import {
  cloneLayout,
  layoutsEqual,
  moveOrSwap,
  occupantAt,
  percentToCell,
  upgradeCellCenter,
  type GridPos,
  type UpgradeLayoutMap,
} from "../game/upgradeGrid";

const PAN_THRESHOLD_PX = 6;
const ZOOM_MIN = 0.18;
const ZOOM_MAX = 2.6;
const DRAFT_KEY = "pinata-upgrade-layout-draft";
const LOCK_KEY = "pinata-upgrade-layout-locks";
const UNDO_LIMIT = 80;
const LOCK_ICON = `<svg class="layout-lock-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1.25A3.75 3.75 0 0 0 4.25 5v1.25H3v8.5h10V6.25h-1.25V5A3.75 3.75 0 0 0 8 1.25Zm2.25 5V5a2.25 2.25 0 1 0-4.5 0v1.25h4.5Z"/></svg>`;

type Branch = "power" | "swing" | "stamina" | "hitRadius" | "candyYield" | "spawn" | "finale";

const BRANCH_ROOTS: Partial<Record<UpgradeId, Branch>> = {
  power: "power",
  swing: "swing",
  stamina: "stamina",
  hitRadius: "hitRadius",
  candyYield: "candyYield",
  morePinatas: "spawn",
  moreDamage8: "finale",
  moreCritChance5: "finale",
  moreCritDamage5: "finale",
  moreSpeed4: "finale",
};

function branchFor(id: UpgradeId, seen: Set<UpgradeId> = new Set()): Branch {
  if (seen.has(id)) return "power";
  seen.add(id);
  const rooted = BRANCH_ROOTS[id];
  if (rooted) return rooted;
  const def = UPGRADES.find((u) => u.id === id);
  const pred = def?.requires?.[0] ?? def?.requiresAny?.[0];
  return pred ? branchFor(pred, seen) : "power";
}

export class UpgradeLayoutEditor {
  readonly el: HTMLElement;
  private layout: UpgradeLayoutMap;
  private saved: UpgradeLayoutMap;
  private undoStack: UpgradeLayoutMap[] = [];
  private redoStack: UpgradeLayoutMap[] = [];
  private selected: UpgradeId | null = null;
  private locked = new Set<UpgradeId>();
  private panX = 0;
  private panY = 0;
  private zoom = 1;
  private status = "Drag a node onto a grid cell. Drop on another node to swap. L locks the selected node.";
  private saving = false;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "layout-editor";
    root.appendChild(this.el);
    this.saved = cloneLayout(UPGRADE_LAYOUT);
    this.layout = this.loadDraft() ?? cloneLayout(UPGRADE_LAYOUT);
    this.locked = this.loadLocks();
    this.render();
    this.fitMap();
    window.addEventListener("keydown", this.onKey);
  }

  private loadDraft(): UpgradeLayoutMap | null {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      const wrapped =
        parsed &&
        typeof parsed === "object" &&
        "layout" in parsed &&
        (parsed as { layout?: unknown }).layout &&
        typeof (parsed as { layout?: unknown }).layout === "object"
          ? (parsed as { cols?: number; rows?: number; layout: UpgradeLayoutMap })
          : null;
      const layout = wrapped?.layout ?? (parsed as UpgradeLayoutMap);
      for (const u of UPGRADES) {
        if (!layout[u.id] || typeof layout[u.id].col !== "number") return null;
      }
      const draftCols = wrapped?.cols;
      const draftRows = wrapped?.rows;
      if (draftRows !== undefined && draftRows > SKILL_TREE_GRID.rows) return null;
      if (draftCols === SKILL_TREE_GRID.cols) return layout;
      const previousCols = 19;
      const delta = SKILL_TREE_GRID.cols - previousCols;
      if ((draftCols === previousCols || draftCols === undefined) && delta > 0) {
        const next = cloneLayout(layout);
        for (const id of Object.keys(next) as UpgradeId[]) {
          next[id] = { col: next[id].col + delta, row: next[id].row };
        }
        return next;
      }
      return null;
    } catch {
      return null;
    }
  }

  private persistDraft(): void {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        cols: SKILL_TREE_GRID.cols,
        rows: SKILL_TREE_GRID.rows,
        layout: this.layout,
      }),
    );
  }

  private loadLocks(): Set<UpgradeId> {
    try {
      const raw = sessionStorage.getItem(LOCK_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return new Set();
      const valid = new Set(UPGRADES.map((u) => u.id));
      return new Set(parsed.filter((id): id is UpgradeId => typeof id === "string" && valid.has(id as UpgradeId)));
    } catch {
      return new Set();
    }
  }

  private persistLocks(): void {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify([...this.locked]));
  }

  private isLocked(id: UpgradeId): boolean {
    return this.locked.has(id);
  }

  private dirty(): boolean {
    return !layoutsEqual(this.layout, this.saved);
  }

  private render(): void {
    const grid = SKILL_TREE_GRID;
    const cells: string[] = [];
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        cells.push(`<div class="layout-cell" data-col="${col}" data-row="${row}"></div>`);
      }
    }

    const dummy = emptyUpgrades();
    const nodes = UPGRADES.map((u) => {
      const pos = upgradeCellCenter(this.layout[u.id], grid);
      const center = u.id === "power";
      const selected = this.selected === u.id;
      const locked = this.isLocked(u.id);
      const classes = [
        "skill-node",
        "layout-node",
        "interactive",
        center ? "skill-node-center" : "",
        selected ? "is-selected" : "",
        locked ? "is-locked" : "",
        `layout-branch-${branchFor(u.id)}`,
      ]
        .filter(Boolean)
        .join(" ");
      const desc = upgradeDescription(u, dummy);
      return `
        <button
          type="button"
          class="${classes}"
          data-upgrade="${u.id}"
          style="left:${pos.x}%;top:${pos.y}%"
          title="${desc}${locked ? " — Locked in editor" : ""}"
        >
          <span class="skill-node-ring" aria-hidden="true"></span>
          <span class="skill-node-name">${upgradeDisplayName(u)}</span>
          <span class="layout-lock-badge" data-lock-toggle title="Click to ${locked ? "unlock" : "lock"}">${LOCK_ICON}</span>
        </button>`;
    }).join("");

    const canUndo = this.undoStack.length > 0;
    const canRedo = this.redoStack.length > 0;
    const dirty = this.dirty();
    const sel = this.selected
      ? UPGRADES.find((u) => u.id === this.selected)
      : null;
    const selPos = this.selected ? this.layout[this.selected] : null;

    this.el.innerHTML = `
      <header class="layout-toolbar">
        <div class="layout-toolbar-copy">
          <h1>Upgrade layout</h1>
          <p>${this.status}</p>
        </div>
        <div class="layout-toolbar-actions">
            ${
              sel && selPos
                ? `<span class="layout-selection">${this.selectionText(sel.id, selPos)}</span>`
                : `<span class="layout-selection is-empty">No node selected</span>`
            }
          <button type="button" class="btn btn-secondary" data-lock ${sel ? "" : "disabled"}>
            ${sel && this.isLocked(sel.id) ? "Unlock" : "Lock"}
          </button>
          <a class="btn btn-secondary" href="/">Game</a>
          <button type="button" class="btn btn-secondary" data-undo ${canUndo ? "" : "disabled"}>Undo</button>
          <button type="button" class="btn btn-secondary" data-redo ${canRedo ? "" : "disabled"}>Redo</button>
          <button type="button" class="btn btn-secondary" data-copy>Copy</button>
          <button type="button" class="btn btn-primary" data-save ${dirty && !this.saving ? "" : "disabled"}>
            ${this.saving ? "Saving…" : dirty ? "Save" : "Saved"}
          </button>
        </div>
      </header>
      <div class="layout-viewport interactive" data-layout-viewport>
        <div class="layout-map">
          <div
            class="layout-grid"
            style="grid-template-columns:repeat(${grid.cols},1fr);grid-template-rows:repeat(${grid.rows},1fr)"
          >
            ${cells.join("")}
          </div>
          <svg class="skill-tree-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${this.edgeMarkup()}
          </svg>
          ${nodes}
        </div>
      </div>
    `;

    this.bindChrome();
    this.bindTree();
    this.applyPan();
  }

  private edgeMarkup(): string {
    return SKILL_TREE_EDGES.map(([from, to]) => {
      const a = upgradeCellCenter(this.layout[from]);
      const b = upgradeCellCenter(this.layout[to]);
      return `<line class="skill-edge lit" x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%" />`;
    }).join("");
  }

  private bindChrome(): void {
    this.el.querySelector("[data-undo]")?.addEventListener("click", () => this.undo());
    this.el.querySelector("[data-redo]")?.addEventListener("click", () => this.redo());
    this.el.querySelector("[data-copy]")?.addEventListener("click", () => void this.copySource());
    this.el.querySelector("[data-save]")?.addEventListener("click", () => void this.save());
    this.el.querySelector("[data-lock]")?.addEventListener("click", () => {
      if (this.selected) this.toggleLock(this.selected);
    });
  }

  private bindTree(): void {
    const viewport = this.viewport();
    if (!viewport) return;

    let panning = false;
    let dragging: UpgradeId | null = null;
    let lockedDrag: UpgradeId | null = null;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let moved = false;

    const endPointer = (ev: PointerEvent): void => {
      if (pointerId === null || ev.pointerId !== pointerId) return;
      const id = dragging;
      const lockedId = lockedDrag;
      panning = false;
      dragging = null;
      lockedDrag = null;
      pointerId = null;
      viewport.classList.remove("is-dragging", "is-panning");
      this.clearHover();
      try {
        viewport.releasePointerCapture(ev.pointerId);
      } catch {
        /* already released */
      }
      if (lockedId && moved) {
        this.status = "Unlock this node before moving it.";
        this.refreshChrome();
        return;
      }
      if (id && moved) this.commitDrag(id, ev.clientX, ev.clientY);
    };

    viewport.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      const node = (ev.target as HTMLElement).closest("[data-upgrade]") as HTMLElement | null;
      if (node && (ev.target as HTMLElement).closest("[data-lock-toggle]")) {
        ev.preventDefault();
        const id = node.dataset.upgrade as UpgradeId;
        this.select(id);
        this.toggleLock(id);
        return;
      }
      pointerId = ev.pointerId;
      startX = ev.clientX;
      startY = ev.clientY;
      originX = this.panX;
      originY = this.panY;
      moved = false;
      if (node) {
        ev.preventDefault();
        const id = node.dataset.upgrade as UpgradeId;
        this.select(id);
        if (this.isLocked(id)) lockedDrag = id;
        else dragging = id;
      } else {
        panning = true;
        this.select(null);
      }
    });

    viewport.addEventListener("pointermove", (ev) => {
      if (pointerId === null || ev.pointerId !== pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && dx * dx + dy * dy < PAN_THRESHOLD_PX * PAN_THRESHOLD_PX) return;
      if (!moved) {
        moved = true;
        try {
          viewport.setPointerCapture(ev.pointerId);
        } catch {
          /* capture not available */
        }
      }
      if (panning) {
        viewport.classList.add("is-panning");
        this.panX = originX + dx;
        this.panY = originY + dy;
        this.applyPan();
        return;
      }
      if (lockedDrag) return;
      if (!dragging) return;
      ev.preventDefault();
      viewport.classList.add("is-dragging");
      this.previewDrag(dragging, ev.clientX, ev.clientY);
    });

    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);

    viewport.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();
        this.zoomAt(ev.clientX, ev.clientY, ev.deltaY);
      },
      { passive: false },
    );
  }

  private select(id: UpgradeId | null): void {
    this.selected = id;
    this.el.querySelectorAll(".layout-node").forEach((node) => {
      const el = node as HTMLElement;
      el.classList.toggle("is-selected", el.dataset.upgrade === id);
    });
    const label = this.el.querySelector(".layout-selection");
    if (!label) return;
    if (!id) {
      label.classList.add("is-empty");
      label.textContent = "No node selected";
      this.refreshLockButton();
      return;
    }
    const pos = this.layout[id];
    label.classList.remove("is-empty");
    label.textContent = this.selectionText(id, pos);
    this.refreshLockButton();
  }

  private selectionText(id: UpgradeId, pos: GridPos): string {
    const def = UPGRADES.find((u) => u.id === id)!;
    return `${upgradeDisplayName(def)} · ${pos.col}, ${pos.row}${this.isLocked(id) ? " · Locked" : ""}`;
  }

  private toggleLock(id: UpgradeId): void {
    if (this.locked.has(id)) this.locked.delete(id);
    else this.locked.add(id);
    this.persistLocks();
    const locked = this.isLocked(id);
    const name = upgradeDisplayName(UPGRADES.find((u) => u.id === id)!);
    this.status = locked ? `Locked ${name}.` : `Unlocked ${name}.`;
    const node = this.el.querySelector(`[data-upgrade="${id}"]`) as HTMLElement | null;
    node?.classList.toggle("is-locked", locked);
    const desc = upgradeDescription(UPGRADES.find((u) => u.id === id)!, emptyUpgrades());
    if (node) node.title = `${desc}${locked ? " — Locked in editor" : ""}`;
    const badge = node?.querySelector("[data-lock-toggle]") as HTMLElement | null;
    if (badge) badge.title = `Click to ${locked ? "unlock" : "lock"}`;
    this.refreshChrome();
    if (this.selected === id) this.select(id);
  }

  private previewDrag(id: UpgradeId, clientX: number, clientY: number): void {
    const pct = this.clientToPercent(clientX, clientY);
    if (!pct) return;
    const node = this.el.querySelector(`[data-upgrade="${id}"]`) as HTMLElement | null;
    if (node) {
      node.classList.add("is-dragging-node");
      node.style.left = `${pct.x}%`;
      node.style.top = `${pct.y}%`;
    }
    const cell = percentToCell(pct.x, pct.y);
    this.el.querySelectorAll(".layout-cell").forEach((el) => {
      const hit =
        Number((el as HTMLElement).dataset.col) === cell.col &&
        Number((el as HTMLElement).dataset.row) === cell.row;
      el.classList.toggle("is-target", hit);
      const other = occupantAt(this.layout, cell.col, cell.row, id);
      const blocked = other !== null && this.isLocked(other);
      el.classList.toggle("is-swap", hit && other !== null && !blocked);
      el.classList.toggle("is-blocked", hit && blocked);
    });
    this.redrawEdges(id, pct);
  }

  private commitDrag(id: UpgradeId, clientX: number, clientY: number): void {
    const node = this.el.querySelector(`[data-upgrade="${id}"]`) as HTMLElement | null;
    node?.classList.remove("is-dragging-node");
    const pct = this.clientToPercent(clientX, clientY);
    if (!pct) {
      this.syncNodePositions();
      this.redrawEdges();
      return;
    }
    const cell = percentToCell(pct.x, pct.y);
    const cur = this.layout[id];
    if (cell.col === cur.col && cell.row === cur.row) {
      this.syncNodePositions();
      this.redrawEdges();
      return;
    }
    const other = occupantAt(this.layout, cell.col, cell.row, id);
    if (other && this.isLocked(other)) {
      this.status = `Can't swap onto ${upgradeDisplayName(UPGRADES.find((u) => u.id === other)!)} — that node is locked.`;
      this.refreshChrome();
      this.syncNodePositions();
      this.redrawEdges();
      return;
    }
    this.pushUndo();
    this.layout = moveOrSwap(this.layout, id, cell.col, cell.row);
    this.persistDraft();
    this.status = other
      ? `Swapped ${upgradeDisplayName(UPGRADES.find((u) => u.id === id)!)} with ${upgradeDisplayName(UPGRADES.find((u) => u.id === other)!)}.`
      : `Moved ${upgradeDisplayName(UPGRADES.find((u) => u.id === id)!)} to ${cell.col}, ${cell.row}.`;
    this.refreshChrome();
    this.syncNodePositions();
    this.redrawEdges();
    this.select(id);
  }

  private syncNodePositions(): void {
    for (const u of UPGRADES) {
      const node = this.el.querySelector(`[data-upgrade="${u.id}"]`) as HTMLElement | null;
      if (!node) continue;
      const pos = upgradeCellCenter(this.layout[u.id]);
      node.style.left = `${pos.x}%`;
      node.style.top = `${pos.y}%`;
    }
  }

  private redrawEdges(dragging?: UpgradeId, live?: { x: number; y: number }): void {
    const svg = this.el.querySelector(".skill-tree-edges");
    if (!svg) return;
    const posOf = (id: UpgradeId): { x: number; y: number } => {
      if (dragging && live && id === dragging) return live;
      return upgradeCellCenter(this.layout[id]);
    };
    svg.innerHTML = SKILL_TREE_EDGES.map(([from, to]) => {
      const a = posOf(from);
      const b = posOf(to);
      return `<line class="skill-edge lit" x1="${a.x}%" y1="${a.y}%" x2="${b.x}%" y2="${b.y}%" />`;
    }).join("");
  }

  private clearHover(): void {
    this.el.querySelectorAll(".layout-cell.is-target, .layout-cell.is-swap, .layout-cell.is-blocked").forEach((el) => {
      el.classList.remove("is-target", "is-swap", "is-blocked");
    });
  }

  private refreshChrome(): void {
    const undo = this.el.querySelector("[data-undo]") as HTMLButtonElement | null;
    const redo = this.el.querySelector("[data-redo]") as HTMLButtonElement | null;
    const save = this.el.querySelector("[data-save]") as HTMLButtonElement | null;
    const copy = this.el.querySelector(".layout-toolbar-copy p");
    if (undo) undo.disabled = this.undoStack.length === 0;
    if (redo) redo.disabled = this.redoStack.length === 0;
    if (save) {
      save.disabled = !this.dirty() || this.saving;
      save.textContent = this.saving ? "Saving…" : this.dirty() ? "Save" : "Saved";
    }
    if (copy) copy.textContent = this.status;
    this.refreshLockButton();
  }

  private refreshLockButton(): void {
    const lock = this.el.querySelector("[data-lock]") as HTMLButtonElement | null;
    if (!lock) return;
    lock.disabled = !this.selected;
    lock.textContent = this.selected && this.isLocked(this.selected) ? "Unlock" : "Lock";
  }

  private pushUndo(): void {
    this.undoStack.push(cloneLayout(this.layout));
    if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
    this.redoStack = [];
  }

  private undo(): void {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(cloneLayout(this.layout));
    this.layout = prev;
    this.persistDraft();
    this.status = "Undid last move.";
    this.refreshChrome();
    this.syncNodePositions();
    this.redrawEdges();
    if (this.selected) this.select(this.selected);
  }

  private redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(cloneLayout(this.layout));
    this.layout = next;
    this.persistDraft();
    this.status = "Redid last move.";
    this.refreshChrome();
    this.syncNodePositions();
    this.redrawEdges();
    if (this.selected) this.select(this.selected);
  }

  private nudge(dc: number, dr: number): void {
    if (!this.selected) return;
    if (this.isLocked(this.selected)) {
      this.status = "Unlock this node before moving it.";
      this.refreshChrome();
      return;
    }
    const cur = this.layout[this.selected];
    const col = cur.col + dc;
    const row = cur.row + dr;
    if (col < 0 || row < 0 || col >= SKILL_TREE_GRID.cols || row >= SKILL_TREE_GRID.rows) return;
    if (col === cur.col && row === cur.row) return;
    const other = occupantAt(this.layout, col, row, this.selected);
    if (other && this.isLocked(other)) {
      this.status = `Can't swap onto ${upgradeDisplayName(UPGRADES.find((u) => u.id === other)!)} — that node is locked.`;
      this.refreshChrome();
      return;
    }
    this.pushUndo();
    this.layout = moveOrSwap(this.layout, this.selected, col, row);
    this.persistDraft();
    this.status = other
      ? `Swapped onto ${upgradeDisplayName(UPGRADES.find((u) => u.id === other)!)}.`
      : `Moved to ${col}, ${row}.`;
    this.refreshChrome();
    this.syncNodePositions();
    this.redrawEdges();
    this.select(this.selected);
  }

  private sourceText(): string {
    return formatUpgradeLayoutSource(
      SKILL_TREE_GRID,
      this.layout,
      UPGRADES.map((u) => u.id),
    );
  }

  private async copySource(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.sourceText());
      this.status = "Copied layout TypeScript to the clipboard.";
    } catch {
      this.status = "Could not copy. Use Save while the Vite dev server is running.";
    }
    this.refreshChrome();
  }

  private async save(): Promise<void> {
    if (!this.dirty() || this.saving) return;
    this.saving = true;
    this.refreshChrome();
    try {
      const res = await fetch("/__upgrade-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cols: SKILL_TREE_GRID.cols,
          rows: SKILL_TREE_GRID.rows,
          layout: this.layout,
          order: UPGRADES.map((u) => u.id),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      this.saved = cloneLayout(this.layout);
      this.status = "Saved to src/game/upgradeLayout.ts.";
    } catch {
      this.status = "Save failed. Is the Vite dev server running? Copy the file instead.";
    } finally {
      this.saving = false;
      this.refreshChrome();
    }
  }

  private onKey = (ev: KeyboardEvent): void => {
    const meta = ev.ctrlKey || ev.metaKey;
    if (meta && ev.key.toLowerCase() === "s") {
      ev.preventDefault();
      void this.save();
      return;
    }
    if (meta && ev.key.toLowerCase() === "z") {
      ev.preventDefault();
      if (ev.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if (meta && ev.key.toLowerCase() === "y") {
      ev.preventDefault();
      this.redo();
      return;
    }
    if (ev.key.toLowerCase() === "l" && !meta && !ev.altKey) {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      ev.preventDefault();
      if (this.selected) this.toggleLock(this.selected);
      return;
    }
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      this.nudge(-1, 0);
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      this.nudge(1, 0);
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      this.nudge(0, -1);
    } else if (ev.key === "ArrowDown") {
      ev.preventDefault();
      this.nudge(0, 1);
    }
  };

  private clientToPercent(clientX: number, clientY: number): { x: number; y: number } | null {
    const viewport = this.viewport();
    const map = this.map();
    if (!viewport || !map) return null;
    const rect = viewport.getBoundingClientRect();
    const x = (clientX - rect.left - this.panX) / this.zoom;
    const y = (clientY - rect.top - this.panY) / this.zoom;
    return {
      x: (x / map.offsetWidth) * 100,
      y: (y / map.offsetHeight) * 100,
    };
  }

  private zoomAt(clientX: number, clientY: number, deltaY: number): void {
    const viewport = this.viewport();
    const map = this.map();
    if (!viewport || !map) return;
    const rect = viewport.getBoundingClientRect();
    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;
    const mapX = (cursorX - this.panX) / this.zoom;
    const mapY = (cursorY - this.panY) / this.zoom;
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.zoom * Math.exp(-deltaY * 0.0018)));
    if (next === this.zoom) return;
    this.zoom = next;
    this.panX = cursorX - mapX * this.zoom;
    this.panY = cursorY - mapY * this.zoom;
    this.applyPan();
  }

  private fitMap(): void {
    const viewport = this.viewport();
    const map = this.map();
    if (!viewport || !map) return;
    const pad = 24;
    const zoom = Math.min(
      (viewport.clientWidth - pad * 2) / map.offsetWidth,
      (viewport.clientHeight - pad * 2) / map.offsetHeight,
      1,
    );
    this.zoom = Math.max(ZOOM_MIN, zoom);
    this.panX = (viewport.clientWidth - map.offsetWidth * this.zoom) / 2;
    this.panY = (viewport.clientHeight - map.offsetHeight * this.zoom) / 2;
    this.applyPan();
  }

  private applyPan(): void {
    const map = this.map();
    if (!map) return;
    map.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  private viewport(): HTMLElement | null {
    return this.el.querySelector("[data-layout-viewport]");
  }

  private map(): HTMLElement | null {
    return this.el.querySelector(".layout-map");
  }
}
