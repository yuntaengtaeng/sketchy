import assert from "node:assert/strict";
import test from "node:test";

import {
  migrateStoredProject,
  parseStoredProject,
} from "../src/plugin/storage/project-migration.ts";

test("parses and migrates legacy project actions and interactions", () => {
  const featureProject = migrateStoredProject(
    parseStoredProject(
      JSON.stringify({
        settings: { screenPreset: "desktop" },
        features: [
          {
            id: "feature",
            screenId: "screen",
            name: "Button",
            sourceElementId: "button",
            action: { type: "set-state" },
          },
        ],
      }),
    ),
  );
  assert.deepEqual(featureProject.features[0], {
    id: "feature",
    screenId: "screen",
    name: "Button",
    trigger: { type: "click", elementId: "button" },
    action: { type: "describe" },
  });
  assert.equal(featureProject.settings.screenPreset, "desktop");
  assert.equal(featureProject.settings.showFlowArrows, true);

  const interactionProject = migrateStoredProject({
    settings: { screenPreset: "mobile", showFlowArrows: true },
    elements: [
      {
        id: "button",
        nodeId: "1:2",
        screenId: "screen",
        name: "Continue",
        type: "button",
      },
    ],
    interactions: [
      {
        id: "interaction",
        sourceElementId: "button",
        destinationScreenId: "next",
      },
    ],
  });
  assert.deepEqual(interactionProject.features[0], {
    id: "interaction",
    screenId: "screen",
    name: "Continue",
    trigger: { type: "click", elementId: "button" },
    action: { type: "navigate", destinationScreenId: "next" },
  });
});

test("drops elements from deleted block types and strips deleted element fields", () => {
  const project = migrateStoredProject(
    parseStoredProject(
      JSON.stringify({
        settings: { screenPreset: "mobile" },
        elements: [
          {
            id: "nav",
            nodeId: "1:1",
            screenId: "screen",
            name: "Navigation",
            type: "navigation",
          },
          {
            id: "button",
            nodeId: "1:2",
            screenId: "screen",
            name: "Continue",
            type: "button",
            buttonVariant: "filled",
            layout: "center",
          },
        ],
      }),
    ),
  );
  assert.deepEqual(project.elements, [
    {
      id: "button",
      nodeId: "1:2",
      screenId: "screen",
      name: "Continue",
      type: "button",
      buttonVariant: "filled",
    },
  ]);
});
