import assert from "node:assert/strict";
import test from "node:test";

import { readingOrder } from "../../src/plugin/reading-order.ts";

test("orders elements top to bottom, left to right within a row", () => {
  const ordered = readingOrder([
    { item: "right", x: 100, y: 0 },
    { item: "below", x: 0, y: 40 },
    { item: "left", x: 0, y: 4 },
  ]).map(({ item }) => item);
  assert.deepEqual(ordered, ["left", "right", "below"]);
});
