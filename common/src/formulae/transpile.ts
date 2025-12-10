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
  isFormulaVector,
  wrapVector,
} from "./types";
import { serialise } from "./serialise";

export const COMMON_CONTEXT = {
  __plus: (left: number, right: number) => left + right,
};

export const transpileAndRun = (
  formula: Formula,
  context?: { [name: string]: Formula }
): Formula => {
  const localContext = { ...COMMON_CONTEXT, ...context };
  const variables = Object.keys(localContext)
    .map((name) => `const ${name} = __context.${name};`)
    .join("\n");

  const code = `
    {
      ${variables}

      return ${transpile(formula)};
    }
  `;

  return new Function("__context", code)(localContext);
};

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
    fn: () => {
      throw new Error("Can't transpile a function directly");
    },
    nil: () => "null",
  });

const transpileFunction = (parameters: List<Formula>): string => {
  const args: Formula = parameters.get(0) ?? wrapVector([]);
  const body: Formula = parameters.get(1) ?? null;

  if (!isFormulaVector(args) || !args.every(isFormulaSymbol)) {
    throw new Error(`Invalid argument list: ${serialise(args)}`);
  }

  return `((${args.map(transpile).join(", ")}) => (${transpile(body)}))`;
};
