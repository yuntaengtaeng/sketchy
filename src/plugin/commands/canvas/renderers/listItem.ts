import type { DomainElement } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { clampCount, createLabel, hugFrame } from "./shared";

type ListItemContent = { title?: string; subtitle?: string; value?: string };

function buildListItemRow(
  itemType: "basic" | "leading" | "trailing",
  name: string,
  content?: ListItemContent,
) {
  const row = hugFrame("HORIZONTAL");
  row.name = name;
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 10;
  row.fills = [];

  // leading은 아이콘이 아니라 Image 블록과 같은 회색 자리, 작게
  if (itemType === "leading") {
    const image = figma.createFrame();
    image.resize(32, 32);
    image.cornerRadius = 4;
    image.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.9 } }];
    row.appendChild(image);
  }

  const textColumn = hugFrame("VERTICAL");
  textColumn.itemSpacing = 2;
  textColumn.fills = [];
  textColumn.appendChild(
    createLabel(content?.title || "Title", 13, { r: 0.15, g: 0.15, b: 0.15 }),
  );
  textColumn.appendChild(
    createLabel(content?.subtitle || "Subtitle", 11, {
      r: 0.55,
      g: 0.55,
      b: 0.55,
    }),
  );
  row.appendChild(textColumn);
  // FILL은 textColumn이 row에 붙은 뒤에만 설정할 수 있다
  if (itemType === "trailing") textColumn.layoutSizingHorizontal = "FILL";

  if (itemType === "trailing")
    row.appendChild(
      createLabel(content?.value || "Value", 12, { r: 0.4, g: 0.4, b: 0.4 }),
    );

  return row;
}

export function rebuildListItemRows(
  container: FrameNode,
  itemType: "basic" | "leading" | "trailing",
  count?: number,
  items?: ListItemContent[],
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === "list-row") child.remove();
  for (let index = 0; index < clampCount(count); index++) {
    const row = buildListItemRow(itemType, `Item ${index + 1}`, items?.[index]);
    row.setPluginData(PART, "list-row");
    container.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }
}

export function createListItemNode(
  element: DomainElement & { type: "listItem" },
) {
  const list = hugFrame("VERTICAL");
  list.itemSpacing = 10;
  list.fills = [];
  rebuildListItemRows(
    list,
    element.itemType ?? "basic",
    element.count,
    element.items,
  );
  return list;
}

export function renderListItemType(
  node: FrameNode,
  itemType: "basic" | "leading" | "trailing",
  count?: number,
  items?: ListItemContent[],
) {
  rebuildListItemRows(node, itemType, count, items);
}
