import assert from "node:assert/strict";
import test from "node:test";
import { previewProjectImport } from "../src/core/project-import.ts";
import type { ProjectDocument } from "../src/core/project-change.ts";

const current: ProjectDocument = {
  id: "project",
  revision: 2,
  updatedAt: "2026-09-12T00:00:00Z",
  project: {
    settings: { screenPreset: "mobile" },
    screens: [{ id: "home", name: "Home", purpose: "Start" }],
    elements: [],
    features: [],
  },
};

test("previews a newer import without changing the current project", () => {
  const imported: ProjectDocument = {
    ...current,
    revision: 3,
    project: {
      ...current.project,
      screens: [
        { id: "home", name: "Welcome", purpose: "Start" },
        { id: "detail", name: "Detail", purpose: "Review" },
      ],
    },
    figmaProjection: {
      fileKey: "file",
      status: "pending",
      nodes: {},
    },
  };

  const preview = previewProjectImport(current, JSON.stringify(imported));

  assert.equal(preview.valid, true);
  assert.deepEqual(preview.summary, [
    "Add 1 screen",
    "Update screen Home: name",
  ]);
  assert.equal(current.project.screens[0].name, "Home");
  assert.equal(
    previewProjectImport(current, JSON.stringify(current)).valid,
    false,
  );
});
