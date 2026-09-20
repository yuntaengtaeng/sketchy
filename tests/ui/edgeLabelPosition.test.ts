import assert from "node:assert/strict";
import test from "node:test";
import { edgeLabelPosition } from "../../src/ui/features/flow/utils/edgeLabelPosition.ts";

test("straight edge label sits beside the vertical midpoint", () => {
  assert.deepEqual(
    edgeLabelPosition({
      id: "straight",
      points: [
        { x: 20, y: 10 },
        { x: 20, y: 50 },
      ],
      label: "Next",
      dashed: false,
    }),
    { x: 28, y: 30, anchor: "start" },
  );
});

test("branch and loop labels use their visible routing segment", () => {
  const points = [
    { x: 100, y: 20 },
    { x: 40, y: 20 },
    { x: 40, y: 80 },
    { x: 100, y: 80 },
  ];
  assert.deepEqual(
    edgeLabelPosition({
      id: "branch",
      points,
      label: "Branch",
      dashed: true,
    }),
    { x: 70, y: 72, anchor: "middle" },
  );
  assert.deepEqual(
    edgeLabelPosition({
      id: "loop",
      points,
      label: "Loop",
      dashed: false,
    }),
    { x: 34, y: 50, anchor: "end" },
  );
});
