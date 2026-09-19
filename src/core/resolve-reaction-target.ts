import type { Feature, FeatureAction, Project } from "../shared/index.ts";

/** 대표 Case가 실제 Figma Reaction으로 만들 목적지의 종류 */
export type ReactionTarget =
  | { kind: "close" }
  | { kind: "navigate"; nodeId?: string; navigation: "NAVIGATE" | "OVERLAY" };

/** overlay, toast 모두 destination을 화면 위에 얹어 보여주는 Figma Overlay라 같은 취급 */
function isOverlayLike(action: FeatureAction) {
  return action.type === "overlay" || action.type === "toast";
}

/** action이 가리키는 목적지 Screen의 nodeId, 목적지가 없는 action이면 undefined */
export function destinationNodeId(project: Project, action: FeatureAction) {
  if (!("destinationScreenId" in action)) return undefined;
  return project.screens.find(
    (screen) => screen.id === action.destinationScreenId,
  )?.nodeId;
}

/** 대표 Case 하나가 트리거 요소에 만들어야 할 실제 Reaction 대상 */
export function resolveReactionTarget(
  project: Project,
  primary: Feature | undefined,
): ReactionTarget {
  if (primary?.action.type === "close-overlay") return { kind: "close" };
  return {
    kind: "navigate",
    nodeId: primary && destinationNodeId(project, primary.action),
    navigation:
      primary && isOverlayLike(primary.action) ? "OVERLAY" : "NAVIGATE",
  };
}
