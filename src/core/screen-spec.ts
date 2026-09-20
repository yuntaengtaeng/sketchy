import type { Feature, FeatureAction, Project, Screen } from "../shared";

export type ScreenSpecIssue =
  | { code: "purpose-missing" }
  | { code: "elements-missing" }
  | { code: "incoming-missing" }
  | { code: "trigger-missing"; featureId: string }
  | { code: "destination-missing"; featureId: string }
  | { code: "outcome-missing"; featureId: string };

export type ScreenSpecBehavior = {
  id: string;
  name: string;
  trigger: string;
  condition?: string;
  result: string;
  note?: string;
  needsAttention: boolean;
};

export type ScreenSpec = {
  screen: Screen;
  elements: Project["elements"];
  behaviors: ScreenSpecBehavior[];
  issues: ScreenSpecIssue[];
};

// Feature trigger를 Element 이름이 포함된 문구로 변환
function triggerText(project: Project, feature: Feature): string {
  const elementName = project.elements.find(
    (element) => element.id === feature.trigger?.elementId,
  )?.name;
  switch (feature.trigger?.type) {
    case "click":
      return `Click ${elementName ?? feature.name}`;
    case "change":
      return `Change ${elementName ?? feature.name}`;
    case "submit":
      return `Submit ${elementName ?? feature.name}`;
    default:
      return "Trigger not linked";
  }
}

// Feature action의 사용자 결과 문구 생성
function actionResult(project: Project, action: FeatureAction): string {
  switch (action.type) {
    case "navigate":
    case "overlay": {
      const destination = project.screens.find(
        (screen) => screen.id === action.destinationScreenId,
      );
      if (!destination) return "Destination needed";
      return `${action.type === "navigate" ? "Go to" : "Open"} ${destination.name}`;
    }
    case "close-overlay":
      return "Close popup";
    case "toast": {
      const message = project.elements.find(
        (element) =>
          element.screenId === action.destinationScreenId &&
          element.type === "text",
      )?.name;
      return message ? `Show toast: ${message}` : "Toast message needed";
    }
    case "describe":
      return "Outcome needed";
    default:
      return "Outcome needed";
  }
}

// Feature의 누락된 trigger, 목적지, 결과 문제 판정
function featureIssues(project: Project, feature: Feature): ScreenSpecIssue[] {
  const issues: ScreenSpecIssue[] = [];
  const action = feature.action;
  if (!feature.trigger) {
    issues.push({ code: "trigger-missing", featureId: feature.id });
  }
  switch (action.type) {
    case "navigate":
    case "overlay": {
      const hasDestination = project.screens.some(
        (screen) => screen.id === action.destinationScreenId,
      );
      if (!hasDestination) {
        issues.push({ code: "destination-missing", featureId: feature.id });
      }
      break;
    }
    case "toast": {
      const hasMessage = project.elements.some(
        (element) =>
          element.screenId === action.destinationScreenId &&
          element.type === "text",
      );
      if (!hasMessage) {
        issues.push({ code: "outcome-missing", featureId: feature.id });
      }
      break;
    }
    case "describe":
      if (!feature.description) {
        issues.push({ code: "outcome-missing", featureId: feature.id });
      }
      break;
    default:
      break;
  }
  return issues;
}

// Feature를 Spec UI가 바로 표시할 수 있는 행동 모델로 변환
function behaviorSpec(project: Project, feature: Feature): ScreenSpecBehavior {
  const issues = featureIssues(project, feature);
  const isDescribedOutcome = feature.action.type === "describe";
  return {
    id: feature.id,
    name: feature.name,
    trigger: triggerText(project, feature),
    condition: feature.condition,
    result: isDescribedOutcome
      ? feature.description || "Outcome needed"
      : actionResult(project, feature.action),
    note: isDescribedOutcome ? undefined : feature.description,
    needsAttention: !!issues.length,
  };
}

// 현재 화면의 읽기 모델과 readiness 문제 생성
export function buildScreenSpec(project: Project, screen: Screen): ScreenSpec {
  const elements = project.elements.filter(
    (element) => element.screenId === screen.id,
  );
  const features = project.features.filter(
    (feature) => feature.screenId === screen.id,
  );
  const issues: ScreenSpecIssue[] = [];
  if (!screen.purpose.trim()) issues.push({ code: "purpose-missing" });
  if (!elements.length) issues.push({ code: "elements-missing" });
  const mainScreens = project.screens.filter((item) => !item.kind);
  if (
    mainScreens[0]?.id !== screen.id &&
    !project.features.some(
      (feature) =>
        "destinationScreenId" in feature.action &&
        feature.action.destinationScreenId === screen.id,
    )
  ) {
    issues.push({ code: "incoming-missing" });
  }
  for (const feature of features) {
    issues.push(...featureIssues(project, feature));
  }
  return {
    screen,
    elements,
    behaviors: features.map((feature) => behaviorSpec(project, feature)),
    issues,
  };
}
