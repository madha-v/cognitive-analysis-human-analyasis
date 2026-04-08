# Human Cognitive Analysis of Coding via Error in Compiler

A proper compiler design mini-project based on the standard compiler phases and an added cognitive analysis layer.

## Project Idea
This project implements a **C-like mini compiler** that performs:
- Lexical Analysis
- Syntax Analysis
- Semantic Analysis
- Error Detection and Logging
- Cognitive Error Classification
- Report Generation

The idea matches the proposal objective of detecting compiler errors and mapping them to cognitive categories like grammar misunderstanding, scope misunderstanding, type confusion, logical reasoning error, and structural error.

## Folder Structure

```text
compiler_cognitive_project/
│── main.py
│── README.md
│── requirements.txt
│── samples/
│   ├── sample_valid.cog
│   └── sample_errors.cog
│── src/
│   ├── lexer.py
│   ├── parser.py
│   ├── semantic.py
│   ├── cognitive.py
│   ├── report.py
│   ├── errors.py
│   ├── ast_nodes.py
│   ├── tokens.py
│   └── utils.py
│── reports/
```

## Supported Language Features
- Variable declarations: `int a;`, `float b = 2.5;`
- Assignment: `a = 10 + 5;`
- Arithmetic expressions: `+`, `-`, `*`, `/`
- Print statement: `print a;`
- Comments: `// this is a comment`

## Compiler Design Phases Used

### Phase 1: Lexical Analysis
The lexer scans characters and generates tokens like identifiers, numbers, keywords, operators, and delimiters.

### Phase 2: Syntax Analysis
The parser validates the grammar and builds an AST for declarations, assignments, print statements, and expressions.

### Phase 3: Semantic Analysis
The semantic analyzer checks:
- variable redeclaration
- undeclared variable usage
- type mismatch
- invalid arithmetic operation on strings
- division by zero when denominator is literal zero

### Phase 4: Error Classification Module
Each technical compiler error is mapped to a cognitive interpretation.
Examples:
- missing semicolon -> grammar misunderstanding
- undeclared variable -> scope misunderstanding
- type mismatch -> type system confusion

### Phase 5: Cognitive Report Generator
The compiler generates:
- JSON report
- HTML report
- error frequency summary
- cognitive category analysis
- suggestions for improvement

## How to Run

### Command 1: Move to project folder
```bash
cd compiler_cognitive_project
```

### Command 2: Run sample with errors
```bash
python main.py samples/sample_errors.cog
```

### Command 3: Run sample with valid code
```bash
python main.py samples/sample_valid.cog
```

### Command 4: Save reports in custom folder
```bash
python main.py samples/sample_errors.cog --output reports
```

## Windows Commands
```powershell
cd "C:\path\to\compiler_cognitive_project"
python main.py samples\sample_errors.cog
```

## Example Input Program
```c
int a = 10;
float b = 2.5;
int c;
c = a + 5;
print c;
```

## Example Error Program
```c
int a = 10
float a = 2.5;
int b = "hello";
c = a + 5;
print (a + );
int d = 8 / 0;
int x = 5 @ 2;
```

## Outputs
After running, the compiler produces:
- terminal output
- `reports/<filename>_report.json`
- `reports/<filename>_report.html`

## Why this looks like a proper compiler project
- phase-wise implementation
- AST construction
- symbol table generation
- semantic checks
- custom error taxonomy
- cognitive classification layer
- report generation for analysis

## Future Scope
- add intermediate code generation
- add optimizer phase
- add GUI frontend
- add more grammar rules like loops and conditionals
- compare multiple student profiles across datasets
