import { Stack } from "@mui/material";
import { colours, invertColour } from "../../constants";
import { ReactNode } from "react";

export const HoverClickable = ({
  children,
  selected,
}: {
  children: ReactNode;
  selected?: boolean;
}) => {
  return (
    <Stack
      sx={{
        backgroundColor: selected ? invertColour("lightblue") : undefined,
        transition: "background-color 0.15s ease",
        "&:hover": selected ? {} : { backgroundColor: colours.bg2 },
        borderRadius: 1,
        cursor: "pointer",
      }}
    >
      {children}
    </Stack>
  );
};
