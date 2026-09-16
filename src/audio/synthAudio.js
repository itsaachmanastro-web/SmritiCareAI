// Web Audio API Synthesizer for North Eastern Instruments & UI sounds
// No external MP3 files needed; works 100% offline and reliably across modern browsers.

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Traditional Assamese Pepa (Buffalo Horn) Sound
export function playPepaSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  // Sawtooth gives the raw reedy buzz of buffalo horn reed
  osc1.type = 'sawtooth';
  osc2.type = 'sawtooth';

  // Pitch bend upward typical of Bihu Pepa
  osc1.frequency.setValueAtTime(392, now); // G4
  osc1.frequency.linearRampToValueAtTime(440, now + 0.15); // A4
  osc1.frequency.linearRampToValueAtTime(523.25, now + 0.4); // C5

  osc2.frequency.setValueAtTime(396, now); // slight chorus detune
  osc2.frequency.linearRampToValueAtTime(444, now + 0.15);
  osc2.frequency.linearRampToValueAtTime(528, now + 0.4);

  // Resonant horn body filter
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.Q.setValueAtTime(4.0, now);

  // Envelope
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.75);
  osc2.stop(now + 0.75);
}

// 2. Assamese Dhol (Folk Drum) Beat
export function playDholSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Deep membrane frequency sweep
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.35);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.42);
}

// 3. Toka / Bamboo Clapper Snap
export function playTokaBambooSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Wooden click
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

// 4. Hill Cuckoo / Hornbill Bird Call
export function playBirdCallSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  // First note (high)
  osc.frequency.setValueAtTime(880, now);
  // Brief pause then second note (dropping)
  osc.frequency.setValueAtTime(740, now + 0.2);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.18);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.23);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.65);
}

// 5. Card Flip Click
export function playCardFlipSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(540, now + 0.07);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

// 6. Match Success Chime (Pentatonic uplift)
export function playMatchSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + idx * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.38);
  });
}

// 7. Victory Fanfare
export function playVictorySound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const chords = [
    { freq: 440, time: 0 },
    { freq: 554.37, time: 0.1 },
    { freq: 659.25, time: 0.2 },
    { freq: 880, time: 0.35 }
  ];

  chords.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime + time;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  });
}

// 8. Gentle Notification Chime (Elder-friendly, soothing two-tone harmonic)
export function playNotificationChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 659.25, time: 0, dur: 0.45 },     // E5 (calm foundation)
    { freq: 880.00, time: 0.14, dur: 0.65 }   // A5 (uplifting bell resonance)
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + time;

    osc.type = 'sine'; // pure, mellow sine tone
    osc.frequency.setValueAtTime(freq, startTime);

    // Warm, gentle envelope: soft rise, gradual exponential decay
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.20, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
  });
}
