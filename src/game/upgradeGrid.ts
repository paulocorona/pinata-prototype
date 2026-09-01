import type { UpgradeId } from "./balance";
import { SKILL_TREE_GRID, UPGRADE_LAYOUT } from "./upgradeLayout";

export type GridPos = { col: number; row: number };
export type GridSize = { cols: number; rows: number };
export type UpgradeLayoutMap = Record<UpgradeId, GridPos>;

export function cloneLayout(layout: UpgradeLayoutMap): UpgradeLayoutMap {
  const next = {} as UpgradeLayoutMap;
  for (const id of Object.keys(layout) as UpgradeId[]) {
    next[id] = { ...layout[id] };
  }
  return next;
}

export function layoutsEqual(a: UpgradeLayoutMap, b: UpgradeLayoutMap): boolean {
  for (const id of Object.keys(a) as UpgradeId[]) {
    if (a[id].col !== b[id].col || a[id].row !== b[id].row) return false;
  }
  return true;
}

export function upgradeCellCenter(
  pos: GridPos,
  grid: GridSize = SKILL_TREE_GRID,
): { x: number; y: number } {
  return {
    x: ((pos.col + 0.5) / grid.cols) * 100,
    y: ((pos.row + 0.5) / grid.rows) * 100,
  };
}

export function percentToCell(
  x: number,
  y: number,
  grid: GridSize = SKILL_TREE_GRID,
): GridPos {
  return {
    col: Math.max(0, Math.min(grid.cols - 1, Math.floor((x / 100) * grid.cols))),
    row: Math.max(0, Math.min(grid.rows - 1, Math.floor((y / 100) * grid.rows))),
  };
}

export function upgradePosition(id: UpgradeId): { x: number; y: number } {
  return upgradeCellCenter(UPGRADE_LAYOUT[id]);
}

/** Must match `--skill-tree-cell` / `.skill-node` in style.css. */
export const SKILL_TREE_CELL_PX = 128;
export const SKILL_NODE_PX = 96;
export const SKILL_NODE_CENTER_PX = 104;
export const LAYOUT_CELL_PX = 208;
export const LAYOUT_NODE_PX = 160;
export const LAYOUT_NODE_CENTER_PX = 176;

export function skillNodeRadiusPx(
  id: UpgradeId,
  nodePx: number,
  centerPx: number,
): number {
  return ((id === "power" ? centerPx : nodePx) / 2) + 1;
}

/** Shorten a percent-space edge so it stops under each node instead of crossing it. */
export function insetSkillEdge(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromRadiusPx: number,
  toRadiusPx: number,
  cellPx: number,
  grid: GridSize = SKILL_TREE_GRID,
): { x1: number; y1: number; x2: number; y2: number } {
  const mapW = grid.cols * cellPx;
  const mapH = grid.rows * cellPx;
  const ax = (from.x / 100) * mapW;
  const ay = (from.y / 100) * mapH;
  const bx = (to.x / 100) * mapW;
  const by = (to.y / 100) * mapH;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len <= fromRadiusPx + toRadiusPx) {
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  }
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: ((ax + ux * fromRadiusPx) / mapW) * 100,
    y1: ((ay + uy * fromRadiusPx) / mapH) * 100,
    x2: ((bx - ux * toRadiusPx) / mapW) * 100,
    y2: ((by - uy * toRadiusPx) / mapH) * 100,
  };
}

export function occupantAt(
  layout: UpgradeLayoutMap,
  col: number,
  row: number,
  except?: UpgradeId,
): UpgradeId | null {
  for (const id of Object.keys(layout) as UpgradeId[]) {
    if (id === except) continue;
    if (layout[id].col === col && layout[id].row === row) return id;
  }
  return null;
}

export function moveOrSwap(
  layout: UpgradeLayoutMap,
  id: UpgradeId,
  col: number,
  row: number,
): UpgradeLayoutMap {
  const next = cloneLayout(layout);
  const other = occupantAt(next, col, row, id);
  const from = next[id];
  if (other) next[other] = { col: from.col, row: from.row };
  next[id] = { col, row };
  return next;
}
