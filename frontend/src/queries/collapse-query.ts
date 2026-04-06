import { QueryContext, QueryResult } from "./queries";

export type CollapseQuery = { type: "collapse" };

export const runCollapseQuery = (
  query: CollapseQuery,
  context: QueryContext,
): QueryResult => {
  return {
    query,
    entityId: context.entityId,
    entity: context.getEntity(context.entityId),
    size: 1,
    complete: true,
    children: [],
  };
};
