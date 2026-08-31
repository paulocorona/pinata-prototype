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
