import { duplicateScreenElements, type Project } from "../../../shared";
import { id } from "./utils";

export async function cloneScreenContents(
  project: Project,
  sourceScreenId: string,
  targetScreenId: string,
  source: FrameNode,
) {
  const frame = source.clone();
  frame.setPluginData("sketchy:screen-id", targetScreenId);
  const nodes = new Map<string, string>();
  for (const node of frame.findAll()) {
    if ("setReactionsAsync" in node) await node.setReactionsAsync([]);
    const elementId = node.getPluginData("sketchy:element-id");
    if (!elementId) continue;
    nodes.set(elementId, node.id);
    node.setPluginData("sketchy:screen-id", targetScreenId);
  }
  const elements = duplicateScreenElements(
    project.elements,
    sourceScreenId,
    targetScreenId,
    nodes,
    id,
  );
  for (const element of elements) {
    const node = await figma.getNodeByIdAsync(element.nodeId);
    node?.setPluginData("sketchy:element-id", element.id);
  }
  return { frame, elements };
}
