import { Json, Uuid } from "./helpers";

export type Client = {
  rootEntity: () => Uuid | null;
  readEntities: (uuids: Uuid[]) => { [uuid: Uuid]: { [key: string]: Json } };

  readResources: (uuids: Uuid[]) => { [uuid: Uuid]: Buffer };

  write: (
    timestamp: Date,
    entities: { [uuid: Uuid]: { [key: string]: Json } },
    resources: { [uuid: Uuid]: Buffer }
  ) => void;
};
