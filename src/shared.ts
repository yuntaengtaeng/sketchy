export type BlockType = "text" | "button" | "input";

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
};

export type Interaction = {
  id: string;
  sourceElementId: string;
  destinationScreenId: string;
};

export type Project = {
  screens: Screen[];
  elements: Element[];
  interactions: Interaction[];
};

export type PluginMessage =
  | { type: "READY" }
  | { type: "CREATE_SCREEN"; name: string }
  | { type: "SELECT_SCREEN"; screenId: string }
  | { type: "UPDATE_SCREEN"; screenId: string; name: string; purpose: string }
  | { type: "INSERT_BLOCK"; screenId: string; block: BlockType }
  | {
      type: "UPDATE_ELEMENT";
      elementId: string;
      name: string;
      description: string;
    }
  | {
      type: "CREATE_INTERACTION";
      sourceElementId: string;
      destinationScreenId: string;
    };

export type UiMessage =
  | {
      type: "STATE";
      project: Project;
      selectedScreenId?: string;
      selectedElementId?: string;
    }
  | { type: "ERROR"; message: string };
