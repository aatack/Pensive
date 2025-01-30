import { useEntity } from "../../context/hooks";
import { ResolvedQuery } from "../pensive";
import { EntityLayout } from "./layout";

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
}: {
  resolvedQuery: ResolvedQuery;
  selectionPointer: string[] | null;
  createEntityPointer: string[] | null;
  editEntityPointer: string[] | null;
}) => {
  // Make sure the entity stays loaded
  const _ = useEntity(resolvedQuery.entityId, null);

  return (
    <EntityLayout
      resolvedQuery={resolvedQuery}
      selectionPointer={selectionPointer}
      createEntityPointer={createEntityPointer}
      editEntityPointer={editEntityPointer}
    />
  );
};
