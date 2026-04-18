import { EntityState } from "../components/entity/entity";
import { FlattenedResult, QueryResult } from "./types";

export const flatten = <T = never>(
  result: QueryResult,
  path: string[],
  marker?: (path: string[]) => [T] | null,
): (FlattenedResult | T)[] => {
  return [
    {
      entityId: result.entityId,
      entity: result.entity,
      pivot: result.pivot,
      complete: result.complete,
      framePath: result.framePath,
      pivotPath: result.pivotPath,
      path: path ?? [],
    },
    ...result.children.flatMap((child) =>
      flatten(child, [...(path ?? []), child.entityId], marker),
    ),
    ...(marker?.(path ?? []) ?? []),
  ];
};

export const prune = (
  result: QueryResult,
  predicate: (entity: EntityState) => boolean,
  stop?: (result: QueryResult) => boolean,
): { result: QueryResult; hasAny: boolean } => {
  if (stop?.(result)) {
    return { result, hasAny: true };
  }

  const children = result.children
    .map((child) => prune(child, predicate, stop))
    .filter((child) => child.hasAny)
    .map((child) => child.result);

  return {
    result: { ...result, children },
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

export const leaves = (result: QueryResult): QueryResult[] => {
  return result.children.length === 0
    ? [result]
    : result.children.flatMap((child) => leaves(child));
};
