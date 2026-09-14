import assert from "node:assert/strict";
import test from "node:test";
import { decideSync } from "../src/plugin/sync-decision.ts";

test("stays idle once local and remote match the last synced revision", () => {
  assert.equal(decideSync(4, 4, 4), "idle");
});

test("pushes when only the local revision moved past the last sync", () => {
  assert.equal(decideSync(5, 4, 4), "push");
});

test("pulls when only the remote revision moved past the last sync", () => {
  assert.equal(decideSync(4, 6, 4), "pull");
});

test("flags a conflict instead of picking a side when both diverged", () => {
  assert.equal(decideSync(5, 6, 4), "conflict");
});
