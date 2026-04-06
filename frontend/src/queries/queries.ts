import { EntityLinkKey, EntityState } from "../components/entity/entity";
import { Mapping, mappingGet } from "../helpers/mapping";
import { ExploreQuery } from "./explore-query";

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
  throw new Error();
};

export const runLinksQuery = (
  entityId: string,
  linkType: EntityLinkKey,
  overrides: QueryOverrides,
  getEntity: (entityId: string) => EntityState,
  depth: number,
): QueryResult => {
  const entity = getEntity(entityId);

  const children: QueryResult["children"] =
    depth === 0
      ? []
      : (entity[linkType ?? "outbound"] ?? []).map((id) => ({
          key: id,
          result: runLinksQuery(
            entityId,
            linkType,
            overrides,
            getEntity,
            depth - 1,
          ),
        }));

  return {
    query: { type: "links", linkType },
    entityId,
    entity,

    size:
      1 +
      children
        .map((item) => item.result.size)
        .reduce((left, right) => left + right, 0),
    children: [],
  };
};

export const runSectionQuery = (
  entityId: string,
  query: Query,
  segments: string[],
  overrides: QueryOverrides,
): QueryResult => {
  if (segments.length === 0) {
    return runQuery(query, entityId, overrides);
  } else {
    const result = runQuery({}, entityId);
  }
};

export const resolveQuery = (options: {
  query: Query;
  // collapsed: { [entityId: string]: boolean };
  // overrides: { [entityId: string]: Query | null };
  lookup: Mapping<string, EntityState>;
  budget: number;
}): { resolvedQuery: Query; queriedEntities: Set<string> } => {
  const queriedEntities = new Set<string>();
  let queriedCount = 0;

  const getEntity = (entityId: string) => {
    if (queriedCount >= options.budget) {
      return null;
    } else {
      queriedCount += 1;
      queriedEntities.add(entityId);
      return mappingGet(options.lookup, entityId);
    }
  };

  const resolveSingleQuery = (
    query: Query,
  ): {
    data: EntityState;
    children: { key: string; query: Query }[];
  } | null => {
    switch (query.type) {
      case "links": {
        const entity = getEntity(query.entityId);
        if (entity == null) {
          return null;
        }

        return { data: entity, children: [] };
      }
    }
  };

  const resolvedQuery: Query = { ...options.query, resolution: null };

  const queue: { query: Query; parent?: { query: Query; key: string } }[] = [
    { query: resolvedQuery },
  ];
  while (queue.length > 0) {
    const query = queue.shift();
    if (query == null) {
      break;
    }

    const result = resolveSingleQuery(query.query);
    if (result == null) {
      break;
    }

    const { data, children } = result;

    if (query.parent != null) {
      query.parent.query.resolution?.children.push({
        key: query.parent.key,
        query: query.query,
      });
    }

    query.query.resolution = { data, children: [], collapsed: false };
    for (const child of children) {
      queue.push({
        query: child.query,
        parent: { query: query.query, key: child.key },
      });
    }
  }

  return { resolvedQuery, queriedEntities };
};

export type FlattenedResolvedQuery = {
  entityId: string;
  entity: EntityState;

  collapsed: boolean;
  path: string[];
};

export const flattenQuery = (
  resolvedQuery: ResolvedQuery,
  path: string[],
): FlattenedResolvedQuery[] => {
  return [
    {
      entityId: resolvedQuery.entityId,
      entity: resolvedQuery.entity,
      collapsed: resolvedQuery.collapsed,
      path: path ?? [],
    },
    ...resolvedQuery.children.flatMap((child) =>
      flattenQuery(child.value, [...(path ?? []), child.value.entityId]),
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
): string => {
  const entity = resolvedQuery.entity;

  const newIndent = "    ".repeat(textIndent);

  const newPrefix =
    "- " +
    (entity.section ? "#".repeat(sectionIndent) + " " : "") +
    (entity.open == null ? "" : entity.open ? "[ ] " : "[x] ");

  const newText = entity.redacted
    ? REDACTED
    : entity.image
      ? `image@${resolvedQuery.entityId}`
      : (entity.text ?? "");

  return [
    `${newIndent}${newPrefix}${newText.split("\n").join("\n" + newIndent)}`,
    ...resolvedQuery.children.map(({ value }) =>
      exportResolvedQuery(
        value,
        sectionIndent + (entity.section ? 1 : 0),
        textIndent + 1,
      ),
    ),
  ].join("\n");
};
