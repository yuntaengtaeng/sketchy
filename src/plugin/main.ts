import { DEFAULT_UI_SIZE, type PluginMessage, type Project } from "../shared";
import {
  createScreen,
  deleteFeature,
  deleteElement,
  deleteScreen,
  duplicateScreen,
  insertBlock,
  moveElement,
  reorderElement,
  setButtonVariant,
  setCardContent,
  setCardType,
  setChecked,
  setCount,
  setInputPlaceholder,
  setListItemContent,
  setListItemType,
  setSectionDirection,
  setSelectDisplayState,
  setSelectOptions,
  setTableColumns,
  setTableRows,
  setTabItems,
  setTabSelection,
  setTextSize,
  selectElement,
  selectScreen,
  saveFeature,
  updateElement,
  updateScreen,
} from "./commands/canvas";
import { renderFlow } from "./commands/render-flow";
import {
  cleanProject,
  readProject,
  updateProjectSettings,
} from "./storage/project";

figma.showUI(__html__, { ...DEFAULT_UI_SIZE, themeColors: true });

let suppressDocumentChange = false;
let onboardingComplete = false;
let redrawTimer: ReturnType<typeof setTimeout>;
let suppressTimer: ReturnType<typeof setTimeout>;
const ONBOARDING_KEY = "sketchy:onboarding-complete";
const ONBOARDING_STARTED_KEY = "sketchy:onboarding-started";

async function completeOnboarding() {
  onboardingComplete = true;
  await figma.clientStorage.setAsync(ONBOARDING_KEY, true);
}
function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  return String(error);
}

function selection() {
  let node: BaseNode | null = figma.currentPage.selection[0] || null;
  while (node && !node.getPluginData("sketchy:screen-id") && "parent" in node)
    node = node.parent;
  return {
    selectedScreenId: node?.getPluginData("sketchy:screen-id") || undefined,
    selectedElementId: node?.getPluginData("sketchy:element-id") || undefined,
  };
}

function logCopiedSketchyElements(event: DocumentChangeEvent) {
  const project = readProject();
  for (const change of event.documentChanges) {
    if (change.type !== "CREATE") continue;
    if (!("getPluginData" in change.node)) continue;
    const elementId = change.node.getPluginData("sketchy:element-id");
    const original = project.elements.find(
      (element) => element.id === elementId,
    );
    if (!original || original.nodeId === change.node.id) continue;
    console.warn("[Sketchy copied element outside plugin]", {
      elementId,
      originalNodeId: original.nodeId,
      copiedNodeId: change.node.id,
      origin: change.origin,
    });
  }
}

async function sync(
  project: Project = readProject(),
  draw = false,
  insertedElementId?: string,
) {
  if (draw) {
    clearTimeout(suppressTimer);
    suppressDocumentChange = true;
  }
  try {
    project = await cleanProject(project);
    if (draw) await renderFlow(project);
    figma.ui.postMessage({
      type: "STATE",
      project,
      ...selection(),
      onboardingComplete,
      insertedElementId,
    });
  } finally {
    if (draw)
      suppressTimer = setTimeout(() => (suppressDocumentChange = false), 200);
  }
}

figma.ui.onmessage = async (message: PluginMessage) => {
  try {
    if (message.type === "READY") {
      const project = readProject();
      const savedOnboardingComplete =
        (await figma.clientStorage.getAsync(ONBOARDING_KEY)) === true;
      const onboardingStarted =
        (await figma.clientStorage.getAsync(ONBOARDING_STARTED_KEY)) === true;
      const hasExistingProject =
        project.screens.length > 0 ||
        project.elements.length > 0 ||
        project.features.length > 0;
      onboardingComplete =
        savedOnboardingComplete || (hasExistingProject && !onboardingStarted);
      if (!hasExistingProject && !onboardingStarted)
        await figma.clientStorage.setAsync(ONBOARDING_STARTED_KEY, true);
      if (onboardingComplete && !savedOnboardingComplete)
        await figma.clientStorage.setAsync(ONBOARDING_KEY, true);
      await sync(project, true);
    }
    if (
      message.type === "DISMISS_ONBOARDING" ||
      message.type === "COMPLETE_ONBOARDING"
    ) {
      await completeOnboarding();
      await sync();
    }
    if (message.type === "RESTART_ONBOARDING") {
      onboardingComplete = false;
      await figma.clientStorage.setAsync(ONBOARDING_KEY, false);
      await figma.clientStorage.setAsync(ONBOARDING_STARTED_KEY, true);
      await sync();
    }
    if (message.type === "RESIZE_UI")
      figma.ui.resize(message.width, message.height);
    if (message.type === "UPDATE_PROJECT_SETTINGS") {
      // Flow 화살표 표시 여부만 Canvas 다시 그리기가 필요하다, 화면 크기
      // 프리셋 같은 나머지 설정은 이후 새 화면에만 적용돼 다시 그릴 필요가 없다
      const showFlowArrowsChanged =
        readProject().settings.showFlowArrows !==
        message.settings.showFlowArrows;
      await sync(
        updateProjectSettings(message.settings),
        showFlowArrowsChanged,
      );
    }
    if (message.type === "CREATE_SCREEN")
      await sync(await createScreen(message.name), true);
    if (message.type === "DUPLICATE_SCREEN")
      await sync(await duplicateScreen(message.screenId), true);
    if (message.type === "DELETE_SCREEN")
      await sync(await deleteScreen(message.screenId), true);
    if (message.type === "INSERT_BLOCK") {
      const { project, elementId } = await insertBlock(
        message.screenId,
        message.block,
        message.parentElementId,
        message.buttonVariant,
      );
      await sync(project, false, elementId);
    }
    if (message.type === "SET_BUTTON_VARIANT")
      await sync(await setButtonVariant(message.elementId, message.variant));
    if (message.type === "SET_SECTION_DIRECTION")
      await sync(
        await setSectionDirection(message.elementId, message.direction),
      );
    if (message.type === "SET_TEXT_SIZE")
      await sync(await setTextSize(message.elementId, message.size));
    if (message.type === "SET_CHECKED")
      await sync(await setChecked(message.elementId, message.checked));
    if (message.type === "SET_TAB_ITEMS")
      await sync(await setTabItems(message.elementId, message.items));
    if (message.type === "SET_TAB_SELECTION")
      await sync(await setTabSelection(message.elementId, message.selectedTab));
    if (message.type === "SET_SELECT_OPTIONS")
      await sync(await setSelectOptions(message.elementId, message.options));
    if (message.type === "SET_SELECT_DISPLAY_STATE")
      await sync(
        await setSelectDisplayState(message.elementId, message.displayState),
      );
    if (message.type === "SET_INPUT_PLACEHOLDER")
      await sync(
        await setInputPlaceholder(message.elementId, message.placeholder),
      );
    if (message.type === "SET_LIST_ITEM_TYPE")
      await sync(await setListItemType(message.elementId, message.itemType));
    if (message.type === "SET_CARD_TYPE")
      await sync(await setCardType(message.elementId, message.cardType));
    if (message.type === "SET_TABLE_COLUMNS")
      await sync(await setTableColumns(message.elementId, message.columns));
    if (message.type === "SET_COUNT")
      await sync(await setCount(message.elementId, message.count));
    if (message.type === "SET_CARD_CONTENT")
      await sync(await setCardContent(message.elementId, message.items));
    if (message.type === "SET_LIST_ITEM_CONTENT")
      await sync(await setListItemContent(message.elementId, message.items));
    if (message.type === "SET_TABLE_ROWS")
      await sync(await setTableRows(message.elementId, message.rows));
    if (message.type === "DELETE_ELEMENT")
      await sync(await deleteElement(message.elementId), true);
    if (message.type === "MOVE_ELEMENT")
      await sync(await moveElement(message.elementId, message.direction), true);
    if (message.type === "REORDER_ELEMENT")
      await sync(
        await reorderElement(message.elementId, message.toIndex),
        true,
      );
    if (message.type === "UPDATE_ELEMENT")
      await sync(
        await updateElement(
          message.elementId,
          message.name,
          message.description,
        ),
        true,
      );
    if (message.type === "UPDATE_SCREEN")
      await sync(
        await updateScreen(message.screenId, message.name, message.purpose),
        true,
      );
    if (message.type === "SAVE_FEATURE") {
      const project = await saveFeature({
        sourceElementId: message.sourceElementId,
        action: message.action,
        featureId: message.featureId,
        condition: message.condition,
        description: message.description,
      });
      await sync(project, true);
    }
    if (message.type === "DELETE_FEATURE")
      await sync(await deleteFeature(message.featureId), true);
    if (message.type === "SELECT_SCREEN") await selectScreen(message.screenId);
    if (message.type === "SELECT_ELEMENT")
      await selectElement(message.elementId);
  } catch (error) {
    figma.ui.postMessage({
      type: "ERROR",
      message: errorMessage(error),
    });
  }
};

figma.on("selectionchange", () => sync());
void figma.loadAllPagesAsync().then(() =>
  figma.on("documentchange", (event) => {
    if (suppressDocumentChange) return;
    logCopiedSketchyElements(event);
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => sync(readProject(), true), 200);
  }),
);
