// Beginner two-hand arrangements. Every song here is public domain.
// Right hand = melody, left hand = simple bass notes (chord roots).
//
// Notation: each line is one row on screen. A token is "NOTE/beats", e.g.
// "G4/1.5" = Sol (G) in octave 4 held 1.5 beats. "/beats" defaults to 1.
// Sharps use "#": "D#5". Rests are "R/beats".

export type SongDef = {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  /** Time signature shown before the first note, e.g. "3/4". */
  timeSig: string;
  /** Beats per measure (in this file's beat unit) — used to draw bar lines. */
  beatsPerBar: number;
  /** Beats before the first full measure (an upbeat), default 0. */
  pickup?: number;
  /** Quarter-note beats per minute at "normal" speed. */
  bpm: number;
  /** Right hand (treble clef), one string per screen row. */
  lines: string[];
  /** Left hand (bass clef), same rows and same beat totals as `lines`. */
  left: string[];
};

export const SONGS: SongDef[] = [
  {
    id: "twinkle",
    title: "Twinkle Twinkle Little Star",
    blurb: "Bài dễ nhất để bắt đầu — chỉ dùng 6 phím trắng.",
    emoji: "⭐",
    timeSig: "4/4",
    beatsPerBar: 4,
    bpm: 96,
    lines: [
      "C4 C4 G4 G4 A4 A4 G4/2",
      "F4 F4 E4 E4 D4 D4 C4/2",
      "G4 G4 F4 F4 E4 E4 D4/2",
      "G4 G4 F4 F4 E4 E4 D4/2",
      "C4 C4 G4 G4 A4 A4 G4/2",
      "F4 F4 E4 E4 D4 D4 C4/2",
    ],
    left: [
      "C3/4 F3/2 C3/2",
      "F3/2 C3/2 G2/2 C3/2",
      "C3/2 F3/2 C3/2 G2/2",
      "C3/2 F3/2 C3/2 G2/2",
      "C3/4 F3/2 C3/2",
      "F3/2 C3/2 G2/2 C3/2",
    ],
  },
  {
    id: "mary",
    title: "Mary Had a Little Lamb",
    blurb: "Chỉ 4 phím Đô–Rê–Mi–Sol, tay không cần di chuyển.",
    emoji: "🐑",
    timeSig: "4/4",
    beatsPerBar: 4,
    bpm: 100,
    lines: [
      "E4 D4 C4 D4 E4 E4 E4/2",
      "D4 D4 D4/2 E4 G4 G4/2",
      "E4 D4 C4 D4 E4 E4 E4 E4",
      "D4 D4 E4 D4 C4/4",
    ],
    left: [
      "C3/4 C3/4",
      "G2/4 C3/4",
      "C3/4 C3/4",
      "G2/4 C3/4",
    ],
  },
  {
    id: "ode",
    title: "Ode to Joy (Beethoven)",
    blurb: "5 ngón tay đặt sẵn trên Đô–Rê–Mi–Fa–Sol là đánh được cả bài.",
    emoji: "🎉",
    timeSig: "4/4",
    beatsPerBar: 4,
    bpm: 100,
    lines: [
      "E4 E4 F4 G4 G4 F4 E4 D4",
      "C4 C4 D4 E4 E4/1.5 D4/0.5 D4/2",
      "E4 E4 F4 G4 G4 F4 E4 D4",
      "C4 C4 D4 E4 D4/1.5 C4/0.5 C4/2",
    ],
    left: [
      "C3/4 G2/4",
      "C3/4 G2/4",
      "C3/4 G2/4",
      "C3/2 G2/2 C3/4",
    ],
  },
  {
    id: "oldmacdonald",
    title: "Old MacDonald Had a Farm",
    blurb: "Bài hát nông trại vui nhộn — E-I-E-I-O!",
    emoji: "🐄",
    timeSig: "4/4",
    beatsPerBar: 4,
    bpm: 110,
    lines: [
      "C5 C5 C5 G4 A4 A4 G4/2",
      "E5 E5 D5 D5 C5/3 G4",
      "C5 C5 C5 G4 A4 A4 G4/2",
      "E5 E5 D5 D5 C5/4",
    ],
    left: [
      "C3/4 F3/2 C3/2",
      "C3/2 G2/2 C3/4",
      "C3/4 F3/2 C3/2",
      "C3/2 G2/2 C3/4",
    ],
  },
  {
    id: "london",
    title: "London Bridge Is Falling Down",
    blurb: "Giai điệu đi lên đi xuống từng bậc — luyện ngón rất tốt.",
    emoji: "🌉",
    timeSig: "4/4",
    beatsPerBar: 4,
    bpm: 104,
    lines: [
      "G4/1.5 A4/0.5 G4 F4 E4 F4 G4/2",
      "D4 E4 F4/2 E4 F4 G4/2",
      "G4/1.5 A4/0.5 G4 F4 E4 F4 G4/2",
      "D4/2 G4/2 E4 C4/3",
    ],
    left: [
      "C3/4 C3/4",
      "G2/4 C3/4",
      "C3/4 C3/4",
      "G2/4 C3/4",
    ],
  },
  {
    id: "jinglebells",
    title: "Jingle Bells",
    blurb: "Điệp khúc Giáng Sinh quen thuộc, nhiều nốt Mi lặp lại.",
    emoji: "🔔",
    timeSig: "4/4",
    beatsPerBar: 4,
    bpm: 120,
    lines: [
      "E4 E4 E4/2 E4 E4 E4/2",
      "E4 G4 C4/1.5 D4/0.5 E4/4",
      "F4 F4 F4/1.5 F4/0.5 F4 E4 E4 E4/0.5 E4/0.5",
      "E4 D4 D4 E4 D4/2 G4/2",
      "E4 E4 E4/2 E4 E4 E4/2",
      "E4 G4 C4/1.5 D4/0.5 E4/4",
      "F4 F4 F4/1.5 F4/0.5 F4 E4 E4 E4/0.5 E4/0.5",
      "G4 G4 F4 D4 C4/4",
    ],
    left: [
      "C3/4 C3/4",
      "C3/4 C3/4",
      "F3/4 C3/4",
      "D3/4 G2/4",
      "C3/4 C3/4",
      "C3/4 C3/4",
      "F3/4 C3/4",
      "G2/4 C3/4",
    ],
  },
  {
    id: "wewish",
    title: "We Wish You a Merry Christmas",
    blurb: "Nhịp 3/4 vui tươi, có vài nốt nhanh (nửa phách).",
    emoji: "🎄",
    timeSig: "3/4",
    pickup: 1,
    beatsPerBar: 3,
    bpm: 120,
    lines: [
      "G4 C5 C5/0.5 D5/0.5 C5/0.5 B4/0.5 A4 A4",
      "A4 D5 D5/0.5 E5/0.5 D5/0.5 C5/0.5 B4 G4",
      "G4 E5 E5/0.5 F5/0.5 E5/0.5 D5/0.5 C5 A4",
      "G4/0.5 G4/0.5 A4 D5 B4 C5/2",
    ],
    left: [
      "R/1 C3/3 F3/2",
      "F3/1 D3/3 G2/2",
      "G2/1 C3/3 F3/2",
      "F3/1 G2/3 C3/2",
    ],
  },
  {
    id: "silentnight",
    title: "Silent Night",
    blurb: "Đêm Thánh Vô Cùng — chậm rãi, nhẹ nhàng, nhịp 3/4.",
    emoji: "🌙",
    timeSig: "3/4",
    beatsPerBar: 3,
    bpm: 72,
    lines: [
      "G4/1.5 A4/0.5 G4 E4/3",
      "G4/1.5 A4/0.5 G4 E4/3",
      "D5/2 D5 B4/3 C5/2 C5 G4/3",
      "A4/2 A4 C5/1.5 B4/0.5 A4 G4/1.5 A4/0.5 G4 E4/3",
      "A4/2 A4 C5/1.5 B4/0.5 A4 G4/1.5 A4/0.5 G4 E4/3",
      "D5/2 D5 F5/1.5 D5/0.5 B4 C5/3 E5/3",
      "C5/1.5 G4/0.5 E4 G4/1.5 F4/0.5 D4 C4/3",
    ],
    left: [
      "C3/3 C3/3",
      "C3/3 C3/3",
      "G2/3 G2/3 C3/3 C3/3",
      "F3/3 F3/3 C3/3 C3/3",
      "F3/3 F3/3 C3/3 C3/3",
      "G2/3 G2/3 C3/3 C3/3",
      "C3/3 G2/3 C3/3",
    ],
  },
  {
    id: "happybirthday",
    title: "Happy Birthday",
    blurb: "Đánh tặng sinh nhật cả nhà! Bài này phải nhảy quãng xa.",
    emoji: "🎂",
    timeSig: "3/4",
    pickup: 1,
    beatsPerBar: 3,
    bpm: 100,
    lines: [
      "G4/0.5 G4/0.5 A4 G4 C5 B4/2",
      "G4/0.5 G4/0.5 A4 G4 D5 C5/2",
      "G4/0.5 G4/0.5 G5 E5 C5 B4 A4",
      "F5/0.5 F5/0.5 E5 C5 D5 C5/3",
    ],
    left: [
      "R/1 C3/3 G2/2",
      "G2/1 G2/3 C3/2",
      "C3/1 C3/3 F3/2",
      "F3/1 G2/3 C3/3",
    ],
  },
  {
    id: "furelise",
    title: "Für Elise (Beethoven)",
    blurb: "Đoạn mở đầu nổi tiếng — hai tay thay nhau đánh rải, có phím đen Rê# và Sol#. Thử thách nhất!",
    emoji: "🎹",
    timeSig: "3/8",
    pickup: 1,
    beatsPerBar: 3,
    bpm: 80,
    lines: [
      "E5/0.5 D#5/0.5 E5/0.5 D#5/0.5 E5/0.5 B4/0.5 D5/0.5 C5/0.5",
      "A4/1.5 C4/0.5 E4/0.5 A4/0.5 B4/1.5 E4/0.5 G#4/0.5 B4/0.5 C5/1.5 E4/0.5 E5/0.5 D#5/0.5",
      "E5/0.5 D#5/0.5 E5/0.5 B4/0.5 D5/0.5 C5/0.5",
      "A4/1.5 C4/0.5 E4/0.5 A4/0.5 B4/1.5 E4/0.5 C5/0.5 B4/0.5 A4/3",
    ],
    left: [
      "R/4",
      "A2/0.5 E3/0.5 A3/0.5 R/1.5 E2/0.5 E3/0.5 G#3/0.5 R/1.5 A2/0.5 E3/0.5 A3/0.5 R/1.5",
      "R/3",
      "A2/0.5 E3/0.5 A3/0.5 R/1.5 E2/0.5 E3/0.5 G#3/0.5 R/1.5 A2/0.5 E3/0.5 A3/0.5 R/1.5",
    ],
  },
];

// ─── Parsing & music helpers ───────────────────────────────────────────

export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export type NoteToken = {
  rest: boolean;
  letter: Letter;
  sharp: boolean;
  octave: number;
  beats: number;
  /** MIDI number (60 = middle C). NaN for rests. */
  midi: number;
};

const LETTERS: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const SEMITONE: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const SOLFEGE: Record<Letter, string> = {
  C: "Đô",
  D: "Rê",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

/** One colour per letter so the staff note, the label and the big keyboard match. */
export const NOTE_COLOR: Record<Letter, string> = {
  C: "#ff6b6b",
  D: "#ff9f45",
  E: "#ffc93c",
  F: "#6bcb77",
  G: "#4d96ff",
  A: "#8a6bff",
  B: "#d36bd3",
};

export function parseLine(line: string): NoteToken[] {
  return line
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [name, beatStr] = tok.split("/");
      const beats = beatStr ? Number(beatStr) : 1;
      if (name === "R") {
        return { rest: true, letter: "C", sharp: false, octave: 4, beats, midi: NaN };
      }
      const m = /^([A-G])(#?)(\d)$/.exec(name);
      if (!m) throw new Error(`Bad note token: ${tok}`);
      const letter = m[1] as Letter;
      const sharp = m[2] === "#";
      const octave = Number(m[3]);
      const midi = 12 * (octave + 1) + SEMITONE[letter] + (sharp ? 1 : 0);
      return { rest: false, letter, sharp, octave, beats, midi };
    });
}

/** Diatonic step used for vertical staff position (E4 = bottom line). */
export function staffStep(n: NoteToken): number {
  return n.octave * 7 + LETTERS.indexOf(n.letter);
}

export function noteLabel(n: NoteToken): string {
  return `${SOLFEGE[n.letter]}${n.sharp ? "#" : ""}`;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
