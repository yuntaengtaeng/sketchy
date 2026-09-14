import type {
  ProjectDocument,
  ProjectMetadata,
} from "../core/project-change.ts";
import { createProjectDocument } from "../core/project-change.ts";
import { previewProjectImport } from "../core/project-import.ts";
import type { AuthSession, Project, SyncStatus } from "../shared/index.ts";
import {
  confirmProjectionSynced as confirmProjectionSyncedRemote,
  fetchRemoteDocument as fetchRemoteDocumentRemote,
  fetchRemoteRevision as fetchRemoteRevisionRemote,
  pushProject as pushProjectRemote,
} from "./commands/remote-sync.ts";
import { decideSync } from "./sync-decision.ts";
import {
  cleanProject as cleanProjectLocal,
  readProject as readProjectLocal,
  readProjectMetadata as readProjectMetadataLocal,
  readSyncState as readSyncStateLocal,
  writeSyncState as writeSyncStateLocal,
  type SyncState,
} from "./storage/project.ts";

const POLL_INTERVAL_MS = 4000;

// 모든 필드가 Figma 전역이나 네트워크를 직접 건드리므로 테스트에서 전부 대체 가능
// 실제 Plugin은 아래 default 구현체 그대로 사용, 단위 테스트는 각 필드를 fake로 주입
export type SyncLoopDeps = {
  /** 저장된 Sketchy 로그인 세션 조회 */
  readSession: () => Promise<AuthSession | undefined>;
  /** 원격 Project 적용 후 Canvas 렌더링과 UI State 갱신 콜백 */
  onProjectPulled: (project: Project) => Promise<void>;
  /** 원격 ProjectDocument를 Canvas에 그리는 apply-project-import 위임, canvas/flow 의존을 옮기지 않도록 필수 주입 */
  applyProjectImport: (document: ProjectDocument) => Promise<Project>;
  /** 문제가 있을 때만 상태 UI에 반영, syncing과 applied는 성공 흐름의 짧은 안내 */
  onStatusChange?: (status: SyncStatus) => void;
  readProject?: () => Project;
  cleanProject?: (project: Project) => Promise<Project>;
  readProjectMetadata?: () => ProjectMetadata;
  readSyncState?: () => SyncState;
  writeSyncState?: (state: SyncState) => void;
  fileKey?: () => string;
  fetchRemoteRevision?: typeof fetchRemoteRevisionRemote;
  fetchRemoteDocument?: typeof fetchRemoteDocumentRemote;
  pushProject?: typeof pushProjectRemote;
  confirmProjectionSynced?: typeof confirmProjectionSyncedRemote;
};

/**
 * Figma Plugin과 서버 사이 Project 동기화 루프 생성
 * push, pull, projection 확인, 주기 폴링 소유
 * main.ts에는 시작, 중지, 로컬 변경 반영 호출만 노출
 */
export function createSyncLoop(deps: SyncLoopDeps) {
  const readProject = deps.readProject ?? readProjectLocal;
  const cleanProject = deps.cleanProject ?? cleanProjectLocal;
  const readProjectMetadata =
    deps.readProjectMetadata ?? readProjectMetadataLocal;
  const readSyncState = deps.readSyncState ?? readSyncStateLocal;
  const writeSyncState = deps.writeSyncState ?? writeSyncStateLocal;
  const applyProjectImport = deps.applyProjectImport;
  const fileKey = deps.fileKey ?? (() => figma.fileKey || "local-development");
  const fetchRemoteRevision =
    deps.fetchRemoteRevision ?? fetchRemoteRevisionRemote;
  const fetchRemoteDocument =
    deps.fetchRemoteDocument ?? fetchRemoteDocumentRemote;
  const pushProject = deps.pushProject ?? pushProjectRemote;
  const confirmProjectionSynced =
    deps.confirmProjectionSynced ?? confirmProjectionSyncedRemote;
  const setStatus = (status: SyncStatus) => deps.onStatusChange?.(status);

  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let pollInFlight = false;
  let pushInFlight = false;

  /** 로컬 revision이 마지막 동기화보다 앞설 때만 전체 문서를 서버로 전송 */
  async function pushLocalChanges(project: Project) {
    // await 이전에 잠가야 동시 호출 두 건이 모두 잠금을 통과하는 경합을 막는다
    if (pushInFlight) return;
    pushInFlight = true;
    try {
      const state = readSyncState();
      if (!state.connected) return;
      const metadata = readProjectMetadata();
      if (metadata.revision <= state.lastSyncedRevision) return;
      const session = await deps.readSession();
      if (!session) return;
      setStatus("syncing");
      const document = createProjectDocument(project, metadata, fileKey());
      const result = await pushProject(session, document);
      if (result.ok) {
        writeSyncState({ connected: true, lastSyncedRevision: result.value });
        setStatus("applied");
        return;
      }
      // 인증 만료, revision 충돌만 상태 UI에 노출, 그 외 일시 오류는 다음 poll이 재시도
      if (result.status === 401 || result.status === 403)
        setStatus("auth-expired");
      else if (result.status === 409) setStatus("conflict");
    } finally {
      pushInFlight = false;
    }
  }

  /** 서버가 앞선 revision을 들고 있을 때 전체 문서를 받아 Canvas에 반영 */
  async function pullRemoteChanges(session: AuthSession, projectId: string) {
    setStatus("syncing");
    const remote = await fetchRemoteDocument(session, projectId);
    if (!remote.ok) {
      if (remote.status === 401 || remote.status === 403)
        setStatus("auth-expired");
      return;
    }
    const remoteDocument = remote.value;
    const current = createProjectDocument(
      await cleanProject(readProject()),
      readProjectMetadata(),
      fileKey(),
    );
    const preview = previewProjectImport(
      current,
      JSON.stringify(remoteDocument),
    );
    if (!preview.valid) {
      setStatus("unsupported");
      return;
    }
    const project = await applyProjectImport(remoteDocument);
    // pushLocalChanges 재전송 방지를 위해 Canvas 반영 전 lastSyncedRevision 선반영
    writeSyncState({
      connected: true,
      lastSyncedRevision: remoteDocument.revision,
    });
    await deps.onProjectPulled(project);
    setStatus("applied");

    const key = fileKey();
    const { nodes } = createProjectDocument(
      project,
      {
        id: projectId,
        revision: remoteDocument.revision,
        updatedAt: remoteDocument.updatedAt,
      },
      key,
    ).figmaProjection!;
    // 확인 실패는 무시, Projection 상태만 pending으로 남고 다음 poll에는 영향 없음
    void confirmProjectionSynced(
      session,
      projectId,
      remoteDocument.revision,
      key,
      nodes,
    );
  }

  /** 서버 요약 revision만 조회해 push, pull, conflict 중 하나로 판정 */
  async function checkRemoteProject() {
    // await 이전에 잠가야 동시 호출 두 건이 모두 잠금을 통과하는 경합을 막는다
    if (pollInFlight) return;
    pollInFlight = true;
    try {
      const state = readSyncState();
      if (!state.connected) return;
      const session = await deps.readSession();
      if (!session) return;
      const metadata = readProjectMetadata();
      const remote = await fetchRemoteRevision(session, metadata.id);
      if (!remote.ok) {
        if (remote.status === 401 || remote.status === 403)
          setStatus("auth-expired");
        return;
      }
      const decision = decideSync(
        metadata.revision,
        remote.value,
        state.lastSyncedRevision,
      );
      if (decision === "push")
        await pushLocalChanges(await cleanProject(readProject()));
      if (decision === "pull") await pullRemoteChanges(session, metadata.id);
      // 로컬, 원격이 동시에 앞서 있으면 어느 쪽도 자동 반영하지 않고 상태만 알린다
      if (decision === "conflict") setStatus("conflict");
    } finally {
      pollInFlight = false;
    }
  }

  function start() {
    if (pollTimer) return;
    pollTimer = setInterval(() => void checkRemoteProject(), POLL_INTERVAL_MS);
    void checkRemoteProject();
  }

  function stop() {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }

  return { start, stop, pushLocalChanges, checkRemoteProject };
}
