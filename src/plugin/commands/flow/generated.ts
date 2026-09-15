export const GENERATED = "sketchy:flow-generated";
export const markGenerated = (node: SceneNode) =>
  node.setPluginData(GENERATED, "true");

export function drawLine(
  parent: PageNode,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  state = false,
) {
  const line = figma.createLine();
  markGenerated(line);
  // 화면 프레임 배경에 가려지지 않도록 항상 페이지 맨 위(z-order 최상단)에 배치
  parent.appendChild(line);
  line.x = startX;
  line.y = startY;
  line.resize(Math.hypot(endX - startX, endY - startY), 0);
  line.rotation = (-Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;
  line.strokes = [
    {
      type: "SOLID",
      color: state
        ? { r: 0.55, g: 0.55, b: 0.55 }
        : { r: 0.25, g: 0.25, b: 0.25 },
    },
  ];
  line.strokeWeight = 2;
  if (state) line.dashPattern = [6, 4];
}
