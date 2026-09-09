import type { Project, Screen } from "../../shared";
import { loadFont } from "./canvas";

const GENERATED = "sketchy:flow-generated";
const mark = (node: SceneNode) => node.setPluginData(GENERATED, "true");
function drawLine(
  parent: PageNode,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const line = figma.createLine();
  mark(line);
  parent.appendChild(line);
  line.x = startX;
  line.y = startY;
  line.resize(Math.hypot(endX - startX, endY - startY), 0);
  line.rotation = (-Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;
  line.strokes = [{ type: "SOLID", color: { r: 0.25, g: 0.25, b: 0.25 } }];
  line.strokeWeight = 2;
}
async function screenNode(screen: Screen) {
  const node = await figma.getNodeByIdAsync(screen.nodeId);
  return node?.type === "FRAME" ? node : undefined;
}

export async function renderFlow(project: Project) {
  await loadFont();
  const nodes = new Map<string, FrameNode>();
  for (const screen of project.screens) {
    const node = await screenNode(screen);
    if (node) nodes.set(screen.id, node);
  }
  const pages = new Set(
    [...nodes.values()]
      .map((node) => node.parent)
      .filter((node): node is PageNode => node?.type === "PAGE"),
  );
  for (const page of pages) {
    await page.loadAsync();
    for (const child of [...page.children])
      if (child.getPluginData(GENERATED) === "true") child.remove();
  }
  for (const screen of project.screens) {
    const node = nodes.get(screen.id);
    if (!node || node.parent?.type !== "PAGE") continue;
    for (const child of [...node.children])
      if (child.getPluginData("sketchy:role").startsWith("screen-"))
        child.remove();
    const features = project.features.filter(
      (feature) => feature.screenId === screen.id,
    );
    if (!screen.purpose && !features.length) continue;
    const note = figma.createFrame();
    mark(note);
    node.parent.appendChild(note);
    note.name = `${screen.name} · Purpose`;
    note.x = node.x + node.width + 16;
    note.y = node.y + 12;
    note.resize(220, Math.max(92, 72 + features.length * 32));
    note.layoutMode = "VERTICAL";
    note.primaryAxisSizingMode = note.counterAxisSizingMode = "FIXED";
    note.paddingTop =
      note.paddingRight =
      note.paddingBottom =
      note.paddingLeft =
        14;
    note.itemSpacing = 8;
    note.cornerRadius = 3;
    note.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.94 } }];
    note.strokes = [{ type: "SOLID", color: { r: 0.55, g: 0.55, b: 0.55 } }];
    note.strokeWeight = 1;
    const title = figma.createText();
    title.characters = screen.name;
    title.fontSize = 14;
    note.appendChild(title);
    if (screen.purpose) {
      const purpose = figma.createText();
      purpose.characters = screen.purpose;
      purpose.fontSize = 11;
      purpose.resize(192, 32);
      purpose.opacity = 0.8;
      note.appendChild(purpose);
    }
    for (const feature of features) {
      const behavior = figma.createText();
      const action = feature.action;
      const result =
        action.type === "navigate"
          ? `go to ${project.screens.find((item) => item.id === action.destinationScreenId)?.name || "choose destination"}`
          : feature.description ||
            `${action.value ? "" : "not "}${project.states.find((item) => item.id === action.stateId)?.name || "missing state"}`;
      behavior.characters = `- ${feature.name} click → ${result}`;
      behavior.fontSize = 11;
      behavior.resize(192, 24);
      behavior.textAutoResize = "HEIGHT";
      note.appendChild(behavior);
    }
    note.primaryAxisSizingMode = "AUTO";
  }
  for (const link of project.features) {
    if (link.action.type !== "navigate") continue;
    if (!link.action.destinationScreenId) continue;
    const element = project.elements.find(
      (item) => item.id === link.trigger?.elementId,
    );
    const sourceScreen = element && nodes.get(element.screenId);
    const destination = nodes.get(link.action.destinationScreenId);
    const source = element && (await figma.getNodeByIdAsync(element.nodeId));
    if (
      !element ||
      !sourceScreen ||
      !source ||
      !("absoluteBoundingBox" in source) ||
      !source.absoluteBoundingBox ||
      !destination ||
      !destination.absoluteBoundingBox ||
      sourceScreen.parent !== destination.parent ||
      sourceScreen.parent?.type !== "PAGE"
    )
      continue;
    const from = source.absoluteBoundingBox;
    const to = destination.absoluteBoundingBox;
    const centerDx = to.x + to.width / 2 - (from.x + from.width / 2);
    const centerDy = to.y + to.height / 2 - (from.y + from.height / 2);
    const horizontal = Math.abs(centerDx) >= Math.abs(centerDy);
    const startX = horizontal
        ? centerDx >= 0
          ? from.x + from.width
          : from.x
        : from.x + from.width / 2,
      startY = horizontal
        ? from.y + from.height / 2
        : centerDy >= 0
          ? from.y + from.height
          : from.y,
      endX = horizontal
        ? centerDx >= 0
          ? to.x
          : to.x + to.width
        : to.x + to.width / 2,
      endY = horizontal
        ? to.y + to.height / 2
        : centerDy >= 0
          ? to.y
          : to.y + to.height,
      dx = endX - startX,
      dy = endY - startY;
    drawLine(sourceScreen.parent, startX, startY, endX, endY);
    const angle = Math.atan2(dy, dx);
    for (const offset of [-Math.PI / 6, Math.PI / 6])
      drawLine(
        sourceScreen.parent,
        endX - 10 * Math.cos(angle + offset),
        endY - 10 * Math.sin(angle + offset),
        endX,
        endY,
      );
    const label = figma.createText();
    mark(label);
    sourceScreen.parent.appendChild(label);
    label.characters = link.name;
    label.fontSize = 12;
    label.x = startX + dx / 2 - label.width / 2;
    label.y = startY + dy / 2 - 22;
  }
}
