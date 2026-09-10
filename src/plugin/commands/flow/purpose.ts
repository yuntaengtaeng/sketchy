import type { Project, Screen } from "../../../shared";
import { markGenerated } from "./generated";

export function renderPurpose(
  project: Project,
  screen: Screen,
  node: FrameNode,
) {
  if (node.parent?.type !== "PAGE") return;
  const features = project.features.filter(
    (feature) => feature.screenId === screen.id,
  );
  if (!screen.purpose && !features.length) return;
  const note = figma.createFrame();
  markGenerated(note);
  node.parent.appendChild(note);
  note.name = `${screen.name} · Purpose`;
  note.x = node.x;
  note.resize(220, Math.max(92, 72 + features.length * 32));
  note.layoutMode = "VERTICAL";
  note.primaryAxisSizingMode = note.counterAxisSizingMode = "FIXED";
  note.paddingTop =
    note.paddingRight =
    note.paddingBottom =
    note.paddingLeft =
      14;
  note.itemSpacing = 8;
  note.cornerRadius = 3;
  note.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.94 } }];
  note.strokes = [{ type: "SOLID", color: { r: 0.55, g: 0.55, b: 0.55 } }];
  note.strokeWeight = 1;
  const title = figma.createText();
  title.characters = screen.name;
  title.fontSize = 14;
  note.appendChild(title);
  if (screen.purpose) {
    const purpose = figma.createText();
    purpose.characters = screen.purpose;
    purpose.fontSize = 11;
    purpose.resize(192, 32);
    purpose.opacity = 0.8;
    note.appendChild(purpose);
  }
  for (const feature of features) {
    const behavior = figma.createText();
    const action = feature.action;
    const result =
      action.type === "close-overlay"
        ? `close popup${feature.description ? `; ${feature.description}` : ""}`
        : "destinationScreenId" in action
          ? `${action.type === "navigate" ? "go to" : "open"} ${project.screens.find((item) => item.id === action.destinationScreenId)?.name || "choose destination"}${feature.description ? `; ${feature.description}` : ""}`
          : feature.description || "Outcome not described";
    behavior.characters = `- ${feature.condition ? `when ${feature.condition}: ` : ""}${feature.name} click → ${result}`;
    behavior.fontSize = 11;
    behavior.resize(192, 24);
    behavior.textAutoResize = "HEIGHT";
    note.appendChild(behavior);
  }
  note.primaryAxisSizingMode = "AUTO";
  note.y = node.y - note.height - 16;
}
