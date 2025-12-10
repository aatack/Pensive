import {
  RecordOf,
  Map,
  List,
  Record,
  isRecord,
  isMap,
  isList,
} from "immutable";

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

export const wrapScope = (pairs: [Formula, Formula][]): FormulaScope =>
  Map(pairs);

export const isFormulaScope = (formula: Formula): formula is FormulaScope =>
  isMap(formula);

export type FormulaExpression = RecordOf<{ expression: List<Formula> }>;

const ExpressionFactory = Record({ expression: List([] as Formula[]) });

export const wrapExpression = (expression: Formula[]): FormulaExpression =>
  ExpressionFactory({ expression: List(expression) });

export const isFormulaExpression = (
  formula: Formula
): formula is FormulaExpression => isRecord(formula) && "expression" in formula;

export type FormulaVector = List<Formula>;

export const wrapVector = (items: Formula[]): FormulaVector => List(items);

export const isFormulaVector = (formula: Formula): formula is FormulaVector =>
  isList(formula);

export type FormulaSymbol = RecordOf<{ symbol: string }>;

const SymbolFactory = Record({ symbol: "" });

export const wrapSymbol = (symbol: string): FormulaSymbol =>
  SymbolFactory({ symbol });

export const isFormulaSymbol = (formula: Formula): formula is FormulaSymbol =>
  isRecord(formula) && "symbol" in formula;

export type FormulaNumber = number;

export const isFormulaNumber = (formula: Formula): formula is FormulaNumber =>
  typeof formula === "number";

export type FormulaString = string;

export const isFormulaString = (formula: Formula): formula is FormulaString =>
  typeof formula === "string";

export type FormulaFunction = (...args: Formula[]) => Formula;

export const isFormulaFunction = (
  formula: Formula
): formula is FormulaFunction => typeof formula === "function";

export type FormulaVoid = null;

export const isFormulaVoid = (formula: Formula): formula is FormulaVoid =>
  formula === null;
