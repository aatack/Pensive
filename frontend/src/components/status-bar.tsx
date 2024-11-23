import { Stack, TextField, Typography } from "@mui/material";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { colours, font } from "../constants";
import { arrayCursor, Atom, cursor } from "../helpers/atoms";
import { clamp } from "../helpers/maths";
import { LabelledCheckbox } from "./common/checkbox";
import { useTabsState } from "./tabs";
import { useToolState } from "./tool/tool";

const useSelectedFrame = () => {
  const tabs = useTabsState();
  const tabGroup = arrayCursor(
    cursor(tabs, "tabGroups"),
    clamp(tabs.value.selectedIndex, 0, tabs.value.tabGroups.length - 1)
  );
  const tab = arrayCursor(
    cursor(tabGroup, "tabs"),
    clamp(tabGroup.value.selectedIndex, 0, tabGroup.value.tabs.length - 1)
  );
  return cursor(tab, "frame");
};

export const StatusBar = () => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ backgroundColor: colours.tx3 }}
    >
      <Typography sx={{ maxWidth: 0.5, fontFamily: "monospace" }} noWrap>
        {JSON.stringify(useToolState().value)}
      </Typography>

      <Highlight />
    </Stack>
  );
};

const Highlight = () => {
  const frame = useSelectedFrame();

  const highlight = cursor(frame, "highlight");

  return (
    <Stack direction="row" alignItems="center" gap={2}>
      <HighlightSection section={cursor(highlight, "section")} />

      <HighlightText text={cursor(highlight, "text")} />
    </Stack>
  );
};

const HighlightSection = ({
  section,
}: {
  section: Atom<boolean | undefined>;
}) => {
  useHotkeys("q", () => section.swap((current) => !current));
  return <LabelledCheckbox label="Section" value={section} />;
};

const HighlightText = ({ text }: { text: Atom<string | undefined> }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useHotkeys("ctrl+f", () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  });
  useHotkeys(
    "escape",
    () => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        inputRef.current.blur();
        text.reset("");
      }
    },
    { enableOnFormTags: true }
  );
  useHotkeys(
    "enter",
    () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    { enableOnFormTags: true }
  );

  return (
    <Stack direction="row" alignItems="center">
      <TextField
        type="text"
        size="small"
        autoFocus
        value={text.value ?? ""}
        variant="standard"
        fullWidth
        hiddenLabel
        onChange={(event) => text.reset(event.target.value)}
        inputRef={inputRef}
        inputProps={{ sx: { p: 0.5, color: colours.tx, ...font } }}
        placeholder="Search"
        InputProps={{
          disableUnderline: true,
          sx: { margin: 0, padding: 0, width: 200 },
        }}
      />
    </Stack>
  );
};
