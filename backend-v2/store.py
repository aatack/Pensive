from functools import cached_property
from pathlib import Path
import sqlite3


class Store:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    @cached_property
    def cursor(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        return sqlite3.connect(self.path)
