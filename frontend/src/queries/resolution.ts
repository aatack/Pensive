import { useMemo } from "react";
import { EntityState } from "../components/entity/entity";
import { usePensive } from "../components/pensive";
import { mappingGet } from "../helpers/mapping";
import { Query, QueryFunction, QueryResult } from "./types";
import { prune } from "./helpers";

const resolveQuery = (
  rootId: string,
  query: Query,
  getEntity: (entityId: string) => EntityState,
  pivots: { [entityId: string]: Query },
  path: string[],
): QueryResult => {
  const queryFunction = buildQueryFunction(query);

  let result: QueryResult | null = null;
  let budget = 200;
  const queue: { entityId: string; parent: QueryResult | null }[] = [
    { entityId: rootId, parent: null },
  ];

  while (budget > 0) {
    budget -= 1;
    const item = queue.shift();
    if (item == null) {
      break;
    }

    const entity = getEntity(item.entityId);

    // Don't pivot for the root entity, since it will already have been pivoted
    // [ ] Change this to simply exclude the current path from the pivot lookup
    const pivot =
      item.parent == null
        ? null
        : (pivots[item.entityId] ?? queryFunction.pivot(entity) ?? null);

    if (pivot == null) {
      const itemResult: QueryResult = {
        entityId: item.entityId,
        entity,
        children: [],
        pivot: null,
        complete: true,
        framePath: [...(item.parent?.framePath ?? path), item.entityId],
        pivotPath: [...(item.parent?.pivotPath ?? []), item.entityId],
      };

      if (item.parent == null) {
        result = itemResult;
      } else {
        item.parent.children.push(itemResult);
      }

      // [ ] Check that the child has not appeared in this frame before

      for (const childId of queryFunction.children(itemResult.entity)) {
        queue.push({ entityId: childId, parent: itemResult });
      }
    } else {
      const itemResult = {
        ...resolveQuery(
          item.entityId,
          pivot,
          getEntity,
          pivots,
          item.parent?.framePath ?? [],
        ),
        pivot,
      };

      if (item.parent == null) {
        result = itemResult;
      } else {
        item.parent.children.push(itemResult);
      }
    }
  }

  // Mark any unexplored items as incomplete
  for (const item of queue) {
    if (item.parent != null) {
      item.parent.complete = false;
    }
  }

  if (result == null) {
    throw new Error("Qeury resolution failed");
  }

  // Prune the result
  return prune(
    result,
    queryFunction.prune ?? (() => true),
    // Don't prune the results of pivoted queries based on the current query
    (node) => node.pivot != null,
  ).result;
};

export const usePopulatedQuery = (
  rootId: string,
  query: Query,
  pivots: { [entityId: string]: Query },
  prunePredicate: (entity: EntityState) => boolean,
): { result: QueryResult; ids: Set<string> } => {
  const pensive = usePensive();

  return useMemo(() => {
    const ids = new Set<string>();
    const getEntity = (entityId: string): EntityState => {
      ids.add(entityId);
      return mappingGet(pensive.value.entities, entityId);
    };

    return {
      result: prune(
        resolveQuery(rootId, query, getEntity, pivots, []),
        prunePredicate,
      ).result,
      ids,
    };
  }, [pensive.value.entities, rootId, query, pivots, prunePredicate]);
};

const buildQueryFunction = (query: Query): QueryFunction => {
  switch (query.type) {
    case "links": {
      return {
        children: (entity) => entity[query.linkType ?? "outbound"] ?? [],
        pivot: () => null,
      };
    }
    case "collapse": {
      return { children: () => [], pivot: () => null };
    }
    case "nested": {
      const segment = query.segments[0]?.toLowerCase() ?? "";

      return {
        children: (entity) => entity.outbound ?? [],
        pivot: (entity) => {
          return segment.length > 0 &&
            (entity.text ?? "").toLowerCase().includes(segment)
            ? { type: "nested", segments: query.segments.slice(1) }
            : null;
        },
        prune: () => false,
      };
    }
  }
};
