import type { Project, Screen } from "../../shared";
import { loadFont } from "./canvas";
import { renderConnector } from "./flow/connector";
import { GENERATED } from "./flow/generated";
import { renderPurpose } from "./flow/purpose";

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
    if (!node) continue;
    for (const child of [...node.children])
      if (child.getPluginData("sketchy:role").startsWith("screen-"))
        child.remove();
    renderPurpose(project, screen, node);
  }
  const links = project.features.filter(
    (feature) =>
      feature.action.type === "navigate" && feature.action.destinationScreenId,
  );
  for (const link of links) await renderConnector(project, link, links, nodes);
}
