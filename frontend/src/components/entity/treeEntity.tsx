import { Stack } from "@mui/material";
import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { EntityIndent } from "./indent";
import { EntityContent } from "./content";
import { headTail } from "../../helpers/arrays";
import { Entity } from "./entity";

/**
 * Lay out an entity, with all its dependencies loaded in advance.
 *
 * This version is cached, with its contents only being re-rendered when there's
 * a material change in some of its inputs.  This prevents eg. re-renders from
 * occurring on every entity every time the selection changes, or every time a
 * new entity is loaded from the backend.
 */
export const TreeEntity = memo(
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
    return (
      <Stack>
        {resolvedQuery.highlight
          ? buildContent(resolvedQuery, selectionPointer, editEntityPointer)
          : null}

        {buildChildren(
          resolvedQuery.children,
          selectionPointer,
          createEntityPointer,
          editEntityPointer,
          wrapTreeChildren
        )}

        {createEntityPointer != null && createEntityPointer.length === 0 ? (
          <CreateEntity />
        ) : null}
      </Stack>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);

export const buildContent = (
  resolvedQuery: ResolvedQuery,
  selectionPointer: string[] | null,
  editEntityPointer: string[] | null
): JSX.Element => (
  <EntityContent
    entity={resolvedQuery.entity}
    entityId={resolvedQuery.entityId}
    selected={selectionPointer != null && selectionPointer.length === 0}
    editing={editEntityPointer != null && editEntityPointer.length === 0}
    path={resolvedQuery.path}
    collapsed={resolvedQuery.collapsed}
    hasHiddenChildren={resolvedQuery.hasHiddenChildren}
  />
);

export const buildChildren = (
  resolvedQueryChildren: { key: string; value: ResolvedQuery }[],
  selectionPointer: string[] | null,
  createEntityPointer: string[] | null,
  editEntityPointer: string[] | null,
  wrap: (resolvedQuery: ResolvedQuery, element: JSX.Element) => JSX.Element
): JSX.Element[] => {
  const selectionPointerParts = headTail(selectionPointer ?? []);
  const createEntityPointerParts = headTail(createEntityPointer ?? []);
  const editEntityPointerParts = headTail(editEntityPointer ?? []);

  return resolvedQueryChildren.map((child) =>
    wrap(
      child.value,
      <Entity
        resolvedQuery={child.value}
        key={child.key}
        selectionPointer={
          child.key === selectionPointerParts.head
            ? selectionPointerParts.tail
            : null
        }
        createEntityPointer={
          child.key === createEntityPointerParts.head
            ? createEntityPointerParts.tail
            : null
        }
        editEntityPointer={
          child.key === editEntityPointerParts.head
            ? editEntityPointerParts.tail
            : null
        }
      />
    )
  );
};

const wrapTreeChildren = (
  resolvedQuery: ResolvedQuery,
  element: JSX.Element
): JSX.Element =>
  resolvedQuery.highlight ? (
    <EntityIndent entity={resolvedQuery.entity}>{element}</EntityIndent>
  ) : (
    element
  );
