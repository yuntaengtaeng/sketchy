export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type FlowTransform = { tx: number; ty: number; scale: number };
export type Bounds = Point & Size;

// 사용 가능한 화면 안에서 전체 화면 패널 크기 계산
export function fullscreenSize({
  available,
  margin,
  min,
  max,
}: {
  available: Size;
  margin: number;
  min: Size;
  max: Size;
}): Size {
  return {
    width: Math.min(max.width, Math.max(min.width, available.width - margin)),
    height: Math.min(
      max.height,
      Math.max(min.height, available.height - margin),
    ),
  };
}

// 팝오버가 뷰포트 안에 머무르는 좌표 계산
export function popoverPosition({
  anchor,
  viewport,
  popoverWidth,
  margin,
  bottomLimit,
}: {
  anchor: Point;
  viewport: Size;
  popoverWidth: number;
  margin: number;
  bottomLimit: number;
}): Point {
  return {
    x: Math.min(
      Math.max(anchor.x + margin, margin),
      viewport.width - popoverWidth - margin,
    ),
    y: Math.min(
      Math.max(anchor.y + margin, margin),
      viewport.height - bottomLimit,
    ),
  };
}

// 콘텐츠를 뷰포트 중앙에 배치하는 변환 계산
export function centeredTransform({
  viewport,
  content,
}: {
  viewport: Size;
  content: Size;
}): FlowTransform {
  return {
    tx: (viewport.width - content.width) / 2,
    ty: (viewport.height - content.height) / 2,
    scale: 1,
  };
}

// 지정 영역 전체가 여백 안에 보이는 변환 계산
export function fittedTransform({
  viewport,
  bounds,
  padding,
  minScale,
  maxScale,
}: {
  viewport: Size;
  bounds: Bounds;
  padding: number;
  minScale: number;
  maxScale: number;
}): FlowTransform {
  const availableWidth = Math.max(0, viewport.width - padding * 2);
  const availableHeight = Math.max(0, viewport.height - padding * 2);
  const fitScale = Math.min(
    availableWidth / bounds.width,
    availableHeight / bounds.height,
  );
  const scale = Math.min(maxScale, Math.max(minScale, fitScale));
  return {
    tx: (viewport.width - bounds.width * scale) / 2 - bounds.x * scale,
    ty: (viewport.height - bounds.height * scale) / 2 - bounds.y * scale,
    scale,
  };
}

// 기준점의 콘텐츠 좌표를 유지하는 확대 변환 계산
export function zoomedTransform({
  current,
  nextScale,
  pivot,
  minScale,
  maxScale,
}: {
  current: FlowTransform;
  nextScale: number;
  pivot: Point;
  minScale: number;
  maxScale: number;
}): FlowTransform {
  const scale = Math.min(maxScale, Math.max(minScale, nextScale));
  const contentX = (pivot.x - current.tx) / current.scale;
  const contentY = (pivot.y - current.ty) / current.scale;
  return {
    scale,
    tx: pivot.x - contentX * scale,
    ty: pivot.y - contentY * scale,
  };
}
