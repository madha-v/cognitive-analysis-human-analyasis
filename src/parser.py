from typing import List, Tuple
from src.tokens import Token
from src.errors import CompilerError
from src.ast_nodes import Program, Declaration, Assignment, PrintStatement, Literal, Identifier, BinaryOp


class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.current = 0
        self.errors: List[CompilerError] = []

    def parse(self) -> Tuple[Program, List[CompilerError]]:
        statements = []
        while not self._is_at_end():
            if self._peek().type == "EOF":
                break
            stmt = self._statement()
            if stmt is not None:
                statements.append(stmt)
        return Program(statements), self.errors

    def _statement(self):
        if self._match("INT", "FLOAT"):
            return self._declaration(self._previous())
        if self._match("PRINT"):
            return self._print_statement(self._previous())
        if self._check("IDENTIFIER") and self._check_next("ASSIGN"):
            return self._assignment()

        token = self._peek()
        self.errors.append(CompilerError(
            phase="Syntax Analysis",
            error_type="INVALID_STATEMENT",
            message=f"Invalid statement starting with '{token.value}'.",
            line=token.line,
            column=token.column,
            lexeme=token.value,
        ))
        self._synchronize()
        return None

    def _declaration(self, type_token: Token):
        if not self._match("IDENTIFIER"):
            token = self._peek()
            self.errors.append(CompilerError(
                phase="Syntax Analysis",
                error_type="MISSING_IDENTIFIER",
                message="Expected variable name after type.",
                line=token.line,
                column=token.column,
                lexeme=token.value,
            ))
            self._synchronize()
            return None

        identifier = self._previous()
        expression = None
        if self._match("ASSIGN"):
            expression = self._expression()

        if not self._match("SEMICOLON"):
            token = self._peek()
            self.errors.append(CompilerError(
                phase="Syntax Analysis",
                error_type="MISSING_SEMICOLON",
                message="Expected ';' after declaration.",
                line=token.line,
                column=token.column,
                lexeme=token.value,
            ))
            self._synchronize()
        return Declaration(type_token.value, identifier.value, expression, type_token.line)

    def _assignment(self):
        identifier = self._advance()
        self._advance()  # ASSIGN
        expr = self._expression()
        if not self._match("SEMICOLON"):
            token = self._peek()
            self.errors.append(CompilerError(
                phase="Syntax Analysis",
                error_type="MISSING_SEMICOLON",
                message="Expected ';' after assignment.",
                line=token.line,
                column=token.column,
                lexeme=token.value,
            ))
            self._synchronize()
        return Assignment(identifier.value, expr, identifier.line)

    def _print_statement(self, keyword: Token):
        expr = self._expression()
        if not self._match("SEMICOLON"):
            token = self._peek()
            self.errors.append(CompilerError(
                phase="Syntax Analysis",
                error_type="MISSING_SEMICOLON",
                message="Expected ';' after print statement.",
                line=token.line,
                column=token.column,
                lexeme=token.value,
            ))
            self._synchronize()
        return PrintStatement(expr, keyword.line)

    def _expression(self):
        node = self._term()
        while self._match("PLUS", "MINUS"):
            op = self._previous()
            right = self._term()
            node = BinaryOp(node, op.value, right, op.line)
        return node

    def _term(self):
        node = self._factor()
        while self._match("MULTIPLY", "DIVIDE"):
            op = self._previous()
            right = self._factor()
            node = BinaryOp(node, op.value, right, op.line)
        return node

    def _factor(self):
        if self._match("NUMBER"):
            token = self._previous()
            if "." in token.value:
                return Literal(float(token.value), "float", token.line)
            return Literal(int(token.value), "int", token.line)

        if self._match("STRING"):
            token = self._previous()
            return Literal(token.value, "string", token.line)

        if self._match("IDENTIFIER"):
            token = self._previous()
            return Identifier(token.value, token.line)

        if self._match("LPAREN"):
            expr = self._expression()
            if not self._match("RPAREN"):
                token = self._peek()
                self.errors.append(CompilerError(
                    phase="Syntax Analysis",
                    error_type="MISSING_RPAREN",
                    message="Expected ')' after expression.",
                    line=token.line,
                    column=token.column,
                    lexeme=token.value,
                ))
            return expr

        token = self._peek()
        self.errors.append(CompilerError(
            phase="Syntax Analysis",
            error_type="INVALID_EXPRESSION",
            message=f"Unexpected token '{token.value}' in expression.",
            line=token.line,
            column=token.column,
            lexeme=token.value,
        ))
        self._advance()
        return Literal(0, "int", token.line)

    def _match(self, *types):
        for token_type in types:
            if self._check(token_type):
                self._advance()
                return True
        return False

    def _check(self, token_type: str) -> bool:
        if self._is_at_end():
            return False
        return self._peek().type == token_type

    def _check_next(self, token_type: str) -> bool:
        if self.current + 1 >= len(self.tokens):
            return False
        return self.tokens[self.current + 1].type == token_type

    def _advance(self) -> Token:
        if not self._is_at_end():
            self.current += 1
        return self.tokens[self.current - 1]

    def _peek(self) -> Token:
        return self.tokens[self.current]

    def _previous(self) -> Token:
        return self.tokens[self.current - 1]

    def _is_at_end(self) -> bool:
        return self._peek().type == "EOF"

    def _synchronize(self):
        while not self._is_at_end() and self._peek().type != "SEMICOLON":
            self._advance()
        if self._check("SEMICOLON"):
            self._advance()
