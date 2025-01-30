import equal from "fast-deep-equal";
import { memo } from "react";
import { CreateEntity } from "../tool/create-entity";
import { ResolvedQuery } from "../pensive";
import { headTail } from "../../helpers/arrays";
import { Entity } from "./entity";
import { EntityContent } from "./content";

export const RowEntity = memo(
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

    return (
      <>
        <tr>
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
        </tr>

        <Children
          resolvedQueryChildren={resolvedQuery.children}
          selectionPointer={selectionPointer}
          createEntityPointer={createEntityPointer}
          editEntityPointer={editEntityPointer}
        />

        {createEntityPointer != null && createEntityPointer.length === 0 ? (
          <tr>
            <CreateEntity />
          </tr>
        ) : null}
      </>
    );
  },
  (oldProps, newProps) => equal(oldProps, newProps)
);

export const Children = ({
  resolvedQueryChildren,
  selectionPointer,
  createEntityPointer,
  editEntityPointer,
}: {
  resolvedQueryChildren: { key: string; value: ResolvedQuery }[];
  selectionPointer: string[] | null;
  createEntityPointer: string[] | null;
  editEntityPointer: string[] | null;
}) => {
  const selectionPointerParts = headTail(selectionPointer ?? []);
  const createEntityPointerParts = headTail(createEntityPointer ?? []);
  const editEntityPointerParts = headTail(editEntityPointer ?? []);

  return (
    <>
      {resolvedQueryChildren.map((child) => (
        <td>
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
        </td>
      ))}
    </>
  );
};
