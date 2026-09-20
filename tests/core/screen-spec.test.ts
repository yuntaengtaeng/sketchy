import assert from "node:assert/strict";
import test from "node:test";
import { buildScreenSpec } from "../../src/core/screen-spec.ts";
import type { Project } from "../../src/shared/index.ts";

const project: Project = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [
    { id: "home", nodeId: "1:1", name: "Home", purpose: "Start here" },
    { id: "checkout", nodeId: "1:2", name: "Checkout", purpose: "" },
  ],
  elements: [
    {
      id: "buy",
      nodeId: "1:3",
      screenId: "home",
      name: "Buy",
      type: "button",
    },
  ],
  features: [
    {
      id: "buy-action",
      screenId: "home",
      name: "Buy",
      trigger: { type: "click", elementId: "buy" },
      action: { type: "navigate", destinationScreenId: "checkout" },
      condition: "In stock",
      description: "Starts checkout",
    },
  ],
};

test("builds structured behavior from a linked feature", () => {
  const spec = buildScreenSpec(project, project.screens[0]);
  assert.deepEqual(spec.behaviors, [
    {
      id: "buy-action",
      name: "Buy",
      trigger: "Click Buy",
      condition: "In stock",
      result: "Go to Checkout",
      note: "Starts checkout",
      needsAttention: false,
    },
  ]);
  assert.deepEqual(spec.issues, []);
});

test("reports missing screen content and incoming connection", () => {
  const spec = buildScreenSpec(project, project.screens[1]);
  assert.deepEqual(
    spec.issues.map((issue) => issue.code),
    ["purpose-missing", "elements-missing"],
  );

  const withoutIncoming: Project = { ...project, features: [] };
  const disconnected = buildScreenSpec(
    withoutIncoming,
    withoutIncoming.screens[1],
  );
  assert.ok(
    disconnected.issues.some((issue) => issue.code === "incoming-missing"),
  );
});

test("reports each missing behavior input without browser or Figma mocks", () => {
  const incomplete: Project = {
    ...project,
    features: [
      {
        id: "incomplete",
        screenId: "home",
        name: "Buy",
        action: { type: "navigate" },
      },
    ],
  };
  const spec = buildScreenSpec(incomplete, incomplete.screens[0]);
  assert.deepEqual(
    spec.issues.map((issue) => issue.code),
    ["trigger-missing", "destination-missing"],
  );
  assert.equal(spec.behaviors[0].result, "Destination needed");
  assert.equal(spec.behaviors[0].needsAttention, true);
});
