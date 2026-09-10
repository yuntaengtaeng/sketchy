type BlockDefinition = {
  label: string;
  canAddToSection: boolean;
  triggers: FeatureTrigger["type"][];
};

export const BLOCK_DEFINITIONS = {
  text: { label: "Text", canAddToSection: true, triggers: [] },
  button: { label: "Button", canAddToSection: true, triggers: ["click"] },
  input: { label: "Input", canAddToSection: true, triggers: [] },
  image: { label: "Image", canAddToSection: true, triggers: [] },
  divider: { label: "Divider", canAddToSection: true, triggers: [] },
  section: { label: "Section", canAddToSection: false, triggers: [] },
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

export type Element = {
  id: string;
  nodeId: string;
  screenId: string;
  name: string;
  description?: string;
  type: BlockType;
  parentElementId?: string;
  buttonVariant?: "filled" | "outline";
  direction?: "vertical" | "horizontal";
  role?: "popup";
  order?: number;
};

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

export function elementTreeIds(elements: Element[], rootId: string) {
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
  | { type: "ERROR"; message: string };
