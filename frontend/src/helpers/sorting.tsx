export const sort = <T, K extends string | number>(
  items: T[],
  key: (item: T) => K
): T[] => [
  ...items.sort((left, right) => {
    const leftKey = key(left);
    const rightKey = key(right);
    return leftKey < rightKey ? -1 : rightKey < leftKey ? 1 : 0;
  }),
];
