export type TreeElement = {
  id: string;
  screenId: string;
  type: string;
  parentElementId?: string;
  order?: number;
};

export const MAX_SECTION_DEPTH = 2;

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

export function canNestSection<T extends TreeElement>(
  elements: T[],
  parent: T,
) {
  const depth =
    elementAncestors(elements, parent).filter((item) => item.type === "section")
      .length + (parent.type === "section" ? 1 : 0);
  return depth < MAX_SECTION_DEPTH;
}
