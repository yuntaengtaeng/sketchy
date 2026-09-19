import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProjectFlowDiagram,
  buildProjectMarkdown,
  describeFeature,
  outlineElements,
} from "../../src/ui/features/spec/utils/describe.ts";
import type { Project } from "../../src/shared/index.ts";

const project: Project = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [
    {
      id: "detail",
      name: "Product detail",
      purpose: "Show one product",
      nodeId: "1:1",
    },
    { id: "order", name: "Order", purpose: "Confirm the order", nodeId: "1:5" },
  ],
  elements: [
    {
      id: "review",
      screenId: "detail",
      name: "Review",
      type: "section",
      nodeId: "1:2",
    },
    {
      id: "rating",
      screenId: "detail",
      parentElementId: "review",
      name: "Rating",
      type: "text",
      description: "4.8",
      order: 0,
      nodeId: "1:3",
    },
    {
      id: "buy",
      screenId: "detail",
      name: "Buy",
      type: "button",
      order: 1,
      nodeId: "1:4",
    },
  ],
  features: [
    {
      id: "buy-action",
      screenId: "detail",
      name: "Buy",
      trigger: { type: "click", elementId: "buy" },
      action: { type: "navigate", destinationScreenId: "order" },
      description: "Starts checkout",
    },
  ],
};

test("renders a project-wide flow diagram before the per-screen breakdown", () => {
  const markdown = buildProjectMarkdown(project);
  const flowIndex = markdown.indexOf("## Project Flow");
  const screenIndex = markdown.indexOf("## Product detail");
  assert.ok(flowIndex >= 0 && flowIndex < screenIndex);
  assert.match(markdown, /```mermaid\nflowchart TD/);
});

test("draws one node per screen and one edge per navigation feature", () => {
  const diagram = buildProjectFlowDiagram(project);
  assert.match(diagram, /s0\["Product detail"\]/);
  assert.match(diagram, /s1\["Order"\]/);
  assert.match(diagram, /s0 -->\|Buy\| s1/);
});

test("escapes quotes and pipes so labels cannot break the diagram syntax", () => {
  const tricky: Project = {
    ...project,
    screens: [{ id: "a", name: 'Say "hi" | bye', purpose: "", nodeId: "1:1" }],
    features: [],
  };
  const diagram = buildProjectFlowDiagram(tricky);
  const nodeLine = diagram.split("\n").find((line) => line.startsWith("  s0["));
  assert.ok(nodeLine);
  assert.ok(!nodeLine!.includes('"hi"'));
  assert.ok(!nodeLine!.slice(6, -2).includes("|"));
  assert.match(nodeLine!, /&quot;hi&quot;/);
});

test("renders each screen with purpose, nested elements and behavior", () => {
  const markdown = buildProjectMarkdown(project);
  assert.match(markdown, /^# Sketchy Spec/);
  assert.match(markdown, /## Product detail/);
  assert.match(markdown, /Show one product/);
  assert.match(markdown, /^- 1\. Review \(Section\)$/m);
  assert.match(markdown, /^ {2}- 1-1\. Rating \(Text\): 4\.8$/m);
  assert.match(markdown, /^- 2\. Buy \(Button\)$/m);
  assert.match(markdown, /Starts checkout/);
});

test("describes a toast outcome as a real result, not a documentation-only one", () => {
  const withToast: Project = {
    ...project,
    screens: [
      ...project.screens,
      {
        id: "toast-1",
        name: "Product detail · Toast 1",
        purpose: "",
        nodeId: "1:9",
        kind: "toast",
        baseScreenId: "detail",
      },
    ],
    elements: [
      ...project.elements,
      {
        id: "toast-message",
        screenId: "toast-1",
        name: "Added to your wishlist",
        type: "text",
        nodeId: "1:10",
      },
    ],
    features: [
      {
        id: "wishlist-toast",
        screenId: "detail",
        name: "Wishlist",
        trigger: { type: "click", elementId: "buy" },
        action: { type: "toast", destinationScreenId: "toast-1" },
      },
    ],
  };
  assert.equal(
    describeFeature(withToast, withToast.features[0]),
    "Click Buy → Show toast: Added to your wishlist",
  );
});

test("describes a conditional outcome as a readable sentence", () => {
  assert.equal(
    describeFeature(project, {
      id: "like",
      screenId: "detail",
      name: "Like",
      trigger: { type: "click", elementId: "buy" },
      action: { type: "describe" },
      condition: "Not signed in",
      description: "Add this item to favorites",
    }),
    "When Not signed in, Click Buy → Add this item to favorites",
  );
});

test("numbers nested elements hierarchically", () => {
  const outline = outlineElements([
    {
      id: "section",
      screenId: "detail",
      name: "Section",
      type: "section",
      order: 0,
      nodeId: "1:1",
    },
    {
      id: "button",
      screenId: "detail",
      name: "Button",
      type: "button",
      parentElementId: "section",
      order: 1,
      nodeId: "1:2",
    },
  ]);
  assert.equal(outline[0]?.number, "1");
  assert.equal(outline[0]?.children[0]?.number, "1-1");
});

test("falls back to placeholder text for empty screens", () => {
  const empty: Project = {
    settings: { screenPreset: "mobile", showFlowArrows: true },
    screens: [{ id: "blank", name: "Blank", purpose: "", nodeId: "1:1" }],
    elements: [],
    features: [],
  };
  const markdown = buildProjectMarkdown(empty);
  assert.match(markdown, /No elements yet\./);
  assert.match(markdown, /No behavior described yet\./);
});
