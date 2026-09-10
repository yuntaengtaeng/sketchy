import {
  updateNavigation,
  withoutMissingDestinations,
} from "./commands/sync-prototype.ts";
import {
  describeFeature,
  outlineElements,
} from "../ui/features/spec/describe.ts";
import {
  BLOCK_DEFINITIONS,
  createEmptyProject,
  duplicateScreenElements,
  elementTreeIds,
  projectWithoutScreen,
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

const overlay = updateNavigation([], undefined, "popup-1", "OVERLAY");
const overlayAction = overlay[0]?.actions?.[0];
if (
  overlayAction?.type !== "NODE" ||
  String(overlayAction.navigation) !== "OVERLAY"
)
  throw new Error("Popup actions must create an overlay.");

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

const stale = updateNavigation([], undefined, "deleted-screen");
if (withoutMissingDestinations(stale, new Set()).length)
  throw new Error("Interactions pointing to deleted nodes must be discarded.");

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
  features: [],
} as Project;
const sentence = describeFeature(project, {
  id: "like",
  screenId: "home",
  name: "Like",
  trigger: { type: "click", elementId: "button" },
  action: { type: "describe" },
  condition: "Not signed in",
  description: "Add this item to favorites",
});
if (sentence !== "When Not signed in, Click Like → Add this item to favorites")
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

let duplicateId = 0;
const duplicated = duplicateScreenElements(
  [
    {
      id: "section",
      nodeId: "1",
      screenId: "home",
      name: "Section",
      type: "section",
    },
    {
      id: "button",
      nodeId: "2",
      screenId: "home",
      name: "Button",
      type: "button",
      parentElementId: "section",
    },
  ],
  "home",
  "home-copy",
  new Map([
    ["section", "3"],
    ["button", "4"],
  ]),
  () => `copy-${++duplicateId}`,
);
if (
  duplicated[1]?.parentElementId !== duplicated[0]?.id ||
  duplicated.some((element) => element.screenId !== "home-copy")
)
  throw new Error("Duplicated elements must keep their structure, not IDs.");

const deleted = projectWithoutScreen(
  {
    ...project,
    screens: [
      ...project.screens,
      { id: "detail", nodeId: "3", name: "Detail", purpose: "" },
      {
        id: "detail-popup",
        nodeId: "4",
        name: "Detail · Popup 1",
        purpose: "",
        kind: "popup",
        baseScreenId: "detail",
      },
    ],
    features: [
      {
        id: "navigate",
        screenId: "home",
        name: "Open detail",
        trigger: { type: "click", elementId: "button" },
        action: { type: "navigate", destinationScreenId: "detail" },
      },
    ],
  },
  "detail",
);
if (
  deleted.screens.some(
    (screen) => screen.id === "detail" || screen.baseScreenId === "detail",
  ) ||
  deleted.features.length
)
  throw new Error("Deleting a screen must remove its states and connections.");

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

const wrappedScreen = nextScreenPosition(
  { x: 0, y: 0 },
  { width: 200, height: 300 },
  [0, 1, 2, 3].map((column) => ({
    x: column * 520,
    y: 100,
    width: 200,
    height: 300,
  })),
);
if (wrappedScreen.x !== 0 || wrappedScreen.y !== 720)
  throw new Error("Long screen rows must wrap onto a new row.");

const route = elbowRoute({ x: 0, y: 10 }, { x: 100, y: 50 }, true);
if (route[1]?.x !== 50 || route[2]?.x !== 50 || route[2]?.y !== 50)
  throw new Error("Horizontal flows must route through the screen gap.");

if (
  routeLaneOffset(0, 3) !== -32 ||
  routeLaneOffset(1, 3) !== 0 ||
  routeLaneOffset(2, 3) !== 32
)
  throw new Error("Sibling flows must use separate routing lanes.");
