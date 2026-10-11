import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingDown,
  ArrowRight,
  Layers,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { fetchMetrics } from '../services/api';
import { MetricsData } from '../types';
import { VerdictBadge, ThreatBadge } from '../components/common/Badge';
import { TabId } from '../components/layout/Sidebar';

interface OverviewViewProps {
  onNavigate: (tab: TabId, initialPrompt?: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMetrics();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, delay: i * 0.05 },
    }),
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 font-mono text-cyan-400 text-sm">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING SECURITY TELEMETRY...</span>
        </div>
      </div>
    );
  }

  const total = metrics?.total_requests || 0;
  const blocked = metrics?.blocked_count || 0;
  const approved = metrics?.approved_count || 0;
  const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/40 border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Security Operations Dashboard</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time deterministic protection monitoring natural-language banking commands against prompt injection, jailbreaks, and policy overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('inspector')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <span>TEST FIREWALL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('playground')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
          >
            <span>ATTACK PLAYGROUND</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Error loading live telemetry: {error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Evaluated Invocations</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tracking-tight">
            {total.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Across active demo sessions
          </div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Threats Neutralized</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400 tracking-tight">
            {blocked.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-rose-400/80 font-mono">
            {blockRate}% Interception Rate
          </div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pipeline Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {metrics?.avg_latency_ms.toFixed(1)}ms
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Sub-millisecond deterministic checks
          </div>
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Protected Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            ${parseFloat(metrics?.total_volume_processed || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Guarded ledger commitments
          </div>
        </motion.div>
      </div>

      {/* Two Column: Pipeline Status & Recent Security Interceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Defense In Depth Safeguard Status */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Firewall Safeguards Status</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              7 / 7 ACTIVE
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {[
              { name: 'Schema & Bounds Validator', status: 'ACTIVE', rule: 'Max 1,000 chars, strict JSON' },
              { name: 'Unicode & Homoglyph Analyzer', status: 'ACTIVE', rule: 'NFKC + BIDI + Zero-width stripping' },
              { name: 'Multi-Signal Threat Scanner', status: 'ACTIVE', rule: 'Heuristics + Injection signatures' },
              { name: 'Deterministic Grammar Parser', status: 'ACTIVE', rule: 'Zero hallucinated amounts/targets' },
              { name: 'Policy & Balance Engine', status: 'ACTIVE', rule: 'Decimal funds + Allowlist check' },
              { name: 'Guarded Ledger Committer', status: 'ACTIVE', rule: 'Zero unapproved writes' },
              { name: 'Audit & Telemetry Logger', status: 'ACTIVE', rule: 'Deterministic event tracing' },
            ].map((g, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div>
                  <div className="text-slate-300 font-sans font-medium text-xs">{g.name}</div>
                  <div className="text-[10px] text-slate-500">{g.rule}</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live Session Event Stream */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Recent Inspections Stream</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Live & Seeded Telemetry
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-mono uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-2.5">Prompt Preview</th>
                  <th className="pb-2.5">Verdict</th>
                  <th className="pb-2.5">Threat Category</th>
                  <th className="pb-2.5 text-right">Risk Score</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics?.recent_events.slice(0, 8).map((evt) => (
                  <tr key={evt.request_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 pr-3 text-slate-300 font-sans max-w-xs truncate">
                      {evt.prompt_preview}
                    </td>
                    <td className="py-2.5 pr-2">
                      <VerdictBadge verdict={evt.verdict} size="sm" />
                    </td>
                    <td className="py-2.5 pr-2">
                      <ThreatBadge category={evt.threat_category} />
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono font-bold">
                      <span className={
                        evt.risk_score <= 25 ? 'text-emerald-400' :
                        evt.risk_score <= 60 ? 'text-amber-400' : 'text-rose-400'
                      }>
                        {evt.risk_score}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onNavigate('inspector', evt.prompt_preview)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
