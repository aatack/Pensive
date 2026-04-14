import { useMemo } from "react";
import { EntityLinkKey, EntityState } from "../components/entity/entity";
import { usePensive } from "../components/pensive";
import { mappingGet } from "../helpers/mapping";

type Result = {
  entityId: string;
  entity: EntityState;

  children: Result[];

  pivot: QueryFunction | null;
  complete: boolean;
};

type QueryFunction = {
  children: (entity: EntityState) => string[];
  pivot: (entity: EntityState) => QueryFunction | null;
};

const populateQuery = (
  result: Result,
  query: QueryFunction,
  getEntity: (entityId: string) => EntityState,
  pivots: { [entityId: string]: QueryFunction },
) => {
  // Note: reference equality is important in this function, as the pivots are
  // stored as references and populated in-place later

  const queue: { entityId: string; parent: Result }[] = query
    .children(result.entity)
    .map((entityId) => ({ entityId, parent: result }));
  const pivotQueue: { result: Result; query: QueryFunction }[] = [];
  let budget = 200;

  // Explore initially
  while (budget > 0) {
    budget -= 1;
    const item = queue.shift();
    if (item == null) {
      break;
    }

    const child: Result = {
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
  result: Result,
  predicate: (entity: EntityState) => boolean,
  stop?: (result: Result) => boolean,
): { result: Result; hasAny: boolean } => {
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

export const usePopulatedQuery = (
  rootId: string,
  query: QueryFunction,
  pivots: { [entityId: string]: QueryFunction },
): { result: Result; ids: Set<string> } => {
  const pensive = usePensive();

  return useMemo(() => {
    const ids = new Set<string>();
    const getEntity = (entityId: string): EntityState => {
      ids.add(entityId);
      return mappingGet(pensive.value.entities, entityId);
    };

    const result: Result = {
      entityId: rootId,
      entity: getEntity(rootId),
      children: [],
      pivot: null,
      complete: true,
    };

    populateQuery(result, query, getEntity, pivots);

    return { result, ids };
  }, [pensive.value.entities, rootId, query, pivots]);
};

export const buildQueryFunction = (
  query: { type: "link"; links: EntityLinkKey } | { type: "collapse" },
): QueryFunction => {
  switch (query.type) {
    case "link": {
      return {
        children: (entity) => entity[query.links ?? "outbound"] ?? [],
        pivot: () => null,
      };
    }
    case "collapse": {
      return { children: () => [], pivot: () => null };
    }
  }
};
