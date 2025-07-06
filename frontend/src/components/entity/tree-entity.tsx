import { Stack } from "@mui/material";
import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { EntityIndent } from "./indent";
import { EntityContent } from "./content";
import { Entity } from "./entity";

export const TreeEntity = memo(
  ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) => {
    return (
      <Stack gap={0.2}>
        {resolvedQuery.highlight ? (
          <EntityContent resolvedQuery={resolvedQuery} />
        ) : null}

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
