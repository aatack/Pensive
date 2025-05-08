import {
  deserialiseTimestamp,
  serialiseTimestamp,
  StoreEntity,
} from "@pensive/common/src";
import equal from "fast-deep-equal";
import Database from "better-sqlite3";

export const migrateStoreEntities = (
  storePath: string,
  transform: (entity: StoreEntity) => StoreEntity | null,
  options?: { apply: boolean }
): void => {
  const db = new Database(storePath);

  const selectAll = db.prepare(`
      select timestamp, uuid, key, value from entities
    `);

  const deleteStatement = db.prepare(`
      delete from entities where timestamp = ? and uuid = ? and key = ?
    `);

  const updateStatement = db.prepare(`
      update entities
      set timestamp = ?, uuid = ?, key = ?, value = ?
      where timestamp = ? and uuid = ? and key = ?
    `);

  const rows = selectAll.all();

  const migrate = db.transaction(() => {
    rows.forEach((row: any) => {
      const original: StoreEntity = {
        timestamp: deserialiseTimestamp(row.timestamp),
        uuid: row.uuid,
        key: row.key,
        value: JSON.parse(row.value),
      };

      const result = transform(original);

      if (result === null) {
        console.info("Deleting", original);

        if (options?.apply) {
          deleteStatement.run(row.timestamp, row.uuid, row.key);
        }
      } else if (!equal(original, result)) {
        console.info("Updating", original, "-->", result);

        if (options?.apply) {
          updateStatement.run(
            serialiseTimestamp(result.timestamp),
            result.uuid,
            result.key,
            JSON.stringify(result.value),
            row.timestamp,
            row.uuid,
            row.key
          );
        }
      }
    });
  });

  migrate();
};

export const migrateUuids = (
  storePath: string,
  options?: { apply: boolean }
) => {
  const stripDashes = (uuid: string) => {
    const first = uuid[0];
    const rest = uuid.slice(1);

    return (
      first +
      rest
        .toString()
        .split("")
        .filter((character) => character !== "-")
        .join("")
    );
  };

  migrateStoreEntities(
    storePath,
    (entity) => {
      if (entity.key === "inbound" || entity.key === "outbound") {
        const value: string[] =
          typeof entity.value === "string"
            ? [entity.value]
            : entity.value == null
            ? []
            : (entity.value as string[]);
        const remapped = value.map(stripDashes);

        return {
          ...entity,
          value:
            remapped.length === 0
              ? null
              : remapped.length === 1
              ? remapped[0]!
              : remapped,
        };
      } else {
        return entity;
      }
    },
    options
  );
};
