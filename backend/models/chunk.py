from typing import NamedTuple


class Chunk(NamedTuple):
    year: int
    month: int
    day: int

    @staticmethod
    def parse(string: str) -> "Chunk":
        year, month, day = (int(segment) for segment in string.split("-"))
        return Chunk(year, month, day)

    @property
    def segments(self) -> tuple[str, str, str]:
        return f"{self.year:04}", f"{self.month:02}", f"{self.day:02}"

    def __str__(self) -> str:
        return "-".join(self.segments)

    def __hash__(self) -> int:
        return hash((self.year, self.month, self.day))
