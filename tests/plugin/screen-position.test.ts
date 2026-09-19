import assert from "node:assert/strict";
import test from "node:test";

import { nextScreenPosition } from "../../src/plugin/screen-position.ts";

test("the first screen centers on the viewport", () => {
  const first = nextScreenPosition(
    { x: 500, y: 400 },
    { width: 200, height: 300 },
    [],
  );
  assert.deepEqual(first, { x: 400, y: 250 });
});

test("later screens continue along the same row", () => {
  const next = nextScreenPosition({ x: 0, y: 0 }, { width: 200, height: 300 }, [
    { x: 400, y: 100, width: 200, height: 300 },
  ]);
  assert.deepEqual(next, { x: 920, y: 100 });
});

test("a full row of four screens wraps onto a new row", () => {
  const wrapped = nextScreenPosition(
    { x: 0, y: 0 },
    { width: 200, height: 300 },
    [0, 1, 2, 3].map((column) => ({
      x: column * 520,
      y: 100,
      width: 200,
      height: 300,
    })),
  );
  assert.deepEqual(wrapped, { x: 0, y: 720 });
});
