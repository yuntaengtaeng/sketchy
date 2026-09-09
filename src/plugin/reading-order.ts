type Positioned<T> = { item: T; x: number; y: number };

export function readingOrder<T>(items: Positioned<T>[]) {
  const rows: Positioned<T>[][] = [];
  for (const item of [...items].sort((a, b) => a.y - b.y)) {
    const row = rows.at(-1);
    if (!row || item.y - row[0].y > 8) rows.push([item]);
    else row.push(item);
  }
  return rows.flatMap((row) => row.sort((a, b) => a.x - b.x));
}
