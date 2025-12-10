import { Formula } from "./types";

export const serialiseFormula = (value: Formula): string => {
  switch (value.type) {
    case "Scope":
      const strings = value
        .entrySeq()
        .flatMap(([key, item]) => [
          serialiseFormula(key),
          serialiseFormula(item),
        ]);
      return ["{", ...strings, "}"].join(" ");

    case "Expression":
    case "Vector":
      return (
        (value.type === "Expression" ? "(" : "[") +
        value.values.map(serialiseFormula).join(" ") +
        (value.type === "Expression" ? ")" : "]")
      );

    case "Core":
      return "#" + value.value;

    case "Number":
      return value.value.toString();

    case "Symbol":
      return value.value;

    case "String":
      return `"${value.value.replace("\\", "\\\\").replace('"', '\\"')}"`;

    default:
      const [type, data] = inspect(value);
      return `#(${serialiseFormula(type)} ${serialiseFormula(data)})`;
  }
};
