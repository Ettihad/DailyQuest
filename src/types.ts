export type QuestCategory = 'Side Quest' | 'Focus' | 'Vitality' | 'Mind' | 'Discipline' | 'Life';
export type QuestWeight = 'Light' | 'Moderate' | 'Heavy';

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  description: string;
  whyDoThis: string;
  estimatedMinutes: number;
  xp: number;
  completed: boolean;
  completedAt?: string;
  isIndoor?: boolean;
  weight?: QuestWeight;
}

export interface WeatherData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  isDay: boolean;
  condition: string;
  icon: string;
  sunrise: string;
  sunset: string;
  fetchedAt: string;
  isSimulated?: boolean;
}

export type UserMood = 'Energized' | 'Steady' | 'Low Energy' | 'Stressed';
export type WorkCapacity = 'Light (1-2 hrs)' | 'Moderate (3-4 hrs)' | 'Deep Focus (5+ hrs)';

export interface UserProfile {
  country: string;
  city: string;
  mood: UserMood;
  capacity: WorkCapacity;
  specificGoal?: string;
}

export interface PlayerStats {
  streak: number;
  bestStreak: number;
  totalCompleted: number;
  totalXp: number;
  lastActiveDate: string; // YYYY-MM-DD
  streakShields: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD' -> true if all completed
  soundEnabled: boolean;
}
