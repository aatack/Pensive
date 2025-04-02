from datetime import datetime, timezone
from functools import cached_property
import json
from pathlib import Path
import sqlite3
from typing import NamedTuple
from uuid import UUID

from helpers import Json


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

    @cached_property
    def connection(self) -> sqlite3.Connection:
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
        self.connection.executemany(
            "insert into entities (timestamp, uuid, key, value) values (?, ?, ?, ?)",
            [
                (int(timestamp.timestamp()), str(uuid), key, json.dumps(value))
                for timestamp, uuid, key, value in entities
            ],
        )
        self.connection.commit()

    def root_entity(self) -> UUID | None:
        result = (
            self.connection.cursor()
            .execute(
                "select uuid from entities order by timestamp asc, uuid asc limit 1"
            )
            .fetchone()
        )
        return None if result is None else UUID(result[0])

    def read_entities(self, uuids: list[UUID]) -> list[StoreEntity]:
        uuids_string = ", ".join(f"'{uuid}'" for uuid in uuids)
        result = (
            self.connection.cursor()
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
                datetime.fromtimestamp(timestamp, tz=timezone.utc),
                UUID(uuid),
                key,
                json.loads(value),
            )
            for timestamp, uuid, key, value in result
        ]

    def write_resource(self, resources: list[StoreResource]) -> None:
        self.connection.executemany(
            "insert into resources (timestamp, uuid, data) values (?, ?, ?)",
            [
                (int(timestamp.timestamp()), str(uuid), data)
                for timestamp, uuid, data in resources
            ],
        )
        self.connection.commit()

    def read_resources(self, uuids: list[UUID]) -> list[StoreResource]:
        uuids_string = ", ".join(f"'{uuid}'" for uuid in uuids)
        result = (
            self.connection.cursor()
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
            StoreResource(
                datetime.fromtimestamp(timestamp, tz=timezone.utc), UUID(uuid), data
            )
            for timestamp, uuid, data in result
        ]
