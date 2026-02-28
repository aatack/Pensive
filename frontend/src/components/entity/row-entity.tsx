import equal from "fast-deep-equal";
import { ReactNode, memo } from "react";
import { ResolvedQuery } from "../pensive";
import { EntityContent } from "./content";
import { TableCell } from "@mui/material";
import { colours } from "../../constants";
import { Entity } from "./render-entity";
import { CreateEntity } from "../tool/tool-placeholders";

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
