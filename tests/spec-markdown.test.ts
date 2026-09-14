import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectMarkdown } from "../src/ui/features/spec/describe.ts";
import type { Project } from "../src/shared/index.ts";

const project: Project = {
  settings: { screenPreset: "mobile" },
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

test("renders a project-wide flow overview before the per-screen breakdown", () => {
  const markdown = buildProjectMarkdown(project);
  const flowIndex = markdown.indexOf("## Project Flow");
  const screenIndex = markdown.indexOf("## Product detail");
  assert.ok(flowIndex >= 0 && flowIndex < screenIndex);
  assert.match(
    markdown,
    /^- Product detail: Click Buy → Go to Order; Starts checkout$/m,
  );
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

test("falls back to placeholder text for empty screens", () => {
  const empty: Project = {
    settings: { screenPreset: "mobile" },
    screens: [{ id: "blank", name: "Blank", purpose: "", nodeId: "1:1" }],
    elements: [],
    features: [],
  };
  const markdown = buildProjectMarkdown(empty);
  assert.match(markdown, /No elements yet\./);
  assert.match(markdown, /No behavior described yet\./);
});
