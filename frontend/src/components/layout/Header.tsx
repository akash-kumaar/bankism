import React, { useEffect, useState } from 'react';
import { Shield, Activity, RefreshCw } from 'lucide-react';
import { fetchHealth } from '../../services/api';
import { HealthStatus } from '../../types';

export const Header: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [pinging, setPinging] = useState(false);

  const checkStatus = async () => {
    try {
      setPinging(true);
      const data = await fetchHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Shield className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-wide text-white">BANKISM</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              BLUE-TEAM FIREWALL
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Natural-Language Defensive Gateway • PromptWars × UVCE
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Environment pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>SIMULATION MODE (SAFE)</span>
        </div>

        {/* Backend health pill */}
        <button
          onClick={checkStatus}
          disabled={pinging}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-xs font-mono transition-all"
          title="Click to re-ping backend health"
        >
          <span className={`w-2 h-2 rounded-full ${health ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`} />
          <span className="text-slate-300">
            {health ? 'BACKEND ONLINE' : 'BACKEND DISCONNECTED'}
          </span>
          <RefreshCw className={`w-3 h-3 text-slate-400 ${pinging ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
