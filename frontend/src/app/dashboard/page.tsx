"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { 
  BrainCircuit, Info, AlertCircle, CheckCircle2, BookOpen, 
  History, ChevronDown, ChevronUp, Send, MessageSquare, Sparkles, User,
  Plus, LayoutDashboard, Trash2, Code2, Save, FileText
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { SessionReport } from "@/components/session-report";

// Types
interface Session {
  id: string;
  name: string;
  code: string;
  lastModified: number;
  messages: any[];
  history: any[];
}

// Syntax Guide Content
const syntaxGuide = [
  { label: "Variables", code: "int a = 10;\nfloat b = 5.5;" },
  { label: "Assignment", code: "a = a + 5;" },
  { label: "Arithmetic", code: "+, -, *, /" },
  { label: "Print", code: "print a;" },
  { label: "Comments", code: "// comment" },
];

const DEFAULT_CODE = 'int a = 10;\nfloat b = 2.5;\nprint a + b;';

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Current Session State
  const [code, setCode] = useState(DEFAULT_CODE);
  const [analysis, setAnalysis] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  
  // UI State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Chat Input State
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSessionId, setReportSessionId] = useState<string>('');

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("cognitive_sessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setActiveSessionId(parsed[0].id);
        loadSession(parsed[0]);
      } else {
        createNewSession("Initial Session");
      }
    } else {
      createNewSession("Initial Session");
    }
  }, []);

  // Save active session to localStorage whenever it changes
  useEffect(() => {
    if (!activeSessionId) return;

    const timer = setTimeout(() => {
      saveCurrentSession();
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, messages, history, activeSessionId]);

  const saveCurrentSession = () => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            code,
            messages,
            history,
            lastModified: Date.now()
          };
        }
        return s;
      });
      localStorage.setItem("cognitive_sessions", JSON.stringify(updated));
      return updated;
    });
  };

  const loadSession = (session: Session) => {
    setCode(session.code);
    setMessages(session.messages.length > 0 ? session.messages : [
      { role: 'assistant', content: `Welcome back to session "${session.name}"! I'm your Cognitive Coding Tutor. Ask me anything about your mistakes or how to improve!` }
    ]);
    setHistory(session.history);
    setAnalysis(null);
  };

  const createNewSession = (name: string = "New Session") => {
    const newSession: Session = {
      id: Math.random().toString(36).substring(7),
      name: name.trim() || `Session ${sessions.length + 1}`,
      code: DEFAULT_CODE,
      lastModified: Date.now(),
      messages: [
        { role: 'assistant', content: `Hello! I'm your Cognitive Coding Tutor for "${name}". Ask me anything about your mistakes or how to improve!` }
      ],
      history: []
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem("cognitive_sessions", JSON.stringify(updatedSessions));
    setActiveSessionId(newSession.id);
    loadSession(newSession);
    setNewSessionName("");
    setIsCreatingSession(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    localStorage.setItem("cognitive_sessions", JSON.stringify(updatedSessions));
    
    if (activeSessionId === id) {
      if (updatedSessions.length > 0) {
        setActiveSessionId(updatedSessions[0].id);
        loadSession(updatedSessions[0]);
      } else {
        createNewSession("Initial Session");
      }
    }
  };

  const switchSession = (id: string) => {
    // Save current before switching
    saveCurrentSession();
    
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      loadSession(session);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const analyzeCode = useCallback(async (sourceCode: string, sessionId: string) => {
    if (!sourceCode.trim() || !sessionId) {
      if (!sourceCode.trim()) setAnalysis(null);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: sourceCode, session_id: sessionId }),
      });
      
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      
      const data = await response.json();
      setAnalysis(data);

      if (data.errors && data.errors.length > 0) {
        setHistory(prev => {
          const newErrors = data.errors.filter((newErr: any) => 
            !prev.some(oldErr => 
              oldErr.error_type === newErr.error_type && 
              oldErr.line === newErr.line && 
              oldErr.message === newErr.message
            )
          ).map((err: any) => ({ 
            ...err, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
          }));
          return [...newErrors, ...prev].slice(0, 50);
        });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isChatLoading || !activeSessionId) return;
    
    // Build error context from current analysis
    let errorContext = '';
    if (analysis?.errors && analysis.errors.length > 0) {
      errorContext = analysis.errors.map((err: any) =>
        `[${err.error_type}] Line ${err.line}: ${err.message} | Category: ${err.cognitive_category} | Reason: ${err.cognitive_reason}`
      ).join('\n');
    }

    // Prepend error context to the question so the AI has full session awareness
    const enrichedQuestion = errorContext
      ? `[Current Session Errors]\n${errorContext}\n\n[User Question]\n${input}`
      : input;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: enrichedQuestion,
          session_id: activeSessionId,
          history: messages
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error connecting to the AI services. Please make sure the backend is running and API keys are configured." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { 
      if (activeSessionId) analyzeCode(code, activeSessionId); 
    }, 1500);
    return () => clearTimeout(timer);
  }, [code, activeSessionId, analyzeCode]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors">
      <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 transition-colors z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-500"
          >
            <LayoutDashboard className="w-5 h-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-blue-600" />
            <span className="font-bold tracking-tight text-slate-900 dark:text-white font-heading">CognitiveCompiler</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={loading ? "outline" : "secondary"} className="animate-pulse">
            {loading ? "Analyzing..." : "Real-time Ready"}
          </Badge>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
          <ModeToggle />
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
          <Badge variant="outline" className="text-xs font-mono text-slate-400">ID: {activeSessionId}</Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar (Sessions & Syntax) */}
        <aside className={cn(
          "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
          isSidebarOpen ? "w-72" : "w-0 border-r-0"
        )}>
          {/* Sessions List */}
          <div className="flex flex-col h-1/2 border-b border-slate-100 dark:border-slate-800">
            <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-sm font-heading dark:text-white">Sessions</h2>
              </div>
              <Button size="icon-xs" variant="ghost" onClick={() => setIsCreatingSession(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {isCreatingSession && (
                  <div className="p-2 space-y-2">
                    <Input 
                      autoFocus
                      placeholder="Session name..."
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') createNewSession(newSessionName);
                        if (e.key === 'Escape') setIsCreatingSession(false);
                      }}
                      className="h-8 text-xs"
                    />
                    <div className="flex gap-1">
                      <Button size="xs" className="flex-1" onClick={() => createNewSession(newSessionName)}>Create</Button>
                      <Button size="xs" variant="outline" onClick={() => setIsCreatingSession(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                
                {sessions.map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => switchSession(s.id)}
                    className={cn(
                      "group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                      activeSessionId === s.id 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="truncate flex-1">{s.name}</span>
                    <div className="flex items-center gap-0.5">
                      <Button 
                        size="icon-xs" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportSessionId(s.id);
                          setReportOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all"
                        title="Generate Report"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        size="icon-xs" 
                        variant="ghost" 
                        onClick={(e) => deleteSession(e, s.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Syntax Guide */}
          <div className="flex flex-col h-1/2">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-sm font-heading dark:text-white">Syntax Guide</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {syntaxGuide.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <pre className="p-2 bg-slate-900 text-blue-300 rounded text-[11px] font-mono leading-relaxed">{item.code}</pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Center: Editor & Chat */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 relative transition-colors overflow-hidden">
          {/* Editor — takes remaining space after chat */}
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              defaultLanguage="c"
              theme="vs-light"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontFamily: 'var(--font-geist-mono)',
              }}
            />
          </div>

          {/* Chat Section — pinned to bottom, never pushed off screen */}
          <div className="shrink-0">
            <Collapsible open={isChatOpen} onOpenChange={setIsChatOpen}>
              <CollapsibleTrigger 
                className="flex items-center justify-between w-full px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-b border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm font-heading dark:text-white">Cognitive Tutor Chat</span>
                    {messages.length > 1 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{messages.length - 1}</Badge>
                    )}
                  </div>
                  {isChatOpen ? <ChevronDown className="w-4 h-4 dark:text-slate-400" /> : <ChevronUp className="w-4 h-4 dark:text-slate-400" />}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800" style={{ height: '340px' }}>
                  <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
                    <div className="space-y-4 max-w-4xl mx-auto pb-4">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none prose prose-slate dark:prose-invert prose-sm'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            ) : msg.content}
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                              <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex gap-3 justify-start animate-pulse">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700" />
                          <div className="h-10 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex gap-2 max-w-4xl mx-auto">
                      <Input 
                        placeholder="Ask about your coding patterns..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                      />
                      <Button onClick={handleSendMessage} disabled={isChatLoading} size="icon" className="bg-blue-600 hover:bg-blue-700 border-none shrink-0">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </main>

        {/* Right Panel: Current Analysis & Session History */}
        <aside className="w-96 bg-white dark:bg-slate-950 flex flex-col shrink-0 border-l border-slate-200 dark:border-slate-800 transition-colors overflow-hidden">
          
          {/* Section 1: Current Analysis (Flexible) */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <h2 className="font-semibold text-sm font-heading dark:text-white">Current Analysis</h2>
              </div>
              {analysis?.total_errors === 0 && (
                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-none">Valid</Badge>
              )}
            </div>
            
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full bg-slate-50/30 dark:bg-slate-950/30">
                <div className="p-4 space-y-4">
                  {analysis?.total_errors > 0 ? (
                    analysis.errors.map((error: any, idx: number) => (
                      <Card key={idx} className="border-l-4 border-l-red-500 shadow-sm overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="p-3 pb-1 flex flex-row items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{error.error_type}</span>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-3">
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium font-mono">Line {error.line}: {error.message}</p>
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-[11px] space-y-2">
                            <div className="flex items-start gap-2">
                              <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase text-slate-400 border-slate-200 dark:border-slate-700">Category</Badge>
                              <p className="text-slate-600 dark:text-slate-300 font-semibold">{error.cognitive_category}</p>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Insight:</span> {error.cognitive_reason}
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded border border-blue-100/50 dark:border-blue-900/30">
                              <span className="font-bold">Suggestion:</span> {error.suggestion}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                      <CheckCircle2 className="w-12 h-12 text-emerald-100 dark:text-emerald-900/20 mb-4" />
                      <p className="text-sm font-medium">Ready to analyze</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Section 2: Session History (Retractable) */}
          <Collapsible
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"
              >
                <CollapsibleTrigger 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="flex items-center justify-between w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800"
                >
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <History className="w-4 h-4" />
                      <span className="font-bold text-sm font-heading">Session History</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{history.length}</Badge>
                    </div>
                    {isHistoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </CollapsibleTrigger>

            <CollapsibleContent>
              <ScrollArea className="h-48 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30">
                <div className="p-4 space-y-4">
                  {history.map((err, i) => (
                    <div key={i} className="flex gap-3 items-start pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 text-[11px]">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-900 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">{err.error_type}</span>
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px]">{err.timestamp}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-tight">Line {err.line}: {err.message}</p>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10 italic">No history recorded yet</p>
                  )}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>

          {/* Statistics Footer (Fixed) */}
          <div className="p-4 bg-slate-900 dark:bg-black text-white shrink-0 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Errors</p>
                <p className="text-xl font-bold font-heading">{analysis?.total_errors || 0}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Symbols</p>
                <p className="text-xl font-bold font-heading">{analysis ? Object.keys(analysis.symbol_table).length : 0}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Session Report Dialog */}
      {reportSessionId && (
        <SessionReport
          open={reportOpen}
          onOpenChange={setReportOpen}
          session={(() => {
            const s = sessions.find(sess => sess.id === reportSessionId);
            return s ? {
              id: s.id,
              name: s.name,
              code: reportSessionId === activeSessionId ? code : s.code,
              history: reportSessionId === activeSessionId ? history : s.history,
              messages: reportSessionId === activeSessionId ? messages : s.messages,
            } : { id: '', name: '', code: '', history: [], messages: [] };
          })()}
          currentErrors={reportSessionId === activeSessionId ? (analysis?.errors || []) : []}
        />
      )}
    </div>
  );
}
