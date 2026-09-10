import { useEffect, useState } from "react";
import { createEmptyProject, type UiMessage } from "../shared";
import Header, { type Tab } from "./components/Header";
import Build from "./features/build/Build";
import Flow from "./features/flow/Flow";
import Spec from "./features/spec/Spec";
import Settings from "./features/settings/Settings";
import { post } from "./plugin";

type Route = { name: "workspace" } | { name: "settings" };

export default function App() {
  const [project, setProject] = useState(createEmptyProject);
  const [screenId, setScreenId] = useState<string>();
  const [elementId, setElementId] = useState<string>();
  const [tab, setTab] = useState<Tab>("build");
  const [route, setRoute] = useState<Route>({ name: "workspace" });
  const [error, setError] = useState("");
  const screen =
    project.screens.find((item) => item.id === screenId) || project.screens[0];
  const element = project.elements.find((item) => item.id === elementId);
  const section =
    element?.type === "section"
      ? element
      : project.elements.find((item) => item.id === element?.parentElementId);

  useEffect(() => {
    onmessage = ({ data }) => {
      const message = data.pluginMessage as UiMessage;
      if (message?.type === "STATE") {
        setProject(message.project);
        setScreenId(message.selectedScreenId);
        setElementId(message.selectedElementId);
        setError("");
      }
      if (message?.type === "ERROR") setError(message.message);
    };
    post({ type: "READY" });
  }, []);

  return (
    <main>
      <Header
        tab={tab}
        context={
          route.name === "settings"
            ? {
                title: "Settings",
                onBack: () => setRoute({ name: "workspace" }),
              }
            : section && screen
              ? {
                  title: "Section",
                  onBack: () =>
                    post({ type: "SELECT_SCREEN", screenId: screen.id }),
                }
              : undefined
        }
        onChange={(nextTab) => {
          setTab(nextTab);
          setRoute({ name: "workspace" });
        }}
        onSettings={() => setRoute({ name: "settings" })}
      />
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
          onScreenChange={setScreenId}
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
