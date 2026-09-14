import type {
  ProjectChangeRequest,
  ProjectDocument,
} from "../core/project-change.ts";
import { applyChanges, previewChanges } from "../mcp/change-tools.ts";
import { getProject, getScreen } from "../mcp/read-tools.ts";

export type ProjectScope = "project:read" | "project:write";

export type ProjectPrincipal = {
  userId: string;
  scopes: ReadonlySet<ProjectScope>;
};

export type ProjectRecord = {
  ownerId: string;
  document: ProjectDocument;
};

export type ProjectStore = {
  create(record: ProjectRecord): Promise<boolean>;
  get(projectId: string): Promise<ProjectRecord | undefined>;
  listByOwner(ownerId: string): Promise<ProjectRecord[]>;
  replace(record: ProjectRecord, expectedRevision: number): Promise<boolean>;
};

// Project 소유권 확인, scope 검사, revision 충돌 처리를 담당하는 서비스 경계
// D1, MCP 로컬 파일 등 실제 저장 방식은 ProjectStore 구현체에 위임
export class ProjectService {
  private readonly store: ProjectStore;

  constructor(store: ProjectStore) {
    this.store = store;
  }

  async create(principal: ProjectPrincipal, document: ProjectDocument) {
    requireScope(principal, "project:write");
    const created = await this.store.create({
      ownerId: principal.userId,
      document,
    });
    if (!created)
      throw new ProjectServiceError(409, "PROJECT_EXISTS", "Project exists.");
    return getProject(document);
  }

  async getProject(principal: ProjectPrincipal, projectId: string) {
    const record = await this.readOwned(principal, projectId, "project:read");
    return getProject(record.document);
  }

  // Figma Plugin이 pull 시 사용하는 전체 ProjectDocument 조회
  // getProject의 요약본과 달리 elements, features를 포함해 Canvas 재구성에 사용
  async getDocument(principal: ProjectPrincipal, projectId: string) {
    const record = await this.readOwned(principal, projectId, "project:read");
    return record.document;
  }

  async listProjects(principal: ProjectPrincipal) {
    requireScope(principal, "project:read");
    return (await this.store.listByOwner(principal.userId)).map(
      ({ document }) => getProject(document),
    );
  }

  async getScreen(
    principal: ProjectPrincipal,
    projectId: string,
    screenId: string,
  ) {
    const record = await this.readOwned(principal, projectId, "project:read");
    try {
      return getScreen(record.document, screenId);
    } catch {
      throw new ProjectServiceError(
        404,
        "SCREEN_NOT_FOUND",
        "Screen does not exist.",
      );
    }
  }

  // Figma Plugin이 Canvas 편집 결과를 전체 문서로 밀어올리는 push
  // Agent 배치처럼 개별 변경을 검증하지 않고 revision이 정확히 하나 앞선 문서만 허용
  // appliedBatches는 클라이언트 값을 신뢰하지 않고 서버 보관본을 그대로 유지
  async sync(
    principal: ProjectPrincipal,
    projectId: string,
    document: ProjectDocument,
  ) {
    requireProjectId(projectId, document.id);
    const record = await this.readOwned(principal, projectId, "project:write");
    const expectedRevision = record.document.revision;
    if (document.revision !== expectedRevision + 1)
      throw new ProjectServiceError(
        409,
        "REVISION_CONFLICT",
        "Project changed on the server before this sync.",
      );

    const saved = await this.store.replace(
      {
        ...record,
        document: {
          ...document,
          appliedBatches: record.document.appliedBatches,
        },
      },
      expectedRevision,
    );
    if (!saved)
      throw new ProjectServiceError(
        409,
        "REVISION_CONFLICT",
        "Project changed on the server before this sync.",
      );
    return getProject({
      ...document,
      appliedBatches: record.document.appliedBatches,
    });
  }

  async preview(
    principal: ProjectPrincipal,
    projectId: string,
    request: ProjectChangeRequest,
  ) {
    requireProjectId(projectId, request.projectId);
    const record = await this.readOwned(principal, projectId, "project:write");
    return previewChanges(record.document, request);
  }

  async apply(
    principal: ProjectPrincipal,
    projectId: string,
    previewId: string,
    request: ProjectChangeRequest,
  ) {
    requireProjectId(projectId, request.projectId);
    const record = await this.readOwned(principal, projectId, "project:write");
    const applied = applyChanges(record.document, previewId, request);
    if (!applied.nextDocument) return applied.result;

    const saved = await this.store.replace(
      { ...record, document: applied.nextDocument },
      record.document.revision,
    );
    if (!saved)
      throw new ProjectServiceError(
        409,
        "REVISION_CONFLICT",
        "Project changed before the batch was saved.",
      );
    return applied.result;
  }

  private async readOwned(
    principal: ProjectPrincipal,
    projectId: string,
    scope: ProjectScope,
  ) {
    requireScope(principal, scope);
    const record = await this.store.get(projectId);
    if (!record || record.ownerId !== principal.userId)
      throw new ProjectServiceError(
        404,
        "PROJECT_NOT_FOUND",
        "Project does not exist.",
      );
    return record;
  }
}

export class ProjectServiceError extends Error {
  readonly status: 400 | 403 | 404 | 409;
  readonly code: string;

  constructor(status: 400 | 403 | 404 | 409, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireScope(principal: ProjectPrincipal, scope: ProjectScope) {
  if (!principal.scopes.has(scope))
    throw new ProjectServiceError(403, "FORBIDDEN", "Permission denied.");
}

function requireProjectId(pathId: string, requestId: string) {
  if (pathId !== requestId)
    throw new ProjectServiceError(
      400,
      "PROJECT_ID_MISMATCH",
      "Project does not match the request path.",
    );
}
