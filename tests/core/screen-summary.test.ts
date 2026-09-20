import assert from "node:assert/strict";
import test from "node:test";
import { screenSummary } from "../../src/core/screen-summary.ts";
import type { Project } from "../../src/shared/index.ts";

const project: Project = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [
    { id: "home", name: "Home", purpose: "", nodeId: "1:1" },
    { id: "dashboard", name: "Dashboard", purpose: "", nodeId: "1:2" },
  ],
  elements: [
    {
      id: "e1",
      screenId: "dashboard",
      name: "Save",
      type: "button",
      nodeId: "1:3",
    },
    {
      id: "e2",
      screenId: "dashboard",
      name: "Title",
      type: "text",
      nodeId: "1:4",
    },
    { id: "e3", screenId: "home", name: "Go", type: "button", nodeId: "1:5" },
  ],
  features: [
    {
      id: "f1",
      screenId: "home",
      name: "Go",
      action: { type: "navigate", destinationScreenId: "dashboard" },
    },
    {
      id: "f2",
      screenId: "dashboard",
      name: "Save",
      action: { type: "describe" },
    },
  ],
};

test("counts elements, outgoing behaviors, and incoming connections separately", () => {
  const summary = screenSummary(project, "dashboard");
  assert.deepEqual(summary, {
    elementCount: 2,
    behaviorCount: 1,
    incomingCount: 1,
  });
});

test("a screen with nothing pointing at it has zero incoming connections", () => {
  const summary = screenSummary(project, "home");
  assert.equal(summary.incomingCount, 0);
});

test("an unknown screen id counts as all zero rather than throwing", () => {
  const summary = screenSummary(project, "missing");
  assert.deepEqual(summary, {
    elementCount: 0,
    behaviorCount: 0,
    incomingCount: 0,
  });
});
