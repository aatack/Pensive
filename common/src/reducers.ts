import { Json } from "./helpers";

export type Reducer = (current: Json, update: Json) => Json;

export const replace: Reducer = (_, update) => update;

export const array: Reducer = (current, update) => {
  if (Array.isArray(update)) {
    if (update.length === 0) {
      return current;
    } else {
      return array(array(current, update[0]!), update.slice(1));
    }
  }

  if (typeof update !== "string" || update.length < 1) {
    return current;
  }

  const operation = update[0];
  const text = update.slice(1);

  if (!Array.isArray(current)) {
    current = [];
  }

  const present = current.includes(text);

  if (operation === "+" && !present) {
    return [...current, text];
  } else if (operation === "-" && present) {
    const items = current.filter((item: string) => item !== text);
    return items.length === 0 ? null : items;
  } else if (operation === ">" && present) {
    const index = current.indexOf(text);
    if (index >= 0 && index < current.length - 1) {
      const left: Json = current[index]!;
      const right: Json = current[index + 1]!;

      current[index + 1] = left;
      current[index] = right;

      return current;
    }
  } else if (operation === "<" && present) {
    const index = current.indexOf(text);
    if (index > 0) {
      const left: Json = current[index - 1]!;
      const right: Json = current[index]!;

      current[index] = left;
      current[index - 1] = right;

      return current;
    }
  }

  return current;
};
