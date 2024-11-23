from typing import Callable, Iterable, TypeVar


T = TypeVar("T")


def first_where(predicate: Callable[[T], bool], items: Iterable[T], default: T) -> T:
    for item in items:
        if predicate(item):
            return item
    return default
