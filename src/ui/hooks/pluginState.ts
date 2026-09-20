import type { Project, UiMessage } from "../../shared";

export type PluginUiState = {
  project: Project;
  screenId?: string;
  elementId?: string;
  error: string;
  onboardingComplete?: boolean;
  insertedElementId?: string;
};

export type PluginStateAction =
  UiMessage | { type: "CLEAR_ERROR" } | { type: "CLEAR_INSERTED_ELEMENT" };

// 초기 Project를 UI 표시 상태로 변환
export function createPluginUiState(project: Project): PluginUiState {
  return { project, error: "" };
}

// Plugin 메시지와 만료 동작을 다음 UI 상태로 변환
export function pluginStateReducer(
  state: PluginUiState,
  action: PluginStateAction,
): PluginUiState {
  switch (action.type) {
    case "STATE":
      return {
        ...state,
        project: action.project,
        screenId: action.selectedScreenId,
        elementId: action.selectedElementId,
        onboardingComplete: action.onboardingComplete,
        insertedElementId: action.insertedElementId ?? state.insertedElementId,
      };
    case "ERROR":
      return { ...state, error: action.message };
    case "CLEAR_ERROR":
      return { ...state, error: "" };
    case "CLEAR_INSERTED_ELEMENT":
      return { ...state, insertedElementId: undefined };
    default:
      return state;
  }
}
