import { List } from "immutable";
import { switchFormulaType } from "./helpers";
import {
  Formula,
  FormulaExpression,
  FormulaFunction,
  FormulaScope,
  FormulaSymbol,
  FormulaVector,
  isFormulaSymbol,
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
    expression: (expression: FormulaExpression) => {
      const head = expression.expression.first();
      const body = expression.expression.rest();

      if (head == null) {
        throw new Error("Can't transpile an empty expression");
      }

      if (isFormulaSymbol(head)) {
        if (head.symbol === "fn") {
          return transpileFunction(body);
        }
      }

      return `(${transpile(head)})(${body.map(transpile).join(", ")})`;
    },
    vector: (vector: FormulaVector) =>
      `__wrapVector([${vector.map(transpile).join(", ")}])`,
    symbol: (symbol: FormulaSymbol) => symbol.symbol,
    number: (number: number) => number.toString(),
    string: (string: string) => `"${string}"`, // Inner quotes aren't escaped
    fn: (fn: FormulaFunction) => {
      throw new Error("Can't transpile a function directly");
    },
    nil: () => "null",
  });

const transpileFunction = (body: List<Formula>): string => {
  return "";
};
