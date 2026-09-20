import assert from "node:assert/strict";
import test from "node:test";

import {
  BLOCK_DEFINITIONS,
  createEmptyProject,
  defaultSectionDirection,
  duplicateScreenElements,
  isContainerElement,
  projectWithoutScreen,
  sectionLayout,
} from "../../src/shared/index.ts";
import { elementTreeIds } from "../../src/shared/element-tree.ts";

test("a horizontal section keeps its width and hugs its height", () => {
  const layout = sectionLayout("horizontal");
  assert.equal(layout.primaryAxisSizingMode, "FIXED");
  assert.equal(layout.counterAxisSizingMode, "AUTO");
});

test("header and footer default to horizontal, section to vertical", () => {
  assert.equal(defaultSectionDirection("header"), "horizontal");
  assert.equal(defaultSectionDirection("footer"), "horizontal");
  assert.equal(defaultSectionDirection("section"), "vertical");
  assert.equal(defaultSectionDirection("button"), "vertical");
});

test("isContainerElement recognizes section, header, and footer only", () => {
  const base = { id: "e1", nodeId: "1:1", screenId: "home", name: "Row" };
  assert.equal(isContainerElement({ ...base, type: "section" }), true);
  assert.equal(isContainerElement({ ...base, type: "header" }), true);
  assert.equal(isContainerElement({ ...base, type: "footer" }), true);
  assert.equal(isContainerElement({ ...base, type: "button" }), false);
});

test("a new project defaults to a mobile screen", () => {
  assert.equal(createEmptyProject().settings.screenPreset, "mobile");
});

test("removing a section includes its nested elements only", () => {
  const ids = elementTreeIds(
    [
      {
        id: "section",
        nodeId: "1",
        screenId: "home",
        name: "Section",
        type: "section",
      },
      {
        id: "child",
        nodeId: "2",
        screenId: "home",
        name: "Button",
        type: "button",
        parentElementId: "section",
      },
      {
        id: "nested",
        nodeId: "3",
        screenId: "home",
        name: "Text",
        type: "text",
        parentElementId: "child",
      },
      {
        id: "sibling",
        nodeId: "4",
        screenId: "home",
        name: "Text",
        type: "text",
      },
    ],
    "section",
  );
  assert.deepEqual([...ids], ["section", "child", "nested"]);
});

test("duplicating screen elements keeps structure, not the original ids", () => {
  let duplicateId = 0;
  const duplicated = duplicateScreenElements(
    [
      {
        id: "section",
        nodeId: "1",
        screenId: "home",
        name: "Section",
        type: "section",
      },
      {
        id: "button",
        nodeId: "2",
        screenId: "home",
        name: "Button",
        type: "button",
        parentElementId: "section",
      },
    ],
    "home",
    "home-copy",
    new Map([
      ["section", "3"],
      ["button", "4"],
    ]),
    () => `copy-${++duplicateId}`,
  );
  assert.equal(duplicated[1]?.parentElementId, duplicated[0]?.id);
  assert.ok(duplicated.every((element) => element.screenId === "home-copy"));
});

test("deleting a screen removes its derived states and connected features", () => {
  const project = {
    settings: { screenPreset: "mobile" as const, showFlowArrows: true },
    screens: [
      { id: "home", nodeId: "1", name: "Home", purpose: "" },
      { id: "detail", nodeId: "3", name: "Detail", purpose: "" },
      {
        id: "detail-popup",
        nodeId: "4",
        name: "Detail · Popup 1",
        purpose: "",
        kind: "popup" as const,
        baseScreenId: "detail",
      },
    ],
    elements: [],
    features: [
      {
        id: "navigate",
        screenId: "home",
        name: "Open detail",
        trigger: { type: "click" as const, elementId: "button" },
        action: { type: "navigate" as const, destinationScreenId: "detail" },
      },
    ],
  };
  const deleted = projectWithoutScreen(project, "detail");
  assert.equal(
    deleted.screens.some(
      (screen) => screen.id === "detail" || screen.baseScreenId === "detail",
    ),
    false,
  );
  assert.equal(deleted.features.length, 0);
});

test("block behavior comes from the shared registry, not per-type checks", () => {
  assert.equal(BLOCK_DEFINITIONS.section.canAddToSection, true);
  assert.ok(BLOCK_DEFINITIONS.button.triggers.includes("click"));
});
