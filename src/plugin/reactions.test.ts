import { updateNavigation } from "./reactions.ts";

const manual = {
  trigger: { type: "ON_HOVER" },
  actions: [{ type: "URL", url: "https://example.com" }],
} as Reaction;
const owned = updateNavigation([manual], undefined, "screen-1");
const updated = updateNavigation(owned, "screen-1", "screen-2");
if (updated[0] !== manual || updated.length !== 2)
  throw new Error("Manual reactions must be preserved.");
const removed = updateNavigation(updated, "screen-2");
if (removed.length !== 1 || removed[0] !== manual)
  throw new Error("Only the Sketchy reaction should be removed.");

let blocked = false;
try {
  updateNavigation(
    [{ trigger: { type: "ON_CLICK" }, actions: [] }],
    undefined,
    "screen-1",
  );
} catch {
  blocked = true;
}
if (!blocked)
  throw new Error("Manual click interactions must not be replaced.");
