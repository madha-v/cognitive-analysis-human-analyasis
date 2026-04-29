from dataclasses import dataclass
from typing import List, Optional, Union


@dataclass
class Program:
    statements: List[object]


@dataclass
class Declaration:
    var_type: str
    identifier: str
    expression: Optional[object]
    line: int


@dataclass
class Assignment:
    identifier: str
    expression: object
    line: int


@dataclass
class PrintStatement:
    expression: object
    line: int


@dataclass
class Literal:
    value: Union[int, float, str]
    literal_type: str
    line: int


@dataclass
class Identifier:
    name: str
    line: int


@dataclass
class BinaryOp:
    left: object
    operator: str
    right: object
    line: int
