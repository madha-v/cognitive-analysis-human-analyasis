from typing import Dict, List, Tuple
from src.errors import CompilerError
from src.ast_nodes import Program, Declaration, Assignment, PrintStatement, Literal, Identifier, BinaryOp


class SemanticAnalyzer:
    def __init__(self):
        self.symbol_table: Dict[str, str] = {}
        self.errors: List[CompilerError] = []

    def analyze(self, program: Program) -> Tuple[Dict[str, str], List[CompilerError]]:
        for stmt in program.statements:
            if isinstance(stmt, Declaration):
                self._analyze_declaration(stmt)
            elif isinstance(stmt, Assignment):
                self._analyze_assignment(stmt)
            elif isinstance(stmt, PrintStatement):
                self._infer_type(stmt.expression)
        return self.symbol_table, self.errors

    def _analyze_declaration(self, stmt: Declaration):
        if stmt.identifier in self.symbol_table:
            self.errors.append(CompilerError(
                phase="Semantic Analysis",
                error_type="REDECLARATION",
                message=f"Variable '{stmt.identifier}' is already declared.",
                line=stmt.line,
                column=1,
                lexeme=stmt.identifier,
            ))
            return

        self.symbol_table[stmt.identifier] = stmt.var_type
        if stmt.expression is not None:
            expr_type = self._infer_type(stmt.expression)
            if expr_type and not self._compatible(stmt.var_type, expr_type):
                self.errors.append(CompilerError(
                    phase="Semantic Analysis",
                    error_type="TYPE_MISMATCH",
                    message=f"Cannot assign {expr_type} value to {stmt.var_type} variable '{stmt.identifier}'.",
                    line=stmt.line,
                    column=1,
                    lexeme=stmt.identifier,
                ))

    def _analyze_assignment(self, stmt: Assignment):
        if stmt.identifier not in self.symbol_table:
            self.errors.append(CompilerError(
                phase="Semantic Analysis",
                error_type="UNDECLARED_VARIABLE",
                message=f"Variable '{stmt.identifier}' is not declared.",
                line=stmt.line,
                column=1,
                lexeme=stmt.identifier,
            ))
            self._infer_type(stmt.expression)
            return

        var_type = self.symbol_table[stmt.identifier]
        expr_type = self._infer_type(stmt.expression)
        if expr_type and not self._compatible(var_type, expr_type):
            self.errors.append(CompilerError(
                phase="Semantic Analysis",
                error_type="TYPE_MISMATCH",
                message=f"Cannot assign {expr_type} value to {var_type} variable '{stmt.identifier}'.",
                line=stmt.line,
                column=1,
                lexeme=stmt.identifier,
            ))

    def _infer_type(self, expr):
        if isinstance(expr, Literal):
            return expr.literal_type
        if isinstance(expr, Identifier):
            if expr.name not in self.symbol_table:
                self.errors.append(CompilerError(
                    phase="Semantic Analysis",
                    error_type="UNDECLARED_VARIABLE",
                    message=f"Variable '{expr.name}' is not declared.",
                    line=expr.line,
                    column=1,
                    lexeme=expr.name,
                ))
                return None
            return self.symbol_table[expr.name]
        if isinstance(expr, BinaryOp):
            left_type = self._infer_type(expr.left)
            right_type = self._infer_type(expr.right)
            if expr.operator == '/' and isinstance(expr.right, Literal) and expr.right.value == 0:
                self.errors.append(CompilerError(
                    phase="Semantic Analysis",
                    error_type="DIVISION_BY_ZERO_LITERAL",
                    message="Division by zero detected in expression.",
                    line=expr.line,
                    column=1,
                    lexeme='/',
                ))
            if left_type is None or right_type is None:
                return None
            if left_type == 'string' or right_type == 'string':
                self.errors.append(CompilerError(
                    phase="Semantic Analysis",
                    error_type="INVALID_OPERATION",
                    message=f"Operator '{expr.operator}' cannot be applied to string values.",
                    line=expr.line,
                    column=1,
                    lexeme=expr.operator,
                ))
                return None
            if 'float' in (left_type, right_type):
                return 'float'
            return 'int'
        return None

    @staticmethod
    def _compatible(target: str, source: str) -> bool:
        if target == source:
            return True
        if target == 'float' and source == 'int':
            return True
        return False
