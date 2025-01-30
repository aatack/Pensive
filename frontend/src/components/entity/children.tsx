import { headTail } from "../../helpers/arrays";
import { ResolvedQuery } from "../pensive";
import { Entity } from "./entity";

export const EntityChildren = ({
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
      ))}
    </>
  );
};
