import { switchFormulaType } from "./helpers";
import {
  Formula,
  FormulaExpression,
  FormulaFunction,
  FormulaScope,
  FormulaSymbol,
  FormulaVector,
} from "./types";

export const transpile = (formula: Formula): string =>
  switchFormulaType(formula, {
    scope: (scope: FormulaScope) => {
      const items = scope
        .entrySeq()
        // This currently forces you to explicitly put keys as strings, which is a pain
        .map(([key, value]) => `[${transpile(key)}, ${transpile(value)}]`);
      return `__wrapScope([${items.join(", ")}])`;
    },
    expression: (expression: FormulaExpression) => "",
    vector: (vector: FormulaVector) => "",
    symbol: (symbol: FormulaSymbol) => symbol.symbol,
    number: (number: number) => number.toString(),
    string: (string: string) => `"${string}"`, // Inner quotes aren't escaped
    fn: (fn: FormulaFunction) => {
      throw new Error("Can't transpile a function directly");
    },
    nil: (nil: null) => "null",
  });
