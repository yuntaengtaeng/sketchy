export type Point = { x: number; y: number };

// 경유점을 모서리만 둥글게 이어 붙인 SVG path d 문자열 생성
export function elbowPath(points: Point[], radius: number): string {
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const len1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const len2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const r = Math.min(radius, len1 / 2, len2 / 2);
    const a = {
      x: p1.x - ((p1.x - p0.x) / len1) * r,
      y: p1.y - ((p1.y - p0.y) / len1) * r,
    };
    const b = {
      x: p1.x + ((p2.x - p1.x) / len2) * r,
      y: p1.y + ((p2.y - p1.y) / len2) * r,
    };
    d += ` L${a.x},${a.y} Q${p1.x},${p1.y} ${b.x},${b.y}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last.x},${last.y}`;
}
