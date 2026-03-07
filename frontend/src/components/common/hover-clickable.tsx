import { Stack } from "@mui/material";
import { colours, invertColour } from "../../constants";
import { ReactNode } from "react";

export const HoverClickable = ({
  children,
  selected,
  onClick,
  onMiddleClick,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onMiddleClick?: () => void;
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
      onClick={onClick}
      onMouseDown={(event) => {
        if (event.button === 1) {
          onMiddleClick?.();
        }
      }}
    >
      {children}
    </Stack>
  );
};
