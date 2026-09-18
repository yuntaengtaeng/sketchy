import {
  BLOCK_DEFINITIONS,
  type Element,
  type Project,
  type Screen,
} from "../../../shared/index.ts";

export type OnboardingStep =
  | "create-screen"
  | "select-screen"
  | "add-button"
  | "select-element"
  | "choose-result";

export function getOnboardingStep(
  project: Project,
  screen: Screen | undefined,
  element: Element | undefined,
  onboardingComplete: boolean | undefined,
): OnboardingStep | undefined {
  if (onboardingComplete === undefined || onboardingComplete) return;

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
