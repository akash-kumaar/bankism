import React from 'react';
import {
  Layers,
  Shield,
  CheckCircle2,
  Lock,
  AlertTriangle,
  FileCode2,
  Cpu,
  Database,
  ArrowRight,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>Architecture, Threat Model & Trust Controls</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Complete structural specifications of the Bankism defensive perimeter, deterministic execution invariants, and threat matrix.
        </p>
      </div>

      {/* 7-Stage Pipeline Visual Architecture Diagram */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>7-Stage Deterministic Defense-in-Depth Pipeline</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 font-mono text-xs">
          {[
            {
              num: '1',
              title: 'Schema Validation',
              detail: 'Pydantic bounds & payload length cap (<=1000 chars)',
              color: 'border-cyan-500/30 text-cyan-400',
            },
            {
              num: '2',
              title: 'Unicode Normalization',
              detail: 'NFKC + strip zero-width + BIDI detection',
              color: 'border-indigo-500/30 text-indigo-400',
            },
            {
              num: '3',
              title: 'Threat Detection',
              detail: 'Multi-signal injection, jailbreak & memo rule scanner',
              color: 'border-rose-500/30 text-rose-400',
            },
            {
              num: '4',
              title: 'Intent Parsing',
              detail: 'Strict grammar extraction (Zero hallucination)',
              color: 'border-amber-500/30 text-amber-400',
            },
            {
              num: '5',
              title: 'Policy Engine',
              detail: 'Recipient allowlists, Decimal funds & $5k limits',
              color: 'border-emerald-500/30 text-emerald-400',
            },
            {
              num: '6',
              title: 'Guarded Execution',
              detail: 'Atomic ledger debit/credit only if Stage 1-5 passed',
              color: 'border-purple-500/30 text-purple-400',
            },
            {
              num: '7',
              title: 'Audit Logging',
              detail: 'Immutable session telemetry & finding records',
              color: 'border-blue-500/30 text-blue-400',
            },
          ].map((st) => (
            <div
              key={st.num}
              className={`p-3 rounded-xl bg-slate-950/80 border ${st.color} flex flex-col justify-between`}
            >
              <div>
                <div className="text-[10px] font-bold text-slate-500">STAGE {st.num}</div>
                <div className="font-bold text-xs mt-1 text-slate-200 font-sans">{st.title}</div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-sans font-normal leading-relaxed">
                {st.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Boundaries & Invariants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Core Security Invariants (Deterministic)</span>
          </h2>

          <div className="space-y-2.5 text-xs text-slate-300 font-sans">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-mono font-bold text-cyan-400 block mb-0.5">
                INVARIANT 1: Zero Direct Execution
              </span>
              Untrusted natural-language text is NEVER passed to a tool caller or authorized to execute arbitrary banking transactions directly.
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-mono font-bold text-cyan-400 block mb-0.5">
                INVARIANT 2: Non-Overridable Hard-Blocks
              </span>
              High-severity threat detections (e.g. prompt injection, jailbreaks) trigger an immutable HARD BLOCK that can never be downgraded by a low risk score.
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-mono font-bold text-cyan-400 block mb-0.5">
                INVARIANT 3: Strict Decimal Precision Accounting
              </span>
              All financial math is performed using Python's `Decimal` type to eliminate IEEE-754 binary floating-point representation vulnerabilities.
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-mono font-bold text-cyan-400 block mb-0.5">
                INVARIANT 4: Verified Recipient Allowlist
              </span>
              Transfers to unknown recipients, unverified entities, or homoglyph-spoofed aliases are categorically rejected.
            </div>
          </div>
        </div>

        {/* Threat Model Matrix */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <span>Threat Model & Mitigation Matrix</span>
          </h2>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="text-[10px] font-mono uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Attack Vector</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">Defensive Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                <tr>
                  <td className="py-2 font-mono text-[11px] text-slate-200">Direct Prompt Injection</td>
                  <td className="py-2 font-mono text-[11px] text-rose-400">CRITICAL</td>
                  <td className="py-2 text-slate-400">Rule catalogue & delimiter break detection</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[11px] text-slate-200">Jailbreak / Roleplay (DAN)</td>
                  <td className="py-2 font-mono text-[11px] text-rose-400">HIGH</td>
                  <td className="py-2 text-slate-400">Persona & unconstrained roleplay heuristic block</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[11px] text-slate-200">Policy Override Simulation</td>
                  <td className="py-2 font-mono text-[11px] text-amber-400">HIGH</td>
                  <td className="py-2 text-slate-400">Admin override keyword neutralization</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[11px] text-slate-200">Unicode Homoglyph Attack</td>
                  <td className="py-2 font-mono text-[11px] text-amber-400">HIGH</td>
                  <td className="py-2 text-slate-400">NFKC normalization + confusable detection</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[11px] text-slate-200">SQL/XSS Memo Payloads</td>
                  <td className="py-2 font-mono text-[11px] text-rose-400">HIGH</td>
                  <td className="py-2 text-slate-400">Sanitization & dangerous syntax detection</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-[11px] text-slate-200">Ambiguous Transfer Request</td>
                  <td className="py-2 font-mono text-[11px] text-blue-400">LOW</td>
                  <td className="py-2 text-slate-400">NEEDS_CLARIFICATION grammar rejection</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Safeguards vs Known Limitations */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Fiduciary Safeguards & Known Limitations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-400">
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block">LLM Role & Trust Boundary</span>
            <p>
              If an auxiliary LLM classifier is enabled, its output is treated strictly as untrusted advisory input. An LLM's classification can increase risk scores but can NEVER authorize a transfer or downgrade a detected threat.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block">Simulation Scope</span>
            <p>
              All accounts and financial transactions within Bankism are fully simulated mock models. No live banking APIs (SWIFT, ACH, FedNow) are connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
