import { IconButton, Stack } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { colours } from "../constants";

export const WindowControls = () => {
  return (
    <Stack direction="row" sx={{ marginLeft: "auto" }}>
      <IconButton sx={{ px: 0 }}>
        <CircleIcon sx={{ fontSize: 14, color: colours.ye }} />
      </IconButton>
      <IconButton sx={{ px: 1 }}>
        <CircleIcon sx={{ fontSize: 14, color: colours.re }} />
      </IconButton>
    </Stack>
  );
};
