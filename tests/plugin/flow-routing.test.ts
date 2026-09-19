import assert from "node:assert/strict";
import test from "node:test";

import { elbowRoute, routeLaneOffset } from "../../src/plugin/flow-routing.ts";

test("horizontal flows route through the gap between screens", () => {
  const route = elbowRoute({ x: 0, y: 10 }, { x: 100, y: 50 }, true);
  assert.equal(route[1]?.x, 50);
  assert.equal(route[2]?.x, 50);
  assert.equal(route[2]?.y, 50);
});

test("sibling flows spread across separate routing lanes", () => {
  assert.equal(routeLaneOffset(0, 3), -32);
  assert.equal(routeLaneOffset(1, 3), 0);
  assert.equal(routeLaneOffset(2, 3), 32);
});
