import { Mapping } from "../helpers/mapping";
import { useProvided } from "../providers/use-provided";
import { EntityState } from "./entity/entity";
import { Json } from "../constants";

export type PensiveState = {
  /**
   * A cache of entity data, indexed by entity ID.
   *
   * This will sometimes be optimistically updated by the frontend and then
   * ratified by the data returned from an update.  See the mapping of queries
   * for information on whether each entity has been recently loaded from the
   * server.
   */
  entities: Mapping<string, EntityState>;

  /**
   * Data on the status of queries
   */
  queries: Mapping<string, Request>;

  /**
   * Mapping from snapshots to name to object URLs for loaded resources.
   *
   * Once a resource is loaded, the blob is immediately converted into an object
   * URL and stored in here.  The number of subscribers is also tracked, such
   * that once the count reaches zero the blob can be removed from the document.
   * This is not yet implemented, however; once loaded, resources will hang
   * around indefinitely.
   */
  resources: Mapping<string, Request & { url: string | null }>;

  /**
   * Locally tracks the history of recent edits so they can be undone if needed.
   */
  history: { undo: PensiveWrite[]; redo: PensiveWrite[] };
};

export type PensiveWrite = {
  timestamp: Date;
  entities: { [uuid: string]: { [key: string]: Json } };
  resources: { [uuid: string]: Blob };
};

export type Request = {
  /**
   * Whether or not a request for the most recent entity data is in flight.
   *
   * Because some updates are made eagerly on the frontend, it is possible for
   * the status to be running while there exists data for the entity in the
   * cache already.  Any additional data that gets added in the meantime is at
   * risk of being overridden.
   */
  status: "waiting" | "running" | "error" | "success";

  /**
   * Number of hooks that are currently watching this entity.
   *
   * If this drops to zero, the entity can be removed from the cache.
   */
  subscribers: number;
};

export const usePensive = () => useProvided("pensive");

export const useMetadata = () => useProvided("metadata");
