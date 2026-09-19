import { elementAncestors } from "../shared/element-tree.ts";
import {
  BLOCK_DEFINITIONS,
  type DomainElement,
  type FeatureAction,
  type Screen,
} from "../shared/index.ts";

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
  project: { screens: Omit<Screen, "nodeId">[]; elements: DomainElement[] },
  element: DomainElement,
  action: FeatureAction,
  allowNewOverlay = false,
): FeatureActionIssue | undefined {
  // button 하드코딩 대신 BLOCK_DEFINITIONS의 triggers를 본다, click 트리거를
  // 가진 블록(List Item, Card 등)이 늘어나도 여기 손댈 필요가 없다
  if (!BLOCK_DEFINITIONS[element.type].triggers.some((t) => t === "click"))
    return {
      code: "TRIGGER_NOT_SUPPORTED",
      message: "This element doesn't support actions.",
    };

  if (
    (action.type === "navigate" ||
      ((action.type === "overlay" || action.type === "toast") &&
        !allowNewOverlay)) &&
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
  if (
    action.type === "toast" &&
    destination &&
    (destination.kind !== "toast" ||
      destination.baseScreenId !== element.screenId)
  )
    return {
      code: "INVALID_DESTINATION",
      message: "Toast needs a toast created from the same screen.",
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
