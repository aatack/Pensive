import { useMemo } from "react";
import { EntityLinkKey, EntityState } from "../components/entity/entity";
import { usePensive } from "../components/pensive";
import { mappingGet } from "../helpers/mapping";
import { FlattenedResult, QueryFunction, QueryResult } from "./types";

const populateQuery = (
  result: QueryResult,
  query: QueryFunction,
  getEntity: (entityId: string) => EntityState,
  pivots: { [entityId: string]: QueryFunction },
) => {
  // Note: reference equality is important in this function, as the pivots are
  // stored as references and populated in-place later

  const queue: { entityId: string; parent: QueryResult }[] = query
    .children(result.entity)
    .map((entityId) => ({ entityId, parent: result }));
  const pivotQueue: { result: QueryResult; query: QueryFunction }[] = [];
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

    const pivot = pivots[child.entityId] ?? query.pivot(child.entity) ?? null;
    if (pivot == null) {
      for (const childId of query.children(child.entity)) {
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

export const prune = (
  result: QueryResult,
  predicate: (entity: EntityState) => boolean,
  stop?: (result: QueryResult) => boolean,
): { result: QueryResult; hasAny: boolean } => {
  if (stop?.(result)) {
    return { result, hasAny: true };
  }

  const children = result.children
    .map((child) => prune(child, predicate, stop))
    .filter((child) => child.hasAny)
    .map((child) => child.result);

  return {
    result: { ...result, children },
    hasAny: children.length > 0 || predicate(result.entity),
  };
};

export const flatten = <T = never>(
  result: QueryResult,
  path: string[],
  marker?: (path: string[]) => [T] | null,
): (FlattenedResult | T)[] => {
  return [
    {
      entityId: result.entityId,
      entity: result.entity,
      pivot: result.pivot,
      complete: result.complete,
      path: path ?? [],
    },
    ...result.children.flatMap((child) =>
      flatten(child, [...(path ?? []), child.entityId], marker),
    ),
    ...(marker?.(path ?? []) ?? []),
  ];
};

export const usePopulatedQuery = (
  rootId: string,
  query: QueryFunction,
  pivots: { [entityId: string]: QueryFunction },
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

export const buildQueryFunction = (
  query: { type: "link"; links: EntityLinkKey } | { type: "collapse" },
): QueryFunction => {
  switch (query.type) {
    case "link": {
      return {
        children: (entity) => entity[query.links ?? "outbound"] ?? [],
        pivot: () => null,
        type: "link",
      };
    }
    case "collapse": {
      return { children: () => [], pivot: () => null, type: "collapse" };
    }
  }
};
