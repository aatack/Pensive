from functools import cached_property
from typing import Generic
from aliases import (
    Json,
    TArchive,
    TSnapshot,
)
from models.archive import (
    default_archive,
    deserialise_archive,
    index_archive,
    serialise_archive,
)
from models.chunk import Chunk
from models.context import Context
from models.store import PersistentStore, Store
from models.timestamp import Timestamp


class Trait(Generic[TArchive, TSnapshot]):
    def __init__(
        self, context: Context, name: str, dependencies: set["Trait"] | None = None
    ):
        self.context = context
        self.name = name
        self.dependencies: set[Trait] = set() if dependencies is None else dependencies

    def update(
        self,
        note: Timestamp,
        inputs: dict["Trait", dict[Timestamp, Json]],
        updates: dict["Trait", dict[Timestamp, tuple[Json, Json]]],
    ) -> dict[Timestamp, tuple[Json, Json]]:
        """Update the internal persisted state according to changes in other traits."""
        updated_items = self._derive(inputs, updates)

        # Update the cache of archives
        for item, archive in self._serialise(
            {i: n for i, (_, n) in updated_items.items()}
        ).items():
            self._archive_store[*self.context.chunk(item).segments, self.name][
                item
            ].append((note, archive))

        # Update the cache of snapshots
        for item, (_, snapshot) in updated_items.items():
            cache = self._snapshot_store[self.context.chunk(item), None]
            if snapshot is None:
                _ = cache.pop(item, None)  # Clear that item entirely
            else:
                cache[item] = snapshot

        return updated_items

    def _derive(
        self,
        inputs: dict["Trait", dict[Timestamp, Json]],
        updates: dict["Trait", dict[Timestamp, tuple[Json, Json]]],
    ) -> dict[Timestamp, tuple[TSnapshot | None, TSnapshot | None]]:
        raise NotImplementedError()

    def _serialise(
        self, snapshots: dict[Timestamp, TSnapshot | None]
    ) -> dict[Timestamp, TArchive | None]:
        raise NotImplementedError()

    def _deserialise(
        self, archives: dict[Timestamp, TArchive]
    ) -> dict[Timestamp, TSnapshot]:
        raise NotImplementedError()

    @cached_property
    def _archive_store(
        self,
    ) -> PersistentStore[dict[Timestamp, list[tuple[Timestamp, TArchive | None]]]]:
        return PersistentStore[
            dict[Timestamp, list[tuple[Timestamp, TArchive | None]]]
        ](
            self.context.pensive_root / "chunks",
            default_archive,
            serialise_archive,
            deserialise_archive,
        )

    @cached_property
    def _snapshot_store(
        self,
    ) -> Store[tuple[Chunk, Timestamp | None], dict[Timestamp, TSnapshot]]:
        return Store(self._on_load_snapshot)

    def _on_load_snapshot(
        self, key: tuple[Chunk, Timestamp | None]
    ) -> dict[Timestamp, TSnapshot]:
        chunk, note = key

        return self._deserialise(
            index_archive(
                self._archive_store[*chunk.segments, self.name],
                note,
            )
        )

    def save(self):
        self._archive_store.save()

    def get_chunk(
        self, chunk: Chunk, note: Timestamp | None = None
    ) -> dict[Timestamp, TSnapshot]:
        return self._snapshot_store[chunk, note]

    def get_items(
        self, items: set[Timestamp], note: Timestamp | None = None
    ) -> dict[Timestamp, TSnapshot | None]:
        # This could be sped up slightly by sorting the items first to make better use
        # of the chunk-level cache
        return {
            item: self.get_chunk(self.context.chunk(item), note=note).get(item)
            for item in items
        }

    def get_item(
        self, item: Timestamp, note: Timestamp | None = None
    ) -> TSnapshot | None:
        return self.get_items({item}, note=note)[item]


def topologically_sort(traits: list[Trait]) -> list[Trait]:
    """Order traits such that all traits appear after their dependencies."""
    order = []
    remaining = list(traits)

    while len(remaining) > 0:
        available = [
            trait
            for trait in remaining
            if all((dependency in order for dependency in trait.dependencies))
        ]

        if len(available) == 0:
            raise ValueError("Could not produce consistent trait ordering")

        order += list(sorted(available, key=lambda trait: trait.name))
        remaining = [trait for trait in remaining if trait not in order]

    return order
