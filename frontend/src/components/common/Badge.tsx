import React from 'react';
import { Severity, ThreatCategory, Verdict } from '../../types';

interface VerdictBadgeProps {
  verdict: Verdict;
  size?: 'sm' | 'md' | 'lg';
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-bold',
  };

  const styleClasses = {
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    BLOCKED: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    NEEDS_CLARIFICATION: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider font-mono ${sizeClasses[size]} ${styleClasses[verdict]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        verdict === 'APPROVED' ? 'bg-emerald-400 animate-pulse' :
        verdict === 'BLOCKED' ? 'bg-rose-400' : 'bg-amber-400'
      }`} />
      {verdict.replace('_', ' ')}
    </span>
  );
};

interface SeverityBadgeProps {
  severity: Severity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles = {
    LOW: 'bg-slate-700/50 text-slate-300 border-slate-600',
    MEDIUM: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    HIGH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${styles[severity]}`}>
      {severity}
    </span>
  );
};

interface ThreatBadgeProps {
  category: ThreatCategory;
}

export const ThreatBadge: React.FC<ThreatBadgeProps> = ({ category }) => {
  if (category === 'NONE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
        NONE (BENIGN)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40">
      {category.replace(/_/g, ' ')}
    </span>
  );
};
