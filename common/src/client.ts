import { Json, Uuid } from "./helpers";
import { Reducer } from "./reducers";
import { Store } from "./store";

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

export const client = (
  reducers: { [key: string]: Reducer },
  rootStore: Store,
  additionalStores: Store[]
): Client => {
  return {
    rootEntity: rootStore.rootEntity,

    readEntities: () => ({}),

    readResources: () => ({}),

    write: (timestamp, entities, resources) => {
      rootStore.writeEntities(
        Object.entries(entities).flatMap(([uuid, entity]) =>
          Object.entries(entity).map(([key, value]) => ({
            timestamp,
            uuid,
            key,
            value,
          }))
        )
      );
      rootStore.writeResources(
        Object.entries(resources).map(([uuid, data]) => ({
          timestamp,
          uuid,
          data,
        }))
      );
    },
  };
};
