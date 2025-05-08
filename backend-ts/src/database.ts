import {
  deserialiseTimestamp,
  serialiseTimestamp,
  Store,
  StoreEntity,
  StoreResource,
  Uuid,
} from "@pensive/common/src";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export function createStore(dbPath: string): Store {
  const resolvedPath = path.resolve(dbPath);
  const parentDir = path.dirname(resolvedPath);
  fs.mkdirSync(parentDir, { recursive: true });

  const db = new Database(resolvedPath);
  initializeSchema(db);

  return {
    writeEntities(entities: StoreEntity[]) {
      if (entities.length === 0) return;

      const stmt = db.prepare(
        "insert into entities (timestamp, uuid, key, value) values (?, ?, ?, ?)"
      );
      const insert = db.transaction(() => {
        for (const { timestamp, uuid, key, value } of entities) {
          stmt.run(
            serialiseTimestamp(timestamp),
            uuid,
            key,
            JSON.stringify(value)
          );
        }
      });
      insert();
    },

    rootEntity(): Uuid | null {
      const row: any = db
        .prepare(
          `select uuid from entities
           where key = 'text'
           order by timestamp asc, uuid asc
           limit 1`
        )
        .get();
      return row ? row.uuid : null;
    },

    readEntities(uuids: Uuid[]): StoreEntity[] {
      if (uuids.length === 0) return [];
      const placeholders = uuids.map(() => "?").join(",");
      const rows = db
        .prepare(
          `select timestamp, uuid, key, value from entities
           where uuid in (${placeholders})
           order by timestamp asc, uuid asc`
        )
        .all(...uuids);

      return rows.map((row: any) => ({
        timestamp: deserialiseTimestamp(row.timestamp),
        uuid: row.uuid,
        key: row.key,
        value: JSON.parse(row.value),
      }));
    },

    writeResources(resources: StoreResource[]) {
      if (resources.length === 0) return;

      const stmt = db.prepare(
        "insert into resources (timestamp, uuid, data) values (?, ?, ?)"
      );
      const insert = db.transaction(() => {
        for (const { timestamp, uuid, data } of resources) {
          stmt.run(serialiseTimestamp(timestamp), uuid, data);
        }
      });
      insert();
    },

    readResources(uuids: Uuid[]): StoreResource[] {
      if (uuids.length === 0) return [];
      const placeholders = uuids.map(() => "?").join(",");
      const rows = db
        .prepare(
          `select timestamp, uuid, data from resources
           where uuid in (${placeholders})
           order by timestamp asc, uuid asc`
        )
        .all(...uuids);

      return rows.map((row: any) => ({
        timestamp: deserialiseTimestamp(row.timestamp),
        uuid: row.uuid,
        data: row.data,
      }));
    },
  };
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    create table if not exists entities (
      timestamp integer not null,
      uuid text not null,
      key text not null,
      value text not null
    );

    create index if not exists idx_entities_timestamp on entities (timestamp);
    create index if not exists idx_entities_uuid on entities (uuid);

    create table if not exists resources (
      timestamp integer not null,
      uuid text not null,
      data blob not null
    );

    create index if not exists idx_resources_timestamp on resources (timestamp);
    create index if not exists idx_resources_uuid on resources (uuid);
  `);
}
