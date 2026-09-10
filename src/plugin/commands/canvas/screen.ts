import {
  duplicateScreenElements,
  projectWithoutScreen,
  SCREEN_PRESETS,
} from "../../../shared";
import { nextScreenPosition } from "../../screen-position";
import { readProject, saveProject } from "../../storage/project";
import { updateNavigation } from "../sync-prototype";
import { focusNode, id, loadFont } from "./utils";

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
      project.screens.map((item) => figma.getNodeByIdAsync(item.nodeId)),
    )
  ).filter(
    (node): node is FrameNode =>
      node?.type === "FRAME" && node.parent === figma.currentPage,
  );
  const frame = source.clone();
  const duplicateScreenId = id();
  frame.name = `${screen.name} copy`;
  frame.setPluginData("sketchy:screen-id", duplicateScreenId);
  const position = nextScreenPosition(figma.viewport.center, frame, existing);
  frame.x = position.x;
  frame.y = position.y;

  const nodes = new Map<string, string>();
  for (const node of frame.findAll()) {
    if ("setReactionsAsync" in node) await node.setReactionsAsync([]);
    const elementId = node.getPluginData("sketchy:element-id");
    if (!elementId) continue;
    nodes.set(elementId, node.id);
    node.setPluginData("sketchy:screen-id", duplicateScreenId);
  }
  const elements = duplicateScreenElements(
    project.elements,
    screenId,
    duplicateScreenId,
    nodes,
    id,
  );
  for (const element of elements) {
    const node = await figma.getNodeByIdAsync(element.nodeId);
    node?.setPluginData("sketchy:element-id", element.id);
  }
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

export async function deleteScreen(screenId: string) {
  const project = readProject();
  const screen = project.screens.find((item) => item.id === screenId);
  const node = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!screen || node?.type !== "FRAME")
    throw new Error("Select an existing Sketchy screen.");

  const incoming = project.features.filter(
    (feature) =>
      feature.action.type === "navigate" &&
      feature.action.destinationScreenId === screenId,
  );
  for (const feature of incoming) {
    const element = project.elements.find(
      (item) => item.id === feature.trigger?.elementId,
    );
    const source = element && (await figma.getNodeByIdAsync(element.nodeId));
    if (source && "setReactionsAsync" in source)
      await source.setReactionsAsync(
        updateNavigation(source.reactions, screen.nodeId),
      );
  }
  node.remove();
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
