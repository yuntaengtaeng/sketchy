import assert from "node:assert/strict";
import test from "node:test";
import { createProjectDocument } from "../src/core/project-change.ts";
import type { Project } from "../src/shared/index.ts";

test("separates Sketchy entities from Figma node mappings", () => {
  const project: Project = {
    settings: { screenPreset: "mobile" },
    screens: [
      {
        id: "checkout",
        nodeId: "1:2",
        name: "Checkout",
        purpose: "Pay",
      },
    ],
    elements: [
      {
        id: "buy",
        nodeId: "1:3",
        screenId: "checkout",
        name: "Buy",
        type: "button",
      },
    ],
    features: [],
  };

  const document = createProjectDocument(
    project,
    { id: "project", revision: 2, updatedAt: "2026-09-12T00:00:00Z" },
    "figma-file",
  );

  assert.equal("nodeId" in document.project.screens[0], false);
  assert.equal("nodeId" in document.project.elements[0], false);
  assert.deepEqual(document.figmaProjection?.nodes, {
    checkout: "1:2",
    buy: "1:3",
  });
  assert.equal(document.figmaProjection?.lastSyncedRevision, 2);
});
