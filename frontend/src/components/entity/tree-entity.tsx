import { Stack, Typography } from "@mui/material";
import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { EntityIndent } from "./indent";
import { EntityContent } from "./content";
import { Entity } from "./entity";
import { font } from "../../constants";

export const TreeEntity = memo(
  ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) => {
    const pivot = resolvedQuery.pivot;
    return (
      <Stack sx={{ overflowX: "auto" }}>
        <Stack sx={{ overflowX: "auto" }}>
          {resolvedQuery.highlight ? (
            <EntityContent resolvedQuery={resolvedQuery} />
          ) : null}
        </Stack>

        {pivot && (
          <Typography
            sx={{
              ...font,
              fontSize: 10,
              fontWeight: 800,
              ml: 1,
              cursor: "pointer",
            }}
          >
            <u>{`${pivot[0]?.toUpperCase()}${pivot.slice(1)}`}</u>
          </Typography>
        )}

        {resolvedQuery.children.map(({ key, value }) => (
          <WrappedChild key={key} resolvedQuery={value} />
        ))}
        {resolvedQuery.createEntity ? <CreateEntity /> : null}
      </Stack>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);

const WrappedChild = ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) =>
  resolvedQuery.highlight ? (
    <EntityIndent entity={resolvedQuery.entity}>
      <Entity resolvedQuery={resolvedQuery} />
    </EntityIndent>
  ) : (
    <Entity resolvedQuery={resolvedQuery} />
  );
