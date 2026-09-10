import type { Element, Feature, Project } from "../../../shared";

export const title = (value: string) => value[0].toUpperCase() + value.slice(1);

export type ElementOutline = {
  element: Element;
  number: string;
  children: ElementOutline[];
};

export function outlineElements(
  elements: Element[],
  parentElementId?: string,
  prefix = "",
): ElementOutline[] {
  return elements
    .filter((element) => element.parentElementId === parentElementId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((element, index) => {
      const number = prefix ? `${prefix}-${index + 1}` : `${index + 1}`;
      return {
        element,
        number,
        children: outlineElements(elements, element.id, number),
      };
    });
}

export function describeFeature(project: Project, feature: Feature) {
  const element = project.elements.find(
    (item) => item.id === feature.trigger?.elementId,
  );
  const trigger = feature.trigger?.type
    ? title(feature.trigger.type)
    : "Unlinked";
  const action = feature.action;
  const destination =
    "destinationScreenId" in action
      ? project.screens.find(
          (screen) => screen.id === action.destinationScreenId,
        )
      : undefined;
  const result =
    action.type === "close-overlay"
      ? `Close popup${feature.description ? `; ${feature.description}` : ""}`
      : "destinationScreenId" in action
        ? destination
          ? `${action.type === "navigate" ? "Go to" : "Open"} ${destination.name}${feature.description ? `; ${feature.description}` : ""}`
          : "Destination not selected"
        : feature.description || "Outcome not described";
  return `${feature.condition ? `When ${feature.condition}, ` : ""}${trigger} ${element?.name || feature.name} → ${result}`;
}
