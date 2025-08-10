import { Typography } from "@mui/material";
import { evaluate, parse } from "Parsle/src";
import { serialise } from "Parsle/src/behaviours/serialise";
import { formatStack } from "Parsle/src/models/result";
import { newScope } from "Parsle/src/types/scope";
import { newString } from "Parsle/src/types/string";

export const FormulaEntity = ({ text }: { text: string }) => {
  const parseResult = parse(newString(text));

  const result = parseResult.success
    ? evaluate(parseResult.value, newScope([]))
    : parseResult;

  return (
    <>
      <Typography variant="body1Monospace" sx={{ whiteSpace: "pre-wrap" }}>
        {result.success === false
          ? formatStack(result)
          : serialise(result.value)}
      </Typography>
    </>
  );
};
