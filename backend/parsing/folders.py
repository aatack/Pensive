from collections import defaultdict
from datetime import datetime
from functools import cached_property
from genericpath import getmtime
from pathlib import Path

from tqdm import tqdm

from models.pensive import Pensive
from models.timestamp import Timestamp
from parsing.file import ParsedEntity, parse_file


def build_parsed_entity_by_file(root: Path) -> dict[Path, ParsedEntity]:
    return {file: parse_file(file, root) for file in tqdm(list(root.glob("**/*.md")))}


def build_files_by_day(
    parsed_entity_by_file: dict[Path, ParsedEntity]
) -> list[tuple[str, list[Path]]]:
    files_by_day = defaultdict(list)

    for file in parsed_entity_by_file.keys():
        files_by_day[_file_date(file)].append(file)

    return [
        (day, sorted(files, key=str)) for day, files in sorted(files_by_day.items())
    ]


def _file_date(file: Path) -> str:
    if "daily-notes" in [parent.name for parent in file.parents]:
        return file.name.split(".")[0]
    else:
        return datetime.fromtimestamp(getmtime(str(file))).isoformat().split("T")[0]


class PensiveIngest:
    def __init__(self, source: Path, destination: Path):
        self.source = source
        self.destination = destination

        self.folder_cache: dict[Path, Timestamp] = {}

    @cached_property
    def files_by_day(self) -> list[tuple[str, list[Path]]]:
        return build_files_by_day(self.parsed_entity_by_file)

    @cached_property
    def parsed_entity_by_file(self) -> dict[Path, ParsedEntity]:
        return build_parsed_entity_by_file(self.source)

    @cached_property
    def pensive(self) -> Pensive:
        return Pensive(
            root=self.destination,
            offset=self.offset(self.files_by_day[0][0]),
            note=Timestamp(0, 0),
        )

    def offset(self, day: str) -> int:
        year, month, day = day.split("-")
        return int(datetime(int(year), int(month), int(day)).timestamp())

    def folder_entity_id(self, path: Path) -> Timestamp:
        assert path.is_dir()

        if path == self.source:
            return Timestamp(0, 0)

        if path not in self.folder_cache:
            parent_id = self.folder_entity_id(path.parent)
            entity_id = self.pensive.note.next()
            self.pensive.update(
                entity_id,
                inputs={
                    self.pensive.trait_by_name["parent"]: {entity_id: str(parent_id)},
                    self.pensive.trait_by_name["text"]: {entity_id: path.name},
                    self.pensive.trait_by_name["section"]: {entity_id: True},
                },
                resources={},
            )
            self.folder_cache[path] = entity_id
        return self.folder_cache[path]

    def ingest(self):
        for day, files in self.files_by_day:
            self.pensive.note = Timestamp(self.offset(day) - self.pensive.offset, 0)
            for file in files:
                parent_id = self.folder_entity_id(file.parent)
                print(self.pensive.chunk(self.pensive.note), file)
                parsed_entity = self.parsed_entity_by_file[file]

                self.ingest_parsed_entity(parsed_entity, parent_id)

    def ingest_parsed_entity(
        self, parsed_entity: ParsedEntity, parent_id: Timestamp
    ) -> Timestamp:
        entity_id = self.pensive.note.next()

        images = [
            (f"image-{index}", image.read_bytes())
            for index, image in enumerate(parsed_entity.images, start=1)
        ]

        self.pensive.update(
            entity_id,
            inputs={
                self.pensive.trait_by_name["parent"]: {entity_id: str(parent_id)},
                self.pensive.trait_by_name["text"]: {
                    entity_id: "\n".join(parsed_entity.lines)
                },
                self.pensive.trait_by_name["section"]: (
                    {entity_id: True} if parsed_entity.section else {}
                ),
                self.pensive.trait_by_name["open"]: (
                    {entity_id: parsed_entity.open}
                    if parsed_entity.open is not None
                    else {}
                ),
                self.pensive.trait_by_name["image"]: (
                    {
                        entity_id: [
                            dict(note=str(entity_id), name=name) for name, _ in images
                        ]
                    }
                    if len(images) > 0
                    else {}
                ),
            },
            resources={name: ("image/png", content) for name, content in images},
        )

        for child in parsed_entity.children:
            self.ingest_parsed_entity(child, entity_id)

        return entity_id
