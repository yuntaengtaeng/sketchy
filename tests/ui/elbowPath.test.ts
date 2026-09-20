import assert from "node:assert/strict";
import test from "node:test";
import { elbowPath } from "../../src/ui/features/flow/utils/elbowPath.ts";

test("two points produce a plain straight line", () => {
  assert.equal(
    elbowPath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      4,
    ),
    "M0,0 L10,0",
  );
});

test("a right-angle corner rounds with a quadratic curve through the corner", () => {
  const d = elbowPath(
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
    4,
  );
  assert.match(d, /Q10,0/);
  assert.match(d, /^M0,0 L6,0/);
});

test("radius never exceeds half of the shorter adjacent segment", () => {
  const d = elbowPath(
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 10 },
    ],
    10,
  );
  // 4px 세그먼트의 절반인 2px보다 크게 깎이면 안 된다
  assert.match(d, /^M0,0 L2,0/);
});
