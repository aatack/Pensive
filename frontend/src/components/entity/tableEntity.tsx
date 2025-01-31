import {
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableRow,
} from "@mui/material";
import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { EntityContent } from "./content";
import { Entity } from "./entity";

export const TableEntity = memo(
  ({ resolvedQuery }: { resolvedQuery: ResolvedQuery }) => {
    const children = (
      <TableContainer>
        <Table sx={{ my: 0.5, borderRadius: 5 }}>
          <TableBody>
            {resolvedQuery.children.map(({ key, value }) => (
              <TableRow key={key}>
                <Entity row resolvedQuery={value} />
              </TableRow>
            ))}

            {resolvedQuery.createEntity ? (
              <tr>
                <CreateEntity />
              </tr>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
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
