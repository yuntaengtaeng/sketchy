import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectDocument } from "../src/core/project-change.ts";
import { createSyncLoop } from "../src/plugin/sync-loop.ts";
import type { SyncState } from "../src/plugin/storage/project.ts";
import type { Project, SyncStatus } from "../src/shared/index.ts";

// figma 전역을 전혀 쓰지 않고 SyncLoopDeps 전부를 fake로 주입해
// createSyncLoop 하나만 대상으로 테스트가 가능한지 검증

const session = { token: "tok", user: { id: "u", email: "u@test.dev" } };
const emptyProject: Project = {
  settings: { screenPreset: "mobile" },
  screens: [],
  elements: [],
  features: [],
};
const metadata = (revision: number) => ({
  id: "project",
  revision,
  updatedAt: "2026-09-14T00:00:00.000Z",
});
// pull 경로를 타지 않는 테스트에서 타입만 맞추는 자리 채우기
const unusedApplyProjectImport = async () => emptyProject;
const ok = <T>(value: T) => ({ ok: true as const, value });
const err = (status: number) => ({ ok: false as const, status });

test("does nothing while disconnected even with a session", async () => {
  const calls: string[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    readSyncState: () => ({ connected: false, lastSyncedRevision: 0 }),
    fetchRemoteRevision: async () => {
      calls.push("fetchRemoteRevision");
      return ok(0);
    },
  });
  await loop.checkRemoteProject();
  assert.deepEqual(calls, []);
});

test("does not push when the local revision has not moved past the last sync", async () => {
  const calls: string[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    readProjectMetadata: () => metadata(0),
    readSyncState: () => ({ connected: true, lastSyncedRevision: 0 }),
    pushProject: async () => {
      calls.push("pushProject");
      return ok(1);
    },
  });
  await loop.pushLocalChanges(emptyProject);
  assert.deepEqual(calls, []);
});

test("pushes and records the server-confirmed revision", async () => {
  const state: SyncState = { connected: true, lastSyncedRevision: 0 };
  const statuses: SyncStatus[] = [];
  let pushed: ProjectDocument | undefined;
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(1),
    readSyncState: () => state,
    writeSyncState: (next) => Object.assign(state, next),
    fileKey: () => "figma-file",
    pushProject: async (_session, document) => {
      pushed = document;
      return ok(1);
    },
  });
  await loop.pushLocalChanges(emptyProject);
  assert.equal(pushed?.id, "project");
  assert.equal(pushed?.revision, 1);
  assert.equal(state.lastSyncedRevision, 1);
  assert.deepEqual(statuses, ["syncing", "applied"]);
});

const remoteSnapshot = (
  revision: number,
  appliedBatches?: ProjectDocument["appliedBatches"],
): ProjectDocument => ({
  id: "project",
  revision,
  updatedAt: "2026-09-14T00:00:00.000Z",
  project: emptyProject as never,
  appliedBatches,
});

test("leaves lastSyncedRevision untouched and flags a conflict when the rebased retry also loses", async () => {
  const state: SyncState = { connected: true, lastSyncedRevision: 0 };
  const statuses: SyncStatus[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(1),
    readSyncState: () => state,
    writeSyncState: (next) => Object.assign(state, next),
    fileKey: () => "figma-file",
    fetchRemoteDocument: async () => ok(remoteSnapshot(0)),
    pushProject: async () => err(409),
  });
  await loop.pushLocalChanges(emptyProject);
  assert.equal(state.lastSyncedRevision, 0);
  assert.deepEqual(statuses, ["syncing", "conflict"]);
});

test("recovers from a conflict by rebasing the canvas snapshot onto the latest server revision", async () => {
  const state: SyncState = { connected: true, lastSyncedRevision: 0 };
  const statuses: SyncStatus[] = [];
  const pushedDocuments: ProjectDocument[] = [];
  let savedRevision: number | undefined;
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(1),
    readSyncState: () => state,
    writeSyncState: (next) => Object.assign(state, next),
    saveProjectSnapshot: (_project, meta) => {
      savedRevision = meta.revision;
    },
    fileKey: () => "figma-file",
    // 다른 Figma 인스턴스가 그 사이 revision 4까지 밀어올렸을 뿐, agent가 만든
    // appliedBatches는 없는 상황
    fetchRemoteDocument: async () => ok(remoteSnapshot(4)),
    pushProject: async (_session, document) => {
      pushedDocuments.push(document);
      return document.revision === 1 ? err(409) : ok(document.revision);
    },
  });
  await loop.pushLocalChanges(emptyProject);
  // 최초 push는 revision 1로 실패, 서버의 최신 revision(4) 위로 재기준한
  // revision 5로 캔버스 내용을 다시 push해 스스로 회복
  assert.deepEqual(
    pushedDocuments.map((document) => document.revision),
    [1, 5],
  );
  // figmaProjection의 lastSyncedRevision도 재기준한 revision과 같이 움직여야
  // 문서 내부가 서로 다른 revision을 가리키는 모순이 남지 않는다
  assert.equal(pushedDocuments[1].figmaProjection?.lastSyncedRevision, 5);
  assert.equal(state.lastSyncedRevision, 5);
  assert.equal(savedRevision, 5);
  assert.deepEqual(statuses, ["syncing", "applied"]);
});

test("refuses to overwrite work an agent applied since the last known sync, and stays in conflict", async () => {
  const state: SyncState = { connected: true, lastSyncedRevision: 0 };
  const statuses: SyncStatus[] = [];
  const pushedDocuments: ProjectDocument[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(1),
    readSyncState: () => state,
    writeSyncState: (next) => Object.assign(state, next),
    fileKey: () => "figma-file",
    // agent가 apply()로 revision 4에 실제 변경을 넣었으므로(appliedBatches),
    // 캔버스 내용으로 덮어써서는 안 되는 상황
    fetchRemoteDocument: async () =>
      ok(
        remoteSnapshot(4, {
          "agent-batch": { revision: 4, previewId: "preview-1" },
        }),
      ),
    pushProject: async (_session, document) => {
      pushedDocuments.push(document);
      return err(409);
    },
  });
  await loop.pushLocalChanges(emptyProject);
  // 재기준 재시도 자체를 포기해야 하므로 push는 최초 시도 한 번만 일어난다
  assert.deepEqual(
    pushedDocuments.map((document) => document.revision),
    [1],
  );
  assert.equal(state.lastSyncedRevision, 0);
  assert.deepEqual(statuses, ["syncing", "conflict"]);
});

test("still recovers when an old, superseded agent batch is far behind the current server revision", async () => {
  // appliedBatches는 지워지지 않으므로, 예전에 agent를 한 번 썼던 기록이 남아있고
  // lastSyncedRevision이 그보다 계속 뒤처져 있으면(이 프로젝트가 실제로 겪은 상황)
  // "기록이 있다"만 보는 판정은 agent가 더 이상 활동하지 않는데도 영원히 conflict를
  // 재현시킨다. 서버의 "현재" revision 자체가 agent 작성이 아니면 회복해야 한다
  const state: SyncState = { connected: true, lastSyncedRevision: 0 };
  const statuses: SyncStatus[] = [];
  const pushedDocuments: ProjectDocument[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(1),
    readSyncState: () => state,
    writeSyncState: (next) => Object.assign(state, next),
    saveProjectSnapshot: () => {},
    fileKey: () => "figma-file",
    // agent가 예전에 revision 3에 뭔가 적용했지만, 그 뒤로 다른 Figma push가
    // 여러 번 더 있어서 서버는 지금 revision 10, 최신 변경은 agent가 아니다
    fetchRemoteDocument: async () =>
      ok(
        remoteSnapshot(10, {
          "old-agent-batch": { revision: 3, previewId: "preview-1" },
        }),
      ),
    pushProject: async (_session, document) => {
      pushedDocuments.push(document);
      return document.revision === 1 ? err(409) : ok(document.revision);
    },
  });
  await loop.pushLocalChanges(emptyProject);
  assert.deepEqual(
    pushedDocuments.map((document) => document.revision),
    [1, 11],
  );
  assert.equal(state.lastSyncedRevision, 11);
  assert.deepEqual(statuses, ["syncing", "applied"]);
});

test("reports auth-expired instead of a stale conflict when the recovery document check finds the session expired", async () => {
  const state: SyncState = { connected: true, lastSyncedRevision: 0 };
  const statuses: SyncStatus[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(1),
    readSyncState: () => state,
    writeSyncState: (next) => Object.assign(state, next),
    fileKey: () => "figma-file",
    fetchRemoteDocument: async () => err(401),
    pushProject: async () => err(409),
  });
  await loop.pushLocalChanges(emptyProject);
  assert.equal(state.lastSyncedRevision, 0);
  assert.deepEqual(statuses, ["syncing", "auth-expired"]);
});

test("signs the user out again when a push finds the session expired", async () => {
  const statuses: SyncStatus[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(1),
    readSyncState: () => ({ connected: true, lastSyncedRevision: 0 }),
    fileKey: () => "figma-file",
    pushProject: async () => err(401),
  });
  await loop.pushLocalChanges(emptyProject);
  assert.deepEqual(statuses, ["syncing", "auth-expired"]);
});

test("pulls, applies, and pins lastSyncedRevision before rendering", async () => {
  const state: SyncState = { connected: true, lastSyncedRevision: 0 };
  const order: string[] = [];
  const statuses: SyncStatus[] = [];
  const remoteDocument: ProjectDocument = {
    id: "project",
    revision: 3,
    updatedAt: "2026-09-14T00:00:00.000Z",
    project: emptyProject as never,
  };
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {
      order.push("render");
      assert.equal(
        state.lastSyncedRevision,
        3,
        "revision pinned before render",
      );
    },
    onStatusChange: (status) => statuses.push(status),
    readProject: () => emptyProject,
    cleanProject: async (project) => project,
    readProjectMetadata: () => metadata(0),
    readSyncState: () => state,
    writeSyncState: (next) => {
      order.push("write");
      Object.assign(state, next);
    },
    applyProjectImport: async () => emptyProject,
    fileKey: () => "figma-file",
    fetchRemoteRevision: async () => ok(3),
    fetchRemoteDocument: async () => ok(remoteDocument),
    confirmProjectionSynced: async () => true,
  });
  await loop.checkRemoteProject();
  assert.deepEqual(order, ["write", "render"]);
  assert.equal(state.lastSyncedRevision, 3);
  assert.deepEqual(statuses, ["syncing", "applied"]);
});

test("skips the pull and flags unsupported when the imported document fails validation", async () => {
  const calls: string[] = [];
  const statuses: SyncStatus[] = [];
  const remoteDocument: ProjectDocument = {
    id: "project",
    revision: 3,
    updatedAt: "2026-09-14T00:00:00.000Z",
    project: { settings: {} } as never, // malformed on purpose
  };
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {
      calls.push("render");
    },
    onStatusChange: (status) => statuses.push(status),
    readProject: () => emptyProject,
    cleanProject: async (project) => project,
    readProjectMetadata: () => metadata(0),
    readSyncState: () => ({ connected: true, lastSyncedRevision: 0 }),
    fileKey: () => "figma-file",
    fetchRemoteRevision: async () => ok(3),
    fetchRemoteDocument: async () => ok(remoteDocument),
    applyProjectImport: async () => {
      calls.push("applyProjectImport");
      return emptyProject;
    },
  });
  await loop.checkRemoteProject();
  assert.deepEqual(calls, []);
  assert.deepEqual(statuses, ["syncing", "unsupported"]);
});

test("flags a conflict when local and remote both moved past the last sync", async () => {
  const statuses: SyncStatus[] = [];
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    onStatusChange: (status) => statuses.push(status),
    readProjectMetadata: () => metadata(5),
    readSyncState: () => ({ connected: true, lastSyncedRevision: 3 }),
    fetchRemoteRevision: async () => ok(4),
  });
  await loop.checkRemoteProject();
  assert.deepEqual(statuses, ["conflict"]);
});

test("does not overlap two concurrent polls", async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async () => {},
    applyProjectImport: unusedApplyProjectImport,
    readProjectMetadata: () => metadata(5),
    readSyncState: () => ({ connected: true, lastSyncedRevision: 5 }),
    fetchRemoteRevision: async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return ok(5);
    },
  });
  await Promise.all([loop.checkRemoteProject(), loop.checkRemoteProject()]);
  assert.equal(maxInFlight, 1);
});
