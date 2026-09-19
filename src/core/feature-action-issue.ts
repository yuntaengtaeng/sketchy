import type { FeatureAction } from "../shared/index.ts";
import type { FeatureActionIssue } from "./validate-feature-action.ts";

/** 트리거를 지원하는 요소를 고르라는 안내 문구 */
export const TRIGGER_HINT =
  "Select a Button, List Item, or Card, then try again";

/** 검증 실패 사유를 사용자에게 보여줄 문구로 변환 */
export function describeFeatureActionIssue(
  issue: FeatureActionIssue,
  action: FeatureAction,
): string {
  switch (issue.code) {
    case "TRIGGER_NOT_SUPPORTED":
      return TRIGGER_HINT;
    case "DESTINATION_REQUIRED":
      return "Choose a destination to continue";
    case "DESTINATION_NOT_FOUND":
      return "The destination no longer exists, choose another destination";
    case "INVALID_DESTINATION":
      return describeInvalidDestination(action);
    case "NESTED_OVERLAY":
      return "Choose another result, a popup cannot open another popup";
    case "NOT_INSIDE_POPUP":
      return "Choose Close popup from an element inside a popup";
    default:
      return issue.message;
  }
}

/** 목적지 종류별 INVALID_DESTINATION 안내 문구 */
function describeInvalidDestination(action: FeatureAction): string {
  switch (action.type) {
    case "overlay":
      return "Choose a popup created from this screen";
    case "toast":
      return "Choose a toast created from this screen";
    default:
      return "Choose a regular screen as the destination";
  }
}
