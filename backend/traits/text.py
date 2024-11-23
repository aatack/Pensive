from aliases import Json
from models.context import Context
from models.timestamp import Timestamp
from models.trait import Trait


class Text(Trait[str, str]):
    def __init__(self, context: Context, name: str):
        super().__init__(context, name, set())

    def _validate(self, value: Json) -> str | None:
        """
        Parse the given JSON value as a snapshot, or raise an error if it is invalid.
        """
        if value is None or isinstance(value, str):
            return value
        else:
            raise ValueError(f"Invalid source value: {value}")

    def _derive(
        self,
        inputs: dict[Trait, dict[Timestamp, Json]],
        updates: dict[Trait, dict[Timestamp, tuple[Json, Json]]],
    ) -> dict[Timestamp, tuple[str | None, str | None]]:
        return {
            item_id: (self.get_item(item_id), self._validate(snapshot))
            for item_id, snapshot in inputs.get(self, {}).items()
        }

    def _serialise(self, snapshots: dict[Timestamp, str]) -> dict[Timestamp, str]:
        return snapshots

    def _deserialise(self, archives: dict[Timestamp, str]) -> dict[Timestamp, str]:
        return archives
