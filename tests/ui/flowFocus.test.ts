import assert from "node:assert/strict";
import test from "node:test";
import type { Project } from "../../src/shared/index.ts";
import { flowFocus } from "../../src/ui/features/flow/utils/flowFocus.ts";

const project: Project = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [
    { id: "home", nodeId: "1:1", name: "Home", purpose: "" },
    { id: "cart", nodeId: "1:2", name: "Cart", purpose: "" },
    { id: "done", nodeId: "1:3", name: "Done", purpose: "" },
  ],
  elements: [],
  features: [
    {
      id: "to-cart",
      screenId: "home",
      name: "Cart",
      action: { type: "navigate", destinationScreenId: "cart" },
    },
    {
      id: "to-done",
      screenId: "cart",
      name: "Checkout",
      action: { type: "navigate", destinationScreenId: "done" },
    },
    {
      id: "describe-home",
      screenId: "home",
      name: "Explain",
      action: { type: "describe" },
    },
  ],
};

test("focus includes incoming and outgoing connections for one screen", () => {
  const focus = flowFocus(project, "cart");
  assert.deepEqual([...focus.screenIds], ["cart", "home", "done"]);
  assert.deepEqual([...focus.featureIds], ["to-cart", "to-done"]);
});

test("focus includes a selected screen feature without a destination", () => {
  const focus = flowFocus(project, "home");
  assert.ok(focus.featureIds.has("describe-home"));
});
