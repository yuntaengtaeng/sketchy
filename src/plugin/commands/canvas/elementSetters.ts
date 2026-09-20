import { isContainerElement } from "../../../shared";
import { readProject, saveProject } from "../../storage/project";
import {
  renderButtonVariant,
  renderCardType,
  renderChecked,
  renderCount,
  renderInputPlaceholder,
  renderListItemType,
  renderSectionDirection,
  renderSelectDisplayState,
  renderSelectOptions,
  renderTableColumns,
  renderTabItems,
  renderTextSize,
} from "./element-render";

export async function setButtonVariant(
  elementId: string,
  variant: "filled" | "outline",
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "button" || node?.type !== "FRAME")
    return project;
  element.buttonVariant = variant;
  renderButtonVariant(node, variant);
  saveProject(project);
  return project;
}

export async function setSectionDirection(
  elementId: string,
  direction: "vertical" | "horizontal",
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || !isContainerElement(element) || node?.type !== "FRAME")
    return project;
  element.direction = direction;
  const children = await Promise.all(
    project.elements
      .filter((item) => item.parentElementId === elementId)
      .map(async (item) => ({
        item,
        node: await figma.getNodeByIdAsync(item.nodeId),
      })),
  );
  renderSectionDirection(
    node,
    direction,
    children.map(({ item: element, node: childNode }) => ({
      element,
      node: childNode,
    })),
  );
  saveProject(project);
  return project;
}

export async function setTextSize(
  elementId: string,
  size: "display" | "title" | "subtitle" | "body" | "caption",
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "text" || node?.type !== "TEXT")
    return project;
  element.textSize = size;
  renderTextSize(node, size);
  saveProject(project);
  return project;
}

export async function setChecked(elementId: string, checked: boolean) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    (element.type !== "checkbox" &&
      element.type !== "radio" &&
      element.type !== "switch") ||
    node?.type !== "FRAME"
  )
    return project;
  element.checked = checked;
  renderChecked(node, element.type, checked);
  saveProject(project);
  return project;
}

export async function setTabItems(elementId: string, items: string[]) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "tabs" || node?.type !== "FRAME")
    return project;
  element.tabItems = items;
  if (element.selectedTab && !items.includes(element.selectedTab))
    element.selectedTab = items[0];
  renderTabItems(node, items, element.selectedTab);
  saveProject(project);
  return project;
}

export async function setTabSelection(elementId: string, selectedTab: string) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "tabs" || node?.type !== "FRAME")
    return project;
  element.selectedTab = selectedTab;
  renderTabItems(node, element.tabItems ?? ["Tab 1", "Tab 2"], selectedTab);
  saveProject(project);
  return project;
}

export async function setSelectOptions(elementId: string, options: string[]) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "select" || node?.type !== "FRAME")
    return project;
  element.options = options;
  renderSelectOptions(node, options);
  saveProject(project);
  return project;
}

export async function setSelectDisplayState(
  elementId: string,
  displayState: "collapsed" | "expanded",
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "select" || node?.type !== "FRAME")
    return project;
  element.displayState = displayState;
  renderSelectDisplayState(node, displayState, element.options ?? []);
  saveProject(project);
  return project;
}

export async function setInputPlaceholder(
  elementId: string,
  placeholder: string,
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "input" || node?.type !== "FRAME")
    return project;
  element.placeholder = placeholder;
  renderInputPlaceholder(node, placeholder);
  saveProject(project);
  return project;
}

export async function setListItemType(
  elementId: string,
  itemType: "basic" | "leading" | "trailing",
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "listItem" || node?.type !== "FRAME")
    return project;
  element.itemType = itemType;
  renderListItemType(node, itemType, element.count, element.items);
  saveProject(project);
  return project;
}

export async function setCardType(
  elementId: string,
  cardType: "basic" | "media" | "stat",
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "card" || node?.type !== "FRAME")
    return project;
  element.cardType = cardType;
  renderCardType(node, cardType, element.count, element.items);
  saveProject(project);
  return project;
}

export async function setTableColumns(elementId: string, columns: string[]) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "table" || node?.type !== "FRAME")
    return project;
  element.columns = columns;
  renderTableColumns(node, columns, element.count, element.rows);
  saveProject(project);
  return project;
}

// List Item, Card, Table이 공유하는 반복 개수, 실제 재구성은 각자 다른 필드
// (itemType/cardType/columns)를 들고 render-render.ts의 renderCount가 나눠맡는다
export async function setCount(elementId: string, count: number) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    (element.type !== "listItem" &&
      element.type !== "card" &&
      element.type !== "table") ||
    node?.type !== "FRAME"
  )
    return project;
  element.count = count;
  renderCount(node, element);
  saveProject(project);
  return project;
}

// 모자란 인덱스는 렌더러가 placeholder로 채우므로 배열을 그대로 저장
export async function setCardContent(
  elementId: string,
  items: { primary?: string; secondary?: string }[],
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "card" || node?.type !== "FRAME")
    return project;
  element.items = items;
  renderCardType(node, element.cardType ?? "basic", element.count, items);
  saveProject(project);
  return project;
}

export async function setListItemContent(
  elementId: string,
  items: { title?: string; subtitle?: string; value?: string }[],
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "listItem" || node?.type !== "FRAME")
    return project;
  element.items = items;
  renderListItemType(node, element.itemType ?? "basic", element.count, items);
  saveProject(project);
  return project;
}

export async function setTableRows(elementId: string, rows: string[][]) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "table" || node?.type !== "FRAME")
    return project;
  element.rows = rows;
  renderTableColumns(
    node,
    element.columns ?? ["Column 1", "Column 2", "Column 3"],
    element.count,
    rows,
  );
  saveProject(project);
  return project;
}
