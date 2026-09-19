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
    getOnboardingStep(project, undefined, undefined, false),
    "create-screen",
  );

  project.screens.push(screen);
  assert.equal(
    getOnboardingStep(project, undefined, undefined, false),
    "select-screen",
  );
  assert.equal(
    getOnboardingStep(project, screen, undefined, false),
    "add-button",
  );

  project.elements.push(button);
  assert.equal(
    getOnboardingStep(project, screen, undefined, false),
    "select-element",
  );
  assert.equal(
    getOnboardingStep(project, screen, button, false),
    "choose-result",
  );
  assert.equal(getOnboardingStep(project, screen, button, true), undefined);
});
