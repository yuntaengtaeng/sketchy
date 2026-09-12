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
      screens: [{ id: "home", name: "Welcome", purpose: "Start" }],
    },
    figmaProjection: {
      fileKey: "file",
      status: "pending",
      nodes: {},
    },
  };

  const preview = previewProjectImport(current, JSON.stringify(imported));

  assert.equal(preview.valid, true);
  assert.deepEqual(preview.summary, ["Update screen Home: name"]);
  assert.equal(current.project.screens[0].name, "Home");
  assert.equal(
    previewProjectImport(current, JSON.stringify(current)).valid,
    false,
  );

  imported.project.elements = [
    ...imported.project.elements,
    {
      id: "new-element",
      screenId: "home",
      name: "New",
      type: "text",
    },
  ];
  const unsupported = previewProjectImport(current, JSON.stringify(imported));
  assert.equal(unsupported.valid, true);
  assert.deepEqual(unsupported.summary, [
    "Update screen Home: name",
    "Add 1 element",
  ]);
});

test("allows new elements in an existing screen and validates their parents", () => {
  const imported = structuredClone(current);
  imported.revision = 3;
  imported.project.elements = [
    {
      id: "nested-button",
      screenId: "home",
      parentElementId: "section",
      name: "Continue",
      type: "button",
    },
    {
      id: "section",
      screenId: "home",
      name: "Actions",
      type: "section",
    },
  ];

  assert.equal(
    previewProjectImport(current, JSON.stringify(imported)).valid,
    true,
  );

  imported.project.elements[0].parentElementId = "missing";
  assert.deepEqual(
    previewProjectImport(current, JSON.stringify(imported)).errors,
    ["Parent element does not exist."],
  );
});

test("allows a new screen and its elements in the same import", () => {
  const imported = structuredClone(current);
  imported.revision = 3;
  imported.project.screens.push({
    id: "details",
    name: "Details",
    purpose: "Show product details",
  });
  imported.project.elements.push({
    id: "title",
    screenId: "details",
    name: "Product",
    type: "text",
  });

  const preview = previewProjectImport(current, JSON.stringify(imported));

  assert.equal(preview.valid, true);
  assert.deepEqual(preview.summary, ["Add 1 screen", "Add 1 element"]);
});

test("allows editable element fields but rejects element structure changes", () => {
  const source = structuredClone(current);
  source.project.elements.push({
    id: "button",
    screenId: "home",
    name: "Continue",
    type: "button",
    buttonVariant: "filled",
  });
  const renamed = structuredClone(source);
  renamed.revision = 3;
  renamed.project.elements[0].name = "Buy now";
  renamed.project.elements[0].buttonVariant = "outline";

  assert.equal(
    previewProjectImport(source, JSON.stringify(renamed)).valid,
    true,
  );

  renamed.project.elements[0].screenId = "other";
  assert.deepEqual(
    previewProjectImport(source, JSON.stringify(renamed)).errors,
    ["Element structure or type changes are not supported."],
  );
});

test("allows a button default action but rejects conditional cases", () => {
  const source = structuredClone(current);
  source.project.screens.push({
    id: "details",
    name: "Details",
    purpose: "",
  });
  source.project.elements.push({
    id: "button",
    screenId: "home",
    name: "Continue",
    type: "button",
  });
  const imported = structuredClone(source);
  imported.revision = 3;
  imported.project.features.push({
    id: "continue-action",
    screenId: "home",
    name: "Continue",
    trigger: { type: "click", elementId: "button" },
    action: { type: "navigate", destinationScreenId: "details" },
  });

  assert.equal(
    previewProjectImport(source, JSON.stringify(imported)).valid,
    true,
  );

  imported.project.features[0].condition = "When signed in";
  assert.deepEqual(
    previewProjectImport(source, JSON.stringify(imported)).errors,
    ["Only a button's default action can be changed for now."],
  );
});

test("allows removing only a button default action", () => {
  const source = structuredClone(current);
  source.project.elements.push({
    id: "button",
    screenId: "home",
    name: "Continue",
    type: "button",
  });
  source.project.features.push({
    id: "continue-action",
    screenId: "home",
    name: "Continue",
    trigger: { type: "click", elementId: "button" },
    action: { type: "describe" },
  });
  const imported = structuredClone(source);
  imported.revision = 3;
  imported.project.features = [];

  assert.equal(
    previewProjectImport(source, JSON.stringify(imported)).valid,
    true,
  );

  source.project.features[0].condition = "When signed in";
  assert.deepEqual(
    previewProjectImport(source, JSON.stringify(imported)).errors,
    ["Only a button's default action can be changed for now."],
  );
});

test("allows deleting an element tree and its actions but keeps popup roots", () => {
  const source = structuredClone(current);
  source.project.elements = [
    {
      id: "section",
      screenId: "home",
      name: "Actions",
      type: "section",
    },
    {
      id: "button",
      screenId: "home",
      parentElementId: "section",
      name: "Continue",
      type: "button",
    },
  ];
  source.project.features = [
    {
      id: "continue-action",
      screenId: "home",
      name: "Continue",
      trigger: { type: "click", elementId: "button" },
      action: { type: "describe" },
    },
  ];
  const imported = structuredClone(source);
  imported.revision = 3;
  imported.project.elements = [];
  imported.project.features = [];

  const preview = previewProjectImport(source, JSON.stringify(imported));
  assert.equal(preview.valid, true);
  assert.deepEqual(preview.summary, ["Remove 2 elements", "Remove 1 action"]);

  source.project.elements[0].role = "popup";
  assert.deepEqual(
    previewProjectImport(source, JSON.stringify(imported)).errors,
    ["The popup itself is required."],
  );
});

test("allows deleting a screen with its contents and incoming action", () => {
  const source = structuredClone(current);
  source.project.screens.push({
    id: "details",
    name: "Details",
    purpose: "",
  });
  source.project.elements.push(
    {
      id: "open-details",
      screenId: "home",
      name: "Details",
      type: "button",
    },
    {
      id: "details-title",
      screenId: "details",
      name: "Product",
      type: "text",
    },
  );
  source.project.features.push({
    id: "details-action",
    screenId: "home",
    name: "Details",
    trigger: { type: "click", elementId: "open-details" },
    action: { type: "navigate", destinationScreenId: "details" },
  });
  const imported = structuredClone(source);
  imported.revision = 3;
  imported.project.screens = imported.project.screens.filter(
    (screen) => screen.id !== "details",
  );
  imported.project.elements = imported.project.elements.filter(
    (element) => element.screenId !== "details",
  );
  imported.project.features = [];

  const preview = previewProjectImport(source, JSON.stringify(imported));
  assert.equal(preview.valid, true);
  assert.deepEqual(preview.summary, [
    "Remove 1 screen",
    "Remove 1 element",
    "Remove 1 action",
  ]);
});

test("rejects malformed editable element fields at the import boundary", () => {
  const imported = structuredClone(current) as unknown as Record<
    string,
    unknown
  >;
  imported.revision = 3;
  const project = imported.project as ProjectDocument["project"];
  project.elements.push({
    id: "button",
    screenId: "home",
    name: "Continue",
    type: "button",
    buttonVariant: "filled",
  });
  (project.elements[0] as unknown as Record<string, unknown>).buttonVariant =
    "transparent";

  assert.deepEqual(previewProjectImport(current, JSON.stringify(imported)), {
    valid: false,
    summary: [],
    errors: ["File is not a Sketchy project."],
    warnings: [],
  });
});
