import {
  projectWithoutScreen,
  SCREEN_PRESETS,
  type Project,
  type Screen,
} from "../../../shared";
import { nextScreenPosition } from "../../screen-position";
import { readProject, saveProject } from "../../storage/project";
import { updateNavigation } from "../sync-prototype";
import { cloneScreenContents } from "./screen-clone";
import { focusNode, id, loadFont } from "./utils";

export async function createScreen(name: string) {
  await loadFont();
  const project = readProject();
  const frame = figma.createFrame();
  const screenId = id();
  const preset = SCREEN_PRESETS[project.settings.screenPreset];
  frame.name =
    name ||
    `Screen ${project.screens.filter((screen) => !screen.kind).length + 1}`;
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
      project.screens
        .filter((screen) => !screen.kind)
        .map((screen) => figma.getNodeByIdAsync(screen.nodeId)),
    )
  ).filter(
    (node): node is FrameNode =>
      node?.type === "FRAME" && node.parent === figma.currentPage,
  );
  const position = nextScreenPosition(figma.viewport.center, preset, existing);
  frame.x = position.x;
  frame.y = position.y;
  project.screens.push({
    id: screenId,
    nodeId: frame.id,
    name: frame.name,
    purpose: "",
  });
  saveProject(project);
  await focusNode(frame);
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

export async function duplicateScreen(screenId: string) {
  const project = readProject();
  const screen = project.screens.find((item) => item.id === screenId);
  const source = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!screen || source?.type !== "FRAME")
    throw new Error("Select an existing Sketchy screen.");

  const existing = (
    await Promise.all(
      project.screens
        .filter((item) => item.kind === screen.kind)
        .map((item) => figma.getNodeByIdAsync(item.nodeId)),
    )
  ).filter(
    (node): node is FrameNode =>
      node?.type === "FRAME" && node.parent === figma.currentPage,
  );
  const duplicateScreenId = id();
  const { frame, elements } = await cloneScreenContents(
    project,
    screenId,
    duplicateScreenId,
    source,
  );
  frame.name = `${screen.name} copy`;
  const position = nextScreenPosition(figma.viewport.center, frame, existing);
  frame.x = position.x;
  frame.y = position.y;

  project.screens.push({
    ...screen,
    id: duplicateScreenId,
    nodeId: frame.id,
    name: frame.name,
  });
  project.elements.push(...elements);
  saveProject(project);
  await focusNode(frame);
  return project;
}

export async function createOverlayScreen(
  project: Project,
  baseScreenId: string,
): Promise<{ screen: Screen; node: FrameNode }> {
  await loadFont();
  const baseScreen = project.screens.find(
    (screen) => screen.id === baseScreenId && !screen.kind,
  );
  const source =
    baseScreen && (await figma.getNodeByIdAsync(baseScreen.nodeId));
  if (!baseScreen || source?.type !== "FRAME")
    throw new Error("Select an existing Sketchy screen.");

  const number =
    project.screens.filter((screen) => screen.baseScreenId === baseScreenId)
      .length + 1;
  const screenId = id();
  const { frame, elements } = await cloneScreenContents(
    project,
    baseScreenId,
    screenId,
    source,
  );
  frame.name = `${baseScreen.name} · Popup ${number}`;

  const dim = figma.createRectangle();
  dim.name = "Dim";
  dim.resize(frame.width, frame.height);
  dim.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
  dim.opacity = 0.4;
  frame.appendChild(dim);
  dim.layoutPositioning = "ABSOLUTE";
  dim.x = 0;
  dim.y = 0;

  const popup = figma.createFrame();
  popup.name = "Popup";
  popup.resize(Math.min(320, frame.width - 48), 240);
  popup.layoutMode = "VERTICAL";
  popup.primaryAxisSizingMode = popup.counterAxisSizingMode = "FIXED";
  popup.paddingTop =
    popup.paddingRight =
    popup.paddingBottom =
    popup.paddingLeft =
      24;
  popup.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  popup.strokes = [{ type: "SOLID", color: { r: 0.25, g: 0.25, b: 0.25 } }];
  popup.cornerRadius = 8;
  const popupElementId = id();
  popup.setPluginData("sketchy:type", "element");
  popup.setPluginData("sketchy:screen-id", screenId);
  popup.setPluginData("sketchy:element-id", popupElementId);
  frame.appendChild(popup);
  popup.layoutPositioning = "ABSOLUTE";
  popup.x = (frame.width - popup.width) / 2;
  popup.y = (frame.height - popup.height) / 2;

  const elementId = id();
  const text = figma.createText();
  text.name = "Popup";
  text.characters = "Popup";
  text.fontSize = 16;
  text.setPluginData("sketchy:type", "element");
  text.setPluginData("sketchy:screen-id", screenId);
  text.setPluginData("sketchy:element-id", elementId);
  popup.appendChild(text);
  frame.x = source.x + source.width + 120;
  frame.y = source.y + (number - 1) * (source.height + 120);
  const screen = {
    id: screenId,
    nodeId: frame.id,
    name: frame.name,
    purpose: "",
    kind: "popup",
    baseScreenId,
  } satisfies Screen;
  project.screens.push(screen);
  project.elements.push(...elements);
  project.elements.push({
    id: popupElementId,
    nodeId: popup.id,
    screenId,
    name: "Popup",
    type: "section",
    direction: "vertical",
    role: "popup",
  });
  project.elements.push({
    id: elementId,
    nodeId: text.id,
    screenId,
    name: text.characters,
    type: "text",
    parentElementId: popupElementId,
  });
  return { screen, node: frame };
}

export async function deleteScreen(screenId: string) {
  const project = readProject();
  const screen = project.screens.find((item) => item.id === screenId);
  const node = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!screen || node?.type !== "FRAME")
    throw new Error("Select an existing Sketchy screen.");

  const removedScreens = project.screens.filter(
    (item) => item.id === screenId || item.baseScreenId === screenId,
  );
  const removedScreenIds = new Set(removedScreens.map((item) => item.id));
  const incoming = project.features.filter(
    (feature) =>
      "destinationScreenId" in feature.action &&
      !!feature.action.destinationScreenId &&
      removedScreenIds.has(feature.action.destinationScreenId),
  );
  for (const feature of incoming) {
    const destinationScreenId =
      "destinationScreenId" in feature.action
        ? feature.action.destinationScreenId
        : undefined;
    const element = project.elements.find(
      (item) => item.id === feature.trigger?.elementId,
    );
    const source = element && (await figma.getNodeByIdAsync(element.nodeId));
    const destination = project.screens.find(
      (item) => item.id === destinationScreenId,
    );
    if (source && "setReactionsAsync" in source)
      await source.setReactionsAsync(
        updateNavigation(source.reactions, destination?.nodeId),
      );
  }
  for (const removedScreen of removedScreens) {
    const removedNode = await figma.getNodeByIdAsync(removedScreen.nodeId);
    removedNode?.remove();
  }
  const next = projectWithoutScreen(project, screenId);
  saveProject(next);
  return next;
}

export async function selectScreen(screenId: string) {
  const screen = readProject().screens.find((item) => item.id === screenId);
  const node = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!node || !("visible" in node)) return;
  await focusNode(node);
}
