import type { DomainElement } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { clampCount, createLabel, hugFrame } from "./shared";

// 헤더/행 프레임과 셀 프레임에 이름을 붙이지 않으면 Figma 레이어 패널·Dev
// Mode에서 전부 "Frame"으로만 보여 몇 번째 행인지, 어느 컬럼 셀인지 구분할
// 수 없다. 행은 순번으로, 셀은 소속 컬럼명으로 이름을 붙여 구분 가능하게 한다
function buildTableRow(
  cells: string[],
  header: boolean,
  rowName: string,
  columnNames: string[],
) {
  const row = hugFrame("HORIZONTAL");
  row.name = rowName;
  row.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  row.strokeWeight = 1;
  row.fills = header
    ? [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.93 } }]
    : [];
  const cellNodes = cells.map((cell, index) => {
    const cellFrame = hugFrame("HORIZONTAL");
    cellFrame.name = columnNames[index] ?? `Column ${index + 1}`;
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
  rows?: string[][],
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === "table-row") child.remove();
  const header = buildTableRow(columns, true, "Header", columns);
  header.setPluginData(PART, "table-row");
  container.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  for (let index = 0; index < clampCount(count); index++) {
    const rowValues = rows?.[index];
    const row = buildTableRow(
      columns.map((_, columnIndex) => rowValues?.[columnIndex] || "Value"),
      false,
      `Row ${index + 1}`,
      columns,
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
    element.rows,
  );
  return table;
}

export function renderTableColumns(
  node: FrameNode,
  columns: string[],
  count?: number,
  rows?: string[][],
) {
  rebuildTable(node, columns, count, rows);
}
