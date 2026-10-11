import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  Send,
  CheckCircle2,
  AlertOctagon,
  CreditCard,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { executeTransfer, fetchAccounts, fetchTransactions } from '../services/api';
import { Account, InspectResponse, Transaction } from '../types';
import { VerdictBadge } from '../components/common/Badge';

export const SimulatorView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [sourceId, setSourceId] = useState('acc_chk_101');
  const [recipient, setRecipient] = useState('Alice Walker');
  const [amount, setAmount] = useState('150.00');
  const [memo, setMemo] = useState('Dinner reimbursement');
  const [lastResult, setLastResult] = useState<InspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accs, txs] = await Promise.all([fetchAccounts(), fetchTransactions()]);
      setAccounts(accs);
      setTransactions(txs);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load banking state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      setSubmitting(true);
      setError(null);
      const promptText = `Transfer $${amount} to ${recipient} memo: ${memo}`;
      const res = await executeTransfer({
        source_account_id: sourceId,
        recipient,
        amount,
        request_text: promptText,
      });

      setLastResult(res);
      // Refresh accounts and transactions immediately
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Transfer execution failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-cyan-400" />
            <span>Guarded Transaction Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulated banking ledger protected by deterministic invariant checks. Zero execution without complete policy clearance.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors border border-slate-800 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 font-mono">
          {error}
        </div>
      )}

      {/* Account Balances Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-3 p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center font-mono text-xs text-slate-500">
            {error ? 'Unable to connect to mock bank ledger accounts. Verify backend connectivity.' : 'No accounts available.'}
          </div>
        ) : (
          accounts.map((acc) => (
            <button
              type="button"
              key={acc.id}
              onClick={() => setSourceId(acc.id)}
              aria-pressed={sourceId === acc.id}
              aria-label={`Select ${acc.name} (${acc.id}) as the source account`}
              className={`w-full p-4 rounded-xl border cursor-pointer transition-all text-left ${
                sourceId === acc.id
                  ? 'bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{acc.id}</span>
                <CreditCard className={`w-4 h-4 ${sourceId === acc.id ? 'text-cyan-400' : 'text-slate-500'}`} />
              </div>

              <div className="mt-2">
                <div className="text-sm font-semibold text-slate-200">{acc.name}</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  ${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Limit: ${Number(acc.daily_limit || 0).toLocaleString()}</span>
                <span className="text-emerald-400/80">VERIFIED</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Transfer Form & Result Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guarded Transfer Form */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Guarded Transfer Execution</span>
          </div>

          <form onSubmit={handleTransfer} className="space-y-3.5 text-xs">
            <div>
              <label htmlFor="source-account" className="block text-slate-400 font-mono mb-1">Source Account</label>
              <select
                id="source-account"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id}) - ${Number(a.balance).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transfer-recipient" className="block text-slate-400 font-mono mb-1">Recipient Name</label>
              <div className="space-y-1.5">
                <input
                  id="transfer-recipient"
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Alice Walker"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-sans focus:outline-none focus:border-cyan-500"
                  required
                />
                <div className="flex gap-1.5 flex-wrap">
                  {['Alice Walker', 'Bob Martinez', 'Charlie Chen', 'Unknown Hacker'].map((rec) => (
                    <button
                      type="button"
                      key={rec}
                      onClick={() => setRecipient(rec)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        rec === 'Unknown Hacker'
                          ? 'bg-rose-950/30 text-rose-300 border-rose-800/40 hover:bg-rose-900/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="transfer-amount" className="block text-slate-400 font-mono mb-1">Amount (USD - Decimal Precision)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-mono">$</span>
                <input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 pl-7 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="transfer-memo" className="block text-slate-400 font-mono mb-1">Memo / Transfer Purpose</label>
              <input
                id="transfer-memo"
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="e.g. Monthly rent reimbursement"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-sans focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold font-sans tracking-wide transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>COMMITTING TO FIREWALL...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>EXECUTE GUARDED TRANSFER</span>
                </>
              )}
            </button>
          </form>

          {/* Invariant guarantee callout */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-cyan-400 font-semibold">POLICY INVARIANT GUARANTEE:</div>
            <p>If blocked, 0 funds are deducted and no ledger record is created.</p>
          </div>
        </div>

        {/* Transaction History Ledger & Result Card */}
        <div className="lg:col-span-2 space-y-4">
          {/* Last Attempt Verdict Display */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={`p-4 rounded-xl border ${
                  lastResult.action_executed
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {lastResult.action_executed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="font-bold text-sm text-white">
                      {lastResult.action_executed ? 'Transfer Committed Successfully' : 'Transfer Hard-Blocked'}
                    </span>
                  </div>
                  <VerdictBadge verdict={lastResult.verdict} size="sm" />
                </div>
                <p className="text-xs text-slate-300 mt-1.5 font-sans">
                  {lastResult.summary}
                </p>
                {lastResult.transaction_id && (
                  <div className="text-[11px] font-mono text-emerald-400 mt-1">
                    TXN Ref: {lastResult.transaction_id}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Immutable Ledger Table */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Simulated Transaction Ledger ({transactions.length})</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Atomic In-Memory Ledger
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-mono uppercase text-slate-500 border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur">
                  <tr>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Recipient</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Memo</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 font-sans font-medium text-slate-200">
                        {tx.recipient}
                      </td>
                      <td className="py-2.5 font-bold text-emerald-400">
                        ${Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-slate-400 font-sans text-xs max-w-xs truncate">
                        {tx.memo || '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No transactions executed in this session yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
