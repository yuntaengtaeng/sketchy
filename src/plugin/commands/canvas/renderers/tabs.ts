import type { DomainElement } from "../../../../shared";
import { createLabel, hugFrame, rebuildStringList } from "./shared";

function buildTab(label: string, selected = false) {
  const tab = hugFrame("HORIZONTAL");
  tab.primaryAxisAlignItems = "CENTER";
  tab.counterAxisAlignItems = "CENTER";
  tab.paddingLeft = tab.paddingRight = 12;
  tab.paddingTop = tab.paddingBottom = 8;
  tab.fills = selected
    ? [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }]
    : [];
  tab.appendChild(
    createLabel(
      label,
      12,
      selected ? { r: 1, g: 1, b: 1 } : { r: 0.15, g: 0.15, b: 0.15 },
    ),
  );
  return tab;
}

export function createTabsNode(element: DomainElement & { type: "tabs" }) {
  const row = hugFrame("HORIZONTAL");
  row.strokes = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
  row.strokeWeight = 1;
  row.cornerRadius = 4;
  row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  const items = element.tabItems ?? ["Tab 1", "Tab 2"];
  rebuildStringList(row, items, "tab-item", (label) =>
    buildTab(label, label === (element.selectedTab ?? items[0])),
  );
  return row;
}

export function renderTabItems(
  node: FrameNode,
  items: string[],
  selectedTab?: string,
) {
  rebuildStringList(node, items, "tab-item", (label) =>
    buildTab(label, label === (selectedTab ?? items[0])),
  );
}
