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
  return { ...runLimitedExploreQuery(query.link, context, 4), query };
};

const runLimitedExploreQuery = (
  link: EntityLinkKey,
  context: QueryContext,
  depth: number,
): QueryResult => {
  const entity = context.getEntity(context.entityId);

  const children: QueryResult["children"] =
    depth === 0
      ? []
      : (entity[link ?? "outbound"] ?? []).map((id) => {
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
        .map((item) => item.result.size)
        .reduce((left, right) => left + right, 0),
    children: [],
  };
};
