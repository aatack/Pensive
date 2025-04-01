from functools import cached_property
from pathlib import Path
import sqlite3


class Store:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    @cached_property
    def cursor(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        cursor = sqlite3.connect(self.path)

        cursor.execute(
            """
            create table if not exists entities (
                timestamp integer not null,
                entity text not null,
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
            create index if not exists idx_entities_entity
                on entities (entity)
            """
        )

        return cursor
