"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Loader2,
  Target,
  Award,
} from "lucide-react";

// Color palette for charts
const CHART_COLORS = [
  "hsl(221, 83%, 53%)",   // blue
  "hsl(262, 83%, 58%)",   // purple
  "hsl(340, 82%, 52%)",   // rose
  "hsl(24, 95%, 53%)",    // orange
  "hsl(142, 71%, 45%)",   // green
  "hsl(47, 96%, 53%)",    // yellow
  "hsl(199, 89%, 48%)",   // sky
  "hsl(326, 80%, 48%)",   // pink
];

interface SessionReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    name: string;
    code: string;
    history: any[];
    messages: any[];
  };
  currentErrors: any[];
}

interface ReportData {
  session_name: string;
  total_errors: number;
  fixed_errors: number;
  current_errors: number;
  category_counts: Record<string, number>;
  phase_counts: Record<string, number>;
  error_details: any[];
  feedback: string;
}

export function SessionReport({
  open,
  onOpenChange,
  session,
  currentErrors,
}: SessionReportProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateReport = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          session_name: session.name,
          errors: session.history,
          current_errors: currentErrors,
          code: session.code,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // Generate report when dialog opens
  React.useEffect(() => {
    if (open && !report && !loading) {
      generateReport();
    }
    if (!open) {
      // Reset on close for fresh data next time
      setReport(null);
      setError("");
    }
  }, [open]);

  // Build chart data
  const categoryChartData = report
    ? Object.entries(report.category_counts).map(([name, value]) => ({
        name: name.length > 18 ? name.substring(0, 16) + "…" : name,
        fullName: name,
        count: value,
      }))
    : [];

  const categoryConfig: ChartConfig = {};
  categoryChartData.forEach((item, i) => {
    categoryConfig[item.name] = {
      label: item.fullName,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  const phaseChartData = report
    ? Object.entries(report.phase_counts).map(([name, value], i) => ({
        name,
        count: value,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
    : [];

  const phaseConfig: ChartConfig = {};
  phaseChartData.forEach((item, i) => {
    phaseConfig[item.name] = {
      label: item.name,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  const fixRate = report && report.total_errors > 0
    ? Math.round((report.fixed_errors / report.total_errors) * 100)
    : 0;

  const fixRateData = [
    { name: "fixed", value: fixRate, fill: fixRate >= 75 ? "hsl(142, 71%, 45%)" : fixRate >= 50 ? "hsl(47, 96%, 53%)" : "hsl(340, 82%, 52%)" },
  ];
  const fixRateConfig: ChartConfig = {
    fixed: { label: "Fix Rate", color: fixRateData[0].fill },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-600" />
            Session Report: {session.name}
          </DialogTitle>
          <DialogDescription>
            Cognitive analysis report with error statistics, patterns, and
            personalized improvement feedback.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
              Generating your cognitive report...
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-500">{error}</p>
            <Button onClick={generateReport} size="sm" variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {report && !loading && (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-4 px-4">
            <div className="space-y-6 pb-4">
              {/* === Summary Stats === */}
              <div className="grid grid-cols-4 gap-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30">
                  <CardContent className="p-4 text-center">
                    <AlertCircle className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-400">
                      {report.total_errors}
                    </p>
                    <p className="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider mt-0.5">
                      Total Errors
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30">
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400">
                      {report.fixed_errors}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider mt-0.5">
                      Errors Fixed
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/30">
                  <CardContent className="p-4 text-center">
                    <Target className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-400">
                      {report.current_errors}
                    </p>
                    <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider mt-0.5">
                      Remaining
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/30">
                  <CardContent className="p-4 text-center">
                    <Award className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
                    <p className="text-2xl font-bold font-heading text-purple-700 dark:text-purple-400">
                      {fixRate}%
                    </p>
                    <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-wider mt-0.5">
                      Fix Rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* === Charts Row === */}
              <div className="grid grid-cols-2 gap-4">
                {/* Bar Chart — Errors by Cognitive Category */}
                {categoryChartData.length > 0 && (
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold font-heading dark:text-white">
                          Errors by Cognitive Category
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ChartContainer
                        config={categoryConfig}
                        className="min-h-[200px] w-full"
                      >
                        <BarChart
                          data={categoryChartData}
                          layout="vertical"
                          margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                        >
                          <CartesianGrid
                            horizontal={false}
                            strokeDasharray="3 3"
                            opacity={0.3}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={120}
                            tick={{ fontSize: 10 }}
                          />
                          <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelKey="fullName"
                                nameKey="fullName"
                              />
                            }
                          />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                            {categoryChartData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Pie Chart — Errors by Phase */}
                {phaseChartData.length > 0 && (
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold font-heading dark:text-white">
                          Errors by Compiler Phase
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ChartContainer
                        config={phaseConfig}
                        className="min-h-[200px] w-full"
                      >
                        <PieChart>
                          <ChartTooltip
                            content={<ChartTooltipContent nameKey="name" />}
                          />
                          <Pie
                            data={phaseChartData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            strokeWidth={2}
                            stroke="hsl(var(--background))"
                          >
                            {phaseChartData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                          />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state for charts */}
                {categoryChartData.length === 0 && phaseChartData.length === 0 && (
                  <Card className="col-span-2 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 text-emerald-200 dark:text-emerald-900/30 mb-3" />
                      <p className="text-sm font-medium">No error data to chart</p>
                      <p className="text-xs mt-1">Write some code with errors to see statistics here</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* === Error Timeline === */}
              {report.error_details.length > 0 && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold font-heading dark:text-white">
                          Error Timeline
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5"
                      >
                        {report.error_details.length} errors
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {report.error_details.map((err, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px]"
                        >
                          <div className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-bold text-red-600 dark:text-red-400 uppercase tracking-tight truncate">
                                {err.error_type}
                              </span>
                              {err.timestamp && (
                                <span className="text-slate-400 font-mono text-[9px] shrink-0">
                                  {err.timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 leading-tight">
                              Line {err.line}: {err.message}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge
                                variant="outline"
                                className="text-[8px] h-3.5 px-1 border-slate-200 dark:border-slate-700 text-slate-400"
                              >
                                {err.cognitive_category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* === AI Feedback === */}
              <Card className="border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-slate-950 dark:to-purple-950/10">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold font-heading dark:text-white">
                      AI Cognitive Feedback
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-[13px] leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {report.feedback}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter showCloseButton={true}>
          <Button
            onClick={generateReport}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
