from collections import defaultdict
import datetime
from functools import cached_property
import json
import os
from pathlib import Path
from typing import Any

from aliases import Json
from models.chunk import Chunk
from models.context import Context
from models.timestamp import Timestamp
from models.trait import Trait, topologically_sort
from traits.flag import Flag
from traits.image import Image
from traits.reference import BackReference, Reference
from traits.text import Text


class Pensive(Context):
    def __init__(self, *, root: Path, offset: int, note: Timestamp = Timestamp(0, 0)):
        super().__init__(root, offset)

        # The most recent note that was written.  The first value is the offset at which
        # the note was written, and the second value is the increment (if multiple notes
        # are written in the same second, this value will increase by one each time,
        # starting from zero)
        self.note = note

        self.has_unsaved_changes = False

    @staticmethod
    def load(folder: str | Path) -> "Pensive":
        root = Path(folder).absolute()
        if (metadata_file := _metadata_file(root)).exists() and metadata_file.is_file():
            metadata = json.loads(metadata_file.read_text())
            offset, note = metadata["offset"], Timestamp.parse(metadata["note"])
        else:
            offset = _current_timestamp()
            note = Timestamp(0, 0)
        return Pensive(root=root, offset=offset, note=note)

    @cached_property
    def traits(self) -> list[Trait]:
        parent = Reference(self, "parent")
        reference = Reference(self, "reference")

        return topologically_sort(
            [
                Text(self, "text"),
                Flag(self, "open"),
                Flag(self, "section"),
                parent,
                BackReference(self, "children", parent),
                reference,
                BackReference(self, "referees", reference),
                Image(self, "image"),
            ]
        )

    @cached_property
    def trait_by_name(self) -> dict[str, Trait]:
        return {trait.name: trait for trait in self.traits}

    def update(
        self,
        note: Timestamp,
        inputs: dict[Trait, dict[Timestamp, Json]],
        resources: dict[str, tuple[str, bytes]],
    ) -> dict[Trait, dict[Timestamp, tuple[Json, Json]]]:
        """
        Update the pensive according to the contents of a new note.

        This function will update the most recent note stored on the metadata, and will
        also throw an error if there has already been a more recent note written.

        The return value indicates, for each trait, each item that has changed, along
        with that item's old and new value for that trait.

        Resources should be given as a mapping from the name of the resource to a tuple
        containing its content type (eg. `image/png`) and contents, as bytes.
        """
        assert (
            note > self.note
        ), f"A note has already been written to {self.note}, so cannot write to {note}"

        self.note = note
        self.has_unsaved_changes = True

        updates: dict[Trait, dict[Timestamp, tuple[Json, Json]]] = {}

        for trait in self.traits:
            updates[trait] = trait.update(note, inputs, updates)

        for name, (content_type, content_bytes) in resources.items():
            self._write_resource(note, name, content_type, content_bytes)

        return updates

    def _write_resource(
        self, note: Timestamp, name: str, content_type: str, content_bytes: bytes
    ):
        assert "/" not in name, "Resource names may not contain path separators"

        folder, blob_file, type_file = self._resource_paths(note, name)

        if not folder.exists():
            os.makedirs(folder)

        blob_file.write_bytes(content_bytes)
        type_file.write_text(content_type)

    def read_resource(self, note: Timestamp, name: str) -> tuple[str, bytes]:
        _, blob_file, type_file = self._resource_paths(note, name)
        return type_file.read_text(), blob_file.read_bytes()

    def save(self) -> bool:
        if not self.has_unsaved_changes:
            return False
        
        metadata_file = _metadata_file(self.root)
        if not metadata_file.parent.exists():
            os.makedirs(metadata_file.parent)
        metadata_file.write_text(
            json.dumps(dict(offset=self.offset, note=str(self.note)))
        )

        for trait in self.traits:
            trait.save()

        self.has_unsaved_changes = False
        return True

    def get_chunk(
        self, chunk: Chunk, note: Timestamp | None = None
    ) -> dict[Timestamp, dict[str, Any]]:
        if note is not None:
            # If querying future timestamps were allowed, traits' caches would also have
            # to be updated for non-`None` notes, which would involve a lot more hassle
            # than simply updating the dynamic cache
            assert (
                note <= self.note
            ), "Cannot request data at a date ahead of the most recent update"

        items = defaultdict(dict)

        for trait in self.traits:
            for item, snapshot in trait.get_chunk(chunk, note=note).items():
                items[item][trait.name] = snapshot

        return dict(items)


def _current_timestamp() -> int:
    return int(datetime.datetime.now(datetime.UTC).timestamp())


def _metadata_file(root: Path) -> Path:
    return root / ".pensive/metadata.json"
