import { runExploreQuery } from "./explore-query";
import { QueryContext, QueryResult } from "./queries";

export type NestedQuery = {
  type: "nested";
  segments: string[];
};

export const runNestedQuery = (
  query: NestedQuery,
  context: QueryContext,
): QueryResult => {
  return runExploreQuery({ type: "explore", link: "outbound" }, context);
};
