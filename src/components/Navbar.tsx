import React from 'react';
import { Flame, Volume2, VolumeX, Sparkles, Check } from 'lucide-react';
import { PlayerStats, Quest } from '../types';

interface NavbarProps {
  stats: PlayerStats;
  quests: Quest[];
  onOpenCheckIn: () => void;
  onToggleSound: () => void;
  onScrollToQuest?: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  quests,
  onOpenCheckIn,
  onToggleSound,
  onScrollToQuest,
}) => {
  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;
  const allDone = totalCount > 0 && completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-[#090b10]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      {/* Top Navbar Row */}
      <div className="max-w-2xl mx-auto px-4 h-13 sm:h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-heading font-extrabold text-base tracking-tight text-white">
            DailyQuest
          </span>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{stats.streak}</span>
            <span className="text-[10px] text-amber-400/80 font-normal">
              {stats.streak === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Sound Mute/Unmute */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            title={stats.soundEnabled ? 'Mute sound chimes' : 'Unmute sound chimes'}
            aria-label="Toggle sound"
          >
            {stats.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* New Check-In Button */}
          <button
            onClick={onOpenCheckIn}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold transition-transform active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-slate-950" />
            <span>Check In</span>
          </button>
        </div>
      </div>

      {/* TOP TASK PROGRESS BAR (EACH TASK) */}
      <div className="border-t border-white/5 bg-[#0d1017]/95 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5 sm:gap-3">
          {/* Left Count Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:inline">
              Task Progress
            </span>
            <span
              className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                allDone
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 text-amber-300 border border-white/10'
              }`}
            >
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Segmented Progress Track for EACH Task */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
            {quests.map((q, idx) => {
              const isTaskDone = q.completed;
              return (
                <button
                  key={q.id}
                  onClick={() => onScrollToQuest?.(q.id)}
                  title={`Task ${idx + 1}: ${q.title} (${isTaskDone ? 'Completed' : 'Pending'})`}
                  className={`group relative flex-1 h-3 rounded-full transition-all duration-300 flex items-center justify-center overflow-hidden cursor-pointer ${
                    isTaskDone
                      ? 'bg-gradient-to-r from-amber-400 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.35)] ring-1 ring-emerald-400/50'
                      : 'bg-white/10 hover:bg-white/20 ring-1 ring-white/5'
                  }`}
                >
                  {/* Inner indicator */}
                  {isTaskDone ? (
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3.5] animate-in zoom-in-50 duration-200" />
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-slate-400 opacity-60 group-hover:opacity-100">
                      {idx + 1}
                    </span>
                  )}

                  {/* Tooltip on hover */}
                  <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/20 text-[10px] text-slate-200 px-2 py-0.5 rounded shadow-xl whitespace-nowrap z-50 font-sans font-medium">
                    Task {idx + 1}: {q.category} · {isTaskDone ? 'Done ✓' : 'Pending'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Percentage Indicator */}
          <div className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
            {progressPercent}%
          </div>
        </div>
      </div>
    </header>
  );
};
