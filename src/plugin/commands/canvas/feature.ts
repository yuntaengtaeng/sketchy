import {
  BLOCK_DEFINITIONS,
  type Feature,
  type FeatureAction,
  type Project,
} from "../../../shared";
import { validateFeatureAction } from "../../../core/validate-feature-action";
import { readProject, saveProject } from "../../storage/project";
import {
  updateCloseOverlay,
  updateNavigation,
  withoutMissingDestinations,
} from "../sync-prototype";
import { id } from "./utils";
import { createOverlayScreen } from "./screen";
import { createToastScreen } from "./toast";

export async function syncReaction(
  source: SceneNode & ReactionMixin,
  project: Project,
  previous: Feature[],
  sourceElementId: string,
) {
  const destinationIds = source.reactions.flatMap((reaction) =>
    (reaction.actions || (reaction.action ? [reaction.action] : [])).flatMap(
      (action) =>
        action.type === "NODE" && action.destinationId
          ? [action.destinationId]
          : [],
    ),
  );
  const existingDestinationIds = new Set<string>();
  for (const destinationId of destinationIds)
    if (await figma.getNodeByIdAsync(destinationId))
      existingDestinationIds.add(destinationId);
  let reactions = withoutMissingDestinations(
    source.reactions,
    existingDestinationIds,
  );
  for (const feature of previous) {
    const action = feature.action;
    if (action.type === "close-overlay") {
      reactions = updateCloseOverlay(reactions, true);
      continue;
    }
    const destination =
      "destinationScreenId" in action
        ? project.screens.find(
            (screen) => screen.id === action.destinationScreenId,
          )
        : undefined;
    reactions = updateNavigation(reactions, destination?.nodeId);
  }
  const primary = project.features.find(
    (feature) =>
      feature.trigger?.elementId === sourceElementId && !feature.condition,
  );
  const primaryDestinationId =
    primary && "destinationScreenId" in primary.action
      ? primary.action.destinationScreenId
      : undefined;
  const destination = project.screens.find(
    (screen) => screen.id === primaryDestinationId,
  );
  await source.setReactionsAsync(
    primary?.action.type === "close-overlay"
      ? updateCloseOverlay(reactions)
      : updateNavigation(
          reactions,
          undefined,
          destination?.nodeId,
          primary?.action.type === "overlay" || primary?.action.type === "toast"
            ? "OVERLAY"
            : "NAVIGATE",
        ),
  );
}

export async function saveFeature(
  sourceElementId: string,
  input: FeatureAction,
  featureId?: string,
  condition?: string,
  description?: string,
) {
  const project = readProject();
  const element = project.elements.find((item) => item.id === sourceElementId);
  let action = input;
  const destinationScreenId =
    "destinationScreenId" in action ? action.destinationScreenId : undefined;
  let destination = project.screens.find(
    (item) => item.id === destinationScreenId,
  );
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (
    !element ||
    !BLOCK_DEFINITIONS[element.type].triggers.some(
      (trigger) => trigger === "click",
    ) ||
    !source ||
    !("setReactionsAsync" in source)
  )
    throw new Error("Select a Button, List Item, or Card, then try again.");
  const issue = validateFeatureAction(project, element, action, true);
  if (issue)
    throw new Error(
      {
        TRIGGER_NOT_SUPPORTED:
          "Select a Button, List Item, or Card, then try again.",
        DESTINATION_REQUIRED: "Choose a destination to continue.",
        DESTINATION_NOT_FOUND:
          "The destination no longer exists. Choose another destination.",
        INVALID_DESTINATION:
          action.type === "overlay"
            ? "Choose a popup created from this screen."
            : action.type === "toast"
              ? "Choose a toast created from this screen."
              : "Choose a regular screen as the destination.",
        NESTED_OVERLAY:
          "Choose another result; a popup cannot open another popup.",
        NOT_INSIDE_POPUP: "Choose Close popup from an element inside a popup.",
      }[issue.code],
    );
  const previous = project.features.filter(
    (feature) => feature.trigger?.elementId === sourceElementId,
  );
  const featureIndex = featureId
    ? project.features.findIndex(
        (feature) =>
          feature.id === featureId &&
          feature.trigger?.elementId === sourceElementId,
      )
    : -1;
  if (featureId && featureIndex < 0)
    throw new Error(
      "This outcome no longer exists. Select the element and try again.",
    );
  let createdOverlay: FrameNode | undefined;
  if (action.type === "overlay" && !destination) {
    const created = await createOverlayScreen(project, element.screenId);
    destination = created.screen;
    createdOverlay = created.node;
    action = { ...action, destinationScreenId: destination.id };
  }
  if (action.type === "toast" && !destination) {
    const created = await createToastScreen(project, element.screenId);
    destination = created.screen;
    createdOverlay = created.node;
    action = { ...action, destinationScreenId: destination.id };
  }
  const feature = {
    id: featureId || id(),
    screenId: element.screenId,
    trigger: { type: "click" as const, elementId: sourceElementId },
    name: element.name,
    condition: condition?.trim() || undefined,
    description: description?.trim() || undefined,
    action,
  };
  if (featureIndex < 0) project.features.push(feature);
  else project.features[featureIndex] = feature;
  if (source.type === "FRAME") {
    source.children
      .find(
        (child) => child.getPluginData("sketchy:role") === "state-indicator",
      )
      ?.remove();
  }
  try {
    await syncReaction(source, project, previous, sourceElementId);
  } catch (error) {
    createdOverlay?.remove();
    throw error;
  }
  saveProject(project);
  return project;
}

export async function deleteFeature(featureId: string) {
  const project = readProject();
  const feature = project.features.find((item) => item.id === featureId);
  const element = project.elements.find(
    (item) => item.id === feature?.trigger?.elementId,
  );
  const source = element && (await figma.getNodeByIdAsync(element.nodeId));
  if (!feature || !element || !source || !("setReactionsAsync" in source))
    throw new Error(
      "This outcome no longer exists. Select the element and try again.",
    );
  const previous = project.features.filter(
    (item) => item.trigger?.elementId === element.id,
  );
  project.features = project.features.filter((item) => item.id !== featureId);
  await syncReaction(source, project, previous, element.id);
  saveProject(project);
  return project;
}
