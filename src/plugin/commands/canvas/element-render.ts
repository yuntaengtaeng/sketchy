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

// 새로 만든 auto-layout 컨테이너는 기본값(100x100)이 남지 않도록 항상 자기
// 자식 크기에 맞춰 양쪽 축 모두 hug하게 시작한다, FILL이 필요한 쪽은 이후에
// layoutSizingHorizontal 등으로 덮어쓴다
function hugFrame(mode: "HORIZONTAL" | "VERTICAL") {
  const frame = figma.createFrame();
  frame.layoutMode = mode;
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  return frame;
}

function buildTab(label: string) {
  const tab = hugFrame("HORIZONTAL");
  tab.primaryAxisAlignItems = "CENTER";
  tab.counterAxisAlignItems = "CENTER";
  tab.paddingLeft = tab.paddingRight = 12;
  tab.paddingTop = tab.paddingBottom = 8;
  tab.fills = [];
  tab.appendChild(createLabel(label, 12, { r: 0.15, g: 0.15, b: 0.15 }));
  return tab;
}

function buildOptionRow(label: string) {
  // layoutSizingHorizontal은 auto-layout 부모에 붙은 뒤에만 설정 가능해서
  // 여기서는 못 하고, 실제로 append하는 rebuildStringList가 대신 맡는다
  const row = hugFrame("HORIZONTAL");
  row.paddingLeft = row.paddingRight = 10;
  row.paddingTop = row.paddingBottom = 8;
  row.fills = [];
  row.appendChild(createLabel(label, 12, { r: 0.25, g: 0.25, b: 0.25 }));
  return row;
}

// Checkbox/Radio/Switch가 공유하는 "표시기 + 라벨" 한 줄 구조
function createToggleRow(
  element: DomainElement & { type: "checkbox" | "radio" | "switch" },
) {
  const row = hugFrame("HORIZONTAL");
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

// Tabs, Select의 옵션 목록이 공유하는 "문자열 배열 → 자식 노드 목록" 재구성.
// fillWidth로 넘긴 자식은 append 이후에만 layoutSizingHorizontal을 설정할 수
// 있어서(부모 없이 설정하면 예외) append를 먼저 하고 나서 채운다
function rebuildStringList(
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

function createTabsNode(element: DomainElement & { type: "tabs" }) {
  const row = hugFrame("HORIZONTAL");
  row.strokes = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
  row.strokeWeight = 1;
  row.cornerRadius = 4;
  row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  rebuildStringList(
    row,
    element.tabItems ?? ["Tab 1", "Tab 2"],
    "tab-item",
    buildTab,
  );
  return row;
}

// list를 parent에 먼저 붙인 뒤에만 FILL을 설정할 수 있어 append까지 이
// 함수가 직접 맡는다
function createOptionsListNode(parent: FrameNode, options: string[]) {
  const list = hugFrame("VERTICAL");
  list.setPluginData(PART, "select-options");
  list.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  list.strokeWeight = 1;
  list.cornerRadius = 4;
  list.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  parent.appendChild(list);
  list.layoutSizingHorizontal = "FILL";
  rebuildStringList(list, options, "select-option", buildOptionRow, true);
  return list;
}

function createSelectNode(element: DomainElement & { type: "select" }) {
  const wrap = hugFrame("VERTICAL");
  wrap.fills = [];
  wrap.itemSpacing = 4;

  const closedRow = hugFrame("HORIZONTAL");
  closedRow.setPluginData(PART, "select-row");
  closedRow.primaryAxisAlignItems = "MIN";
  closedRow.counterAxisAlignItems = "CENTER";
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
  const chevron = createLabel("▾", 12, { r: 0.35, g: 0.35, b: 0.35 });
  closedRow.appendChild(optionLabel);
  closedRow.appendChild(chevron);
  wrap.appendChild(closedRow);
  // layoutSizingHorizontal은 이미 auto-layout 부모에 붙은 뒤에만 설정할 수
  // 있다, append 전에 설정하면 Figma가 예외를 던져 삽입 자체가 실패한다
  closedRow.layoutSizingHorizontal = "FILL";
  optionLabel.layoutSizingHorizontal = "FILL";

  if ((element.displayState ?? "collapsed") === "expanded")
    createOptionsListNode(wrap, element.options ?? []);

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

// 돋보기 아이콘, auto-layout 없는 고정 14x14 프레임 안에 원+손잡이를 절대
// 좌표로 배치해 하나의 auto-layout 자식처럼 다룬다
function createSearchIcon() {
  const icon = figma.createFrame();
  icon.resize(14, 14);
  icon.fills = [];
  const circle = figma.createEllipse();
  circle.resize(9, 9);
  circle.x = 0;
  circle.y = 0;
  circle.strokes = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
  circle.strokeWeight = 1.6;
  circle.fills = [];
  const handle = figma.createRectangle();
  handle.resize(1.6, 5);
  handle.x = 9;
  handle.y = 9;
  handle.rotation = -45;
  handle.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
  icon.appendChild(circle);
  icon.appendChild(handle);
  return icon;
}

function createSearchNode() {
  const row = hugFrame("HORIZONTAL");
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 6;
  row.paddingLeft = row.paddingRight = 10;
  row.paddingTop = row.paddingBottom = 8;
  row.cornerRadius = 8;
  row.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  row.strokeWeight = 1;
  row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  const label = createLabel("Search", 13, { r: 0.55, g: 0.55, b: 0.55 });
  label.setPluginData(PART, "label");
  row.appendChild(createSearchIcon());
  row.appendChild(label);
  return row;
}

// 실제로 N개를 따로 추가하는 대신 하나의 List Item/Card/Table Element가
// 내부에 이만큼 반복해 목록/표처럼 보여준다, 너무 커지지 않게 위아래로 막는다
function clampCount(count?: number) {
  return Math.min(6, Math.max(1, Math.round(count ?? 3)));
}

function buildListItemRow(itemType: "basic" | "leading" | "trailing") {
  const row = hugFrame("HORIZONTAL");
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 10;
  row.fills = [];

  // leading은 아이콘이 아니라 Image 블록과 같은 회색 자리, 작게
  if (itemType === "leading") {
    const image = figma.createFrame();
    image.resize(32, 32);
    image.cornerRadius = 4;
    image.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.9 } }];
    row.appendChild(image);
  }

  const textColumn = hugFrame("VERTICAL");
  textColumn.itemSpacing = 2;
  textColumn.fills = [];
  textColumn.appendChild(
    createLabel("Title", 13, { r: 0.15, g: 0.15, b: 0.15 }),
  );
  textColumn.appendChild(
    createLabel("Subtitle", 11, { r: 0.55, g: 0.55, b: 0.55 }),
  );
  row.appendChild(textColumn);
  // FILL은 textColumn이 row에 붙은 뒤에만 설정할 수 있다
  if (itemType === "trailing") textColumn.layoutSizingHorizontal = "FILL";

  if (itemType === "trailing")
    row.appendChild(createLabel("Value", 12, { r: 0.4, g: 0.4, b: 0.4 }));

  return row;
}

function rebuildListItemRows(
  container: FrameNode,
  itemType: "basic" | "leading" | "trailing",
  count?: number,
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === "list-row") child.remove();
  for (let index = 0; index < clampCount(count); index++) {
    const row = buildListItemRow(itemType);
    row.setPluginData(PART, "list-row");
    container.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }
}

function createListItemNode(element: DomainElement & { type: "listItem" }) {
  const list = hugFrame("VERTICAL");
  list.itemSpacing = 10;
  list.fills = [];
  rebuildListItemRows(list, element.itemType ?? "basic", element.count);
  return list;
}

function buildCard(cardType: "basic" | "media" | "stat") {
  const card = hugFrame("VERTICAL");
  card.itemSpacing = 6;
  card.paddingLeft =
    card.paddingRight =
    card.paddingTop =
    card.paddingBottom =
      12;
  card.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  card.strokeWeight = 1;
  card.cornerRadius = 6;
  card.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];

  if (cardType === "media") {
    const image = figma.createFrame();
    image.resize(1, 90);
    image.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.9 } }];
    card.appendChild(image);
    // FILL은 image가 card에 붙은 뒤에만 설정할 수 있다
    image.layoutSizingHorizontal = "FILL";
  }

  if (cardType === "stat") {
    card.counterAxisAlignItems = "CENTER";
    card.appendChild(createLabel("128", 22, { r: 0.15, g: 0.15, b: 0.15 }));
    card.appendChild(createLabel("Label", 12, { r: 0.55, g: 0.55, b: 0.55 }));
    return card;
  }

  card.appendChild(createLabel("Title", 14, { r: 0.15, g: 0.15, b: 0.15 }));
  card.appendChild(
    createLabel("Description", 12, { r: 0.55, g: 0.55, b: 0.55 }),
  );
  return card;
}

function rebuildCards(
  container: FrameNode,
  cardType: "basic" | "media" | "stat",
  count?: number,
) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === "card-item") child.remove();
  for (let index = 0; index < clampCount(count); index++) {
    const card = buildCard(cardType);
    card.setPluginData(PART, "card-item");
    container.appendChild(card);
    card.layoutSizingHorizontal = "FILL";
  }
}

function createCardNode(element: DomainElement & { type: "card" }) {
  const list = hugFrame("VERTICAL");
  list.itemSpacing = 10;
  list.fills = [];
  rebuildCards(list, element.cardType ?? "basic", element.count);
  return list;
}

function buildTableRow(cells: string[], header: boolean) {
  const row = hugFrame("HORIZONTAL");
  row.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  row.strokeWeight = 1;
  row.fills = header
    ? [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.93 } }]
    : [];
  const cellNodes = cells.map((cell) => {
    const cellFrame = hugFrame("HORIZONTAL");
    cellFrame.paddingLeft = cellFrame.paddingRight = 8;
    cellFrame.paddingTop = cellFrame.paddingBottom = 6;
    cellFrame.fills = [];
    cellFrame.appendChild(
      createLabel(
        cell,
        11,
        header ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 0.4, g: 0.4, b: 0.4 },
      ),
    );
    row.appendChild(cellFrame);
    return cellFrame;
  });
  // FILL은 각 cell이 row에 붙은 뒤에만 설정할 수 있다, 컬럼 폭을 균등 분배
  for (const cellFrame of cellNodes) cellFrame.layoutSizingHorizontal = "FILL";
  return row;
}

function rebuildTable(container: FrameNode, columns: string[], count?: number) {
  for (const child of [...container.children])
    if (child.getPluginData(PART) === "table-row") child.remove();
  const header = buildTableRow(columns, true);
  header.setPluginData(PART, "table-row");
  container.appendChild(header);
  header.layoutSizingHorizontal = "FILL";
  for (let index = 0; index < clampCount(count); index++) {
    const row = buildTableRow(
      columns.map(() => "Value"),
      false,
    );
    row.setPluginData(PART, "table-row");
    container.appendChild(row);
    row.layoutSizingHorizontal = "FILL";
  }
}

function createTableNode(element: DomainElement & { type: "table" }) {
  const table = hugFrame("VERTICAL");
  table.fills = [];
  table.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
  table.strokeWeight = 1;
  table.cornerRadius = 4;
  rebuildTable(
    table,
    element.columns ?? ["Column 1", "Column 2", "Column 3"],
    element.count,
  );
  return table;
}

// text를 제외한 나머지는 전부 FRAME, 타입별 전용 구조가 있으면 그걸 쓰고
// 없으면 (input/image/divider/section) 기존에 쓰던 공용 "테두리 있는 한
// 줄 + 라벨" 모양을 그대로 쓴다
function createFrameFor(element: DomainElement) {
  if (
    element.type === "checkbox" ||
    element.type === "radio" ||
    element.type === "switch"
  )
    return createToggleRow(element);
  if (element.type === "tabs") return createTabsNode(element);
  if (element.type === "select") return createSelectNode(element);
  if (element.type === "search") return createSearchNode();
  if (element.type === "listItem") return createListItemNode(element);
  if (element.type === "card") return createCardNode(element);
  if (element.type === "table") return createTableNode(element);
  return createGenericFrame(element);
}

function createGenericFrame(element: DomainElement) {
  const node = figma.createFrame();
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
    // Input은 이름이 아니라 Placeholder를 보여준다, 실제 input의 placeholder
    // 텍스트처럼 옅은 회색으로
    const text =
      element.type === "input"
        ? element.placeholder || "Type here..."
        : element.name;
    const label = createLabel(
      text,
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
  // Input의 화면 상 텍스트는 Placeholder 소유, Name을 바꿔도 덮어쓰지 않는다
  if (node.type === "FRAME" && element.type !== "input") {
    const label =
      node.children.find((child) => child.getPluginData(PART) === "label") ??
      node.children.find((child) => child.type === "TEXT");
    if (label?.type === "TEXT") label.characters = name;
  }
}

export function renderInputPlaceholder(node: FrameNode, placeholder: string) {
  const label = node.children.find(
    (child) => child.getPluginData(PART) === "label",
  );
  if (label?.type === "TEXT") label.characters = placeholder || "Type here...";
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
  // HUG만으로는 생성 때 resize(272, …)로 고정된 너비가 그대로 남는다, 버튼
  // 스스로 라벨 크기에 맞춰 폭을 다시 계산하도록 self-sizing도 AUTO로 바꿔야
  // 실제로 줄어들고, 그래야 정렬(layoutAlign) 차이가 눈에 보인다
  node.primaryAxisSizingMode = "AUTO";
  node.layoutSizingHorizontal = "HUG";
  node.layoutAlign =
    layout === "start" ? "MIN" : layout === "center" ? "CENTER" : "MAX";
  const parent = node.parent;
  console.log("[sketchy button layout]", {
    layout,
    widthAfter: node.width,
    layoutSizingHorizontalAfter: node.layoutSizingHorizontal,
    layoutAlignAfter: node.layoutAlign,
    primaryAxisSizingModeAfter: node.primaryAxisSizingMode,
    parentType: parent?.type,
    parentLayoutMode:
      parent && "layoutMode" in parent ? parent.layoutMode : undefined,
    parentCounterAxisAlignItems:
      parent && "counterAxisAlignItems" in parent
        ? parent.counterAxisAlignItems
        : undefined,
  });
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
  rebuildStringList(node, items, "tab-item", buildTab);
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
  if (list?.type === "FRAME")
    rebuildStringList(list, options, "select-option", buildOptionRow, true);
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
    if (!existing) createOptionsListNode(node, options);
  } else {
    existing?.remove();
  }
}

export function renderListItemType(
  node: FrameNode,
  itemType: "basic" | "leading" | "trailing",
  count?: number,
) {
  rebuildListItemRows(node, itemType, count);
}

export function renderCardType(
  node: FrameNode,
  cardType: "basic" | "media" | "stat",
  count?: number,
) {
  rebuildCards(node, cardType, count);
}

export function renderTableColumns(
  node: FrameNode,
  columns: string[],
  count?: number,
) {
  rebuildTable(node, columns, count);
}

// count는 세 블록이 공유하지만 재구성 방식은 서로 달라, element의 다른
// 필드(itemType/cardType/columns)를 그대로 들고 해당 타입의 rebuild를 부른다
export function renderCount(
  node: FrameNode,
  element: Element & { type: "listItem" | "card" | "table" },
) {
  if (element.type === "listItem")
    rebuildListItemRows(node, element.itemType ?? "basic", element.count);
  else if (element.type === "card")
    rebuildCards(node, element.cardType ?? "basic", element.count);
  else
    rebuildTable(
      node,
      element.columns ?? ["Column 1", "Column 2", "Column 3"],
      element.count,
    );
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
