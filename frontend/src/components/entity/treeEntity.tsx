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
      <Stack>
        {resolvedQuery.highlight ? (
          <EntityContent resolvedQuery={resolvedQuery} />
        ) : null}

        {resolvedQuery.children.map((child) =>
          wrapChild(
            child.value,
            <Entity resolvedQuery={child.value} key={child.key} />
          )
        )}

        {resolvedQuery.createEntity ? <CreateEntity /> : null}
      </Stack>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);

const wrapChild = (
  resolvedQuery: ResolvedQuery,
  element: JSX.Element
): JSX.Element =>
  resolvedQuery.highlight ? (
    <EntityIndent entity={resolvedQuery.entity}>{element}</EntityIndent>
  ) : (
    element
  );
