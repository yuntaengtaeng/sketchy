import { PART } from "../../../canvas-name.ts";
import { createLabel, hugFrame } from "./shared";

// 돋보기 아이콘, auto-layout 없는 고정 14x14 프레임 안에 원+손잡이를 절대
// 좌표로 배치해 하나의 auto-layout 자식처럼 다룬다
function createSearchIcon() {
  const icon = figma.createFrame();
  icon.resize(14, 14);
  icon.fills = [];
  const circle = figma.createEllipse();
  circle.resize(9, 9);
  circle.x = 0;
  circle.y = 0;
  circle.strokes = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
  circle.strokeWeight = 1.6;
  circle.fills = [];
  const handle = figma.createRectangle();
  handle.resize(1.6, 5);
  handle.x = 9;
  handle.y = 9;
  handle.rotation = -45;
  handle.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
  icon.appendChild(circle);
  icon.appendChild(handle);
  return icon;
}

export function createSearchNode() {
  const row = hugFrame("HORIZONTAL");
  row.counterAxisAlignItems = "CENTER";
  row.itemSpacing = 6;
  row.paddingLeft = row.paddingRight = 10;
  row.paddingTop = row.paddingBottom = 8;
  row.cornerRadius = 8;
  row.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  row.strokeWeight = 1;
  row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  const label = createLabel("Search", 13, { r: 0.55, g: 0.55, b: 0.55 });
  label.setPluginData(PART, "label");
  row.appendChild(createSearchIcon());
  row.appendChild(label);
  return row;
}
