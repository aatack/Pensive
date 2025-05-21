import { Stack } from "@mui/material";
import { ReactNode } from "react";
import { EntityState } from "./entity";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DoneIcon from "@mui/icons-material/Done";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

export const EntityIndent = ({
  children,
  entity,
}: {
  children: ReactNode;
  entity: EntityState;
}) => {
  const iconStyle = { fontSize: 14, opacity: 0.5, margin: 0.5 };

  return (
    <Stack direction="row" gap={1}>
      <Stack sx={{ width: 12 }}>
        {entity.open === true ? (
          <RadioButtonUncheckedIcon sx={iconStyle} />
        ) : entity.open === false ? (
          <DoneIcon sx={iconStyle} />
        ) : entity.section ? null : (
          <KeyboardArrowRightIcon sx={iconStyle} />
        )}
      </Stack>
      {children}
    </Stack>
  );
};
