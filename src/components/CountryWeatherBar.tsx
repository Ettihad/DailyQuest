import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  LocateFixed,
  HelpCircle,
  CloudRain,
  Sun,
  Cloud,
  Snowflake,
  Zap,
  CloudSun,
} from 'lucide-react';
import { WeatherData } from '../types';

interface CountryWeatherBarProps {
  weather: WeatherData | null;
  onDetectLocation: () => void;
  onOpenWeatherGuide: () => void;
  isDetecting: boolean;
}

export const CountryWeatherBar: React.FC<CountryWeatherBarProps> = ({
  weather,
  onDetectLocation,
  onOpenWeatherGuide,
  isDetecting,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = weather?.timezone;
      try {
        setCurrentTime(
          new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: tz || undefined,
          }).format(now)
        );
      } catch {
        setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [weather?.timezone]);

  const isRaining =
    (weather?.precipitation ?? 0) > 0 ||
    /rain|drizzle|snow|shower|thunder/i.test(weather?.condition || '');

  const renderWeatherIcon = () => {
    const cond = weather?.condition?.toLowerCase() || '';
    if (cond.includes('snow')) return <Snowflake className="w-3.5 h-3.5 text-sky-300" />;
    if (cond.includes('thunder')) return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
    if (cond.includes('cloud') || cond.includes('overcast')) return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
    return <Sun className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* City + Time + Weather */}
        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          <span className="flex items-center gap-1 font-semibold text-white">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {(weather?.city && weather.city !== 'Current Location') ? weather.city : 'Tokyo'},{' '}
              {(weather?.country && weather.country !== 'Earth') ? weather.country : 'Japan'}
            </span>
          </span>

          <span className="text-slate-600">·</span>

          <span className="flex items-center gap-1 font-mono text-slate-300">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{currentTime || '12:00 PM'}</span>
          </span>

          <span className="text-slate-600">·</span>

          <span className="flex items-center gap-1.5 font-medium text-slate-200">
            {renderWeatherIcon()}
            <span>{weather ? `${weather.temperature}°C` : '18°C'}</span>
            <span className="text-slate-400">({weather?.condition || 'Clear'})</span>
          </span>

          <span className="text-slate-600">·</span>

          {/* Explicit Weather Status Tag so user sees mistake prevention */}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
              isRaining
                ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
            }`}
          >
            {isRaining ? 'Rain / Wet conditions (indoor adapted)' : 'Clear conditions (outdoor compatible)'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDetectLocation}
            disabled={isDetecting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors disabled:opacity-50 text-[11px] font-medium"
            title="Auto-detect using GPS"
          >
            <LocateFixed className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting...' : 'Update GPS'}</span>
          </button>

          <button
            onClick={onOpenWeatherGuide}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-[11px]"
            title="How accurate weather works"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Weather guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
