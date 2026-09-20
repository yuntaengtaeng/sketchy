import {
  isContainerElement,
  type Element as SketchyElement,
  type Project,
  type Screen,
} from "../../../shared";
import { post } from "../../plugin";
import BuildNavigation from "./BuildNavigation/BuildNavigation";
import ElementDetails from "./ElementDetails/ElementDetails";
import { getOnboardingStep } from "./utils/onboarding";
import OnboardingCoachmark, {
  OnboardingTarget,
} from "./OnboardingCoachmark/OnboardingCoachmark";
import ScreenEditor, { ScreenBrowser } from "./ScreenEditor/ScreenEditor";
import SectionEditor from "./SectionEditor/SectionEditor";

type Props = {
  project: Project;
  screen?: Screen;
  element?: SketchyElement;
  insertedElementId?: string;
  onboardingComplete?: boolean;
};

export default function Build({
  project,
  screen,
  element,
  insertedElementId,
  onboardingComplete,
}: Props) {
  const onboardingStep = getOnboardingStep(
    project,
    screen,
    element,
    onboardingComplete,
  );
  const coachmark = (
    <OnboardingCoachmark
      step={onboardingStep}
      onSkip={() => post({ type: "DISMISS_ONBOARDING" })}
    />
  );

  if (!screen)
    return (
      <>
        <OnboardingTarget
          active={
            onboardingStep === "create-screen" ||
            onboardingStep === "select-screen"
          }
        >
          <ScreenBrowser project={project} />
        </OnboardingTarget>
        {coachmark}
      </>
    );
  return (
    <>
      <BuildNavigation project={project} screen={screen} element={element} />
      {element ? (
        <>
          {/* key로 element가 바뀔 때마다 다시 마운트, FeatureCaseEditor의
          draft 선택 상태 같은 로컬 state가 다른 Element로 새지 않게 한다 */}
          <ElementDetails
            key={element.id}
            project={project}
            element={element}
            onboarding={onboardingStep === "choose-result"}
          />
          {isContainerElement(element) ? (
            <SectionEditor
              project={project}
              screenId={screen.id}
              section={element}
              selectedElementId={element?.id}
              insertedElementId={insertedElementId}
            />
          ) : null}
        </>
      ) : (
        <ScreenEditor
          project={project}
          screen={screen}
          insertedElementId={insertedElementId}
          onboardingStep={onboardingStep}
        />
      )}
      {coachmark}
    </>
  );
}
