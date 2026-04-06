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
  options?:
    | { lineNumbers: false }
    | { lineNumbers: true; selectedPath?: string[] },
): string => {
  const flattened = flatten(result, []);

  const length = flattened.length.toString().length;

  return flattened
    .map((line, index) => {
      const selected =
        options?.lineNumbers &&
        options?.selectedPath != null &&
        line.path.join(":") === options.selectedPath.join(":");
      const indexString = (index + 1).toString();
      const indentString = " ".repeat(length - indexString.length);
      const lineNumber =
        (selected ? "[" : " ") +
        indentString +
        indexString +
        (selected ? "]" : " ") +
        " ";

      const text = line.entity.redacted
        ? REDACTED
        : line.entity.image
          ? `image@${line.entityId}`
          : (line.entity.text ?? "");

      const section = line.entity.section ? "# " : "";
      const open =
        line.entity.open == null ? "" : line.entity.open ? "[ ] " : "[x] ";

      return (
        (options?.lineNumbers ? lineNumber : "") +
        "  ".repeat(line.path.length).toString() +
        " - " +
        section +
        open +
        text
      );
    })
    .join("\n")
    .trimEnd();
};
