import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import * as z from "zod/v4";
import type { ProjectDocument } from "../src/core/project-change.ts";
import { applyChanges, previewChanges } from "../src/mcp/change-tools.ts";
import { readProjectDocument } from "../src/mcp/project-file.ts";
import { getProject, getScreen } from "../src/mcp/read-tools.ts";
import { projectChangeRequestSchema } from "../src/mcp/schemas.ts";

const document: ProjectDocument = {
  id: "checkout-project",
  revision: 4,
  updatedAt: "2026-09-12T00:00:00.000Z",
  project: {
    settings: { screenPreset: "mobile" },
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
  assert.equal(
    z.toJSONSchema(projectChangeRequestSchema).properties?.changes.maxItems,
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

  const applied = await applyChanges(file, previewId, request);
  const replayed = await applyChanges(file, previewId, request);
  const stored = await readProjectDocument(file);

  assert.equal(applied.applied, true);
  assert.equal(applied.idempotent, false);
  assert.equal(replayed.idempotent, true);
  assert.equal(stored.revision, 5);
  assert.equal(stored.project.screens.at(-1)?.id, "complete");
  assert.equal(stored.figmaProjection?.status, "pending");
});
