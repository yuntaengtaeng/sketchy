import { PART } from "../../../canvas-name.ts";
import { createLabel, hugFrame } from "./shared";

// 돋보기 아이콘. rotation으로 손잡이 각도를 맞추면 회전 기준점 계산이
// 어긋나기 쉬워(원과 안 이어짐), SVG 좌표를 직접 박아 넣어 원의 오른쪽
// 아래 45도 지점에서 바깥쪽으로 손잡이가 정확히 이어지게 한다
function createSearchIcon() {
  return figma.createNodeFromSvg(`
    <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4.5" cy="4.5" r="4.2" fill="none" stroke="#666666" stroke-width="1.6" />
      <line x1="7.6" y1="7.6" x2="13" y2="13" stroke="#666666" stroke-width="1.6" stroke-linecap="round" />
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
