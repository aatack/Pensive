from typing import Sequence, TypeVar

Json = int | float | bool | None | str | Sequence["Json"] | dict[str, "Json"]

TArchive = TypeVar("TArchive", bound=Json)
TSnapshot = TypeVar("TSnapshot", bound=Json)

# Archive = dict[Timestamp, list[tuple[Timestamp, TArchive]]]
# Snapshot = dict[Timestamp, TSnapshot]
