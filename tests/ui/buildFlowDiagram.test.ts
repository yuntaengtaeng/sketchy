import assert from "node:assert/strict";
import test from "node:test";
import { buildFlowDiagram } from "../../src/ui/features/flow/utils/buildFlowDiagram.ts";
import type { Project } from "../../src/shared/index.ts";

const measure = (text: string) => text.length * 6;

const project: Project = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [
    { id: "home", name: "Home", purpose: "", nodeId: "1:1" },
    { id: "login", name: "Login", purpose: "", nodeId: "1:2" },
    { id: "dashboard", name: "Dashboard", purpose: "", nodeId: "1:3" },
    {
      id: "confirm",
      name: "Confirm logout",
      purpose: "",
      nodeId: "1:4",
      kind: "popup",
      baseScreenId: "dashboard",
    },
    {
      id: "saved-toast",
      name: "Saved",
      purpose: "",
      nodeId: "1:5",
      kind: "toast",
      baseScreenId: "dashboard",
    },
  ],
  elements: [
    {
      id: "saved-text",
      screenId: "saved-toast",
      name: "Saved",
      type: "text",
      nodeId: "1:6",
    },
  ],
  features: [
    {
      id: "f1",
      screenId: "home",
      name: "Log in",
      action: { type: "navigate", destinationScreenId: "login" },
    },
    {
      id: "f2",
      screenId: "dashboard",
      name: "Log out",
      action: { type: "overlay", destinationScreenId: "confirm" },
    },
    {
      id: "f3",
      screenId: "dashboard",
      name: "Save",
      action: { type: "toast", destinationScreenId: "saved-toast" },
    },
    {
      id: "f4",
      screenId: "confirm",
      name: "Yes, log out",
      action: { type: "navigate", destinationScreenId: "home" },
    },
  ],
};

test("only main screens (no popup/toast) become nodes", () => {
  const diagram = buildFlowDiagram(project, measure);
  assert.deepEqual(
    diagram.nodes.map((n) => n.id),
    ["home", "login", "dashboard"],
  );
});

test("navigate to the immediate next row is a two-point chain edge", () => {
  const diagram = buildFlowDiagram(project, measure);
  const chain = diagram.edges.find((e) => e.id === "f1")!;
  assert.equal(chain.points.length, 2);
  assert.equal(chain.points[0].x, chain.points[1].x);
});

test("overlay becomes a popup chip with a connector edge from its screen", () => {
  const diagram = buildFlowDiagram(project, measure);
  const chip = diagram.chips.find((c) => c.id === "f2")!;
  assert.equal(chip.kind, "popup");
  assert.equal(chip.name, "Confirm logout");
  const connector = diagram.edges.find((e) => e.id === "f2-connector")!;
  assert.ok(connector.dashed);
});

test("toast resolves its message element name as the chip label", () => {
  const diagram = buildFlowDiagram(project, measure);
  const chip = diagram.chips.find((c) => c.id === "f3")!;
  assert.equal(chip.kind, "toast");
  assert.equal(chip.name, "Saved");
});

test("a navigate feature inside a linked popup draws a return edge back to its target", () => {
  const diagram = buildFlowDiagram(project, measure);
  const back = diagram.edges.find((e) => e.id === "f4-return")!;
  assert.ok(back);
  assert.equal(back.label, "Yes, log out");
  // 마지막 점은 목적지(Home) 행 왼쪽 변으로 들어간다
  assert.equal(
    back.points.at(-1)!.y,
    diagram.nodes[0].y + diagram.nodes[0].h / 2,
  );
});

test("navigate to a non-adjacent row is routed as a loop, not a straight chain", () => {
  const branchy: Project = {
    ...project,
    features: [
      {
        id: "f5",
        screenId: "home",
        name: "Skip ahead",
        action: { type: "navigate", destinationScreenId: "dashboard" },
      },
    ],
  };
  const diagram = buildFlowDiagram(branchy, measure);
  const loop = diagram.edges.find((e) => e.id === "f5")!;
  assert.ok(loop.points.length > 2);
});

test("navigate without a linked destination becomes an unlinked chip", () => {
  const unlinked: Project = {
    ...project,
    features: [
      {
        id: "f6",
        screenId: "home",
        name: "Log in",
        action: { type: "navigate" },
      },
    ],
  };
  const diagram = buildFlowDiagram(unlinked, measure);
  const chip = diagram.chips.find((c) => c.id === "f6")!;
  assert.equal(chip.kind, "unlinked");
});

test("multiple branches from one screen stack vertically without overlapping", () => {
  const diagram = buildFlowDiagram(project, measure);
  const dashboardChips = diagram.chips
    .filter((c) => c.id === "f2" || c.id === "f3")
    .sort((a, b) => a.y - b.y);
  assert.equal(dashboardChips.length, 2);
  assert.ok(dashboardChips[1].y >= dashboardChips[0].y + dashboardChips[0].h);
});
