from pathlib import Path
from typing import NamedTuple

from parsing.line import Line


class ParsedEntity(NamedTuple):
    indent: tuple[int, int]

    lines: list[str]
    children: list["ParsedEntity"]

    images: list[Path]

    section: bool = False
    open: bool | None = None

    def dump(self, indent: int = 0) -> list[str]:
        return (
            [("  " * indent) + self.type_indicator + " " + "\\n".join(self.lines)]
            + ["  " * (indent + 1) + "(i) " + str(image) for image in self.images]
            + [
                line
                for child in self.children
                for line in child.dump(indent=indent + 1)
            ]
        )

    @property
    def type_indicator(self) -> str:
        return (
            "(s)"
            if self.section
            else "( )" if self.open is None else "(o)" if self.open else "(x)"
        )

    def __len__(self) -> int:
        return 1 + sum(len(child) for child in self.children)


def parse_file(path: Path, root: Path) -> ParsedEntity:
    stack = [
        ParsedEntity(
            indent=(0, 0),
            lines=[path.name.removesuffix(".md")],
            children=[],
            images=[],
            section=True,
        )
    ]
    in_block_quote = False

    lines = map(Line, path.read_text().splitlines())

    for line in lines:
        assert len(stack) > 0

        if in_block_quote:
            stack[-1].lines.append(line.after_parse[stack[-1].indent[1] :])
            if line.is_block_quote:
                in_block_quote = False
            continue
        else:
            if len(line.after_parse.strip()) == 0:
                # The line contains no content and can be skipped
                continue

        while line.indent_order < stack[-1].indent:
            assert len(stack) >= 2
            stack[-2].children.append(stack.pop())
            in_block_quote = False

        if line.indent_order == stack[-1].indent and (
            line.is_child or line.is_section or line.indent == 0
        ):
            stack[-2].children.append(stack.pop())
            in_block_quote = False
            stack.append(
                ParsedEntity(
                    line.indent_order,
                    lines=[],
                    children=[],
                    images=[],
                    section=line.is_section,
                    open=line.is_open,
                )
            )

        if line.indent_order > stack[-1].indent:
            stack.append(
                ParsedEntity(
                    line.indent_order,
                    lines=[],
                    children=[],
                    images=[],
                    section=line.is_section,
                    open=line.is_open,
                )
            )

        stack[-1].lines.append(line.after_open)
        for image in line.vscode_images:
            image_path = path.parent / image
            if image_path.exists():
                stack[-1].images.append(image_path)
            else:
                print(f"Missing vscode image file: {image_path} in {path}")
        for image in line.obsidian_images:
            image_path = path.parent / "images" / image
            if image_path.exists():
                stack[-1].images.append(image_path)
            elif len(potential_paths := list(root.glob(f"**/{image}"))) == 1:
                (image_path,) = potential_paths
                stack[-1].images.append(image_path)
            else:
                print(f"Missing obsidian image file: {image_path} in {path}")

        if line.is_block_quote:
            in_block_quote = True

    while len(stack) > 1:
        stack[-2].children.append(stack.pop())

    return stack[0]
