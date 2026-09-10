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
  parent.insertChild(0, line);
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
