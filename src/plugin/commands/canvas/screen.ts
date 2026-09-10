import { SCREEN_PRESETS } from "../../../shared";
import { nextScreenPosition } from "../../screen-position";
import { readProject, saveProject } from "../../storage/project";
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

export async function selectScreen(screenId: string) {
  const screen = readProject().screens.find((item) => item.id === screenId);
  const node = screen && (await figma.getNodeByIdAsync(screen.nodeId));
  if (!node || !("visible" in node)) return;
  await focusNode(node);
}
