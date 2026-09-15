import type {
  BlockType,
  ButtonVariant,
  Element,
  ElementBase,
  Feature,
  FeatureAction,
  Project,
  ProjectSettings,
  Screen,
  SectionDirection,
} from "../shared/index.ts";

// Sketchy Canonical Project 모델과 변경 배치 타입 정의
// Figma nodeId 없이 순수 도메인 데이터만 다루는 서버, MCP 공용 레이어

export type DomainScreen = Omit<Screen, "nodeId">;
// 평범한 Omit은 union의 key 교집합만 남겨 variant별 필드(buttonVariant 등)를
// 지워버리므로, 각 variant에 개별로 Omit을 분배하는 조건부 타입을 쓴다
type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;
export type DomainElement = DistributiveOmit<Element, "nodeId">;

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
// patch와 마찬가지로 검증 전 후보값이라 union이 아니라 알려진 필드 전부를
// 낙관적으로 허용하는 평평한 모양, validate-project-changes의 guard를
// 통과한 뒤에만 실제 DomainElement로 취급한다
type ElementInput = Omit<ElementBase, "nodeId"> & {
  type: BlockType;
} & ButtonVariant &
  SectionDirection;
// patch는 특정 variant의 인스턴스가 아니라 "알려진 필드 중 일부"라 union에서
// Pick할 수 없다, target의 실제 type과 맞는지는 validate-project-changes에서
// 런타임으로 확인한다
type ElementPatch = Partial<{
  name: string;
  description: string;
  buttonVariant: "filled" | "outline";
  direction: "vertical" | "horizontal";
}>;

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
  // insertAfterElementId 생략 시 형제 중 맨 끝에 추가, 지정 시 그 형제 바로 뒤에 삽입
  | {
      type: "ADD_ELEMENT";
      element: ElementInput;
      insertAfterElementId?: string;
    }
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
