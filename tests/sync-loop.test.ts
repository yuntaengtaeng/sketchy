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

test("leaves lastSyncedRevision untouched and flags a conflict on 409", async () => {
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
    pushProject: async () => err(409),
  });
  await loop.pushLocalChanges(emptyProject);
  assert.equal(state.lastSyncedRevision, 0);
  assert.deepEqual(statuses, ["syncing", "conflict"]);
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
