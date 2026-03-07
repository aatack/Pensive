import { Typography } from "@mui/material";
import { EntityState } from "./entity";
import { font } from "../../constants";

export const EntityPill = ({ entity }: { entity: EntityState }) => {
  return (
    <Typography sx={font} noWrap>
      {entity.text ?? "No content"}
    </Typography>
  );
};
