import {
  BLOCK_DEFINITIONS,
  canNestSection,
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
