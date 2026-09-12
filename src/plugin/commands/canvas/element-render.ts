import {
  BLOCK_DEFINITIONS,
  sectionLayout,
  type Element,
} from "../../../shared";

export function createElementNode(
  element: Omit<Element, "nodeId">,
  parent: FrameNode,
) {
  const node =
    element.type === "text" ? figma.createText() : figma.createFrame();
  node.name = element.name;
  if (node.type === "TEXT") {
    node.characters = element.name;
    node.fontSize = 16;
  } else {
    const isSection = element.type === "section";
    const isImage = element.type === "image";
    const isDivider = element.type === "divider";
    node.resize(272, isSection ? 64 : isImage ? 160 : isDivider ? 1 : 40);
    node.layoutMode = isSection
      ? sectionLayout(element.direction || "vertical").layoutMode
      : "HORIZONTAL";
    node.primaryAxisAlignItems =
      element.type === "button" || isImage ? "CENTER" : "MIN";
    node.counterAxisAlignItems =
      element.type === "button" || element.type === "input" || isImage
        ? "CENTER"
        : "MIN";
    node.itemSpacing = isSection ? 12 : 0;
    node.paddingTop = node.paddingBottom = isSection ? 12 : 0;
    node.paddingLeft = node.paddingRight = isSection
      ? 12
      : element.type === "input" || element.type === "button"
        ? 12
        : 0;
    node.cornerRadius = isDivider ? 0 : 4;
    node.strokes = isSection
      ? [{ type: "SOLID", color: { r: 0.75, g: 0.75, b: 0.75 } }]
      : isImage || element.type === "button" || element.type === "input"
        ? [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }]
        : [];
    if (isSection) node.dashPattern = [4, 4];
    const filledButton =
      element.type === "button" &&
      (element.buttonVariant || "filled") === "filled";
    node.fills = [
      {
        type: "SOLID",
        color:
          isDivider || filledButton
            ? { r: 0.15, g: 0.15, b: 0.15 }
            : isImage
              ? { r: 0.92, g: 0.92, b: 0.9 }
              : { r: 1, g: 1, b: 1 },
      },
    ];
    if (!isDivider && !isSection) {
      const label = figma.createText();
      label.characters = element.name;
      label.fontSize = 14;
      label.fills = [
        {
          type: "SOLID",
          color: filledButton
            ? { r: 1, g: 1, b: 1 }
            : { r: 0.35, g: 0.35, b: 0.35 },
        },
      ];
      node.appendChild(label);
    }
    if (isSection) {
      const layout = sectionLayout(element.direction || "vertical");
      node.primaryAxisSizingMode = layout.primaryAxisSizingMode;
      node.counterAxisSizingMode = layout.counterAxisSizingMode;
    }
    if (element.type === "button" || element.type === "input")
      node.minHeight = 40;
    if (isImage) node.minHeight = 160;
  }
  node.setPluginData("sketchy:type", "element");
  node.setPluginData("sketchy:screen-id", element.screenId);
  node.setPluginData("sketchy:element-id", element.id);
  parent.appendChild(node);
  if (node.type === "FRAME") node.layoutSizingHorizontal = "FILL";
  return node;
}

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
