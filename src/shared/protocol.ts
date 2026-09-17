import type { BlockType, Project, ProjectSettings } from "./index.ts";

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
  | { type: "SET_TAB_SELECTION"; elementId: string; selectedTab: string }
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
  | { type: "ERROR"; message: string };
