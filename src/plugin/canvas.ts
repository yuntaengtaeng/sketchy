import type { BlockType } from "../shared";
import { readProject, saveProject } from "./project";

const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const loadFont = () =>
  figma.loadFontAsync({ family: "Inter", style: "Regular" });

export async function createScreen(name: string) {
  await loadFont();
  const project = readProject();
  const frame = figma.createFrame();
  const screenId = id();
  frame.name = name || `Screen ${project.screens.length + 1}`;
  frame.resize(320, 568);
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = frame.counterAxisSizingMode = "FIXED";
  frame.itemSpacing = 16;
  frame.paddingTop =
    frame.paddingRight =
    frame.paddingBottom =
    frame.paddingLeft =
      24;
  frame.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.97, b: 0.95 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.25, g: 0.25, b: 0.25 } }];
  frame.setPluginData("sketchy:type", "screen");
  frame.setPluginData("sketchy:screen-id", screenId);
  frame.x = project.screens.length * 560;
  project.screens.push({
    id: screenId,
    nodeId: frame.id,
    name: frame.name,
    purpose: "",
  });
  saveProject(project);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
  return project;
}

export async function insertBlock(screenId: string, block: BlockType) {
  await loadFont();
  const project = readProject();
  const screen = project.screens.find((item) => item.id === screenId);
  const frame = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!frame || frame.type !== "FRAME")
    throw new Error("Select an existing Sketchy screen.");
  const elementId = id();
  const node = block === "text" ? figma.createText() : figma.createFrame();
  node.name = block[0].toUpperCase() + block.slice(1);
  if (node.type === "TEXT") {
    node.characters = "Text";
    node.fontSize = 16;
  } else {
    node.resize(272, 40);
    node.layoutMode = "HORIZONTAL";
    node.primaryAxisAlignItems = "CENTER";
    node.counterAxisAlignItems = block === "button" ? "CENTER" : "MIN";
    node.paddingLeft = node.paddingRight = 12;
    node.cornerRadius = 4;
    node.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
    node.fills = [
      {
        type: "SOLID",
        color:
          block === "button"
            ? { r: 0.15, g: 0.15, b: 0.15 }
            : { r: 1, g: 1, b: 1 },
      },
    ];
    const label = figma.createText();
    label.characters = block === "button" ? "Button" : "Input";
    label.fontSize = 14;
    label.fills = [
      {
        type: "SOLID",
        color:
          block === "button"
            ? { r: 1, g: 1, b: 1 }
            : { r: 0.35, g: 0.35, b: 0.35 },
      },
    ];
    node.appendChild(label);
  }
  node.setPluginData("sketchy:type", "element");
  node.setPluginData("sketchy:screen-id", screenId);
  node.setPluginData("sketchy:element-id", elementId);
  frame.appendChild(node);
  project.elements.push({
    id: elementId,
    nodeId: node.id,
    screenId,
    name: node.name,
    type: block,
  });
  saveProject(project);
  figma.currentPage.selection = [node];
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
  node.name = name;
  await loadFont();
  if (node.type === "TEXT") node.characters = name;
  if (node.type === "FRAME") {
    const label = node.children.find((child) => child.type === "TEXT");
    if (label?.type === "TEXT") label.characters = name;
  }
  saveProject(project);
  return project;
}

export async function updateScreen(
  screenId: string,
  name: string,
  purpose: string,
) {
  const project = readProject();
  const screen = project.screens.find((item) => item.id === screenId);
  const node = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!screen || node?.type !== "FRAME") return project;
  screen.name = name;
  screen.purpose = purpose;
  node.name = name;
  for (const child of [...node.children])
    if (child.getPluginData("sketchy:role").startsWith("screen-"))
      child.remove();
  saveProject(project);
  return project;
}

export async function createInteraction(
  sourceElementId: string,
  destinationScreenId: string,
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === sourceElementId);
  const destination = project.screens.find(
    (item) => item.id === destinationScreenId,
  );
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    element.type !== "button" ||
    !source ||
    !("setReactionsAsync" in source) ||
    !destination
  )
    throw new Error("Select a Sketchy button and destination screen.");
  await source.setReactionsAsync([
    {
      trigger: { type: "ON_CLICK" },
      actions: [
        {
          type: "NODE",
          destinationId: destination.nodeId,
          navigation: "NAVIGATE" as never,
          transition: null,
          preserveScrollPosition: false,
        },
      ],
    },
  ]);
  project.interactions = project.interactions.filter(
    (item) => item.sourceElementId !== sourceElementId,
  );
  project.interactions.push({ id: id(), sourceElementId, destinationScreenId });
  saveProject(project);
  return project;
}

export async function selectScreen(screenId: string) {
  const screen = readProject().screens.find((item) => item.id === screenId);
  const node = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!node || !("visible" in node)) return;
  if (node.parent?.type === "PAGE")
    await figma.setCurrentPageAsync(node.parent);
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}
