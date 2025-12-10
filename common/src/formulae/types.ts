import { RecordOf, Map, List, Record } from "immutable";

export type Formula =
  | FormulaScope
  | FormulaExpression
  | FormulaVector
  | FormulaSymbol
  | FormulaNumber
  | FormulaString
  | FormulaFunction
  | FormulaVoid;

export type FormulaScope = Map<Formula, Formula>;

export type FormulaExpression = RecordOf<{ expression: List<Formula> }>;

const ExpressionFactory = Record({ expression: List([] as Formula[]) });

export const wrapExpression = (expression: Formula[]): FormulaExpression =>
  ExpressionFactory({ expression: List(expression) });

export type FormulaVector = List<Formula>;

export type FormulaSymbol = RecordOf<{ symbol: string }>;

const SymbolFactory = Record({ symbol: "" });

export const wrapSymbol = (symbol: string): FormulaSymbol =>
  SymbolFactory({ symbol });

export type FormulaNumber = number;

export type FormulaString = string;

export type FormulaFunction = (...args: unknown[]) => unknown;

export type FormulaVoid = null;
