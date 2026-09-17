import type { DomainElement } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { clampCount, createLabel, hugFrame } from "./shared";

function buildTableRow(cells: string[], header: boolean) {
  const row = hugFrame("HORIZONTAL");
  row.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  row.strokeWeight = 1;
  row.fills = header
    ? [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.93 } }]
    : [];
  const cellNodes = cells.map((cell) => {
    const cellFrame = hugFrame("HORIZONTAL");
    cellFrame.paddingLeft = cellFrame.paddingRight = 8;
    cellFrame.paddingTop = cellFrame.paddingBottom = 6;
    cellFrame.fills = [];
    cellFrame.appendChild(
      createLabel(
        cell,
        11,
        header ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 0.4, g: 0.4, b: 0.4 },
      ),
    );
    row.appendChild(cellFrame);
    return cellFrame;
  });
  // FILL은 각 cell이 row에 붙은 뒤에만 설정할 수 있다, 컬럼 폭을 균등 분배
  for (const cellFrame of cellNodes) cellFrame.layoutSizingHorizontal = "FILL";
  return row;
}

export function rebuildTable(
  container: FrameNode,
  columns: string[],
  count?: number,
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === "table-row") child.remove();
  const header = buildTableRow(columns, true);
  header.setPluginData(PART, "table-row");
  container.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  for (let index = 0; index < clampCount(count); index++) {
    const row = buildTableRow(
      columns.map(() => "Value"),
      false,
    );
    row.setPluginData(PART, "table-row");
    container.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }
}

export function createTableNode(element: DomainElement & { type: "table" }) {
  const table = hugFrame("VERTICAL");
  table.fills = [];
  table.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  table.strokeWeight = 1;
  table.cornerRadius = 4;
  rebuildTable(
    table,
    element.columns ?? ["Column 1", "Column 2", "Column 3"],
    element.count,
  );
  return table;
}

export function renderTableColumns(
  node: FrameNode,
  columns: string[],
  count?: number,
) {
  rebuildTable(node, columns, count);
}
