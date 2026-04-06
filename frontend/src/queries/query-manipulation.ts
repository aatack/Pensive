import { EntityState } from "../components/entity/entity";
import { QueryResult } from "./queries";

export type FlattenedQueryResult = {
  entityId: string;
  entity: EntityState;

  complete: boolean;
  path: string[];
};

export const flatten = (
  result: QueryResult,
  path: string[],
): FlattenedQueryResult[] => {
  return [
    {
      entityId: result.entityId,
      entity: result.entity,
      complete: result.complete,
      path: path ?? [],
    },
    ...result.children.flatMap((child) =>
      flatten(child.result, [...(path ?? []), child.result.entityId]),
    ),
  ];
};

export const prune = (
  result: QueryResult,
  predicate: (entity: EntityState) => boolean,
): { result: QueryResult; hasAny: boolean } => {
  const children = result.children
    .map((child) => ({ key: child.key, ...prune(child.result, predicate) }))
    .filter((child) => child.hasAny)
    .map((child) => ({ key: child.key, result: child.result }));

  return {
    result: {
      ...result,
      children,
    },
    hasAny: children.length > 0 || predicate(result.entity),
  };
};

const REDACTED = "<<< Redacted >>>";

export const exportMarkdown = (
  result: QueryResult,
  sectionIndent = 1,
  textIndent = 0,
): string => {
  const entity = result.entity;

  const newIndent = "    ".repeat(textIndent);

  const newPrefix =
    "- " +
    (entity.section ? "#".repeat(sectionIndent) + " " : "") +
    (entity.open == null ? "" : entity.open ? "[ ] " : "[x] ");

  const newText = entity.redacted
    ? REDACTED
    : entity.image
      ? `image@${result.entityId}`
      : (entity.text ?? "");

  return [
    `${newIndent}${newPrefix}${newText.split("\n").join("\n" + newIndent)}`,
    ...result.children.map(({ result }) =>
      exportMarkdown(
        result,
        sectionIndent + (entity.section ? 1 : 0),
        textIndent + 1,
      ),
    ),
  ].join("\n");
};
