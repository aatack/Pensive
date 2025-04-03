from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import NamedTuple, cast
from uuid import UUID, uuid4

from backend.models.timestamp import Timestamp
from helpers import Json


def int_to_timestamp(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)


def parse_v1_store(
    path: Path | str,
) -> tuple[dict[datetime, dict[UUID, Json]], dict[datetime, dict[UUID, bytes]]]:
    entities: dict[datetime, dict[UUID, Json]] = defaultdict(dict)
    resources: dict[datetime, dict[UUID, Json]] = defaultdict(dict)
    uuids: dict[str, UUID] = defaultdict(uuid4)

    offset: int = cast(dict, (Path(path) / "metadata.json").read_text())["offset"]

    def get_timestamp(timestamp_string: str) -> datetime:
        timestamp = Timestamp.parse(timestamp_string)
        return int_to_timestamp(
            (offset + timestamp.offset) * 1000 + timestamp.increment
        )

    for file in (Path(path) / "chunks").glob("**/*.json"):
        # Iterate over entity data
        is_parent = file.name.startswith("parent")
        is_children = file.name.startswith("children")

        if is_parent:
            raise NotImplementedError()

        if is_children:
            raise NotImplementedError()

        else:
            for entity, update_values in json.loads(file.read_text()).items():
                for update, value in update_values.items():
                    entities[get_timestamp(update)][uuids[entity]] = value

    for file in (Path(path) / "chunks").glob("**/resources/*/"):
        # Iterate over resource folders
        raise NotImplementedError()

    return {}, {}
