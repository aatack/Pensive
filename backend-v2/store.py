from datetime import datetime
from functools import cached_property
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
    def cursor(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        cursor = sqlite3.connect(self.path)

        # Entities
        cursor.execute(
            """
            create table if not exists entities (
                timestamp integer not null,
                uuid text not null,
                key text not null,
                value text not null
            );
            """
        )
        cursor.execute(
            """
            create index if not exists idx_entities_timestamp
                on entities (timestamp)
            """
        )
        cursor.execute(
            """
            create index if not exists idx_entities_uuid
                on entities (uuid)
            """
        )

        # Resources
        cursor.execute(
            """
            create table if not exists resources (
                timestamp text not null,
                uuid text not null,
                data blob not null
            )
            """
        )
        cursor.execute(
            """
            create index if not exists idx_resources_timestamp
                on resources (timestamp)
            """
        )
        cursor.execute(
            """
            create index if not exists idx_resources_uuid
                on resources (uuid)
            """
        )

        return cursor
