// A short two-note "ding-dong" synthesized with Web Audio, so there's no sound
// file to ship. Browsers keep audio locked until the user has interacted with
// the page, so the context is created (and resumed) on the first tap/keypress.

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

if (typeof window !== "undefined") {
  const unlock = () => {
    getContext()?.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

export function playChime() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const notes = [
    { freq: 880, start: 0 },
    { freq: 1318.5, start: 0.13 },
  ];
  for (const { freq, start } of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + start;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }
}
