import type {
  Element,
  Feature,
  FeatureAction,
  ProjectSettings,
  Screen,
} from "../shared/index.ts";

export type DomainScreen = Omit<Screen, "nodeId">;
export type DomainElement = Omit<Element, "nodeId">;

export type CanonicalProject = {
  settings: ProjectSettings;
  screens: DomainScreen[];
  elements: DomainElement[];
  features: Feature[];
};

export type FigmaProjection = {
  fileKey: string;
  status: "pending" | "synced" | "failed";
  lastSyncedRevision?: number;
  nodes: Record<string, string>;
  lastError?: string;
};

export type ProjectDocument = {
  id: string;
  revision: number;
  updatedAt: string;
  project: CanonicalProject;
  figmaProjection?: FigmaProjection;
};

type ScreenInput = DomainScreen;
type ScreenPatch = Partial<Pick<DomainScreen, "name" | "purpose">>;
type ElementInput = DomainElement;
type ElementPatch = Partial<
  Pick<DomainElement, "name" | "description" | "buttonVariant" | "direction">
>;

export type FeatureCaseInput = {
  id: string;
  action: FeatureAction;
  condition?: string;
  description?: string;
};

type FeatureCasePatch = Partial<
  Pick<FeatureCaseInput, "action" | "condition" | "description">
>;

export type ProjectionResult = {
  fileKey: string;
  status: FigmaProjection["status"];
  revision: number;
  nodes?: Record<string, string>;
  error?: string;
};

export type ProjectChange =
  | { type: "CREATE_SCREEN"; screen: ScreenInput }
  | { type: "UPDATE_SCREEN"; screenId: string; patch: ScreenPatch }
  | { type: "DELETE_SCREEN"; screenId: string }
  | { type: "ADD_ELEMENT"; element: ElementInput }
  | { type: "UPDATE_ELEMENT"; elementId: string; patch: ElementPatch }
  | { type: "DELETE_ELEMENT"; elementId: string }
  | {
      type: "SET_ELEMENT_ACTION";
      featureId: string;
      elementId: string;
      action: FeatureAction;
      description?: string;
    }
  | {
      type: "ADD_ELEMENT_CASE";
      elementId: string;
      case: FeatureCaseInput;
    }
  | {
      type: "UPDATE_ELEMENT_CASE";
      featureId: string;
      patch: FeatureCasePatch;
    }
  | { type: "REMOVE_ELEMENT_CASE"; featureId: string }
  | { type: "RECORD_FIGMA_PROJECTION"; projection: ProjectionResult };

export type ProjectChangeRequest = {
  projectId: string;
  baseRevision: number;
  idempotencyKey: string;
  changes: ProjectChange[];
};

export type ChangeIssue = {
  code: string;
  changeIndex?: number;
  message: string;
};

export type ChangePreview = {
  valid: boolean;
  baseRevision: number;
  errors: ChangeIssue[];
  warnings: ChangeIssue[];
  affectedEntityIds: string[];
  nextProject?: CanonicalProject;
};
