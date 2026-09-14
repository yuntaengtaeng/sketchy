import type { ProjectDocument } from "../../core/project-change.ts";
import type { AuthSession } from "../../shared/index.ts";

// Figma Plugin에서 Sketchy 서버로 나가는 모든 요청의 얇은 wrapper 모음
// fetcher 주입으로 figma 전역이나 실제 네트워크 없이도 단위 테스트 가능

export const SKETCHY_ENDPOINT = "https://sketchy.dbsxo360.workers.dev";

// 실패 시 status를 그대로 노출해 호출측이 401(인증 만료), 409(revision 충돌)를 구분
export type RemoteResult<T> =
  { ok: true; value: T } | { ok: false; status: number };

function projectUrl(projectId: string, suffix = "") {
  return `${SKETCHY_ENDPOINT}/api/v1/projects/${encodeURIComponent(projectId)}${suffix}`;
}

/** 요약 Project 조회, revision 비교용으로 가볍게 폴링할 때 사용 */
export async function fetchRemoteRevision(
  session: AuthSession,
  projectId: string,
  fetcher: typeof fetch = fetch,
): Promise<RemoteResult<number>> {
  const response = await fetcher(projectUrl(projectId), {
    headers: { authorization: `Bearer ${session.token}` },
  });
  if (!response.ok) return { ok: false, status: response.status };
  const project = (await response.json()) as { revision: number };
  return { ok: true, value: project.revision };
}

/** elements, features를 포함한 전체 ProjectDocument 조회, pull 시에만 사용 */
export async function fetchRemoteDocument(
  session: AuthSession,
  projectId: string,
  fetcher: typeof fetch = fetch,
): Promise<RemoteResult<ProjectDocument>> {
  const response = await fetcher(projectUrl(projectId, "/document"), {
    headers: { authorization: `Bearer ${session.token}` },
  });
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, value: (await response.json()) as ProjectDocument };
}

/** Figma Canvas 상태를 전체 문서로 서버에 반영, revision 충돌 시 409 status 반환 */
export async function pushProject(
  session: AuthSession,
  document: ProjectDocument,
  fetcher: typeof fetch = fetch,
): Promise<RemoteResult<number>> {
  const response = await fetcher(projectUrl(document.id), {
    method: "PUT",
    headers: {
      authorization: `Bearer ${session.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(document),
  });
  if (!response.ok) return { ok: false, status: response.status };
  const project = (await response.json()) as { revision: number };
  return { ok: true, value: project.revision };
}

/** Canvas 반영 완료를 Preview, Apply 두 단계로 서버에 기록 */
export async function confirmProjectionSynced(
  session: AuthSession,
  projectId: string,
  revision: number,
  fileKey: string,
  nodes: Record<string, string>,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const request = {
    projectId,
    baseRevision: revision,
    idempotencyKey: `figma-sync-${projectId}-${revision}`,
    changes: [
      {
        type: "RECORD_FIGMA_PROJECTION",
        projection: { fileKey, status: "synced", revision, nodes },
      },
    ],
  };
  const headers = {
    authorization: `Bearer ${session.token}`,
    "content-type": "application/json",
  };
  const preview = await fetcher(projectUrl(projectId, "/previews"), {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });
  if (!preview.ok) return false;
  const { previewId, valid } = (await preview.json()) as {
    previewId: string;
    valid: boolean;
  };
  if (!valid) return false;
  const apply = await fetcher(projectUrl(projectId, "/changes"), {
    method: "POST",
    headers,
    body: JSON.stringify({ ...request, previewId }),
  });
  return apply.ok;
}
