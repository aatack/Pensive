import { Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import { font } from "../../constants";
import { EntityState } from "./entity";

export const EntityIndent = ({
  children,
  entity,
}: {
  children: ReactNode;
  entity: EntityState;
}) => {
  return (
    <Stack direction="row" gap={1}>
      <Stack sx={{ width: 10 }}>
        <Typography sx={{ ...font, textWrap: "nowrap", userSelect: "none" }}>
          {entity.open === true
            ? "[ ]"
            : entity.open === false
            ? "[x]"
            : entity.section
            ? null
            : ">"}
        </Typography>
      </Stack>
      {children}
    </Stack>
  );
};
