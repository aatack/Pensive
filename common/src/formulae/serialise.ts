import { switchFormulaType } from "./helpers";
import { Formula } from "./types";

export const serialiseFormula = (formula: Formula): string => {
  return switchFormulaType(formula, {
    scope: (scope) => {
      const strings = scope
        .entrySeq()
        .flatMap(([key, item]) => [
          serialiseFormula(key),
          serialiseFormula(item),
        ]);
      return `{ ${strings.join(" ")} }`;
    },
    expression: (expression) =>
      `(${expression.expression.map(serialiseFormula).join(" ")})`,
    vector: (vector) => `[${vector.map(serialiseFormula).join(" ")}]`,
    symbol: (symbol) => symbol.symbol,
    number: (number) => number.toString(),
    string: (string) => string,
    fn: (fn) => fn.toString(),
    nil: () => "nil",
  });
};
