"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingDown, TrendingUp, Scale, Brain,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, ActivitySquare, Check
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BehaviorWindow {
  avg_calories: number;
  avg_protein_g: number;
  weekday_avg: number;
  weekend_avg: number;
  weekend_spike_kcal: number;
  logging_days: number;
  protein_adherence_pct: number;
}

interface InsightData {
  status: "ready" | "insufficient_data" | "error";
  window_days: number;
  avg_intake_kcal: number;
  observed_rate_kg_week: number;
  maintenance_estimate_kcal: number;
  recommended_adjustment_kcal: number;
  new_target_kcal: number;
  confidence_score: number;
  confidence_label: "High" | "Moderate" | "Low" | "Insufficient";
  confidence_reasons: string[];
  ai_explanation: string | null;
  behavior: BehaviorWindow;
  pending_insight_id: number | null;
}

interface WeightEntry {
  date_logged: string;
  weight_kg: number;
  trend_weight: number;
}

type ChartTooltipPoint = {
  color: string;
  name: string;
  value: number;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPoint[];
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm shadow-xl shadow-zinc-200/50">
      <p className="text-zinc-500 mb-2 font-medium text-xs">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6 mt-1">
          <span className="text-zinc-600 flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="text-zinc-900 font-semibold">{p.value} kg</span>
        </div>
      ))}
    </div>
  );
}

// ─── Weight Logger ───────────────────────────────────────────────────────────

function WeightLogger({ onLogged }: { onLogged: () => void }) {
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || isNaN(Number(weight))) return;
    setLoading(true);
    try {
      await apiFetch("/weight/", {
        method: "POST",
        body: JSON.stringify({ weight_kg: Number(weight) }),
      });
      setDone(true);
      setWeight("");
      onLogged();
      setTimeout(() => setDone(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Scale className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Morning Weight</h3>
            <p className="text-sm text-zinc-500">Log once daily, after waking up</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleLog} className="flex items-center gap-3 mt-6">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.1"
            min="30"
            max="300"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="e.g., 72.4"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10 font-medium"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">kg</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
            done
              ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200"
              : "bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 shadow-sm"
          }`}
        >
          {loading ? "..." : done ? "Saved!" : "Log Weight"}
        </button>
      </form>
    </div>
  );
}

// ─── Stat Row ────────────────────────────────────────────────────────────────

function StatRow({ label, value, unit = "", highlight = false, warn = false }: {
  label: string; value: string | number; unit?: string;
  highlight?: boolean; warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-zinc-500 font-medium">{label}</span>
      <span className={`text-base font-semibold tracking-tight ${
        highlight ? "text-blue-600" : warn ? "text-amber-600" : "text-zinc-900"
      }`}>
        {value}{unit && <span className="text-zinc-500 font-medium ml-1 text-sm">{unit}</span>}
      </span>
    </div>
  );
}

// ─── Confidence Badge ────────────────────────────────────────────────────────

function ConfidenceBadge({ label, score }: { label: string; score: number }) {
  const color = label === "High" ? "text-emerald-700 bg-emerald-50 ring-emerald-200"
    : label === "Moderate" ? "text-amber-700 bg-amber-50 ring-amber-200"
    : label === "Low" ? "text-red-700 bg-red-50 ring-red-200"
    : "text-zinc-600 bg-zinc-100 ring-zinc-200";

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label} Match · {Math.round(score * 100)}%
    </span>
  );
}

// ─── Methodology Section ─────────────────────────────────────────────────────

function MethodologySection() {
  const [open, setOpen] = useState(false);

  const items = [
    { step: "1", title: "Smoothing out the noise", desc: "Your weight naturally fluctuates daily due to water, digestion, and sodium. We gently smooth these out to find your true weight." },
    { step: "2", title: "Finding your real trend", desc: "Instead of just comparing your first and last weigh-in, we look at your entire history to see the real direction your weight is heading." },
    { step: "3", title: "Calculating your metabolism", desc: "By comparing what you eat to how your weight changes, we figure out exactly how many calories your body burns on an average day." },
    { step: "4", title: "Safe, small adjustments", desc: "We never suggest extreme changes. Target adjustments are capped at 150 calories at a time to keep your metabolism happy." },
    { step: "5", title: "Quality first", desc: "Zoro only makes a recommendation when you've consistently tracked both your food and your weight. We don't guess." },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-zinc-900">How Zoro works behind the scenes</span>
        </div>
        {open
          ? <ChevronUp className="w-5 h-5 text-zinc-400" />
          : <ChevronDown className="w-5 h-5 text-zinc-400" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 space-y-5 bg-white">
              {items.map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 mb-1">{item.title}</p>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = async () => {
    try {
      const [insightPayload, weightPayload] = await Promise.all([
        apiFetch("/insights/latest"),
        apiFetch("/weight/history?days=28"),
      ]);
      setInsight(insightPayload);
      setWeightHistory(weightPayload.entries ?? []);
    } catch {
      // Ignore transient dashboard fetch errors and keep the empty state.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (action: "apply" | "dismiss") => {
    if (!insight?.pending_insight_id) return;
    setApplying(true);
    try {
      const data = await apiFetch("/insights/apply", {
        method: "POST",
        body: JSON.stringify({ insight_id: insight.pending_insight_id, action }),
      });
      if (action === "apply") setSuccessMsg(data.message);
      await fetchData();
    } finally { setApplying(false); }
  };

  const chartData = weightHistory.map(e => ({
    date: new Date(e.date_logged).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    Raw: parseFloat(e.weight_kg.toFixed(1)),
    Trend: parseFloat(e.trend_weight.toFixed(2)),
  }));

  const b = insight?.behavior;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Analytics</h1>
        <p className="text-base text-zinc-500 mt-1">
          Your personal data, analyzed continuously to optimize your diet.
        </p>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-800">
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 rounded-2xl bg-zinc-200 animate-pulse" />
            <div className="h-48 rounded-2xl bg-zinc-200 animate-pulse" />
          </div>
          <div className="h-72 rounded-2xl bg-zinc-200 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Row 1: Weight Logger + 7-Day Behavior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <WeightLogger onLogged={fetchData} />

            {b && (
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                      <ActivitySquare className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">7-Day Habits</h3>
                      <p className="text-sm text-zinc-500">{b.logging_days} of 7 days logged recently</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <StatRow label="Weekday average" value={b.weekday_avg.toFixed(0)} unit="kcal" />
                  <StatRow label="Weekend average" value={b.weekend_avg.toFixed(0)} unit="kcal"
                    warn={b.weekend_spike_kcal > 200} />
                  <StatRow label="Average protein" value={b.avg_protein_g.toFixed(0)} unit="g" />
                  
                  {b.weekend_spike_kcal > 200 && (
                    <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        You&apos;re eating about <strong>{b.weekend_spike_kcal.toFixed(0)} more calories</strong> on weekends. Try to keep it steady!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Weight Trend Chart */}
          {chartData.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">28-Day Weight Trend</h3>
                    <p className="text-sm text-zinc-500">Your true progress over the last month</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-sm font-medium text-zinc-600 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-300" />
                    Daily Log
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    True Trend
                  </div>
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f4f4f5" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 500 }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={["auto", "auto"]} 
                      dx={-10}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area 
                      type="monotone" 
                      dataKey="Raw" 
                      stroke="#d4d4d8" 
                      strokeWidth={1.5}
                      fill="none" 
                      dot={{ r: 3, fill: "#fff", stroke: "#a1a1aa", strokeWidth: 1.5 }} 
                      activeDot={{ r: 5, fill: "#fff", stroke: "#71717a", strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Trend" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#trendGradient)" 
                      dot={false} 
                      activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-12 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scale className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">No weight data yet</h3>
              <p className="text-zinc-500 max-w-sm mx-auto">
                Log your morning weight using the card above to start seeing your 28-day trend.
              </p>
            </div>
          )}

          {/* TDEE Insight or Insufficient Data */}
          {insight?.status === "ready" ? (
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-500/5 border border-blue-100 overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              
              {/* Top bar */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-indigo-500" />
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                      {insight.window_days}-Day Analysis
                    </p>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900">Zoro&apos;s Recommendation</h2>
                </div>
                <ConfidenceBadge label={insight.confidence_label} score={insight.confidence_score} />
              </div>

              {/* AI Explanation */}
              {insight.ai_explanation && (
                <div className="px-8 py-5 bg-indigo-50/50 border-b border-zinc-100">
                  <p className="text-base text-zinc-700 leading-relaxed font-medium">
                    {insight.ai_explanation}
                  </p>
                </div>
              )}

              {/* Metrics */}
              <div className="px-8 py-6 border-b border-zinc-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
                  <StatRow label="You've been eating" value={insight.avg_intake_kcal.toFixed(0)} unit="kcal/day" />
                  <StatRow
                    label="Your weight is moving"
                    value={`${insight.observed_rate_kg_week > 0 ? "+" : ""}${insight.observed_rate_kg_week.toFixed(2)}`}
                    unit="kg/week"
                    highlight={Math.abs(insight.observed_rate_kg_week) > 0.05}
                  />
                  <StatRow label="You burn about" value={insight.maintenance_estimate_kcal.toFixed(0)} unit="kcal/day" />
                  <StatRow
                    label="We suggest changing it by"
                    value={`${insight.recommended_adjustment_kcal > 0 ? "+" : ""}${insight.recommended_adjustment_kcal.toFixed(0)}`}
                    unit="kcal"
                    highlight
                  />
                </div>
              </div>

              {/* New Target */}
              <div className="px-8 py-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50">
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">Proposed New Daily Goal</p>
                  <p className="text-4xl font-black tracking-tight text-zinc-900">
                    {insight.new_target_kcal.toFixed(0)}
                    <span className="text-lg text-zinc-500 font-medium ml-2 tracking-normal">kcal</span>
                  </p>
                </div>
                {insight.recommended_adjustment_kcal !== 0 && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${
                    insight.recommended_adjustment_kcal < 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {insight.recommended_adjustment_kcal < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    {Math.abs(insight.recommended_adjustment_kcal).toFixed(0)} kcal
                  </div>
                )}
              </div>

              {/* Confidence detail */}
              <div className="px-8 py-6 border-b border-zinc-100">
                <div className="flex items-center justify-between text-sm font-medium text-zinc-700 mb-3">
                  <span>How confident are we?</span>
                  <span>{Math.round(insight.confidence_score * 100)}%</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.confidence_score * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className={`h-full rounded-full ${
                      insight.confidence_score >= 0.75 ? "bg-emerald-500"
                      : insight.confidence_score >= 0.5 ? "bg-amber-500"
                      : "bg-red-500"}`}
                  />
                </div>
                {insight.confidence_reasons.length > 0 && (
                  <ul className="space-y-2">
                    {insight.confidence_reasons.map((r, i) => (
                      <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                        <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actions */}
              {insight.pending_insight_id && (
                <div className="px-8 py-6 flex flex-col sm:flex-row gap-4 bg-zinc-50/80">
                  <button
                    onClick={() => handleAction("apply")}
                    disabled={applying}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-base font-semibold py-3.5 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {applying ? "Applying..." : "Yes, apply this goal"}
                  </button>
                  <button
                    onClick={() => handleAction("dismiss")}
                    disabled={applying}
                    className="flex items-center justify-center gap-2 px-6 text-zinc-600 bg-white border border-zinc-200 text-base font-semibold py-3.5 rounded-xl hover:bg-zinc-50 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <XCircle className="w-5 h-5 text-zinc-400" />
                    Not right now
                  </button>
                </div>
              )}
            </div>

          ) : insight?.status === "insufficient_data" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Gathering Data</h3>
              <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                Zoro needs a bit more consistent tracking before recommending a calorie adjustment. Here&apos;s what we still need:
              </p>
              
              {insight.confidence_reasons.length > 0 && (
                <div className="space-y-3 text-left">
                  {insight.confidence_reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-zinc-700 font-medium">{r}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Methodology */}
          <MethodologySection />
        </>
      )}
    </div>
  );
}
