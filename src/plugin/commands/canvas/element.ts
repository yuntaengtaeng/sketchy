import {
  BLOCK_DEFINITIONS,
  elementTreeIds,
  sectionLayout,
  type BlockType,
} from "../../../shared";
import { readProject, saveProject } from "../../storage/project";
import { focusNode, id, loadFont } from "./utils";

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
  const elementId = id();
  const node = block === "text" ? figma.createText() : figma.createFrame();
  node.name = BLOCK_DEFINITIONS[block].label;
  if (node.type === "TEXT") {
    node.characters = "Text";
    node.fontSize = 16;
  } else {
    const isSection = block === "section";
    const isImage = block === "image";
    const isDivider = block === "divider";
    node.resize(272, isSection ? 64 : isImage ? 160 : isDivider ? 1 : 40);
    node.layoutMode = isSection ? "VERTICAL" : "HORIZONTAL";
    node.primaryAxisAlignItems =
      block === "button" || isImage ? "CENTER" : "MIN";
    node.counterAxisAlignItems =
      block === "button" || block === "input" || isImage ? "CENTER" : "MIN";
    node.itemSpacing = isSection ? 12 : 0;
    node.paddingTop = node.paddingBottom = isSection ? 12 : 0;
    node.paddingLeft = node.paddingRight = isSection
      ? 12
      : block === "input" || block === "button"
        ? 12
        : 0;
    node.cornerRadius = isDivider ? 0 : 4;
    node.strokes = isSection
      ? [{ type: "SOLID", color: { r: 0.75, g: 0.75, b: 0.75 } }]
      : isImage || block === "button" || block === "input"
        ? [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }]
        : [];
    if (isSection) node.dashPattern = [4, 4];
    const filledButton = block === "button" && buttonVariant === "filled";
    node.fills = [
      {
        type: "SOLID",
        color:
          isDivider || filledButton
            ? { r: 0.15, g: 0.15, b: 0.15 }
            : isImage
              ? { r: 0.92, g: 0.92, b: 0.9 }
              : { r: 1, g: 1, b: 1 },
      },
    ];
    if (!isDivider && !isSection) {
      const label = figma.createText();
      label.characters =
        block === "button" ? "Button" : block === "image" ? "Image" : "Input";
      label.fontSize = 14;
      label.fills = [
        {
          type: "SOLID",
          color: filledButton
            ? { r: 1, g: 1, b: 1 }
            : { r: 0.35, g: 0.35, b: 0.35 },
        },
      ];
      node.appendChild(label);
    }
    if (isSection) {
      const layout = sectionLayout("vertical");
      node.primaryAxisSizingMode = layout.primaryAxisSizingMode;
      node.counterAxisSizingMode = layout.counterAxisSizingMode;
    }
    if (block === "button" || block === "input") node.minHeight = 40;
    if (isImage) node.minHeight = 160;
  }
  node.setPluginData("sketchy:type", "element");
  node.setPluginData("sketchy:screen-id", screenId);
  node.setPluginData("sketchy:element-id", elementId);
  (parentNode as FrameNode).appendChild(node);
  if (node.type === "FRAME") node.layoutSizingHorizontal = "FILL";
  project.elements.push({
    id: elementId,
    nodeId: node.id,
    screenId,
    name: node.name,
    type: block,
    parentElementId: parentElement?.id,
    buttonVariant: block === "button" ? buttonVariant : undefined,
    direction: block === "section" ? "vertical" : undefined,
  });
  saveProject(project);
  figma.currentPage.selection = parentElement
    ? [parentNode as FrameNode]
    : [node];
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
  if (node.type === "TEXT") node.characters = name;
  if (
    node.type === "FRAME" &&
    element.type !== "section" &&
    element.type !== "divider"
  ) {
    const label = node.children.find((child) => child.type === "TEXT");
    if (label?.type === "TEXT") label.characters = name;
  }
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
  const layout = sectionLayout(direction);
  node.layoutMode = layout.layoutMode;
  node.primaryAxisSizingMode = layout.primaryAxisSizingMode;
  node.counterAxisSizingMode = layout.counterAxisSizingMode;
  for (const child of children)
    if (child.node?.type === "FRAME") {
      child.node.layoutSizingHorizontal = "FILL";
      child.node.layoutSizingVertical = "FIXED";
      if (child.item.type === "button" || child.item.type === "input")
        child.node.minHeight = 40;
      if (child.item.type === "image") child.node.minHeight = 160;
    }
  saveProject(project);
  return project;
}

export async function selectElement(elementId: string) {
  const element = readProject().elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!node || !("visible" in node)) return;
  await focusNode(node);
}
