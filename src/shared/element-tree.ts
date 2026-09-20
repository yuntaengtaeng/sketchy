export type TreeElement = {
  id: string;
  screenId: string;
  type: string;
  parentElementId?: string;
  order?: number;
};

export const MAX_SECTION_DEPTH = 2;
// element-tree는 BlockType에 의존하지 않는 범용 유틸이라 문자열로 직접 나열
const CONTAINER_TYPES = new Set(["section", "header", "footer"]);

// 화면 가장자리에 고정되는 최상위 요소 판정
export function isFixedScreenEdgeElement(element: TreeElement) {
  return (
    !element.parentElementId &&
    (element.type === "header" || element.type === "footer")
  );
}

export function elementAncestors<T extends TreeElement>(
  elements: T[],
  element: T,
) {
  const ancestors: T[] = [];
  const visited = new Set([element.id]);
  let parentId = element.parentElementId;
  while (parentId && !visited.has(parentId)) {
    const parent = elements.find((item) => item.id === parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    visited.add(parent.id);
    parentId = parent.parentElementId;
  }
  return ancestors;
}

export function elementSiblings<T extends TreeElement>(
  elements: T[],
  element: T,
) {
  return elements
    .filter(
      (item) =>
        item.screenId === element.screenId &&
        item.parentElementId === element.parentElementId,
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function elementTreeIds<T extends TreeElement>(
  elements: T[],
  rootId: string,
) {
  const ids = new Set([rootId]);
  for (let changed = true; changed;) {
    changed = false;
    for (const element of elements)
      if (
        element.parentElementId &&
        ids.has(element.parentElementId) &&
        !ids.has(element.id)
      ) {
        ids.add(element.id);
        changed = true;
      }
  }
  return ids;
}

export function canNestSection<T extends TreeElement>(
  elements: T[],
  parent: T,
) {
  const depth =
    elementAncestors(elements, parent).filter((item) =>
      CONTAINER_TYPES.has(item.type),
    ).length + (CONTAINER_TYPES.has(parent.type) ? 1 : 0);
  return depth < MAX_SECTION_DEPTH;
}

// 같은 화면에 같은 블록을 여러 번 추가하면 레이어명/NodeList 표시가 전부
// 동일해 어떤 게 어떤 요소인지 구분할 수 없었다. 화면 안에서 겹치지 않는
// 이름을 골라 "Button", "Button 2", "Button 3"처럼 자동으로 구분되게 한다
export function nextElementName<T extends { screenId: string; name: string }>(
  elements: T[],
  screenId: string,
  label: string,
) {
  const used = new Set(
    elements
      .filter((item) => item.screenId === screenId)
      .map((item) => item.name),
  );
  if (!used.has(label)) return label;
  let index = 2;
  while (used.has(`${label} ${index}`)) index++;
  return `${label} ${index}`;
}
