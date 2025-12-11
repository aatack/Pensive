import { Divider, Stack, TextField, Typography } from "@mui/material";
import { EntityState } from "./entity";
import { useMemo, useRef, useState } from "react";
import { colours, fontMonospace } from "../../constants";
import { useSwapEntity } from "../../context/hooks";
import { useHotkeys } from "react-hotkeys-hook";
import { Formula, parse, serialise, transpile } from "@pensive/common";

export const FormulaEntityContent = ({
  entity,
  entityId,
}: {
  entity: EntityState;
  entityId: string;
}) => {
  const code = entity.text ?? "";
  const result = useFormulaEvaluation(code);

  return (
    <Stack>
      <CodeEditor text={code} entityId={entityId} />

      <Divider />

      {result.type === "success" && (
        <Typography variant="body1Monospace">
          {serialise(result.value)}
        </Typography>
      )}
    </Stack>
  );
};

const CodeEditor = ({ text, entityId }: { text: string; entityId: string }) => {
  const [editedText, setEditedText] = useState(text);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const swapEntity = useSwapEntity();

  const confirm = () => {
    if (editedText !== (text ?? "")) {
      swapEntity(entityId, () => ({ text: editedText }));
    }
  };

  useHotkeys(
    "shift+enter",
    () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    { enableOnFormTags: true }
  );

  return (
    <TextField
      type="text"
      size="small"
      autoFocus
      value={editedText}
      variant="standard"
      fullWidth
      multiline
      hiddenLabel
      onChange={(event) => setEditedText(event.target.value)}
      inputRef={inputRef}
      inputProps={{
        sx: { p: 0.5, color: colours.tx, ...fontMonospace },
      }}
      InputProps={{ disableUnderline: true, sx: { margin: 0, padding: 0 } }}
      onBlur={confirm}
    />
  );
};

type FormulaEvaluation =
  | { type: "success"; value: Formula }
  | {
      type: "parseError";
      message: string;
    }
  | { type: "runtimeError"; exception: string };

const useFormulaEvaluation = (code: string): FormulaEvaluation =>
  useMemo(() => {
    const result = parse(code);

    if (!result.valid) {
      return { type: "parseError", message: result.message };
    }
    try {
      return { type: "success", value: transpile(result.value) };
    } catch (e) {
      return { type: "runtimeError", exception: e.toString() };
    }
  }, [code]);
