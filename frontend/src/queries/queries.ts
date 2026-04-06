import { EntityState } from "../components/entity/entity";
import { CollapseQuery, runCollapseQuery } from "./collapse-query";
import { ExploreQuery, runExploreQuery } from "./explore-query";
import { NestedQuery, runNestedQuery } from "./nested-query";

export type Query = ExploreQuery | CollapseQuery | NestedQuery;

export type QueryContext = {
  getEntity: (entityId: string) => EntityState;
  entityId: string;
  overrides: { [entityId: string]: Query };
};

export type QueryOverrides = { [entityId: string]: Query };

export type QueryResult = {
  query: Query | null;
  entityId: string;

  entity: EntityState;

  size: number;
  complete: boolean;
  children: { key: string; result: QueryResult }[];
};

export const runQuery = (query: Query, context: QueryContext): QueryResult => {
  switch (query.type) {
    case "explore":
      return runExploreQuery(query, context);
    case "collapse":
      return runCollapseQuery(query, context);
    case "nested":
      return runNestedQuery(query, context).result;
  }
};
