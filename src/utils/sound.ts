// Pure Web Audio API Synthesizer - 0 dependencies, works reliably offline
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundManager = {
  // Pleasant dopamine chime when a quest is checked
  playQuestComplete(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.45);
    });
  },

  // Soft low chime on unchecking
  playQuestUncheck(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, now); // E4
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15); // C4

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  },

  // Grand Victory Fanfare when all 4-5 non-negotiables are cleared
  playVictoryFanfare(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chords = [
      { delay: 0.0, freqs: [523.25, 659.25, 783.99] }, // C major
      { delay: 0.15, freqs: [587.33, 739.99, 880.00] }, // D major
      { delay: 0.30, freqs: [659.25, 830.61, 987.77] }, // E major
      { delay: 0.50, freqs: [1046.50, 1318.51, 1567.98] }, // High C major victory
    ];

    chords.forEach((chord) => {
      chord.freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + chord.delay);

        const duration = chord.delay > 0.4 ? 1.2 : 0.25;
        gain.gain.setValueAtTime(0, now + chord.delay);
        gain.gain.linearRampToValueAtTime(0.14, now + chord.delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chord.delay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + chord.delay);
        osc.stop(now + chord.delay + duration + 0.05);
      });
    });
  },

  // Level up sound
  playLevelUp(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  },

  // Subtle button click
  playClick(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  },
};
