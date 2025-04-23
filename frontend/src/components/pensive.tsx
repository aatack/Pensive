import { ReactNode, useEffect } from "react";
import { Metadata, pensiveMetadata } from "../api/endpoints";
import { Atom, useAtom } from "../helpers/atoms";
import { Mapping, mappingGet } from "../helpers/mapping";
import { Provide, useProvided } from "../providers/provider";
import { EntityState } from "./entity/entity";
import { headTail, isEmptyArray } from "../helpers/arrays";

export type PensiveState = {
  /**
   * A cache of entity data, indexed by entity ID.
   *
   * This will sometimes be optimistically updated by the frontend and then
   * ratified by the data returned from an update.  See the mapping of queries
   * for information on whether each entity has been recently loaded from the
   * server.
   */
  entities: Mapping<string, EntityState>;

  /**
   * Data on the status of queries
   */
  queries: Mapping<string, Request>;

  /**
   * A copy of the pensive's metadata, once it has been queried.
   */
  metadata: Metadata | null;

  /**
   * Mapping from snapshots to name to object URLs for loaded resources.
   *
   * Once a resource is loaded, the blob is immediately converted into an object
   * URL and stored in here.  The number of subscribers is also tracked, such
   * that once the count reaches zero the blob can be removed from the document.
   * This is not yet implemented, however; once loaded, resources will hang
   * around indefinitely.
   */
  resources: Mapping<string, Request & { url: string | null }>;
};

export type Request = {
  /**
   * Whether or not a request for the most recent entity data is in flight.
   *
   * Because some updates are made eagerly on the frontend, it is possible for
   * the status to be running while there exists data for the entity in the
   * cache already.  Any additional data that gets added in the meantime is at
   * risk of being overridden.
   */
  status: "waiting" | "running" | "error" | "success";

  /**
   * Number of hooks that are currently watching this entity.
   *
   * If this drops to zero, the entity can be removed from the cache.
   */
  subscribers: number;
};

const usePensiveState = (): Atom<PensiveState> => {
  const pensive = useAtom<PensiveState>({
    entities: { default: {}, mapping: {} },
    queries: { default: { status: "waiting", subscribers: 0 }, mapping: {} },
    metadata: null,
    resources: {
      default: { status: "waiting", subscribers: 0, url: null },
      mapping: {},
    },
  });

  useEffect(() => {
    pensiveMetadata().then((metadata) =>
      pensive.swap((current) => ({ ...current, metadata }))
    );
  }, []);

  return pensive;
};

export const ProvidePensive = ({ children }: { children: ReactNode }) => {
  return <Provide values={{ pensive: usePensiveState() }}>{children}</Provide>;
};

export const usePensive = () => useProvided("pensive");

export type ResolvedQuery = {
  entityId: string;
  path: string[];
  entity: EntityState;
  children: { key: string; value: ResolvedQuery }[];
  highlight: boolean;
  collapsed: boolean;
  hasHiddenChildren: boolean;

  selected: boolean;
  createEntity: boolean;
  editEntity: boolean;
};

export const resolveQuery = (
  entities: Mapping<string, EntityState>,
  entityId: string,
  highlight: (entity: EntityState) => boolean,
  collapsed: string[],
  expanded: string[],
  limit: Set<string>,
  path: string[],
  selectionPath: string[] | null,
  createEntityPath: string[] | null,
  editEntityPath: string[] | null
): ResolvedQuery => {
  const entity = mappingGet(entities, entityId);

  // The root entity is never collapsed
  const entityCollapsed = collapsed.includes(entityId) && path.length > 0;
  const entityExpanded = expanded.includes(entityId);

  const children = entity.outbound ?? [];
  const includedChildren = children.filter((child) => limit.has(child));

  const selectionPathParts = headTail(selectionPath ?? []);
  const createEntityPathParts = headTail(createEntityPath ?? []);
  const editEntityPathParts = headTail(editEntityPath ?? []);

  return {
    entityId,
    entity,
    path: path ?? [],
    children: entityCollapsed
      ? []
      : includedChildren.map((child) => ({
          key: child,
          value: resolveQuery(
            entities,
            child,
            entityExpanded ? () => true : highlight,
            collapsed,
            expanded,
            limit,
            [...(path ?? []), child],
            child === selectionPathParts.head ? selectionPathParts.tail : null,
            child === createEntityPathParts.head
              ? createEntityPathParts.tail
              : null,
            child === editEntityPathParts.head ? editEntityPathParts.tail : null
          ),
        })),
    highlight: entityExpanded || highlight(entity),
    collapsed: entityCollapsed,
    hasHiddenChildren:
      !entityCollapsed && children.length > includedChildren.length,
    selected: isEmptyArray(selectionPath),
    createEntity: isEmptyArray(createEntityPath),
    editEntity: isEmptyArray(editEntityPath),
  };
};

/**
 * Determine which entities should be rendered if only a certain number can be.
 *
 * The limit is applied by following the children of each entity in a breadth-
 * first search.
 */
export const findQueryResolutionLimit = (
  entities: Mapping<string, EntityState>,
  entityId: string,
  limit: number
): Set<string> => {
  const included = new Set<string>();

  const toExplore = [entityId];
  while (toExplore.length > 0 && included.size < limit) {
    const current = toExplore.shift()!;
    included.add(current);
    (mappingGet(entities, current).outbound ?? []).forEach((child) => {
      toExplore.push(child);
    });
  }

  return included;
};

/**
 * Return the order in which paths appear in a resolved query.
 *
 * Each path, initially an array of entity IDs, will be converted into a single
 * string by joining the IDs with double underscores.
 */
export const flattenResolvedQuery = (
  resolvedQuery: ResolvedQuery,
  path?: string[]
): string[] => {
  const nextPath = [...(path ?? []), resolvedQuery.entityId];
  return [
    ...(resolvedQuery.highlight ? [nextPath.join("__")] : []),
    ...resolvedQuery.children.flatMap((child) =>
      flattenResolvedQuery(child.value, nextPath)
    ),
  ];
};
