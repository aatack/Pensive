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
        <tbody>
          {resolvedQuery.children.map(({ key, value }) => (
            <tr key={key}>
              <Entity row resolvedQuery={value} />
            </tr>
          ))}

          {resolvedQuery.createEntity ? (
            <tr>
              <CreateEntity />
            </tr>
          ) : null}
        </tbody>
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
