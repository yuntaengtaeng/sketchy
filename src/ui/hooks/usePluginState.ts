import { useEffect, useState } from "react";
import { createEmptyProject, type Project, type UiMessage } from "../../shared";
import { post } from "../plugin";

/** STATE, ERROR 플러그인 메시지를 구독해 UI가 그릴 프로젝트 상태로 변환 */
export function usePluginState(initialProject: Project = createEmptyProject()) {
  const [project, setProject] = useState(initialProject);
  const [screenId, setScreenId] = useState<string>();
  const [elementId, setElementId] = useState<string>();
  const [error, setError] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>();
  const [insertedElementId, setInsertedElementId] = useState<string>();

  useEffect(() => {
    let errorTimer: ReturnType<typeof setTimeout>;
    let highlightTimer: ReturnType<typeof setTimeout>;
    onmessage = ({ data }) => {
      const message = data.pluginMessage as UiMessage;
      if (message?.type === "STATE") {
        setProject(message.project);
        setScreenId(message.selectedScreenId);
        setElementId(message.selectedElementId);
        setOnboardingComplete(message.onboardingComplete);
        if (message.insertedElementId) {
          clearTimeout(highlightTimer);
          setInsertedElementId(message.insertedElementId);
          highlightTimer = setTimeout(
            () => setInsertedElementId(undefined),
            1200,
          );
        }
      }
      if (message?.type === "ERROR") {
        clearTimeout(errorTimer);
        setError(message.message);
        errorTimer = setTimeout(() => setError(""), 8000);
      }
    };
    post({ type: "READY" });
    return () => {
      clearTimeout(errorTimer);
      clearTimeout(highlightTimer);
    };
  }, []);

  return {
    project,
    screenId,
    elementId,
    error,
    onboardingComplete,
    insertedElementId,
  };
}
