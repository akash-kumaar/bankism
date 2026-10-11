import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { PipelineStage } from '../../types';

interface PipelineTimelineProps {
  stages?: PipelineStage[];
}

const STAGE_LABELS: Record<string, string> = {
  SCHEMA_VALIDATION: '1. Input Validation',
  UNICODE_NORMALIZATION: '2. Unicode Normalization',
  THREAT_DETECTION: '3. Threat Detection',
  INTENT_PARSING: '4. Intent Parsing',
  POLICY_ENFORCEMENT: '5. Policy Enforcement',
  TRANSACTION_EXECUTION: '6. Ledger Execution',
  AUDIT_LOGGING: '7. Audit Ledger',
};

export const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ stages = [] }) => {
  if (!stages || stages.length === 0) {
    return (
      <div className="text-xs text-slate-500 font-mono py-4 text-center">
        No pipeline stages recorded for this request.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {stages.map((stage, idx) => {
        const status = stage.status || (stage.passed ? 'PASSED' : 'FLAGGED');
        const isPassed = status === 'PASSED';
        const isSkipped = status === 'SKIPPED';
        const label = stage.stage_name || STAGE_LABELS[stage.stage || ''] || `Stage ${idx + 1}`;
        const duration = stage.execution_time_ms ?? stage.duration_ms ?? 0;
        const details = stage.details || stage.message || '';

        return (
          <motion.div
            key={`${label}-${idx}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className={`flex items-start justify-between p-3 rounded-lg border transition-all ${
              isPassed
                ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                : isSkipped
                ? 'bg-slate-950/40 border-slate-800/60'
                : 'bg-rose-950/20 border-rose-900/50 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isSkipped ? (
                  <Clock className="w-4 h-4 text-slate-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {label}
                  </span>
                  {!isPassed && !isSkipped && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                      <ShieldAlert className="w-3 h-3" /> {status}
                    </span>
                  )}
                  {isSkipped && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                      SKIPPED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                  {details}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px] whitespace-nowrap pl-3">
              <Clock className="w-3 h-3" />
              <span>{duration.toFixed(2)}ms</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
