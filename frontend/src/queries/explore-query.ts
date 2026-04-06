import { EntityLinkKey } from "../components/entity/entity";
import { QueryContext, QueryResult, runQuery } from "./queries";

export type ExploreQuery = {
  type: "explore";
  link: EntityLinkKey;
};

export const runExploreQuery = (
  query: ExploreQuery,
  context: QueryContext,
): QueryResult => {
  return {
    ...expandResult(
      query,
      context,
      0,
      runLimitedExploreQuery(query.link, context, 0),
    ),
    query,
  };
};

const expandResult = (
  query: ExploreQuery,
  context: QueryContext,
  depth: number,
  result: QueryResult,
): QueryResult => {
  if (result.complete) {
    return result;
  }
  const expandedResult = runLimitedExploreQuery(query.link, context, depth + 1);
  if (expandedResult.size <= 200) {
    return expandResult(query, context, depth + 1, expandedResult);
  } else {
    return result;
  }
};

const runLimitedExploreQuery = (
  link: EntityLinkKey,
  context: QueryContext,
  depth: number,
): QueryResult => {
  const entity = context.getEntity(context.entityId);
  const childIds = entity[link ?? "outbound"] ?? [];

  const children: QueryResult["children"] =
    depth === 0
      ? []
      : childIds.map((id) => {
          const queryOverride = context.overrides[id];
          return {
            key: id,
            result:
              queryOverride == null
                ? runLimitedExploreQuery(
                    link,
                    { ...context, entityId: id },
                    depth - 1,
                  )
                : runQuery(queryOverride, { ...context, entityId: id }),
          };
        });

  return {
    query: null,
    entityId: context.entityId,
    entity,

    size:
      1 +
      children
        // Don't include overridden items in the size
        .map((item) => (item.result.query == null ? item.result.size : 0))
        .reduce((left, right) => left + right, 0),
    complete:
      children.length < childIds.length
        ? true
        : children.some((child) => child.result.complete),
    children: [],
  };
};
