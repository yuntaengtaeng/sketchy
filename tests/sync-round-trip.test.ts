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
import type { ProjectDocument } from "../src/core/project-change.ts";
import { decideSync } from "../src/plugin/sync-decision.ts";

// Exercises the whole server-side contract the Plugin and an Agent share:
// connect -> agent apply -> plugin poll+pull -> plugin confirms the
// projection -> a genuine Figma edit -> agent applies again on top of it.
// The Plugin's own Figma canvas rendering (createElementNode, etc.) only
// runs inside the Figma sandbox and is out of reach here; this test stands
// in for it with the same decideSync + fetch contract the Plugin uses.
test("round-trips changes between an Agent and a Figma Plugin through the server", async () => {
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
  const headers = {
    authorization: "Bearer secret",
    "content-type": "application/json",
  };
  const get = (path: string) =>
    api(new Request(`https://sketchy.test${path}`, { headers }));
  const post = (path: string, body: unknown) =>
    api(
      new Request(`https://sketchy.test${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }),
    );
  const put = (path: string, body: unknown) =>
    api(
      new Request(`https://sketchy.test${path}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      }),
    );

  // 1. Figma Plugin connects a freshly drawn project.
  const initial: ProjectDocument = {
    id: "checkout-project",
    revision: 0,
    updatedAt: "2026-09-14T00:00:00.000Z",
    project: {
      settings: { screenPreset: "mobile" },
      screens: [{ id: "checkout", name: "Checkout", purpose: "Pay" }],
      elements: [],
      features: [],
    },
    figmaProjection: {
      fileKey: "figma-file",
      status: "synced",
      lastSyncedRevision: 0,
      nodes: { checkout: "1:2" },
    },
  };
  assert.equal((await post("/api/v1/projects", initial)).status, 201);
  let pluginRevision = 0;
  let lastSynced = 0;

  // 2. An Agent applies a change through the MCP-facing batch endpoint.
  const change = {
    projectId: initial.id,
    baseRevision: 0,
    idempotencyKey: "agent-add-confirmation",
    changes: [
      {
        type: "CREATE_SCREEN",
        screen: { id: "confirmation", name: "Confirmation", purpose: "Done" },
      },
    ],
  };
  const previewRes = await post(
    `/api/v1/projects/${initial.id}/previews`,
    change,
  );
  const preview = (await previewRes.json()) as { previewId: string };
  const applyRes = await post(`/api/v1/projects/${initial.id}/changes`, {
    ...change,
    previewId: preview.previewId,
  });
  assert.equal(applyRes.status, 200);

  // 3. Plugin polls the cheap summary and decides to pull.
  const summary = (await (
    await get(`/api/v1/projects/${initial.id}`)
  ).json()) as {
    revision: number;
    figmaProjection?: { status: string };
  };
  assert.equal(summary.revision, 1);
  assert.equal(
    decideSync(pluginRevision, summary.revision, lastSynced),
    "pull",
  );

  // 4. Plugin fetches the full document to reconstruct the canvas from.
  const pulled = (await (
    await get(`/api/v1/projects/${initial.id}/document`)
  ).json()) as ProjectDocument;
  assert.equal(pulled.revision, 1);
  assert.deepEqual(
    pulled.project.screens.map((screen) => screen.id),
    ["checkout", "confirmation"],
  );
  assert.equal(pulled.figmaProjection?.status, "pending");
  pluginRevision = pulled.revision;
  lastSynced = pulled.revision;

  // 5. Plugin confirms it applied that revision to the canvas.
  const confirmation = {
    projectId: initial.id,
    baseRevision: pulled.revision,
    idempotencyKey: `figma-sync-${initial.id}-${pulled.revision}`,
    changes: [
      {
        type: "RECORD_FIGMA_PROJECTION",
        projection: {
          fileKey: "figma-file",
          status: "synced",
          revision: pulled.revision,
          nodes: { checkout: "1:2", confirmation: "1:3" },
        },
      },
    ],
  };
  const confirmPreview = (await (
    await post(`/api/v1/projects/${initial.id}/previews`, confirmation)
  ).json()) as { previewId: string };
  const confirmApply = await post(`/api/v1/projects/${initial.id}/changes`, {
    ...confirmation,
    previewId: confirmPreview.previewId,
  });
  assert.equal(confirmApply.status, 200);

  const afterConfirm = (await (
    await get(`/api/v1/projects/${initial.id}/document`)
  ).json()) as ProjectDocument;
  assert.equal(afterConfirm.revision, 1, "confirming sync must not bump it");
  assert.equal(afterConfirm.figmaProjection?.status, "synced");
  assert.deepEqual(afterConfirm.figmaProjection?.nodes, {
    checkout: "1:2",
    confirmation: "1:3",
  });

  // 6. A designer edits the canvas directly; Plugin pushes the full doc.
  const edited: ProjectDocument = {
    ...afterConfirm,
    revision: afterConfirm.revision + 1,
    updatedAt: "2026-09-14T00:05:00.000Z",
    project: {
      ...afterConfirm.project,
      screens: afterConfirm.project.screens.map((screen) =>
        screen.id === "confirmation"
          ? { ...screen, name: "Order confirmed" }
          : screen,
      ),
    },
  };
  const pushRes = await put(`/api/v1/projects/${initial.id}`, edited);
  assert.equal(pushRes.status, 200);
  pluginRevision = edited.revision;
  lastSynced = edited.revision;

  // Agent picks the Figma edit up on its next read.
  const forAgent = (await (
    await get(`/api/v1/projects/${initial.id}`)
  ).json()) as { revision: number; screens: { id: string; name: string }[] };
  assert.equal(forAgent.revision, 2);
  assert.equal(
    forAgent.screens.find((s) => s.id === "confirmation")?.name,
    "Order confirmed",
  );

  // A stale local push (as if the Plugin still thought it was at rev 1)
  // must not be allowed to clobber the Figma edit that landed at rev 2.
  const stalePush = await put(`/api/v1/projects/${initial.id}`, {
    ...afterConfirm,
    revision: 2,
  });
  assert.equal(stalePush.status, 409);
});
