import type { Feature, Project } from "../../../shared";

export const title = (value: string) => value[0].toUpperCase() + value.slice(1);

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
        ? `Go to ${destination.name}`
        : "Destination not selected"
      : feature.description ||
        `Change ${project.states.find((state) => state.id === action.stateId)?.name || "state"}`;
  return `${trigger} ${element?.name || feature.name} → ${result}`;
}
