import { Typography } from "@mui/material";
import { font } from "../constants";
import { QueryFunction } from "./combined-query";

export const RenderedQuery = ({ query }: { query: QueryFunction }) => {
  switch (query.type) {
    case "link":
      return (
        <Typography sx={{ ...font, fontSize: 12, fontWeight: 800 }}>
          {"-->"} outbound
        </Typography>
      );
    case "collapse":
      return null;
  }
};
