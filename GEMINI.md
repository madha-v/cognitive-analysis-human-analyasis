# GEMINI Context: Human Cognitive Analysis of Coding via Error in Compiler

This project is a cognitive-aware mini-compiler that maps technical compiler errors to human cognitive categories. It features a FastAPI backend with AI-enhanced analysis and a Next.js frontend.

## Project Structure

- `backend/`: Python backend using FastAPI and `uv`.
  - `src/`: Compiler phases and AI logic.
  - `src/ai_analyzer.py`: LangChain integration with Groq and Gemini.
  - `app.py`: API entry point with CORS and AI initialization.
  - `.env.example`: Template for required API keys.
- `frontend/`: Next.js frontend using `pnpm`, Tailwind CSS, and `shadcn/ui`.
  - `src/app/dashboard/`: Interactive coding environment with real-time analysis.
- `README.md`: General project information.

## Technologies

- **Backend:** Python 3.10+, FastAPI, uv, LangChain, Groq (Llama 3), Google Generative AI (Gemini Embeddings), ChromaDB.
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, pnpm, shadcn/ui, Monaco Editor.

## Getting Started

### Backend
1. Install `uv`.
2. Navigate to `backend/`.
3. Create a `.env` file from `.env.example` and add your `GROQ_API_KEY` and `GOOGLE_API_KEY`.
4. Run `./run.sh`. (Starts on port 8000)

### Frontend
1. Install `pnpm`.
2. Navigate to `frontend/`.
3. Install dependencies: `pnpm install`.
4. Run development server: `pnpm dev`. (Starts on port 3000)

## Features

- **AI-Enhanced Analysis:** When API keys are provided, the backend uses LangChain and Groq to provide deep cognitive insights for every compiler error, backed by a Chroma vector store for pattern memory.
- **Interactive Dashboard:** Real-time code editing with Monaco, a syntax guide, and an instant feedback loop for error analysis.
- **Cognitive Mapping:** Automatically categorizes mistakes into human-centric patterns (e.g., Mental Model Mismatch).

## Development Conventions

- **AI Logic:** New AI features should be added to `backend/src/ai_analyzer.py`.
- **Error Handling:** The system falls back to static cognitive mappings if AI analysis is unavailable or fails.
