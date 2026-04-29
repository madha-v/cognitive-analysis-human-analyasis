import os
from typing import List, Dict, Optional
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_huggingface import HuggingFaceEmbeddings
from src.errors import CompilerError

load_dotenv()

class AIAnalyzer:
    def __init__(self):
        # Initialize Groq LLM
        self.llm = ChatGroq(
            model_name="llama-3.3-70b-versatile",
            temperature=0.1,
            groq_api_key=os.getenv("GROQ_API_KEY")
        )
        
        # Initialize Local Embeddings (Sentence Transformers)
        # This avoids 404 errors from Gemini API and runs locally
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Initialize Vector Store (Chroma)
        self.vector_store = Chroma(
            collection_name="session_errors",
            embedding_function=self.embeddings,
            persist_directory="./backend/chroma_db"
        )
        
        self.analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert in cognitive science and programming education. "
                       "Provide deep cognitive insights into compiler errors."),
            ("human", "Source Code:\n```c\n{source_code}\n```\n\n"
                      "Technical Error:\nPhase: {phase}\nType: {error_type}\nMessage: {message}\n"
                      "Line: {line}\n\n"
                      "Provide:\n"
                      "1. Cognitive Category\n2. Deep Cognitive Reason\n3. Pedagogical Suggestion")
        ])

        self.chat_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a Cognitive Coding Tutor. You have access to the user's recent compiler errors and cognitive analysis results for this session. "
                       "Use the provided context to answer their questions about their mistakes and how to improve. "
                       "Be encouraging and pedagogical. Use Markdown for formatting."),
            MessagesPlaceholder(variable_name="history"),
            ("human", "Context (Recent Errors):\n{context}\n\nUser Question: {question}")
        ])

    async def analyze_errors(self, source_code: str, errors: List[CompilerError], session_id: str = "default") -> List[CompilerError]:
        if not errors:
            return []

        for error in errors:
            try:
                chain = self.analysis_prompt | self.llm
                response = await chain.ainvoke({
                    "source_code": source_code,
                    "phase": error.phase,
                    "error_type": error.error_type,
                    "message": error.message,
                    "line": error.line,
                    "column": error.column
                })
                
                content = response.content
                lines = content.split('\n')
                for line in lines:
                    if "Cognitive Category:" in line:
                        error.cognitive_category = line.split(":", 1)[1].strip()
                    elif "Deep Cognitive Reason:" in line:
                        error.cognitive_reason = line.split(":", 1)[1].strip()
                    elif "Pedagogical Suggestion:" in line:
                        error.suggestion = line.split(":", 1)[1].strip()
                
                if not error.cognitive_reason:
                    error.cognitive_reason = content

                # Index the error for RAG
                self.vector_store.add_texts(
                    texts=[f"Error Type: {error.error_type}\nMessage: {error.message}\nCognitive Category: {error.cognitive_category}\nReason: {error.cognitive_reason}"],
                    metadatas=[{"session_id": session_id, "type": error.error_type}]
                )
                
            except Exception as e:
                print(f"AI Analysis failed: {e}")
        
        return errors

    async def chat(self, question: str, session_id: str, history: List[Dict[str, str]]) -> str:
        # Retrieve context from session-specific errors
        docs = self.vector_store.similarity_search(
            question, 
            k=5, 
            filter={"session_id": session_id}
        )
        context = "\n---\n".join([d.page_content for d in docs])
        
        # Format history
        chat_history = []
        for msg in history[-5:]: # Last 5 messages
            if msg["role"] == "user":
                chat_history.append(HumanMessage(content=msg["content"]))
            else:
                chat_history.append(AIMessage(content=msg["content"]))

        chain = self.chat_prompt | self.llm
        response = await chain.ainvoke({
            "history": chat_history,
            "context": context if context else "No specific errors recorded in this session yet.",
            "question": question
        })
        
        return response.content
