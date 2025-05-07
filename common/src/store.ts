import { Json, Uuid } from "./helpers";

export type StoreEntity = {
  timestamp: Date;
  uuid: Uuid;
  key: string;
  value: Json;
};

export type StoreResource = {
  timestamp: Date;
  uuid: Uuid;
  data: Buffer;
};

export type Store = {
  writeEntities: (entities: StoreEntity[]) => void;
  rootEntity: () => Uuid | null;
  readEntities: (uuids: Uuid[]) => StoreEntity[];
  writeResources: (resources: StoreResource[]) => void;
  readResources: (uuids: Uuid[]) => StoreResource[];
};
