import os
import sys
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add the current directory to sys.path to allow imports from src
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.lexer import Lexer
from src.parser import Parser
from src.semantic import SemanticAnalyzer
from src.cognitive import CognitiveClassifier
from src.ai_analyzer import AIAnalyzer
from src.tokens import Token
from src.errors import CompilerError

app = FastAPI(title="Cognitive Compiler API")

# Initialize AI Analyzer
ai_analyzer = None
if os.getenv("GROQ_API_KEY") and os.getenv("GOOGLE_API_KEY"):
    try:
        ai_analyzer = AIAnalyzer()
    except Exception as e:
        print(f"Failed to initialize AI Analyzer: {e}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CompilationRequest(BaseModel):
    source_code: str
    session_id: Optional[str] = "default"

class CompilationResponse(BaseModel):
    tokens: List[str]
    symbol_table: Dict[str, str]
    errors: List[Dict]
    total_errors: int
    phase_counts: Dict[str, int]
    category_counts: Dict[str, int]

class ChatRequest(BaseModel):
    question: str
    session_id: str
    history: List[Dict[str, str]] = []

class ReportRequest(BaseModel):
    session_id: str
    session_name: str
    errors: List[Dict] = []
    current_errors: List[Dict] = []
    code: str = ""

@app.post("/compile", response_model=CompilationResponse)
async def compile_code(request: CompilationRequest):
    try:
        source_code = request.source_code
        session_id = request.session_id or "default"

        lexer = Lexer(source_code)
        tokens, lexical_errors = lexer.tokenize()

        parser = Parser(tokens)
        program, syntax_errors = parser.parse()

        semantic = SemanticAnalyzer()
        symbol_table, semantic_errors = semantic.analyze(program)

        all_errors = lexical_errors + syntax_errors + semantic_errors
        
        # Phase 1: Basic Cognitive Classification
        classifier = CognitiveClassifier()
        classified_errors = classifier.classify(all_errors)

        # Phase 2: AI-Enhanced Analysis (if available)
        if ai_analyzer and classified_errors:
            classified_errors = await ai_analyzer.analyze_errors(source_code, classified_errors, session_id)

        # Prepare results
        token_dump = [repr(token) for token in tokens if token.type != 'EOF']
        errors_data = [e.to_dict() for e in classified_errors]
        
        from collections import Counter
        phase_counts = Counter(e.phase for e in classified_errors)
        category_counts = Counter(e.cognitive_category for e in classified_errors)

        return CompilationResponse(
            tokens=token_dump,
            symbol_table=symbol_table,
            errors=errors_data,
            total_errors=len(classified_errors),
            phase_counts=dict(phase_counts),
            category_counts=dict(category_counts)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    if not ai_analyzer:
        return {"response": "AI services are not configured. Please check API keys."}
    
    try:
        response = await ai_analyzer.chat(request.question, request.session_id, request.history)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/report")
async def generate_report(request: ReportRequest):
    """Generate an AI-powered cognitive report for a session."""
    error_summary = []
    category_counts = {}
    phase_counts = {}
    
    for err in request.errors:
        error_summary.append({
            "error_type": err.get("error_type", "Unknown"),
            "message": err.get("message", ""),
            "line": err.get("line", 0),
            "cognitive_category": err.get("cognitive_category", "Uncategorized"),
            "cognitive_reason": err.get("cognitive_reason", ""),
            "suggestion": err.get("suggestion", ""),
            "timestamp": err.get("timestamp", ""),
        })
        cat = err.get("cognitive_category", "Uncategorized")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        phase = err.get("phase", "Unknown")
        phase_counts[phase] = phase_counts.get(phase, 0) + 1
    
    current_error_count = len(request.current_errors)
    total_historical = len(request.errors)
    fixed_count = max(0, total_historical - current_error_count)
    
    # Generate AI feedback paragraph
    feedback = ""
    if ai_analyzer:
        try:
            prompt = (
                f"You are a cognitive coding tutor writing a session report for a student.\n"
                f"Session: {request.session_name}\n"
                f"Total errors encountered: {total_historical}\n"
                f"Errors fixed: {fixed_count}\n"
                f"Current remaining errors: {current_error_count}\n"
                f"Error categories: {category_counts}\n"
                f"Error phases: {phase_counts}\n"
                f"Current code:\n```\n{request.code}\n```\n\n"
                f"Error details:\n"
            )
            for err in error_summary[:10]:
                prompt += f"- [{err['error_type']}] Line {err['line']}: {err['message']} (Category: {err['cognitive_category']})\n"
            
            prompt += (
                f"\nWrite a 2-3 paragraph assessment that includes:\n"
                f"1. What the student did well (fixing errors, progress made)\n"
                f"2. Key cognitive patterns in their mistakes\n"
                f"3. Specific, actionable advice for improvement\n"
                f"Be encouraging but honest. Use Markdown formatting."
            )
            
            response = await ai_analyzer.chat(prompt, request.session_id, [])
            feedback = response
        except Exception as e:
            print(f"AI report generation failed: {e}")
            feedback = _generate_static_feedback(total_historical, fixed_count, current_error_count, category_counts)
    else:
        feedback = _generate_static_feedback(total_historical, fixed_count, current_error_count, category_counts)
    
    return {
        "session_name": request.session_name,
        "total_errors": total_historical,
        "fixed_errors": fixed_count,
        "current_errors": current_error_count,
        "category_counts": category_counts,
        "phase_counts": phase_counts,
        "error_details": error_summary,
        "feedback": feedback,
    }

def _generate_static_feedback(total: int, fixed: int, current: int, categories: dict) -> str:
    """Fallback static feedback when AI is unavailable."""
    fix_rate = (fixed / total * 100) if total > 0 else 0
    top_category = max(categories, key=categories.get) if categories else "None"
    
    feedback = f"### Session Summary\n\n"
    if fix_rate >= 75:
        feedback += f"**Excellent progress!** You resolved {fixed} out of {total} errors ({fix_rate:.0f}% fix rate). "
        feedback += "This shows strong debugging skills and a good understanding of error messages. "
    elif fix_rate >= 50:
        feedback += f"**Good effort!** You fixed {fixed} out of {total} errors ({fix_rate:.0f}% fix rate). "
        feedback += "You're making solid progress in identifying and correcting mistakes. "
    else:
        feedback += f"You encountered {total} errors and fixed {fixed} ({fix_rate:.0f}% fix rate). "
        feedback += "Don't be discouraged — every error is a learning opportunity! "
    
    feedback += f"\n\n### Areas for Growth\n\n"
    feedback += f"Your most common error category was **{top_category}**. "
    feedback += "Focus on understanding why these patterns occur. "
    feedback += "Try to slow down and read error messages carefully before making changes.\n\n"
    feedback += f"*Keep practicing — consistency is the key to mastery!*"
    return feedback

@app.get("/")
async def root():
    return {"message": "Welcome to the Cognitive Compiler API. Use /compile to analyze code."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
