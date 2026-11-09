import { PlayerStats, Quest, UserProfile, WeatherData, UserMood, WorkCapacity, QuestWeight } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'dailyquest_profile_v2',
  QUESTS: 'dailyquest_quests_v2',
  STATS: 'dailyquest_stats_v2',
  WEATHER: 'dailyquest_weather_v2',
  LAST_DATE: 'dailyquest_last_date_v2',
  HAS_ONBOARDED: 'dailyquest_has_onboarded',
  VIBE_SUMMARY: 'dailyquest_vibe_summary',
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const defaultProfile: UserProfile = {
  country: 'Japan',
  city: 'Tokyo',
  mood: 'Steady',
  capacity: 'Moderate (3-4 hrs)',
  specificGoal: 'Stay consistent and finish key deliverables',
};

export const defaultStats: PlayerStats = {
  streak: 0,
  bestStreak: 0,
  totalCompleted: 0,
  totalXp: 0,
  lastActiveDate: getTodayDateString(),
  streakShields: 0,
  history: {},
  soundEnabled: true,
};

// Rich catalogs of diverse, boredom-busting tasks for daily random rotation
// Rich catalogs of diverse tasks with calibrated weights (Light, Moderate, Heavy)
const FOCUS_CATALOG: Array<Omit<Quest, 'id' | 'completed'>> = [
  // Light (Low Energy / Stressed / Light Capacity)
  {
    title: '15-min single-priority reset',
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
  // Moderate (Steady / Moderate Capacity)
  {
    title: '25-min Pomodoro creation sprint',
    category: 'Focus',
    description: 'Work with steady focus on your main priority project for one clean 25-minute block.',
    whyDoThis: 'One uninterrupted block creates steady forward momentum.',
    estimatedMinutes: 25,
    xp: 95,
    isIndoor: true,
    weight: 'Moderate',
  },
  {
    title: '30-min inbox & deliverable blitz',
    category: 'Focus',
    description: 'Clear pending critical correspondence and finish one concrete deliverable without context switching.',
    whyDoThis: 'Sequential execution protects your willpower and clears roadblocks.',
    estimatedMinutes: 30,
    xp: 100,
    isIndoor: true,
    weight: 'Moderate',
  },
  {
    title: 'The offline paper architect',
    category: 'Focus',
    description: 'Step away from screens with pen and blank paper. Map out your next milestones or architectural diagrams.',
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
  // Heavy (Energized / Deep Focus Capacity)
  {
    title: '45-min deep focus sprint',
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

const DISCIPLINE_CATALOG: Array<Omit<Quest, 'id' | 'completed'>> = [
  // Light (Low Energy / Stressed)
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
    description: 'Drink a large glass of water with electrolytes or lemon, then splash cold water on your face for 30 seconds.',
    whyDoThis: 'Activates the mammalian dive reflex to lower heart rate and reduce stress.',
    estimatedMinutes: 3,
    xp: 65,
    isIndoor: true,
    weight: 'Light',
  },
  {
    title: 'The 5-minute military desk reset',
    category: 'Discipline',
    description: 'Take 5 gentle minutes to throw away any cups, wipe down your keyboard, and align your desk neatly.',
    whyDoThis: 'A clean space gives immediate cognitive peace without expending high energy.',
    estimatedMinutes: 5,
    xp: 65,
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
  // Moderate (Steady)
  {
    title: 'Power workout circuit',
    category: 'Discipline',
    description: 'Complete 3 rounds: 12 pushups, 15 squats, 30-sec plank, and 15 jumping jacks to wake up your body.',
    whyDoThis: 'A short physical surge triggers endorphins and destroys sluggishness immediately.',
    estimatedMinutes: 12,
    xp: 85,
    isIndoor: true,
    weight: 'Moderate',
  },
  {
    title: 'Isometric endurance test',
    category: 'Discipline',
    description: 'Hold a wall-sit for 45 seconds, rest 30s, then perform 2 sets of maximum time doorframe dead-hangs or planks.',
    whyDoThis: 'Isometrics build tendon resilience and mental tenacity with zero equipment.',
    estimatedMinutes: 10,
    xp: 80,
    isIndoor: true,
    weight: 'Moderate',
  },
  {
    title: 'Full-body mobility flow',
    category: 'Discipline',
    description: 'Complete a 15-minute hip opener, thoracic spine rotation, and hamstring release routine.',
    whyDoThis: 'Reverses postural fatigue from sitting and restores full joint mobility.',
    estimatedMinutes: 15,
    xp: 80,
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
  // Heavy (Energized)
  {
    title: 'The 100-rep split challenge',
    category: 'Discipline',
    description: 'Accumulate 100 bodyweight reps (50 pushups + 50 squats) distributed in quick micro-sets across today.',
    whyDoThis: 'Intermittent micro-movement keeps your metabolism and alert state elevated all day.',
    estimatedMinutes: 15,
    xp: 90,
    isIndoor: true,
    weight: 'Heavy',
  },
  {
    title: 'Explosive tabata cardio surge',
    category: 'Discipline',
    description: 'Do 8 rounds of 20 seconds maximum effort mountain climbers / high knees followed by 10 seconds rest.',
    whyDoThis: '4 minutes of high-intensity interval training stimulates mitochondria and crushes brain fog.',
    estimatedMinutes: 8,
    xp: 85,
    isIndoor: true,
    weight: 'Heavy',
  },
  {
    title: '60-second cold water resilience test',
    category: 'Discipline',
    description: 'Finish your shower with 60 full seconds of pure freezing cold water.',
    whyDoThis: 'Cold shock triggers norepinephrine, sharpens focus, and fortifies mental discipline.',
    estimatedMinutes: 3,
    xp: 75,
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

const OUTDOOR_SIDE_QUEST_CATALOG: Array<Omit<Quest, 'id' | 'completed'>> = [
  // Light (Low Energy)
  {
    title: 'The horizon golden hour watch',
    category: 'Side Quest',
    description: 'Step outside at sunset or break and watch the clouds and horizon for 6 quiet, uninterrupted minutes.',
    whyDoThis: 'Natural optical flow and sky observation calms an overstimulated nervous system.',
    estimatedMinutes: 8,
    xp: 75,
    isIndoor: false,
    weight: 'Light',
  },
  {
    title: 'Park bench spectator monologue',
    category: 'Side Quest',
    description: 'Sit on an outdoor bench or steps for 8 minutes with no phone, observing the world quietly like a detective.',
    whyDoThis: 'Passive observation without digital input triggers default mode network recovery.',
    estimatedMinutes: 8,
    xp: 80,
    isIndoor: false,
    weight: 'Light',
  },
  {
    title: 'The botanical specimen hunt',
    category: 'Side Quest',
    description: 'Go outside and find 3 completely different species of leaves or flowers growing within 5 minutes of your door.',
    whyDoThis: 'Attuning to plant life grounds you peacefully in your immediate physical environment.',
    estimatedMinutes: 8,
    xp: 80,
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
  // Moderate (Steady)
  {
    title: 'The 10-minute neighborhood scout',
    category: 'Side Quest',
    description: 'Step outside into the fresh air, walk down a street or alley you rarely take, and spot 2 unexpected architectural details.',
    whyDoThis: 'Going outside breaks screen fatigue, delivers sunlight, and immediately kills boredom.',
    estimatedMinutes: 10,
    xp: 90,
    isIndoor: false,
    weight: 'Moderate',
  },
  {
    title: 'Unusual local order mission',
    category: 'Side Quest',
    description: 'Walk to a local cafe, bakery, or convenience store and order a snack, pastry, or beverage you have never tasted before.',
    whyDoThis: 'Novel gustatory experiences disrupt monotony and spark playful curiosity.',
    estimatedMinutes: 15,
    xp: 95,
    isIndoor: false,
    weight: 'Moderate',
  },
  {
    title: 'The 5-photo texture safari',
    category: 'Side Quest',
    description: 'Walk outside and take 5 extreme macro close-ups of contrasting textures: rough tree bark, aged brick, moss, weathered metal, and glass.',
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
  // Heavy (Energized)
  {
    title: 'The sidewalk sprint surge',
    category: 'Side Quest',
    description: 'Find an open outdoor stretch or hill and perform 3 explosive 30-meter sprints to catch fresh air and an instant adrenaline rush.',
    whyDoThis: 'Short maximal sprints deliver a massive flood of dopamine and natural alertness.',
    estimatedMinutes: 8,
    xp: 90,
    isIndoor: false,
    weight: 'Heavy',
  },
  {
    title: 'The 1-mile silent expedition',
    category: 'Side Quest',
    description: 'Walk a 1-mile loop in your area with zero headphones and phone in pocket, simply tuning in to the sounds of the neighborhood.',
    whyDoThis: 'Walking without digital stimulation is one of the proven drivers of breakthrough ideas.',
    estimatedMinutes: 18,
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

const INDOOR_SIDE_QUEST_CATALOG: Array<Omit<Quest, 'id' | 'completed'>> = [
  // Light (Low Energy / Stressed)
  {
    title: 'The 2-minute mindful tea ritual',
    category: 'Side Quest',
    description: 'Make a hot cup of tea or warm beverage with zero phone in hand. Focus completely on the warmth and aroma for 2 minutes.',
    whyDoThis: 'Grounds your sensory focus and pauses rushing mental chatter.',
    estimatedMinutes: 2,
    xp: 70,
    isIndoor: true,
    weight: 'Light',
  },
  {
    title: 'Alien artifact field report',
    category: 'Side Quest',
    description: 'Inspect an ordinary household object (like a mug, shoe, or stapler) and write a 2-sentence report as if you are an extraterrestrial.',
    whyDoThis: 'Engages gentle, playful humor that resets mental fatigue.',
    estimatedMinutes: 4,
    xp: 80,
    isIndoor: true,
    weight: 'Light',
  },
  {
    title: 'The non-dominant hand doodle',
    category: 'Side Quest',
    description: 'Draw a 60-second funny sketch of your pet, coffee mug, or self-portrait using only your non-dominant hand.',
    whyDoThis: 'Guaranteed to make you laugh at the silly result without taking any serious effort.',
    estimatedMinutes: 3,
    xp: 70,
    isIndoor: true,
    weight: 'Light',
  },
  {
    title: 'The dramatic hype-man voice note',
    category: 'Side Quest',
    description: 'Send an unexpected 15-second audio note to a friend hyping them up like a legendary boxing ring announcer before a title fight.',
    whyDoThis: 'Spreading genuine energy takes 1 minute and reliably boosts your own mood for hours.',
    estimatedMinutes: 2,
    xp: 75,
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
  // Moderate (Steady)
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
    title: 'The 5-click Wikipedia speedrun',
    category: 'Side Quest',
    description: 'Click "Random Article" on Wikipedia and attempt to navigate to "Ancient Rome" or "Coffee" in 5 clicks or fewer.',
    whyDoThis: 'A gamified intellectual curiosity puzzle that turns random learning into a sport.',
    estimatedMinutes: 6,
    xp: 75,
    isIndoor: true,
    weight: 'Moderate',
  },
  {
    title: 'Reverse DJ roulette',
    category: 'Side Quest',
    description: 'Pick a musical genre you normally ignore, listen to 1 full track, and identify 2 things you like about the production.',
    whyDoThis: 'Expanding your aesthetic palate stimulates novel auditory neural pathways.',
    estimatedMinutes: 7,
    xp: 70,
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
  // Heavy (Energized)
  {
    title: 'The 60-second movie critic monologue',
    category: 'Side Quest',
    description: 'Record a 60-second voice memo reviewing your favorite movie as if you are an eccentric, dramatically opinionated film festival judge.',
    whyDoThis: 'Unlocks expressive voice energy and humorous storytelling.',
    estimatedMinutes: 4,
    xp: 75,
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
];

// Generates random and different quests for every single day calibrated to Mood and Capacity
export function generateDailyQuests(
  dateStr = getTodayDateString(),
  isRainy = false,
  mood: UserMood = 'Steady',
  capacity: WorkCapacity = 'Moderate (3-4 hrs)'
): Quest[] {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 37 + dateStr.charCodeAt(i)) >>> 0;
  }

  // Energy & Weight determination:
  // If someone has low energy or is stressed, give gentle, low-friction, small tasks (Light)
  const isLowEnergy = mood === 'Low Energy' || mood === 'Stressed' || capacity === 'Light (1-2 hrs)';
  const isHighEnergy = mood === 'Energized' && capacity === 'Deep Focus (5+ hrs)';
  const targetWeight: QuestWeight = isLowEnergy ? 'Light' : isHighEnergy ? 'Heavy' : 'Moderate';

  const filterByWeight = <T extends { weight?: QuestWeight }>(arr: T[]): T[] => {
    const matching = arr.filter((x) => x.weight === targetWeight);
    return matching.length > 0 ? matching : arr;
  };

  const activeFocusPool = filterByWeight(FOCUS_CATALOG);
  const activeDisciplinePool = filterByWeight(DISCIPLINE_CATALOG);
  const activeOutdoorPool = filterByWeight(OUTDOOR_SIDE_QUEST_CATALOG);
  const activeIndoorPool = filterByWeight(INDOOR_SIDE_QUEST_CATALOG);

  const usedTitles = new Set<string>();
  const pick = <T extends { title: string }>(arr: T[], salt: number): T => {
    for (let i = 0; i < arr.length; i++) {
      const idx = (seed + (salt + i) * 19) % arr.length;
      const item = arr[idx];
      if (!usedTitles.has(item.title)) {
        usedTitles.add(item.title);
        return item;
      }
    }
    return arr[(seed + salt * 19) % arr.length];
  };

  const focus = pick(activeFocusPool, 1);
  const discipline = pick(activeDisciplinePool, 2);

  let sideQuest1: (typeof OUTDOOR_SIDE_QUEST_CATALOG)[0];
  let sideQuest2: (typeof INDOOR_SIDE_QUEST_CATALOG)[0];
  let sideQuest3: (typeof INDOOR_SIDE_QUEST_CATALOG)[0];

  if (!isRainy) {
    sideQuest1 = pick(activeOutdoorPool, 3);
    sideQuest2 = pick(activeIndoorPool, 4);
    sideQuest3 = (seed % 2 === 0)
      ? pick(activeOutdoorPool, 7)
      : pick(activeIndoorPool, 8);
  } else {
    sideQuest1 = pick(activeIndoorPool, 3);
    sideQuest2 = pick(activeIndoorPool, 5);
    sideQuest3 = pick(activeIndoorPool, 9);
  }

  return [
    { ...focus, id: `quest-${dateStr}-1`, completed: false, weight: focus.weight || targetWeight },
    { ...discipline, id: `quest-${dateStr}-2`, completed: false, weight: discipline.weight || targetWeight },
    { ...sideQuest1, id: `quest-${dateStr}-3`, completed: false, weight: sideQuest1.weight || targetWeight },
    { ...sideQuest2, id: `quest-${dateStr}-4`, completed: false, weight: sideQuest2.weight || targetWeight },
    { ...sideQuest3, id: `quest-${dateStr}-5`, completed: false, weight: sideQuest3.weight || targetWeight },
  ];
}

export const defaultQuests: Quest[] = generateDailyQuests(getTodayDateString());

export const storage = {
  hasOnboarded(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED) === 'true';
    } catch {
      return false;
    }
  },

  setOnboarded(val: boolean) {
    try {
      localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, String(val));
    } catch (e) {
      console.warn(e);
    }
  },

  loadProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return defaultProfile;
      const profile: UserProfile = JSON.parse(data);
      if (!profile.country || profile.country === 'Earth') profile.country = 'Japan';
      if (!profile.city || profile.city === 'Current Location') profile.city = 'Tokyo';
      return profile;
    } catch {
      return defaultProfile;
    }
  },

  saveProfile(profile: UserProfile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn(e);
    }
  },

  loadStats(): PlayerStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (!data) return defaultStats;
      const stats = JSON.parse(data);
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();

      if (!stats.history) stats.history = {};

      // Unforgiving Streak: One missed streak resets the entire streak from the beginning!
      if (stats.lastActiveDate && stats.lastActiveDate !== today) {
        if (stats.lastActiveDate !== yesterday || !stats.history?.[yesterday]) {
          stats.streak = 0;
        }
      }

      // If user has not completed any days in history, streak starts at 0 until all checkmarks are ticked
      const hasCompletedToday = !!stats.history[today];
      const hasCompletedYesterday = !!stats.history[yesterday];
      if (!hasCompletedToday && !hasCompletedYesterday && Object.keys(stats.history).length === 0) {
        stats.streak = 0;
        stats.bestStreak = 0;
      }

      if (stats.streak === undefined || stats.streak === null || isNaN(stats.streak) || stats.streak < 0) {
        stats.streak = 0;
      }
      if (stats.bestStreak === undefined || stats.bestStreak === null || isNaN(stats.bestStreak) || stats.bestStreak < stats.streak) {
        stats.bestStreak = stats.streak;
      }
      stats.streakShields = 0;

      return stats;
    } catch {
      return defaultStats;
    }
  },

  saveStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn(e);
    }
  },

  loadQuests(profile?: UserProfile): Quest[] {
    try {
      const savedDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);
      const today = getTodayDateString();
      const raw = localStorage.getItem(STORAGE_KEYS.QUESTS);

      // New calendar day: automatically generate completely new, random, and different quests for today!
      if (!raw || savedDate !== today) {
        const userProf = profile || storage.loadProfile();
        const fresh = generateDailyQuests(today, false, userProf.mood, userProf.capacity);
        localStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
        localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(fresh));
        return fresh;
      }

      return JSON.parse(raw);
    } catch {
      const userProf = profile || storage.loadProfile();
      return generateDailyQuests(getTodayDateString(), false, userProf.mood, userProf.capacity);
    }
  },

  saveQuests(quests: Quest[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
      localStorage.setItem(STORAGE_KEYS.LAST_DATE, getTodayDateString());
    } catch (e) {
      console.warn(e);
    }
  },

  loadWeather(): WeatherData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WEATHER);
      if (!raw) return null;
      const weather: WeatherData = JSON.parse(raw);
      if (weather.country === 'Earth') weather.country = 'Japan';
      if (weather.city === 'Current Location') weather.city = 'Tokyo';
      return weather;
    } catch {
      return null;
    }
  },

  saveWeather(weather: WeatherData) {
    try {
      localStorage.setItem(STORAGE_KEYS.WEATHER, JSON.stringify(weather));
    } catch (e) {
      console.warn(e);
    }
  },

  loadVibeSummary(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.VIBE_SUMMARY) || 'Your 4-5 focused quests for today.';
    } catch {
      return 'Your 4-5 focused quests for today.';
    }
  },

  saveVibeSummary(summary: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.VIBE_SUMMARY, summary);
    } catch (e) {
      console.warn(e);
    }
  },
};
