import { EntityState } from "../components/entity/entity";

export type Query = {
  type: "links";
  links: "outbound" | "inbound";
};

export type QueryFunction = {
  children: (entity: EntityState) => string[];
  pivot: (entity: EntityState) => QueryFunction | null;
  type: string;
};

export type QueryResult = {
  entityId: string;
  entity: EntityState;

  children: QueryResult[];

  pivot: QueryFunction | null;
  complete: boolean;
};

export type FlattenedResult = Omit<QueryResult, "children"> & {
  path: string[];
};
