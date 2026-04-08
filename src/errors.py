from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class CompilerError:
    phase: str
    error_type: str
    message: str
    line: int
    column: int
    lexeme: Optional[str] = None
    cognitive_category: Optional[str] = None
    cognitive_reason: Optional[str] = None
    suggestion: Optional[str] = None

    def to_dict(self):
        return asdict(self)
