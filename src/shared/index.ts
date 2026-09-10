export type BlockType =
  "text" | "button" | "input" | "image" | "divider" | "section";

export const BLOCK_TRIGGERS: Record<BlockType, FeatureTrigger["type"][]> = {
  text: [],
  button: ["click"],
  input: [],
  image: [],
  divider: [],
  section: [],
};

export type Screen = {
  id: string;
  nodeId: string;
  name: string;
  purpose: string;
};

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
  order?: number;
};

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

export type ScreenState = {
  id: string;
  screenId: string;
  name: string;
  type: "boolean";
  initialValue: boolean;
};

export type FeatureAction =
  | { type: "navigate"; destinationScreenId?: string }
  | { type: "set-state"; stateId: string; value: boolean };

export type FeatureTrigger =
  | { type: "click"; elementId: string }
  | { type: "change"; elementId: string }
  | { type: "submit"; elementId?: string };

export type Feature = {
  id: string;
  screenId: string;
  name: string;
  description?: string;
  trigger?: FeatureTrigger;
  action: FeatureAction;
};

export type Project = {
  screens: Screen[];
  elements: Element[];
  states: ScreenState[];
  features: Feature[];
};

export type PluginMessage =
  | { type: "READY" }
  | { type: "CREATE_SCREEN"; name: string }
  | { type: "SELECT_SCREEN"; screenId: string }
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
      action:
        | { type: "navigate"; destinationScreenId?: string }
        | { type: "set-state"; stateName: string; value: boolean };
    };

export type UiMessage =
  | {
      type: "STATE";
      project: Project;
      selectedScreenId?: string;
      selectedElementId?: string;
    }
  | { type: "ERROR"; message: string };
