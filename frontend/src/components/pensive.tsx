import { ReactNode, useEffect } from "react";
import { Metadata, pensiveMetadata } from "../api/endpoints";
import { Atom, useAtom } from "../helpers/atoms";
import { Mapping, mappingGet } from "../helpers/mapping";
import { Provide, useProvided } from "../providers/provider";
import { EntityLinkKey, EntityState } from "./entity/entity";
import { headTail, isEmptyArray } from "../helpers/arrays";
import { LinearProgress } from "@mui/material";
import { Json } from "../constants";

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
   * Mapping from snapshots to name to object URLs for loaded resources.
   *
   * Once a resource is loaded, the blob is immediately converted into an object
   * URL and stored in here.  The number of subscribers is also tracked, such
   * that once the count reaches zero the blob can be removed from the document.
   * This is not yet implemented, however; once loaded, resources will hang
   * around indefinitely.
   */
  resources: Mapping<string, Request & { url: string | null }>;

  /**
   * Locally tracks the history of recent edits so they can be undone if needed.
   */
  history: { undo: PensiveWrite[]; redo: PensiveWrite[] };
};

export type PensiveWrite = {
  timestamp: Date;
  entities: { [uuid: string]: { [key: string]: Json } };
  resources: { [uuid: string]: Blob };
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
    resources: {
      default: { status: "waiting", subscribers: 0, url: null },
      mapping: {},
    },
    history: { undo: [], redo: [] },
  });

  return pensive;
};

export const ProvidePensive = ({ children }: { children: ReactNode }) => {
  const metadata = useAtom<Metadata | null>(null);
  const pensiveState = usePensiveState();

  useEffect(() => {
    pensiveMetadata().then(metadata.reset);
  }, []);

  return metadata.value == null ? (
    <LinearProgress />
  ) : (
    <Provide values={{ pensive: pensiveState, metadata: metadata.value }}>
      {children}
    </Provide>
  );
};

export const usePensive = () => useProvided("pensive");

export const useMetadata = () => useProvided("metadata");

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
  editEntityPath: string[] | null,
  pivots: { [entityId: string]: EntityLinkKey | null },
  childrenKey: EntityLinkKey | null
): ResolvedQuery => {
  const entity = mappingGet(entities, entityId);

  // The root entity is never collapsed
  const entityCollapsed = collapsed.includes(entityId) && path.length > 0;
  const entityExpanded = expanded.includes(entityId);

  if (entityId in pivots) {
    console.log(entityId, pivots[entityId]);
  }
  const actualChildrenKey = pivots[entityId] ?? childrenKey ?? "outbound";

  const children = entity[actualChildrenKey] ?? [];
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
      : includedChildren
          // To prevent infinite loops, if the entity has already been rendered
          // in this branch, it should not be rendered again
          .filter((child) => !path.includes(child))
          .map((child) => ({
            key: child,
            value: resolveQuery(
              entities,
              child,
              entityExpanded ? () => true : highlight,
              collapsed,
              expanded,
              limit,
              [...(path ?? []), child],
              child === selectionPathParts.head
                ? selectionPathParts.tail
                : null,
              child === createEntityPathParts.head
                ? createEntityPathParts.tail
                : null,
              child === editEntityPathParts.head
                ? editEntityPathParts.tail
                : null,
              pivots,
              actualChildrenKey
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
  limit: number,
  pivots: { [entityId: string]: EntityLinkKey | null }
): Set<string> => {
  const included = new Set<string>();

  const toExplore: { id: string; childrenKey: EntityLinkKey }[] = [
    { id: entityId, childrenKey: pivots[entityId] ?? "outbound" },
  ];
  while (toExplore.length > 0 && included.size < limit) {
    const current = toExplore.shift();
    if (current == null) {
      break;
    }
    if (included.has(current.id)) {
      continue;
    }
    included.add(current.id);

    const actualChildrenKey =
      pivots[entityId] ?? current.childrenKey ?? "outbound";

    (mappingGet(entities, current.id)[actualChildrenKey] ?? []).forEach(
      (child) => {
        toExplore.push({ id: child, childrenKey: actualChildrenKey });
      }
    );
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

const REDACTED = "<<< Redacted >>>";

/**
 * Export a resolved query as a markdown string.
 */
export const exportResolvedQuery = (
  resolvedQuery: ResolvedQuery,
  sectionIndent = 1,
  textIndent = 0,
  selectionMarker?: string
): string => {
  const entity = resolvedQuery.entity;

  const newIndent = "    ".repeat(textIndent);

  const newPrefix =
    "- " +
    (entity.section ? "#".repeat(sectionIndent) + " " : "") +
    (entity.open == null ? "" : entity.open ? "[ ] " : "[x] ");

  const newText = entity.redacted
    ? REDACTED
    : (resolvedQuery.selected && selectionMarker != null
        ? selectionMarker + " "
        : "") +
      (entity.image ? `image@${resolvedQuery.entityId}` : entity.text ?? "");

  return [
    `${newIndent}${newPrefix}${newText.split("\n").join("\n" + newIndent)}`,
    ...resolvedQuery.children.map(({ value }) =>
      exportResolvedQuery(
        value,
        sectionIndent + (entity.section ? 1 : 0),
        textIndent + 1,
        selectionMarker
      )
    ),
  ].join("\n");
};
