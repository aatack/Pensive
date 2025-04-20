from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import cast
from uuid import UUID, uuid4
from store import Store, StoreEntity, StoreResource
from tqdm import tqdm
from helpers import Json


def _int_to_timestamp(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)


def _parse_v1_timestamp(string: str) -> tuple[int, int]:
    offset, *increment = (int(segment) for segment in string.split("-"))
    return (offset, increment[0] if len(increment) > 0 else 0)


def parse_v1_store(
    path: Path | str,
) -> tuple[dict[tuple[datetime, UUID, str], Json], dict[tuple[datetime, UUID], bytes]]:
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
                if key == "image" and value is not None:
                    value = [
                        {"note": resource_uuids[item["note"]], "name": item["name"]}
                        for item in value
                    ]
                if key == "parent" and value is not None:
                    value = entity_uuids[cast(str, value)]
                if key == "children" and value is not None:
                    value = [entity_uuids[uuid] for uuid in cast(list[str], value)]

                entities[get_timestamp(update), entity_uuids[entity], key] = cast(
                    Json, value
                )

    for folder in (Path(path) / "chunks").glob("**/resources/*/"):
        # Iterate over resource folders
        (file,) = folder.glob("*.png")
        resources[get_timestamp(folder.name), resource_uuids[folder.name]] = (
            file.read_bytes()
        )

    return entities, resources


def ingest_v1_store(v1_path: Path | str, v2_path: Path | str) -> Store:
    entities, resources = parse_v1_store(v1_path)

    store = Store(v2_path)

    images: dict[UUID, set[UUID]] = defaultdict(set)
    outbound: dict[UUID, set[UUID]] = defaultdict(set)  # Children
    inbound: dict[UUID, set[UUID]] = defaultdict(set)  # Parents

    entity_writes: list[StoreEntity] = []
    resource_writes: list[StoreResource] = []

    for timestamp, entity, key in tqdm(
        list(sorted(entities.keys())), desc="Ingesting entities"
    ):
        value = entities[timestamp, entity, key]

        if key == "image":
            # In v2, each image is stored on a separate entity instead of all of them
            # being part of the main entity.  The `image` key then becomes a boolean
            # flag denoting whether or not that entity should have its resource rendered
            # as an image

            value = (
                set()
                if value is None
                else set(item["note"] for item in cast(list[dict], value))
            )

            add_images: set[UUID] = value - images[entity]
            remove_images: set[UUID] = images[entity] - value

            for image in add_images:
                entity_writes.extend(
                    [
                        StoreEntity(timestamp, entity, "outbound", f"+{image.hex}"),
                        StoreEntity(timestamp, image, "inbound", f"+{entity.hex}"),
                        StoreEntity(timestamp, image, "image", True),
                    ]
                )

            for image in remove_images:
                entity_writes.extend(
                    [
                        StoreEntity(timestamp, entity, "outbound", f"-{image.hex}"),
                        StoreEntity(timestamp, image, "inbound", f"-{entity.hex}"),
                    ]
                )

            images[entity] = value

        elif key == "children":
            children: set[UUID] = (
                set() if value is None else set(cast(list[UUID], value))
            )

            add_outbound = children - outbound[entity]
            remove_outbound = outbound[entity] - children

            entity_writes.extend(
                [
                    StoreEntity(timestamp, entity, "outbound", f"+{uuid.hex}")
                    for uuid in add_outbound
                ]
                + [
                    StoreEntity(timestamp, entity, "outbound", f"-{uuid.hex}")
                    for uuid in remove_outbound
                ]
            )
            outbound[entity] = children

        elif key == "parent":
            parent: set[UUID] = set() if value is None else {cast(UUID, value)}

            add_inbound = parent - inbound[entity]
            remove_inbound = inbound[entity] - parent

            entity_writes.extend(
                [
                    StoreEntity(timestamp, entity, "inbound", f"+{uuid.hex}")
                    for uuid in add_inbound
                ]
                + [
                    StoreEntity(timestamp, entity, "inbound", f"-{uuid.hex}")
                    for uuid in remove_inbound
                ]
            )
            inbound[entity] = parent

        else:
            store.write_entities([StoreEntity(timestamp, entity, key, value)])

    for (timestamp, resource), data in tqdm(
        list(resources.items()), desc="Ingesting resources"
    ):
        resource_writes.extend([StoreResource(timestamp, resource, data)])

    store.write_entities(entity_writes)
    store.write_resources(resource_writes)

    return store
