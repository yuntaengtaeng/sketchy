import assert from "node:assert/strict";
import test from "node:test";
import {
  canNestSection,
  elementAncestors,
  elementSiblings,
} from "../src/shared/element-tree.ts";

const elements = [
  { id: "outer", screenId: "screen", type: "section", order: 0 },
  {
    id: "inner-a",
    screenId: "screen",
    type: "section",
    parentElementId: "outer",
    order: 0,
  },
  {
    id: "inner-b",
    screenId: "screen",
    type: "section",
    parentElementId: "outer",
    order: 1,
  },
  {
    id: "button",
    screenId: "screen",
    type: "button",
    parentElementId: "inner-a",
    order: 0,
  },
];

test("keeps navigation recursive while limiting sections to two levels", () => {
  assert.deepEqual(
    elementAncestors(elements, elements[3]).map((item) => item.id),
    ["outer", "inner-a"],
  );
  assert.deepEqual(
    elementSiblings(elements, elements[1]).map((item) => item.id),
    ["inner-a", "inner-b"],
  );
  assert.equal(canNestSection(elements, elements[0]), true);
  assert.equal(canNestSection(elements, elements[1]), false);
});
