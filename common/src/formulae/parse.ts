import { List, Map } from "immutable";
import { dropWhile, range, takeWhile } from "./helpers";
import {
  Formula,
  FormulaExpression,
  FormulaNumber,
  FormulaScope,
  FormulaString,
  FormulaSymbol,
  FormulaVector,
  wrapExpression,
  wrapSymbol,
} from "./types";

type Character = string;
type ParseResult<T> =
  | { valid: true; value: T; remainingCharacters: Character[] }
  | { valid: false; message: string };

const isWhitespace = (character: string) => character.trim().length === 0;

const isReserved = (character: string | null) =>
  character != null &&
  (isWhitespace(character) || '\\"(){}[].'.includes(character));

const isNumeric = (character: string | null) =>
  character != null && "-.1234567890".includes(character);

export const parseFormula = (
  characters: Character[]
): ParseResult<Formula | null> => {
  const importantCharacters = dropWhile(characters, isWhitespace);
  if (importantCharacters.length === 0) {
    return { valid: true, value: null, remainingCharacters: [] };
  }

  const firstCharacter = importantCharacters[0] ?? null;
  if (firstCharacter === '"') {
    return parseString(importantCharacters);
  } else if (isNumeric(firstCharacter)) {
    return parseNumber(importantCharacters);
  } else if (firstCharacter === "(") {
    return parseExpression(importantCharacters);
  } else if (firstCharacter === "{") {
    return parseScope(importantCharacters);
  } else if (firstCharacter === "[") {
    return parseVector(importantCharacters);
  } else if (firstCharacter === "\\") {
    const result = parseFormula(characters.slice(1));
    return result.valid ? parseFormula(result.remainingCharacters) : result;
  } else if (isReserved(firstCharacter)) {
    return {
      valid: true,
      value: null,
      remainingCharacters: importantCharacters,
    };
  } else {
    return parseSymbol(importantCharacters);
  }
};

const parseExpression = (
  characters: Character[]
): ParseResult<FormulaExpression> => {
  const result = parseSequence(characters, ")");
  return result.valid
    ? { ...result, value: wrapExpression(result.value) }
    : result;
};

const parseScope = (characters: Character[]): ParseResult<FormulaScope> => {
  const result = parseSequence(characters, "}");
  return result.valid
    ? {
        ...result,
        value: Map(
          range(Math.floor(result.value.length / 2)).map((index) => [
            result.value[index * 2] ?? null,
            result.value[index * 2 + 1] ?? null,
          ])
        ),
      }
    : result;
};

const parseVector = (characters: Character[]): ParseResult<FormulaVector> => {
  const result = parseSequence(characters, "]");
  return result.valid ? { ...result, value: List(result.value) } : result;
};

const parseSequence = (
  characters: Character[],
  closingCharacter: string
): ParseResult<Formula[]> => {
  let remainingCharacters = dropWhile(characters.slice(1), isWhitespace);
  const values: Formula[] = [];

  while (remainingCharacters[0] !== closingCharacter) {
    if (remainingCharacters.length === 0) {
      return {
        valid: false,
        message: `Expected closing "${closingCharacter}"`,
      };
    }

    const result = parseFormula(remainingCharacters);
    if (result.valid) {
      if (result.value != null) {
        values.push(result.value);
      } else if (result.remainingCharacters[0] !== closingCharacter) {
        return {
          valid: false,
          message: `Mismatched closing character: "${result.remainingCharacters[0]}"`,
        };
      }
      remainingCharacters = dropWhile(result.remainingCharacters, isWhitespace);
    } else {
      return result;
    }
  }

  return {
    valid: true,
    value: values,
    remainingCharacters: remainingCharacters.slice(1),
  };
};

const parseSymbol = (characters: Character[]): ParseResult<FormulaSymbol> => {
  const [symbolCharacters, remainingCharacters] = takeWhile(
    characters,
    (character) => !isReserved(character)
  );

  const value = symbolCharacters.join("");
  return value.length === 0
    ? { valid: false, message: "Empty symbol" }
    : { valid: true, value: wrapSymbol(value), remainingCharacters };
};

const parseNumber = (characters: Character[]): ParseResult<FormulaNumber> => {
  const [numberCharacters, remainingCharacters] = takeWhile(
    characters,
    (character: string) => isNumeric(character)
  );

  const value = parseFloat(numberCharacters.join(""));

  return isNaN(value)
    ? { valid: false, message: `Invalid number: ${numberCharacters.join("")}` }
    : { valid: true, value: value, remainingCharacters };
};

const parseString = (characters: Character[]): ParseResult<FormulaString> => {
  let escaped = false;
  const stringCharacters: Character[] = [];

  // Start at 1 to skip the opening quote marks
  for (let index = 1; index < characters.length; index++) {
    const character = characters[index]!;

    if (escaped) {
      stringCharacters.push(character);
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === '"') {
      return {
        valid: true,
        value: stringCharacters.join(""),
        // Skip one at the end to avoid closing quote marks
        remainingCharacters: characters.slice(index + 1),
      };
    } else {
      stringCharacters.push(character);
    }
  }

  return {
    valid: false,
    message: `Unclosed string: ${stringCharacters.join("")}`,
  };
};
