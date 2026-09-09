import { updateNavigation } from "./commands/sync-prototype.ts";
import { describeFeature } from "../ui/features/spec/describe.ts";
import type { Project } from "../shared/index.ts";
import { readingOrder } from "./reading-order.ts";

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

const project = {
  screens: [{ id: "home", nodeId: "1", name: "Home", purpose: "" }],
  elements: [
    {
      id: "button",
      nodeId: "2",
      screenId: "home",
      name: "Like",
      type: "button",
    },
  ],
  states: [],
  features: [],
} as Project;
const sentence = describeFeature(project, {
  id: "like",
  screenId: "home",
  name: "Like",
  trigger: { type: "click", elementId: "button" },
  action: { type: "set-state", stateId: "liked", value: true },
  description: "Add this item to favorites",
});
if (sentence !== "Click Like → Add this item to favorites")
  throw new Error("Spec behavior must be a readable sentence.");

const ordered = readingOrder([
  { item: "right", x: 100, y: 0 },
  { item: "below", x: 0, y: 40 },
  { item: "left", x: 0, y: 4 },
]).map(({ item }) => item);
if (ordered.join() !== "left,right,below")
  throw new Error("Elements must follow top-to-bottom reading order.");
