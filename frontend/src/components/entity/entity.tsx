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
  type: "table" | "formula" | "formulaTest" | null;

  redacted: boolean | null;
  snoozed: string | null; // ISO format
  llmContext: LlmContext | null;
}>;

export type EntityLinkKey = {
  [K in keyof EntityState]: NonNullable<EntityState[K]> extends string[]
    ? K
    : never;
}[keyof EntityState];

export type EntityId = string;

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
