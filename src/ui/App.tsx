import { BackNavigation, Header } from "./components/header";
import ErrorMessage from "./components/ErrorMessage/ErrorMessage";
import Build from "./features/build/Build";
import Flow from "./features/flow/Flow";
import Settings from "./features/settings/Settings";
import Spec from "./features/spec/Spec";
import OnboardingCoachmark from "./features/build/OnboardingCoachmark/OnboardingCoachmark";
import { getOnboardingStep } from "./features/build/utils/onboarding";
import { usePluginState } from "./hooks/usePluginState";
import { useRoute } from "./hooks/useRoute";
import { post } from "./plugin";

export default function App() {
  const {
    project,
    screenId,
    elementId,
    error,
    onboardingComplete,
    insertedElementId,
  } = usePluginState();
  const { tab, route, selectTab, openSettings, closeSettings } = useRoute();
  const screen = project.screens.find((item) => item.id === screenId);
  const element = project.elements.find((item) => item.id === elementId);
  const onboardingStep = getOnboardingStep({
    project,
    screen,
    element,
    onboardingComplete,
    view: tab,
  });
  let onboardingTab: typeof tab | undefined;
  if (onboardingStep === "view-flow") onboardingTab = "flow";
  if (onboardingStep === "view-spec") onboardingTab = "spec";

  // 탭 전환과 첫 성공 완료 메시지 전송
  const changeTab = (nextTab: typeof tab) => {
    if (nextTab === "spec" && onboardingStep === "view-spec")
      post({ type: "COMPLETE_ONBOARDING" });
    selectTab(nextTab);
  };

  return (
    <main>
      {route.name === "settings" ? (
        <BackNavigation title="Settings" onBack={closeSettings} />
      ) : (
        <Header
          tab={tab}
          onboardingTab={onboardingTab}
          onChange={changeTab}
          onSettings={openSettings}
        />
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {route.name === "settings" && (
        <Settings
          settings={project.settings}
          onRestartTour={() => selectTab("build")}
        />
      )}
      {route.name === "workspace" && tab === "build" && (
        <Build
          project={project}
          screen={screen}
          element={element}
          insertedElementId={insertedElementId}
          onboardingStep={onboardingStep}
        />
      )}
      {route.name === "workspace" && tab === "flow" && (
        <Flow project={project} selectedScreenId={screenId} />
      )}
      {route.name === "workspace" && tab === "spec" && (
        <Spec project={project} screen={screen} />
      )}
      {route.name === "workspace" && (
        <OnboardingCoachmark
          step={onboardingStep}
          onSkip={() => post({ type: "DISMISS_ONBOARDING" })}
        />
      )}
    </main>
  );
}
