import assert from "node:assert/strict";
import test from "node:test";
import { groupConnections } from "../../src/ui/features/flow/utils/groupConnections.ts";
import type { Project } from "../../src/shared/index.ts";

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
    {
      id: "f5",
      screenId: "login",
      name: "Submit",
      condition: "Invalid input",
      action: { type: "describe" },
    },
  ],
};

test("groups features by source screen in screen order, skipping screens with none", () => {
  const groups = groupConnections(project, project.features);
  assert.deepEqual(
    groups.map((g) => g.screen.id),
    ["home", "login", "dashboard", "confirm"],
  );
});

test("navigate and overlay carry a resolved destination and distinct kinds", () => {
  const groups = groupConnections(project, project.features);
  const home = groups.find((g) => g.screen.id === "home")!;
  const homeRow = home.rows[0];
  assert.equal(homeRow.kind, "navigate");
  assert.equal(homeRow.kind === "navigate" && homeRow.destination?.id, "login");

  const dashboard = groups.find((g) => g.screen.id === "dashboard")!;
  const popupRow = dashboard.rows[0];
  assert.equal(popupRow.kind, "popup");
});

test("toast rows resolve the message element's name instead of the screen", () => {
  const groups = groupConnections(project, project.features);
  const dashboard = groups.find((g) => g.screen.id === "dashboard")!;
  const toastRow = dashboard.rows[1];
  assert.equal(toastRow.kind, "toast");
  assert.equal(
    toastRow.kind === "toast" ? toastRow.destinationLabel : undefined,
    "Saved",
  );
});

test("an action without a resolvable action-specific field still keeps its kind", () => {
  const groups = groupConnections(project, project.features);
  const login = groups.find((g) => g.screen.id === "login")!;
  assert.equal(login.rows[0].kind, "describe");
});

test("navigate without a linked destination yet still reports kind navigate", () => {
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
  const groups = groupConnections(unlinked, unlinked.features);
  const home = groups.find((g) => g.screen.id === "home")!;
  const homeRow = home.rows[0];
  assert.equal(homeRow.kind, "navigate");
  assert.equal(homeRow.kind === "navigate" && homeRow.destination, undefined);
});
