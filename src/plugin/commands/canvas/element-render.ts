import {
  sectionLayout,
  type BlockType,
  type DomainElement,
  type Element,
} from "../../../shared";
import { elementLabelNode, PART } from "../../canvas-name.ts";
import { createCardNode, rebuildCards, renderCardType } from "./renderers/card";
import { createGenericFrame } from "./renderers/generic";
import {
  createListItemNode,
  rebuildListItemRows,
  renderListItemType,
} from "./renderers/listItem";
import { createSearchNode } from "./renderers/search";
import {
  createSelectNode,
  renderSelectDisplayState,
  renderSelectOptions,
} from "./renderers/select";
import { TEXT_SIZES } from "./renderers/shared";
import { createTabsNode, renderTabItems } from "./renderers/tabs";
import {
  createTableNode,
  rebuildTable,
  renderTableColumns,
} from "./renderers/table";
import { createToggleRow, renderChecked } from "./renderers/toggle";

export {
  renderCardType,
  renderChecked,
  renderListItemType,
  renderSelectDisplayState,
  renderSelectOptions,
  renderTableColumns,
  renderTabItems,
};

// text를 제외한 나머지는 전부 FRAME, 타입별 전용 구조가 있으면 그걸 쓰고
// 없으면 (input/image/divider/section) 기존에 쓰던 공용 "테두리 있는 한
// 줄 + 라벨" 모양을 그대로 쓴다
function createFrameFor(element: DomainElement) {
  if (
    element.type === "checkbox" ||
    element.type === "radio" ||
    element.type === "switch"
  )
    return createToggleRow(element);
  if (element.type === "tabs") return createTabsNode(element);
  if (element.type === "select") return createSelectNode(element);
  if (element.type === "search") return createSearchNode();
  if (element.type === "listItem") return createListItemNode(element);
  if (element.type === "card") return createCardNode(element);
  if (element.type === "table") return createTableNode(element);
  return createGenericFrame(element);
}

export function createElementNode(element: DomainElement, parent: FrameNode) {
  const node =
    element.type === "text" ? figma.createText() : createFrameFor(element);
  renderElementName(node, element.type, element.name);
  if (element.type === "text" && node.type === "TEXT")
    node.fontSize = TEXT_SIZES[element.textSize ?? "body"];
  node.setPluginData("sketchy:type", "element");
  node.setPluginData("sketchy:screen-id", element.screenId);
  node.setPluginData("sketchy:element-id", element.id);
  parent.appendChild(node);
  if (node.type === "FRAME") node.layoutSizingHorizontal = "FILL";
  return node;
}

export function renderElementName(
  node: SceneNode,
  type: BlockType,
  name: string,
) {
  node.name = name;
  const label = elementLabelNode(node, type);
  if (label?.type === "TEXT") label.characters = name;
}

export function renderInputPlaceholder(node: FrameNode, placeholder: string) {
  const label = node.children.find(
    (child) => child.getPluginData(PART) === "label",
  );
  if (label?.type === "TEXT") label.characters = placeholder || "Type here...";
}

export function renderButtonVariant(
  node: FrameNode,
  variant: "filled" | "outline",
) {
  const filled = variant === "filled";
  node.fills = [
    {
      type: "SOLID",
      color: filled ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 1, g: 1, b: 1 },
    },
  ];
  const label = node.children.find((child) => child.type === "TEXT");
  if (label?.type === "TEXT")
    label.fills = [
      {
        type: "SOLID",
        color: filled ? { r: 1, g: 1, b: 1 } : { r: 0.15, g: 0.15, b: 0.15 },
      },
    ];
}

export function renderTextSize(
  node: TextNode,
  size: "display" | "title" | "subtitle" | "body" | "caption",
) {
  node.fontSize = TEXT_SIZES[size];
}

// count는 세 블록이 공유하지만 재구성 방식은 서로 달라, element의 다른
// 필드(itemType/cardType/columns)를 그대로 들고 해당 타입의 rebuild를 부른다
export function renderCount(
  node: FrameNode,
  element: Element & { type: "listItem" | "card" | "table" },
) {
  if (element.type === "listItem")
    rebuildListItemRows(
      node,
      element.itemType ?? "basic",
      element.count,
      element.items,
    );
  else if (element.type === "card")
    rebuildCards(
      node,
      element.cardType ?? "basic",
      element.count,
      element.items,
    );
  else
    rebuildTable(
      node,
      element.columns ?? ["Column 1", "Column 2", "Column 3"],
      element.count,
      element.rows,
    );
}

export function renderSectionDirection(
  node: FrameNode,
  direction: "vertical" | "horizontal",
  children: { element: Element; node: BaseNode | null }[],
) {
  const layout = sectionLayout(direction);
  node.layoutMode = layout.layoutMode;
  node.primaryAxisSizingMode = layout.primaryAxisSizingMode;
  node.counterAxisSizingMode = layout.counterAxisSizingMode;
  for (const child of children)
    if (child.node?.type === "FRAME") {
      child.node.layoutSizingHorizontal = "FILL";
      child.node.layoutSizingVertical = "FIXED";
      if (child.element.type === "button" || child.element.type === "input")
        child.node.minHeight = 40;
      if (child.element.type === "image") child.node.minHeight = 160;
    }
}
