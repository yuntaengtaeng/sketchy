import assert from "node:assert/strict";
import test from "node:test";
import {
  createPluginUiState,
  pluginStateReducer,
} from "../../src/ui/hooks/pluginState.ts";
import type { Project } from "../../src/shared/index.ts";

const emptyProject: Project = {
  settings: { screenPreset: "mobile", showFlowArrows: true },
  screens: [],
  elements: [],
  features: [],
};

test("STATE replaces project selection while preserving a pending highlight", () => {
  const state = {
    ...createPluginUiState(emptyProject),
    insertedElementId: "new-element",
  };
  const next = pluginStateReducer(state, {
    type: "STATE",
    project: emptyProject,
    selectedScreenId: "screen-1",
    selectedElementId: "element-1",
    onboardingComplete: true,
  });
  assert.deepEqual(next, {
    ...state,
    screenId: "screen-1",
    elementId: "element-1",
    onboardingComplete: true,
  });
});

test("a newly inserted element replaces the previous highlight", () => {
  const state = createPluginUiState(emptyProject);
  const next = pluginStateReducer(state, {
    type: "STATE",
    project: emptyProject,
    onboardingComplete: false,
    insertedElementId: "new-element",
  });
  assert.equal(next.insertedElementId, "new-element");
});

test("transient error and highlight state clear independently", () => {
  const state = {
    ...createPluginUiState(emptyProject),
    error: "Failed",
    insertedElementId: "new-element",
  };
  const withoutError = pluginStateReducer(state, { type: "CLEAR_ERROR" });
  assert.equal(withoutError.error, "");
  assert.equal(withoutError.insertedElementId, "new-element");

  const withoutHighlight = pluginStateReducer(state, {
    type: "CLEAR_INSERTED_ELEMENT",
  });
  assert.equal(withoutHighlight.error, "Failed");
  assert.equal(withoutHighlight.insertedElementId, undefined);
});
