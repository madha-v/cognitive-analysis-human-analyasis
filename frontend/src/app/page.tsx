import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Code2, LineChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CognitiveCompiler</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">How it Works</Link>
          <ModeToggle />
          <Button variant="outline" className="hidden sm:inline-flex">Sign In</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none">Get Started</Button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="px-8 pt-20 pb-32 text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight font-heading">
            Analyze the <span className="text-blue-600">Human Mind</span> Through the Lens of a Compiler
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Go beyond technical errors. Our cognitive-aware compiler maps coding mistakes to psychological patterns, 
            helping educators and developers understand the "why" behind every bug.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg border-none text-white">
                Analyze Code Now
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-slate-300 dark:border-slate-700">
              View Documentation
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-8 py-24 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 transition-colors">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-heading">Core Capabilities</h2>
              <p className="text-slate-600 dark:text-slate-400">Advanced analysis features designed for the modern development lifecycle.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <Code2 className="w-10 h-10 text-blue-500 mb-2" />
                  <CardTitle>Multi-Phase Analysis</CardTitle>
                  <CardDescription>
                    Full lexical, syntax, and semantic checks tailored for cognitive detection.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <BrainCircuit className="w-10 h-10 text-purple-500 mb-2" />
                  <CardTitle>Cognitive Mapping</CardTitle>
                  <CardDescription>
                    Automatically categorizes errors into patterns like scope misunderstanding or type confusion.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <LineChart className="w-10 h-10 text-emerald-500 mb-2" />
                  <CardTitle>Rich Reporting</CardTitle>
                  <CardDescription>
                    Get instant HTML and JSON reports with visual distribution of error categories.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-8 py-24 text-center">
          <div className="max-w-3xl mx-auto bg-blue-600 rounded-3xl p-12 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20">
            <h2 className="text-3xl font-bold mb-4 font-heading">Ready to start analyzing?</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Deploy our FastAPI-powered backend and start getting deeper insights into your development process.
            </p>
            <Button variant="secondary" size="lg" className="h-12 px-10 text-blue-700 bg-white hover:bg-blue-50 border-none">
              Get Started for Free
            </Button>
          </div>
        </section>
      </main>

      <footer className="px-8 py-12 bg-slate-900 dark:bg-slate-950 text-slate-400 border-t border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-white">
            <BrainCircuit className="w-6 h-6" />
            <span className="font-bold">CognitiveCompiler</span>
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="text-sm">
            © 2026 Cognitive Analysis Project. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
