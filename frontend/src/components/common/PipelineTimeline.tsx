import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { StageResult } from '../../types';

interface PipelineTimelineProps {
  stages: StageResult[];
}

const STAGE_LABELS: Record<string, string> = {
  SCHEMA_VALIDATION: '1. Schema & Length',
  UNICODE_NORMALIZATION: '2. Unicode Normalization',
  THREAT_DETECTION: '3. Threat Analysis',
  INTENT_PARSING: '4. Intent Extraction',
  POLICY_ENFORCEMENT: '5. Policy Verification',
  TRANSACTION_EXECUTION: '6. Guarded Execution',
  AUDIT_LOGGING: '7. Audit Ledger',
};

export const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ stages }) => {
  return (
    <div className="space-y-2.5">
      {stages.map((stage, idx) => {
        const isPassed = stage.passed;
        const label = STAGE_LABELS[stage.stage] || stage.stage;

        return (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className={`flex items-start justify-between p-3 rounded-lg border transition-all ${
              isPassed
                ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                : 'bg-rose-950/20 border-rose-900/50 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-200">
                    {label}
                  </span>
                  {!isPassed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                      <ShieldAlert className="w-3 h-3" /> INTERCEPTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                  {stage.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px] whitespace-nowrap pl-3">
              <Clock className="w-3 h-3" />
              <span>{stage.duration_ms.toFixed(1)}ms</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
