import { Button, Typography } from "@mui/material";
import { parse } from "Parsle/src";
import { serialise } from "Parsle/src/behaviours/serialise";
import { formatStack } from "Parsle/src/models/result";
import { newString } from "Parsle/src/types/string";

export const FormulaEntity = ({ text }: { text: string }) => {
  const parseResult = parse(newString(text));

  return (
    <>
      <Typography variant="body1Monospace" sx={{ whiteSpace: "pre-wrap" }}>
        {parseResult.success === false
          ? formatStack(parseResult)
          : serialise(parseResult.value)}
      </Typography>
    </>
  );
};
