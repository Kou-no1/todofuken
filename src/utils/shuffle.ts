export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

export function takeRandom<T>(items: T[], count: number, excluded: T[] = []): T[] {
  const excludedSet = new Set(excluded);
  return shuffle(items.filter((item) => !excludedSet.has(item))).slice(0, count);
}
