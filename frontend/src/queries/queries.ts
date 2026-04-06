import { EntityLinkKey, EntityState } from "../components/entity/entity";
import { Mapping, mappingGet } from "../helpers/mapping";
import { ExploreQuery, runExploreQuery } from "./explore-query";

export type Query = ExploreQuery;

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
  }
};