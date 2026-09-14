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

export function buildProjectMarkdown(project: Project) {
  const lines: string[] = ["# Sketchy Spec", ""];
  for (const screen of project.screens) {
    const elements = project.elements.filter(
      (element) => element.screenId === screen.id,
    );
    const features = project.features.filter(
      (feature) => feature.screenId === screen.id,
    );
    lines.push(`## ${screen.name}`, "");
    if (screen.purpose) lines.push(screen.purpose, "");
    lines.push("### Elements", "");
    const outline = outlineElements(elements);
    lines.push(
      ...(outline.length ? outlineToMarkdown(outline) : ["No elements yet."]),
      "",
    );
    lines.push("### Behavior", "");
    lines.push(
      ...(features.length
        ? features.map((feature) => `- ${describeFeature(project, feature)}`)
        : ["No behavior described yet."]),
      "",
    );
  }
  return lines.join("\n");
}

function outlineToMarkdown(items: ElementOutline[], depth = 0): string[] {
  return items.flatMap(({ element, number, children }) => [
    `${"  ".repeat(depth)}- ${number}. ${element.name} (${title(element.type)})${
      element.description ? `: ${element.description}` : ""
    }`,
    ...outlineToMarkdown(children, depth + 1),
  ]);
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
