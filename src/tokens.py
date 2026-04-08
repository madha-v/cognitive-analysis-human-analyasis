from dataclasses import dataclass


@dataclass
class Token:
    type: str
    value: str
    line: int
    column: int

    def __repr__(self) -> str:
        return f"Token(type={self.type!r}, value={self.value!r}, line={self.line}, column={self.column})"
