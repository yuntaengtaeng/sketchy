import type { PluginMessage, Project } from "../shared";
import {
  createScreen,
  deleteElement,
  deleteScreen,
  duplicateScreen,
  insertBlock,
  setButtonVariant,
  setSectionDirection,
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

figma.showUI(__html__, { width: 360, height: 720, themeColors: true });

let suppressDocumentChange = false;
let redrawTimer: ReturnType<typeof setTimeout>;

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

async function sync(project: Project = readProject(), draw = false) {
  project = await cleanProject(project);
  if (draw) {
    suppressDocumentChange = true;
    try {
      await renderFlow(project);
    } finally {
      setTimeout(() => (suppressDocumentChange = false), 200);
    }
  }
  figma.ui.postMessage({ type: "STATE", project, ...selection() });
}

figma.ui.onmessage = async (message: PluginMessage) => {
  try {
    if (message.type === "READY") await sync(readProject(), true);
    if (message.type === "UPDATE_PROJECT_SETTINGS")
      await sync(updateProjectSettings(message.settings));
    if (message.type === "CREATE_SCREEN")
      await sync(await createScreen(message.name), true);
    if (message.type === "DUPLICATE_SCREEN")
      await sync(await duplicateScreen(message.screenId), true);
    if (message.type === "DELETE_SCREEN")
      await sync(await deleteScreen(message.screenId), true);
    if (message.type === "INSERT_BLOCK")
      await sync(
        await insertBlock(
          message.screenId,
          message.block,
          message.parentElementId,
          message.buttonVariant,
        ),
      );
    if (message.type === "SET_BUTTON_VARIANT")
      await sync(await setButtonVariant(message.elementId, message.variant));
    if (message.type === "SET_SECTION_DIRECTION")
      await sync(
        await setSectionDirection(message.elementId, message.direction),
      );
    if (message.type === "DELETE_ELEMENT")
      await sync(await deleteElement(message.elementId), true);
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
    if (message.type === "SAVE_FEATURE")
      await sync(
        await saveFeature(message.sourceElementId, message.action),
        true,
      );
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
  figma.on("documentchange", () => {
    if (suppressDocumentChange) return;
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => sync(readProject(), true), 200);
  }),
);
