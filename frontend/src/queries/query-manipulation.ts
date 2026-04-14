import { flatten, Result } from "./combined-query";

const REDACTED = "<<< Redacted >>>";

export const exportMarkdown = (
  result: Result,
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

export const leaves = (result: Result): Result[] => {
  return result.children.length === 0
    ? [result]
    : result.children.flatMap((child) => leaves(child));
};
