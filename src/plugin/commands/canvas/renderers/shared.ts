import type { Element } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";

export const TEXT_SIZES: Record<
  NonNullable<Extract<Element, { type: "text" }>["textSize"]>,
  number
> = {
  display: 28,
  title: 20,
  subtitle: 16,
  body: 14,
  caption: 12,
};

export function createLabel(text: string, fontSize: number, color: RGB) {
  const label = figma.createText();
  label.characters = text;
  label.fontSize = fontSize;
  label.fills = [{ type: "SOLID", color }];
  return label;
}

// 새로 만든 auto-layout 컨테이너는 기본값(100x100)이 남지 않도록 항상 자기
// 자식 크기에 맞춰 양쪽 축 모두 hug하게 시작한다, FILL이 필요한 쪽은 이후에
// layoutSizingHorizontal 등으로 덮어쓴다
export function hugFrame(mode: "HORIZONTAL" | "VERTICAL") {
  const frame = figma.createFrame();
  frame.layoutMode = mode;
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  return frame;
}

// Tabs, Select의 옵션 목록이 공유하는 "문자열 배열 → 자식 노드 목록" 재구성.
// fillWidth로 넘긴 자식은 append 이후에만 layoutSizingHorizontal을 설정할 수
// 있어서(부모 없이 설정하면 예외) append를 먼저 하고 나서 채운다
export function rebuildStringList(
  container: FrameNode,
  items: string[],
  part: string,
  build: (text: string) => SceneNode,
  fillWidth = false,
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === part) child.remove();
  for (const item of items) {
    const node = build(item);
    node.setPluginData(PART, part);
    container.appendChild(node);
    if (fillWidth && "layoutSizingHorizontal" in node)
      node.layoutSizingHorizontal = "FILL";
  }
}

// 실제로 N개를 따로 추가하는 대신 하나의 List Item/Card/Table Element가
// 내부에 이만큼 반복해 목록/표처럼 보여준다, 너무 커지지 않게 위아래로 막는다
export function clampCount(count?: number) {
  return Math.min(6, Math.max(1, Math.round(count ?? 3)));
}
