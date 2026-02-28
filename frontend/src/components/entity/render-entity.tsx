import { useEntity } from "../../context/hooks";
import { ResolvedQuery } from "../pensive";
import { RowEntity } from "./row-entity";
import { TableEntity } from "./table-entity";
import { TreeEntity } from "./tree-entity";

export const Entity = ({
  resolvedQuery,
  row,
}: {
  resolvedQuery: ResolvedQuery;
  row?: boolean;
}) => {
  // Make sure the entity stays loaded
  useEntity(resolvedQuery.entityId);

  if (row) {
    return <RowEntity resolvedQuery={resolvedQuery} />;
  } else if (resolvedQuery.entity.type === "table") {
    return <TableEntity resolvedQuery={resolvedQuery} />;
  } else {
    return <TreeEntity resolvedQuery={resolvedQuery} />;
  }
};