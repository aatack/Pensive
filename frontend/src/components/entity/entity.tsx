import { useEntity } from "../../context/hooks";
import { ResolvedQuery } from "../pensive";
import { RowEntity } from "./rowEntity";
import { TableEntity } from "./tableEntity";
import { TreeEntity } from "./treeEntity";

export type EntityState = {
  text?: string | null;

  open?: boolean | null;
  section?: boolean | null;

  parent?: EntityId | null;
  children?: EntityId[] | null;

  reference?: EntityId | null;
  referees?: EntityId[] | null;

  image?: { note: string; name: string }[] | null;
};

export type EntityId = string;

export const Entity = ({
  resolvedQuery,
  selectionPointer,
  createEntityPointer,
  editEntityPointer,
  row,
}: {
  resolvedQuery: ResolvedQuery;
  selectionPointer: string[] | null;
  createEntityPointer: string[] | null;
  editEntityPointer: string[] | null;
  row?: boolean;
}) => {
  // Make sure the entity stays loaded
  const _ = useEntity(resolvedQuery.entityId, null);

  if (row) {
    return (
      <RowEntity
        resolvedQuery={resolvedQuery}
        selectionPointer={selectionPointer}
        createEntityPointer={createEntityPointer}
        editEntityPointer={editEntityPointer}
      />
    );
  } else if (resolvedQuery.entity.text === "TABLE") {
    return (
      <TableEntity
        resolvedQuery={resolvedQuery}
        selectionPointer={selectionPointer}
        createEntityPointer={createEntityPointer}
        editEntityPointer={editEntityPointer}
      />
    );
  } else {
    return (
      <TreeEntity
        resolvedQuery={resolvedQuery}
        selectionPointer={selectionPointer}
        createEntityPointer={createEntityPointer}
        editEntityPointer={editEntityPointer}
      />
    );
  }
};
