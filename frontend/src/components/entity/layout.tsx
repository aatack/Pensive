import { Stack } from "@mui/material";
import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { EntityChildren } from "./children";
import { EntityIndent } from "./indent";
import { EntityContent } from "./content";

/**
 * Lay out an entity, with all its dependencies loaded in advance.
 *
 * This version is cached, with its contents only being re-rendered when there's
 * a material change in some of its inputs.  This prevents eg. re-renders from
 * occurring on every entity every time the selection changes, or every time a
 * new entity is loaded from the backend.
 */
export const EntityLayout = memo(
  ({
    resolvedQuery,
    selectionPointer,
    createEntityPointer,
    editEntityPointer,
  }: {
    resolvedQuery: ResolvedQuery;
    selectionPointer: string[] | null;
    createEntityPointer: string[] | null;
    editEntityPointer: string[] | null;
  }) => {
    const selected = selectionPointer != null && selectionPointer.length === 0;

    const permanentContent = (
      <>
        <EntityChildren
          resolvedQueryChildren={resolvedQuery.children}
          selectionPointer={selectionPointer}
          createEntityPointer={createEntityPointer}
          editEntityPointer={editEntityPointer}
        />

        {createEntityPointer != null && createEntityPointer.length === 0 ? (
          <CreateEntity />
        ) : null}
      </>
    );

    return resolvedQuery.highlight ? (
      <EntityIndent entity={resolvedQuery.entity}>
        <Stack>
          <EntityContent
            entity={resolvedQuery.entity}
            entityId={resolvedQuery.entityId}
            selected={selected}
            editing={
              editEntityPointer != null && editEntityPointer.length === 0
            }
            path={resolvedQuery.path}
            collapsed={resolvedQuery.collapsed}
            hasHiddenChildren={resolvedQuery.hasHiddenChildren}
          />

          {permanentContent}
        </Stack>
      </EntityIndent>
    ) : (
      <Stack>{permanentContent}</Stack>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);
