type BlockDefinition = {
  label: string;
  canAddToSection: boolean;
  triggers: FeatureTrigger["type"][];
};

export * from "./element-tree.ts";

export const BLOCK_DEFINITIONS = {
  text: { label: "Text", canAddToSection: true, triggers: [] },
  button: { label: "Button", canAddToSection: true, triggers: ["click"] },
  input: { label: "Input", canAddToSection: true, triggers: [] },
  image: { label: "Image", canAddToSection: true, triggers: [] },
  divider: { label: "Divider", canAddToSection: true, triggers: [] },
  section: { label: "Section", canAddToSection: true, triggers: [] },
  // List Item, Card만 Button처럼 click 트리거를 바로 연결한다, 나머지는 지금은
  // 순수 시각 요소로만 추가하고 트리거는 블록별로 나중에 확장한다
  listItem: { label: "List Item", canAddToSection: true, triggers: ["click"] },
  card: { label: "Card", canAddToSection: true, triggers: ["click"] },
  table: { label: "Table", canAddToSection: true, triggers: [] },
  tabs: { label: "Tabs", canAddToSection: true, triggers: [] },
  select: { label: "Select", canAddToSection: true, triggers: [] },
  checkbox: { label: "Checkbox", canAddToSection: true, triggers: [] },
  radio: { label: "Radio", canAddToSection: true, triggers: [] },
  switch: { label: "Switch", canAddToSection: true, triggers: [] },
  search: { label: "Search", canAddToSection: true, triggers: [] },
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

export type ProjectSettings = { screenPreset: ScreenPreset };

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
export type TabItems = { tabItems?: string[] };
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
  | ElementVariant<"listItem", ListItemType & RepeatCount>
  | ElementVariant<"card", CardType & RepeatCount>
  | ElementVariant<"table", TableColumns & RepeatCount>
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

export type SketchyAccount = {
  id: string;
  email: string;
  name?: string;
  pictureUrl?: string;
};

export type AuthSession = {
  token: string;
  user: SketchyAccount;
};

export type AgentConnection = {
  agent: "codex" | "claude-code" | "claude-app";
  setup: string;
};

// Figma Plugin과 서버 사이 자동 동기화 상태
// conflict, auth-expired, unsupported만 사용자 조치 필요
export type SyncStatus =
  "syncing" | "applied" | "conflict" | "auth-expired" | "unsupported";

export type ProjectImportPreview = {
  valid: boolean;
  applied?: boolean;
  requiresExport?: boolean;
  revision?: number;
  summary: string[];
  errors: string[];
  warnings: string[];
};

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
  settings: { screenPreset: "mobile" },
  screens: [],
  elements: [],
  features: [],
});

export type PluginMessage =
  | { type: "READY" }
  | { type: "SAVE_AUTH_SESSION"; session: AuthSession }
  | { type: "SIGN_OUT" }
  | { type: "CONNECT_AGENT"; agent: AgentConnection["agent"] }
  | { type: "EXPORT_PROJECT" }
  | { type: "PREVIEW_PROJECT_IMPORT"; contents: string }
  | { type: "APPLY_PROJECT_IMPORT"; revision: number }
  | { type: "UPDATE_PROJECT_SETTINGS"; settings: ProjectSettings }
  | { type: "CREATE_SCREEN"; name: string }
  | { type: "DUPLICATE_SCREEN"; screenId: string }
  | { type: "DELETE_SCREEN"; screenId: string }
  | { type: "SELECT_SCREEN"; screenId: string }
  | { type: "SELECT_ELEMENT"; elementId: string }
  | { type: "UPDATE_SCREEN"; screenId: string; name: string; purpose: string }
  | {
      type: "INSERT_BLOCK";
      screenId: string;
      block: BlockType;
      parentElementId?: string;
      buttonVariant?: "filled" | "outline";
    }
  | { type: "DELETE_ELEMENT"; elementId: string }
  | { type: "MOVE_ELEMENT"; elementId: string; direction: "up" | "down" }
  | {
      type: "UPDATE_ELEMENT";
      elementId: string;
      name: string;
      description: string;
    }
  | {
      type: "SET_BUTTON_VARIANT";
      elementId: string;
      variant: "filled" | "outline";
    }
  | {
      type: "SET_SECTION_DIRECTION";
      elementId: string;
      direction: "vertical" | "horizontal";
    }
  | {
      type: "SET_TEXT_SIZE";
      elementId: string;
      size: "display" | "title" | "subtitle" | "body" | "caption";
    }
  | { type: "SET_CHECKED"; elementId: string; checked: boolean }
  | { type: "SET_TAB_ITEMS"; elementId: string; items: string[] }
  | { type: "SET_SELECT_OPTIONS"; elementId: string; options: string[] }
  | {
      type: "SET_SELECT_DISPLAY_STATE";
      elementId: string;
      displayState: "collapsed" | "expanded";
    }
  | { type: "SET_INPUT_PLACEHOLDER"; elementId: string; placeholder: string }
  | {
      type: "SET_LIST_ITEM_TYPE";
      elementId: string;
      itemType: "basic" | "leading" | "trailing";
    }
  | {
      type: "SET_CARD_TYPE";
      elementId: string;
      cardType: "basic" | "media" | "stat";
    }
  | { type: "SET_TABLE_COLUMNS"; elementId: string; columns: string[] }
  | { type: "SET_COUNT"; elementId: string; count: number }
  | {
      type: "SAVE_FEATURE";
      sourceElementId: string;
      featureId?: string;
      condition?: string;
      description?: string;
      action:
        | { type: "navigate"; destinationScreenId?: string }
        | { type: "overlay"; destinationScreenId?: string }
        | { type: "close-overlay" }
        | { type: "describe" };
    }
  | { type: "DELETE_FEATURE"; featureId: string };

export type UiMessage =
  | {
      type: "STATE";
      project: Project;
      selectedScreenId?: string;
      selectedElementId?: string;
    }
  | { type: "PROJECT_EXPORT"; fileName: string; contents: string }
  | { type: "AUTH_STATE"; account?: SketchyAccount }
  | { type: "AGENT_CONNECTION"; connection: AgentConnection }
  | { type: "PROJECT_IMPORT_PREVIEW"; preview: ProjectImportPreview }
  | { type: "SYNC_STATUS"; status: SyncStatus }
  | { type: "ERROR"; message: string };
