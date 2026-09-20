import assert from "node:assert/strict";
import test from "node:test";
import {
  centeredTransform,
  fullscreenSize,
  popoverPosition,
  zoomedTransform,
} from "../../src/ui/features/flow/utils/flowViewport.ts";

test("fullscreen size stays within the configured bounds", () => {
  const bounds = {
    margin: 80,
    min: { width: 600, height: 500 },
    max: { width: 1800, height: 1200 },
  };
  assert.deepEqual(
    fullscreenSize({ available: { width: 500, height: 400 }, ...bounds }),
    bounds.min,
  );
  assert.deepEqual(
    fullscreenSize({ available: { width: 2400, height: 1600 }, ...bounds }),
    bounds.max,
  );
});

test("popover position is clamped inside the viewport", () => {
  const options = {
    viewport: { width: 800, height: 600 },
    popoverWidth: 220,
    margin: 12,
    bottomLimit: 96,
  };
  assert.deepEqual(
    popoverPosition({ anchor: { x: -100, y: -100 }, ...options }),
    { x: 12, y: 12 },
  );
  assert.deepEqual(
    popoverPosition({ anchor: { x: 900, y: 700 }, ...options }),
    { x: 568, y: 504 },
  );
});

test("centering uses the viewport and content dimensions", () => {
  assert.deepEqual(
    centeredTransform({
      viewport: { width: 900, height: 700 },
      content: { width: 500, height: 300 },
    }),
    { tx: 200, ty: 200, scale: 1 },
  );
});

test("zoom keeps the pivot on the same content coordinate and clamps scale", () => {
  const current = { tx: 100, ty: 50, scale: 1 };
  assert.deepEqual(
    zoomedTransform({
      current,
      nextScale: 3,
      pivot: { x: 300, y: 250 },
      minScale: 0.5,
      maxScale: 2,
    }),
    { tx: -100, ty: -150, scale: 2 },
  );
});
