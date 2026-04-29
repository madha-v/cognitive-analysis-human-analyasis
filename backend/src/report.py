import json
from collections import Counter
from pathlib import Path
from typing import Dict, List
from src.errors import CompilerError
from src.tokens import Token


class ReportGenerator:
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate(self, source_name: str, tokens: List[Token], symbol_table: Dict[str, str], errors: List[CompilerError]) -> Dict[str, str]:
        token_dump = [repr(token) for token in tokens if token.type != 'EOF']
        errors_data = [e.to_dict() for e in errors]
        phase_counts = Counter(e.phase for e in errors)
        category_counts = Counter(e.cognitive_category for e in errors)
        type_counts = Counter(e.error_type for e in errors)

        safe_name = Path(source_name).stem
        json_path = self.output_dir / f"{safe_name}_report.json"
        html_path = self.output_dir / f"{safe_name}_report.html"

        json_path.write_text(json.dumps({
            "source": source_name,
            "tokens": token_dump,
            "symbol_table": symbol_table,
            "total_errors": len(errors),
            "phase_counts": dict(phase_counts),
            "category_counts": dict(category_counts),
            "type_counts": dict(type_counts),
            "errors": errors_data,
        }, indent=2), encoding="utf-8")

        html_path.write_text(self._build_html(source_name, symbol_table, errors, phase_counts, category_counts, type_counts), encoding="utf-8")
        return {"json": str(json_path), "html": str(html_path)}

    def _build_html(self, source_name, symbol_table, errors, phase_counts, category_counts, type_counts):
        def bars(counter):
            if not counter:
                return "<p>No data available.</p>"
            max_value = max(counter.values()) or 1
            rows = []
            for key, value in counter.items():
                width = int((value / max_value) * 260)
                rows.append(
                    f"<div class='bar-row'><div class='label'>{key}</div><div class='bar-wrap'><div class='bar' style='width:{width}px'></div></div><div class='count'>{value}</div></div>"
                )
            return "\n".join(rows)

        symbol_rows = "".join(f"<tr><td>{name}</td><td>{typ}</td></tr>" for name, typ in symbol_table.items()) or "<tr><td colspan='2'>No symbols recorded</td></tr>"
        error_rows = "".join(
            f"<tr><td>{e.phase}</td><td>{e.error_type}</td><td>{e.line}</td><td>{e.column}</td><td>{e.message}</td><td>{e.cognitive_category}</td><td>{e.suggestion}</td></tr>"
            for e in errors
        ) or "<tr><td colspan='7'>No compile-time errors found</td></tr>"

        return f"""
<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<title>Cognitive Compiler Report</title>
<style>
body {{ font-family: Arial, sans-serif; background:#f4f6fb; color:#222; margin:0; padding:24px; }}
.card {{ background:white; border-radius:14px; padding:20px; margin-bottom:18px; box-shadow:0 4px 16px rgba(0,0,0,0.08); }}
h1, h2 {{ margin-top:0; }}
table {{ width:100%; border-collapse:collapse; font-size:14px; }}
th, td {{ border:1px solid #d8deea; padding:10px; text-align:left; vertical-align:top; }}
th {{ background:#eef3ff; }}
.bar-row {{ display:flex; align-items:center; gap:12px; margin:10px 0; }}
.label {{ width:220px; font-size:14px; }}
.bar-wrap {{ flex:1; background:#eef2f7; border-radius:8px; height:18px; overflow:hidden; }}
.bar {{ height:18px; background:#5b8def; border-radius:8px; }}
.count {{ width:30px; text-align:right; }}
.small {{ color:#5c6470; }}
</style>
</head>
<body>
<div class='card'>
<h1>Human Cognitive Analysis of Coding via Error in Compiler</h1>
<p class='small'><strong>Source File:</strong> {source_name}</p>
<p class='small'><strong>Total Errors:</strong> {len(errors)}</p>
</div>
<div class='card'>
<h2>Symbol Table</h2>
<table>
<tr><th>Identifier</th><th>Type</th></tr>
{symbol_rows}
</table>
</div>
<div class='card'>
<h2>Error Distribution by Compiler Phase</h2>
{bars(phase_counts)}
</div>
<div class='card'>
<h2>Cognitive Category Distribution</h2>
{bars(category_counts)}
</div>
<div class='card'>
<h2>Error Type Frequency</h2>
{bars(type_counts)}
</div>
<div class='card'>
<h2>Detailed Error Log</h2>
<table>
<tr><th>Phase</th><th>Error Type</th><th>Line</th><th>Column</th><th>Message</th><th>Cognitive Category</th><th>Suggestion</th></tr>
{error_rows}
</table>
</div>
</body>
</html>
"""
