import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  SearchCode,
  Swords,
  Landmark,
  BarChart3,
  Layers,
} from 'lucide-react';

export type TabId = 'overview' | 'inspector' | 'playground' | 'simulator' | 'analytics' | 'architecture';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: ShieldAlert },
  { id: 'inspector', label: 'Firewall Inspector', icon: SearchCode, tag: 'LIVE' },
  { id: 'playground', label: 'Attack Playground', icon: Swords },
  { id: 'simulator', label: 'Transaction Simulator', icon: Landmark },
  { id: 'analytics', label: 'Security Analytics', icon: BarChart3 },
  { id: 'architecture', label: 'Architecture & Controls', icon: Layers },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0">
      <nav className="space-y-1.5" aria-label="Main Navigation">
        <div className="px-3 py-2 text-[11px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
          Security Console
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                isActive
                  ? 'text-cyan-300 bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.tag && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  {item.tag}
                </span>
              )}

              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Trust & Defense Footer Badge */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-400 font-mono font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>INVARIANT LEVEL 1</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Zero direct execution. Deterministic policy rules cannot be overridden by prompt scoring.
        </p>
      </div>
    </aside>
  );
};
