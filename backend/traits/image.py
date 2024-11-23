from typing import cast
from aliases import Json
from models.context import Context
from models.timestamp import Timestamp
from models.trait import Trait


class Image(Trait[list, list]):
    def __init__(self, context: Context, name: str):
        super().__init__(context, name, set())

    def _validate(self, value: Json) -> list | None:
        """
        Parse the given JSON value as a snapshot, or raise an error if it is invalid.
        """
        if value is None or (
            isinstance(value, list) and all(self._validate_item(item) for item in value)
        ):
            if value is not None and len(
                {(cast(dict, item)["note"], cast(dict, item)["name"]) for item in value}
            ) != len(value):
                raise ValueError("Duplicate images were found in the list of images")

            return None if value is None or len(value) == 0 else value
        else:
            raise ValueError(f"Invalid image value: {value}")

    def _validate_item(self, value: Json) -> dict:
        if (
            isinstance(value, dict)
            and isinstance(value.get("note"), str)
            and isinstance(value.get("name"), str)
        ):
            return value
        else:
            raise ValueError(f"Invalid image item value: {value}")

    def _derive(
        self,
        inputs: dict[Trait, dict[Timestamp, Json]],
        updates: dict[Trait, dict[Timestamp, tuple[Json, Json]]],
    ) -> dict[Timestamp, tuple[list | None, list | None]]:
        return {
            item_id: (self.get_item(item_id), self._validate(snapshot))
            for item_id, snapshot in inputs.get(self, {}).items()
        }

    def _serialise(self, snapshots: dict[Timestamp, dict]) -> dict[Timestamp, dict]:
        return snapshots

    def _deserialise(self, archives: dict[Timestamp, dict]) -> dict[Timestamp, dict]:
        return archives
