import { switchFormulaType } from "./helpers";
import { Formula } from "./types";

export const serialise = (formula: Formula): string => {
  return switchFormulaType(formula, {
    scope: (scope) => {
      const strings = scope
        .entrySeq()
        .flatMap(([key, item]) => [serialise(key), serialise(item)]);
      return `{ ${strings.join(" ")} }`;
    },
    expression: (expression) =>
      `(${expression.expression.map(serialise).join(" ")})`,
    vector: (vector) => `[${vector.map(serialise).join(" ")}]`,
    symbol: (symbol) => symbol.symbol,
    number: (number) => number.toString(),
    string: (string) => string,
    fn: (fn) => fn.toString(),
    nil: () => "nil",
  });
};
