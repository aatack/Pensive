import datetime
from functools import cached_property
from pathlib import Path

from models.chunk import Chunk
from models.timestamp import Timestamp


class Context:
    """Contains information necessary for persisting a pensive."""

    def __init__(self, root: Path, offset: int):
        # Folder in which the pensive is based.  This folder will then contain a
        # `.pensive` subfolder, within which the various pensive files will be stored
        self.root = root

        # Timestamp, in UNIX seconds, at which the pensive was initialised.  Every time
        # another timestamp is given as a pair of integers, that pair represents an
        # offset and increment (for sub-second resolution) relative to this one
        self.offset = offset

    @cached_property
    def pensive_root(self) -> Path:
        """Path of a `.pensive` subfolder within the root directory."""
        return self.root / ".pensive"

    def chunk(self, note: Timestamp) -> Chunk:
        """
        Return the year, month, and day on which the given note occurred.

        The format of the resulting segments will be `YYYY`, `MM`, and `DD`
        respectively.
        """
        value = datetime.datetime.fromtimestamp(note.offset + self.offset)
        return Chunk(value.year, value.month, value.day)

    def _resource_paths(self, note: Timestamp, name: str) -> tuple[Path, Path, Path]:
        """
        Return paths pertaining to a particular resource.

        The first value is the folder containing all resources for that note.  Then the
        blob file and type files are returned.  The first contains the bytes of the
        resource, and the latter the content type as plaintext.
        """
        chunk_segments = str(self.chunk(note)).replace("-", "/")
        folder = self.pensive_root / "chunks" / chunk_segments / "resources" / str(note)
        return folder, folder / f"blob-{name}", folder / f"type-{name}.txt"
