from collections import OrderedDict
import json
import os
from pathlib import Path
from typing import Callable, Generic, TypeVar

from aliases import Json

K = TypeVar("K")
V = TypeVar("V")


class Store(Generic[K, V]):
    def __init__(
        self,
        on_load: Callable[[K], V],
        on_evict: Callable[[K, V], None] = lambda _, __: None,
        maximum_cache_size: int = 10,
    ):
        """
        Cached key-value store with hooks for the loading and evicting of items.
        """
        self._on_load = on_load
        self._on_evict = on_evict

        self._maximum_cache_size = maximum_cache_size
        self._cache: OrderedDict[K, V] = OrderedDict()

    @property
    def _least_recently_used(self) -> K | None:
        """Return the key of the least recently used value in the cache."""
        return None if len(self._cache) == 0 else next(iter(self._cache.keys()))

    def _limit_cache_size(self, size: int | None = None):
        """
        Reduce the size of the cache until it is at least as small as the given size.

        If a size is not provided, the object's size is used.
        """
        size = self._maximum_cache_size if size is None else size
        while (
            len(self._cache) > size
            and (least_recently_used := self._least_recently_used) is not None
        ):
            self._on_evict(least_recently_used, self._cache[least_recently_used])
            self._cache.pop(least_recently_used, None)

    def __getitem__(self, key: K) -> V:
        if key not in self._cache:
            self._cache[key] = self._on_load(key)
        self._limit_cache_size()
        return self._cache[key]

    def __setitem__(self, key: K, value: V):
        self._cache[key] = value
        self._limit_cache_size()

    def save(self):
        self._limit_cache_size(0)


class PersistentStore(Store[tuple[str, ...] | str, V]):
    def __init__(
        self,
        root: str | Path,
        default: Callable[[], V],
        serialise: Callable[[V], Json],
        deserialise: Callable[[Json], V],
        maximum_cache_size: int = 10,
    ):
        """
        Persistent key-value store whose values are written to the file system.

        Primarily, this object intends to allow data to be stored in a transparent
        format that can be easily inspected by humans.

        This operates by keeping the most recently used `size` key-value pairs in
        memory.  Modifications made to the key-value pairs are made in-memory.  When a
        new key is loaded that would put the number of in-memory pairs over the maximum
        cache size, the least recently used pair is written to disk according to the
        serialisation function provided.  The items of the key tuple are used as folders
        within which the value is serialised, with the last one being the file name.

        When a key is requested from the store, the deserialisation function is called
        on the contents of the correct file, and the value is loaded back into memory
        and returned.
        """
        super().__init__(self._read_file, self._write_file, maximum_cache_size)

        self._root = Path(root).absolute()

        self._default = default
        self._serialise = serialise
        self._deserialise = deserialise

    def _read_file(self, path: tuple[str, ...] | str) -> V:
        """
        Read the contents of a file from disk and deserialise them.

        If the file does not exist yet, it will not be created (yet), and the default
        constructor will be called to generate a value instead.

        The path should be given relative to the persistent store's root folder.
        """
        file = self._root / self._validate_path(path)
        if file.exists():
            assert file.is_file()
            return self._deserialise(json.loads(file.read_text()))
        else:
            return self._default()

    def _write_file(self, path: tuple[str, ...] | str, value: V):
        """
        Write a value to the given path, relative to the persistent store's root.

        If the file does not yet exist, it will be created - along with any folders
        necessary.
        """
        file = self._root / self._validate_path(path)
        if not file.parent.exists():
            os.makedirs(file.parent)

        # Only write the value if it would be written to a non-default value.  Otherwise
        # the file should be deleted to ensure that the default appears next time
        if value != self._default():
            file.write_text(json.dumps(self._serialise(value)))
        else:
            if file.exists():
                file.unlink()

    def _validate_path(self, path: tuple[str, ...] | str) -> str:
        path = path if isinstance(path, tuple) else (path,)
        assert isinstance(path, tuple)
        assert len(path) > 0
        assert not any(("/" in segment for segment in path))
        assert not path[-1].endswith(".json")
        return "/".join(path) + ".json"
