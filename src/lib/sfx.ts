let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", gain = 0.2) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  osc.connect(amp).connect(c.destination);
  osc.start(c.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.stop(c.currentTime + start + duration);
}

function sweep(f1: number, f2: number, duration: number, type: OscillatorType = "sawtooth", gain = 0.12) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f1, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(f2, c.currentTime + duration);
  amp.gain.value = gain;
  osc.connect(amp).connect(c.destination);
  osc.start();
  amp.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.stop(c.currentTime + duration);
}

/** Filtered white noise — a crowd roar. */
function noise(duration: number, gain = 0.12) {
  const c = getCtx();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  const amp = c.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(c.destination);
  src.start();
}

export const sfx = {
  thud: () => tone(90, 0, 0.16, "square", 0.2),
  post: () => tone(880, 0, 0.3, "triangle", 0.22),
  power: () => sweep(180, 1400, 0.55),
  cheer: () => noise(1.4, 0.16),
  fulltime: () => [0, 0.3, 0.6].forEach((t) => tone(1200, t, t === 0.6 ? 0.6 : 0.2, "square", 0.1)),
  kick: () => tone(180, 0, 0.1, "square", 0.15),
  goal: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, "sine", 0.2));
  },
  save: () => tone(120, 0, 0.35, "sawtooth", 0.15),
  whistle: () => tone(1200, 0, 0.4, "square", 0.1),
};
