import { useEntity } from "../../context/hooks";
import { LlmContext } from "../../llms";
import { ResolvedQuery } from "../pensive";
import { RowEntity } from "./row-entity";
import { TableEntity } from "./table-entity";
import { TreeEntity } from "./tree-entity";

export type EntityState = Partial<{
  text: string | null;

  open: boolean | null;
  section: boolean | null;

  inbound: EntityId[] | null;
  outbound: EntityId[] | null;

  image: boolean | null;

  redacted: boolean;
  llmContext: LlmContext;
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
