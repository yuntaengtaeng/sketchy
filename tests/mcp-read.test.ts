import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import * as z from "zod/v4";
import type {
  ProjectChangeRequest,
  ProjectDocument,
} from "../src/core/project-change.ts";
import { applyChanges, previewChanges } from "../src/mcp/change-tools.ts";
import {
  readProjectDocument,
  writeProjectDocument,
} from "../src/mcp/project-file.ts";
import { getProject, getScreen } from "../src/mcp/read-tools.ts";
import { projectChangeRequestSchema } from "../src/mcp/schemas.ts";

const document: ProjectDocument = {
  id: "checkout-project",
  revision: 4,
  updatedAt: "2026-09-12T00:00:00.000Z",
  project: {
    settings: { screenPreset: "mobile", showFlowArrows: true },
    screens: [{ id: "checkout", name: "Checkout", purpose: "Pay" }],
    elements: [
      {
        id: "buy",
        screenId: "checkout",
        name: "Buy",
        type: "button",
      },
    ],
    features: [
      {
        id: "buy-action",
        screenId: "checkout",
        name: "Buy",
        trigger: { type: "click", elementId: "buy" },
        action: { type: "describe" },
      },
    ],
  },
  figmaProjection: {
    fileKey: "figma-file",
    status: "synced",
    lastSyncedRevision: 4,
    nodes: { checkout: "1:2", buy: "1:3" },
  },
};

test("reads one canonical project and exposes project and screen views", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sketchy-mcp-"));
  const file = join(directory, "project.json");
  await writeFile(file, JSON.stringify(document));

  const stored = await readProjectDocument(file);
  const project = getProject(stored);
  const screen = getScreen(stored, "checkout");

  assert.equal(project.revision, 4);
  assert.deepEqual(
    project.screens.map((item) => item.id),
    ["checkout"],
  );
  assert.deepEqual(
    screen.elements.map((item) => item.id),
    ["buy"],
  );
  assert.deepEqual(
    screen.features.map((item) => item.id),
    ["buy-action"],
  );
  assert.deepEqual(screen.figmaNodes, { checkout: "1:2", buy: "1:3" });
  assert.throws(() => getScreen(stored, "missing"), /does not exist/);

  await writeFile(file, JSON.stringify({ ...document, project: {} }));
  await assert.rejects(readProjectDocument(file), /Invalid Sketchy project/);
});

test("returns a stable preview without changing the stored project", () => {
  const request = {
    projectId: document.id,
    baseRevision: document.revision,
    idempotencyKey: "add-confirmation",
    changes: [
      {
        type: "CREATE_SCREEN" as const,
        screen: {
          id: "confirmation",
          name: "Confirmation",
          purpose: "Confirm payment",
        },
      },
    ],
  };

  const first = previewChanges(document, request);
  const second = previewChanges(document, request);

  assert.equal(projectChangeRequestSchema.safeParse(request).success, true);
  const changesSchema = z.toJSONSchema(projectChangeRequestSchema).properties
    ?.changes;
  assert.equal(
    typeof changesSchema === "object" ? changesSchema.maxItems : undefined,
    200,
  );
  assert.equal(first.valid, true);
  assert.equal(first.previewId, second.previewId);
  assert.deepEqual(first.summary, ["Create screen Confirmation"]);
  assert.equal(document.project.screens.length, 1);
  assert.equal(
    projectChangeRequestSchema.safeParse({
      ...request,
      changes: [{ type: "UPDATE_SCREEN", screenId: "checkout", patch: {} }],
    }).success,
    false,
  );
});

test("applies an approved batch once and marks Figma projection pending", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sketchy-apply-"));
  const file = join(directory, "project.json");
  await writeFile(file, JSON.stringify(document));
  const request = {
    projectId: document.id,
    baseRevision: document.revision,
    idempotencyKey: "add-complete",
    changes: [
      {
        type: "CREATE_SCREEN" as const,
        screen: {
          id: "complete",
          name: "Complete",
          purpose: "Finish payment",
        },
      },
    ],
  };
  const previewId = previewChanges(document, request).previewId;

  const applied = await applyToFile(file, previewId, request);
  const replayed = await applyToFile(file, previewId, request);
  const stored = await readProjectDocument(file);

  assert.ok(applied.applied);
  assert.equal(applied.idempotent, false);
  assert.ok(replayed.applied);
  assert.equal(replayed.idempotent, true);
  assert.equal(stored.revision, 5);
  assert.equal(stored.project.screens.at(-1)?.id, "complete");
  assert.equal(stored.figmaProjection?.status, "pending");
});

test("keeps a create, edit, action, and delete workflow atomic across revisions", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sketchy-workflow-"));
  const file = join(directory, "project.json");
  await writeFile(file, JSON.stringify(document));

  const apply = async (request: ProjectChangeRequest) => {
    const current = await readProjectDocument(file);
    const preview = previewChanges(current, request);
    assert.equal(preview.valid, true);
    const result = await applyToFile(file, preview.previewId, request);
    assert.ok(result.applied);
    return result;
  };
  const created = {
    projectId: document.id,
    baseRevision: 4,
    idempotencyKey: "workflow-create",
    changes: [
      {
        type: "CREATE_SCREEN" as const,
        screen: { id: "done", name: "Done", purpose: "Finish" },
      },
      {
        type: "ADD_ELEMENT" as const,
        element: {
          id: "receipt",
          screenId: "done",
          name: "Receipt",
          type: "text" as const,
        },
      },
    ],
  };
  assert.equal((await apply(created)).revision, 5);
  const replayed = await applyToFile(
    file,
    previewChanges(document, created).previewId,
    created,
  );
  assert.ok(replayed.applied);
  assert.equal(replayed.idempotent, true);

  const edited = {
    projectId: document.id,
    baseRevision: 5,
    idempotencyKey: "workflow-edit",
    changes: [
      {
        type: "UPDATE_SCREEN" as const,
        screenId: "done",
        patch: { name: "Order complete" },
      },
      {
        type: "UPDATE_ELEMENT" as const,
        elementId: "buy",
        patch: { name: "Place order", buttonVariant: "outline" as const },
      },
      {
        type: "SET_ELEMENT_ACTION" as const,
        featureId: "buy-action",
        elementId: "buy",
        action: { type: "navigate" as const, destinationScreenId: "done" },
      },
      {
        type: "ADD_ELEMENT_CASE" as const,
        elementId: "buy",
        case: {
          id: "buy-error",
          condition: "Payment fails",
          description: "Show an error",
          action: { type: "describe" as const },
        },
      },
    ],
  };
  assert.equal((await apply(edited)).revision, 6);

  const removed = {
    projectId: document.id,
    baseRevision: 6,
    idempotencyKey: "workflow-delete",
    changes: [
      { type: "DELETE_SCREEN" as const, screenId: "done" },
      { type: "DELETE_ELEMENT" as const, elementId: "buy" },
    ],
  };
  assert.equal((await apply(removed)).revision, 7);

  const stored = await readProjectDocument(file);
  assert.deepEqual(
    stored.project.screens.map(({ id }) => id),
    ["checkout"],
  );
  assert.deepEqual(stored.project.elements, []);
  assert.deepEqual(stored.project.features, []);
  assert.equal(stored.figmaProjection?.status, "pending");
  assert.deepEqual(stored.figmaProjection?.nodes, { checkout: "1:2" });
});

test("records a Figma projection confirmation without touching the project", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sketchy-projection-"));
  const file = join(directory, "project.json");
  const pending: ProjectDocument = {
    ...document,
    figmaProjection: { ...document.figmaProjection!, status: "pending" },
  };
  await writeFile(file, JSON.stringify(pending));
  const request = {
    projectId: document.id,
    baseRevision: pending.revision,
    idempotencyKey: "confirm-projection",
    changes: [
      {
        type: "RECORD_FIGMA_PROJECTION" as const,
        projection: {
          fileKey: "figma-file",
          status: "synced" as const,
          revision: pending.revision,
          nodes: { checkout: "1:2", buy: "1:3" },
        },
      },
    ],
  };
  const previewId = previewChanges(pending, request).previewId;

  const applied = await applyToFile(file, previewId, request);
  const stored = await readProjectDocument(file);

  assert.ok(applied.applied);
  assert.equal(stored.revision, pending.revision);
  assert.equal((applied as { revision: number }).revision, pending.revision);
  assert.deepEqual(stored.project, pending.project);
  assert.equal(stored.figmaProjection?.status, "synced");
  assert.equal(stored.figmaProjection?.lastSyncedRevision, pending.revision);
  assert.deepEqual(stored.figmaProjection?.nodes, {
    checkout: "1:2",
    buy: "1:3",
  });
});

test("does not trust a projection confirmation mixed into a content-changing batch", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sketchy-mixed-batch-"));
  const file = join(directory, "project.json");
  await writeFile(file, JSON.stringify(document));
  const request = {
    projectId: document.id,
    baseRevision: document.revision,
    idempotencyKey: "mixed-batch",
    changes: [
      {
        type: "UPDATE_SCREEN" as const,
        screenId: "checkout",
        patch: { name: "Checkout page" },
      },
      {
        type: "RECORD_FIGMA_PROJECTION" as const,
        projection: {
          fileKey: "figma-file",
          status: "synced" as const,
          revision: document.revision,
          nodes: { checkout: "1:2", buy: "1:3" },
        },
      },
    ],
  };
  const previewId = previewChanges(document, request).previewId;

  const applied = await applyToFile(file, previewId, request);
  const stored = await readProjectDocument(file);

  assert.ok(applied.applied);
  // Content changed alongside the confirmation, so the batch's own revision
  // must advance and the projection must not be trusted as synced - the new
  // screen name was never actually confirmed on the Figma canvas.
  assert.equal(stored.revision, document.revision + 1);
  assert.equal(stored.figmaProjection?.status, "pending");
});

async function applyToFile(
  file: string,
  previewId: string,
  request: ProjectChangeRequest,
) {
  const applied = applyChanges(
    await readProjectDocument(file),
    previewId,
    request,
  );
  if (applied.nextDocument)
    await writeProjectDocument(applied.nextDocument, file);
  return applied.result;
}
