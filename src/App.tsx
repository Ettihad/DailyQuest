/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CountryWeatherBar } from './components/CountryWeatherBar';
import { QuestCard } from './components/QuestCard';
import { OnboardingModal } from './components/OnboardingModal';
import { AddWeatherGuideModal } from './components/AddWeatherGuideModal';
import { VictoryModal } from './components/VictoryModal';
import {
  PlayerStats,
  Quest,
  UserProfile,
  WeatherData,
} from './types';
import { soundManager } from './utils/sound';
import { triggerConfetti } from './utils/confetti';
import {
  storage,
  defaultQuests,
  getTodayDateString,
  getYesterdayDateString,
} from './utils/storage';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => storage.loadProfile());
  const [stats, setStats] = useState<PlayerStats>(() => storage.loadStats());
  const [quests, setQuests] = useState<Quest[]>(() => {
    const loadedProfile = storage.loadProfile();
    return storage.loadQuests(loadedProfile);
  });
  const [weather, setWeather] = useState<WeatherData | null>(() => storage.loadWeather());
  const [vibeSummary, setVibeSummary] = useState<string>(() => storage.loadVibeSummary());

  // Modals & States: Always start with the AI check-in questionnaire open when app loads
  const [isCheckInOpen, setIsCheckInOpen] = useState(true);
  const [isWeatherGuideOpen, setIsWeatherGuideOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  // Always open AI question check-in screen when app is loaded
  useEffect(() => {
    setIsCheckInOpen(true);
  }, []);

  // 24-hour reset countdown clock to midnight in user's local timezone
  useEffect(() => {
    const calcReset = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilReset(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };
    calcReset();
    const interval = setInterval(calcReset, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live weather
  const fetchWeatherForLocation = useCallback(
    async (country: string, city?: string, lat?: number, lng?: number) => {
      try {
        let url = `/api/weather?country=${encodeURIComponent(country)}`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        if (lat !== undefined && lng !== undefined) url += `&lat=${lat}&lng=${lng}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setWeather(json.data);
            storage.saveWeather(json.data);
          }
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      }
    },
    []
  );

  useEffect(() => {
    fetchWeatherForLocation(profile.country, profile.city);
  }, [fetchWeatherForLocation, profile.country, profile.city]);

  // Geolocation auto-detection with GPS + Network IP fallback
  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setStatusNotice('Detecting coordinates via GPS...');

    const resolveWithIp = async () => {
      try {
        setStatusNotice('Resolving location via network IP...');
        const res = await fetch('/api/weather?autoIp=true');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setWeather(json.data);
            storage.saveWeather(json.data);
            setProfile((prev) => {
              const updated = {
                ...prev,
                country: json.data.country || prev.country,
                city: json.data.city || prev.city,
              };
              storage.saveProfile(updated);
              return updated;
            });
            setStatusNotice(`Location updated: ${json.data.city || json.data.country}`);
            setTimeout(() => setStatusNotice(null), 2500);
            return;
          }
        }
      } catch (e) {
        console.warn('IP fallback failed:', e);
      }
      setStatusNotice('Location could not be detected. Please choose your city.');
      setTimeout(() => setStatusNotice(null), 3000);
    };

    if (!navigator.geolocation) {
      await resolveWithIp();
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data) {
              setWeather(json.data);
              storage.saveWeather(json.data);
              setProfile((prev) => {
                const updated = {
                  ...prev,
                  country: json.data.country || prev.country,
                  city: json.data.city || prev.city,
                };
                storage.saveProfile(updated);
                return updated;
              });
              setStatusNotice(`Location updated: ${json.data.city || json.data.country}`);
              setTimeout(() => setStatusNotice(null), 2500);
            }
          }
        } catch {
          await resolveWithIp();
        } finally {
          setIsDetecting(false);
        }
      },
      async () => {
        // If GPS permission denied or blocked in iframe, smoothly resolve via network IP
        await resolveWithIp();
        setIsDetecting(false);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  // Generate Quests based on Country, City, Mood, Capacity & Accurate Weather
  const handleGenerateQuests = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    storage.saveProfile(newProfile);
    storage.setOnboarded(true);

    // Refresh weather in background without blocking quest generation
    fetchWeatherForLocation(newProfile.country, newProfile.city);

    try {
      const res = await fetch('/api/quest/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: newProfile.country,
          city: newProfile.city,
          mood: newProfile.mood,
          capacity: newProfile.capacity,
          weather: weather,
          localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          specificGoal: newProfile.specificGoal,
        }),
      });

      const json = await res.json();
      if (json.data) {
        if (json.data.vibeSummary) {
          setVibeSummary(json.data.vibeSummary);
          storage.saveVibeSummary(json.data.vibeSummary);
        }
        if (json.data.quests && Array.isArray(json.data.quests)) {
          const fresh = json.data.quests.slice(0, 5).map((q: Quest) => ({
            ...q,
            completed: false,
          }));
          setQuests(fresh);
          storage.saveQuests(fresh);
          soundManager.playLevelUp(stats.soundEnabled);
          triggerConfetti(undefined, undefined, false);
          setStatusNotice('Generated 4–5 custom quests for today.');
          setTimeout(() => setStatusNotice(null), 3000);
        }
      }
    } catch {
      setStatusNotice('Error generating quests. Default tasks remain active.');
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  // Toggle Quest Completion
  const handleToggleQuest = (id: string, e: React.MouseEvent) => {
    const today = getTodayDateString();

    const updated = quests.map((q) => {
      if (q.id === id) {
        const next = !q.completed;
        return { ...q, completed: next, completedAt: next ? new Date().toISOString() : undefined };
      }
      return q;
    });

    setQuests(updated);
    storage.saveQuests(updated);

    const target = updated.find((q) => q.id === id);
    const isNowDone = target?.completed;

    if (isNowDone) {
      soundManager.playQuestComplete(stats.soundEnabled);
      triggerConfetti(e.clientX, e.clientY, false);

      const xpGain = target?.xp || 80;
      const allDone = updated.every((q) => q.completed);

      setStats((prev) => {
        let newStreak = prev.streak;
        let bestStreak = prev.bestStreak;
        const history = { ...prev.history };

        // If ALL tasks completed today within 24 hours!
        if (allDone && !prev.history[today]) {
          newStreak = prev.streak + 1;
          bestStreak = Math.max(bestStreak, newStreak);
          history[today] = true;

          setTimeout(() => {
            soundManager.playVictoryFanfare(prev.soundEnabled);
            triggerConfetti(undefined, undefined, true);
            setIsVictoryOpen(true);
          }, 300);
        }

        const nextStats: PlayerStats = {
          ...prev,
          totalXp: prev.totalXp + xpGain,
          totalCompleted: prev.totalCompleted + 1,
          streak: newStreak,
          bestStreak,
          lastActiveDate: today,
          streakShields: 0,
          history,
        };
        storage.saveStats(nextStats);
        return nextStats;
      });
    } else {
      soundManager.playQuestUncheck(stats.soundEnabled);
      const xpLoss = target?.xp || 80;
      setStats((prev) => {
        let newStreak = prev.streak;
        const history = { ...prev.history };

        // If today was previously marked completed in history, but now a quest is unchecked:
        // Streak counter should only hit 1 (or stay incremented) when ALL tasks are completed
        if (history[today]) {
          delete history[today];
          newStreak = Math.max(0, prev.streak - 1);
        }

        const nextStats: PlayerStats = {
          ...prev,
          totalXp: Math.max(0, prev.totalXp - xpLoss),
          totalCompleted: Math.max(0, prev.totalCompleted - 1),
          streak: newStreak,
          history,
        };
        storage.saveStats(nextStats);
        return nextStats;
      });
    }
  };

  // Swap an individual quest
  const handleSwapQuest = async (id: string) => {
    const idx = quests.findIndex((q) => q.id === id);
    if (idx === -1) return;

    soundManager.playClick(stats.soundEnabled);
    setStatusNotice('Finding another task for you...');

    try {
      const res = await fetch('/api/quest/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Swap task "${quests[idx].title}". Give 1 short title and 1 sentence description for category ${quests[idx].category}. Ensure it fits the weather.`,
          context: { country: profile.country, city: profile.city, weather },
        }),
      });
      const data = await res.json();
      const updated = [...quests];
      updated[idx] = {
        ...updated[idx],
        title: data.reply ? data.reply.split('.')[0].slice(0, 45) : '15-min stretch & mental reset',
        description: data.reply ? data.reply.slice(0, 110) : 'Take 15 minutes away from screens to reset and stretch.',
      };
      setQuests(updated);
      storage.saveQuests(updated);
      setStatusNotice('Task swapped.');
      setTimeout(() => setStatusNotice(null), 2000);
    } catch {
      setStatusNotice('Could not swap right now.');
      setTimeout(() => setStatusNotice(null), 2000);
    }
  };

  const completedCount = quests.filter((q) => q.completed).length;
  const totalCount = quests.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;
  const currentDayNumber = allDone ? Math.max(1, stats.streak) : stats.streak + 1;

  // 7-Day Unbroken Streak Chain
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isToday = i === 6;
    const isCompleted = stats.history[iso] || (isToday && allDone);
    return { iso, dayName, isCompleted, isToday };
  });

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        quests={quests}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
        onToggleSound={() => {
          setStats((prev) => {
            const next = { ...prev, soundEnabled: !prev.soundEnabled };
            storage.saveStats(next);
            return next;
          });
        }}
        onScrollToQuest={(id) => {
          const el = document.getElementById(`quest-card-${id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-amber-400');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-amber-400');
            }, 1200);
          }
        }}
      />

      {/* Floating Status Toast */}
      {statusNotice && (
        <div className="max-w-xs mx-auto mt-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs text-slate-300 font-mono flex items-center justify-center gap-1.5 shadow-lg animate-in fade-in duration-150">
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-5 sm:py-6 space-y-4">
        {/* MAIN STREAK & SUMMARY CARD */}
        <div className="bg-[#10131d] border border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            {/* Streak Number & Day Indicator */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                    {allDone ? `Day ${currentDayNumber} Completed` : `Day ${currentDayNumber}`}
                  </span>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="font-heading font-extrabold text-2xl text-white">
                      {stats.streak}
                    </span>
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      {stats.streak === 1 ? 'Day Streak' : 'Days Streak'}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                  {stats.streak === 0
                    ? 'Check all tasks today to hit your 1-day streak'
                    : `Best: ${stats.bestStreak}d · 1 missed day resets streak`}
                </span>
              </div>
            </div>

            {/* 24-hr Countdown */}
            <div className="text-right text-xs font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Must complete in</span>
              <span className="text-white font-bold">{timeUntilReset || '00:00:00'}</span>
            </div>
          </div>

          {/* Vibe / Mood note */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {vibeSummary}
          </p>

          {/* Progress Bar & Counter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                {allDone ? (
                  <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>All {totalCount} completed for today</span>
                  </span>
                ) : (
                  <span>{completedCount} of {totalCount} quests completed</span>
                )}
              </span>
              <span className="text-white font-bold">{progressPercent}%</span>
            </div>

            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 7-Day Week Chain Visual */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Week progress:</span>
            </div>
            <div className="flex items-center gap-2">
              {last7Days.map((d) => (
                <div key={d.iso} className="flex flex-col items-center gap-1" title={`${d.iso}: ${d.isCompleted ? 'Done' : 'Not done'}`}>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                      d.isCompleted
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : d.isToday
                        ? 'border border-amber-400/80 text-amber-300'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {d.dayName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Territory & Accurate Weather Bar */}
        <CountryWeatherBar
          weather={weather}
          onDetectLocation={handleDetectLocation}
          onOpenWeatherGuide={() => setIsWeatherGuideOpen(true)}
          isDetecting={isDetecting}
        />

        {/* TODAY'S QUEST */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <div>
              <h2 className="font-heading font-extrabold text-lg sm:text-xl text-white tracking-tight flex items-center gap-2">
                <span>Today's Quest</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  Day {currentDayNumber}
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                2 productive anchors + 3 fun side quests (24h window)
              </span>
            </div>
            <button
              onClick={() => setIsCheckInOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Ask AI Again
            </button>
          </div>

          <div className="space-y-2.5">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onToggle={handleToggleQuest}
                onSwapQuest={handleSwapQuest}
              />
            ))}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Daily Check-in modal asking Location, Mood, Capacity */}
      <OnboardingModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onGenerate={handleGenerateQuests}
        initialProfile={profile}
        currentWeather={weather}
        onDetectLocation={handleDetectLocation}
        isDetecting={isDetecting}
      />

      {/* 2. Accurate Weather & Rain Safeguard Guide */}
      <AddWeatherGuideModal
        isOpen={isWeatherGuideOpen}
        onClose={() => setIsWeatherGuideOpen(false)}
        onSelectCountryCity={(c, ct) => {
          setProfile((prev) => {
            const next = { ...prev, country: c, city: ct };
            storage.saveProfile(next);
            return next;
          });
          fetchWeatherForLocation(c, ct);
          setStatusNotice(`Switched location to ${ct}, ${c}.`);
          setTimeout(() => setStatusNotice(null), 2500);
        }}
        onDetectLocation={handleDetectLocation}
        currentWeather={weather}
      />

      {/* 3. Victory Modal when all tasks are checked within 24 hours */}
      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        stats={stats}
      />
    </div>
  );
}
