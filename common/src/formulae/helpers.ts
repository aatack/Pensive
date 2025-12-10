export const takeWhile = <T>(
  items: T[],
  predicate: (item: T) => boolean
): [T[], T[]] => {
  const index = items.findIndex((item) => !predicate(item));
  return index === -1
    ? [items, []]
    : [items.slice(0, index), items.slice(index)];
};

export const dropWhile = <T>(
  items: T[],
  predicate: (item: T) => boolean
): T[] => takeWhile(items, predicate)[1];

export const ends = <T>(items: T[]): [T | null, T | null] => [
  items[0] ?? null,
  items[items.length - 1] ?? null,
];

export const range = (count: number): number[] =>
  [...new Array(count)].map((_, index) => index);