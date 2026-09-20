import {
  BLOCK_DEFINITIONS,
  type Element,
  type Project,
  type Screen,
} from "../../../../shared/index.ts";

export type OnboardingStep =
  | "create-screen"
  | "select-screen"
  | "add-button"
  | "select-element"
  | "choose-result"
  | "view-flow"
  | "view-spec";

// 현재 프로젝트와 보기에서 다음 첫 성공 단계 선택
export function getOnboardingStep({
  project,
  screen,
  element,
  onboardingComplete,
  view,
}: {
  project: Project;
  screen?: Screen;
  element?: Element;
  onboardingComplete?: boolean;
  view: "build" | "flow" | "spec";
}): OnboardingStep | undefined {
  if (onboardingComplete === undefined || onboardingComplete) return;

  if (project.features.length)
    return view === "flow" ? "view-spec" : "view-flow";
  if (view !== "build") return;

  const hasScreens = project.screens.some((item) => !item.kind);
  if (!hasScreens) return "create-screen";
  if (!screen) return "select-screen";

  const hasInteractiveElement = project.elements.some(
    (item) =>
      item.screenId === screen.id &&
      BLOCK_DEFINITIONS[item.type].triggers.length > 0,
  );
  if (!hasInteractiveElement) return "add-button";

  const selectedElementIsInteractive =
    element && BLOCK_DEFINITIONS[element.type].triggers.length > 0;
  if (!selectedElementIsInteractive) return "select-element";

  return "choose-result";
}
