import { Typography } from "@mui/material";
import { font } from "../constants";
import { Query } from "./types";

export const RenderedQuery = ({ query }: { query: Query }) => {
  switch (query.type) {
    case "links":
      return (
        <Typography sx={{ ...font, fontSize: 12, fontWeight: 800 }}>
          {"-->"} {query.links}
        </Typography>
      );
    case "collapse":
      return null;
  }
};
