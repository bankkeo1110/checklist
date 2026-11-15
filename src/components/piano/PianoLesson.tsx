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
const COL = 58; // width of one note column — staff and key row share it
const LEAD = 44; // left space on each staff line for the clef / time sig
const GAP = 6; // half the distance between two staff lines
const BOTTOM_LINE_Y = 74; // y of the bottom staff line (E4)
const STAFF_H = 108;

const yOf = (step: number) => BOTTOM_LINE_Y - (step - 30) * GAP;

// ─── Tiny Web Audio piano ──────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function ctx(): AudioContext {
  if (!audioCtx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function playTone(midi: number, seconds: number, when = 0) {
  if (Number.isNaN(midi)) return;
  const ac = ctx();
  const t0 = ac.currentTime + when;
  const len = Math.min(Math.max(seconds, 0.25), 2.2);
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(0.35, t0 + 0.012);
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

// ─── Main component ────────────────────────────────────────────────────
export default function PianoLesson() {
  const [songId, setSongId] = useState<string | null>(null);
  const song = SONGS.find((s) => s.id === songId) ?? null;

  if (!song) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="rounded-3xl bg-white p-5 shadow-md">
          <h1 className="font-display text-xl font-extrabold">🎹 Học Piano</h1>
          <p className="mt-1 text-sm text-muted">
            Mỗi bài có <b>khuông nhạc</b> ở trên và <b>phím cần bấm</b> ngay bên dưới từng nốt. Chưa đọc được nốt
            cũng không sao — cứ nhìn màu và tên phím ở dòng dưới mà đánh, dần dần sẽ quen mặt nốt.
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
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Bài {i + 1}</span>
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

type ParsedLine = { notes: (NoteToken & { key: string; barAfter: boolean })[] };

function parseSong(song: SongDef): ParsedLine[] {
  let beat = -(song.pickup ?? 0);
  const lines: ParsedLine[] = [];
  song.lines.forEach((line, li) => {
    const notes: ParsedLine["notes"] = [];
    parseLine(line).forEach((n, ni) => {
      beat += n.beats;
      const barAfter = beat > 0 && Math.abs(beat % song.beatsPerBar) < 1e-6;
      notes.push({ ...n, key: `${li}-${ni}`, barAfter });
    });
    lines.push({ notes });
  });
  return lines;
}

function SongView({ song, onBack }: { song: SongDef; onBack: () => void }) {
  const lines = useMemo(() => parseSong(song), [song]);
  const [speed, setSpeed] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [pressedMidi, setPressedMidi] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const stop = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPlaying(false);
    setActiveKey(null);
    setPressedMidi(null);
  }, []);

  useEffect(() => stop, [stop]);

  const play = (fromKey?: string) => {
    stop();
    const all = lines.flatMap((l) => l.notes);
    const start = fromKey ? Math.max(0, all.findIndex((n) => n.key === fromKey)) : 0;
    const beatSec = 60 / (song.bpm * speed);
    let t = 0.08;
    setPlaying(true);
    for (const n of all.slice(start)) {
      const dur = n.beats * beatSec;
      playTone(n.midi, dur * 0.95, t);
      const at = t;
      timers.current.push(
        window.setTimeout(() => {
          setActiveKey(n.key);
          setPressedMidi(n.rest ? null : n.midi);
          cellRefs.current[n.key]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }, at * 1000),
      );
      t += dur;
    }
    timers.current.push(window.setTimeout(stop, (t + 0.3) * 1000));
  };

  const tapNote = (n: NoteToken & { key: string }) => {
    if (playing) stop();
    playTone(n.midi, 0.8);
    setActiveKey(n.key);
    setPressedMidi(n.rest ? null : n.midi);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 pb-44">
      <button onClick={onBack} className="self-start text-sm font-bold text-blue-text">
        ← Danh sách bài
      </button>

      <div className="rounded-3xl bg-white p-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl">{song.emoji}</span>
          <div className="mr-auto">
            <h1 className="font-display text-lg font-extrabold">{song.title}</h1>
            <p className="text-xs text-muted">
              Nhịp {song.timeSig} · {song.blurb}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-divider p-1 text-xs font-bold">
            {[
              [0.5, "🐢 Chậm"],
              [0.7, "Vừa"],
              [1, "🐇 Nhanh"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setSpeed(v as number)}
                className={`rounded-lg px-2.5 py-1.5 ${speed === v ? "bg-white shadow" : "text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => (playing ? stop() : play())}
            className={`rounded-xl px-4 py-2.5 font-display text-sm font-bold text-white ${
              playing ? "bg-coral" : "bg-green"
            }`}
          >
            {playing ? "⏹ Dừng" : "▶ Nghe mẫu"}
          </button>
        </div>
        <ReadingTips />
      </div>

      {lines.map((line, li) => (
        <div key={li} className="rounded-2xl bg-white p-3 shadow-md">
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-muted">
            <span>Dòng {li + 1}</span>
            <button onClick={() => play(line.notes[0].key)} className="text-blue-text">
              ▶ Nghe từ dòng này
            </button>
          </div>
          <div className="overflow-x-auto">
            <div style={{ width: LEAD + line.notes.length * COL }}>
              <Staff line={line} song={song} showSig={li === 0} activeKey={activeKey} onTap={tapNote} />
              <div className="flex" style={{ paddingLeft: LEAD }}>
                {line.notes.map((n) => (
                  <div
                    key={n.key}
                    ref={(el) => {
                      cellRefs.current[n.key] = el;
                    }}
                    style={{ width: COL }}
                    className="shrink-0 px-0.5"
                  >
                    <KeyCell note={n} active={activeKey === n.key} onTap={() => tapNote(n)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      <BigKeyboard
        pressedMidi={pressedMidi}
        onPress={(midi) => {
          if (playing) stop();
          playTone(midi, 0.8);
          setPressedMidi(midi);
          setActiveKey(null);
        }}
      />
    </div>
  );
}

// ─── Staff (top row) ───────────────────────────────────────────────────
function Staff({
  line,
  song,
  showSig,
  activeKey,
  onTap,
}: {
  line: ParsedLine;
  song: SongDef;
  showSig: boolean;
  activeKey: string | null;
  onTap: (n: NoteToken & { key: string }) => void;
}) {
  const width = LEAD + line.notes.length * COL;
  const [top, bottom] = song.timeSig.split("/");
  return (
    <svg width={width} height={STAFF_H} className="block select-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={2} x2={width - 2} y1={yOf(30 + i * 2)} y2={yOf(30 + i * 2)} stroke="#2d2a32" strokeWidth={1} />
      ))}
      <text x={2} y={yOf(30) + 12} fontSize={56} fontFamily="'Noto Music','Bravura','Segoe UI Symbol',serif" fill="#2d2a32">
        𝄞
      </text>
      {showSig && (
        <g fontWeight={800} fontSize={15} fill="#2d2a32" textAnchor="middle" fontFamily="serif">
          <text x={LEAD - 6} y={yOf(36) + 5}>
            {top}
          </text>
          <text x={LEAD - 6} y={yOf(32) + 5}>
            {bottom}
          </text>
        </g>
      )}
      {line.notes.map((n, i) => {
        const cx = LEAD + i * COL + COL / 2;
        const barX = LEAD + (i + 1) * COL;
        const isLast = i === line.notes.length - 1;
        return (
          <g key={n.key}>
            {n.barAfter && !isLast && (
              <line x1={barX} x2={barX} y1={yOf(38)} y2={yOf(30)} stroke="#2d2a32" strokeWidth={1} />
            )}
            <g onClick={() => onTap(n)} className="cursor-pointer">
              <rect x={cx - COL / 2} y={0} width={COL} height={STAFF_H} fill={activeKey === n.key ? "#fff3c4" : "transparent"} />
              {n.rest ? <RestGlyph cx={cx} beats={n.beats} /> : <NoteGlyph cx={cx} note={n} />}
            </g>
          </g>
        );
      })}
      {line.notes.at(-1) && (
        <line x1={width - 2} x2={width - 2} y1={yOf(38)} y2={yOf(30)} stroke="#2d2a32" strokeWidth={1.5} />
      )}
    </svg>
  );
}

function durationShape(beats: number) {
  const dotted = [0.75, 1.5, 3, 6].includes(beats);
  const base = dotted ? beats / 1.5 : beats;
  return {
    dotted,
    hollow: base >= 2,
    stem: base < 4,
    flag: base <= 0.5,
  };
}

function NoteGlyph({ cx, note }: { cx: number; note: NoteToken }) {
  const step = staffStep(note);
  const cy = yOf(step);
  const color = NOTE_COLOR[note.letter];
  const { dotted, hollow, stem, flag } = durationShape(note.beats);
  const stemDown = step >= 35; // B4 and above → stem down
  const ledgers: number[] = [];
  for (let s = 28; s >= step; s -= 2) ledgers.push(s);
  for (let s = 40; s <= step; s += 2) ledgers.push(s);

  const stemX = stemDown ? cx - 6.2 : cx + 6.2;
  const stemEnd = stemDown ? cy + 34 : cy - 34;

  return (
    <g>
      {ledgers.map((s) => (
        <line key={s} x1={cx - 11} x2={cx + 11} y1={yOf(s)} y2={yOf(s)} stroke="#2d2a32" strokeWidth={1} />
      ))}
      {note.sharp && (
        <text x={cx - 19} y={cy + 6} fontSize={17} fontWeight={700} fill="#2d2a32">
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
      {stem && <line x1={stemX} x2={stemX} y1={cy} y2={stemEnd} stroke="#2d2a32" strokeWidth={1.4} />}
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
      {dotted && <circle cx={cx + 12} cy={step % 2 === 0 ? cy - 3 : cy} r={2} fill="#2d2a32" />}
    </g>
  );
}

function RestGlyph({ cx, beats }: { cx: number; beats: number }) {
  if (beats >= 2) {
    const y = beats >= 4 ? yOf(36) : yOf(34) - 5;
    return <rect x={cx - 7} y={y} width={14} height={5} fill="#2d2a32" />;
  }
  return (
    <text x={cx - 6} y={yOf(34) + 8} fontSize={26} fill="#2d2a32" fontFamily="'Noto Music','Segoe UI Symbol',serif">
      {beats <= 0.5 ? "𝄾" : "𝄽"}
    </text>
  );
}

// ─── Key cell (bottom row, one per note) ───────────────────────────────
const WHITE_ORDER: Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_AFTER: Letter[] = ["C", "D", "F", "G", "A"];

function KeyCell({ note, active, onTap }: { note: NoteToken; active: boolean; onTap: () => void }) {
  if (note.rest) {
    return (
      <div className="flex h-[78px] flex-col items-center justify-center rounded-lg bg-divider text-[10px] font-bold text-muted">
        nghỉ
      </div>
    );
  }
  const color = NOTE_COLOR[note.letter];
  const kw = 7;
  const high = note.octave >= 5;
  return (
    <button
      onClick={onTap}
      className={`flex w-full flex-col items-center rounded-lg border-2 pb-1 pt-1.5 transition ${
        active ? "scale-105 border-yellow bg-[#fff3c4]" : "border-transparent bg-canvas"
      }`}
      title={`${noteLabel(note)} (${note.letter}${note.sharp ? "#" : ""}${note.octave})`}
    >
      {/* one-octave mini keyboard with the key to press lit up */}
      <svg width={kw * 7} height={24}>
        {WHITE_ORDER.map((l, i) => (
          <rect
            key={l}
            x={i * kw + 0.5}
            y={0.5}
            width={kw - 1}
            height={23}
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
              x={(i + 1) * kw - 2.5}
              y={0}
              width={5}
              height={14}
              rx={1}
              fill={lit ? color : "#2d2a32"}
              stroke={lit ? "#2d2a32" : "none"}
            />
          );
        })}
      </svg>
      <span className="mt-1 font-display text-[13px] font-extrabold leading-none" style={{ color }}>
        {noteLabel(note)}
      </span>
      <span className="mt-0.5 text-[10px] font-bold leading-none text-muted">
        {note.letter}
        {note.sharp ? "#" : ""}
        {note.octave}
        {high ? " ↑" : ""}
      </span>
    </button>
  );
}

// ─── Big keyboard (sticky at the bottom) C4 → C6 ───────────────────────
function BigKeyboard({ pressedMidi, onPress }: { pressedMidi: number | null; onPress: (midi: number) => void }) {
  const whites: { letter: Letter; octave: number; midi: number }[] = [];
  for (let o = 4; o <= 5; o++) {
    for (const l of WHITE_ORDER) {
      const n = parseLine(`${l}${o}`)[0];
      whites.push({ letter: l, octave: o, midi: n.midi });
    }
  }
  whites.push({ letter: "C", octave: 6, midi: 84 });
  const w = 100 / whites.length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-divider bg-white/95 px-2 pb-3 pt-2 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto max-w-3xl">
        <div className="mb-1 flex justify-between px-1 text-[10px] font-bold text-muted">
          <span>⬅ trầm · Đô giữa (C4)</span>
          <span>bổng ➡ (C5, C6)</span>
        </div>
        <div className="relative h-28 select-none">
          {whites.map((k, i) => {
            const lit = pressedMidi === k.midi;
            return (
              <button
                key={k.midi}
                onPointerDown={() => onPress(k.midi)}
                className="absolute top-0 flex h-full flex-col items-center justify-end rounded-b-md border border-[#c9c4cf] pb-1.5"
                style={{
                  left: `${i * w}%`,
                  width: `${w}%`,
                  background: lit ? NOTE_COLOR[k.letter] : "white",
                }}
              >
                <span
                  className="mb-1 h-1.5 w-3/5 rounded-full"
                  style={{ background: NOTE_COLOR[k.letter], opacity: lit ? 0 : 1 }}
                />
                <span className={`text-[10px] font-extrabold leading-none ${lit ? "text-white" : "text-ink"}`}>
                  {SOLFEGE[k.letter]}
                </span>
                <span className={`text-[8px] font-bold leading-none ${lit ? "text-white" : "text-muted"}`}>
                  {k.letter}
                  {k.octave}
                </span>
              </button>
            );
          })}
          {whites.slice(0, -1).map((k, i) => {
            if (!BLACK_AFTER.includes(k.letter)) return null;
            const midi = k.midi + 1;
            const lit = pressedMidi === midi;
            return (
              <button
                key={midi}
                onPointerDown={() => onPress(midi)}
                className="absolute top-0 z-10 flex h-[60%] flex-col items-center justify-end rounded-b-md pb-1"
                style={{
                  left: `${(i + 1) * w - w * 0.3}%`,
                  width: `${w * 0.6}%`,
                  background: lit ? NOTE_COLOR[k.letter] : "#2d2a32",
                }}
              >
                <span className="text-[7px] font-bold leading-none text-white">{SOLFEGE[k.letter]}#</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Reading tips ──────────────────────────────────────────────────────
function ReadingTips() {
  return (
    <details className="mt-3 rounded-xl bg-blue-tint p-3 text-xs text-ink">
      <summary className="cursor-pointer font-bold text-blue-text">💡 Mẹo đọc nốt cho người mới</summary>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>
          <b>Cao – thấp:</b> nốt nằm càng cao trên khuông → phím càng về bên <b>phải</b>.
        </li>
        <li>
          <b>Đô giữa (C4):</b> phím trắng ngay bên trái nhóm <b>2 phím đen</b> ở giữa đàn. Nốt có gạch ngang nhỏ bên
          dưới khuông chính là Đô giữa.
        </li>
        <li>
          <b>Màu:</b> mỗi nốt có một màu riêng (Đô đỏ, Rê cam, Mi vàng, Fa xanh lá, Sol xanh dương, La tím, Si hồng) —
          trùng với màu trên bàn phím lớn bên dưới.
        </li>
        <li>
          <b>Độ dài:</b> nốt tô màu = 1 phách · có cờ = ½ phách · nốt rỗng có đuôi = 2 phách · nốt rỗng không đuôi = 4
          phách · có dấu chấm = dài thêm một nửa.
        </li>
        <li>
          <b>↑</b> cạnh tên nốt (C5, D5…) nghĩa là quãng tám cao hơn — dịch tay sang phải 7 phím trắng.
        </li>
        <li>Chạm vào nốt bất kỳ để nghe thử, hoặc chọn 🐢 Chậm rồi bấm “Nghe mẫu” để đánh theo.</li>
      </ul>
    </details>
  );
}
