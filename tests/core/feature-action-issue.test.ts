import assert from "node:assert/strict";
import test from "node:test";

import { describeFeatureActionIssue } from "../../src/core/feature-action-issue.ts";

test("picks the destination-specific hint for each action type", () => {
  const issue = { code: "INVALID_DESTINATION" as const, message: "unused" };
  assert.equal(
    describeFeatureActionIssue(issue, { type: "overlay" }),
    "Choose a popup created from this screen",
  );
  assert.equal(
    describeFeatureActionIssue(issue, { type: "toast" }),
    "Choose a toast created from this screen",
  );
  assert.equal(
    describeFeatureActionIssue(issue, { type: "navigate" }),
    "Choose a regular screen as the destination",
  );
});

test("falls back to the issue's own message for unmapped codes", () => {
  const issue = {
    code: "SOME_FUTURE_CODE" as never,
    message: "from validateFeatureAction",
  };
  assert.equal(
    describeFeatureActionIssue(issue, { type: "describe" }),
    "from validateFeatureAction",
  );
});
