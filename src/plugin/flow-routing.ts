export type RoutePoint = { x: number; y: number };

export function elbowRoute(
  start: RoutePoint,
  end: RoutePoint,
  horizontal: boolean,
  laneOffset = 0,
) {
  if (horizontal) {
    const middle = (start.x + end.x) / 2 + laneOffset;
    return [start, { x: middle, y: start.y }, { x: middle, y: end.y }, end];
  }
  const middle = (start.y + end.y) / 2 + laneOffset;
  return [start, { x: start.x, y: middle }, { x: end.x, y: middle }, end];
}

export const routeLaneOffset = (index: number, count: number) =>
  (index - (count - 1) / 2) * 32;

export function longestRouteSegment(points: RoutePoint[]) {
  return points.slice(1).reduce(
    (longest, end, index) => {
      const start = points[index];
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      return length > longest.length ? { start, end, length } : longest;
    },
    { start: points[0], end: points[1], length: 0 },
  );
}
