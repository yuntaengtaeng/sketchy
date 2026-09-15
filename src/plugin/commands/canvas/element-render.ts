import { sectionLayout, type Element } from "../../../shared";
import type { DomainElement } from "../../../core/project-change.ts";

// element 내부 구성 요소(체크 표시, 탭 아이템, select 옵션 행 등)를 다시 찾을 때
// 쓰는 키, screen 직계 자식에 쓰는 sketchy:role과 다른 이름공간을 쓴다
const PART = "sketchy:part";

const TEXT_SIZES: Record<
  NonNullable<Extract<Element, { type: "text" }>["textSize"]>,
  number
> = {
  display: 28,
  title: 20,
  subtitle: 16,
  body: 14,
  caption: 12,
};

function createLabel(text: string, fontSize: number, color: RGB) {
  const label = figma.createText();
  label.characters = text;
  label.fontSize = fontSize;
  label.fills = [{ type: "SOLID", color }];
  return label;
}

// Checkbox/Radio/Switch가 공유하는 "표시기 + 라벨" 한 줄 구조
function createToggleRow(
  element: DomainElement & { type: "checkbox" | "radio" | "switch" },
) {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 8;
  row.fills = [];
  const checked = element.checked ?? false;

  const indicator = figma.createFrame();
  indicator.setPluginData(PART, "indicator");
  indicator.strokes = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
  indicator.strokeWeight = 1.5;

  if (element.type === "switch") {
    indicator.resize(32, 18);
    indicator.cornerRadius = 9;
    indicator.strokes = [];
    indicator.layoutMode = "HORIZONTAL";
    indicator.paddingLeft = indicator.paddingRight = 2;
    indicator.paddingTop = indicator.paddingBottom = 2;
    indicator.primaryAxisAlignItems = checked ? "MAX" : "MIN";
    indicator.fills = [
      {
        type: "SOLID",
        color: checked
          ? { r: 0.15, g: 0.15, b: 0.15 }
          : { r: 0.8, g: 0.8, b: 0.8 },
      },
    ];
    const knob = figma.createFrame();
    knob.setPluginData(PART, "knob");
    knob.resize(14, 14);
    knob.cornerRadius = 7;
    knob.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    indicator.appendChild(knob);
  } else {
    indicator.resize(20, 20);
    indicator.cornerRadius = element.type === "radio" ? 10 : 4;
    indicator.fills = [
      {
        type: "SOLID",
        color: checked ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 1, g: 1, b: 1 },
      },
    ];
    if (element.type === "checkbox") {
      const check = createLabel("✓", 13, { r: 1, g: 1, b: 1 });
      check.setPluginData(PART, "check-glyph");
      check.visible = checked;
      indicator.layoutMode = "HORIZONTAL";
      indicator.primaryAxisAlignItems = "CENTER";
      indicator.counterAxisAlignItems = "CENTER";
      indicator.appendChild(check);
    } else {
      const dot = figma.createFrame();
      dot.setPluginData(PART, "radio-dot");
      dot.resize(10, 10);
      dot.cornerRadius = 5;
      dot.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      dot.visible = checked;
      indicator.layoutMode = "HORIZONTAL";
      indicator.primaryAxisAlignItems = "CENTER";
      indicator.counterAxisAlignItems = "CENTER";
      indicator.appendChild(dot);
    }
  }

  const label = createLabel(element.name, 14, { r: 0.15, g: 0.15, b: 0.15 });
  label.setPluginData(PART, "label");
  row.appendChild(indicator);
  row.appendChild(label);
  return row;
}

// Tabs, Select의 옵션 목록이 공유하는 "문자열 배열 → 자식 노드 목록" 재구성
function rebuildStringList(
  container: FrameNode,
  items: string[],
  part: string,
  build: (text: string) => SceneNode,
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === part) child.remove();
  for (const item of items) {
    const node = build(item);
    node.setPluginData(PART, part);
    container.appendChild(node);
  }
}

function createTabsNode(element: DomainElement & { type: "tabs" }) {
  const row = figma.createFrame();
  row.layoutMode = "HORIZONTAL";
  row.strokes = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
  row.strokeWeight = 1;
  row.cornerRadius = 4;
  row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  rebuildStringList(
    row,
    element.tabItems ?? ["Tab 1", "Tab 2"],
    "tab-item",
    (label) => {
      const tab = figma.createFrame();
      tab.layoutMode = "HORIZONTAL";
      tab.primaryAxisAlignItems = "CENTER";
      tab.counterAxisAlignItems = "CENTER";
      tab.paddingLeft = tab.paddingRight = 12;
      tab.paddingTop = tab.paddingBottom = 8;
      tab.fills = [];
      tab.appendChild(createLabel(label, 12, { r: 0.15, g: 0.15, b: 0.15 }));
      return tab;
    },
  );
  return row;
}

function createOptionsListNode(options: string[]) {
  const list = figma.createFrame();
  list.setPluginData(PART, "select-options");
  list.layoutMode = "VERTICAL";
  list.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  list.strokeWeight = 1;
  list.cornerRadius = 4;
  list.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  list.layoutSizingHorizontal = "FILL";
  rebuildStringList(list, options, "select-option", (label) => {
    const row = figma.createFrame();
    row.layoutSizingHorizontal = "FILL";
    row.paddingLeft = row.paddingRight = 10;
    row.paddingTop = row.paddingBottom = 8;
    row.fills = [];
    row.appendChild(createLabel(label, 12, { r: 0.25, g: 0.25, b: 0.25 }));
    return row;
  });
  return list;
}

function createSelectNode(element: DomainElement & { type: "select" }) {
  const wrap = figma.createFrame();
  wrap.layoutMode = "VERTICAL";
  wrap.fills = [];
  wrap.itemSpacing = 4;

  const closedRow = figma.createFrame();
  closedRow.setPluginData(PART, "select-row");
  closedRow.layoutMode = "HORIZONTAL";
  closedRow.primaryAxisAlignItems = "MIN";
  closedRow.counterAxisAlignItems = "CENTER";
  closedRow.layoutSizingHorizontal = "FILL";
  closedRow.paddingLeft = closedRow.paddingRight = 10;
  closedRow.paddingTop = closedRow.paddingBottom = 8;
  closedRow.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  closedRow.strokeWeight = 1;
  closedRow.cornerRadius = 4;
  closedRow.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  const firstOption = element.options?.[0] ?? "Select";
  const optionLabel = createLabel(firstOption, 12, {
    r: 0.35,
    g: 0.35,
    b: 0.35,
  });
  optionLabel.layoutSizingHorizontal = "FILL";
  const chevron = createLabel("▾", 12, { r: 0.35, g: 0.35, b: 0.35 });
  closedRow.appendChild(optionLabel);
  closedRow.appendChild(chevron);
  wrap.appendChild(closedRow);

  if ((element.displayState ?? "collapsed") === "expanded")
    wrap.appendChild(createOptionsListNode(element.options ?? []));

  return wrap;
}

export function createElementNode(element: DomainElement, parent: FrameNode) {
  const node =
    element.type === "text" ? figma.createText() : createFrameFor(element);
  node.name = element.name;
  if (element.type === "text" && node.type === "TEXT") {
    node.characters = element.name;
    node.fontSize = TEXT_SIZES[element.textSize ?? "body"];
  }
  node.setPluginData("sketchy:type", "element");
  node.setPluginData("sketchy:screen-id", element.screenId);
  node.setPluginData("sketchy:element-id", element.id);
  parent.appendChild(node);
  if (node.type === "FRAME") node.layoutSizingHorizontal = "FILL";
  return node;
}

// text를 제외한 나머지는 전부 FRAME, 타입별 전용 구조가 있으면 그걸 쓰고
// 없으면 (input/image/divider/section/tableRow/navigation/search/listItem/card)
// 기존에 쓰던 공용 "테두리 있는 한 줄 + 라벨" 모양을 그대로 쓴다
function createFrameFor(element: DomainElement) {
  if (
    element.type === "checkbox" ||
    element.type === "radio" ||
    element.type === "switch"
  )
    return createToggleRow(element);
  if (element.type === "tabs") return createTabsNode(element);
  if (element.type === "select") return createSelectNode(element);
  return createGenericFrame(element);
}

function createGenericFrame(element: DomainElement) {
  const node = figma.createFrame();
  const isSection = element.type === "section";
  const isImage = element.type === "image";
  const isDivider = element.type === "divider";
  const isBorderedPlaceholder =
    element.type === "listItem" ||
    element.type === "card" ||
    element.type === "tableRow" ||
    element.type === "navigation" ||
    element.type === "search";
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
    : element.type === "input" ||
        element.type === "button" ||
        isBorderedPlaceholder
      ? 12
      : 0;
  node.cornerRadius = isDivider ? 0 : 4;
  node.strokes = isSection
    ? [{ type: "SOLID", color: { r: 0.75, g: 0.75, b: 0.75 } }]
    : isImage ||
        element.type === "button" ||
        element.type === "input" ||
        isBorderedPlaceholder
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
    const label = createLabel(
      element.name,
      14,
      filledButton ? { r: 1, g: 1, b: 1 } : { r: 0.35, g: 0.35, b: 0.35 },
    );
    label.setPluginData(PART, "label");
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
  return node;
}

export function renderElementName(
  node: SceneNode,
  element: Element,
  name: string,
) {
  node.name = name;
  if (node.type === "TEXT") node.characters = name;
  if (node.type === "FRAME") {
    const label =
      node.children.find((child) => child.getPluginData(PART) === "label") ??
      node.children.find((child) => child.type === "TEXT");
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

// stretch는 부모 폭을 채우고, 나머지는 내용 크기로 줄어든 뒤 교차축(세로 부모
// 기준 가로 위치)만 개별 정렬한다, 가로 Section 안에서는 주축이라 적용되지 않음
export function renderButtonLayout(
  node: FrameNode,
  layout: "stretch" | "start" | "center" | "end",
) {
  if (layout === "stretch") {
    node.layoutSizingHorizontal = "FILL";
    return;
  }
  node.layoutSizingHorizontal = "HUG";
  node.layoutAlign =
    layout === "start" ? "MIN" : layout === "center" ? "CENTER" : "MAX";
}

export function renderTextSize(
  node: TextNode,
  size: "display" | "title" | "subtitle" | "body" | "caption",
) {
  node.fontSize = TEXT_SIZES[size];
}

export function renderChecked(
  node: FrameNode,
  type: "checkbox" | "radio" | "switch",
  checked: boolean,
) {
  const indicator = node.children.find(
    (child) => child.getPluginData(PART) === "indicator",
  );
  if (indicator?.type !== "FRAME") return;
  if (type === "switch") {
    indicator.primaryAxisAlignItems = checked ? "MAX" : "MIN";
    indicator.fills = [
      {
        type: "SOLID",
        color: checked
          ? { r: 0.15, g: 0.15, b: 0.15 }
          : { r: 0.8, g: 0.8, b: 0.8 },
      },
    ];
    return;
  }
  indicator.fills = [
    {
      type: "SOLID",
      color: checked ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 1, g: 1, b: 1 },
    },
  ];
  const part = type === "checkbox" ? "check-glyph" : "radio-dot";
  const mark = indicator.children.find(
    (child) => child.getPluginData(PART) === part,
  );
  if (mark) mark.visible = checked;
}

export function renderTabItems(node: FrameNode, items: string[]) {
  rebuildStringList(node, items, "tab-item", (label) => {
    const tab = figma.createFrame();
    tab.layoutMode = "HORIZONTAL";
    tab.primaryAxisAlignItems = "CENTER";
    tab.counterAxisAlignItems = "CENTER";
    tab.paddingLeft = tab.paddingRight = 12;
    tab.paddingTop = tab.paddingBottom = 8;
    tab.fills = [];
    tab.appendChild(createLabel(label, 12, { r: 0.15, g: 0.15, b: 0.15 }));
    return tab;
  });
}

function selectRow(node: FrameNode) {
  return node.children.find(
    (child) => child.getPluginData(PART) === "select-row",
  );
}

export function renderSelectOptions(node: FrameNode, options: string[]) {
  const row = selectRow(node);
  if (row?.type === "FRAME") {
    const label = row.children.find((child) => child.type === "TEXT");
    if (label?.type === "TEXT") label.characters = options[0] ?? "Select";
  }
  const list = node.children.find(
    (child) => child.getPluginData(PART) === "select-options",
  );
  if (list?.type === "FRAME") rebuildOptionsList(list, options);
}

function rebuildOptionsList(list: FrameNode, options: string[]) {
  rebuildStringList(list, options, "select-option", (label) => {
    const row = figma.createFrame();
    row.layoutSizingHorizontal = "FILL";
    row.paddingLeft = row.paddingRight = 10;
    row.paddingTop = row.paddingBottom = 8;
    row.fills = [];
    row.appendChild(createLabel(label, 12, { r: 0.25, g: 0.25, b: 0.25 }));
    return row;
  });
}

export function renderSelectDisplayState(
  node: FrameNode,
  displayState: "collapsed" | "expanded",
  options: string[],
) {
  const existing = node.children.find(
    (child) => child.getPluginData(PART) === "select-options",
  );
  if (displayState === "expanded") {
    if (!existing) node.appendChild(createOptionsListNode(options));
  } else {
    existing?.remove();
  }
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
      // Button이 stretch가 아닌 layout을 골랐으면 그 정렬을 존중하고, 그 외엔
      // 기존처럼 항상 FILL
      const keepsOwnLayout =
        child.element.type === "button" &&
        !!child.element.layout &&
        child.element.layout !== "stretch";
      if (!keepsOwnLayout) child.node.layoutSizingHorizontal = "FILL";
      child.node.layoutSizingVertical = "FIXED";
      if (child.element.type === "button" || child.element.type === "input")
        child.node.minHeight = 40;
      if (child.element.type === "image") child.node.minHeight = 160;
    }
}
