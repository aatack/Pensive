from typing import Iterator, NamedTuple


class Line(NamedTuple):
    after_parse: str

    @property
    def after_indent(self) -> str:
        return self.after_parse.lstrip()

    @property
    def indent(self) -> int:
        return (
            len(self.after_parse) - len(self.after_indent) + (2 if self.is_child else 0)
        )

    @property
    def is_child(self) -> bool:
        return self.after_indent.startswith("- ")

    @property
    def after_child(self) -> str:
        return (
            self.after_indent.removeprefix("- ") if self.is_child else self.after_indent
        )

    @property
    def is_section(self) -> bool:
        segments = self.after_child.split()
        return len(segments) > 0 and set(segments[0]) == {"#"}

    @property
    def section(self) -> int:
        return 0 if not self.is_section else len(self.after_child.split()[0])

    @property
    def indent_order(self) -> tuple[int, int]:
        # Impose an arbitrary penalty if not a section, to ensure that sections are
        # always treated as less indented than non-sections, no matter what
        return self.section or 1000, self.indent

    @property
    def after_section(self) -> str:
        return self.after_child[self.section :].lstrip()

    @property
    def is_open(self) -> bool | None:
        return (
            True
            if self.after_section.startswith("[ ]")
            else False if self.after_section.startswith("[x]") else None
        )

    @property
    def after_open(self) -> str:
        return (
            self.after_section
            if self.is_open is None
            else self.after_section[3:].lstrip()
        )

    @property
    def obsidian_images(self) -> Iterator[str]:
        split_on_close = self.after_open.split(".png]]")[:-1]
        for segment in split_on_close:
            if len(split_on_open := segment.split("![[")) > 0:
                yield split_on_open[-1] + ".png"

    @property
    def vscode_images(self) -> Iterator[str]:
        split_on_close = self.after_open.split(".png)")[:-1]
        for segment in split_on_close:
            if len(split_on_open := segment.split("![alt text](")) > 0:
                yield split_on_open[-1] + ".png"

    @property
    def is_block_quote(self) -> bool:
        return self.after_child.lstrip().startswith("```")
