import {
  BLOCK_DEFINITIONS,
  canNestSection,
  elementSiblings,
  elementTreeIds,
  type BlockType,
  type Element,
} from "../../../shared";
import { readProject, saveProject } from "../../storage/project";
import { focusNode, id, loadFont } from "./utils";
import {
  createElementNode,
  renderButtonVariant,
  renderElementName,
  renderSectionDirection,
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
  const element: Omit<Element, "nodeId"> = {
    id: elementId,
    screenId,
    name: BLOCK_DEFINITIONS[block].label,
    type: block,
    parentElementId: parentElement?.id,
    buttonVariant: block === "button" ? buttonVariant : undefined,
    direction: block === "section" ? "vertical" : undefined,
  };
  const node = createElementNode(element, parentNode as FrameNode);
  project.elements.push({ ...element, nodeId: node.id });
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

export async function selectElement(elementId: string) {
  const element = readProject().elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!node || !("visible" in node)) return;
  await focusNode(node);
}
