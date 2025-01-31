import { Stack } from "@mui/material";
import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { EntityContent } from "./content";
import { Entity } from "./entity";

export const TableEntity = memo(
  ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) => {
    const children = (
      <table>
        {resolvedQuery.children.map((child) => (
          <tr>
            <Entity row resolvedQuery={child.value} key={child.key} />
          </tr>
        ))}

        {resolvedQuery.createEntity ? (
          <tr>
            <CreateEntity />
          </tr>
        ) : null}
      </table>
    );

    return resolvedQuery.highlight ? (
      <Stack>
        <EntityContent resolvedQuery={resolvedQuery} />

        {children}
      </Stack>
    ) : (
      <Stack>{children}</Stack>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);
