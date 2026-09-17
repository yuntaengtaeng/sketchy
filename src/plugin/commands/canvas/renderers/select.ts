import type { DomainElement } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { createLabel, hugFrame, rebuildStringList } from "./shared";

function buildOptionRow(label: string) {
  // layoutSizingHorizontal은 auto-layout 부모에 붙은 뒤에만 설정 가능해서
  // 여기서는 못 하고, 실제로 append하는 rebuildStringList가 대신 맡는다
  const row = hugFrame("HORIZONTAL");
  row.paddingLeft = row.paddingRight = 10;
  row.paddingTop = row.paddingBottom = 8;
  row.fills = [];
  row.appendChild(createLabel(label, 12, { r: 0.25, g: 0.25, b: 0.25 }));
  return row;
}

// list를 parent에 먼저 붙인 뒤에만 FILL을 설정할 수 있어 append까지 이
// 함수가 직접 맡는다
function createOptionsListNode(parent: FrameNode, options: string[]) {
  const list = hugFrame("VERTICAL");
  list.setPluginData(PART, "select-options");
  list.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  list.strokeWeight = 1;
  list.cornerRadius = 4;
  list.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  parent.appendChild(list);
  list.layoutSizingHorizontal = "FILL";
  rebuildStringList(list, options, "select-option", buildOptionRow, true);
  return list;
}

export function createSelectNode(element: DomainElement & { type: "select" }) {
  const wrap = hugFrame("VERTICAL");
  wrap.fills = [];
  wrap.itemSpacing = 4;

  const closedRow = hugFrame("HORIZONTAL");
  closedRow.setPluginData(PART, "select-row");
  closedRow.primaryAxisAlignItems = "MIN";
  closedRow.counterAxisAlignItems = "CENTER";
  closedRow.paddingLeft = closedRow.paddingRight = 10;
  closedRow.paddingTop = closedRow.paddingBottom = 8;
  closedRow.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  closedRow.strokeWeight = 1;
  closedRow.cornerRadius = 4;
  closedRow.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  const firstOption = element.options?.[0] ?? "Select";
  const optionLabel = createLabel(firstOption, 12, {
    r: 0.35,
    g: 0.35,
    b: 0.35,
  });
  const chevron = createLabel("▾", 12, { r: 0.35, g: 0.35, b: 0.35 });
  closedRow.appendChild(optionLabel);
  closedRow.appendChild(chevron);
  wrap.appendChild(closedRow);
  // layoutSizingHorizontal은 이미 auto-layout 부모에 붙은 뒤에만 설정할 수
  // 있다, append 전에 설정하면 Figma가 예외를 던져 삽입 자체가 실패한다
  closedRow.layoutSizingHorizontal = "FILL";
  optionLabel.layoutSizingHorizontal = "FILL";

  if ((element.displayState ?? "collapsed") === "expanded")
    createOptionsListNode(wrap, element.options ?? []);

  return wrap;
}

function selectRow(node: FrameNode) {
  return node.children.find(
    (child) => child.getPluginData(PART) === "select-row",
  );
}

export function renderSelectOptions(node: FrameNode, options: string[]) {
  const row = selectRow(node);
  if (row?.type === "FRAME") {
    const label = row.children.find((child) => child.type === "TEXT");
    if (label?.type === "TEXT") label.characters = options[0] ?? "Select";
  }
  const list = node.children.find(
    (child) => child.getPluginData(PART) === "select-options",
  );
  if (list?.type === "FRAME")
    rebuildStringList(list, options, "select-option", buildOptionRow, true);
}

export function renderSelectDisplayState(
  node: FrameNode,
  displayState: "collapsed" | "expanded",
  options: string[],
) {
  const existing = node.children.find(
    (child) => child.getPluginData(PART) === "select-options",
  );
  if (displayState === "expanded") {
    if (!existing) createOptionsListNode(node, options);
  } else {
    existing?.remove();
  }
}
