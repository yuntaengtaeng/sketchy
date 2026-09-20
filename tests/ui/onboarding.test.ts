import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyProject,
  type Element,
  type Screen,
} from "../../src/shared/index.ts";
import { getOnboardingStep } from "../../src/ui/features/build/utils/onboarding.ts";

const screen: Screen = {
  id: "screen-1",
  nodeId: "node-1",
  name: "Screen 1",
  purpose: "",
};
const button: Element = {
  id: "button-1",
  nodeId: "node-2",
  screenId: screen.id,
  name: "Button",
  type: "button",
};

test("guides a first-time user through the first interaction", () => {
  const project = createEmptyProject();
  assert.equal(
    getOnboardingStep({
      project,
      onboardingComplete: false,
      view: "build",
    }),
    "create-screen",
  );

  project.screens.push(screen);
  assert.equal(
    getOnboardingStep({
      project,
      onboardingComplete: false,
      view: "build",
    }),
    "select-screen",
  );
  assert.equal(
    getOnboardingStep({
      project,
      screen,
      onboardingComplete: false,
      view: "build",
    }),
    "add-button",
  );

  project.elements.push(button);
  assert.equal(
    getOnboardingStep({
      project,
      screen,
      onboardingComplete: false,
      view: "build",
    }),
    "select-element",
  );
  assert.equal(
    getOnboardingStep({
      project,
      screen,
      element: button,
      onboardingComplete: false,
      view: "build",
    }),
    "choose-result",
  );
  assert.equal(
    getOnboardingStep({
      project,
      screen,
      element: button,
      onboardingComplete: true,
      view: "build",
    }),
    undefined,
  );
});

test("continues the first success through flow and spec", () => {
  const project = createEmptyProject();
  project.screens.push(screen);
  project.elements.push(button);
  project.features.push({
    id: "feature-1",
    screenId: screen.id,
    name: "Continue",
    trigger: { type: "click", elementId: button.id },
    action: { type: "describe" },
  });

  assert.equal(
    getOnboardingStep({
      project,
      screen,
      element: button,
      onboardingComplete: false,
      view: "build",
    }),
    "view-flow",
  );
  assert.equal(
    getOnboardingStep({
      project,
      screen,
      element: button,
      onboardingComplete: false,
      view: "flow",
    }),
    "view-spec",
  );
  assert.equal(
    getOnboardingStep({
      project,
      screen,
      element: button,
      onboardingComplete: false,
      view: "spec",
    }),
    "view-flow",
  );
});
