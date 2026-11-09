import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Robust fast model caller with safe 8.5s timeout
async function generateGeminiContent(contents: string, config: any): Promise<string | null> {
  const models = ['gemini-2.5-flash'];

  for (const model of models) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents,
        config: {
          ...config,
          maxOutputTokens: config.maxOutputTokens || 850,
        },
      });

      // 8.5s timeout gives the model ample time (~4s typical) while safeguarding against hangs
      let timeoutHandle: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Model generation timed out')), 8500);
      });

      const response = await Promise.race([callPromise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutHandle);
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} note: ${err?.message || err}. Falling back to daily rotation.`);
    }
  }

  return null;
}

// Helper for weather codes from Open-Meteo
function decodeWeatherCode(code: number): { condition: string; isRainy: boolean; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', isRainy: false, icon: 'Sun' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', isRainy: false, icon: 'CloudSun' };
  if (code === 3) return { condition: 'Overcast', isRainy: false, icon: 'Cloud' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy & Misty', isRainy: false, icon: 'CloudFog' };
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', isRainy: true, icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 65) return { condition: 'Rain', isRainy: true, icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { condition: 'Snowfall', isRainy: true, icon: 'Snowflake' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', isRainy: true, icon: 'CloudRain' };
  if (code >= 95) return { condition: 'Thunderstorm', isRainy: true, icon: 'Zap' };
  return { condition: 'Cloudy', isRainy: false, icon: 'Cloud' };
}

// 1. Weather & Geolocation lookup route
app.get('/api/weather', async (req, res) => {
  try {
    const { country, city, lat, lng, autoIp } = req.query;

    let latitude = lat ? parseFloat(lat as string) : null;
    let longitude = lng ? parseFloat(lng as string) : null;
    let resolvedCity = (city as string && city !== 'Current Location') ? (city as string) : '';
    let resolvedCountry = (country as string && country !== 'Earth') ? (country as string) : '';

    // If autoIp is requested or coordinates are not provided and neither city nor country is provided
    if ((autoIp === 'true' || (!lat && !lng && !resolvedCity && !resolvedCountry)) && (latitude === null || longitude === null)) {
      try {
        const ipRes = await fetch('https://ipwho.is/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.success) {
            latitude = ipData.latitude;
            longitude = ipData.longitude;
            resolvedCity = ipData.city || resolvedCity;
            resolvedCountry = ipData.country || resolvedCountry;
          }
        }
      } catch (err) {
        console.warn('IP lookup failed:', err);
      }
    }

    // If coordinates are provided, reverse-geocode using OpenStreetMap Nominatim with custom User-Agent
    if (latitude !== null && longitude !== null && (!resolvedCity || !resolvedCountry)) {
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'DailyQuestApp/1.0 (dailyquest@applet.dev)',
              'Accept-Language': 'en',
            },
          }
        );
        if (osmRes.ok) {
          const osmData = await osmRes.json();
          const addr = osmData.address || {};
          resolvedCity =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.suburb ||
            addr.village ||
            addr.county ||
            resolvedCity;
          resolvedCountry = addr.country || resolvedCountry;
        }
      } catch (err) {
        console.warn('Nominatim reverse geocode error:', err);
      }
    }

    // Fallback: If still unresolved coordinates, search Open-Meteo geocoding for city/country
    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      const searchTarget = resolvedCity || resolvedCountry || 'Tokyo';
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTarget)}&count=1&language=en&format=json`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            const first = geoData.results[0];
            latitude = first.latitude;
            longitude = first.longitude;
            resolvedCity = resolvedCity || first.name;
            resolvedCountry = resolvedCountry || first.country;
          }
        }
      } catch {
        latitude = 35.6762;
        longitude = 139.6503;
      }
    }

    if (latitude === null || longitude === null) {
      latitude = 35.6762;
      longitude = 139.6503;
    }

    // Guaranteed real fallback (NEVER 'Earth' or 'Current Location')
    resolvedCity = resolvedCity || 'Tokyo';
    resolvedCountry = resolvedCountry || 'Japan';

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);

    if (!weatherRes.ok) {
      throw new Error('Weather API error');
    }

    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const daily = weatherData.daily;

    const weatherInfo = decodeWeatherCode(current.weather_code);

    return res.json({
      success: true,
      data: {
        city: resolvedCity,
        country: resolvedCountry,
        latitude,
        longitude,
        timezone: weatherData.timezone || 'UTC',
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        precipitation: current.precipitation,
        isDay: Boolean(current.is_day),
        condition: weatherInfo.condition,
        icon: weatherInfo.icon,
        sunrise: daily?.sunrise?.[0] ? daily.sunrise[0].split('T')[1] : '06:00',
        sunset: daily?.sunset?.[0] ? daily.sunset[0].split('T')[1] : '18:30',
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    const fallbackCity = (req.query.city as string) && req.query.city !== 'Current Location' ? (req.query.city as string) : 'Tokyo';
    const fallbackCountry = (req.query.country as string) && req.query.country !== 'Earth' ? (req.query.country as string) : 'Japan';
    return res.json({
      success: true,
      data: {
        city: fallbackCity,
        country: fallbackCountry,
        latitude: 35.67,
        longitude: 139.65,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        temperature: 18,
        apparentTemperature: 18,
        humidity: 65,
        windSpeed: 10,
        precipitation: 0,
        isDay: true,
        condition: 'Clear Sky',
        icon: 'Sun',
        sunrise: '06:00',
        sunset: '18:00',
        fetchedAt: new Date().toISOString(),
        isSimulated: true,
      },
    });
  }
});

// 2. Generate 4-5 Custom Quests with Random Fun Side Quests & Zero Emojis
app.post('/api/quest/generate', async (req, res) => {
  try {
    const { country, city, mood, capacity, weather, localTime, specificGoal } = req.body;

    const countryStr = (country && country !== 'Earth') ? country : 'Japan';
    const cityStr = (city && city !== 'Current Location') ? city : 'Tokyo';
    const moodStr = mood || 'Steady';
    const capacityStr = capacity || 'Moderate (3-4 hrs)';
    const timeStr = localTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const isRaining = weather?.precipitation > 0 || /rain|drizzle|snow|thunder|shower/i.test(weather?.condition || '');
    const isNight = weather?.isDay === false;
    const temp = weather?.temperature ?? 18;

    const weatherContext = `${temp}°C, ${weather?.condition || 'Clear Sky'}, Precipitation: ${
      weather?.precipitation ?? 0
    }mm, Daylight: ${weather?.isDay ? 'Daytime' : 'Nighttime'}`;

    const systemInstruction = `You are an imaginative, high-energy daily quest master for real people.
CRITICAL FORMAT RULES:
- STRICT PROHIBITION ON EMOJIS: DO NOT output any emojis anywhere in your response (no emojis in titles, descriptions, whyDoThis, vibeSummary, or tags). Emojis make it look like cheap AI slop. Use clean, plain English text only.
- TONE: Natural, grounded, energetic, human. Zero corporate clichés or medical jargon (do NOT use words like "circadian biology", "suprachiasmatic nucleus", "prefrontal cortex", "dopamine baseline", "tactical directive", "operational parameters", "non-negotiable standards").

MISSION: CURE BOREDOM WHILE KEEPING THE USER PRODUCTIVE:
People open this app because they are bored, stuck in a rut, or procrastinating. The main point of this app is to KILL BOREDOM and make their day genuinely fun, surprising, and memorable, while simultaneously helping them knock out important work.

TASK SELECTION & MIX (EXACT FORMULA - MANDATORY):
- Generate EXACTLY 5 daily quests to be completed within 24 hours.
- BREAKDOWN: EXACTLY 2 PRODUCTIVE TASKS + EXACTLY 3 FUN QUESTS (could be anything fun, creative, wild, weird, dopamine-inducing).

1. THE 2 PRODUCTIVE TASKS (Category: 'Focus' or 'Discipline'):
   - Task 1 (Deep Work / Study): 30-45 minutes on their #1 major goal or craft with phones in another room.
   - Task 2 (Physical / Organization): High-energy physical workout, mobility circuit, or ruthless workspace declutter.

2. THE 3 FUN QUESTS (Category: 'Side Quest'):
   - These 3 tasks must be GENUINELY FUN, PLAYFUL, UNCONVENTIONAL, AND MEMORABLE. They could be anything man!
   - GOING OUT & REAL-WORLD ADVENTURES (WHEN WEATHER ALLOWS):
     * If weather is CLEAR, DRY, or pleasant (precipitation = 0, no rain, drizzle, or snow), at least 1 or 2 of the 3 fun quests CAN and SHOULD involve going out into the real world!
     * Outdoor ideas to draw from:
       - 'The Coin-Flip Navigation Walk': At every intersection for 12 minutes, flip a coin (heads right, tails left) to discover hidden streets. Set isIndoor: false.
       - 'The Local Landmark Detective': Find the oldest building, historical marker, or quirkiest tree in your neighborhood and inspect the details up close. Set isIndoor: false.
       - 'The 10-Minute Coffee Roulette': Walk to a nearby cafe/bakery and ask the barista for their personal favorite drink on the entire menu. Set isIndoor: false.
       - 'The 10-Minute Neighborhood Scout': Walk down an unfamiliar street or alley and spot 2 weird architectural quirks or cool stickers. Set isIndoor: false.
       - 'The 5-Photo Texture Safari': Go outside and take 5 extreme close-up photos of contrasting textures (weathered brick, moss, tree bark, rusty metal). Set isIndoor: false.
       - 'The Secret Agent Stakeout': Sit on a public bench or cafe terrace for 10 minutes and invent playful undercover backstories for 3 passersby. Set isIndoor: false.
       - 'The Sidewalk Sprint Surge': Find a safe clear outdoor stretch and do 3 explosive 30-meter sprints to catch fresh air and an instant adrenaline rush. Set isIndoor: false.
     * Set isIndoor to false for all real-world outdoor adventures.
   - INDOOR FUN SIDE QUESTS:
     * Examples: 'The Mystery Soundtrack Chore' (put on Hans Zimmer/synthwave and wash dishes like saving the world), 'The Micro-Architecture Card Castle' (build a 3-tier tower of cards), 'The 10-Minute Mystery Pantry Chef', 'The Dramatic Ring Announcer Hype', 'Alien Artifact Field Report', 'The 5-Minute Time Capsule Postcard', 'The Micro-Podcast Pilot' (record a 60-second late night radio voice memo on a weird theory), 'Reverse Karaoke Challenge' (mute video and invent improvised lyrics), 'Reverse DJ Roulette', 'The Non-Dominant Hand Portrait', 'Wikipedia Speedrun'.
     * Set isIndoor to true for indoor tasks.

CRITICAL WEATHER & ENVIRONMENT INVARIANTS:
1. Current weather in ${cityStr}, ${countryStr}: ${weatherContext}, local time: ${timeStr}.
2. IF IT IS RAINING, SNOWING, DRIZZLING, OR PRECIPITATION > 0:
   - STRICT PROHIBITION: DO NOT recommend going outside, outdoor walks, runs in the park, or outdoor sunlight.
   - MANDATORY: Keep all 5 tasks strictly indoors (set isIndoor: true for all).
3. IF WEATHER IS CLEAR / DRY:
   - Encourage going outside for at least 1 fun quest (isIndoor: false) so users do not stay cooped up all day!
4. IF IT IS NIGHTTIME:
   - DO NOT suggest morning sunlight. Emphasize evening focus, wind-down, reflection, music, or reading.
CRITICAL MOOD, ENERGY & TASK SIZE/WEIGHT CALIBRATION:
- Current Mood: "${moodStr}", Work Capacity: "${capacityStr}".
- IF MOOD IS 'Low Energy' OR 'Stressed', OR CAPACITY IS 'Light (1-2 hrs)':
  * The user CANNOT do heavy, demanding, or long tasks. Never assign 45-minute deep work grinds, 100 pushups, or overwhelming chores.
  * Sizing: Every task MUST be small, low-friction, and gentle (5 to 15 minutes maximum).
  * Productive task 1: Gentle single-focus micro-win (e.g. 10-15m on 1 small subtask, digital workspace tidy, or 10m brain dump).
  * Productive task 2: Restorative physical reset (e.g. 10m gentle floor spine decompression, cool hydration splash, or shoulder mobility).
  * Side quests: Playful, restorative, and low-friction (e.g. 8m quiet porch sit, 5m paper doodle, warm herbal tea experiment).
  * MANDATORY: Set weight to 'Light' for these tasks.
- IF MOOD IS 'Energized' AND CAPACITY IS 'Deep Focus (5+ hrs)':
  * The user has peak energy and wants serious momentum!
  * Sizing: Ambitious challenges (30 to 45 minutes deep focus, high-output physical circuits).
  * MANDATORY: Set weight to 'Heavy'.
- OTHERWISE (Mood 'Steady' or Capacity 'Moderate (3-4 hrs)'):
  * Sizing: Balanced sustainable tasks (15 to 25 minutes, steady momentum).
  * MANDATORY: Set weight to 'Moderate'.
- In your JSON response, every quest in the quests array MUST include the weight field set to 'Light', 'Moderate', or 'Heavy'.`;

    const promptText = `User Profile:
- Location: ${cityStr}, ${countryStr}
- Current Local Time: ${timeStr}
- Weather: ${weatherContext} (Rain status: ${isRaining ? 'RAINING / WET' : 'CLEAR / DRY'})
- Current Mood: ${moodStr}
- Work Capacity: ${capacityStr}
${specificGoal ? `- Specific Goal: ${specificGoal}` : ''}

Generate EXACTLY 5 tailored tasks for today (2 PRODUCTIVE tasks + 3 FUN side quests).
Crucial: Calibrate the size and weight of each task strictly to their mood (${moodStr}) and work capacity (${capacityStr}). If low energy or stressed, keep tasks to gentle 5-15 min micro-wins with weight 'Light'.
Keep descriptions concise (1 short punchy sentence) and whyDoThis ultra-concise (under 10 words) for maximum speed.
${!isRaining ? 'Weather is good: include at least 1 real-world outdoor adventure (isIndoor: false) to get the user outside!' : 'Weather is wet: keep all 5 tasks strictly indoors (isIndoor: true).'}
Make the fun quests creative, unexpected, and boredom-busting!`;

    const text = await generateGeminiContent(promptText, {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vibeSummary: {
            type: Type.STRING,
            description: 'A 1-sentence friendly summary of today’s vibe based on weather and mood',
          },
          quests: {
            type: Type.ARRAY,
            description: 'Array of exactly 4 or 5 daily quests',
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: {
                  type: Type.STRING,
                  description: 'Crisp, natural task title (under 8 words)',
                },
                category: {
                  type: Type.STRING,
                  description: 'One of: Side Quest, Focus, Vitality, Mind, Discipline, Life',
                },
                description: {
                  type: Type.STRING,
                  description: 'Clear, simple 1-2 sentence instruction on what to do',
                },
                whyDoThis: {
                  type: Type.STRING,
                  description: 'A simple, practical 1-sentence explanation of why this matters today',
                },
                estimatedMinutes: { type: Type.INTEGER },
                xp: { type: Type.INTEGER },
                isIndoor: {
                  type: Type.BOOLEAN,
                  description: 'Set to true if this task should be done indoors, false if outdoors',
                },
                weight: {
                  type: Type.STRING,
                  enum: ['Light', 'Moderate', 'Heavy'],
                  description: 'Calibrated task weight: Light (gentle 5-15m micro-win for low energy), Moderate (15-25m balanced push), or Heavy (25-45m ambitious sprint)',
                },
              },
              required: ['id', 'title', 'category', 'description', 'whyDoThis', 'estimatedMinutes', 'xp', 'isIndoor', 'weight'],
            },
          },
        },
        required: ['vibeSummary', 'quests'],
      },
    });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.quests && Array.isArray(parsed.quests) && parsed.quests.length > 0) {
          return res.json({
            success: true,
            data: parsed,
          });
        }
      } catch (parseError) {
        console.warn('Model response parse note, proceeding to daily rotation.');
      }
    }

    // Dynamic weather-aware anti-boredom rotation that changes EVERY day
    const isRainingFallback =
      req.body.weather?.precipitation > 0 || /rain|snow|drizzle|shower/i.test(req.body.weather?.condition || '');

    const todayDate = new Date().toISOString().split('T')[0];
    let seed = 0;
    for (let i = 0; i < todayDate.length; i++) {
      seed = (seed * 37 + todayDate.charCodeAt(i)) >>> 0;
    }

    const isLowEnergy = moodStr === 'Low Energy' || moodStr === 'Stressed' || capacityStr === 'Light (1-2 hrs)';
    const isHighEnergy = moodStr === 'Energized' && capacityStr === 'Deep Focus (5+ hrs)';
    const targetWeight: 'Light' | 'Moderate' | 'Heavy' = isLowEnergy ? 'Light' : isHighEnergy ? 'Heavy' : 'Moderate';

    const focusPool = [
      // Light (Low Energy / Stressed / Light 1-2 hrs)
      {
        title: req.body.specificGoal ? `Priority reset: ${req.body.specificGoal.slice(0, 28)}` : '15-min single-priority reset',
        category: 'Focus',
        description: 'Put your phone away and pick just 1 tiny deliverable to knock out in 15 quiet minutes.',
        whyDoThis: 'Low-friction micro-wins build momentum without draining depleted energy.',
        estimatedMinutes: 15,
        xp: 80,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: '10-min desktop & tab tidy',
        category: 'Focus',
        description: 'Close all inactive browser tabs, clear pending critical messages, and get your workspace uncluttered.',
        whyDoThis: 'Visual clutter creates mental friction; a 10-min tidy restores instant headspace.',
        estimatedMinutes: 10,
        xp: 75,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: '12-minute paper brain dump',
        category: 'Focus',
        description: 'Write out every nagging thought or task onto blank paper, then highlight only the 1 thing that truly matters today.',
        whyDoThis: 'Externalizing your mental load instantly relieves subconscious anxiety.',
        estimatedMinutes: 12,
        xp: 80,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'The 1-page visual cheatsheet',
        category: 'Focus',
        description: 'Take one workflow, formula, or concept you frequently use and sketch a concise single-page cheat sheet for your desk.',
        whyDoThis: 'Synthesizing knowledge into visual cards cements neural retention.',
        estimatedMinutes: 15,
        xp: 80,
        isIndoor: true,
        weight: 'Light',
      },
      // Moderate (Steady / 3-4 hrs)
      {
        title: req.body.specificGoal ? `Focus sprint: ${req.body.specificGoal.slice(0, 30)}` : '25-min Pomodoro creation sprint',
        category: 'Focus',
        description: 'Work with steady focus on your main priority project for one clean 25-minute block.',
        whyDoThis: 'One uninterrupted block creates steady forward momentum.',
        estimatedMinutes: 25,
        xp: 95,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: '30-min inbox & tab purge blitz',
        category: 'Focus',
        description: 'Close all inactive browser tabs, clear pending critical messages, and get your digital desktop to zero clutter.',
        whyDoThis: 'Visual clutter creates subconscious mental drag; a 30-min purge restores mental clarity.',
        estimatedMinutes: 30,
        xp: 100,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The offline paper architect',
        category: 'Focus',
        description: 'Step away from all screens with pen and blank paper. Map out your next 30-day goals or architectural diagrams.',
        whyDoThis: 'Analogue thinking unlocks spatial creativity that screens suppress.',
        estimatedMinutes: 30,
        xp: 105,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The reverse-engineering heist',
        category: 'Focus',
        description: 'Pick a standout piece of work in your field (a UI, article intro, or code library) and deconstruct how it was built in 20 minutes.',
        whyDoThis: 'Reverse-engineering great work sharpens taste and exposes non-obvious craft secrets.',
        estimatedMinutes: 20,
        xp: 95,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The anti-to-do list massacre',
        category: 'Focus',
        description: 'Write down 5 pending tasks. Ruthlessly delete or decline 4 of them that offer low value, then conquer the single highest-impact one.',
        whyDoThis: 'Subtraction is the highest form of focus.',
        estimatedMinutes: 20,
        xp: 95,
        isIndoor: true,
        weight: 'Moderate',
      },
      // Heavy (Energized / Deep Focus 5+ hrs)
      {
        title: req.body.specificGoal ? `Focus sprint: ${req.body.specificGoal.slice(0, 32)}` : '45-min deep focus sprint',
        category: 'Focus',
        description: 'Put your phone in another room, pick your #1 priority project, and work with zero distraction until the timer rings.',
        whyDoThis: 'Single-tasking with zero phone access gets more done in 45 minutes than half a day of multitasking.',
        estimatedMinutes: 45,
        xp: 120,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'The difficult skill breakdown',
        category: 'Focus',
        description: 'Spend 35 minutes deconstructing one difficult topic or software tool you feel intimidated by. Take 3 bullet notes.',
        whyDoThis: 'Attacking what feels hard builds genuine confidence and mastery.',
        estimatedMinutes: 35,
        xp: 110,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'The dreaded frog task sprint',
        category: 'Focus',
        description: 'Identify the one task on your to-do list you have been postponing the longest. Attack it first for 40 minutes.',
        whyDoThis: 'Finishing your most dreaded task frees up energy for the rest of your day.',
        estimatedMinutes: 40,
        xp: 125,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'The zero-backspace creation sprint',
        category: 'Focus',
        description: 'Write 400 words or build a complete raw prototype without editing, backspacing, or switching tabs for 35 straight minutes.',
        whyDoThis: 'Decoupling raw creation from perfectionism unlocks massive velocity.',
        estimatedMinutes: 35,
        xp: 115,
        isIndoor: true,
        weight: 'Heavy',
      },
    ];

    const disciplinePool = [
      // Light (Gentle resets for low energy)
      {
        title: 'Full-body floor spine & hip reset',
        category: 'Discipline',
        description: 'Lie on the floor for 10 minutes doing gentle cat-cows, knee-to-chest hugs, and deep diaphragmatic breaths.',
        whyDoThis: 'Gentle spinal decompression calms an overtaxed nervous system without physical strain.',
        estimatedMinutes: 10,
        xp: 70,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'Hydration & cool face plunge',
        category: 'Discipline',
        description: 'Drink 500ml of mineral water and splash cold water over your eyes and neck for 30 seconds.',
        whyDoThis: 'Re-hydrates cellular membranes and gently triggers the mammalian dive reflex to clear mental fog.',
        estimatedMinutes: 3,
        xp: 65,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'The 8-minute desk posture release',
        category: 'Discipline',
        description: 'Perform doorframe chest openers, seated spinal twists, and wrist rolls to release forward-head posture tension.',
        whyDoThis: 'Releases muscular constriction from typing and screen-viewing without tiring you out.',
        estimatedMinutes: 8,
        xp: 70,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'The 8-minute shadow boxing flow',
        category: 'Discipline',
        description: 'Put on a groovy track and practice fluid shadow jabs, slips, and balance footwork in front of a mirror with zero phone.',
        whyDoThis: 'Rhythmic martial movement sharpens body coordination and relieves desk tension.',
        estimatedMinutes: 8,
        xp: 75,
        isIndoor: true,
        weight: 'Light',
      },
      // Moderate (Balanced momentum)
      {
        title: '15-min mobility & core circuit',
        category: 'Discipline',
        description: 'Complete 2 gentle rounds: 10 air squats, 15 glute bridges, 30-sec bird-dog, and 1-min child pose stretch.',
        whyDoThis: 'Awakens kinetic chains and improves circulation without exhaustion.',
        estimatedMinutes: 15,
        xp: 80,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The 10-minute design-studio reset',
        category: 'Discipline',
        description: 'Declutter your desk, make your bed with military precision, and wipe down your primary work surfaces.',
        whyDoThis: 'Your physical environment directly mirrors and shapes your psychological clarity.',
        estimatedMinutes: 10,
        xp: 75,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The 10-minute wardrobe purge blitz',
        category: 'Discipline',
        description: 'Open your closet and pull 3 garments you have not worn in 6 months to donate or toss. Instantly declutter your space.',
        whyDoThis: 'Physical pruning reflects mental decisiveness and removes daily decision fatigue.',
        estimatedMinutes: 10,
        xp: 80,
        isIndoor: true,
        weight: 'Moderate',
      },
      // Heavy (High energy challenge)
      {
        title: 'Power workout circuit',
        category: 'Discipline',
        description: 'Complete 3 rounds: 15 pushups, 20 squats, 30-sec plank, and 20 explosive jumping jacks to power up your body.',
        whyDoThis: 'A short physical surge triggers endorphins and destroys sluggishness immediately.',
        estimatedMinutes: 15,
        xp: 90,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'The 100-rep split challenge',
        category: 'Discipline',
        description: 'Accumulate 100 bodyweight reps (50 pushups + 50 squats) distributed in quick micro-sets across today.',
        whyDoThis: 'Intermittent micro-movement keeps your metabolism and alert state elevated all day.',
        estimatedMinutes: 20,
        xp: 100,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'Isometric endurance test',
        category: 'Discipline',
        description: 'Hold a wall-sit for 60 seconds, rest 30s, then perform 2 sets of maximum time doorframe dead-hangs or planks.',
        whyDoThis: 'Isometrics build tendon resilience and mental tenacity with zero equipment.',
        estimatedMinutes: 12,
        xp: 85,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'The strict breathwork & isometric lock',
        category: 'Discipline',
        description: 'Perform 3 cycles of deep box breathing followed immediately by a maximum-effort 90-second plank hold.',
        whyDoThis: 'Combines autonomic downregulation with supreme physical willpower.',
        estimatedMinutes: 10,
        xp: 90,
        isIndoor: true,
        weight: 'Heavy',
      },
    ];

    const outdoorFunPool = [
      // Light
      {
        title: 'The 8-minute porch or park bench sit',
        category: 'Side Quest',
        description: `Step outside into the fresh air in ${req.body.city || 'your area'}, find a quiet bench or stoop, and just breathe with eyes closed for 8 minutes.`,
        whyDoThis: 'Gentle fresh air and natural ambient sounds calm sensory overload with zero effort.',
        estimatedMinutes: 8,
        xp: 75,
        isIndoor: false,
        weight: 'Light',
      },
      {
        title: 'The horizon golden hour watch',
        category: 'Side Quest',
        description: 'Step outside at sunset or afternoon break and watch the clouds and horizon for 6 uninterrupted minutes.',
        whyDoThis: 'Natural optical flow and sky observation calms the nervous system.',
        estimatedMinutes: 8,
        xp: 75,
        isIndoor: false,
        weight: 'Light',
      },
      {
        title: 'The outdoor soundscape map',
        category: 'Side Quest',
        description: 'Step outside, close your eyes for 5 minutes, and count how many distinctly different acoustic sound sources you can hear.',
        whyDoThis: 'Acoustic mindfulness expands auditory bandwidth and dials down internal rumination.',
        estimatedMinutes: 7,
        xp: 75,
        isIndoor: false,
        weight: 'Light',
      },
      // Moderate
      {
        title: 'The 10-minute neighborhood scout',
        category: 'Side Quest',
        description: `Step outside into the fresh air in ${req.body.city || 'your area'}, walk down an unfamiliar street, and spot 2 unexpected architectural details or street art.`,
        whyDoThis: 'Going outside breaks screen fatigue, delivers sunlight, and immediately kills boredom.',
        estimatedMinutes: 10,
        xp: 90,
        isIndoor: false,
        weight: 'Moderate',
      },
      {
        title: 'The 5-photo texture safari',
        category: 'Side Quest',
        description: 'Step outside and take 5 extreme macro close-ups of contrasting textures: rough tree bark, aged brick, moss, weathered metal, and glass reflections.',
        whyDoThis: 'Focusing your eyes on microscopic physical textures resets visual attention.',
        estimatedMinutes: 12,
        xp: 85,
        isIndoor: false,
        weight: 'Moderate',
      },
      {
        title: 'The coin-flip navigation walk',
        category: 'Side Quest',
        description: 'Step out your door. At every intersection for 12 minutes, flip a coin: heads turn right, tails turn left. See where serendipity takes you.',
        whyDoThis: 'Relinquishing control to chance disrupts rigid cognitive loops and uncovers hidden corners.',
        estimatedMinutes: 12,
        xp: 90,
        isIndoor: false,
        weight: 'Moderate',
      },
      {
        title: 'The local landmark detective',
        category: 'Side Quest',
        description: 'Locate the oldest visible building, historical marker, or quirkiest tree in your neighborhood. Inspect the details up close.',
        whyDoThis: 'Micro-exploration builds local roots and transforms ordinary commutes into mini-adventures.',
        estimatedMinutes: 15,
        xp: 90,
        isIndoor: false,
        weight: 'Moderate',
      },
      // Heavy
      {
        title: 'The sidewalk sprint surge',
        category: 'Side Quest',
        description: 'Find an open outdoor stretch or hill and perform 3 explosive 30-meter sprints to catch fresh air and an instant adrenaline rush.',
        whyDoThis: 'Short maximal sprints deliver a massive flood of dopamine and natural alertness.',
        estimatedMinutes: 10,
        xp: 95,
        isIndoor: false,
        weight: 'Heavy',
      },
      {
        title: 'Unusual local order mission',
        category: 'Side Quest',
        description: 'Walk to a nearby cafe, bakery, or convenience store and order a snack, pastry, or beverage you have never tasted before.',
        whyDoThis: 'Novel gustatory experiences disrupt monotony and spark playful curiosity.',
        estimatedMinutes: 15,
        xp: 95,
        isIndoor: false,
        weight: 'Heavy',
      },
      {
        title: 'The secret agent stakeout',
        category: 'Side Quest',
        description: 'Sit on a public bench or cafe patio for 10 minutes and invent playful undercover backstories for 3 interesting passersby.',
        whyDoThis: 'Playful character invention exercises theory of mind and observational comedy.',
        estimatedMinutes: 10,
        xp: 90,
        isIndoor: false,
        weight: 'Heavy',
      },
    ];

    const indoorFunPool = [
      // Light
      {
        title: 'Alien artifact field report',
        category: 'Side Quest',
        description: 'Inspect an ordinary household object (like a mug, shoe, or stapler) and write a 2-sentence humorous scientific report as if you are an extraterrestrial observing humans.',
        whyDoThis: 'Engages playful lateral thinking and humor, proving that anything can be fun when looked at differently.',
        estimatedMinutes: 5,
        xp: 75,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'The non-dominant hand portrait',
        category: 'Side Quest',
        description: 'Draw a 60-second portrait of an animal or self-portrait using only your non-dominant hand.',
        whyDoThis: 'Forces neuroplastic engagement and guarantees a good laugh at the bizarre result with minimal effort.',
        estimatedMinutes: 4,
        xp: 70,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'The mystery soundtrack chore',
        category: 'Side Quest',
        description: 'Put on an epic cinematic soundtrack (Hans Zimmer or synthwave) and wash dishes or wipe surfaces as if the fate of the galaxy depends on it.',
        whyDoThis: 'Absurd juxtaposition makes banal household tasks unexpectedly thrilling.',
        estimatedMinutes: 5,
        xp: 75,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'The 5-minute time capsule postcard',
        category: 'Side Quest',
        description: 'Jot down a 3-sentence note to your future self exactly 1 year from today with 1 wild prediction and 1 reminder.',
        whyDoThis: 'Broadens your temporal horizon and provides deep perspective in minutes.',
        estimatedMinutes: 5,
        xp: 75,
        isIndoor: true,
        weight: 'Light',
      },
      {
        title: 'Reverse DJ roulette',
        category: 'Side Quest',
        description: 'Pick a musical genre you normally ignore (e.g. ambient jazz, synthwave, lo-fi harp), listen to 1 full track, and identify 2 things you like about the production.',
        whyDoThis: 'Expanding your aesthetic palate stimulates novel auditory neural pathways.',
        estimatedMinutes: 6,
        xp: 70,
        isIndoor: true,
        weight: 'Light',
      },
      // Moderate
      {
        title: 'The dramatic hype-man voice note',
        category: 'Side Quest',
        description: 'Send an unexpected 20-second audio note to a friend hyping them up like a legendary boxing ring announcer before a title fight.',
        whyDoThis: 'Spreading genuine energy takes 1 minute and reliably boosts your own mood for hours.',
        estimatedMinutes: 5,
        xp: 80,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The 10-minute pantry mystery chef',
        category: 'Side Quest',
        description: 'Create a wild new snack or warm beverage using only 3 unusual ingredients in your kitchen. Plate it like a Michelin restaurant.',
        whyDoThis: 'Playful culinary experimentation breaks boredom instantly with tactile fun.',
        estimatedMinutes: 10,
        xp: 85,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'Hallway aerodynamics championship',
        category: 'Side Quest',
        description: 'Fold 3 distinctly different paper airplane designs and run distance flight trials down your hallway to find the ultimate glide champion.',
        whyDoThis: 'A lighthearted physical experiment that breaks screen fatigue.',
        estimatedMinutes: 8,
        xp: 75,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The micro-architecture card castle',
        category: 'Side Quest',
        description: 'Take a deck of cards or business cards and engineer a 3-tier card tower on your desk without letting it fall.',
        whyDoThis: 'Extreme fine-motor focus forces immediate mindfulness and tactile calm.',
        estimatedMinutes: 8,
        xp: 80,
        isIndoor: true,
        weight: 'Moderate',
      },
      {
        title: 'The micro-podcast pilot',
        category: 'Side Quest',
        description: 'Record a 60-second voice memo explaining the weirdest fact or conspiracy theory you know using your best late-night radio host cadence.',
        whyDoThis: 'Unfiltered vocal performance sparks verbal creativity and instant laughter.',
        estimatedMinutes: 4,
        xp: 75,
        isIndoor: true,
        weight: 'Moderate',
      },
      // Heavy
      {
        title: 'The 5-click Wikipedia speedrun',
        category: 'Side Quest',
        description: 'Click "Random Article" on Wikipedia and attempt to navigate to "Ancient Rome" or "Coffee" in 5 clicks or fewer.',
        whyDoThis: 'A gamified intellectual curiosity puzzle that turns random learning into a sport.',
        estimatedMinutes: 8,
        xp: 80,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'The reverse karaoke challenge',
        category: 'Side Quest',
        description: 'Put on a music video with sound muted and sing or lip-sync your own improvised narrative lyrics with 100% emotional dedication.',
        whyDoThis: 'High-energy silliness instantly demolishes self-consciousness and stress.',
        estimatedMinutes: 5,
        xp: 85,
        isIndoor: true,
        weight: 'Heavy',
      },
      {
        title: 'The origami master challenge',
        category: 'Side Quest',
        description: 'Fold a paper crane, jumping frog, or geometric box using only scrap paper without looking at a tutorial if possible.',
        whyDoThis: 'Tactile spatial puzzles provide deep dopamine satisfaction when completed.',
        estimatedMinutes: 8,
        xp: 80,
        isIndoor: true,
        weight: 'Heavy',
      },
    ];

    const filterByWeight = <T extends { weight?: string }>(arr: T[]): T[] => {
      const matching = arr.filter((x) => x.weight === targetWeight);
      return matching.length > 0 ? matching : arr;
    };

    const activeFocusPool = filterByWeight(focusPool);
    const activeDisciplinePool = filterByWeight(disciplinePool);
    const activeOutdoorPool = filterByWeight(outdoorFunPool);
    const activeIndoorPool = filterByWeight(indoorFunPool);

    const usedTitles = new Set<string>();
    const pickUnique = <T extends { title: string }>(arr: T[], salt: number): T => {
      for (let i = 0; i < arr.length; i++) {
        const item = arr[(seed + (salt + i) * 19) % arr.length];
        if (!usedTitles.has(item.title)) {
          usedTitles.add(item.title);
          return item;
        }
      }
      return arr[(seed + salt * 19) % arr.length];
    };

    const selectedFocus = pickUnique(activeFocusPool, 1);
    const selectedDiscipline = pickUnique(activeDisciplinePool, 2);

    let side1: any;
    let side2: any;
    let side3: any;

    if (!isRainingFallback) {
      side1 = pickUnique(activeOutdoorPool, 3);
      side2 = pickUnique(activeIndoorPool, 4);
      side3 = (seed % 2 === 0) ? pickUnique(activeOutdoorPool, 7) : pickUnique(activeIndoorPool, 8);
    } else {
      side1 = pickUnique(activeIndoorPool, 3);
      side2 = pickUnique(activeIndoorPool, 5);
      side3 = pickUnique(activeIndoorPool, 9);
    }

    const fallbackQuests = {
      vibeSummary: isRainingFallback
        ? `Rainy day in ${req.body.city || 'your area'}. Shifting to cozy indoor momentum with ${targetWeight.toLowerCase()} weight tasks.`
        : `Clear weather in ${req.body.city || 'your area'} today. Calibrated to ${targetWeight.toLowerCase()} energy momentum with fresh side quests.`,
      quests: [
        { ...selectedFocus, id: `quest-${todayDate}-1`, weight: selectedFocus.weight || targetWeight },
        { ...selectedDiscipline, id: `quest-${todayDate}-2`, weight: selectedDiscipline.weight || targetWeight },
        { ...side1, id: `quest-${todayDate}-3`, weight: side1.weight || targetWeight },
        { ...side2, id: `quest-${todayDate}-4`, weight: side2.weight || targetWeight },
        { ...side3, id: `quest-${todayDate}-5`, weight: side3.weight || targetWeight },
      ],
    };

    return res.json({
      success: true,
      data: fallbackQuests,
      isFallback: true,
    });
  } catch (err) {
    console.warn('Unexpected error in /api/quest/generate, serving daily rotation:', err);
    return res.json({
      success: true,
      data: {
        vibeSummary: 'Productive and creative daily momentum.',
        quests: [],
      },
      isFallback: true,
    });
  }
});

// 3. Quick swap or advice
app.post('/api/quest/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const isRaining = context?.weather?.precipitation > 0 || /rain|drizzle|snow/i.test(context?.weather?.condition || '');

    const systemInstruction = `You are a concise, helpful productivity assistant for DailyQuest.
Keep answers under 2 short paragraphs.
Natural, minimal, clear tone with zero AI buzzwords.
WEATHER CONSTRAINT: If it is raining (${isRaining ? 'YES' : 'NO'}), never suggest outdoor walks or runs. Always recommend indoor alternatives.`;

    const text = await generateGeminiContent(
      `Context: ${JSON.stringify(context || {})}\n\nQuestion: ${message}`,
      { systemInstruction }
    );

    return res.json({
      success: true,
      reply: text || 'Keep moving forward. One task at a time.',
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.json({
      success: true,
      reply: 'Take on the next task at your own pace. Completing 4 small things today keeps your streak alive.',
    });
  }
});

// Server setup
async function setupServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const portNum = Number(PORT) || 3000;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`DailyQuest server running on port ${portNum} (0.0.0.0)`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
