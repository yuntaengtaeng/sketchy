import assert from "node:assert/strict";
import test from "node:test";
import { adoptCanvasName } from "../src/plugin/canvas-name.ts";

test("adopts meaningful Canvas names without erasing Sketchy names", () => {
  const item = { name: "Button" };

  assert.equal(adoptCanvasName(item, " Continue "), true);
  assert.equal(item.name, "Continue");
  assert.equal(adoptCanvasName(item, " "), false);
  assert.equal(item.name, "Continue");
});
