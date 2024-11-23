export const butLast = <T,>(items: T[]): T[] =>
  items.length === 0 ? [] : items.slice(0, items.length - 1);

export const last = <T,>(items: T[]): T | undefined => items[items.length - 1];

export const partition = <T,>(items: T[], pivot: T): [T[], T[]] => {
  const pivotIndex = items.indexOf(pivot);
  return [
    items.filter((_, index) => index < pivotIndex),
    items.filter((_, index) => index > pivotIndex),
  ];
};

export const reversed = <T,>(items: T[]): T[] => [...items].reverse();

export const nullIfEmpty = <T,>(items: T[]): T[] | null =>
  items.length === 0 ? null : items;

export const headTail = <T,>(
  items: T[]
): { head: T | null; tail: T[] | null } => ({
  head: items.length > 0 ? items[0]! : null,
  tail: items.length > 0 ? items.slice(1) : null,
});
