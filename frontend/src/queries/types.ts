import { EntityState } from "../components/entity/entity";

export type Query =
  | { type: "links"; linkType: LinkType }
  | { type: "collapse" }
  | { type: "nested"; segments: string[] };

export type LinkType = NonNullable<
  {
    [K in keyof EntityState]: NonNullable<EntityState[K]> extends string[]
      ? K
      : never;
  }[keyof EntityState]
>;

export type QueryFunction = {
  children: (entity: EntityState) => string[];
  pivot: (entity: EntityState) => Query | null;
  prune?: (entity: EntityState) => boolean;
};

export type QueryResult = {
  entityId: string;
  entity: EntityState;

  children: QueryResult[];

  pivot: Query | null;
  complete: boolean;

  framePath: string[];
  pivotPath: string[];
};

export type FlattenedResult = Omit<QueryResult, "children"> & {
  path: string[];
};
