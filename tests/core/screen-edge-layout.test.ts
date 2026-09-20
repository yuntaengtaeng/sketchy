import assert from "node:assert/strict";
import test from "node:test";
import {
  screenEdgeOrder,
  screenEdgePadding,
} from "../../src/core/screen-edge-layout.ts";

test("screen edge order keeps headers first and footers last", () => {
  assert.deepEqual(
    screenEdgeOrder(["button", "footer", "header", undefined, "header"]),
    [2, 4, 0, 3, 1],
  );
});

test("screen edge order skips reordering without an edge element", () => {
  assert.equal(screenEdgeOrder(["button", "section", undefined]), undefined);
});

test("screen edge padding adds only the existing edge heights", () => {
  assert.deepEqual(
    screenEdgePadding({ base: 16, headerHeight: 48, footerHeight: 56 }),
    { top: 64, bottom: 72 },
  );
  assert.deepEqual(screenEdgePadding({ base: 16 }), {
    top: 16,
    bottom: 16,
  });
});
