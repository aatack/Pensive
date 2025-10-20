import {
  deserialiseTimestamp,
  serialiseTimestamp,
  Store,
} from "@pensive/common/src";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export const createStore = (storePath: string): Store => {
  const resolvedPath = path.resolve(storePath);
  const parentFolder = path.dirname(resolvedPath);
  fs.mkdirSync(parentFolder, { recursive: true });

  const database = new Database(resolvedPath);
  initialiseDatabase(database);

  return {
    writeEntities: (entities) => {
      const statement = database.prepare(
        "insert into entities (timestamp, uuid, key, value) values (?, ?, ?, ?)"
      );
      const insert = database.transaction(() => {
        entities.forEach(({ timestamp, uuid, key, value }) => {
          statement.run(
            serialiseTimestamp(timestamp),
            uuid,
            key,
            JSON.stringify(value)
          );
        });
      });
      insert();
    },

    rootEntity: () => {
      const row: any = database
        .prepare(
          `select uuid from entities
           where key = 'text'
           order by timestamp asc, uuid asc
           limit 1`
        )
        .get();
      return row ? row.uuid : null;
    },

    readEntities: (uuids) => {
      const placeholders = uuids.map(() => "?").join(",");
      const rows = database
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

    writeResources: (resources) => {
      const statement = database.prepare(
        "insert into resources (timestamp, uuid, data) values (?, ?, ?)"
      );
      const insert = database.transaction(() => {
        resources.forEach(({ timestamp, uuid, data }) => {
          statement.run(serialiseTimestamp(timestamp), uuid, data);
        });
      });
      insert();
    },

    readResources: (uuids) => {
      const placeholders = uuids.map(() => "?").join(",");
      const rows = database
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

    removeTimestamp: (timestamp) => {
      database
        .prepare(
          `delete from entities where timestamp = ${serialiseTimestamp(
            timestamp
          )}`
        )
        .all();
      database
        .prepare(
          `delete from resources where timestamp = ${serialiseTimestamp(
            timestamp
          )}`
        )
        .all();
    },
  };
};

const initialiseDatabase = (db: Database.Database) => {
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
};
