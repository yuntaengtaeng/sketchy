import {
  screenEdgeOrder,
  screenEdgePadding,
} from "../../../core/screen-edge-layout.ts";
import type { DomainElement } from "../../../shared";

// insertChild의 self-move index 계산 불안정(제자리 no-op 확인), 대신 순서대로 appendChild 재구성
export function applyOrder(parent: FrameNode, order: SceneNode[]) {
  for (const sibling of order) parent.appendChild(sibling);
}

// Header 맨 앞, Footer 맨 뒤 재배치로 그 사이를 메인 콘텐츠 영역화, 삽입마다 재실행
export function pinHeaderAndFooter(
  parent: FrameNode,
  elements: DomainElement[],
) {
  // Canvas 자식에 연결된 Sketchy Block 타입 조회
  const typeOf = (child: SceneNode) =>
    elements.find(
      (item) => item.id === child.getPluginData("sketchy:element-id"),
    )?.type;
  const children = [...parent.children];
  const order = screenEdgeOrder(children.map(typeOf));
  if (!order) return;
  applyOrder(
    parent,
    order.map((index) => children[index]),
  );
}

// 화면 최상위 Header/Footer의 절대 위치 상하단 고정, 콘텐츠 길이와 무관한 항상 화면 가장자리
export function pinEdgeToScreen(
  node: SceneNode,
  screen: FrameNode,
  edge: "top" | "bottom",
) {
  if (node.type !== "FRAME") return;
  node.layoutPositioning = "ABSOLUTE";
  node.constraints = {
    horizontal: "STRETCH",
    vertical: edge === "top" ? "MIN" : "MAX",
  };
  node.resize(screen.width, node.height);
  node.x = 0;
  node.y = edge === "top" ? 0 : screen.height - node.height;
}

// 화면 최상위 Header/Footer 높이만큼 상하단 패딩 조정, 값 같으면 재기록 생략
export function syncScreenEdgePadding(
  screen: FrameNode,
  elements: DomainElement[],
) {
  const basePadding = screen.paddingLeft;
  // Canvas 자식에 연결된 Sketchy Block 타입 조회
  const typeOf = (child: SceneNode) =>
    elements.find(
      (item) => item.id === child.getPluginData("sketchy:element-id"),
    )?.type;
  const header = screen.children.find((child) => typeOf(child) === "header");
  const footer = screen.children.find((child) => typeOf(child) === "footer");
  const { top: paddingTop, bottom: paddingBottom } = screenEdgePadding({
    base: basePadding,
    headerHeight: header?.height,
    footerHeight: footer?.height,
  });
  if (screen.paddingTop !== paddingTop) screen.paddingTop = paddingTop;
  if (screen.paddingBottom !== paddingBottom)
    screen.paddingBottom = paddingBottom;
}
