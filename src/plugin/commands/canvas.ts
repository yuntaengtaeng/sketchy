import { BLOCK_TRIGGERS, type BlockType } from "../../shared";
import { readProject, saveProject } from "../storage/project";
import { updateNavigation } from "./sync-prototype";

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
  if (node.type === "FRAME") node.layoutSizingHorizontal = "FILL";
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
  const feature = project.features.find(
    (item) => item.trigger?.elementId === elementId,
  );
  if (feature) {
    feature.name = name;
    feature.description = description;
    const action = feature.action;
    if (action.type === "set-state") {
      const state = project.states.find((item) => item.id === action.stateId);
      if (state) state.name = name;
    }
  }
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

export async function deleteElement(elementId: string) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === elementId);
  if (!element) return project;
  const node = await figma.getNodeByIdAsync(element.nodeId);
  node?.remove();
  project.elements = project.elements.filter((item) => item.id !== elementId);
  project.features = project.features.map((item) =>
    item.trigger?.elementId === elementId
      ? { ...item, trigger: undefined }
      : item,
  );
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

export async function saveFeature(
  sourceElementId: string,
  input:
    | { type: "navigate"; destinationScreenId?: string }
    | { type: "set-state"; stateName: string; value: boolean },
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === sourceElementId);
  const destination =
    input.type === "navigate"
      ? project.screens.find((item) => item.id === input.destinationScreenId)
      : undefined;
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    !BLOCK_TRIGGERS[element.type].includes("click") ||
    !source ||
    !("setReactionsAsync" in source)
  )
    throw new Error("Select a Sketchy button.");
  if (input.type === "navigate" && input.destinationScreenId && !destination)
    throw new Error("Select an existing destination screen.");
  const previous = project.features.find(
    (item) => item.trigger?.elementId === sourceElementId,
  );
  const previousAction = previous?.action;
  const previousDestination =
    previousAction?.type === "navigate"
      ? project.screens.find(
          (item) => item.id === previousAction.destinationScreenId,
        )
      : undefined;
  const previousState =
    previousAction?.type === "set-state"
      ? project.states.find((item) => item.id === previousAction.stateId)
      : undefined;
  let reactions = updateNavigation(
    source.reactions,
    previousDestination?.nodeId,
  );
  project.features = project.features.filter(
    (item) => item.trigger?.elementId !== sourceElementId,
  );
  if (input.type === "navigate") {
    if (source.type === "FRAME")
      source.children
        .find(
          (child) => child.getPluginData("sketchy:role") === "state-indicator",
        )
        ?.remove();
    await source.setReactionsAsync(
      updateNavigation(reactions, undefined, destination?.nodeId),
    );
    project.features.push({
      id: previous?.id || id(),
      screenId: element.screenId,
      trigger: { type: "click", elementId: sourceElementId },
      name: element.name,
      description: element.description,
      action: {
        type: "navigate",
        destinationScreenId: destination?.id,
      },
    });
  } else if (input.type === "set-state" && input.stateName.trim()) {
    const state = previousState ||
      project.states.find(
        (item) =>
          item.screenId === element.screenId &&
          item.name === input.stateName.trim(),
      ) || {
        id: id(),
        screenId: element.screenId,
        name: input.stateName.trim(),
        type: "boolean" as const,
        initialValue: false,
      };
    state.name = input.stateName.trim();
    if (!project.states.includes(state)) project.states.push(state);
    await source.setReactionsAsync(reactions);
    if (source.type === "FRAME") {
      source.children
        .find(
          (child) => child.getPluginData("sketchy:role") === "state-indicator",
        )
        ?.remove();
    }
    project.features.push({
      id: previous?.id || id(),
      screenId: element.screenId,
      trigger: { type: "click", elementId: sourceElementId },
      name: element.name,
      description: element.description,
      action: { type: "set-state", stateId: state.id, value: input.value },
    });
  } else {
    await source.setReactionsAsync(reactions);
  }
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
