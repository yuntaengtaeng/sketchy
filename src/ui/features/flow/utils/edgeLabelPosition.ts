import type { FlowEdge } from "./buildFlowDiagram";

export type EdgeLabelPosition = {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
};

// 연결선 모양에 맞는 겹치지 않는 label 좌표 계산
export function edgeLabelPosition(edge: FlowEdge): EdgeLabelPosition {
  const points = edge.points;
  if (points.length === 2) {
    return {
      x: points[0].x + 8,
      y: (points[0].y + points[1].y) / 2,
      anchor: "start",
    };
  }
  if (edge.dashed) {
    const [a, b] = points.slice(-2);
    return { x: (a.x + b.x) / 2, y: b.y - 8, anchor: "middle" };
  }
  const laneX = Math.min(...points.map((point) => point.x));
  const laneYs = points
    .filter((point) => point.x === laneX)
    .map((point) => point.y);
  const midY = (Math.min(...laneYs) + Math.max(...laneYs)) / 2;
  return { x: laneX - 6, y: midY, anchor: "end" };
}
