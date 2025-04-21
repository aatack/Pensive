import { useEntity } from "../../context/hooks";
import { ResolvedQuery } from "../pensive";
import { RowEntity } from "./rowEntity";
import { TableEntity } from "./tableEntity";
import { TreeEntity } from "./treeEntity";

export type EntityState = Partial<{
  text: string | null;

  open: boolean | null;
  section: boolean | null;

  inbound: EntityId[] | null;
  outbound: EntityId[] | null;

  image: boolean | null;
}>;

export type EntityId = string;

export const Entity = ({
  resolvedQuery,
  row,
}: {
  resolvedQuery: ResolvedQuery;
  row?: boolean;
}) => {
  // Make sure the entity stays loaded
  const _ = useEntity(resolvedQuery.entityId);

  if (row) {
    return <RowEntity resolvedQuery={resolvedQuery} />;
  } else if (resolvedQuery.entity.text === "TABLE") {
    return <TableEntity resolvedQuery={resolvedQuery} />;
  } else {
    return <TreeEntity resolvedQuery={resolvedQuery} />;
  }
};
