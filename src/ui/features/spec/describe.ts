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
    action.type === "navigate"
      ? project.screens.find(
          (screen) => screen.id === action.destinationScreenId,
        )
      : undefined;
  const result =
    action.type === "navigate"
      ? destination
        ? `Go to ${destination.name}${feature.description ? `; ${feature.description} (spec only)` : ""}`
        : "Destination not selected"
      : feature.description || "Outcome not described (spec only)";
  return `${trigger} ${element?.name || feature.name} → ${result}`;
}
