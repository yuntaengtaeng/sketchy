import type { DomainElement } from "../../../../shared";
import { PART } from "../../../canvas-name.ts";
import { createLabel, hugFrame } from "./shared";

// Checkbox/Radio/Switch가 공유하는 "표시기 + 라벨" 한 줄 구조
export function createToggleRow(
  element: DomainElement & { type: "checkbox" | "radio" | "switch" },
) {
  const row = hugFrame("HORIZONTAL");
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 8;
  row.fills = [];
  const checked = element.checked ?? false;

  const indicator = figma.createFrame();
  indicator.setPluginData(PART, "indicator");
  indicator.strokes = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
  indicator.strokeWeight = 1.5;

  if (element.type === "switch") {
    indicator.resize(32, 18);
    indicator.cornerRadius = 9;
    indicator.strokes = [];
    indicator.layoutMode = "HORIZONTAL";
    indicator.paddingLeft = indicator.paddingRight = 2;
    indicator.paddingTop = indicator.paddingBottom = 2;
    indicator.primaryAxisAlignItems = checked ? "MAX" : "MIN";
    indicator.fills = [
      {
        type: "SOLID",
        color: checked
          ? { r: 0.15, g: 0.15, b: 0.15 }
          : { r: 0.8, g: 0.8, b: 0.8 },
      },
    ];
    const knob = figma.createFrame();
    knob.setPluginData(PART, "knob");
    knob.resize(14, 14);
    knob.cornerRadius = 7;
    knob.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    indicator.appendChild(knob);
  } else {
    indicator.resize(20, 20);
    indicator.cornerRadius = element.type === "radio" ? 10 : 4;
    indicator.fills = [
      {
        type: "SOLID",
        color: checked ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 1, g: 1, b: 1 },
      },
    ];
    if (element.type === "checkbox") {
      const check = createLabel("✓", 13, { r: 1, g: 1, b: 1 });
      check.setPluginData(PART, "check-glyph");
      check.visible = checked;
      indicator.layoutMode = "HORIZONTAL";
      indicator.primaryAxisAlignItems = "CENTER";
      indicator.counterAxisAlignItems = "CENTER";
      indicator.appendChild(check);
    } else {
      const dot = figma.createFrame();
      dot.setPluginData(PART, "radio-dot");
      dot.resize(10, 10);
      dot.cornerRadius = 5;
      dot.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      dot.visible = checked;
      indicator.layoutMode = "HORIZONTAL";
      indicator.primaryAxisAlignItems = "CENTER";
      indicator.counterAxisAlignItems = "CENTER";
      indicator.appendChild(dot);
    }
  }

  const label = createLabel(element.name, 14, { r: 0.15, g: 0.15, b: 0.15 });
  label.setPluginData(PART, "label");
  row.appendChild(indicator);
  row.appendChild(label);
  return row;
}

export function renderChecked(
  node: FrameNode,
  type: "checkbox" | "radio" | "switch",
  checked: boolean,
) {
  const indicator = node.children.find(
    (child) => child.getPluginData(PART) === "indicator",
  );
  if (indicator?.type !== "FRAME") return;
  if (type === "switch") {
    indicator.primaryAxisAlignItems = checked ? "MAX" : "MIN";
    indicator.fills = [
      {
        type: "SOLID",
        color: checked
          ? { r: 0.15, g: 0.15, b: 0.15 }
          : { r: 0.8, g: 0.8, b: 0.8 },
      },
    ];
    return;
  }
  indicator.fills = [
    {
      type: "SOLID",
      color: checked ? { r: 0.15, g: 0.15, b: 0.15 } : { r: 1, g: 1, b: 1 },
    },
  ];
  const part = type === "checkbox" ? "check-glyph" : "radio-dot";
  const mark = indicator.children.find(
    (child) => child.getPluginData(PART) === part,
  );
  if (mark) mark.visible = checked;
}
