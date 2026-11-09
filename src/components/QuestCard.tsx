import React, { useState } from 'react';
import { Check, Clock, ChevronDown, ChevronUp, RotateCw, Home, MapPin } from 'lucide-react';
import { Quest } from '../types';

interface QuestCardProps {
  quest: Quest;
  onToggle: (id: string, event: React.MouseEvent) => void;
  onSwapQuest?: (id: string) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onToggle, onSwapQuest }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={`quest-card-${quest.id}`}
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 scroll-mt-28 ${
        quest.completed
          ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80'
          : 'bg-[#12151f]/80 hover:bg-[#151926] border-white/10 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Tactile Check Button */}
        <button
          onClick={(e) => onToggle(quest.id, e)}
          className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 mt-0.5 ${
            quest.completed
              ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/40'
              : 'border border-white/20 bg-white/5 hover:border-white/50 text-transparent'
          }`}
          aria-label={quest.completed ? 'Mark quest as incomplete' : 'Mark quest as complete'}
        >
          <Check
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-150 ${
              quest.completed ? 'scale-100 stroke-[3]' : 'scale-0'
            }`}
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Metadata line */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1 flex-wrap">
            {quest.category === 'Side Quest' ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/35 text-amber-300 font-sans font-bold text-[11px] uppercase tracking-wider">
                Fun Side Quest
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-cyan-400/15 border border-cyan-400/35 text-cyan-300 font-sans font-semibold text-[11px] uppercase tracking-wider">
                Productive · {quest.category}
              </span>
            )}
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{quest.estimatedMinutes}m</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400/90 font-medium">+{quest.xp} XP</span>

            {quest.isIndoor === false ? (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Outdoor</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-[11px] text-cyan-400/90 font-sans">
                  <Home className="w-3 h-3" />
                  <span>Indoor</span>
                </span>
              </>
            )}

            {quest.weight && (
              <>
                <span className="text-slate-600">·</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider ${
                    quest.weight === 'Light'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : quest.weight === 'Heavy'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
                  title={`Calibrated to energy state: ${quest.weight}`}
                >
                  {quest.weight === 'Light'
                    ? 'Light Win'
                    : quest.weight === 'Heavy'
                    ? 'Heavy Sprint'
                    : 'Moderate Push'}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-heading font-bold text-base sm:text-lg tracking-tight transition-all ${
              quest.completed
                ? 'line-through text-slate-400 decoration-emerald-400/70'
                : 'text-white'
            }`}
          >
            {quest.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            {quest.description}
          </p>

          {/* Bottom Accordion & Swap */}
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-[11px] font-medium"
            >
              <span>{expanded ? 'Hide why' : 'Why do this'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {onSwapQuest && !quest.completed && (
              <button
                onClick={() => onSwapQuest(quest.id)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-[11px]"
                title="Swap for an alternative task"
              >
                <RotateCw className="w-3 h-3" />
                <span>Swap task</span>
              </button>
            )}
          </div>

          {expanded && (
            <div className="mt-2.5 p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
              <span className="text-amber-400 font-mono text-[10px] uppercase font-bold block mb-0.5">
                Purpose:
              </span>
              <p className="text-[11px] text-slate-200">
                {quest.whyDoThis}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
