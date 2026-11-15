"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NOTE_COLOR,
  SONGS,
  SOLFEGE,
  midiToFreq,
  noteLabel,
  parseLine,
  staffStep,
  type Letter,
  type NoteToken,
  type SongDef,
} from "@/lib/piano/songs";

// ─── Layout constants (px) ─────────────────────────────────────────────
const COL = 58; // minimum width of one time column — staves and key rows share it
const COL_MAX = 140; // columns stretch to fill the card, up to this width
const CARD_PAD = 24; // horizontal padding inside a row card (p-3)
const LEAD = 44; // left space on each staff for the clef / time signature
const GAP = 6; // half the distance between two staff lines
const STAFF_H = 100;
const STAFF_BASE_Y = 70; // y of the bottom staff line

type Hand = "right" | "left";
type HandMode = "both" | Hand;

const CLEF = {
  right: { bottomStep: 30, glyph: "𝄞", glyphSize: 56, glyphDy: 12 }, // bottom line E4
  left: { bottomStep: 18, glyph: "𝄢", glyphSize: 38, glyphDy: -10 }, // bottom line G2
} as const;

const yOf = (step: number, hand: Hand) =>
  STAFF_BASE_Y - (step - CLEF[hand].bottomStep) * GAP;

// ─── Tiny Web Audio piano ──────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!audioCtx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function playTone(midi: number, seconds: number, when = 0, volume = 0.3) {
  if (Number.isNaN(midi)) return;
  const ac = ctx();
  const t0 = ac.currentTime + when;
  const len = Math.min(Math.max(seconds, 0.25), 2.4);
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  out.connect(ac.destination);
  const freq = midiToFreq(midi);
  for (const [type, mult, vol] of [
    ["triangle", 1, 1],
    ["sine", 2, 0.25],
    ["sine", 3, 0.08],
  ] as const) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    g.gain.value = vol;
    osc.connect(g).connect(out);
    osc.start(t0);
    osc.stop(t0 + len + 0.05);
  }
}

// ─── Song → time columns ───────────────────────────────────────────────
// Each row is split into columns at every moment a note starts in either
// hand, so notes played together sit in the same vertical column.
type Placed = NoteToken & { hand: Hand; t: number };
type Column = { t: number; right?: Placed; left?: Placed; barAfter: boolean };
type Row = { columns: Column[]; start: number };

function buildRows(song: SongDef): Row[] {
  const pickup = song.pickup ?? 0;
  const isBar = (t: number) =>
    t - pickup > 1e-6 && Math.abs((t - pickup) % song.beatsPerBar) < 1e-6;
  const rows: Row[] = [];
  let rowStart = 0;
  song.lines.forEach((rh, li) => {
    const byTime = new Map<number, Column>();
    let rowEnd = rowStart;
    for (const [hand, line] of [
      ["right", rh],
      ["left", song.left[li]],
    ] as const) {
      let t = rowStart;
      for (const n of parseLine(line)) {
        const tk = Math.round(t * 1000) / 1000;
        const col = byTime.get(tk) ?? { t: tk, barAfter: false };
        col[hand] = { ...n, hand, t: tk };
        byTime.set(tk, col);
        t += n.beats;
      }
      rowEnd = Math.max(rowEnd, t);
    }
    const columns = [...byTime.values()].sort((a, b) => a.t - b.t);
    columns.forEach((c, i) => {
      if (i === columns.length - 1) return;
      const next = columns[i + 1].t;
      // A bar line follows this column if a bar boundary lies in (t, next].
      for (let b = Math.floor(c.t * 2) / 2 + 0.5; b <= next + 1e-6; b += 0.5) {
        if (isBar(b)) c.barAfter = true;
      }
    });
    rows.push({ columns, start: rowStart });
    rowStart = rowEnd;
  });
  return rows;
}

// ─── Main component ────────────────────────────────────────────────────
export default function PianoLesson() {
  const [songId, setSongId] = useState<string | null>(null);
  const song = SONGS.find((s) => s.id === songId) ?? null;

  if (!song) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="rounded-3xl bg-white p-5 shadow-md">
          <h1 className="font-display text-xl font-extrabold">
            🎹 Học Piano 2 tay
          </h1>
          <p className="mt-1 text-sm text-muted">
            Mỗi bài có <b>khuông Sol</b> cho tay phải và <b>khuông Fa</b> cho
            tay trái. Ngay dưới mỗi khuông là <b>phím cần bấm</b>, thẳng cột với
            từng nốt — nốt nằm cùng một cột thì hai tay bấm cùng lúc. Nên tập
            từng tay trước, quen rồi mới ghép hai tay.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SONGS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSongId(s.id)}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-md transition hover:-translate-y-0.5"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  Bài {i + 1}
                </span>
                <span className="font-display font-extrabold">{s.title}</span>
                <span className="mt-0.5 text-xs text-muted">{s.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <SongView key={song.id} song={song} onBack={() => setSongId(null)} />;
}

const colId = (ri: number, ci: number) => `${ri}-${ci}`;

// ─── Practice mode ─────────────────────────────────────────────────────
// The learner presses keys on the big keyboard (or a MIDI piano). Each step
// is one column; all of its notes (for the hands being practised) must be
// pressed before moving on. Right key → green flash, wrong key → red flash.
type Step = { id: string; midis: number[] };
type Practice = {
  from: number;
  to: number;
  steps: Step[];
  pos: number;
  remaining: number[];
  mistakes: number;
  done: boolean;
};
type Feedback = Map<number, "good" | "bad">;

function practiceStars(mistakes: number, steps: number) {
  if (mistakes === 0) return 3;
  if (mistakes <= Math.max(2, Math.round(steps * 0.15))) return 2;
  return 1;
}

function SongView({ song, onBack }: { song: SongDef; onBack: () => void }) {
  const rows = useMemo(() => buildRows(song), [song]);
  const range = useMemo(() => keyboardRange(song), [song]);
  const [speed, setSpeed] = useState(0.7);
  const [mode, setMode] = useState<HandMode>("both");
  const [playing, setPlaying] = useState(false);
  const [activeCol, setActiveCol] = useState<string | null>(null);
  const [pressed, setPressed] = useState<Map<number, Hand>>(new Map());
  const timers = useRef<number[]>([]);
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setAvail(e.contentRect.width - CARD_PAD),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const colWidth = (n: number) =>
    Math.max(COL, Math.min(COL_MAX, Math.floor((avail - LEAD) / n)));

  const handOn = (h: Hand) => mode === "both" || mode === h;

  const stop = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPlaying(false);
    setActiveCol(null);
    setPressed(new Map());
  }, []);

  useEffect(() => stop, [stop]);

  const [practice, setPractice] = useState<Practice | null>(null);
  const practiceRef = useRef<Practice | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(new Map());
  const [showHint, setShowHint] = useState(true);
  const fbTimers = useRef<number[]>([]);

  const commitPractice = (p: Practice | null) => {
    practiceRef.current = p;
    setPractice(p);
  };

  const flash = (midi: number, kind: "good" | "bad") => {
    setFeedback((prev) => new Map(prev).set(midi, kind));
    fbTimers.current.push(
      window.setTimeout(() => {
        setFeedback((prev) => {
          const next = new Map(prev);
          if (next.get(midi) === kind) next.delete(midi);
          return next;
        });
      }, 450),
    );
  };

  const focusStep = (id: string | undefined) => {
    setActiveCol(id ?? null);
    if (id) {
      colRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  };

  const startPractice = (from: number, to: number) => {
    stop();
    const steps: Step[] = [];
    for (let ri = from; ri <= to; ri++) {
      rows[ri].columns.forEach((c, ci) => {
        const midis = (["right", "left"] as const)
          .filter((h) => handOn(h))
          .map((h) => c[h])
          .filter((n): n is Placed => !!n && !n.rest)
          .map((n) => n.midi);
        if (midis.length) steps.push({ id: colId(ri, ci), midis });
      });
    }
    if (!steps.length) return;
    commitPractice({
      from,
      to,
      steps,
      pos: 0,
      remaining: [...new Set(steps[0].midis)],
      mistakes: 0,
      done: false,
    });
    focusStep(steps[0].id);
  };

  const exitPractice = () => {
    commitPractice(null);
    setActiveCol(null);
    setFeedback(new Map());
  };

  const pressKey = (midi: number) => {
    playTone(midi, 0.9, 0, midi < 60 ? 0.22 : 0.3);
    const p = practiceRef.current;
    if (!p || p.done) {
      if (playing) stop();
      setPressed(new Map([[midi, midi < 60 ? "left" : "right"]]));
      if (!p) setActiveCol(null);
      return;
    }
    const step = p.steps[p.pos];
    if (step.midis.includes(midi)) {
      flash(midi, "good");
      const remaining = p.remaining.filter((m) => m !== midi);
      if (remaining.length > 0) {
        commitPractice({ ...p, remaining });
        return;
      }
      const pos = p.pos + 1;
      if (pos >= p.steps.length) {
        commitPractice({ ...p, remaining: [], pos, done: true });
        setActiveCol(null);
        return;
      }
      commitPractice({
        ...p,
        pos,
        remaining: [...new Set(p.steps[pos].midis)],
      });
      focusStep(p.steps[pos].id);
    } else {
      flash(midi, "bad");
      commitPractice({ ...p, mistakes: p.mistakes + 1 });
    }
  };

  // Real piano over USB/Bluetooth MIDI (Chrome / Edge on desktop & Android).
  const pressKeyRef = useRef(pressKey);
  useEffect(() => {
    pressKeyRef.current = pressKey;
  });
  useEffect(() => {
    const nav = navigator as Navigator & {
      requestMIDIAccess?: () => Promise<MIDIAccess>;
    };
    if (!nav.requestMIDIAccess) return;
    let access: MIDIAccess | null = null;
    const onMsg = (e: MIDIMessageEvent) => {
      const d = e.data;
      if (d && (d[0] & 0xf0) === 0x90 && d[2] > 0) pressKeyRef.current(d[1]);
    };
    nav
      .requestMIDIAccess()
      .then((a) => {
        access = a;
        a.inputs.forEach((i) => (i.onmidimessage = onMsg));
      })
      .catch(() => {});
    return () => access?.inputs.forEach((i) => (i.onmidimessage = null));
  }, []);

  useEffect(
    () => () => fbTimers.current.forEach((t) => window.clearTimeout(t)),
    [],
  );

  const hint = useMemo(
    () =>
      practice && !practice.done && showHint
        ? new Set(practice.remaining)
        : new Set<number>(),
    [practice, showHint],
  );

  const play = (fromRow = 0) => {
    stop();
    exitPractice();
    const beatSec = 60 / (song.bpm * speed);
    const origin = rows[fromRow].start;
    const lead = 0.08;
    let end = 0;
    // Notes still sounding, so the big keyboard keeps a held note lit.
    const held: { midi: number; hand: Hand; from: number; to: number }[] = [];
    const ticks: { at: number; id: string }[] = [];
    rows.slice(fromRow).forEach((row, i) => {
      row.columns.forEach((c, ci) => {
        const at = lead + (c.t - origin) * beatSec;
        for (const h of ["right", "left"] as const) {
          const n = c[h];
          if (!n || n.rest || !handOn(h)) continue;
          playTone(
            n.midi,
            n.beats * beatSec * 0.95,
            at,
            h === "left" ? 0.22 : 0.3,
          );
          held.push({
            midi: n.midi,
            hand: h,
            from: at,
            to: at + n.beats * beatSec * 0.9,
          });
        }
        ticks.push({ at, id: colId(fromRow + i, ci) });
        const longest = Math.max(c.right?.beats ?? 0, c.left?.beats ?? 0);
        end = Math.max(end, at + longest * beatSec);
      });
    });
    setPlaying(true);
    for (const { at, id } of ticks) {
      timers.current.push(
        window.setTimeout(() => {
          setActiveCol(id);
          const now = at + 0.001;
          setPressed(
            new Map(
              held
                .filter((h) => h.from <= now && h.to > now)
                .map((h) => [h.midi, h.hand]),
            ),
          );
          colRefs.current[id]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }, at * 1000),
      );
    }
    timers.current.push(window.setTimeout(stop, (end + 0.3) * 1000));
  };

  const tapColumn = (id: string, c: Column) => {
    if (practiceRef.current) return; // in practice the keyboard is the input
    if (playing) stop();
    const next = new Map<number, Hand>();
    for (const h of ["right", "left"] as const) {
      const n = c[h];
      if (!n || n.rest || !handOn(h)) continue;
      playTone(n.midi, 0.9, 0, h === "left" ? 0.22 : 0.3);
      next.set(n.midi, h);
    }
    setActiveCol(id);
    setPressed(next);
  };

  return (
    <div ref={rootRef} className="flex w-full min-w-0 flex-col gap-4 pb-48">
      <button
        onClick={onBack}
        className="self-start text-sm font-bold text-blue-text"
      >
        ← Danh sách bài
      </button>

      <div className="rounded-3xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">{song.emoji}</span>
          <div className="mr-auto">
            <h1 className="font-display text-lg font-extrabold">
              {song.title}
            </h1>
            <p className="text-xs text-muted">
              Nhịp {song.timeSig} · {song.blurb}
            </p>
          </div>
          <button
            onClick={() => (playing ? stop() : play())}
            className={`rounded-xl px-4 py-2.5 font-display text-sm font-bold text-white ${
              playing ? "bg-coral" : "bg-green"
            }`}
          >
            {playing ? "⏹ Dừng" : "▶ Nghe mẫu"}
          </button>
          <button
            onClick={() => startPractice(0, rows.length - 1)}
            className="rounded-xl bg-purple px-4 py-2.5 font-display text-sm font-bold text-white"
          >
            🎯 Tập cả bài
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Segmented<HandMode>
            value={mode}
            onChange={(v) => {
              stop();
              exitPractice();
              setMode(v);
            }}
            options={[
              ["right", "✋ Tay phải"],
              ["left", "🤚 Tay trái"],
              ["both", "🙌 Hai tay"],
            ]}
          />
          <Segmented<number>
            value={speed}
            onChange={setSpeed}
            options={[
              [0.5, "🐢 Chậm"],
              [0.7, "Vừa"],
              [1, "🐇 Nhanh"],
            ]}
          />
        </div>
        <ReadingTips />
      </div>

      {rows.map((row, ri) => {
        const cw = colWidth(row.columns.length);
        return (
          <div
            key={ri}
            className={`rounded-2xl bg-white p-3 shadow-md ${
              practice && ri >= practice.from && ri <= practice.to
                ? "ring-2 ring-purple"
                : ""
            }`}
          >
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-muted">
              <span>Dòng {ri + 1}</span>
              <span className="flex gap-3">
                <button onClick={() => play(ri)} className="text-blue-text">
                  ▶ Nghe từ dòng này
                </button>
                <button
                  onClick={() => startPractice(ri, ri)}
                  className="text-purple-text"
                >
                  🎯 Tập dòng này
                </button>
              </span>
            </div>
            <div className="overflow-x-auto">
              <div style={{ width: LEAD + row.columns.length * cw }}>
                {(["right", "left"] as const).map((hand) => (
                  <div
                    key={hand}
                    className={`transition-opacity ${handOn(hand) ? "" : "opacity-30"} ${hand === "left" ? "mt-3" : ""}`}
                  >
                    <Staff
                      hand={hand}
                      row={row}
                      rowIndex={ri}
                      colW={cw}
                      song={song}
                      showSig={ri === 0}
                      activeCol={activeCol}
                      onTap={tapColumn}
                    />
                    <div className="flex items-stretch">
                      <div
                        style={{ width: LEAD }}
                        className="flex shrink-0 flex-col items-center justify-center text-center text-[9px] font-extrabold leading-tight text-muted"
                      >
                        <span className="text-base">
                          {hand === "right" ? "✋" : "🤚"}
                        </span>
                        {hand === "right" ? "phải" : "trái"}
                      </div>
                      {row.columns.map((c, ci) => {
                        const id = colId(ri, ci);
                        return (
                          <div
                            key={id}
                            ref={
                              hand === "right"
                                ? (el) => {
                                    colRefs.current[id] = el;
                                  }
                                : undefined
                            }
                            style={{ width: cw }}
                            className="shrink-0 px-0.5"
                          >
                            <KeyCell
                              note={c[hand]}
                              width={cw}
                              active={activeCol === id}
                              onTap={() => tapColumn(id, c)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <BigKeyboard
        low={range.low}
        high={range.high}
        pressed={practice ? new Map() : pressed}
        feedback={feedback}
        hint={hint}
        onPress={pressKey}
        banner={
          practice && (
            <PracticeBanner
              practice={practice}
              rowsCount={rows.length}
              showHint={showHint}
              onToggleHint={() => setShowHint((v) => !v)}
              onRetry={() => startPractice(practice.from, practice.to)}
              onNext={() => startPractice(practice.to + 1, practice.to + 1)}
              onExit={exitPractice}
            />
          )
        }
      />
    </div>
  );
}

function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-divider p-1 text-xs font-bold">
      {options.map(([v, label]) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className={`rounded-lg px-2.5 py-1.5 ${value === v ? "bg-white shadow" : "text-muted"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Staff ─────────────────────────────────────────────────────────────
function Staff({
  hand,
  row,
  rowIndex,
  colW,
  song,
  showSig,
  activeCol,
  onTap,
}: {
  hand: Hand;
  row: Row;
  rowIndex: number;
  colW: number;
  song: SongDef;
  showSig: boolean;
  activeCol: string | null;
  onTap: (id: string, c: Column) => void;
}) {
  const clef = CLEF[hand];
  const b = clef.bottomStep;
  const width = LEAD + row.columns.length * colW;
  const [top, bottom] = song.timeSig.split("/");
  const y = (s: number) => yOf(s, hand);
  return (
    <svg width={width} height={STAFF_H} className="block select-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={2}
          x2={width - 2}
          y1={y(b + i * 2)}
          y2={y(b + i * 2)}
          stroke="#2d2a32"
          strokeWidth={1}
        />
      ))}
      <text
        x={hand === "right" ? 2 : 4}
        y={y(b) + clef.glyphDy}
        fontSize={clef.glyphSize}
        fontFamily="'Noto Music','Bravura','Segoe UI Symbol',serif"
        fill="#2d2a32"
      >
        {clef.glyph}
      </text>
      {showSig && (
        <g
          fontWeight={800}
          fontSize={15}
          fill="#2d2a32"
          textAnchor="middle"
          fontFamily="serif"
        >
          <text x={LEAD - 6} y={y(b + 6) + 5}>
            {top}
          </text>
          <text x={LEAD - 6} y={y(b + 2) + 5}>
            {bottom}
          </text>
        </g>
      )}
      {row.columns.map((c, i) => {
        const cx = LEAD + i * colW + colW / 2;
        const barX = LEAD + (i + 1) * colW;
        const id = colId(rowIndex, i);
        const n = c[hand];
        return (
          <g key={id}>
            {c.barAfter && (
              <line
                x1={barX}
                x2={barX}
                y1={y(b + 8)}
                y2={y(b)}
                stroke="#2d2a32"
                strokeWidth={1}
              />
            )}
            <g onClick={() => onTap(id, c)} className="cursor-pointer">
              <rect
                x={cx - colW / 2}
                y={0}
                width={colW}
                height={STAFF_H}
                fill={activeCol === id ? "#fff3c4" : "transparent"}
              />
              {n &&
                (n.rest ? (
                  <RestGlyph cx={cx} beats={n.beats} hand={hand} />
                ) : (
                  <NoteGlyph cx={cx} note={n} hand={hand} />
                ))}
            </g>
          </g>
        );
      })}
      <line
        x1={width - 2}
        x2={width - 2}
        y1={y(b + 8)}
        y2={y(b)}
        stroke="#2d2a32"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function durationShape(beats: number) {
  const dotted = [0.75, 1.5, 3, 6].includes(beats);
  const base = dotted ? beats / 1.5 : beats;
  return { dotted, hollow: base >= 2, stem: base < 4, flag: base <= 0.5 };
}

function NoteGlyph({
  cx,
  note,
  hand,
}: {
  cx: number;
  note: NoteToken;
  hand: Hand;
}) {
  const b = CLEF[hand].bottomStep;
  const y = (s: number) => yOf(s, hand);
  const step = staffStep(note);
  const cy = y(step);
  const color = NOTE_COLOR[note.letter];
  const { dotted, hollow, stem, flag } = durationShape(note.beats);
  const stemDown = step >= b + 4; // middle line and above → stem down
  const ledgers: number[] = [];
  for (let s = b - 2; s >= step; s -= 2) ledgers.push(s);
  for (let s = b + 10; s <= step; s += 2) ledgers.push(s);

  const stemX = stemDown ? cx - 6.2 : cx + 6.2;
  const stemEnd = stemDown ? cy + 34 : cy - 34;

  return (
    <g>
      {ledgers.map((s) => (
        <line
          key={s}
          x1={cx - 11}
          x2={cx + 11}
          y1={y(s)}
          y2={y(s)}
          stroke="#2d2a32"
          strokeWidth={1}
        />
      ))}
      {note.sharp && (
        <text
          x={cx - 19}
          y={cy + 6}
          fontSize={17}
          fontWeight={700}
          fill="#2d2a32"
        >
          ♯
        </text>
      )}
      <ellipse
        cx={cx}
        cy={cy}
        rx={7}
        ry={5}
        transform={`rotate(-20 ${cx} ${cy})`}
        fill={hollow ? "white" : color}
        stroke={hollow ? color : "#2d2a32"}
        strokeWidth={hollow ? 2.6 : 0.8}
      />
      {stem && (
        <line
          x1={stemX}
          x2={stemX}
          y1={cy}
          y2={stemEnd}
          stroke="#2d2a32"
          strokeWidth={1.4}
        />
      )}
      {stem && flag && (
        <path
          d={
            stemDown
              ? `M${stemX} ${stemEnd} q 9 -6 9 -16`
              : `M${stemX} ${stemEnd} q 9 6 9 16`
          }
          stroke="#2d2a32"
          strokeWidth={2}
          fill="none"
        />
      )}
      {dotted && (
        <circle
          cx={cx + 12}
          cy={(step - b) % 2 === 0 ? cy - 3 : cy}
          r={2}
          fill="#2d2a32"
        />
      )}
    </g>
  );
}

function RestGlyph({
  cx,
  beats,
  hand,
}: {
  cx: number;
  beats: number;
  hand: Hand;
}) {
  const b = CLEF[hand].bottomStep;
  const y = (s: number) => yOf(s, hand);
  if (beats >= 2) {
    // whole rest hangs from the 4th line, half rest sits on the middle line
    const top = beats >= 4 ? y(b + 6) : y(b + 4) - 5;
    return <rect x={cx - 7} y={top} width={14} height={5} fill="#2d2a32" />;
  }
  return (
    <text
      x={cx - 6}
      y={y(b + 4) + 8}
      fontSize={26}
      fill="#2d2a32"
      fontFamily="'Noto Music','Segoe UI Symbol',serif"
    >
      {beats <= 0.5 ? "𝄾" : "𝄽"}
    </text>
  );
}

// ─── Key cell (one per note, under its staff) ──────────────────────────
const WHITE_ORDER: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_AFTER: Letter[] = ["C", "D", "F", "G", "A"];

function octaveHint(octave: number) {
  if (octave >= 6) return " ↑↑";
  if (octave === 5) return " ↑";
  if (octave === 3) return " ↓";
  if (octave <= 2) return " ↓↓";
  return "";
}

function KeyCell({
  note,
  width,
  active,
  onTap,
}: {
  note?: NoteToken;
  width: number;
  active: boolean;
  onTap: () => void;
}) {
  if (!note) return <div className="h-[78px]" />;
  if (note.rest) {
    return (
      <div className="flex h-[78px] flex-col items-center justify-center rounded-lg bg-divider text-[10px] font-bold text-muted">
        nghỉ
      </div>
    );
  }
  const color = NOTE_COLOR[note.letter];
  const kw = Math.max(7, Math.min(13, Math.floor((width - 14) / 7)));
  const kh = 24 + (kw - 7) * 2; // mini keyboard grows with the column
  const bw = Math.round(kw * 0.7);
  return (
    <button
      onClick={onTap}
      className={`flex min-h-[78px] w-full flex-col items-center rounded-lg border-2 pb-1 pt-1.5 transition ${
        active
          ? "scale-105 border-yellow bg-[#fff3c4]"
          : "border-transparent bg-canvas"
      }`}
      title={`${noteLabel(note)} (${note.letter}${note.sharp ? "#" : ""}${note.octave})`}
    >
      <svg width={kw * 7} height={kh}>
        {WHITE_ORDER.map((l, i) => (
          <rect
            key={l}
            x={i * kw + 0.5}
            y={0.5}
            width={kw - 1}
            height={kh - 1}
            rx={1.5}
            fill={!note.sharp && note.letter === l ? color : "white"}
            stroke="#c9c4cf"
          />
        ))}
        {BLACK_AFTER.map((l) => {
          const i = WHITE_ORDER.indexOf(l);
          const lit = note.sharp && note.letter === l;
          return (
            <rect
              key={l}
              x={(i + 1) * kw - bw / 2}
              y={0}
              width={bw}
              height={Math.round(kh * 0.6)}
              rx={1}
              fill={lit ? color : "#2d2a32"}
              stroke={lit ? "#2d2a32" : "none"}
            />
          );
        })}
      </svg>
      <span
        className="mt-1 font-display text-[13px] font-extrabold leading-none"
        style={{ color }}
      >
        {noteLabel(note)}
      </span>
      <span className="mt-0.5 text-[10px] font-bold leading-none text-muted">
        {note.letter}
        {note.sharp ? "#" : ""}
        {note.octave}
        {octaveHint(note.octave)}
      </span>
    </button>
  );
}

// ─── Big keyboard (sticky at the bottom) ───────────────────────────────
const WHITE_SEMI = [0, 2, 4, 5, 7, 9, 11];
const isWhite = (midi: number) => WHITE_SEMI.includes(midi % 12);

/** Keyboard spans every note of the song, and at least C3 → C6. */
function keyboardRange(song: SongDef) {
  let low = 48;
  let high = 84;
  for (const line of [...song.lines, ...song.left]) {
    for (const n of parseLine(line)) {
      if (n.rest) continue;
      low = Math.min(low, n.midi);
      high = Math.max(high, n.midi);
    }
  }
  while (!isWhite(low)) low--;
  while (!isWhite(high)) high++;
  return { low, high };
}

const GOOD = "#6bcb77";
const BAD = "#ff6b6b";

function BigKeyboard({
  low,
  high,
  pressed,
  feedback,
  hint,
  onPress,
  banner,
}: {
  low: number;
  high: number;
  pressed: Map<number, Hand>;
  feedback: Feedback;
  hint: Set<number>;
  onPress: (midi: number) => void;
  banner?: React.ReactNode;
}) {
  const whites: { letter: Letter; octave: number; midi: number }[] = [];
  for (let m = low; m <= high; m++) {
    if (isWhite(m)) {
      whites.push({
        letter: WHITE_ORDER[WHITE_SEMI.indexOf(m % 12)],
        octave: Math.floor(m / 12) - 1,
        midi: m,
      });
    }
  }
  const w = 100 / whites.length;
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Start with middle C in view — the keyboard can be wider than a phone.
    const el = scroller.current;
    const i = whites.findIndex((k) => k.midi === 60);
    if (el && i >= 0)
      el.scrollLeft = (i / whites.length) * el.scrollWidth - el.clientWidth / 2;
  }, [low, high]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the key(s) to press in view while practising on a narrow screen.
  const hintKey = [...hint].sort().join(",");
  useEffect(() => {
    const el = scroller.current;
    if (!el || !hintKey) return;
    const midis = hintKey.split(",").map(Number);
    const idx = midis
      .map((m) => whites.findIndex((k) => k.midi === m || k.midi === m - 1))
      .filter((i) => i >= 0);
    if (!idx.length) return;
    const kw = el.scrollWidth / whites.length;
    const left = Math.min(...idx) * kw;
    const right = (Math.max(...idx) + 1) * kw;
    if (left < el.scrollLeft || right > el.scrollLeft + el.clientWidth) {
      el.scrollTo({
        left: (left + right) / 2 - el.clientWidth / 2,
        behavior: "smooth",
      });
    }
  }, [hintKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const keyBg = (midi: number, letter: Letter, black: boolean) => {
    const fb = feedback.get(midi);
    if (fb) return fb === "good" ? GOOD : BAD;
    if (pressed.has(midi)) return NOTE_COLOR[letter];
    if (hint.has(midi))
      return black ? NOTE_COLOR[letter] : `${NOTE_COLOR[letter]}66`;
    if (black) return "#2d2a32";
    return midi === 60 ? "#fff3c4" : "white";
  };
  // Coloured bar on the pressed key: blue = left hand, red = right hand.
  const ring = (h: Hand | undefined) =>
    h === "left"
      ? "inset 0 -6px 0 #2d6fe0"
      : h === "right"
        ? "inset 0 -6px 0 #e0563f"
        : undefined;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-divider bg-white/95 pb-3 pt-2 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto max-w-[922px] px-2">
        {banner}
        <div className="mb-1 flex justify-between px-1 text-[10px] font-bold text-muted">
          <span>⬅ trầm · 🤚 tay trái (vạch xanh)</span>
          <span>✋ tay phải (vạch đỏ) · bổng ➡</span>
        </div>
        <div ref={scroller} className="overflow-x-auto">
          <div
            className="relative h-28 select-none"
            style={{ minWidth: whites.length * 26 }}
          >
            {whites.map((k, i) => {
              const hand = pressed.get(k.midi);
              const lit = hand !== undefined || feedback.has(k.midi);
              return (
                <button
                  key={k.midi}
                  onPointerDown={() => onPress(k.midi)}
                  className="absolute top-0 flex h-full flex-col items-center justify-end rounded-b-md border border-[#c9c4cf] pb-2"
                  style={{
                    left: `${i * w}%`,
                    width: `${w}%`,
                    background: keyBg(k.midi, k.letter, false),
                    boxShadow: hint.has(k.midi)
                      ? `inset 0 0 0 3px ${NOTE_COLOR[k.letter]}`
                      : ring(hand),
                  }}
                >
                  <span
                    className="mb-1 h-1.5 w-3/5 rounded-full"
                    style={{
                      background: NOTE_COLOR[k.letter],
                      opacity: lit ? 0 : 1,
                    }}
                  />
                  <span
                    className={`text-[10px] font-extrabold leading-none ${lit ? "text-white" : "text-ink"}`}
                  >
                    {SOLFEGE[k.letter]}
                  </span>
                  <span
                    className={`text-[8px] font-bold leading-none ${lit ? "text-white" : "text-muted"}`}
                  >
                    {k.letter}
                    {k.octave}
                  </span>
                </button>
              );
            })}
            {whites.slice(0, -1).map((k, i) => {
              if (!BLACK_AFTER.includes(k.letter)) return null;
              const midi = k.midi + 1;
              const hand = pressed.get(midi);
              return (
                <button
                  key={midi}
                  onPointerDown={() => onPress(midi)}
                  className="absolute top-0 z-10 flex h-[60%] flex-col items-center justify-end rounded-b-md pb-1"
                  style={{
                    left: `${(i + 1) * w - w * 0.3}%`,
                    width: `${w * 0.6}%`,
                    background: keyBg(midi, k.letter, true),
                    boxShadow: hint.has(midi)
                      ? "0 0 0 3px #ffc93c"
                      : ring(hand),
                  }}
                >
                  <span className="text-[7px] font-bold leading-none text-white">
                    {SOLFEGE[k.letter]}#
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PracticeBanner({
  practice,
  rowsCount,
  showHint,
  onToggleHint,
  onRetry,
  onNext,
  onExit,
}: {
  practice: Practice;
  rowsCount: number;
  showHint: boolean;
  onToggleHint: () => void;
  onRetry: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const total = practice.steps.length;
  const scope =
    practice.from === practice.to ? `Dòng ${practice.from + 1}` : "Cả bài";
  const btn = "rounded-lg px-2.5 py-1.5 text-xs font-bold whitespace-nowrap";

  if (practice.done) {
    const stars = practiceStars(practice.mistakes, total);
    const hasNext =
      practice.from === practice.to && practice.to + 1 < rowsCount;
    return (
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-green-tint px-3 py-2">
        <span className="mr-auto font-display text-sm font-extrabold text-green-text">
          🎉 Xong {scope}! {"⭐".repeat(stars)}
          <span className="ml-1 font-sans text-xs font-bold text-muted">
            {practice.mistakes === 0
              ? "Không sai phím nào!"
              : `Sai ${practice.mistakes} lần`}
          </span>
        </span>
        <button onClick={onRetry} className={`${btn} bg-white`}>
          🔁 Tập lại
        </button>
        {hasNext && (
          <button onClick={onNext} className={`${btn} bg-purple text-white`}>
            Dòng {practice.to + 2} ➡
          </button>
        )}
        <button
          onClick={onExit}
          className={`${btn} text-muted`}
          aria-label="Thoát chế độ tập"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-purple-tint px-3 py-2">
      <span className="font-display text-sm font-extrabold text-purple-text">
        🎯 Tập {scope}
      </span>
      <span className="mr-auto text-xs font-bold text-muted">
        Nốt {practice.pos + 1}/{total} · sai {practice.mistakes}
      </span>
      <div className="order-last h-1.5 basis-full overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-purple transition-all"
          style={{ width: `${(practice.pos / total) * 100}%` }}
        />
      </div>
      <button onClick={onToggleHint} className={`${btn} bg-white`}>
        {showHint ? "🙈 Ẩn gợi ý" : "💡 Hiện gợi ý"}
      </button>
      <button
        onClick={onExit}
        className={`${btn} text-muted`}
        aria-label="Thoát chế độ tập"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Reading tips ──────────────────────────────────────────────────────
function ReadingTips() {
  return (
    <details className="mt-3 rounded-xl bg-blue-tint p-3 text-xs text-ink">
      <summary className="cursor-pointer font-bold text-blue-text">
        💡 Mẹo đọc nốt cho người mới
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>
          <b>Hai khuông:</b> khuông trên (khóa Sol) là <b>tay phải</b>, khuông
          dưới (khóa Fa) là <b>tay trái</b>. Nốt nằm cùng một cột dọc → hai tay
          bấm <b>cùng lúc</b>.
        </li>
        <li>
          <b>Cao – thấp:</b> nốt càng cao trên khuông → phím càng về bên{" "}
          <b>phải</b>. Tay trái chơi vùng trầm, bên trái Đô giữa.
        </li>
        <li>
          <b>Đô giữa (C4):</b> phím trắng ngay bên trái nhóm <b>2 phím đen</b> ở
          giữa đàn — được tô vàng nhạt trên bàn phím lớn.
        </li>
        <li>
          <b>Màu:</b> Đô đỏ, Rê cam, Mi vàng, Fa xanh lá, Sol xanh dương, La
          tím, Si hồng — trùng màu trên bàn phím lớn.
        </li>
        <li>
          <b>Độ dài:</b> nốt tô màu = 1 phách · có cờ = ½ phách · nốt rỗng có
          đuôi = 2 phách · nốt rỗng không đuôi = 4 phách · có dấu chấm = dài
          thêm một nửa.
        </li>
        <li>
          <b>↑ / ↓</b> cạnh tên nốt: cao / thấp hơn một quãng tám so với vùng Đô
          giữa (C5 ↑, C3 ↓).
        </li>
        <li>
          Tập theo thứ tự: ✋ Tay phải → 🤚 Tay trái → 🙌 Hai tay, luôn bắt đầu
          ở tốc độ 🐢 Chậm.
        </li>
      </ul>
    </details>
  );
}
