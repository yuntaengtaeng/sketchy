type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Box = Point & Size;

const SCREEN_GAP = 320;
const SCREENS_PER_ROW = 4;

export function nextScreenPosition(
  viewportCenter: Point,
  size: Size,
  screens: Box[],
) {
  if (!screens.length)
    return {
      x: viewportCenter.x - size.width / 2,
      y: viewportCenter.y - size.height / 2,
    };
  const lastRowY = Math.max(...screens.map((screen) => screen.y));
  const lastRow = screens.filter((screen) => screen.y === lastRowY);
  if (lastRow.length >= SCREENS_PER_ROW)
    return {
      x: Math.min(...screens.map((screen) => screen.x)),
      y:
        Math.max(...screens.map((screen) => screen.y + screen.height)) +
        SCREEN_GAP,
    };
  const rightmost = lastRow.reduce((right, screen) =>
    screen.x + screen.width > right.x + right.width ? screen : right,
  );
  return {
    x: rightmost.x + rightmost.width + SCREEN_GAP,
    y: rightmost.y,
  };
}
