import equal from "fast-deep-equal";
import { ReactNode, memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { Entity } from "./entity";
import { EntityContent } from "./content";
import { TableCell } from "@mui/material";
import { colours } from "../../constants";

export const RowEntity = memo(
  ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) => {
    return (
      <>
        <Cell>
          <EntityContent resolvedQuery={resolvedQuery} />
        </Cell>

        {resolvedQuery.children.map(({ value, key }) => (
          <Cell key={key}>
            <Entity resolvedQuery={value} />
          </Cell>
        ))}

        {resolvedQuery.createEntity ? (
          <Cell>
            <CreateEntity />
          </Cell>
        ) : null}
      </>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);

const Cell = ({ children }: { children: ReactNode }) => (
  <TableCell
    sx={{
      padding: 0.5,
      verticalAlign: "top",
      border: `1px ${colours.ui3} solid`,
    }}
  >
    {children}
  </TableCell>
);
