from collections.abc import Callable, Iterator

from helpers import Json
from store import Store


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
