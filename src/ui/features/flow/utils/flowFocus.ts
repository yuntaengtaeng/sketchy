import type { Project } from "../../../../shared";

export type FlowFocus = {
  screenIds: Set<string>;
  featureIds: Set<string>;
};

// 선택 화면과 직접 연결된 화면과 Feature ID 수집
export function flowFocus(
  project: Project,
  selectedScreenId: string,
): FlowFocus {
  const screenIds = new Set([selectedScreenId]);
  const featureIds = new Set<string>();
  for (const feature of project.features) {
    const destinationId =
      "destinationScreenId" in feature.action
        ? feature.action.destinationScreenId
        : undefined;
    if (
      feature.screenId !== selectedScreenId &&
      destinationId !== selectedScreenId
    ) {
      continue;
    }
    featureIds.add(feature.id);
    screenIds.add(feature.screenId);
    if (destinationId) screenIds.add(destinationId);
  }
  return { screenIds, featureIds };
}
