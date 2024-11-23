from collections import defaultdict
from typing import Annotated, cast
from aliases import Json
from models.chunk import Chunk
from models.context import Context
from models.timestamp import Timestamp
from models.trait import Trait


class Reference(Trait[str | None, str | None]):
    def __init__(self, context: Context, name: str):
        super().__init__(context, name, set())

    def _validate(self, value: Json) -> str | None:
        """
        Parse the given JSON value as a snapshot, or raise an error if it is invalid.
        """
        if value is None:
            return None
        elif isinstance(value, str):
            return str(Timestamp.parse(value))
        else:
            raise ValueError(f"Invalid source value: {value}")

    def _derive(
        self,
        inputs: dict[Trait, dict[Timestamp, Json]],
        updates: dict[Trait, dict[Timestamp, tuple[Json, Json]]],
    ) -> dict[Timestamp, tuple[str | None, str | None]]:
        return {
            item_id: (self.get_item(item_id), self._validate(snapshot))
            for item_id, snapshot in inputs.get(self, {}).items()
        }

    def _serialise(self, snapshots: dict[Timestamp, str]) -> dict[Timestamp, str]:
        return snapshots

    def _deserialise(self, archives: dict[Timestamp, str]) -> dict[Timestamp, str]:
        return archives


_Snapshot = list[Annotated[str, Timestamp]]
# _Archive = list[Annotated[str, Chunk]]
_Archive = _Snapshot


class BackReference(Trait[_Archive, _Snapshot]):
    """
    Tracks references to this item, as laid out in another reference trait.

    The references are given as a list of children, where each child is the string
    identifier of an item.

    When the snapshots are serialised to archives, to save space they are represented as
    a list of chunks whose items contain references to the item in question, other than
    the chunk that contains the item in questions.  So if an item is only referenced
    from other items within the same chunk, the serialised backreferences will always be
    an empty list.  Upon deserialising the archive, the chunks in question will be
    loaded and scanned to build the correct list of children again.
    """

    def __init__(self, context: Context, name: str, reference: Reference):
        super().__init__(context, name, {reference})

        self.reference = reference

    def _derive(
        self,
        inputs: dict["Trait", dict[Timestamp, Json]],
        updates: dict["Trait", dict[Timestamp, tuple[Json, Json]]],
    ) -> dict[Timestamp, tuple[_Snapshot | None, _Snapshot | None]]:
        reference_updates = cast(
            dict[Timestamp, tuple[str | None, str | None]],
            updates.get(self.reference, {}),
        )

        children_updates: dict[Timestamp, tuple[_Snapshot | None, _Snapshot | None]] = (
            {}
        )

        for child, (old_parent, new_parent) in reference_updates.items():

            if old_parent is not None:
                key = Timestamp.parse(old_parent)
                if key not in children_updates:
                    old_children = self.get_item(key)
                    children_updates[key] = (old_children, old_children)

                # Remove the child from the old parent's list of children
                old_children, new_children = children_updates[key]
                children_updates[key] = (
                    old_children,
                    self._remove_child(new_children, str(child)),
                )

            if new_parent is not None:
                key = Timestamp.parse(new_parent)
                if key not in children_updates:
                    old_children = self.get_item(key)
                    children_updates[key] = (old_children, old_children)

                # Add the child to the new parent's list of children
                old_children, new_children = children_updates[key]
                children_updates[key] = (
                    old_children,
                    (new_children or []) + [str(child)],
                )

        return children_updates

    def _remove_child(self, children: list[str] | None, child: str) -> list[str] | None:
        removed = [
            existing_child
            for existing_child in (children or [])
            if existing_child != child
        ]
        return None if len(removed) == 0 else removed

    def _serialise(
        self, snapshots: dict[Timestamp, _Snapshot | None]
    ) -> dict[Timestamp, _Archive | None]:
        return snapshots

    def _deserialise(
        self, archives: dict[Timestamp, _Archive]
    ) -> dict[Timestamp, _Snapshot]:
        return archives
