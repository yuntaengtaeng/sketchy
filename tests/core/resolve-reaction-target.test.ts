import assert from "node:assert/strict";
import test from "node:test";

import {
  destinationNodeId,
  resolveReactionTarget,
} from "../../src/core/resolve-reaction-target.ts";
import type { Project } from "../../src/shared/index.ts";

const project: Project = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [
    { id: "home", name: "Home", purpose: "", nodeId: "1:1" },
    {
      id: "toast-1",
      name: "Home · Toast 1",
      purpose: "",
      nodeId: "1:2",
      kind: "toast",
      baseScreenId: "home",
    },
  ],
  elements: [],
  features: [],
};

test("no primary case means no reaction to wire", () => {
  const target = resolveReactionTarget(project, undefined);
  assert.deepEqual(target, {
    kind: "navigate",
    nodeId: undefined,
    navigation: "NAVIGATE",
  });
});

test("close-overlay resolves to a close target regardless of destination", () => {
  const target = resolveReactionTarget(project, {
    id: "f1",
    screenId: "home",
    name: "Close",
    action: { type: "close-overlay" },
  });
  assert.deepEqual(target, { kind: "close" });
});

test("overlay and toast both resolve to an OVERLAY navigation", () => {
  const toastTarget = resolveReactionTarget(project, {
    id: "f1",
    screenId: "home",
    name: "Save",
    action: { type: "toast", destinationScreenId: "toast-1" },
  });
  assert.deepEqual(toastTarget, {
    kind: "navigate",
    nodeId: "1:2",
    navigation: "OVERLAY",
  });
});

test("navigate resolves to a NAVIGATE target", () => {
  const target = resolveReactionTarget(project, {
    id: "f1",
    screenId: "toast-1",
    name: "Go home",
    action: { type: "navigate", destinationScreenId: "home" },
  });
  assert.deepEqual(target, {
    kind: "navigate",
    nodeId: "1:1",
    navigation: "NAVIGATE",
  });
});

test("destinationNodeId is undefined for actions without a destination", () => {
  assert.equal(destinationNodeId(project, { type: "describe" }), undefined);
  assert.equal(
    destinationNodeId(project, { type: "close-overlay" }),
    undefined,
  );
});
