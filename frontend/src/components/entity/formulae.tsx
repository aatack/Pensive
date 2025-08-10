import { Divider, Typography } from "@mui/material";
import { evaluate, parse } from "Parsle/src";
import { serialise } from "Parsle/src/behaviours/serialise";
import { formatStack, Result } from "Parsle/src/models/result";
import { newScope } from "Parsle/src/types/scope";
import { newString } from "Parsle/src/types/string";
import { colours } from "../../constants";

export const FormulaEntity = ({ text }: { text: string }) => {
  const parseResult = parse(newString(text));

  let result: Result;
  try {
    result = parseResult.success
      ? evaluate(parseResult.value, newScope([]))
      : parseResult;
  } catch (e) {
    result = { success: false, reason: e.toString(), stack: [] };
  }

  let formattedText: string;
  try {
    formattedText =
      result.success === false ? formatStack(result) : serialise(result.value);
  } catch (e) {
    formattedText = e.toString();
  }

  return (
    <>
      <Typography variant="body1Monospace" sx={{ whiteSpace: "pre-wrap" }}>
        {text}
      </Typography>
      <Divider
        orientation="horizontal"
        sx={{ backgroundColor: colours.tx2, my: 0.5 }}
      />
      <Typography variant="body1Monospace" sx={{ whiteSpace: "pre-wrap" }}>
        {formattedText}
      </Typography>
    </>
  );
};
