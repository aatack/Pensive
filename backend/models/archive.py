from collections import defaultdict
from typing import Any, TypeVar, cast
from aliases import Json, TArchive
from helpers import first_where
from models.timestamp import Timestamp


T = TypeVar("T")


def default_archive() -> dict[Timestamp, list]:
    return defaultdict(list)


def serialise_archive(
    archives: dict[Timestamp, list[tuple[Timestamp, TArchive]]]
) -> Json:
    return {
        str(item): {str(note): archive for note, archive in item_archives}
        for item, item_archives in archives.items()
    }


def deserialise_archive(archives: Json) -> dict[Timestamp, list]:
    return defaultdict(
        list,
        {
            Timestamp.parse(item): [
                (Timestamp.parse(note), item_archives[note])
                for note in sorted(
                    item_archives.keys(), key=lambda key: Timestamp.parse(key)
                )
            ]
            for item, item_archives in cast(dict[str, dict[str, Any]], archives).items()
        },
    )


def index_archive(
    archive: dict[Timestamp, list[tuple[Timestamp, TArchive | None]]],
    note: Timestamp | None,
) -> dict[Timestamp, TArchive]:
    """
    Take the value of each item in a mapping of archives at a particular note.

    If the note is not passed, the most recent value is returned.  If a note is passed
    which falls before the note at which an item was first modified, that item will be
    excluded altogether.  Items which have been modified but which had no value at the
    time of the given note will also be excluded.
    """
    # Assumes the archives within each note are sorted.  This could be done more
    # efficiently, but the current implementation is sufficient for now
    if note is None:
        return {
            item: value
            for item, item_archives in archive.items()
            if (value := item_archives[-1][1] if len(item_archives) > 0 else None)
            is not None
        }
    else:
        return {
            item: value
            for item, item_archives in archive.items()
            if (
                value := first_where(
                    lambda item_archive: item_archive[0] <= cast(Timestamp, note),
                    item_archives[::-1],
                    (Timestamp(0, 0), None),
                )[1]
            )
            is not None
        }
