import { EntityLinkKey, EntityState } from "../components/entity/entity";
import { Mapping, mappingGet } from "../helpers/mapping";

export type Query = {
  type: "links";
  key: EntityLinkKey;
};

export type ResolvedQuery = {
  entityId: string;
  entity: EntityState;

  collapsed: boolean;

  children: { key: string; value: ResolvedQuery }[];
};

export const resolveQuery = (options: {
  query: Query;
  entityId: string;
  collapsed: { [entityId: string]: boolean };
  overrides: { [entityId: string]: Query | null };
  lookup: Mapping<string, EntityState>;
  path: string[];
}): { data: ResolvedQuery; ids: string[] } => {
  const entity = mappingGet(options.lookup, options.entityId);

  // Always terminate here if the entity is collapsed or has already appeared in
  // this path, unless it's the root
  const expanded = options.collapsed[options.entityId] === false;
  const collapsed =
    (options.collapsed[options.entityId] && options.path.length > 0) ||
    options.path.includes(options.entityId) ||
    (options.path.length > 4 && entity.section && !expanded) ||
    (options.path.length > 8 && !expanded);

  if (collapsed) {
    return {
      data: {
        entityId: options.entityId,
        entity,
        collapsed: true,
        children: [],
      },
      ids: [options.entityId],
    };
  }

  // If there is an override, return that instead
  const override = options.overrides[options.entityId];
  if (override != null) {
    return resolveQuery({
      ...options,
      overrides: { ...options.overrides, [options.entityId]: null },
      query: override,
    });
  }

  switch (options.query.type) {
    case "links": {
      const key = options.query.key ?? "outbound";
      const children = (entity[key] ?? []).map((id) =>
        resolveQuery({
          ...options,
          entityId: id,
          path: [...options.path, options.entityId],
        }),
      );

      return {
        data: {
          entityId: options.entityId,
          entity,
          collapsed: false,
          children: children.map((child) => ({
            key: child.data.entityId,
            value: child.data,
          })),
        },
        ids: [options.entityId, ...children.flatMap((child) => child.ids)],
      };
    }
  }
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
      flattenQuery(child.value, [...(path ?? []), resolvedQuery.entityId]),
    ),
  ];
};
