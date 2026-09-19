import {
  BLOCK_DEFINITIONS,
  type Element,
  type Feature,
  type Project,
} from "../../../shared/index.ts";

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

export function buildProjectFlowDiagram(project: Project) {
  const screenNodeId = new Map(
    project.screens.map((screen, index) => [screen.id, `s${index}`]),
  );
  const lines = ["```mermaid", "flowchart TD"];
  for (const screen of project.screens)
    lines.push(
      `  ${screenNodeId.get(screen.id)}["${mermaidLabel(screen.name)}"]`,
    );
  for (const feature of project.features) {
    const action = feature.action;
    if (!("destinationScreenId" in action) || !action.destinationScreenId)
      continue;
    const from = screenNodeId.get(feature.screenId);
    const to = screenNodeId.get(action.destinationScreenId);
    if (!from || !to) continue;
    lines.push(`  ${from} -->|${mermaidLabel(feature.name)}| ${to}`);
  }
  lines.push("```");
  return lines.join("\n");
}

function mermaidLabel(text: string) {
  return text.replace(/"/g, "&quot;").replace(/[|\n]/g, " ").trim();
}

export function buildProjectMarkdown(project: Project) {
  const lines: string[] = ["# Sketchy Spec", "", "## Project Flow", ""];
  lines.push(buildProjectFlowDiagram(project), "");
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

// 반복 개수, 목록 내용, 켜짐 여부처럼 Figma를 열지 않고는 안 보이던 값들을
// Spec에 같이 적어서 이해관계자가 읽기만 해도 실제 구성을 알 수 있게 한다.
// Markdown Export(buildProjectMarkdown)와 Plugin 안의 실시간 Spec 탭(Spec.tsx)
// 둘 다 이 함수 하나를 쓴다 — 두 곳에 같은 로직을 복제하지 않는다
export function elementDetail(element: Element): string | undefined {
  switch (element.type) {
    case "text":
      return element.textSize && element.textSize !== "body"
        ? title(element.textSize)
        : undefined;
    case "input":
      return element.placeholder
        ? `placeholder "${element.placeholder}"`
        : undefined;
    case "listItem":
      return `${title(element.itemType ?? "basic")}, ${element.count ?? 3} rows`;
    case "card":
      return `${title(element.cardType ?? "basic")}, ${element.count ?? 3} cards`;
    case "table":
      return `columns: ${(element.columns ?? ["Column 1", "Column 2", "Column 3"]).join(", ")}; ${element.count ?? 3} rows`;
    case "tabs": {
      const items = element.tabItems ?? ["Tab 1", "Tab 2"];
      const selected = element.selectedTab ?? items[0];
      return `${items.join(", ")}; "${selected}" selected`;
    }
    case "select":
      return `${(element.options ?? ["Option 1", "Option 2"]).length} options${
        element.displayState === "expanded" ? ", expanded" : ""
      }`;
    case "checkbox":
    case "radio":
      return element.checked ? "checked" : "unchecked";
    case "switch":
      return element.checked ? "on" : "off";
    default:
      return undefined;
  }
}

function outlineToMarkdown(items: ElementOutline[], depth = 0): string[] {
  return items.flatMap(({ element, number, children }) => {
    const detail = elementDetail(element);
    const type = BLOCK_DEFINITIONS[element.type].label;
    return [
      `${"  ".repeat(depth)}- ${number}. ${element.name} (${type}${detail ? `, ${detail}` : ""})${
        element.description ? `: ${element.description}` : ""
      }`,
      ...outlineToMarkdown(children, depth + 1),
    ];
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
  const toastMessage =
    action.type === "toast"
      ? project.elements.find(
          (item) => item.screenId === destination?.id && item.type === "text",
        )?.name
      : undefined;
  const result =
    action.type === "close-overlay"
      ? `Close popup${feature.description ? `; ${feature.description}` : ""}`
      : action.type === "toast"
        ? `Show toast: ${toastMessage || "Not described"}${feature.description ? `; ${feature.description}` : ""}`
        : "destinationScreenId" in action
          ? destination
            ? `${action.type === "navigate" ? "Go to" : "Open"} ${destination.name}${feature.description ? `; ${feature.description}` : ""}`
            : "Destination not selected"
          : feature.description || "Outcome not described";
  return `${feature.condition ? `When ${feature.condition}, ` : ""}${trigger} ${element?.name || feature.name} → ${result}`;
}
