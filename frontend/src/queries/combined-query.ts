import { EntityState } from "../components/entity/entity";

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

  // Prune the tree
  const fixedResult = null;

  // Populate any pivoted entities
  for (const item of pivotQueue) {
    item.result.pivot = item.query;
    populateQuery(item.result, item.query, getEntity, pivots);
  }
};
