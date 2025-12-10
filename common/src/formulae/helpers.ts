import {
  Formula,
  FormulaExpression,
  FormulaFunction,
  FormulaNil,
  FormulaNumber,
  FormulaScope,
  FormulaString,
  FormulaSymbol,
  FormulaVector,
  isFormulaExpression,
  isFormulaFunction,
  isFormulaNil,
  isFormulaNumber,
  isFormulaScope,
  isFormulaString,
  isFormulaSymbol,
  isFormulaVector,
} from "./types";

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

export const switchFormulaType = <T>(
  formula: Formula,
  cases: {
    scope: (scope: FormulaScope) => T;
    expression: (expression: FormulaExpression) => T;
    vector: (vector: FormulaVector) => T;
    symbol: (symbol: FormulaSymbol) => T;
    number: (number: FormulaNumber) => T;
    string: (string: FormulaString) => T;
    fn: (fn: FormulaFunction) => T;
    nil: (nil: FormulaNil) => T;
  }
): T => {
  if (isFormulaScope(formula)) {
    return cases.scope(formula);
  } else if (isFormulaExpression(formula)) {
    return cases.expression(formula);
  } else if (isFormulaVector(formula)) {
    return cases.vector(formula);
  } else if (isFormulaSymbol(formula)) {
    return cases.symbol(formula);
  } else if (isFormulaNumber(formula)) {
    return cases.number(formula);
  } else if (isFormulaString(formula)) {
    return cases.string(formula);
  } else if (isFormulaFunction(formula)) {
    return cases.fn(formula);
  } else if (isFormulaNil(formula)) {
    return cases.nil(formula);
  } else {
    throw new Error(`Invalid formula: ${formula}`);
  }
};
