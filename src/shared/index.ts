export type BlockType = "text" | "button" | "input";

export const BLOCK_TRIGGERS: Record<BlockType, FeatureTrigger["type"][]> = {
  text: [],
  button: ["click"],
  input: [],
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
  order?: number;
};

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
  | { type: "INSERT_BLOCK"; screenId: string; block: BlockType }
  | { type: "DELETE_ELEMENT"; elementId: string }
  | {
      type: "UPDATE_ELEMENT";
      elementId: string;
      name: string;
      description: string;
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
