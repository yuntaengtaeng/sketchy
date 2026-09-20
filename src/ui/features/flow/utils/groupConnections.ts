import type { Feature, Project, Screen } from "../../../../shared";

// toast 목적지 화면에 놓인 문구 텍스트 이름, 없으면 안내 문구
export function toastLabel(
  project: Project,
  destinationScreenId?: string,
): string {
  return (
    project.elements.find(
      (element) =>
        element.screenId === destinationScreenId && element.type === "text",
    )?.name || "Not described"
  );
}

export type ConnectionRow =
  | { feature: Feature; kind: "navigate" | "popup"; destination?: Screen }
  | { feature: Feature; kind: "toast"; destinationLabel: string }
  | { feature: Feature; kind: "close-overlay" | "describe" };

export type ConnectionGroup = { screen: Screen; rows: ConnectionRow[] };

// action 타입 기준으로 화면 목록 행에 필요한 kind와 대상 정보 계산
function toRow(project: Project, feature: Feature): ConnectionRow {
  const action = feature.action;
  switch (action.type) {
    case "navigate":
    case "overlay": {
      const destination = project.screens.find(
        (screen) => screen.id === action.destinationScreenId,
      );
      return {
        feature,
        kind: action.type === "overlay" ? "popup" : "navigate",
        destination,
      };
    }
    case "toast": {
      const destination = project.screens.find(
        (screen) => screen.id === action.destinationScreenId,
      );
      const label =
        project.elements.find(
          (element) =>
            element.screenId === destination?.id && element.type === "text",
        )?.name || "Not described";
      return { feature, kind: "toast", destinationLabel: label };
    }
    case "close-overlay":
      return { feature, kind: "close-overlay" };
    case "describe":
      return { feature, kind: "describe" };
    default: {
      const exhaustive: never = action;
      throw new Error("Unhandled action type: " + JSON.stringify(exhaustive));
    }
  }
}

// Feature 목록을 출발 화면 기준으로 묶은 화면별 행 목록 구성
export function groupConnections(
  project: Project,
  features: Feature[],
): ConnectionGroup[] {
  const bySource = new Map<string, Feature[]>();
  for (const feature of features) {
    const list = bySource.get(feature.screenId) ?? [];
    list.push(feature);
    bySource.set(feature.screenId, list);
  }
  return project.screens
    .map((screen) => ({ screen, features: bySource.get(screen.id) }))
    .filter(
      (entry): entry is { screen: Screen; features: Feature[] } =>
        !!entry.features?.length,
    )
    .map(({ screen, features: group }) => ({
      screen,
      rows: group.map((feature) => toRow(project, feature)),
    }));
}
