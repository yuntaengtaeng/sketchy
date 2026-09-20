import type { BlockType } from "../shared";

// Header와 Footer가 있는 화면의 자식 순서 인덱스 계산
export function screenEdgeOrder(
  types: (BlockType | undefined)[],
): number[] | undefined {
  const indexes = types.map((_, index) => index);
  const headers = indexes.filter((index) => types[index] === "header");
  const footers = indexes.filter((index) => types[index] === "footer");
  if (!headers.length && !footers.length) return undefined;
  const middle = indexes.filter(
    (index) => types[index] !== "header" && types[index] !== "footer",
  );
  return [...headers, ...middle, ...footers];
}

// 화면 기본 여백과 Header, Footer 높이로 상하 여백 계산
export function screenEdgePadding({
  base,
  headerHeight,
  footerHeight,
}: {
  base: number;
  headerHeight?: number;
  footerHeight?: number;
}) {
  return {
    top: base + (headerHeight ?? 0),
    bottom: base + (footerHeight ?? 0),
  };
}
