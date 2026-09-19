type BlockDefinition = {
  label: string;
  canAddToSection: boolean;
  triggers: FeatureTrigger["type"][];
  // Canvas에서 이 BlockType의 이름을 어디로 렌더링/읽는지: self는 Text 노드
  // 자신, label은 "label" part 자식(없으면 첫 TEXT 자식), none은 이름을 보여주는
  // 전용 텍스트가 없어 레이어 이름만 이름을 담는다. 새 BlockType을 추가하면
  // satisfies가 이 필드를 빠뜨릴 수 없게 강제한다
  nameSlot: "self" | "label" | "none";
};

export * from "./element-tree.ts";
export * from "./protocol.ts";

export const BLOCK_DEFINITIONS = {
  text: {
    label: "Text",
    canAddToSection: true,
    triggers: [],
    nameSlot: "self",
  },
  button: {
    label: "Button",
    canAddToSection: true,
    triggers: ["click"],
    nameSlot: "label",
  },
  // Input의 화면 상 텍스트는 Placeholder 소유, 이름을 보여주는 자리가 아니다
  input: {
    label: "Input",
    canAddToSection: true,
    triggers: [],
    nameSlot: "none",
  },
  image: {
    label: "Image",
    canAddToSection: true,
    triggers: [],
    nameSlot: "label",
  },
  divider: {
    label: "Divider",
    canAddToSection: true,
    triggers: [],
    nameSlot: "none",
  },
  section: {
    label: "Section",
    canAddToSection: true,
    triggers: [],
    nameSlot: "none",
  },
  // List Item, Card만 Button처럼 click 트리거를 바로 연결한다, 나머지는 지금은
  // 순수 시각 요소로만 추가하고 트리거는 블록별로 나중에 확장한다
  listItem: {
    label: "List Item",
    canAddToSection: true,
    triggers: ["click"],
    nameSlot: "none",
  },
  card: {
    label: "Card",
    canAddToSection: true,
    triggers: ["click"],
    nameSlot: "none",
  },
  table: {
    label: "Table",
    canAddToSection: true,
    triggers: [],
    nameSlot: "none",
  },
  tabs: {
    label: "Tabs",
    canAddToSection: true,
    triggers: [],
    nameSlot: "none",
  },
  select: {
    label: "Select",
    canAddToSection: true,
    triggers: [],
    nameSlot: "none",
  },
  checkbox: {
    label: "Checkbox",
    canAddToSection: true,
    triggers: [],
    nameSlot: "label",
  },
  radio: {
    label: "Radio",
    canAddToSection: true,
    triggers: [],
    nameSlot: "label",
  },
  switch: {
    label: "Switch",
    canAddToSection: true,
    triggers: [],
    nameSlot: "label",
  },
  search: {
    label: "Search",
    canAddToSection: true,
    triggers: [],
    nameSlot: "label",
  },
} satisfies Record<string, BlockDefinition>;

export type BlockType = keyof typeof BLOCK_DEFINITIONS;

export type Screen = {
  id: string;
  nodeId: string;
  name: string;
  purpose: string;
  kind?: "popup";
  baseScreenId?: string;
};

export type ScreenPreset = "mobile" | "tablet" | "desktop";

export const SCREEN_PRESETS: Record<
  ScreenPreset,
  { label: string; width: number; height: number }
> = {
  mobile: { label: "Mobile", width: 390, height: 844 },
  tablet: { label: "Tablet", width: 768, height: 1024 },
  desktop: { label: "Desktop", width: 1440, height: 1024 },
};

export type ProjectSettings = {
  screenPreset: ScreenPreset;
  // Flow 화면 이동 화살표를 Canvas에 그릴지, 끄면 Figma Prototype 연결
  // (reactions)은 그대로 유지되고 그려지는 안내선만 사라진다
  showFlowArrows: boolean;
};

export type ElementBase = {
  id: string;
  nodeId: string;
  screenId: string;
  name: string;
  description?: string;
  parentElementId?: string;
  role?: "popup";
  order?: number;
};

// 각 trait는 그걸 가진 BlockType의 Element에만 교차시켜 붙인다, 불가능한 조합
// (예: text에 buttonVariant)은 타입 단계에서 아예 만들 수 없게 한다
export type ButtonVariant = { buttonVariant?: "filled" | "outline" };
export type SectionDirection = { direction?: "vertical" | "horizontal" };
// Weight은 Regular로 고정, low-fi 목적상 크기만으로 5단계를 구분한다
export type TextSize = {
  textSize?: "display" | "title" | "subtitle" | "body" | "caption";
};
// Checkbox/Radio/Switch가 공유하는 하나의 boolean, 세 필드로 안 쪼갠다
export type Checked = { checked?: boolean };
// selectedTab은 이 Tabs 인스턴스에서 지금 선택된 것으로 보여줄 탭 이름이다.
// 같은 Tabs를 화면마다 다른 탭이 선택된 상태로 배치해 "탭1 선택 시 화면",
// "탭2 선택 시 화면"을 스크린 단위로 나눠 만들 때 쓴다
export type TabItems = { tabItems?: string[]; selectedTab?: string };
export type SelectOptions = {
  options?: string[];
  displayState?: "collapsed" | "expanded";
};
export type Placeholder = { placeholder?: string };
// List Item, Card, Table이 공유하는 "반복 개수", 실제로 N개를 따로 추가하는
// 대신 하나의 Element가 내부에 N개를 반복해 목록/표처럼 보여준다
export type RepeatCount = { count?: number };
// leading은 아이콘이 아니라 작은 이미지(Image 블록과 같은 회색 자리)를 쓴다
export type ListItemType = { itemType?: "basic" | "leading" | "trailing" };
export type CardType = { cardType?: "basic" | "media" | "stat" };
export type TableColumns = { columns?: string[] };
// Card는 cardType과 무관하게 항상 큰 텍스트 1개 + 작은 텍스트 1개 구조라
// (stat=value/label, basic·media=title/description) 인스턴스당 필드 2개로
// 통일한다, 인덱스가 count보다 모자라면 렌더러가 그 자리만 placeholder를 쓴다
export type CardContent = {
  items?: { primary?: string; secondary?: string }[];
};
// List Item은 basic/leading이 title/subtitle 2개, trailing만 value가 더 붙는다
export type ListItemContent = {
  items?: { title?: string; subtitle?: string; value?: string }[];
};
// Table은 원래 행×열 행렬이라 Card/List Item과 다른 모양 그대로 담는다,
// 억지로 같은 trait로 묶지 않는다
export type TableRows = { rows?: string[][] };

// BlockType별로 반복되는 "ElementBase & {type} & trait들" 조립을 한 곳에 모은다
type ElementVariant<
  T extends BlockType,
  Traits extends object = object,
> = ElementBase & { type: T } & Traits;

export type Element =
  | ElementVariant<"text", TextSize>
  | ElementVariant<"button", ButtonVariant>
  | ElementVariant<"input", Placeholder>
  | ElementVariant<"image">
  | ElementVariant<"divider">
  | ElementVariant<"section", SectionDirection>
  | ElementVariant<"listItem", ListItemType & RepeatCount & ListItemContent>
  | ElementVariant<"card", CardType & RepeatCount & CardContent>
  | ElementVariant<"table", TableColumns & RepeatCount & TableRows>
  | ElementVariant<"tabs", TabItems>
  | ElementVariant<"select", SelectOptions>
  | ElementVariant<"checkbox", Checked>
  | ElementVariant<"radio", Checked>
  | ElementVariant<"switch", Checked>
  | ElementVariant<"search">;

export function duplicateScreenElements(
  elements: Element[],
  screenId: string,
  duplicateScreenId: string,
  nodeIds: Map<string, string>,
  createId: () => string,
) {
  const source = elements.filter((element) => element.screenId === screenId);
  const ids = new Map(source.map((element) => [element.id, createId()]));
  return source.flatMap((element) => {
    const nodeId = nodeIds.get(element.id);
    if (!nodeId) return [];
    return [
      {
        ...element,
        id: ids.get(element.id)!,
        nodeId,
        screenId: duplicateScreenId,
        parentElementId: element.parentElementId
          ? ids.get(element.parentElementId)
          : undefined,
      },
    ];
  });
}

export function sectionLayout(direction: "vertical" | "horizontal") {
  return direction === "vertical"
    ? {
        layoutMode: "VERTICAL" as const,
        primaryAxisSizingMode: "AUTO" as const,
        counterAxisSizingMode: "FIXED" as const,
      }
    : {
        layoutMode: "HORIZONTAL" as const,
        primaryAxisSizingMode: "FIXED" as const,
        counterAxisSizingMode: "AUTO" as const,
      };
}

export type FeatureAction =
  | { type: "navigate"; destinationScreenId?: string }
  | { type: "overlay"; destinationScreenId?: string }
  | { type: "close-overlay" }
  | { type: "describe" };

export type FeatureTrigger =
  | { type: "click"; elementId: string }
  | { type: "change"; elementId: string }
  | { type: "submit"; elementId?: string };

export type Feature = {
  id: string;
  screenId: string;
  name: string;
  condition?: string;
  description?: string;
  trigger?: FeatureTrigger;
  action: FeatureAction;
};

export type Project = {
  settings: ProjectSettings;
  screens: Screen[];
  elements: Element[];
  features: Feature[];
};

type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

export type DomainElement = DistributiveOmit<Element, "nodeId">;

export function projectWithoutScreen(project: Project, screenId: string) {
  const screenIds = new Set(
    project.screens
      .filter(
        (screen) => screen.id === screenId || screen.baseScreenId === screenId,
      )
      .map((screen) => screen.id),
  );
  return {
    ...project,
    screens: project.screens.filter((screen) => !screenIds.has(screen.id)),
    elements: project.elements.filter(
      (element) => !screenIds.has(element.screenId),
    ),
    features: project.features.filter(
      (feature) =>
        !screenIds.has(feature.screenId) &&
        !(
          "destinationScreenId" in feature.action &&
          !!feature.action.destinationScreenId &&
          screenIds.has(feature.action.destinationScreenId)
        ),
    ),
  };
}

export const createEmptyProject = (): Project => ({
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [],
  elements: [],
  features: [],
});
