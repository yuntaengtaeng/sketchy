import { BLOCK_DEFINITIONS, type BlockType } from "../shared/index.ts";

// Element 내부에서 이름을 보여주는 자식을 찾을 때 쓰는 키, screen 직계 자식에
// 쓰는 sketchy:role과 다른 이름공간을 쓴다
export const PART = "sketchy:part";

// BlockType별 nameSlot(shared/index.ts)을 따라 이름을 렌더링/읽는 노드를 찾는다,
// 쓰는 쪽(renderElementName)과 읽는 쪽(elementLabelText)이 항상 이 함수 하나를
// 거치므로 둘이 다른 자리를 보다가 서로 되돌리는 일이 없다
export function elementLabelNode(
  node: BaseNode | null | undefined,
  type: BlockType,
) {
  const slot = BLOCK_DEFINITIONS[type].nameSlot;
  if (slot === "none") return undefined;
  if (slot === "self") return node?.type === "TEXT" ? node : undefined;
  if (node?.type !== "FRAME") return undefined;
  return (
    node.children.find((child) => child.getPluginData(PART) === "label") ??
    node.children.find((child) => child.type === "TEXT")
  );
}

export function elementLabelText(
  node: BaseNode | null | undefined,
  type: BlockType,
) {
  const label = elementLabelNode(node, type);
  return label?.type === "TEXT" ? label.characters : undefined;
}

export function adoptCanvasName(item: { name: string }, canvasName?: string) {
  const name = canvasName?.trim();
  if (!name || name === item.name) return false;
  item.name = name;
  return true;
}
