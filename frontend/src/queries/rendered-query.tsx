import { Typography } from "@mui/material";
import { Query } from "./queries";
import { font } from "../constants";

export const RenderedQuery = ({ query }: { query: Query }) => {
  switch (query.type) {
    case "explore":
      return (
        <Typography sx={{ ...font, fontSize: 12, fontWeight: 800 }}>
          {"-->"} {query.link ?? "outbound"}
        </Typography>
      );
    case "collapse":
      return null;
  }
};
