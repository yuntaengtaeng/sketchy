import { useEffect, useReducer } from "react";
import { createEmptyProject, type Project, type UiMessage } from "../../shared";
import { post } from "../plugin";
import { createPluginUiState, pluginStateReducer } from "./pluginState";

/** STATE, ERROR 플러그인 메시지를 구독해 UI가 그릴 프로젝트 상태로 변환 */
export function usePluginState(initialProject: Project = createEmptyProject()) {
  const [state, dispatch] = useReducer(
    pluginStateReducer,
    initialProject,
    createPluginUiState,
  );

  useEffect(() => {
    let errorTimer: ReturnType<typeof setTimeout>;
    let highlightTimer: ReturnType<typeof setTimeout>;
    onmessage = ({ data }) => {
      const message = data.pluginMessage as UiMessage;
      if (message?.type === "STATE") {
        dispatch(message);
        if (message.insertedElementId) {
          clearTimeout(highlightTimer);
          highlightTimer = setTimeout(
            () => dispatch({ type: "CLEAR_INSERTED_ELEMENT" }),
            1200,
          );
        }
      }
      if (message?.type === "ERROR") {
        clearTimeout(errorTimer);
        dispatch(message);
        errorTimer = setTimeout(() => dispatch({ type: "CLEAR_ERROR" }), 8000);
      }
    };
    post({ type: "READY" });
    return () => {
      clearTimeout(errorTimer);
      clearTimeout(highlightTimer);
    };
  }, []);

  return state;
}
