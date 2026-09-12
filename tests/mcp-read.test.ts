import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { ProjectDocument } from "../src/core/project-change.ts";
import { readProjectDocument } from "../src/mcp/project-file.ts";
import { getProject, getScreen } from "../src/mcp/read-tools.ts";

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
