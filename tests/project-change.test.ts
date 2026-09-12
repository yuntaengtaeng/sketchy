import assert from "node:assert/strict";
import test from "node:test";
import type {
  ProjectChangeRequest,
  ProjectDocument,
} from "../src/core/project-change.ts";
import { previewProjectChanges } from "../src/core/validate-project-changes.ts";

const document = (): ProjectDocument => ({
  id: "project",
  revision: 3,
  updatedAt: "2026-09-12T00:00:00.000Z",
  project: {
    settings: { screenPreset: "mobile" },
    screens: [],
    elements: [],
    features: [],
  },
});

test("previews a valid batch without changing the source project", () => {
  const source = document();
  const request = {
    projectId: "project",
    baseRevision: 3,
    idempotencyKey: "create-flow",
    changes: [
      {
        type: "CREATE_SCREEN",
        screen: { id: "list", name: "List", purpose: "Browse" },
      },
      {
        type: "CREATE_SCREEN",
        screen: { id: "detail", name: "Detail", purpose: "Review" },
      },
      {
        type: "ADD_ELEMENT",
        element: {
          id: "open-detail",
          screenId: "list",
          name: "Open detail",
          type: "button",
        },
      },
      {
        type: "SET_ELEMENT_ACTION",
        featureId: "feature-open-detail",
        elementId: "open-detail",
        action: { type: "navigate", destinationScreenId: "detail" },
      },
      {
        type: "UPDATE_ELEMENT",
        elementId: "open-detail",
        patch: { name: "View product" },
      },
    ],
  } satisfies ProjectChangeRequest;

  const preview = previewProjectChanges(source, request);

  assert.equal(preview.valid, true);
  assert.equal(preview.nextProject?.screens.length, 2);
  assert.equal(preview.nextProject?.features.length, 1);
  assert.equal(preview.nextProject?.features[0].name, "View product");
  assert.equal(source.project.screens.length, 0);
});

test("rejects the whole preview when section depth or trigger is invalid", () => {
  const request = {
    projectId: "project",
    baseRevision: 3,
    idempotencyKey: "invalid-flow",
    changes: [
      {
        type: "CREATE_SCREEN",
        screen: { id: "form", name: "Form", purpose: "Submit" },
      },
      {
        type: "ADD_ELEMENT",
        element: {
          id: "outer",
          screenId: "form",
          name: "Outer",
          type: "section",
        },
      },
      {
        type: "ADD_ELEMENT",
        element: {
          id: "inner",
          screenId: "form",
          parentElementId: "outer",
          name: "Inner",
          type: "section",
        },
      },
      {
        type: "ADD_ELEMENT",
        element: {
          id: "too-deep",
          screenId: "form",
          parentElementId: "inner",
          name: "Too deep",
          type: "section",
        },
      },
      {
        type: "ADD_ELEMENT",
        element: {
          id: "email",
          screenId: "form",
          name: "Email",
          type: "input",
        },
      },
      {
        type: "SET_ELEMENT_ACTION",
        featureId: "feature-email",
        elementId: "email",
        action: { type: "describe" },
      },
    ],
  } satisfies ProjectChangeRequest;

  const preview = previewProjectChanges(document(), request);

  assert.equal(preview.valid, false);
  assert.equal(preview.nextProject, undefined);
  assert.deepEqual(
    preview.errors.map((issue) => issue.code),
    ["SECTION_DEPTH_EXCEEDED", "TRIGGER_NOT_SUPPORTED"],
  );
});

test("rejects a stale revision before producing an applicable project", () => {
  const preview = previewProjectChanges(document(), {
    projectId: "project",
    baseRevision: 2,
    idempotencyKey: "stale",
    changes: [
      {
        type: "CREATE_SCREEN",
        screen: { id: "screen", name: "Screen", purpose: "" },
      },
    ],
  });

  assert.equal(preview.valid, false);
  assert.equal(preview.errors[0].code, "REVISION_CONFLICT");
  assert.equal(preview.nextProject, undefined);
});

test("requires a destination for navigation", () => {
  const source = document();
  source.project.screens.push({ id: "screen", name: "Screen", purpose: "" });
  source.project.elements.push({
    id: "button",
    screenId: "screen",
    name: "Continue",
    type: "button",
  });

  const preview = previewProjectChanges(source, {
    projectId: "project",
    baseRevision: 3,
    idempotencyKey: "missing-destination",
    changes: [
      {
        type: "SET_ELEMENT_ACTION",
        featureId: "continue",
        elementId: "button",
        action: { type: "navigate" },
      },
    ],
  });

  assert.equal(preview.valid, false);
  assert.equal(preview.errors[0].code, "DESTINATION_REQUIRED");
});

test("clears only the default element action", () => {
  const source = document();
  source.project.screens.push({ id: "screen", name: "Screen", purpose: "" });
  source.project.elements.push({
    id: "button",
    screenId: "screen",
    name: "Continue",
    type: "button",
  });
  source.project.features.push(
    {
      id: "default",
      screenId: "screen",
      name: "Continue",
      trigger: { type: "click", elementId: "button" },
      action: { type: "describe" },
    },
    {
      id: "case",
      screenId: "screen",
      name: "Continue",
      condition: "When signed in",
      trigger: { type: "click", elementId: "button" },
      action: { type: "describe" },
    },
  );

  const preview = previewProjectChanges(source, {
    projectId: "project",
    baseRevision: 3,
    idempotencyKey: "clear-action",
    changes: [{ type: "CLEAR_ELEMENT_ACTION", elementId: "button" }],
  });

  assert.equal(preview.valid, true);
  assert.deepEqual(
    preview.nextProject?.features.map((feature) => feature.id),
    ["case"],
  );
});

test("case tools cannot update or remove the default action", () => {
  const source = document();
  source.project.screens.push({ id: "screen", name: "Screen", purpose: "" });
  source.project.elements.push({
    id: "button",
    screenId: "screen",
    name: "Continue",
    type: "button",
  });
  source.project.features.push({
    id: "default",
    screenId: "screen",
    name: "Continue",
    trigger: { type: "click", elementId: "button" },
    action: { type: "describe" },
  });

  const preview = previewProjectChanges(source, {
    projectId: "project",
    baseRevision: 3,
    idempotencyKey: "protect-default",
    changes: [
      {
        type: "UPDATE_ELEMENT_CASE",
        featureId: "default",
        patch: { description: "Changed" },
      },
      { type: "REMOVE_ELEMENT_CASE", featureId: "default" },
    ],
  });

  assert.deepEqual(
    preview.errors.map((issue) => issue.code),
    ["CASE_NOT_FOUND", "CASE_NOT_FOUND"],
  );
});
