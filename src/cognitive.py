from typing import Dict, List
from src.errors import CompilerError


COGNITIVE_MAP: Dict[str, Dict[str, str]] = {
    "UNKNOWN_SYMBOL": {
        "category": "Syntax Confusion",
        "reason": "The programmer may be unsure about valid symbols of the language.",
        "suggestion": "Check the allowed operators, delimiters, and symbol usage in the grammar."
    },
    "UNCLOSED_STRING": {
        "category": "Structural Error",
        "reason": "The programmer may have forgotten to close a literal boundary.",
        "suggestion": "Always close string literals with matching quotation marks."
    },
    "INVALID_NUMBER": {
        "category": "Syntax Confusion",
        "reason": "The numeric format does not match the expected token pattern.",
        "suggestion": "Use valid integer or floating-point literal format."
    },
    "MISSING_IDENTIFIER": {
        "category": "Grammar Misunderstanding",
        "reason": "The declaration rule is incomplete because the variable name is missing.",
        "suggestion": "Write declarations in the form: type identifier; or type identifier = expression;"
    },
    "MISSING_SEMICOLON": {
        "category": "Grammar Misunderstanding",
        "reason": "Statement termination rules are not being followed consistently.",
        "suggestion": "Terminate each declaration, assignment, and print statement with ';'."
    },
    "MISSING_RPAREN": {
        "category": "Structural Error",
        "reason": "The expression grouping is incomplete, showing bracket balancing difficulty.",
        "suggestion": "Match every '(' with a corresponding ')'."
    },
    "INVALID_STATEMENT": {
        "category": "Structural Error",
        "reason": "The statement structure does not match any valid grammar production.",
        "suggestion": "Start statements with a type keyword, identifier, or print keyword as required."
    },
    "INVALID_EXPRESSION": {
        "category": "Logical Reasoning Error",
        "reason": "The expression formation is incomplete or uses unexpected tokens.",
        "suggestion": "Build expressions using valid operands and operators only."
    },
    "REDECLARATION": {
        "category": "Scope Misunderstanding",
        "reason": "The programmer may not fully understand current variable scope or existing declarations.",
        "suggestion": "Declare a variable only once in the same scope, then reuse it by assignment."
    },
    "UNDECLARED_VARIABLE": {
        "category": "Scope Misunderstanding",
        "reason": "The programmer is using a name before establishing it in the symbol table.",
        "suggestion": "Declare the variable before using it in expressions or assignments."
    },
    "TYPE_MISMATCH": {
        "category": "Type System Confusion",
        "reason": "The assigned value type does not align with the declared variable type.",
        "suggestion": "Match variable types with expression types, or use explicit conversion rules."
    },
    "INVALID_OPERATION": {
        "category": "Type System Confusion",
        "reason": "The selected operator is not meaningful for the chosen data types.",
        "suggestion": "Apply arithmetic operators only on compatible numeric operands."
    },
    "DIVISION_BY_ZERO_LITERAL": {
        "category": "Logical Reasoning Error",
        "reason": "The expression contains a mathematically invalid operation.",
        "suggestion": "Check denominator values before division."
    },
}


class CognitiveClassifier:
    def classify(self, errors: List[CompilerError]) -> List[CompilerError]:
        for error in errors:
            mapping = COGNITIVE_MAP.get(error.error_type, {
                "category": "Unclassified",
                "reason": "No cognitive mapping rule found.",
                "suggestion": "Inspect the error message and refine the taxonomy."
            })
            error.cognitive_category = mapping["category"]
            error.cognitive_reason = mapping["reason"]
            error.suggestion = mapping["suggestion"]
        return errors
