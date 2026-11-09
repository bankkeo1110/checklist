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

export const sfx = {
  kick: () => tone(180, 0, 0.1, "square", 0.15),
  goal: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, "sine", 0.2));
  },
  save: () => tone(120, 0, 0.35, "sawtooth", 0.15),
  whistle: () => tone(1200, 0, 0.4, "square", 0.1),
};
