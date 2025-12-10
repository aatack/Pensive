import { RecordOf, Map, List } from "immutable";

export type Formula =
  | FormulaScope
  | FormulaExpression
  | FormulaVector
  | FormulaSymbol
  | FormulaNumber
  | FormulaString
  | FormulaFunction;

export type FormulaScope = Map<Formula, Formula>;

export type FormulaExpression = List<Formula>;

export type FormulaVector = RecordOf<List<Formula>>;

export type FormulaSymbol = RecordOf<{ symbol: string }>;

export type FormulaNumber = number;

export type FormulaString = string;

export type FormulaFunction = (...args: unknown[]) => unknown;
