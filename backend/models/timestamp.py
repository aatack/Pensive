from typing import NamedTuple


class Timestamp(NamedTuple):
    offset: int  # Seconds since UNIX epoch
    increment: int  # Counter for distinguishing between timestamps in the same second

    @staticmethod
    def parse(string: str) -> "Timestamp":
        offset, *increment = (int(segment) for segment in string.split("-"))
        return Timestamp(offset, increment[0] if len(increment) > 0 else 0)

    def __str__(self) -> str:
        return str(self.offset) + ("" if self.increment == 0 else f"-{self.increment}")

    def __hash__(self) -> int:
        return hash((self.offset, self.increment))

    def __lt__(self, other: "Timestamp") -> bool:
        return (self.offset, self.increment) < (other.offset, other.increment)

    def __gt__(self, other: "Timestamp") -> bool:
        return (self.offset, self.increment) > (other.offset, other.increment)

    def __le__(self, other: "Timestamp") -> bool:
        return (self.offset, self.increment) <= (other.offset, other.increment)

    def __ge__(self, other: "Timestamp") -> bool:
        return (self.offset, self.increment) >= (other.offset, other.increment)

    def next(self) -> "Timestamp":
        return Timestamp(self.offset + 1, 0)
