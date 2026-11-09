import React, { useState, useMemo, useEffect } from 'react';
import { X, MapPin, LocateFixed, Loader2, Search, Check } from 'lucide-react';
import { UserProfile, UserMood, WorkCapacity, WeatherData } from '../types';
import { ALL_COUNTRIES } from '../utils/countries';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (profile: UserProfile) => Promise<void>;
  initialProfile: UserProfile;
  currentWeather: WeatherData | null;
  onDetectLocation: () => Promise<void>;
  isDetecting: boolean;
}

const MOODS: Array<{ label: UserMood; desc: string }> = [
  { label: 'Energized', desc: 'High energy, ready for challenges and deep sprints' },
  { label: 'Steady', desc: 'Calm, balanced, ready for consistent progress' },
  { label: 'Low Energy', desc: 'Tired or recovering; prioritize gentle, low-friction wins' },
  { label: 'Stressed', desc: 'Scattered or overwhelmed; need simple, grounding clarity' },
];

const CAPACITIES: Array<{ label: WorkCapacity; desc: string }> = [
  { label: 'Light (1-2 hrs)', desc: 'Quick essentials, mobility, and light tasks' },
  { label: 'Moderate (3-4 hrs)', desc: 'Balanced focus blocks and daily habits' },
  { label: 'Deep Focus (5+ hrs)', desc: 'Full deep work session and major progress' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  initialProfile,
  currentWeather,
  onDetectLocation,
  isDetecting,
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [countryQuery, setCountryQuery] = useState(initialProfile.country || '');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync profile if initialProfile or currentWeather changes from GPS detection
  useEffect(() => {
    if (currentWeather?.country) {
      setProfile((prev) => ({
        ...prev,
        country: currentWeather.country,
        city: currentWeather.city || prev.city,
      }));
      setCountryQuery(currentWeather.country);
    }
  }, [currentWeather?.country, currentWeather?.city]);

  // Filter all 195 countries of the world by search query
  const filteredCountries = useMemo(() => {
    if (!countryQuery.trim()) return ALL_COUNTRIES.slice(0, 15);
    const q = countryQuery.toLowerCase();
    return ALL_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20);
  }, [countryQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onGenerate(profile);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectCountry = (name: string, capital: string) => {
    setProfile((prev) => ({
      ...prev,
      country: name,
      city: prev.city || capital,
    }));
    setCountryQuery(name);
    setShowCountryDropdown(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0f1219] border border-white/10 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          aria-label="Close check-in"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header - Zero Emojis */}
        <div className="mb-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
            Daily AI Check-In
          </span>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight">
            Today's Quests
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Answer a few quick questions to generate your 2 productive anchors and 3 fun side quests adapted to your exact country and live weather.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Question 1: Location with ALL Countries of the World + GPS */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5 relative">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Location (All 195 Countries Available)</span>
              </label>

              {/* Precise GPS Button */}
              <button
                type="button"
                onClick={async () => {
                  await onDetectLocation();
                  if (currentWeather?.country) {
                    setProfile((prev) => ({
                      ...prev,
                      country: currentWeather.country,
                      city: currentWeather.city || prev.city,
                    }));
                    setCountryQuery(currentWeather.country);
                  }
                }}
                disabled={isDetecting}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 font-medium"
              >
                <LocateFixed className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Querying GPS...' : 'Use Current GPS'}</span>
              </button>
            </div>

            {/* Country Autocomplete Selector */}
            <div className="relative">
              <div className="flex items-center px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus-within:border-white/30">
                <Search className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-2" />
                <input
                  type="text"
                  required
                  value={countryQuery}
                  onChange={(e) => {
                    setCountryQuery(e.target.value);
                    setProfile({ ...profile, country: e.target.value });
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  placeholder="Search any country (e.g. Japan, France, Canada, Brazil...)"
                  className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
                />
              </div>

              {/* Country Dropdown List */}
              {showCountryDropdown && filteredCountries.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#141724] border border-white/15 rounded-xl shadow-xl z-30 divide-y divide-white/5">
                  {filteredCountries.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => selectCountry(c.name, c.capital)}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 text-xs text-slate-200 flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Capital: {c.capital}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Municipality / City */}
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                City / Municipality (for local weather & sunset calculation)
              </label>
              <input
                type="text"
                required
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="City name (e.g. Tokyo, London, Toronto, Sydney)"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 text-xs"
              />
            </div>
          </div>

          {/* Question 2: Mood & Energy (Zero Emojis) */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <label className="font-semibold text-white block">
              Current Mood & Energy State
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOODS.map((m) => (
                <button
                  type="button"
                  key={m.label}
                  onClick={() => setProfile({ ...profile, mood: m.label })}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    profile.mood === m.label
                      ? 'bg-white text-slate-950 border-white font-semibold shadow-sm'
                      : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-bold">{m.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 line-clamp-1 ${
                      profile.mood === m.label ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Work Capacity (Zero Emojis) */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <label className="font-semibold text-white block">
              Realistic Work Capacity for Today
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CAPACITIES.map((cap) => (
                <button
                  type="button"
                  key={cap.label}
                  onClick={() => setProfile({ ...profile, capacity: cap.label })}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    profile.capacity === cap.label
                      ? 'bg-white text-slate-950 border-white font-semibold'
                      : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-[11px] font-bold">{cap.label.split(' ')[0]}</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      profile.capacity === cap.label ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {cap.label.replace(/^[^\(]+\(/, '').replace(/\)/, '')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Goal / Specific side quest intent */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <label className="font-semibold text-white block">
              Specific project, side quest, or skill to include? (Optional)
            </label>
            <input
              type="text"
              value={profile.specificGoal || ''}
              onChange={(e) => setProfile({ ...profile, specificGoal: e.target.value })}
              placeholder="e.g. Write chapter, explore neighborhood, make coffee art, ship feature"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-white/30 text-xs"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating quests</span>
              </>
            ) : (
              <span>Generate Today's Quests</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
