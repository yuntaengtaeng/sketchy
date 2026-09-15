import {
  BLOCK_DEFINITIONS,
  canNestSection,
  elementSiblings,
  elementTreeIds,
  type BlockType,
} from "../../../shared";
import type { DomainElement } from "../../../core/project-change.ts";
import {
  normalizeElementOrder,
  readProject,
  saveProject,
} from "../../storage/project";
import { focusNode, id, loadFont } from "./utils";
import {
  createElementNode,
  renderButtonLayout,
  renderButtonVariant,
  renderChecked,
  renderElementName,
  renderInputPlaceholder,
  renderSectionDirection,
  renderSelectDisplayState,
  renderSelectOptions,
  renderTabItems,
  renderTextSize,
} from "./element-render";

export async function insertBlock(
  screenId: string,
  block: BlockType,
  parentElementId?: string,
  buttonVariant: "filled" | "outline" = "filled",
) {
  await loadFont();
  const project = readProject();
  const screen = project.screens.find((item) => item.id === screenId);
  const frame = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!frame || frame.type !== "FRAME")
    throw new Error("Select an existing Sketchy screen.");
  const parentElement = project.elements.find(
    (item) => item.id === parentElementId && item.screenId === screenId,
  );
  const parentNode = parentElement
    ? await figma.getNodeByIdAsync(parentElement.nodeId)
    : frame;
  if (
    parentElement &&
    (parentElement.type !== "section" || parentNode?.type !== "FRAME")
  )
    throw new Error("Select a Sketchy section.");
  if (
    block === "section" &&
    parentElement &&
    !canNestSection(project.elements, parentElement)
  )
    throw new Error("Sections can only be nested one level deep.");
  const elementId = id();
  const base = {
    id: elementId,
    screenId,
    name: BLOCK_DEFINITIONS[block].label,
    parentElementId: parentElement?.id,
  };
  // block별로 필요한 필드가 다른 discriminated union이라, 값을 한 번에 못 채우고
  // block 값을 분기해 그 variant가 실제로 갖는 필드만 채운다
  const element: DomainElement = ((): DomainElement => {
    switch (block) {
      case "button":
        return { ...base, type: block, buttonVariant };
      case "section":
        return { ...base, type: block, direction: "vertical" };
      case "tabs":
        return { ...base, type: block, tabItems: ["Tab 1", "Tab 2"] };
      case "select":
        return {
          ...base,
          type: block,
          options: ["Option 1", "Option 2"],
          displayState: "collapsed",
        };
      default:
        return { ...base, type: block };
    }
  })();
  const node = createElementNode(element, parentNode as FrameNode);
  project.elements.push({ ...element, nodeId: node.id });
  // 새 Element는 order가 비어있어 그대로 저장하면 뒤이은 sync의 cleanProject가
  // order 정규화만으로 또 revision을 올려, 추가 한 번이 push 두 번(선행 409 포함)을
  // 만든다. 저장 전에 미리 정규화해 이 revision을 하나로 합친다
  await normalizeElementOrder(project);
  saveProject(project);
  figma.currentPage.selection = [parentNode as FrameNode];
  return project;
}

// order는 figma 시각 위치에서 자동 계산되므로(normalizeElementOrder) 노드
// 트리에서 실제 위치만 바꾸면 다음 sync에서 order가 알아서 따라온다
// 형제 판정은 실제 Figma 자식 배열(시각적 진실)을 기준으로 하고, model의
// order 필드(오래됐을 수 있음)는 어떤 요소들이 형제인지 판단할 때만 쓴다
export async function moveElement(elementId: string, direction: "up" | "down") {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  if (!element) return project;
  const node = await figma.getNodeByIdAsync(element.nodeId);
  if (!node || !("parent" in node) || node.parent?.type !== "FRAME")
    return project;
  const parent = node.parent;
  const siblingElementIds = new Set(
    elementSiblings(project.elements, element).map((item) => item.id),
  );
  const visualSiblings = parent.children.filter((child) =>
    siblingElementIds.has(child.getPluginData("sketchy:element-id")),
  );
  const index = visualSiblings.indexOf(node as SceneNode);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= visualSiblings.length)
    return project;
  const reordered = [...visualSiblings];
  [reordered[index], reordered[swapIndex]] = [
    reordered[swapIndex],
    reordered[index],
  ];
  // insertChild의 self-move index 계산이 믿을 수 없어(제자리 no-op 확인됨),
  // 대신 원하는 최종 순서대로 appendChild를 반복해 끝에서부터 다시 쌓는다
  for (const sibling of reordered) parent.appendChild(sibling);
  return project;
}

export async function updateElement(
  elementId: string,
  name: string,
  description: string,
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || !node) return project;
  element.name = name;
  element.description = description;
  const features = project.features.filter(
    (item) => item.trigger?.elementId === elementId,
  );
  for (const feature of features) {
    feature.name = name;
  }
  node.name = name;
  await loadFont();
  renderElementName(node as SceneNode, element, name);
  saveProject(project);
  return project;
}

export async function deleteElement(elementId: string) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  if (!element) return project;
  if (element.role === "popup")
    throw new Error("The popup itself is required.");
  const node = await figma.getNodeByIdAsync(element.nodeId);
  node?.remove();
  const removed = elementTreeIds(project.elements, elementId);
  project.elements = project.elements.filter((item) => !removed.has(item.id));
  project.features = project.features.filter(
    (item) => !item.trigger?.elementId || !removed.has(item.trigger.elementId),
  );
  saveProject(project);
  return project;
}

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
  if (!element || element.type !== "section" || node?.type !== "FRAME")
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

export async function setButtonLayout(
  elementId: string,
  layout: "stretch" | "start" | "center" | "end",
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!element || element.type !== "button" || node?.type !== "FRAME")
    return project;
  element.layout = layout;
  renderButtonLayout(node, layout);
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
  renderTabItems(node, items);
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

export async function selectElement(elementId: string) {
  const element = readProject().elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!node || !("visible" in node)) return;
  await focusNode(node);
}
