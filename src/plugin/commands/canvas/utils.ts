export const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const loadFont = () =>
  figma.loadFontAsync({ family: "Inter", style: "Regular" });

function pageOf(node: SceneNode) {
  let parent = node.parent;
  while (parent && parent.type !== "PAGE") parent = parent.parent;
  return parent?.type === "PAGE" ? parent : undefined;
}

export async function focusNode(node: SceneNode) {
  const page = pageOf(node);
  if (page && page !== figma.currentPage) await figma.setCurrentPageAsync(page);
  const box = node.absoluteBoundingBox;
  figma.currentPage.selection = [node];
  if (box)
    figma.viewport.center = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
}
