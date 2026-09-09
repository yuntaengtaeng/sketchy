import type { PluginMessage, Project } from "../shared";
import {
  createInteraction,
  createScreen,
  insertBlock,
  selectScreen,
  updateElement,
  updateScreen,
} from "./canvas";
import { renderFlow } from "./flow-map";
import { cleanProject, readProject } from "./project";

figma.showUI(__html__, { width: 360, height: 620, themeColors: true });

function selection() {
  const node = figma.currentPage.selection[0];
  return {
    selectedScreenId: node?.getPluginData("sketchy:screen-id") || undefined,
    selectedElementId: node?.getPluginData("sketchy:element-id") || undefined,
  };
}

async function sync(project: Project = readProject(), draw = false) {
  project = await cleanProject(project);
  if (draw) await renderFlow(project);
  figma.ui.postMessage({ type: "STATE", project, ...selection() });
}

figma.ui.onmessage = async (message: PluginMessage) => {
  try {
    if (message.type === "READY") await sync(readProject(), true);
    if (message.type === "CREATE_SCREEN")
      await sync(await createScreen(message.name), true);
    if (message.type === "INSERT_BLOCK")
      await sync(await insertBlock(message.screenId, message.block));
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
    if (message.type === "CREATE_INTERACTION")
      await sync(
        await createInteraction(
          message.sourceElementId,
          message.destinationScreenId,
        ),
        true,
      );
    if (message.type === "SELECT_SCREEN") await selectScreen(message.screenId);
  } catch (error) {
    figma.ui.postMessage({
      type: "ERROR",
      message: error instanceof Error ? error.message : "Something went wrong.",
    });
  }
};

figma.on("selectionchange", () => sync());
