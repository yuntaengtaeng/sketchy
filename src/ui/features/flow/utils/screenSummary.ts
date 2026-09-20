import type { Project } from "../../../../shared";

export type ScreenSummary = {
  elementCount: number;
  behaviorCount: number;
  incomingCount: number;
};

// 화면 하나의 요소, 동작, 들어오는 연결 개수 집계
export function screenSummary(
  project: Project,
  screenId: string,
): ScreenSummary {
  const elementCount = project.elements.filter(
    (element) => element.screenId === screenId,
  ).length;
  const behaviorCount = project.features.filter(
    (feature) => feature.screenId === screenId,
  ).length;
  const incomingCount = project.features.filter(
    (feature) =>
      "destinationScreenId" in feature.action &&
      feature.action.destinationScreenId === screenId,
  ).length;
  return { elementCount, behaviorCount, incomingCount };
}
