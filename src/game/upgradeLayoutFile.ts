import type { GridPos, GridSize } from "./upgradeGrid";

export function formatUpgradeLayoutSource(
  grid: GridSize,
  layout: Record<string, GridPos>,
  order: readonly string[],
): string {
  const entries = order
    .map((id) => `  ${id}: { col: ${layout[id].col}, row: ${layout[id].row} },`)
    .join("\n");
  return `import type { UpgradeId } from "./balance";
import type { GridPos } from "./upgradeGrid";

export const SKILL_TREE_GRID = { cols: ${grid.cols}, rows: ${grid.rows} } as const;

export const UPGRADE_LAYOUT: Record<UpgradeId, GridPos> = {
${entries}
};
`;
}
