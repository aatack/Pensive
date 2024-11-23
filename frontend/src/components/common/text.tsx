import { TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { colours, font } from "../../constants";

export const TextInput = ({
  confirm,
  cancel,
  initial,
}: {
  confirm: (text: string) => void;
  cancel: () => void;
  initial?: string;
}) => {
  const [text, setText] = useState(initial ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useHotkeys(
    "enter",
    () => {
      if (text !== (initial ?? "")) {
        confirm(text);
      } else {
        cancel();
      }
    },
    { enableOnFormTags: true }
  );
  useHotkeys(
    "escape",
    () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        cancel();
      }
    },
    { enableOnFormTags: true }
  );

  // Start editing at the end of the text
  useEffect(() => {
    if (inputRef.current != null) {
      inputRef.current.setSelectionRange(text.length, text.length);
    }
  }, [inputRef.current]);

  return (
    <TextField
      type="text"
      size="small"
      autoFocus
      value={text}
      variant="standard"
      fullWidth
      multiline
      hiddenLabel
      onChange={(event) => setText(event.target.value)}
      inputRef={inputRef}
      inputProps={{ sx: { p: 0.5, color: colours.tx, ...font } }}
      InputProps={{ disableUnderline: true, sx: { margin: 0, padding: 0 } }}
    />
  );
};
