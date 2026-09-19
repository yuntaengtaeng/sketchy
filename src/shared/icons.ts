// 돋보기 아이콘 도형, 원과 45도 손잡이 좌표를 UI 미리보기와 Plugin 캔버스
// 렌더러가 각자의 방식(JSX vs SVG 문자열)으로 그리되 숫자는 여기 하나만 둔다
export const SEARCH_ICON = {
  size: 14,
  circle: { cx: 4.5, cy: 4.5, r: 4.2 },
  handle: { x1: 7.6, y1: 7.6, x2: 13, y2: 13 },
  strokeWidth: 1.6,
} as const;
