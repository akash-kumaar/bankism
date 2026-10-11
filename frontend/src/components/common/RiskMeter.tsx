import React from 'react';
import { motion } from 'framer-motion';

interface RiskMeterProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, size = 'md', showLabel = true }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine color theme based on score
  const getColor = (s: number) => {
    if (s <= 25) return { stroke: '#10b981', text: 'text-emerald-400', label: 'LOW RISK' };
    if (s <= 60) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'ELEVATED' };
    if (s <= 80) return { stroke: '#f97316', text: 'text-orange-400', label: 'HIGH RISK' };
    return { stroke: '#ef4444', text: 'text-rose-400', label: 'CRITICAL THREAT' };
  };

  const { stroke, text, label } = getColor(normalizedScore);

  const radius = size === 'sm' ? 36 : size === 'lg' ? 64 : 48;
  const strokeWidth = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
        >
          {/* Background track */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score indicator */}
          <motion.circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <motion.span
            className={`font-mono font-bold ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'} ${text}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {normalizedScore}
          </motion.span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">/ 100</span>
        </div>
      </div>

      {showLabel && (
        <span className={`mt-2 font-mono text-xs font-semibold tracking-wider ${text}`}>
          {label}
        </span>
      )}
    </div>
  );
};
