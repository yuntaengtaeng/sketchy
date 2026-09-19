import { BackNavigation, Header } from "./components/header";
import Build from "./features/build/Build";
import Flow from "./features/flow/Flow";
import Settings from "./features/settings/Settings";
import Spec from "./features/spec/Spec";
import { usePluginState } from "./hooks/usePluginState";
import { useRoute } from "./hooks/useRoute";

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

  return (
    <main>
      {route.name === "settings" ? (
        <BackNavigation title="Settings" onBack={closeSettings} />
      ) : (
        <Header tab={tab} onChange={selectTab} onSettings={openSettings} />
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {route.name === "settings" && <Settings settings={project.settings} />}
      {route.name === "workspace" && tab === "build" && (
        <Build
          project={project}
          screen={screen}
          element={element}
          insertedElementId={insertedElementId}
          onboardingComplete={onboardingComplete}
        />
      )}
      {route.name === "workspace" && tab === "flow" && (
        <Flow project={project} selectedScreenId={screenId} />
      )}
      {route.name === "workspace" && tab === "spec" && (
        <Spec project={project} screen={screen} />
      )}
    </main>
  );
}
