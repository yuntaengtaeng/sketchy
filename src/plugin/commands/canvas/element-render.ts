import { sectionLayout, type Element } from "../../../shared";

export function renderElementName(
  node: SceneNode,
  element: Element,
  name: string,
) {
  node.name = name;
  if (node.type === "TEXT") node.characters = name;
  if (
    node.type === "FRAME" &&
    element.type !== "section" &&
    element.type !== "divider"
  ) {
    const label = node.children.find((child) => child.type === "TEXT");
    if (label?.type === "TEXT") label.characters = name;
  }
}

export function renderButtonVariant(
  node: FrameNode,
  variant: "filled" | "outline",
) {
  const filled = variant === "filled";
  node.fills = [
    {
      type: "SOLID",
      color: filled ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 1, g: 1, b: 1 },
    },
  ];
  const label = node.children.find((child) => child.type === "TEXT");
  if (label?.type === "TEXT")
    label.fills = [
      {
        type: "SOLID",
        color: filled ? { r: 1, g: 1, b: 1 } : { r: 0.15, g: 0.15, b: 0.15 },
      },
    ];
}

export function renderSectionDirection(
  node: FrameNode,
  direction: "vertical" | "horizontal",
  children: { element: Element; node: BaseNode | null }[],
) {
  const layout = sectionLayout(direction);
  node.layoutMode = layout.layoutMode;
  node.primaryAxisSizingMode = layout.primaryAxisSizingMode;
  node.counterAxisSizingMode = layout.counterAxisSizingMode;
  for (const child of children)
    if (child.node?.type === "FRAME") {
      child.node.layoutSizingHorizontal = "FILL";
      child.node.layoutSizingVertical = "FIXED";
      if (child.element.type === "button" || child.element.type === "input")
        child.node.minHeight = 40;
      if (child.element.type === "image") child.node.minHeight = 160;
    }
}
