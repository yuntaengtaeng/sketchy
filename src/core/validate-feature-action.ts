import { elementAncestors } from "../shared/element-tree.ts";
import type { FeatureAction } from "../shared/index.ts";
import type { CanonicalProject, DomainElement } from "./project-change.ts";

export type FeatureActionIssue = {
  code:
    | "TRIGGER_NOT_SUPPORTED"
    | "DESTINATION_REQUIRED"
    | "DESTINATION_NOT_FOUND"
    | "INVALID_DESTINATION"
    | "NESTED_OVERLAY"
    | "NOT_INSIDE_POPUP";
  message: string;
};

export function validateFeatureAction(
  project: Pick<CanonicalProject, "screens" | "elements">,
  element: DomainElement,
  action: FeatureAction,
  allowNewOverlay = false,
): FeatureActionIssue | undefined {
  if (element.type !== "button")
    return {
      code: "TRIGGER_NOT_SUPPORTED",
      message: "Only buttons support actions in v1.",
    };

  if (
    (action.type === "navigate" ||
      (action.type === "overlay" && !allowNewOverlay)) &&
    !action.destinationScreenId
  )
    return {
      code: "DESTINATION_REQUIRED",
      message: `${action.type} needs a destination.`,
    };

  const destination =
    "destinationScreenId" in action && action.destinationScreenId
      ? project.screens.find((item) => item.id === action.destinationScreenId)
      : undefined;
  if (
    "destinationScreenId" in action &&
    action.destinationScreenId &&
    !destination
  )
    return {
      code: "DESTINATION_NOT_FOUND",
      message: "Destination screen does not exist.",
    };
  if (action.type === "navigate" && destination?.kind)
    return {
      code: "INVALID_DESTINATION",
      message: "Navigate needs a regular screen.",
    };

  const sourceScreen = project.screens.find(
    (item) => item.id === element.screenId,
  );
  if (action.type === "overlay" && sourceScreen?.kind)
    return {
      code: "NESTED_OVERLAY",
      message: "A popup cannot open another popup.",
    };
  if (
    action.type === "overlay" &&
    destination &&
    (destination.kind !== "popup" ||
      destination.baseScreenId !== element.screenId)
  )
    return {
      code: "INVALID_DESTINATION",
      message: "Overlay needs a popup from the same screen.",
    };

  const insidePopup = elementAncestors(project.elements, element).some(
    (item) => item.role === "popup",
  );
  if (action.type === "close-overlay" && !insidePopup)
    return {
      code: "NOT_INSIDE_POPUP",
      message: "Only an element inside a popup can close it.",
    };
}
