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
  // 화면 수만큼 순차 await하면 화면이 많을수록 매번 눈에 띄게 느려지므로 병렬 조회
  const screenNodes = await Promise.all(project.screens.map(screenNode));
  const nodes = new Map<string, FrameNode>();
  project.screens.forEach((screen, index) => {
    const node = screenNodes[index];
    if (node) nodes.set(screen.id, node);
  });
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
      "destinationScreenId" in feature.action &&
      feature.action.destinationScreenId,
  );
  // 조회(느린 부분)만 병렬로 먼저 끝내고, 실제로 선을 그리는 동기 작업은
  // 원래 배열 순서대로 순차 실행해 겹치는 연결선의 Z-order가 실행마다
  // 달라지지 않게 한다
  const sources = await Promise.all(
    links.map((link) => {
      const elementId = link.trigger?.elementId;
      const element = elementId
        ? project.elements.find((item) => item.id === elementId)
        : undefined;
      return element ? figma.getNodeByIdAsync(element.nodeId) : null;
    }),
  );
  links.forEach((link, index) =>
    renderConnector(project, link, links, nodes, sources[index]),
  );
}
