import assert from "node:assert/strict";
import test from "node:test";

import {
  updateCloseOverlay,
  updateNavigation,
  withoutMissingDestinations,
} from "../../src/plugin/commands/sync-prototype.ts";

test("keeps manual reactions while replacing only the Sketchy-owned one", () => {
  const manual = {
    trigger: { type: "ON_HOVER" },
    actions: [{ type: "URL", url: "https://example.com" }],
  } as Reaction;
  const owned = updateNavigation([manual], undefined, "screen-1");
  const updated = updateNavigation(owned, "screen-1", "screen-2");
  assert.equal(updated[0], manual);
  assert.equal(updated.length, 2);

  const removed = updateNavigation(updated, "screen-2");
  assert.equal(removed.length, 1);
  assert.equal(removed[0], manual);
});

test("navigation can create an overlay action", () => {
  const overlay = updateNavigation([], undefined, "popup-1", "OVERLAY");
  const action = overlay[0]?.actions?.[0];
  assert.equal(action?.type, "NODE");
  assert.equal(
    String((action as { navigation: unknown }).navigation),
    "OVERLAY",
  );
});

test("close-overlay reactions can be created and removed", () => {
  const close = updateCloseOverlay([]);
  assert.equal(close[0]?.actions?.[0]?.type, "CLOSE");
  assert.equal(updateCloseOverlay(close, true).length, 0);
});

test("refuses to replace a click interaction it does not own", () => {
  assert.throws(() =>
    updateNavigation(
      [{ trigger: { type: "ON_CLICK" }, actions: [] }],
      undefined,
      "screen-1",
    ),
  );
});

test("drops reactions pointing at nodes that no longer exist", () => {
  const stale = updateNavigation([], undefined, "deleted-screen");
  assert.equal(withoutMissingDestinations(stale, new Set()).length, 0);
});
