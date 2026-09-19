import { SEARCH_ICON } from "../../../../shared/icons.ts";
import { PART } from "../../../canvas-name.ts";
import { createLabel, hugFrame } from "./shared";

// rotation으로 손잡이 각도를 맞추면 회전 기준점 계산이 어긋나기 쉬워(원과
// 안 이어짐), 좌표를 직접 SVG 문자열에 박아 넣는다, 도형 자체는 SEARCH_ICON
function createSearchIcon() {
  const { size, circle, handle, strokeWidth } = SEARCH_ICON;
  return figma.createNodeFromSvg(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="none" stroke="#666666" stroke-width="${strokeWidth}" />
      <line x1="${handle.x1}" y1="${handle.y1}" x2="${handle.x2}" y2="${handle.y2}" stroke="#666666" stroke-width="${strokeWidth}" stroke-linecap="round" />
    </svg>
  `);
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
