import { BLOCK_DEFINITIONS } from "../../../shared";
import { readProject, saveProject } from "../../storage/project";
import { updateNavigation } from "../sync-prototype";
import { id } from "./utils";

export async function saveFeature(
  sourceElementId: string,
  input:
    { type: "navigate"; destinationScreenId?: string } | { type: "describe" },
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === sourceElementId);
  const destination =
    input.type === "navigate"
      ? project.screens.find((item) => item.id === input.destinationScreenId)
      : undefined;
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    !BLOCK_DEFINITIONS[element.type].triggers.some(
      (trigger) => trigger === "click",
    ) ||
    !source ||
    !("setReactionsAsync" in source)
  )
    throw new Error("Select a Sketchy button.");
  if (input.type === "navigate" && input.destinationScreenId && !destination)
    throw new Error("Select an existing destination screen.");
  const previous = project.features.find(
    (item) => item.trigger?.elementId === sourceElementId,
  );
  const previousAction = previous?.action;
  const previousDestination =
    previousAction?.type === "navigate"
      ? project.screens.find(
          (item) => item.id === previousAction.destinationScreenId,
        )
      : undefined;
  const reactions = updateNavigation(
    source.reactions,
    previousDestination?.nodeId,
  );
  project.features = project.features.filter(
    (item) => item.trigger?.elementId !== sourceElementId,
  );
  if (input.type === "navigate") {
    if (source.type === "FRAME")
      source.children
        .find(
          (child) => child.getPluginData("sketchy:role") === "state-indicator",
        )
        ?.remove();
    await source.setReactionsAsync(
      updateNavigation(reactions, undefined, destination?.nodeId),
    );
    project.features.push({
      id: previous?.id || id(),
      screenId: element.screenId,
      trigger: { type: "click", elementId: sourceElementId },
      name: element.name,
      description: element.description,
      action: {
        type: "navigate",
        destinationScreenId: destination?.id,
      },
    });
  } else {
    await source.setReactionsAsync(reactions);
    if (source.type === "FRAME") {
      source.children
        .find(
          (child) => child.getPluginData("sketchy:role") === "state-indicator",
        )
        ?.remove();
    }
    project.features.push({
      id: previous?.id || id(),
      screenId: element.screenId,
      trigger: { type: "click", elementId: sourceElementId },
      name: element.name,
      description: element.description,
      action: { type: "describe" },
    });
  }
  saveProject(project);
  return project;
}
