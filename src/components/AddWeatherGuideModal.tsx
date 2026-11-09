import React from 'react';
import {
  X,
  MapPin,
  Clock,
  CloudSun,
  LocateFixed,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { WeatherData } from '../types';

interface AddWeatherGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountryCity: (country: string, city: string) => void;
  onDetectLocation: () => void;
  currentWeather: WeatherData | null;
}

const PRESET_CITIES = [
  { city: 'Tokyo', country: 'Japan', note: 'Fast-paced, high transit' },
  { city: 'London', country: 'United Kingdom', note: 'Frequent overcast & rain' },
  { city: 'New York', country: 'United States', note: 'High tempo, cold winter / hot summer' },
  { city: 'Berlin', country: 'Germany', note: 'Structured focus & recovery' },
  { city: 'Oslo', country: 'Norway', note: 'Sub-zero winters, indoor grit' },
  { city: 'Sydney', country: 'Australia', note: 'High sun, outdoor vitality' },
];

export const AddWeatherGuideModal: React.FC<AddWeatherGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectCountryCity,
  onDetectLocation,
  currentWeather,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#10131d] border border-white/10 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Weather & Location Rules</span>
          </div>
          <h2 className="font-heading font-bold text-xl text-white tracking-tight">
            How accurate weather prevents mistakes
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          To ensure the AI never tells you to go outside when it's pouring rain or freezing, DailyQuest uses live telemetry:
        </p>

        {/* 3 Clear Rules */}
        <div className="space-y-2.5 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <CloudSun className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white block">
                1. Live Open-Meteo Meteorological Sensors
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                We check live temperature, precipitation (mm), humidity, and cloud cover for your city.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white block">
                2. Strict Anti-Rain Safeguard
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                If precipitation &gt; 0 or condition is rain, drizzle, or snow: the AI is strictly forbidden from recommending outdoor walks or runs. Movement tasks automatically switch to indoor mobility.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white block">
                3. Accurate Timezone Clock
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Tracks remaining hours before midnight. Nighttime check-ins focus on winding down and indoor planning, not morning sunlight.
              </p>
            </div>
          </div>
        </div>

        {/* Test Preset Cities */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Test a Location:</span>
            <button
              onClick={() => {
                onDetectLocation();
                onClose();
              }}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
            >
              <LocateFixed className="w-3 h-3" />
              <span>Use Device GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {PRESET_CITIES.map((c) => (
              <button
                key={c.city}
                onClick={() => {
                  onSelectCountryCity(c.country, c.city);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all group"
              >
                <div className="flex items-center justify-between font-bold text-white group-hover:text-amber-300">
                  <span>{c.city}, {c.country}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {c.note}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
