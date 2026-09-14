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
  // 연결선 개수만큼 순차 await하던 것도 병렬로, 각 호출은 앞부분 조회 하나만
  // await하고 그 뒤로는 동기 그리기라 서로 겹쳐 그릴 위험이 없다
  await Promise.all(
    links.map((link) => renderConnector(project, link, links, nodes)),
  );
}
