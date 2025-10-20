import { useEffect } from "react";
import {
  pensiveRead,
  pensiveReadResource,
  pensiveUndo,
  pensiveWrite,
} from "../api/endpoints";
import { cursor, mappingCursor } from "../helpers/atoms";
import { usePensive } from "../components/pensive";
import { EntityState } from "../components/entity/entity";
import { useDeepMemo } from "../helpers/state";
import { butLast, last } from "../helpers/arrays";

export const useSyncEntity = () => {
  const pensive = usePensive();

  return async (entityUuid: string): Promise<EntityState> => {
    const cache = mappingCursor(cursor(pensive, "entities"), entityUuid);
    const query = mappingCursor(cursor(pensive, "queries"), entityUuid);

    query.swap((current) => ({ ...current, status: "running" }));

    return pensiveRead(entityUuid)
      .then((entity) => {
        cache.reset(entity);
        query.swap((current) => ({ ...current, status: "success" }));
        return entity;
      })
      .catch((exception) => {
        query.swap((current) => ({ ...current, status: "error" }));
        throw exception;
      });
  };
};

export const useGetEntity = () => {
  const sync = useSyncEntity();
  const pensive = usePensive();

  return (entityUuid: string): Promise<EntityState> => {
    const cache = mappingCursor(cursor(pensive, "entities"), entityUuid);
    const query = mappingCursor(cursor(pensive, "queries"), entityUuid);

    if (query.value.status === "success") {
      return Promise.resolve(cache.value);
    } else {
      // Note that this may override the status of any currently running queries
      return sync(entityUuid);
    }
  };
};

export const useEntity = (entityUuid: string) => {
  const sync = useSyncEntity();

  const pensive = usePensive();
  const cache = mappingCursor(cursor(pensive, "entities"), entityUuid);
  const query = mappingCursor(cursor(pensive, "queries"), entityUuid);

  useEffect(() => {
    // Register this hook as a subscriber on mount
    query.swap((current) => ({
      ...current,
      subscribers: current.subscribers + 1,
    }));

    // Deregister this hook as a subscriber upon dismount
    return () =>
      query.swap((current) => ({
        ...current,
        subscribers: current.subscribers - 1,
      }));
  }, [entityUuid]);

  const status = query.value.status;

  // If syncing needs to happen, do it
  useEffect(() => {
    if (status === "waiting") {
      sync(entityUuid);
    }
  }, [status, entityUuid]);

  return useDeepMemo(() => cache.value, cache.value);
};

/**
 * Cache a resource as a blob and return its object URL.
 */
export const useResource = (resourceUuid: string): string | null => {
  const pensive = usePensive();
  const cache = mappingCursor(cursor(pensive, "resources"), resourceUuid);

  useEffect(() => {
    // Register this hook as a subscriber on mount
    cache.swap((current) => ({
      ...current,
      subscribers: current.subscribers + 1,
    }));

    // Deregister this hook as a subscriber upon dismount
    return () =>
      cache.swap((current) => ({
        ...current,
        subscribers: current.subscribers - 1,
      }));
  }, [resourceUuid]);

  const status = cache.value.status;

  // If the resource has not been queried yet, load the resource
  useEffect(() => {
    if (status === "waiting") {
      pensiveReadResource(resourceUuid).then((url) =>
        cache.swap((current) => ({ ...current, url }))
      );
    }
  }, [status, resourceUuid]);

  return cache.value.url;
};

export const useWrite = () => {
  const syncEntity = useSyncEntity();
  const history = cursor(usePensive(), "history");

  return (
    entities: { [uuid: string]: { [key: string]: any } },
    resources?: { [uuid: string]: Blob }
  ) => {
    const write = {
      timestamp: new Date(),
      entities,
      resources: resources ?? {},
    };
    // At this point we could in principle partially apply the results locally,
    // to be corrected later once the full results from the backend return
    pensiveWrite(write).then(() => {
      Object.keys(entities).forEach(syncEntity);
    });
    history.swap((current) => ({
      undo: [...current.undo, write],
      redo: [],
    }));
  };
};

export const useUndo = () => {
  const syncEntity = useSyncEntity();
  const history = cursor(usePensive(), "history");

  return () => {
    const write = last(history.value.undo);
    if (write != null) {
      pensiveUndo(write.timestamp);
      history.swap((current) => ({
        undo: butLast(current.undo),
        redo: [...current.redo, write],
      }));
      Object.keys(write.entities).forEach(syncEntity);
    }
  };
};

/**
 * Remove any empty (undefined) keys from the entity object.
 */
const tidyEntity = (entity: EntityState): EntityState => {
  return Object.fromEntries(
    Object.entries(entity).filter(([, value]) => value != null)
  );
};

export const useSwapEntity = () => {
  const write = useWrite();
  const getEntity = useGetEntity();

  return (
    entityUuid: string,
    update: (entity: EntityState) => EntityState,
    resources?: { [name: string]: File }
  ) =>
    getEntity(entityUuid).then((entity) => {
      return write({ [entityUuid]: update(entity) }, resources);
    });
};
