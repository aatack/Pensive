import { EntityState } from "../components/entity/entity";

export type Query =
  | { type: "links"; linkType: LinkType }
  | { type: "collapse" };

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
  type: string;
};

export type QueryResult = {
  entityId: string;
  entity: EntityState;

  children: QueryResult[];

  pivot: Query | null;
  complete: boolean;
};

export type FlattenedResult = Omit<QueryResult, "children"> & {
  path: string[];
};
