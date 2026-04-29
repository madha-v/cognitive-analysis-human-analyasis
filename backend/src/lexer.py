import re
from typing import List, Tuple
from src.tokens import Token
from src.errors import CompilerError

KEYWORDS = {"int": "INT", "float": "FLOAT", "print": "PRINT"}
SINGLE_CHAR_TOKENS = {
    ';': 'SEMICOLON',
    '=': 'ASSIGN',
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'MULTIPLY',
    '/': 'DIVIDE',
    '(': 'LPAREN',
    ')': 'RPAREN',
}


class Lexer:
    def __init__(self, source_code: str):
        self.source_code = source_code
        self.tokens: List[Token] = []
        self.errors: List[CompilerError] = []

    def tokenize(self) -> Tuple[List[Token], List[CompilerError]]:
        lines = self.source_code.splitlines()
        for line_no, line in enumerate(lines, start=1):
            self._scan_line(line, line_no)
        self.tokens.append(Token("EOF", "", len(lines) + 1, 1))
        return self.tokens, self.errors

    def _scan_line(self, line: str, line_no: int) -> None:
        i = 0
        while i < len(line):
            ch = line[i]
            col = i + 1

            if ch.isspace():
                i += 1
                continue

            if ch == '/' and i + 1 < len(line) and line[i + 1] == '/':
                break

            if ch.isalpha() or ch == '_':
                start = i
                while i < len(line) and (line[i].isalnum() or line[i] == '_'):
                    i += 1
                lexeme = line[start:i]
                token_type = KEYWORDS.get(lexeme, "IDENTIFIER")
                self.tokens.append(Token(token_type, lexeme, line_no, start + 1))
                continue

            if ch.isdigit():
                start = i
                dot_count = 0
                while i < len(line) and (line[i].isdigit() or line[i] == '.'):
                    if line[i] == '.':
                        dot_count += 1
                    i += 1
                lexeme = line[start:i]
                if dot_count > 1:
                    self.errors.append(CompilerError(
                        phase="Lexical Analysis",
                        error_type="INVALID_NUMBER",
                        message=f"Invalid numeric literal '{lexeme}'.",
                        line=line_no,
                        column=start + 1,
                        lexeme=lexeme,
                    ))
                else:
                    self.tokens.append(Token("NUMBER", lexeme, line_no, start + 1))
                continue

            if ch in SINGLE_CHAR_TOKENS:
                self.tokens.append(Token(SINGLE_CHAR_TOKENS[ch], ch, line_no, col))
                i += 1
                continue

            if ch == '"':
                start = i
                i += 1
                while i < len(line) and line[i] != '"':
                    i += 1
                if i >= len(line):
                    self.errors.append(CompilerError(
                        phase="Lexical Analysis",
                        error_type="UNCLOSED_STRING",
                        message="String literal is not closed.",
                        line=line_no,
                        column=start + 1,
                        lexeme=line[start:],
                    ))
                else:
                    lexeme = line[start + 1:i]
                    self.tokens.append(Token("STRING", lexeme, line_no, start + 1))
                    i += 1
                continue

            self.errors.append(CompilerError(
                phase="Lexical Analysis",
                error_type="UNKNOWN_SYMBOL",
                message=f"Unknown symbol '{ch}'.",
                line=line_no,
                column=col,
                lexeme=ch,
            ))
            i += 1
