from collections import defaultdict
from collections.abc import Callable, Iterator
from datetime import datetime
from uuid import UUID

from helpers import Json
from reducers import replace
from store import Store, StoreEntity, StoreResource


class Client:
    def __init__(
        self,
        reducers: dict[str, Callable[[Json, Json], Json]],
        root_store: Store,
        additional_stores: list[Store],
    ) -> None:
        self.reducers = reducers
        self.root_store = root_store
        self.additional_stores = additional_stores

    @property
    def stores(self) -> Iterator[Store]:
        yield self.root_store
        yield from self.additional_stores

    def root_entity(self) -> UUID | None:
        return self.root_store.root_entity()

    def read_entities(self, uuids: list[UUID]) -> dict[UUID, dict[str, Json]]:
        entities: dict[UUID, dict[str, Json]] = defaultdict(
            lambda: defaultdict(lambda: None)
        )

        for _, uuid, key, value in sorted(
            (entity for store in self.stores for entity in store.read_entities(uuids)),
            key=lambda entity: entity.timestamp,
        ):
            entities[uuid][key] = self.reducers.get(key, replace)(
                entities[uuid][key], value
            )

        return entities

    def read_resources(self, uuids: list[UUID]) -> dict[UUID, bytes]:
        return {
            resource.uuid: resource.data
            for store in self.stores
            for resource in store.read_resources(uuids)
        }

    def write(
        self,
        timestamp: datetime,
        entities: dict[UUID, dict[str, Json]],
        resources: dict[UUID, bytes],
    ) -> None:
        assert timestamp.tzinfo is not None, "Cannot write naive timestamps to entities"

        self.root_store.write_entities(
            [
                StoreEntity(timestamp, uuid, key, value)
                for uuid, key_values in entities.items()
                for key, value in key_values.items()
            ]
        )

        self.root_store.write_resources(
            [StoreResource(timestamp, uuid, data) for uuid, data in resources.items()]
        )
