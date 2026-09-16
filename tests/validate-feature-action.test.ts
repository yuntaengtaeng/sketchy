import assert from "node:assert/strict";
import test from "node:test";

import type { CanonicalProject } from "../src/core/project-change.ts";
import { validateFeatureAction } from "../src/core/validate-feature-action.ts";

const project: CanonicalProject = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [
    { id: "screen", name: "Screen", purpose: "" },
    {
      id: "popup",
      name: "Popup",
      purpose: "",
      kind: "popup",
      baseScreenId: "screen",
    },
  ],
  elements: [
    {
      id: "popup-root",
      screenId: "popup",
      name: "Popup",
      type: "section",
      role: "popup",
    },
    {
      id: "section",
      screenId: "popup",
      name: "Section",
      type: "section",
      parentElementId: "popup-root",
    },
    {
      id: "button",
      screenId: "popup",
      name: "Close",
      type: "button",
      parentElementId: "section",
    },
  ],
  features: [],
};

test("shares action rules while allowing the Plugin to create an overlay", () => {
  const button = project.elements[2];
  const screenButton = {
    ...button,
    screenId: "screen",
    parentElementId: undefined,
  };

  assert.equal(
    validateFeatureAction(project, screenButton, { type: "navigate" })?.code,
    "DESTINATION_REQUIRED",
  );
  assert.equal(
    validateFeatureAction(project, screenButton, { type: "overlay" }, true),
    undefined,
  );
  assert.equal(
    validateFeatureAction(project, button, { type: "close-overlay" }),
    undefined,
  );
});
