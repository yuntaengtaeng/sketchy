export function adoptCanvasName(item: { name: string }, canvasName?: string) {
  const name = canvasName?.trim();
  if (!name || name === item.name) return false;
  item.name = name;
  return true;
}
