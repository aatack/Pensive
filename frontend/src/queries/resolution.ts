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

    // Don't pivot for the root entity, since it will already have been pivoted
    const pivot = item.parent == null ? null : (pivots[item.entityId] ?? null);

    if (pivot == null) {
      const itemResult: QueryResult = {
        entityId: item.entityId,
        entity: getEntity(item.entityId),
        children: [],
        pivot: null,
        complete: true,
      };

      if (item.parent == null) {
        result = itemResult;
      } else {
        item.parent.children.push(itemResult);
      }

      for (const childId of queryFunction.children(itemResult.entity)) {
        queue.push({ entityId: childId, parent: itemResult });
      }
    } else {
      const itemResult = resolveQuery(item.entityId, pivot, getEntity, pivots);

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
    () => true,
    // Don't prune the results of pivoted queries based on the current query
    (node) => node.pivot == null,
  ).result;
};

const populateQuery = (
  result: QueryResult,
  query: Query,
  getEntity: (entityId: string) => EntityState,
  pivots: { [entityId: string]: Query },
) => {
  // Note: reference equality is important in this function, as the pivots are
  // stored as references and populated in-place later

  const queryFunction = buildQueryFunction(query);

  const queue: { entityId: string; parent: QueryResult }[] = queryFunction
    .children(result.entity)
    .map((entityId) => ({ entityId, parent: result }));
  const pivotQueue: { result: QueryResult; query: Query }[] = [];
  let budget = 200;

  // Explore initially
  while (budget > 0) {
    budget -= 1;
    const item = queue.shift();
    if (item == null) {
      break;
    }

    const child: QueryResult = {
      entityId: item.entityId,
      entity: getEntity(item.entityId),
      children: [],
      pivot: null,
      complete: true,
    };
    item.parent.children.push(child);

    const pivot =
      pivots[child.entityId] ?? queryFunction.pivot(child.entity) ?? null;
    if (pivot == null) {
      for (const childId of queryFunction.children(child.entity)) {
        queue.push({ entityId: childId, parent: child });
      }
    } else {
      pivotQueue.push({ result: child, query: pivot });
    }
  }

  // Mark any unexplored items as incomplete
  for (const item of queue) {
    item.parent.complete = false;
  }

  // Populate any pivoted entities
  for (const item of pivotQueue) {
    item.result.pivot = item.query;
    populateQuery(item.result, item.query, getEntity, pivots);
  }

  // Prune the result
  return prune(
    result,
    () => true,
    (result) => result.pivot != null,
  );
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

    const result: QueryResult = {
      entityId: rootId,
      entity: getEntity(rootId),
      children: [],
      pivot: null,
      complete: true,
    };

    populateQuery(result, query, getEntity, pivots);

    return { result: prune(result, prunePredicate).result, ids };
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
      };
    }
  }
};
