import argparse
from src.lexer import Lexer
from src.parser import Parser
from src.semantic import SemanticAnalyzer
from src.cognitive import CognitiveClassifier
from src.report import ReportGenerator
from src.utils import read_source_file


def compile_file(path: str, output_dir: str = "reports"):
    source_code = read_source_file(path)

    lexer = Lexer(source_code)
    tokens, lexical_errors = lexer.tokenize()

    parser = Parser(tokens)
    program, syntax_errors = parser.parse()

    semantic = SemanticAnalyzer()
    symbol_table, semantic_errors = semantic.analyze(program)

    all_errors = lexical_errors + syntax_errors + semantic_errors
    classifier = CognitiveClassifier()
    classified_errors = classifier.classify(all_errors)

    reporter = ReportGenerator(output_dir)
    report_paths = reporter.generate(path, tokens, symbol_table, classified_errors)

    print("=" * 70)
    print("COGNITIVE-AWARE MINI COMPILER")
    print("=" * 70)
    print(f"Source file      : {path}")
    print(f"Tokens generated : {len(tokens) - 1}")
    print(f"Declared symbols : {len(symbol_table)}")
    print(f"Total errors     : {len(classified_errors)}")
    print(f"JSON report      : {report_paths['json']}")
    print(f"HTML report      : {report_paths['html']}")
    print("=" * 70)

    if classified_errors:
        print("\nDETECTED ERRORS")
        print("-" * 70)
        for idx, error in enumerate(classified_errors, start=1):
            print(
                f"{idx}. [{error.phase}] {error.error_type} at line {error.line}, col {error.column}: {error.message}"
            )
            print(f"   Cognitive Category : {error.cognitive_category}")
            print(f"   Possible Reason    : {error.cognitive_reason}")
            print(f"   Suggestion         : {error.suggestion}")
        print("-" * 70)
    else:
        print("No compile-time errors found. Program passed all current compiler phases.")


def main():
    parser = argparse.ArgumentParser(description="Cognitive-aware mini compiler for compiler design project")
    parser.add_argument("source", help="Path to source file")
    parser.add_argument("--output", default="reports", help="Directory to store reports")
    args = parser.parse_args()

    compile_file(args.source, args.output)


if __name__ == "__main__":
    main()
