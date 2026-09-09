import { useEffect, useState } from "react";
import type { Project, UiMessage } from "../shared";
import Build from "./components/Build";
import Flow from "./components/Flow";
import Header, { type Tab } from "./components/Header";
import Spec from "./components/Spec";
import { post } from "./plugin";

const empty: Project = { screens: [], elements: [], interactions: [] };

export default function App() {
  const [project, setProject] = useState(empty);
  const [screenId, setScreenId] = useState<string>();
  const [elementId, setElementId] = useState<string>();
  const [tab, setTab] = useState<Tab>("build");
  const [error, setError] = useState("");
  const screen =
    project.screens.find((item) => item.id === screenId) || project.screens[0];
  const element = project.elements.find((item) => item.id === elementId);

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
      <Header tab={tab} onChange={setTab} />
      {error && <p className="error">{error}</p>}
      {tab === "build" && (
        <Build
          project={project}
          screen={screen}
          element={element}
          onScreenChange={setScreenId}
        />
      )}
      {tab === "flow" && <Flow project={project} />}
      {tab === "spec" && <Spec project={project} screen={screen} />}
    </main>
  );
}
