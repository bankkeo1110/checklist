'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { generateQuestion, TOPICS, TOPIC_CATEGORIES, type Topic, type Question, type Category } from '@/lib/mathfun/questions';
import { shuffle } from '@/lib/mathfun/qutil';
import { addCredit, BONUS_SECONDS, PLAY_SECONDS } from '@/lib/mathfun/footballCredit';
import { LESSONS } from '@/lib/mathfun/curriculum';
import { ISLANDS, islandOfLesson, nextLessonId } from '@/lib/mathfun/islands';
import MathText from '@/components/mathfun/MathText';
import Battle from '@/components/mathfun/Battle';
import {
  TARGET_POINTS, CHALLENGE_TOPIC, RETRY_AFTER, calcScore, isSessionComplete,
  calcAccuracy, getPointsDelta, starsForAccuracy,
} from '@/lib/mathfun/practice-logic';

const LEGACY_ORDER: Category[] = ['numbers', 'fractions', 'measurement-geometry', 'problem-solving'];

interface AuthUser { studentId: number; name: string; }
interface BadgeResult { badge: string; isNew: boolean; isUpgrade: boolean; previousBadge: string | null; }
interface Badge { topic: string; badge: string; bestScore: number; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };
const BADGE_LABEL: Record<string, string> = {
  bronze: 'Huy hiệu Đồng', silver: 'Huy hiệu Bạc', gold: 'Huy hiệu Vàng', perfect: 'Vương miện Hoàn hảo!',
};

// v2: the saved shape gained a streak, so old saves are ignored rather than half-loaded.
const PROGRESS_KEY = 'mathapp_session_progress_v2';

type Phase = 'setup' | 'theory' | 'playing' | 'result';

interface SavedProgress {
  topic: Topic;
  points: number;
  correctCount: number;
  totalAnswered: number;
  streak: number;
  savedAt: number;
}

const CHALLENGE_META = { emoji: '🐲', label: 'Thử thách tổng hợp', color: 'bg-purple-100 border-purple-400 text-purple-800' };

function metaOf(topic: Topic) {
  if (topic === CHALLENGE_TOPIC) return CHALLENGE_META;
  return TOPICS.find((t) => t.id === topic) ?? { emoji: '❓', label: String(topic), color: 'bg-gray-100 border-gray-300 text-gray-700' };
}

/** Who the kid is fighting on this exercise. */
function guardOf(topic: Topic) {
  if (topic === CHALLENGE_TOPIC) return { guard: '🐲', guardName: 'Rồng Thử Thách' };
  const island = islandOfLesson(String(topic));
  return island ? { guard: island.guard, guardName: island.guardName } : { guard: '👾', guardName: 'Quái vật Toán học' };
}

// ── Sound effects via Web Audio API ──────────────────────────────────────────

function playSound(correct: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (correct) {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } else {
      [380, 260].forEach((startFreq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        const t = ctx.currentTime + i * 0.25;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.55, t + 0.22);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    }
  } catch { /* audio not supported */ }
}

// ── Session progress persistence ──────────────────────────────────────────────

function saveProgress(p: Omit<SavedProgress, 'savedAt'>) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...p, savedAt: Date.now() })); } catch { /* ignore */ }
}

function loadProgress(topic?: Topic): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const data: SavedProgress = JSON.parse(raw);
    if (topic !== undefined && data.topic !== topic) return null;
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) return null;
    if (isSessionComplete(data.points)) return null;
    return data;
  } catch { return null; }
}

function clearProgress() {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
}

// ── Component ─────────────────────────────────────────────────────────────────

function PracticeApp() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get('topic') as Topic | null;

  const [phase, setPhase] = useState<Phase>('setup');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic>(topicParam ?? LESSONS[0].id);

  const lesson = LESSONS.find((l) => l.id === selectedTopic);
  const { guard, guardName } = guardOf(selectedTopic);

  const [question, setQuestion] = useState<Question | null>(null);
  const [isRetry, setIsRetry] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState<BadgeResult | null>(null);
  const [bonusEarned, setBonusEarned] = useState(false);

  const [hitKey, setHitKey] = useState(0);
  const [hurtKey, setHurtKey] = useState(0);
  const [flash, setFlash] = useState<{ val: string; key: number } | null>(null);
  const flashKey = useRef(0);
  const pendingRef = useRef<{ points: number; correct: number; total: number; streak: number } | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Missed questions come back a few questions later instead of being lost.
  const retryRef = useRef<{ q: Question; due: number }[]>([]);
  const askedRef = useRef(0);
  const [retryLeft, setRetryLeft] = useState(0);

  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  useEffect(() => {
    fetch('/api/mathfun/me').then((r) => r.json()).then((d) => {
      const u = d.user ?? null;
      setUser(u);
      if (u) {
        fetch(`/api/mathfun/students/${u.studentId}`).then((r) => r.json())
          .then((data) => setBadges(data.badges ?? []))
          .catch(() => { /* badges are decoration; the exercise works without them */ });
      }
    }).catch(() => { /* not signed in / offline: practice still works, nothing is recorded */ });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setSavedProgress(loadProgress());
  }, []);

  useEffect(() => () => { if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current); }, []);

  const nextQuestion = useCallback((topic: Topic = selectedTopic) => {
    const due = retryRef.current.findIndex((r) => r.due <= askedRef.current);
    let q: Question;
    if (due >= 0) {
      const item = retryRef.current.splice(due, 1)[0];
      setRetryLeft(retryRef.current.length);
      q = { ...item.q, choices: shuffle(item.q.choices) }; // same question, answers moved around
      setIsRetry(true);
    } else {
      q = generateQuestion(topic);
      setIsRetry(false);
    }
    askedRef.current++;
    setQuestion(q);
    setChosen(null);
    setIsCorrect(null);
    pendingRef.current = null;
  }, [selectedTopic]);

  const startGame = useCallback((topic: Topic, forceNew = false) => {
    const saved = forceNew ? null : loadProgress(topic);
    setSelectedTopic(topic);
    setPoints(saved?.points ?? 0);
    setCorrectCount(saved?.correctCount ?? 0);
    setTotalAnswered(saved?.totalAnswered ?? 0);
    setStreak(saved?.streak ?? 0);
    setBestStreak(saved?.streak ?? 0);
    if (!saved) clearProgress();
    setEarnedBadge(null);
    setBonusEarned(false);
    setFlash(null);
    retryRef.current = [];
    askedRef.current = 0;
    setRetryLeft(0);
    const hasTheory = LESSONS.some((l) => l.id === topic);
    // A lesson opens on its rule + examples; resuming jumps straight back into the fight.
    setPhase(hasTheory && !saved ? 'theory' : 'playing');
    try { localStorage.setItem('mathapp_last_topic', String(topic)); } catch { /* ignore */ }
    nextQuestion(topic);
  }, [nextQuestion]);

  // ?topic=… in the URL goes straight into that exercise.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStarted.current || !topicParam) return;
    autoStarted.current = true;
    startGame(topicParam);
  }, [topicParam, startGame]);

  const handleAnswer = (choice: string) => {
    if (chosen || !question) return;
    setChosen(choice);
    const correct = choice === question.answer;
    setIsCorrect(correct);

    const newTotal = totalAnswered + 1;
    const newCorrect = correctCount + (correct ? 1 : 0);
    const delta = getPointsDelta(streak, correct);
    const newPoints = calcScore(points, streak, correct);
    const newStreak = correct ? streak + 1 : 0;

    setTotalAnswered(newTotal);
    setCorrectCount(newCorrect);
    setPoints(newPoints);
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    if (correct) setHitKey((k) => k + 1); else setHurtKey((k) => k + 1);

    playSound(correct);

    flashKey.current++;
    setFlash({ val: `${correct ? '-' : '+'}${Math.abs(delta)} HP`, key: flashKey.current });
    setTimeout(() => setFlash(null), 700);

    if (!correct) {
      retryRef.current.push({ q: question, due: askedRef.current + RETRY_AFTER });
      setRetryLeft(retryRef.current.length);
    }

    saveProgress({ topic: selectedTopic, points: newPoints, correctCount: newCorrect, totalAnswered: newTotal, streak: newStreak });
    pendingRef.current = { points: newPoints, correct: newCorrect, total: newTotal, streak: newStreak };

    if (correct) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => { void handleGotIt(); }, 1200);
    }

    if (user) {
      fetch('/api/mathfun/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.studentId,
          topic: selectedTopic,
          question: question.question,
          correctAnswer: question.answer,
          studentAnswer: choice,
          isCorrect: correct,
        }),
      }).catch(() => { /* logging an answer must never interrupt the exercise */ });
    }
  };

  const handleGotIt = async () => {
    const pending = pendingRef.current;
    if (!pending) return;

    // Everything missed has to be answered again before the guard goes down.
    if (isSessionComplete(pending.points) && retryRef.current.length === 0) {
      clearProgress();
      setSavedProgress(null);
      const flawless = pending.correct === pending.total;
      setBonusEarned(flawless);
      addCredit(PLAY_SECONDS + (flawless ? BONUS_SECONDS : 0));
      if (user) {
        try {
          const res = await fetch('/api/mathfun/sessions/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: user.studentId, topic: selectedTopic, correct: pending.correct, total: pending.total }),
          });
          setEarnedBadge(await res.json());
        } catch { /* silent */ }
      }
      setPhase('result');
    } else {
      nextQuestion();
    }
  };

  const topicInfo = metaOf(selectedTopic);

  /* ── THEORY (rule + worked examples, then exercises) ── */
  if (phase === 'theory' && lesson) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setPhase('setup')}
            className="card-comic-sm bg-white font-black text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            ← Quay lại
          </button>
          <span className={`card-comic-sm px-3 py-1 rounded-full font-black text-sm ${lesson.color}`}>
            {lesson.emoji} {lesson.label}
          </span>
        </div>

        <div className="card-comic bg-white rounded-2xl p-6 mb-4">
          <h2 className="font-black text-lg mb-2">📖 Quy tắc cần nhớ</h2>
          <div className="text-gray-700 leading-relaxed [&_p]:font-normal! [&_p]:mb-2">
            <MathText content={lesson.rule} />
          </div>
        </div>

        <div className="card-comic bg-yellow-50 rounded-2xl p-6 mb-5">
          <h2 className="font-black text-lg mb-3">✏️ Ví dụ</h2>
          <div className="flex flex-col gap-4">
            {lesson.examples.map((ex, i) => (
              <div key={i} className="text-gray-700 [&_p]:font-normal!">
                <div className="font-bold text-gray-900"><MathText content={`Ví dụ ${i + 1}: ${ex.q}`} /></div>
                <div className="mt-1 pl-3 border-l-4 border-green-400"><MathText content={`→ ${ex.a}`} /></div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setPhase('playing')}
          className="card-comic w-full bg-[#FFD015] text-[#1a1a1a] font-black py-4 rounded-2xl text-lg hover:bg-yellow-300 transition">
          ⚔️ Đánh bại {guard} {guardName}!
        </button>
      </div>
    );
  }

  /* ── SETUP ── */
  if (phase === 'setup') {
    const badgeOf = (id: string) => badges.find((b) => b.topic === id);
    return (
      <div className="max-w-2xl mx-auto">
        {user && (
          <div className="card-comic bg-[#4A6CF7] text-white rounded-2xl px-5 py-3 mb-5 flex items-center gap-3">
            <div className="text-2xl">👋</div>
            <div>
              <span className="font-black">Chào {user.name}!</span>
              <span className="text-blue-200 font-semibold text-sm ml-2">Hôm nay hạ quái nào đây?</span>
            </div>
          </div>
        )}

        <h1 className="font-black text-3xl text-[#1a1a1a] mb-1 tracking-wide">⚔️ CHỌN TRẬN ĐẤU</h1>
        <p className="font-semibold text-gray-500 mb-5">
          Mỗi câu đúng là một đòn đánh. Hạ đủ 100 HP của quái vật để thắng và nhận 5 phút đá bóng.
        </p>

        {savedProgress && (
          <div className="card-comic-sm bg-amber-50 border-amber-400 rounded-2xl p-4 mb-5 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-amber-800">
              💾 Trận dở: <strong>{metaOf(savedProgress.topic).label}</strong> · còn {TARGET_POINTS - savedProgress.points} HP
            </span>
            <button onClick={() => startGame(savedProgress.topic)}
              className="card-comic-sm bg-[#FFD015] font-black text-sm px-4 py-2 rounded-xl hover:bg-yellow-300 transition ml-auto">
              ▶ Đánh tiếp
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-5">
          {ISLANDS.map((island) => (
            <div key={island.n} className="card-comic bg-white rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-full bg-[#FFD015] border-2 border-[#1a1a1a] font-black text-sm flex items-center justify-center shrink-0">
                  {island.n}
                </span>
                <span className="font-black">{island.title}</span>
                <span className="text-sm font-bold text-gray-400 truncate">{island.guard} {island.guardName}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {island.lessonIds.map((id) => {
                  const l = LESSONS.find((x) => x.id === id);
                  if (!l) return null;
                  const b = badgeOf(id);
                  return (
                    <button key={id} onClick={() => startGame(id)}
                      className={`card-comic-sm rounded-xl p-2.5 font-black text-left text-sm flex items-center gap-2 transition hover:-translate-y-0.5 ${l.color}`}>
                      <span>{l.emoji}</span>
                      <span className="flex-1 min-w-0 truncate">{l.label}</span>
                      <span className="shrink-0">{b ? BADGE_EMOJI[b.badge] : '▶'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => startGame(CHALLENGE_TOPIC)}
          className="card-comic w-full bg-purple-500 text-white font-black py-4 rounded-2xl text-lg hover:bg-purple-600 transition mb-5">
          🐲 Thử thách tổng hợp — câu hỏi trộn từ mọi bài!
        </button>

        <details className="card-comic bg-white rounded-2xl p-4">
          <summary className="font-black cursor-pointer">🇬🇧 Các chủ đề luyện thêm (tiếng Anh)</summary>
          <div className="space-y-4 mt-3">
            {LEGACY_ORDER.map((cat) => {
              const catTopics = TOPICS.filter((t) => t.category === cat);
              if (!catTopics.length) return null;
              const catMeta = TOPIC_CATEGORIES[cat];
              return (
                <div key={cat}>
                  <div className="text-xs font-black tracking-widest text-gray-400 mb-2">{catMeta.emoji} {catMeta.label.toUpperCase()}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {catTopics.map((t) => (
                      <button key={t.id} onClick={() => startGame(t.id)}
                        className="card-comic-sm rounded-xl p-2.5 font-black text-left text-sm bg-white border-gray-300 hover:border-[#1a1a1a] transition">
                        <span>{t.emoji}</span><span className="ml-1.5">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </div>
    );
  }

  /* ── RESULT ── */
  if (phase === 'result') {
    const accuracy = calcAccuracy(correctCount, totalAnswered);
    const stars = starsForAccuracy(accuracy);
    const nextId = lesson ? nextLessonId(lesson.id) : undefined;
    const nextLesson = nextId ? LESSONS.find((l) => l.id === nextId) : undefined;
    return (
      <div className="max-w-md mx-auto text-center">
        {earnedBadge && (earnedBadge.isNew || earnedBadge.isUpgrade) && (
          <div className={`card-comic rounded-2xl mb-4 p-5 animate-pop ${
            earnedBadge.badge === 'perfect' ? 'bg-purple-100 border-purple-500' :
            earnedBadge.badge === 'gold' ? 'bg-yellow-100 border-yellow-500' :
            earnedBadge.badge === 'silver' ? 'bg-gray-100 border-gray-400' : 'bg-amber-100 border-amber-500'
          }`}>
            <div className="text-6xl mb-1">{BADGE_EMOJI[earnedBadge.badge]}</div>
            <div className="font-black text-xl">{earnedBadge.isNew ? '🎉 HUY HIỆU MỚI!' : '⬆️ LÊN HẠNG HUY HIỆU!'}</div>
            <div className="font-semibold text-gray-600 mt-1">
              {earnedBadge.isUpgrade && earnedBadge.previousBadge ? `${BADGE_EMOJI[earnedBadge.previousBadge]} → ${BADGE_EMOJI[earnedBadge.badge]} ` : ''}
              {BADGE_LABEL[earnedBadge.badge]} · {topicInfo.emoji} {topicInfo.label}
            </div>
          </div>
        )}

        <div className="card-comic bg-white rounded-3xl p-8">
          <div className="text-7xl mb-2">{guard}💥</div>
          <h1 className="font-black text-3xl mb-1 tracking-wide">HẠ GỤC {guardName.toUpperCase()}!</h1>
          <div className="text-4xl my-2" aria-label={`${stars} trên 3 sao`}>
            {'⭐'.repeat(stars)}<span className="opacity-20">{'⭐'.repeat(3 - stars)}</span>
          </div>
          <p className="text-gray-400 font-bold mb-3">{topicInfo.emoji} {topicInfo.label}</p>

          <Link href="/child/games/football" className="card-comic-sm mb-4 inline-block bg-green-100 border-green-500 font-black text-green-800 py-2 px-4 rounded-xl hover:bg-green-200 transition">
            ⚽ Được chơi đá bóng {5 + (bonusEarned ? 2 : 0)} phút{bonusEarned ? ' (thưởng 2 phút vì không sai câu nào!)' : ''} → Chơi ngay
          </Link>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card-comic-sm bg-green-50 border-green-400 rounded-xl p-3">
              <div className="font-black text-3xl text-green-600">{correctCount}</div>
              <div className="text-xs font-bold text-gray-500">ĐÚNG</div>
            </div>
            <div className="card-comic-sm bg-red-50 border-red-400 rounded-xl p-3">
              <div className="font-black text-3xl text-red-500">{totalAnswered - correctCount}</div>
              <div className="text-xs font-bold text-gray-500">SAI</div>
            </div>
            <div className="card-comic-sm bg-orange-50 border-orange-400 rounded-xl p-3">
              <div className="font-black text-3xl text-orange-500">{bestStreak}</div>
              <div className="text-xs font-bold text-gray-500">CHUỖI DÀI NHẤT</div>
            </div>
          </div>

          <p className="text-sm text-gray-400 font-semibold mb-6">{totalAnswered} câu · đúng {accuracy}%</p>

          <div className="flex flex-wrap gap-3 justify-center">
            {nextLesson && (
              <button onClick={() => startGame(nextLesson.id)}
                className="card-comic-sm bg-[#4A6CF7] text-white font-black py-3 px-5 rounded-xl hover:opacity-90 transition">
                ▶ Bài tiếp theo: {nextLesson.emoji} {nextLesson.label}
              </button>
            )}
            <button onClick={() => startGame(selectedTopic, true)}
              className="card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black py-3 px-5 rounded-xl hover:bg-yellow-300 transition">
              🔄 Đánh lại
            </button>
            <Link href="/mathfun" className="card-comic-sm bg-white text-[#1a1a1a] font-black py-3 px-5 rounded-xl hover:bg-gray-50 transition">
              🗺️ Về bản đồ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── PLAYING ── */

  return (
    <div className="max-w-xl mx-auto relative">
      {flash && (
        <div key={flash.key}
          className={`absolute top-0 right-0 font-black text-3xl pointer-events-none animate-flash z-10 ${
            flash.val.startsWith('-') ? 'text-green-500' : 'text-red-500'
          }`}>
          {flash.val}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-3">
        <button onClick={() => setPhase('setup')}
          className="card-comic-sm bg-white font-black text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
          ← Thoát
        </button>
        <span className={`card-comic-sm px-3 py-1 rounded-full font-black text-sm truncate ${topicInfo.color}`}>
          {topicInfo.emoji} {topicInfo.label}
        </span>
        {lesson && (
          <button onClick={() => setPhase('theory')} className="card-comic-sm bg-white font-black text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition shrink-0">
            📖 Lý thuyết
          </button>
        )}
      </div>

      <Battle guard={guard} guardName={guardName} points={points} hitKey={hitKey} hurtKey={hurtKey} streak={streak} />

      {question && (
        <div className="card-comic bg-white rounded-2xl p-7 mb-4">
          {isRetry && !chosen && (
            <p className="text-center font-black text-sm text-amber-600 mb-2">🔁 Câu lúc nãy làm sai — thử lại nào!</p>
          )}
          <p className="font-black text-2xl text-center text-[#1a1a1a] mb-8 leading-snug">{question.question}</p>
          <div className="grid grid-cols-2 gap-3">
            {question.choices.map((c) => {
              let cls = 'card-comic-sm border-[#1a1a1a] bg-white hover:bg-yellow-50 hover:border-yellow-400';
              if (chosen) {
                if (c === question.answer) cls = 'border-green-500 bg-green-100 shadow-[3px_3px_0px_#16a34a]';
                else if (c === chosen) cls = 'border-red-400 bg-red-100 shadow-[3px_3px_0px_#ef4444]';
                else cls = 'border-gray-200 bg-gray-50 opacity-50';
              }
              return (
                <button key={c} onClick={() => handleAnswer(c)} disabled={!!chosen}
                  className={`${cls} rounded-xl py-5 font-black text-xl transition text-center border-2`}>
                  {c}
                </button>
              );
            })}
          </div>

          {chosen && (
            <div className="mt-5">
              <div className={`text-center font-black text-lg ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                {isCorrect
                  ? ['✅ Chuẩn luôn!', '✅ Đòn hiểm!', '✅ Quá giỏi!', '✅ Trúng rồi!'][totalAnswered % 4]
                  : `❌ Chưa đúng — đáp án là ${question.answer}`}
              </div>

              {question.explanation && (
                <div className={`mt-3 border-2 rounded-xl p-3 text-sm font-semibold text-gray-700 text-left ${
                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'
                }`}>
                  💡 <span className="font-black text-gray-800">{isCorrect ? 'Vì sao đúng:' : 'Cách làm:'}</span>{' '}
                  <MathText content={question.explanation} />
                </div>
              )}

              {!isCorrect && (
                <button onClick={() => { void handleGotIt(); }}
                  className="mt-4 w-full font-black text-lg py-3 px-6 rounded-xl transition card-comic bg-[#4A6CF7] hover:opacity-90 text-white border-blue-800">
                  Hiểu rồi! 👍
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-center font-black text-gray-400 text-sm">
        {points >= TARGET_POINTS && retryLeft > 0
          ? `🔁 Còn ${retryLeft} câu sai phải làm lại mới hạ được quái!`
          : points >= 60 ? `Sắp hạ được rồi! Còn ${TARGET_POINTS - points} HP 🔥` : `✅ ${correctCount} · ❌ ${totalAnswered - correctCount}`}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 font-black text-2xl">Đang tải... ⏳</div>}>
      <PracticeApp />
    </Suspense>
  );
}
