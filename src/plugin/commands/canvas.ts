import {
  BLOCK_DEFINITIONS,
  elementTreeIds,
  SCREEN_PRESETS,
  sectionLayout,
  type BlockType,
} from "../../shared";
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
  const preset = SCREEN_PRESETS[project.settings.screenPreset];
  frame.name = name || `Screen ${project.screens.length + 1}`;
  frame.resize(preset.width, preset.height);
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = frame.counterAxisSizingMode = "FIXED";
  frame.itemSpacing = 16;
  frame.paddingTop =
    frame.paddingRight =
    frame.paddingBottom =
    frame.paddingLeft =
      24;
  frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.25, g: 0.25, b: 0.25 } }];
  frame.setPluginData("sketchy:type", "screen");
  frame.setPluginData("sketchy:screen-id", screenId);
  const existing = (
    await Promise.all(
      project.screens.map((screen) => figma.getNodeByIdAsync(screen.nodeId)),
    )
  ).filter(
    (node): node is FrameNode =>
      node?.type === "FRAME" && node.parent === figma.currentPage,
  );
  frame.x = existing.length
    ? Math.max(...existing.map((node) => node.x + node.width)) + 240
    : 0;
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
  const node = await figma.getNodeByIdAsync(element.nodeId);
  node?.remove();
  const removed = elementTreeIds(project.elements, elementId);
  project.elements = project.elements.filter((item) => !removed.has(item.id));
  project.features = project.features.map((item) =>
    item.trigger?.elementId && removed.has(item.trigger.elementId)
      ? { ...item, trigger: undefined }
      : item,
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
    !BLOCK_DEFINITIONS[element.type].triggers.some(
      (trigger) => trigger === "click",
    ) ||
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

export async function selectElement(elementId: string) {
  const element = readProject().elements.find((item) => item.id === elementId);
  const node = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!node || !("visible" in node)) return;
  if (node.parent?.type === "PAGE")
    await figma.setCurrentPageAsync(node.parent);
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}
