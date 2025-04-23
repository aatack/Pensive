from collections.abc import Iterator
from contextlib import contextmanager
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple
from uuid import UUID

from pensive_backend.helpers import Json


class StoreEntity(NamedTuple):
    timestamp: datetime
    uuid: UUID
    key: str
    value: Json


class StoreResource(NamedTuple):
    timestamp: datetime
    uuid: UUID
    data: bytes


class Store:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

        _ = self.old_connection  # Initialise the database

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.path)
        try:
            yield connection
        finally:
            connection.close()

    @property
    def old_connection(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path)

        # Entities
        connection.execute(
            """
            create table if not exists entities (
                timestamp integer not null,
                uuid text not null,
                key text not null,
                value text not null
            );
            """
        )
        connection.execute(
            """
            create index if not exists idx_entities_timestamp
                on entities (timestamp)
            """
        )
        connection.execute(
            """
            create index if not exists idx_entities_uuid
                on entities (uuid)
            """
        )

        # Resources
        connection.execute(
            """
            create table if not exists resources (
                timestamp integer not null,
                uuid text not null,
                data blob not null
            )
            """
        )
        connection.execute(
            """
            create index if not exists idx_resources_timestamp
                on resources (timestamp)
            """
        )
        connection.execute(
            """
            create index if not exists idx_resources_uuid
                on resources (uuid)
            """
        )

        return connection

    def write_entities(self, entities: list[StoreEntity]) -> None:
        if len(entities) == 0:
            return

        with self.connection() as connection:
            connection.executemany(
                "insert into entities (timestamp, uuid, key, value) values (?, ?, ?, ?)",
                [
                    (timestamp_to_int(timestamp), uuid.hex, key, json.dumps(value))
                    for timestamp, uuid, key, value in entities
                ],
            )
            connection.commit()

    def root_entity(self) -> UUID | None:
        with self.connection() as connection:
            result = (
                connection.cursor()
                .execute(
                    """
                    select uuid from entities
                        where key = 'text'
                        order by timestamp asc, uuid asc
                        limit 1
                    """
                )
                .fetchone()
            )
            return None if result is None else UUID(result[0])

    def read_entities(self, uuids: list[UUID]) -> list[StoreEntity]:
        uuids_string = ", ".join(f"'{uuid.hex}'" for uuid in uuids)
        with self.connection() as connection:
            result = (
                connection.cursor()
                .execute(
                    f"""
                    select timestamp, uuid, key, value from entities
                        where uuid in ({uuids_string})
                        order by timestamp asc, uuid asc
                    """
                )
                .fetchall()
            )
            return [
                StoreEntity(
                    int_to_timestamp(timestamp), UUID(uuid), key, json.loads(value)
                )
                for timestamp, uuid, key, value in result
            ]

    def write_resources(self, resources: list[StoreResource]) -> None:
        if len(resources) == 0:
            return

        with self.connection() as connection:
            connection.executemany(
                "insert into resources (timestamp, uuid, data) values (?, ?, ?)",
                [
                    (timestamp_to_int(timestamp), uuid.hex, data)
                    for timestamp, uuid, data in resources
                ],
            )
            connection.commit()

    def read_resources(self, uuids: list[UUID]) -> list[StoreResource]:
        uuids_string = ", ".join(f"'{uuid.hex}'" for uuid in uuids)
        with self.connection() as connection:
            result = (
                connection.cursor()
                .execute(
                    f"""
                    select timestamp, uuid, data from resources
                        where uuid in ({uuids_string})
                        order by timestamp asc, uuid asc
                    """
                )
                .fetchall()
            )
            return [
                StoreResource(int_to_timestamp(timestamp), UUID(uuid), data)
                for timestamp, uuid, data in result
            ]


def timestamp_to_int(timestamp: datetime) -> int:
    assert timestamp.tzinfo is not None
    return int(timestamp.timestamp() * 1000)


def int_to_timestamp(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)
