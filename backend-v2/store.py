from pathlib import Path


class Store:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
