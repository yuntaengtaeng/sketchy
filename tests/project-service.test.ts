import assert from "node:assert/strict";
import test from "node:test";

import {
  ProjectService,
  ProjectServiceError,
  type ProjectPrincipal,
  type ProjectRecord,
  type ProjectStore,
} from "../src/api/project-service.ts";
import type {
  ProjectChangeRequest,
  ProjectDocument,
} from "../src/core/project-change.ts";

const document: ProjectDocument = {
  id: "project",
  revision: 0,
  updatedAt: "2026-09-13T00:00:00.000Z",
  project: {
    settings: { screenPreset: "mobile", showFlowArrows: true },
    screens: [{ id: "home", name: "Home", purpose: "Start" }],
    elements: [],
    features: [],
  },
};

const owner: ProjectPrincipal = {
  userId: "owner",
  scopes: new Set(["project:read", "project:write"]),
};

test("keeps ownership and revision checks at the Project service boundary", async () => {
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
      return [...records.values()].filter(
        (record) => record.ownerId === ownerId,
      );
    },
    async replace(record, expectedRevision) {
      const current = records.get(record.document.id);
      if (current?.document.revision !== expectedRevision) return false;
      records.set(record.document.id, record);
      return true;
    },
  };
  const service = new ProjectService(store);
  await service.create(owner, document);
  assert.deepEqual(
    (await service.listProjects(owner)).map((project) => project.id),
    ["project"],
  );

  const request: ProjectChangeRequest = {
    projectId: document.id,
    baseRevision: 0,
    idempotencyKey: "rename-home",
    changes: [
      { type: "UPDATE_SCREEN", screenId: "home", patch: { name: "Main" } },
    ],
  };
  const preview = await service.preview(owner, document.id, request);
  const applied = await service.apply(
    owner,
    document.id,
    preview.previewId,
    request,
  );

  assert.equal(applied.applied, true);
  assert.equal((await service.getProject(owner, document.id)).revision, 1);

  await assert.rejects(
    service.getProject({ ...owner, userId: "someone-else" }, document.id),
    (error: unknown) =>
      error instanceof ProjectServiceError &&
      error.status === 404 &&
      error.code === "PROJECT_NOT_FOUND",
  );

  records.get(document.id)!.document.revision = 2;
  const stalePreview = await service.preview(owner, document.id, {
    ...request,
    baseRevision: 2,
    idempotencyKey: "rename-again",
  });
  const originalReplace = store.replace;
  store.replace = async () => false;
  await assert.rejects(
    service.apply(owner, document.id, stalePreview.previewId, {
      ...request,
      baseRevision: 2,
      idempotencyKey: "rename-again",
    }),
    (error: unknown) =>
      error instanceof ProjectServiceError &&
      error.status === 409 &&
      error.code === "REVISION_CONFLICT",
  );
  store.replace = originalReplace;
});

test("syncs a Figma-authored document only when it targets the next revision", async () => {
  const records = new Map<string, ProjectRecord>();
  const store: ProjectStore = {
    async create(record) {
      records.set(record.document.id, record);
      return true;
    },
    async get(projectId) {
      return records.get(projectId);
    },
    async listByOwner() {
      return [];
    },
    async replace(record, expectedRevision) {
      const current = records.get(record.document.id);
      if (current?.document.revision !== expectedRevision) return false;
      records.set(record.document.id, record);
      return true;
    },
  };
  const service = new ProjectService(store);
  await service.create(owner, document);

  const batch: ProjectChangeRequest = {
    projectId: document.id,
    baseRevision: 0,
    idempotencyKey: "agent-rename",
    changes: [
      { type: "UPDATE_SCREEN", screenId: "home", patch: { name: "Landing" } },
    ],
  };
  const preview = await service.preview(owner, document.id, batch);
  await service.apply(owner, document.id, preview.previewId, batch);

  const next: ProjectDocument = {
    ...document,
    revision: 2,
    project: {
      ...document.project,
      screens: [{ id: "home", name: "Main", purpose: "Start" }],
    },
  };
  const synced = await service.sync(owner, document.id, next);
  assert.equal(synced.revision, 2);
  assert.equal(synced.screens[0].name, "Main");

  const replayed = await service.apply(
    owner,
    document.id,
    preview.previewId,
    batch,
  );
  assert.equal(replayed.applied, true);
  assert.equal((replayed as { idempotent: boolean }).idempotent, true);

  await assert.rejects(
    service.sync(owner, document.id, { ...next, revision: 4 }),
    (error: unknown) =>
      error instanceof ProjectServiceError &&
      error.status === 409 &&
      error.code === "REVISION_CONFLICT",
  );
  await assert.rejects(
    service.sync(owner, document.id, { ...next, revision: 2 }),
    (error: unknown) =>
      error instanceof ProjectServiceError &&
      error.status === 409 &&
      error.code === "REVISION_CONFLICT",
  );
});
