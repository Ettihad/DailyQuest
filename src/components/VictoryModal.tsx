import React from 'react';
import { Flame, CheckCircle2 } from 'lucide-react';
import { PlayerStats } from '../types';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#121520] border border-white/10 rounded-3xl max-w-sm w-full p-6 text-center relative shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <h2 className="text-xl font-heading font-extrabold text-white tracking-tight">
          All Quests Finished
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          You finished all of today’s tasks within 24 hours. Your streak is officially locked in.
        </p>

        {/* Streak Pill */}
        <div className="my-5 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2">
          <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
          <span className="font-heading font-bold text-2xl text-white font-mono">
            {stats.streak}
          </span>
          <span className="text-xs text-slate-400 font-sans">days streak</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
