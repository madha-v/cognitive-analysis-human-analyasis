from pathlib import Path


def read_source_file(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")
