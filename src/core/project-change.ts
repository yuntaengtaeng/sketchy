import type {
  Element,
  Feature,
  FeatureAction,
  Project,
  ProjectSettings,
  Screen,
} from "../shared/index.ts";

// Sketchy Canonical Project 모델과 변경 배치 타입 정의
// Figma nodeId 없이 순수 도메인 데이터만 다루는 서버, MCP 공용 레이어

export type DomainScreen = Omit<Screen, "nodeId">;
export type DomainElement = Omit<Element, "nodeId">;

export type CanonicalProject = {
  settings: ProjectSettings;
  screens: DomainScreen[];
  elements: DomainElement[];
  features: Feature[];
};

/** Figma Canvas 반영 상태, pending은 Plugin 적용 대기, synced는 Plugin이 확인 완료 */
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
  // idempotencyKey별 적용 결과 기록, 동일 키 재요청 시 중복 적용 대신 이 값으로 응답
  appliedBatches?: Record<string, { revision: number; previewId: string }>;
};

export type ProjectMetadata = Pick<
  ProjectDocument,
  "id" | "revision" | "updatedAt"
>;

/** Figma Plugin이 Canvas 상태로부터 전체 ProjectDocument 생성, 항상 synced 상태로 시작 */
export function createProjectDocument(
  project: Project,
  metadata: ProjectMetadata,
  fileKey: string,
): ProjectDocument {
  const nodes = Object.fromEntries(
    [...project.screens, ...project.elements].map(({ id, nodeId }) => [
      id,
      nodeId,
    ]),
  );
  return {
    ...metadata,
    project: {
      settings: project.settings,
      screens: project.screens.map(({ nodeId: _, ...screen }) => screen),
      elements: project.elements.map(({ nodeId: _, ...element }) => element),
      features: project.features,
    },
    figmaProjection: {
      fileKey,
      status: "synced",
      lastSyncedRevision: metadata.revision,
      nodes,
    },
  };
}

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
  | { type: "CLEAR_ELEMENT_ACTION"; elementId: string }
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
  // Plugin이 Canvas 반영을 확인할 때 보내는 유일한 변경, 단독 배치일 때만 revision 유지
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
