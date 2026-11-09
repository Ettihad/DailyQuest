import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Shield, Calendar, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { PlayerStats } from '../types';

interface StreakSanctuaryProps {
  stats: PlayerStats;
  totalQuestsCount: number;
  completedQuestsCount: number;
}

const PLAYER_TITLES = [
  'Novice Wanderer',
  'Iron Initiate',
  'Sentinel of Will',
  'Vanguard Strategist',
  'Master of Days',
  'Titan of Non-Negotiables',
  'Sovereign of Discipline',
  'Ascended Legend',
];

export const StreakSanctuary: React.FC<StreakSanctuaryProps> = ({
  stats,
  totalQuestsCount,
  completedQuestsCount,
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  // Countdown to midnight in user's local day
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, []);

  const playerLevel = Math.max(1, Math.floor(stats.totalXp / 500) + 1);
  const currentLevelXp = stats.totalXp % 500;
  const levelTitle = PLAYER_TITLES[Math.min(playerLevel - 1, PLAYER_TITLES.length - 1)];

  // Flame tier styling
  const getFlameColor = () => {
    if (stats.streak >= 15) return 'text-purple-400 fill-purple-400 drop-shadow-[0_0_16px_rgba(168,85,247,0.5)]';
    if (stats.streak >= 8) return 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_16px_rgba(6,182,212,0.5)]';
    if (stats.streak >= 4) return 'text-amber-400 fill-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.5)]';
    return 'text-orange-500 fill-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]';
  };

  // Generate last 7 days representation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isToday = i === 6;
    const isCompleted = stats.history[iso] || (isToday && completedQuestsCount === totalQuestsCount && totalQuestsCount > 0);
    return { iso, dayLabel, isCompleted, isToday };
  });

  return (
    <div className="space-y-6">
      {/* Hero Streak Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Flame & Big Counter */}
          <div className="flex items-center gap-6 text-center sm:text-left">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shadow-inner">
                <Flame className={`w-14 h-14 ${getFlameColor()} animate-pulse`} />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-mono font-bold">
                STREAK
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-heading font-extrabold text-5xl sm:text-6xl text-white font-data tracking-tight">
                  {stats.streak}
                </span>
                <span className="text-amber-400 font-heading font-bold text-xl uppercase tracking-wider">
                  Days Unbroken
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
                {stats.streak === 0
                  ? 'Complete your 4-5 non-negotiables today to ignite day 1 of your unbroken streak.'
                  : `You haven’t missed a single day in ${stats.streak} days. Protect the chain at all costs.`}
              </p>
            </div>
          </div>

          {/* Countdown Clock to Midnight Reset */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Quest Reset In</span>
            </div>
            <div className="font-heading font-bold text-2xl text-white font-data">
              {timeUntilReset || '00h 00m 00s'}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Local Midnight Timezone Sync
            </span>
          </div>
        </div>

        {/* 7-Day Unbroken Chain Visual */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <span className="font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>7-Day Chain Momentum</span>
            </span>
            <span className="font-mono text-slate-400">
              Best Streak: <strong className="text-amber-300">{stats.bestStreak} days</strong>
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {last7Days.map((day) => (
              <div
                key={day.iso}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  day.isCompleted
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                    : day.isToday
                    ? 'bg-slate-800/80 border-slate-600 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <span className="text-[11px] font-mono uppercase font-bold mb-1">
                  {day.dayLabel}
                </span>
                {day.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                ) : (
                  <div className={`w-3.5 h-3.5 rounded-full border ${day.isToday ? 'border-amber-400/80 border-dashed animate-spin' : 'border-slate-700'}`} />
                )}
                <span className="text-[10px] mt-1 font-mono">
                  {day.isToday ? 'Today' : day.iso.slice(8)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Level Progression & Streak Shield Safeguards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Level & Rank */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
                  Level {playerLevel}
                </span>
                <h3 className="font-heading font-bold text-lg text-white">
                  {levelTitle}
                </h3>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <span className="text-white font-bold">{stats.totalXp}</span> Total XP
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Next Rank Progress</span>
              <span>{currentLevelXp} / 500 XP</span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                style={{ width: `${(currentLevelXp / 500) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Every completed non-negotiable quest grants XP. Leveling up advances your mental rank and unlocks resilience badges.
          </p>
        </div>

        {/* Streak Shield Mechanics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Anti-Relapse Protection
                </span>
                <h3 className="font-heading font-bold text-lg text-white">
                  {stats.streakShields} Streak {stats.streakShields === 1 ? 'Shield' : 'Shields'} Active
                </h3>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
              PROTECTED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Life happens: emergency flights, sickness, or crises. A <strong>Streak Shield</strong> automatically absorbs a single missed day so your hard-earned streak count does not drop to zero.
          </p>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Earn a bonus Streak Shield every 7 consecutive days of completing all quests.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
