import { updateNavigation } from "./commands/sync-prototype.ts";
import {
  describeFeature,
  outlineElements,
} from "../ui/features/spec/describe.ts";
import {
  BLOCK_DEFINITIONS,
  createEmptyProject,
  elementTreeIds,
  sectionLayout,
  type Project,
} from "../shared/index.ts";
import { readingOrder } from "./reading-order.ts";
import { elbowRoute, routeLaneOffset } from "./flow-routing.ts";
import { nextScreenPosition } from "./screen-position.ts";

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
  settings: { screenPreset: "mobile" },
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

const sectionTree = elementTreeIds(
  [
    {
      id: "section",
      nodeId: "1",
      screenId: "home",
      name: "Section",
      type: "section",
    },
    {
      id: "child",
      nodeId: "2",
      screenId: "home",
      name: "Button",
      type: "button",
      parentElementId: "section",
    },
    {
      id: "nested",
      nodeId: "3",
      screenId: "home",
      name: "Text",
      type: "text",
      parentElementId: "child",
    },
    {
      id: "sibling",
      nodeId: "4",
      screenId: "home",
      name: "Text",
      type: "text",
    },
  ],
  "section",
);
if ([...sectionTree].join() !== "section,child,nested")
  throw new Error("Removing a section must include its nested elements only.");

const horizontal = sectionLayout("horizontal");
if (
  horizontal.primaryAxisSizingMode !== "FIXED" ||
  horizontal.counterAxisSizingMode !== "AUTO"
)
  throw new Error(
    "A horizontal section must keep its width and hug its height.",
  );

if (createEmptyProject().settings.screenPreset !== "mobile")
  throw new Error("New projects must default to a mobile screen.");

const outline = outlineElements([
  {
    id: "section",
    nodeId: "1",
    screenId: "home",
    name: "Section",
    type: "section",
    order: 0,
  },
  {
    id: "button",
    nodeId: "2",
    screenId: "home",
    name: "Button",
    type: "button",
    parentElementId: "section",
    order: 1,
  },
]);
if (outline[0]?.number !== "1" || outline[0]?.children[0]?.number !== "1-1")
  throw new Error("Section elements must use hierarchical numbering.");

if (
  BLOCK_DEFINITIONS.section.canAddToSection ||
  !BLOCK_DEFINITIONS.button.triggers.includes("click")
)
  throw new Error("Block behavior must come from the shared registry.");

const firstScreen = nextScreenPosition(
  { x: 500, y: 400 },
  { width: 200, height: 300 },
  [],
);
const nextScreen = nextScreenPosition(
  { x: 0, y: 0 },
  { width: 200, height: 300 },
  [{ x: 400, y: 100, width: 200, height: 300 }],
);
if (
  firstScreen.x !== 400 ||
  firstScreen.y !== 250 ||
  nextScreen.x !== 920 ||
  nextScreen.y !== 100
)
  throw new Error("Screens must start centered, then continue in one row.");

const route = elbowRoute({ x: 0, y: 10 }, { x: 100, y: 50 }, true);
if (route[1]?.x !== 50 || route[2]?.x !== 50 || route[2]?.y !== 50)
  throw new Error("Horizontal flows must route through the screen gap.");

if (
  routeLaneOffset(0, 3) !== -32 ||
  routeLaneOffset(1, 3) !== 0 ||
  routeLaneOffset(2, 3) !== 32
)
  throw new Error("Sibling flows must use separate routing lanes.");
