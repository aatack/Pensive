import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { Entity } from "./entity";
import { EntityContent } from "./content";
import { TableCell } from "@mui/material";

export const RowEntity = memo(
  ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) => {
    return (
      <>
        <TableCell>
          <EntityContent resolvedQuery={resolvedQuery} />
        </TableCell>

        {resolvedQuery.children.map(({ value, key }) => (
          <TableCell key={key}>
            <Entity resolvedQuery={value} />
          </TableCell>
        ))}

        {resolvedQuery.createEntity ? (
          <TableCell>
            <CreateEntity />
          </TableCell>
        ) : null}
      </>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);
