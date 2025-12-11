import { Stack, TextField } from "@mui/material";
import { EntityState } from "./entity";
import { useRef, useState } from "react";
import { colours, fontMonospace } from "../../constants";
import { useSwapEntity } from "../../context/hooks";
import { useHotkeys } from "react-hotkeys-hook";

export const FormulaEntityContent = ({
  entity,
  entityId,
}: {
  entity: EntityState;
  entityId: string;
}) => {
  return (
    <Stack>
      <CodeEditor text={entity.text ?? ""} entityId={entityId} />
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
