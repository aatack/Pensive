import { runExploreQuery } from "./explore-query";
import { QueryContext, QueryResult } from "./queries";
import { prune } from "./query-manipulation";

export type NestedQuery = {
  type: "nested";
  segments: string[];
};

export const runNestedQuery = (
  query: NestedQuery,
  context: QueryContext,
): QueryResult => {
  if (query.segments.length <= 1) {
    const terms = (query.segments[0] ?? "")
      .split(",")
      .map((term) => term.trim().toLowerCase());
    const result = runExploreQuery(
      { type: "explore", link: "outbound" },
      context,
    );
    return prune(result, (entity) => {
      const text = (entity.text ?? "").toLowerCase();
      return terms.some((term) => text.includes(term));
    }).result;
  }
  return runExploreQuery({ type: "explore", link: "outbound" }, context);
};
