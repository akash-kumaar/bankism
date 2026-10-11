import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Filter,
  RefreshCw,
  PieChart as PieIcon,
  ShieldCheck,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { fetchMetrics } from '../services/api';
import type { MetricsData } from '../types';
import { VerdictBadge, ThreatBadge } from '../components/common/Badge';

const VERDICT_COLORS: Record<string, string> = {
  APPROVED: '#10b981',
  BLOCKED: '#ef4444',
  NEEDS_CLARIFICATION: '#f59e0b',
};

const RISK_BUCKET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

export const AnalyticsView: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format verdict data for Pie Chart
  const rawVerdicts = metrics?.verdict_breakdown ?? {
    APPROVED: 0,
    BLOCKED: 0,
    NEEDS_CLARIFICATION: 0,
  };
  const verdictData = Object.entries(rawVerdicts).map(([name, value]) => ({
    name,
    value,
  }));

  // Format threat breakdown data for Bar Chart
  const rawThreats = metrics?.threat_category_breakdown ?? metrics?.threat_breakdown ?? {};
  const threatData = Object.entries(rawThreats)
    .map(([name, value]) => ({
      category: name.replace(/_/g, ' '),
      rawName: name,
      count: value,
    }))
    .sort((a, b) => b.count - a.count);

  // Format risk distribution for Bar Chart
  const rawRisk = metrics?.risk_score_distribution ?? metrics?.risk_distribution ?? {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  };
  const riskData = Object.entries(rawRisk).map(([range, count]) => ({
    range: `${range} Risk`,
    count,
  }));

  // Filter events
  const allEvents = metrics?.recent_activity ?? metrics?.recent_events ?? [];
  const filteredEvents = allEvents.filter((e) => {
    if (verdictFilter !== 'ALL' && e.verdict !== verdictFilter) return false;
    if (categoryFilter !== 'ALL' && e.threat_category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Security Analytics & Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated threat intelligence, verdict ratios, risk distribution histograms, and audit stream.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors border border-slate-800 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs text-amber-300 font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Telemetry notice: {error} (Offline mode active)</span>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 text-[11px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Top 3 Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verdict Distribution Donut */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase flex items-center gap-2">
              <PieIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verdict Distribution</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {metrics?.total_requests || 0} Total
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verdictData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {verdictData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={VERDICT_COLORS[entry.name] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-xs font-mono pt-2 border-t border-slate-800">
            {verdictData.map((v) => (
              <div key={v.name} className="text-center">
                <div className="text-slate-400 text-[10px] uppercase">{v.name.slice(0, 4)}</div>
                <div
                  className="font-bold text-sm"
                  style={{ color: VERDICT_COLORS[v.name] || '#64748b' }}
                >
                  {v.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Score Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Risk Score Buckets</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {metrics ? `Total: ${metrics.total_requests}` : 'Standby'}
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskData.map((_, index) => (
                    <Cell
                      key={`risk-bar-${index}`}
                      fill={RISK_BUCKET_COLORS[index % RISK_BUCKET_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 text-center">
            Calibrated multi-signal severity distribution
          </div>
        </div>

        {/* Threat Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Threat Category Breakdown</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {threatData.length} Categories
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              {threatData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                  No threat events detected
                </div>
              ) : (
                <BarChart
                  layout="vertical"
                  data={threatData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={9}
                    width={90}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 text-center">
            Ranked frequency of interception vectors
          </div>
        </div>
      </div>

      {/* Filterable Audit Stream Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Audit Event Log Stream ({filteredEvents.length})</span>
          </h3>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Verdict:</span>
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value="ALL">All Verdicts</option>
                <option value="APPROVED">APPROVED</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="NEEDS_CLARIFICATION">CLARIFICATION</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Threat:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="NONE">NONE (BENIGN)</option>
                <option value="PROMPT_INJECTION">PROMPT INJECTION</option>
                <option value="SYSTEM_OVERRIDE">SYSTEM OVERRIDE</option>
                <option value="JAILBREAK_ROLEPLAY">JAILBREAK ROLEPLAY</option>
                <option value="AUTHORIZATION_BYPASS">AUTHORIZATION BYPASS</option>
                <option value="MALICIOUS_MEMO">MALICIOUS MEMO</option>
                <option value="UNICODE_OBFUSCATION">UNICODE OBFUSCATION</option>
                <option value="REPEATED_ATTACK">REPEATED ATTACK</option>
                <option value="AMBIGUOUS_INTENT">AMBIGUOUS INTENT</option>
                <option value="POLICY_VIOLATION">POLICY VIOLATION</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-mono uppercase text-slate-500 border-b border-slate-800">
              <tr>
                <th className="pb-2.5">Time</th>
                <th className="pb-2.5">Request ID</th>
                <th className="pb-2.5">Prompt Preview</th>
                <th className="pb-2.5">Verdict</th>
                <th className="pb-2.5">Threat Category</th>
                <th className="pb-2.5 text-right">Risk Score</th>
                <th className="pb-2.5 text-right">Committed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-mono">
                    {error ? 'Telemetry server unreachable.' : 'No events match the selected criteria.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.request_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 text-cyan-400/90 text-[11px]">
                      {evt.request_id}
                    </td>
                    <td className="py-2.5 font-sans text-slate-200 max-w-sm truncate">
                      {evt.prompt_preview}
                    </td>
                    <td className="py-2.5">
                      <VerdictBadge verdict={evt.verdict} size="sm" />
                    </td>
                    <td className="py-2.5">
                      <ThreatBadge category={evt.threat_category} />
                    </td>
                    <td className="py-2.5 text-right font-bold">
                      <span
                        className={
                          evt.risk_score <= 25
                            ? 'text-emerald-400'
                            : evt.risk_score <= 60
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {evt.risk_score}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={evt.action_executed ? 'text-emerald-400' : 'text-slate-500'}>
                        {evt.action_executed ? 'YES' : 'NO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
