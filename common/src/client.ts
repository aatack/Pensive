import { Json, sorted, Uuid } from "./helpers";
import { Reducer, replace } from "./reducers";
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

export const createClient = (
  reducers: { [key: string]: Reducer },
  rootStore: Store,
  additionalStores: Store[]
): Client => {
  return {
    rootEntity: rootStore.rootEntity,

    readEntities: (uuids) => {
      const storeEntities = sorted(
        [rootStore, ...additionalStores].flatMap((store) =>
          store.readEntities(uuids)
        ),
        ({ timestamp, uuid, key, value }) => [timestamp, uuid, key, value]
      );

      const entities: { [uuid: Uuid]: { [key: string]: Json } } = {};

      storeEntities.forEach(({ uuid, key, value }) => {
        const reducer = reducers[key] ?? replace;
        entities[uuid] = {
          ...entities[uuid],
          key: reducer(entities[uuid]?.[key] ?? null, value),
        };
      });

      return entities;
    },

    readResources: (uuids) => {
      const storeResources = sorted(
        [rootStore, ...additionalStores].flatMap((store) =>
          store.readResources(uuids)
        ),
        ({ timestamp, uuid, data }) => [timestamp, uuid, data]
      );

      const resources: { [uuid: Uuid]: Buffer } = {};

      storeResources.forEach(({ uuid, data }) => {
        resources[uuid] = data;
      });

      return resources;
    },

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
