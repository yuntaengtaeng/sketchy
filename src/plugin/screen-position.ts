type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Box = Point & Size;

const SCREEN_GAP = 320;

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
  const rightmost = screens.reduce((right, screen) =>
    screen.x + screen.width > right.x + right.width ? screen : right,
  );
  return {
    x: rightmost.x + rightmost.width + SCREEN_GAP,
    y: rightmost.y,
  };
}
