from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import NamedTuple, cast
from uuid import UUID, uuid4

from helpers import Json


def int_to_timestamp(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)


def parse_v1_store(
    path: Path | str,
) -> tuple[dict[datetime, dict[UUID, Json]], dict[datetime, dict[UUID, bytes]]]:
    entities: dict[datetime, dict[tuple[UUID, str], Json]] = defaultdict(dict)
    resources: dict[datetime, dict[UUID, bytes]] = defaultdict(dict)

    entity_uuids: dict[str, UUID] = defaultdict(lambda: uuid4().hex)
    resource_uuids: dict[str, UUID] = defaultdict(lambda: uuid4().hex)

    offset: int = cast(dict, json.loads((Path(path) / "metadata.json").read_text()))[
        "offset"
    ]

    def get_timestamp(timestamp_string: str) -> datetime:
        timestamp = Timestamp.parse(timestamp_string)
        return int_to_timestamp(
            (offset + timestamp.offset) * 1000 + timestamp.increment
        )

    for folder in (Path(path) / "chunks").glob("**/*.json"):
        key = folder.name.removesuffix(".json")

        # Iterate over entity data
        is_parent = key == "parent"
        is_children = key == "children"

        for entity, update_values in json.loads(folder.read_text()).items():
            if is_parent:
                pass

            if is_children:
                pass

            else:
                for update, value in update_values.items():
                    entities[get_timestamp(update)][entity_uuids[entity], key] = value

    for folder in (Path(path) / "chunks").glob("**/resources/*/"):
        # Iterate over resource folders
        (file,) = folder.glob("*.png")
        resources[get_timestamp(folder.name)][
            resource_uuids[folder.name]
        ] = file.read_bytes()

    return entities, resources


class Timestamp(NamedTuple):
    offset: int  # Seconds since UNIX epoch
    increment: int  # Counter for distinguishing between timestamps in the same second

    @staticmethod
    def parse(string: str) -> "Timestamp":
        offset, *increment = (int(segment) for segment in string.split("-"))
        return Timestamp(offset, increment[0] if len(increment) > 0 else 0)
