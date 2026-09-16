import assert from "node:assert/strict";
import test from "node:test";
import {
  createDevelopmentBearerAuthenticator,
  createProjectApi,
} from "../src/api/http.ts";
import {
  ProjectService,
  type ProjectRecord,
  type ProjectStore,
} from "../src/api/project-service.ts";
import type {
  ProjectDocument,
  ProjectMetadata,
} from "../src/core/project-change.ts";
import {
  confirmProjectionSynced,
  fetchRemoteDocument,
  fetchRemoteRevision,
  pushProject,
} from "../src/plugin/commands/remote-sync.ts";
import { createSyncLoop } from "../src/plugin/sync-loop.ts";
import type { SyncState } from "../src/plugin/storage/project.ts";
import type { Project } from "../src/shared/index.ts";

// createSyncLoop이 실제 remote-sync.ts 함수, 실제 HTTP 라우팅(createProjectApi)과
// 맞물려 동작하는지 검증한다. Figma Canvas 렌더링(applyProjectImport)만 fake로 대체하고
// 나머지는 main.ts가 조립하는 것과 동일한 경로를 그대로 태운다.
test("wires the real HTTP contract through the sync loop, both directions", async () => {
  const records = new Map<string, ProjectRecord>();
  const store: ProjectStore = {
    async create(record) {
      if (records.has(record.document.id)) return false;
      records.set(record.document.id, record);
      return true;
    },
    async get(projectId) {
      return records.get(projectId);
    },
    async listByOwner(ownerId) {
      return [...records.values()].filter((r) => r.ownerId === ownerId);
    },
    async replace(record, expectedRevision) {
      const current = records.get(record.document.id);
      if (current?.document.revision !== expectedRevision) return false;
      records.set(record.document.id, record);
      return true;
    },
  };
  const api = createProjectApi(
    new ProjectService(store),
    createDevelopmentBearerAuthenticator("secret", "designer"),
  );
  const fetcher: typeof fetch = (input, init) =>
    api(new Request(input as string, init));
  const session = { token: "secret", user: { id: "u", email: "u@test.dev" } };

  const initial: ProjectDocument = {
    id: "onboarding-project",
    revision: 0,
    updatedAt: "2026-09-14T00:00:00.000Z",
    project: {
      settings: { screenPreset: "mobile", showFlowArrows: true },
      screens: [{ id: "welcome", name: "Welcome", purpose: "Greet" }],
      elements: [],
      features: [],
    },
    figmaProjection: {
      fileKey: "figma-file",
      status: "synced",
      lastSyncedRevision: 0,
      nodes: { welcome: "1:2" },
    },
  };
  await api(
    new Request("https://sketchy.test/api/v1/projects", {
      method: "POST",
      headers: {
        authorization: "Bearer secret",
        "content-type": "application/json",
      },
      body: JSON.stringify(initial),
    }),
  );

  let localMetadata: ProjectMetadata = {
    id: initial.id,
    revision: 0,
    updatedAt: initial.updatedAt,
  };
  let localProject: Project = {
    ...initial.project,
    screens: initial.project.screens.map((screen) => ({
      ...screen,
      nodeId: "n-welcome",
    })),
    elements: [],
  };
  let syncState: SyncState = { connected: true, lastSyncedRevision: 0 };
  const pulledProjects: Project[] = [];

  const loop = createSyncLoop({
    readSession: async () => session,
    onProjectPulled: async (project) => {
      pulledProjects.push(project);
    },
    readProject: () => localProject,
    cleanProject: async (project) => project,
    readProjectMetadata: () => localMetadata,
    readSyncState: () => syncState,
    writeSyncState: (next) => (syncState = next),
    fileKey: () => "figma-file",
    applyProjectImport: async (document) => {
      localMetadata = {
        id: document.id,
        revision: document.revision,
        updatedAt: document.updatedAt,
      };
      localProject = {
        ...document.project,
        screens: document.project.screens.map((screen) => ({
          ...screen,
          nodeId: `n-${screen.id}`,
        })),
        elements: document.project.elements.map((element) => ({
          ...element,
          nodeId: `n-${element.id}`,
        })),
      };
      return localProject;
    },
    fetchRemoteRevision: (s, id) => fetchRemoteRevision(s, id, fetcher),
    fetchRemoteDocument: (s, id) => fetchRemoteDocument(s, id, fetcher),
    pushProject: (s, document) => pushProject(s, document, fetcher),
    confirmProjectionSynced: (s, id, revision, fileKey, nodes) =>
      confirmProjectionSynced(s, id, revision, fileKey, nodes, fetcher),
  });

  // Agent applies a change directly against the server, bypassing the Plugin.
  const change = {
    projectId: initial.id,
    baseRevision: 0,
    idempotencyKey: "agent-add-cta",
    changes: [
      {
        type: "ADD_ELEMENT",
        element: {
          id: "cta",
          screenId: "welcome",
          name: "Get started",
          type: "button",
        },
      },
    ],
  };
  const preview = (await (
    await fetcher(
      "https://sketchy.test/api/v1/projects/onboarding-project/previews",
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret",
          "content-type": "application/json",
        },
        body: JSON.stringify(change),
      },
    )
  ).json()) as { previewId: string };
  await fetcher(
    "https://sketchy.test/api/v1/projects/onboarding-project/changes",
    {
      method: "POST",
      headers: {
        authorization: "Bearer secret",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...change, previewId: preview.previewId }),
    },
  );

  // The Plugin's poll should detect and pull that change onto the Canvas.
  await loop.checkRemoteProject();
  assert.equal(localMetadata.revision, 1);
  assert.deepEqual(
    localProject.elements.map((element) => element.id),
    ["cta"],
  );
  assert.equal(pulledProjects.length, 1);
  assert.equal(syncState.lastSyncedRevision, 1);

  // A direct Figma edit is pushed back up through the same loop.
  localProject = {
    ...localProject,
    screens: localProject.screens.map((screen) =>
      screen.id === "welcome" ? { ...screen, name: "Say hello" } : screen,
    ),
  };
  localMetadata = { ...localMetadata, revision: localMetadata.revision + 1 };
  await loop.pushLocalChanges(localProject);
  assert.equal(syncState.lastSyncedRevision, 2);

  const stored = (await (
    await fetcher(
      "https://sketchy.test/api/v1/projects/onboarding-project/document",
      { headers: { authorization: "Bearer secret" } },
    )
  ).json()) as ProjectDocument;
  assert.equal(stored.revision, 2);
  assert.equal(stored.project.screens[0].name, "Say hello");
});
