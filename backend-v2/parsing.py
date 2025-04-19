from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import cast
from uuid import UUID, uuid4

from helpers import Json


def _int_to_timestamp(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)


def _parse_v1_timestamp(string: str) -> tuple[int, int]:
    offset, *increment = (int(segment) for segment in string.split("-"))
    return (offset, increment[0] if len(increment) > 0 else 0)


def parse_v1_store(
    path: Path | str,
) -> tuple[dict[datetime, dict[UUID, Json]], dict[datetime, dict[UUID, bytes]]]:
    entities: dict[tuple[datetime, UUID, str], Json] = {}
    resources: dict[tuple[datetime, UUID], bytes] = {}

    entity_uuids: dict[str, UUID] = defaultdict(uuid4)
    resource_uuids: dict[str, UUID] = defaultdict(uuid4)

    root_offset: int = cast(
        dict, json.loads((Path(path) / "metadata.json").read_text())
    )["offset"]

    def get_timestamp(timestamp_string: str) -> datetime:
        offset, increment = _parse_v1_timestamp(timestamp_string)
        return _int_to_timestamp((root_offset + offset) * 1000 + increment)

    for folder in (Path(path) / "chunks").glob("**/*.json"):
        key = folder.name.removesuffix(".json")
        for entity, update_values in json.loads(folder.read_text()).items():
            for update, value in update_values.items():
                if key == "parent" and value is not None:
                    value = entity_uuids[value]
                if key == "children" and value is not None:
                    value = [entity_uuids[uuid] for uuid in value]

                entities[get_timestamp(update), entity_uuids[entity], key] = value

    for folder in (Path(path) / "chunks").glob("**/resources/*/"):
        # Iterate over resource folders
        (file,) = folder.glob("*.png")
        resources[get_timestamp(folder.name), resource_uuids[folder.name]] = (
            file.read_bytes()
        )

    return entities, resources
