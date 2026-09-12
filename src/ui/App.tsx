import { useEffect, useState } from "react";
import {
  createEmptyProject,
  type ProjectImportPreview,
  type UiMessage,
} from "../shared";
import { BackNavigation, Header, type Tab } from "./components/header";
import Build from "./features/build/Build";
import Flow from "./features/flow/Flow";
import Spec from "./features/spec/Spec";
import Settings from "./features/settings/Settings";
import { download, post } from "./plugin";

type Route = { name: "workspace" } | { name: "settings" };

export default function App() {
  const [project, setProject] = useState(createEmptyProject);
  const [screenId, setScreenId] = useState<string>();
  const [elementId, setElementId] = useState<string>();
  const [tab, setTab] = useState<Tab>("build");
  const [route, setRoute] = useState<Route>({ name: "workspace" });
  const [error, setError] = useState("");
  const [importPreview, setImportPreview] = useState<ProjectImportPreview>();
  const screen = project.screens.find((item) => item.id === screenId);
  const element = project.elements.find((item) => item.id === elementId);
  const context =
    route.name === "settings"
      ? { title: "Settings", onBack: () => setRoute({ name: "workspace" }) }
      : undefined;

  useEffect(() => {
    let errorTimer: ReturnType<typeof setTimeout>;
    onmessage = ({ data }) => {
      const message = data.pluginMessage as UiMessage;
      if (message?.type === "STATE") {
        setProject(message.project);
        setScreenId(message.selectedScreenId);
        setElementId(message.selectedElementId);
      }
      if (message?.type === "PROJECT_EXPORT") {
        download(message.fileName, message.contents);
        setImportPreview(undefined);
      }
      if (message?.type === "PROJECT_IMPORT_PREVIEW")
        setImportPreview(message.preview);
      if (message?.type === "ERROR") {
        clearTimeout(errorTimer);
        setError(message.message);
        errorTimer = setTimeout(() => setError(""), 8000);
      }
    };
    post({ type: "READY" });
    return () => clearTimeout(errorTimer);
  }, []);

  return (
    <main>
      {context ? (
        <BackNavigation title={context.title} onBack={context.onBack} />
      ) : (
        <Header
          tab={tab}
          onChange={(nextTab) => {
            setTab(nextTab);
            setRoute({ name: "workspace" });
          }}
          onSettings={() => setRoute({ name: "settings" })}
        />
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {route.name === "settings" && (
        <Settings settings={project.settings} importPreview={importPreview} />
      )}
      {route.name === "workspace" && tab === "build" && (
        <Build project={project} screen={screen} element={element} />
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
