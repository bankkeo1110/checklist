'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCredit } from '@/lib/mathfun/footballCredit';
import { TOPICS } from '@/lib/mathfun/questions';
import { LESSONS } from '@/lib/mathfun/curriculum';
import IslandMap from '@/components/mathfun/IslandMap';

interface Badge { topic: string; badge: string; bestScore: number; attempts: number; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };

export default function Home() {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [creditSec, setCreditSec] = useState(0);

  useEffect(() => {
    const topic = localStorage.getItem('mathapp_last_topic');
    setLastTopic(topic);
    setCreditSec(getCredit());
    fetch('/api/mathfun/me')
      .then(r => r.json())
      .then(d => {
        const user = d.user;
        if (!user) return;
        setStudentId(user.studentId);
        setStudentName(user.name);
        return fetch(`/api/mathfun/students/${user.studentId}`)
          .then(r => r.json())
          .then(data => {
            setBadges(data.badges ?? []);
            if (!topic && data.recentAnswers?.length) {
              setLastTopic(data.recentAnswers[0]?.topic ?? null);
            }
          });
      });
  }, []);

  const lastTopicInfo = TOPICS.find(t => t.id === lastTopic);
  const lessonIds = new Set(LESSONS.map(l => l.id));
  const topicsDone = badges.filter(b => lessonIds.has(b.topic)).length;
  const totalTopics = LESSONS.length;

  const greetings = ['POW!', 'WOW!', 'YO!', 'HEY!'];
  const greeting = studentName ? greetings[studentName.charCodeAt(0) % greetings.length] : 'HEY!';

  return (
    <div className="max-w-6xl mx-auto">

      {/* Row 1 — greeting + counter */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="card-comic bg-white rounded-2xl p-5 max-w-sm">
          <h2 className="font-black text-2xl text-[#1a1a1a]">
            {studentName ? `${greeting} Hey ${studentName} 🧮` : 'Welcome to Math Fun! 🧮'}
          </h2>
          <p className="text-gray-500 mt-1 font-semibold">Time to power up your brain.</p>
        </div>
        <div className="card-comic bg-green-500 text-white font-black text-center px-7 py-3 rounded-2xl shrink-0">
          <div className="text-4xl leading-none">{topicsDone}/{totalTopics}</div>
          <div className="text-xs tracking-[0.15em] mt-1">TOPICS DONE</div>
        </div>
      </div>

      {/* Row 2 — Continue + Daily Quiz */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="card-comic bg-[#4A6CF7] text-white rounded-2xl p-6 flex flex-col justify-between min-h-[180px]">
          {lastTopicInfo ? (
            <>
              <div>
                <span className="bg-[#FFD015] text-[#1a1a1a] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wide">
                  Continue · Math
                </span>
                <h3 className="font-black text-2xl mt-3 mb-1">{lastTopicInfo.emoji} {lastTopicInfo.label}</h3>
                {(() => { const b = badges.find(x => x.topic === lastTopic); return <p className="text-blue-200 text-sm">{b ? `Best: ${b.bestScore}% · ${BADGE_EMOJI[b.badge]} ${b.badge}` : 'Not completed yet'}</p>; })()}
              </div>
              <Link href={`/mathfun/practice?topic=${lastTopic}`} className="mt-4 bg-[#FFD015] text-[#1a1a1a] font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-yellow-300 transition w-fit">
                ▶ RESUME
              </Link>
            </>
          ) : (
            <>
              <div>
                <span className="bg-[#FFD015] text-[#1a1a1a] font-black text-xs px-3 py-1 rounded-full">START HERE</span>
                <h3 className="font-black text-2xl mt-3 mb-1">🚀 Let&apos;s Begin!</h3>
                <p className="text-blue-200 text-sm">Pick a topic below and start earning badges</p>
              </div>
              <Link href="/mathfun/practice" className="mt-4 bg-[#FFD015] text-[#1a1a1a] font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-yellow-300 transition w-fit">
                ▶ START
              </Link>
            </>
          )}
        </div>

        <div className="card-comic bg-[#E85555] text-white rounded-2xl p-6 flex flex-col justify-between min-h-[180px]">
          <div>
            <h3 className="font-black text-2xl mb-2 tracking-wide">DAILY QUIZ</h3>
            <p className="text-red-100 font-semibold">Mix of all topics. Beat your best score!</p>
          </div>
          <Link href="/mathfun/practice" className="mt-4 border-2 border-white text-white font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-white hover:text-[#E85555] transition w-fit">
            START →
          </Link>
        </div>
      </div>

      {/* Reward: football */}
      <Link href="/child/games/football" className="card-comic bg-green-500 text-white rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
        <div>
          <h3 className="font-black text-xl">⚽ Đá bóng thưởng</h3>
          <p className="text-green-50 font-semibold text-sm">Đạt 100 điểm một bài toán để được chơi 5 phút.</p>
        </div>
        <div className="shrink-0 text-center font-black">
          <div className="text-3xl leading-none">{Math.floor(creditSec / 60)}:{String(creditSec % 60).padStart(2, '0')}</div>
          <div className="text-xs tracking-widest mt-1">CÒN LẠI</div>
        </div>
      </Link>

      {/* Toán lớp 5 — treasure map */}
      <h2 className="font-black text-xs tracking-[0.2em] text-[#1a1a1a] mb-3 flex items-center gap-2">
        <span>🗺️</span><span>HÀNH TRÌNH TOÁN LỚP 5</span>
        <span className="text-gray-400 font-bold">(chạm vào đảo để chọn bài)</span>
      </h2>
      <div className="mb-6"><IslandMap badges={badges} /></div>
      <div className="mb-8 text-center">
        <Link href="/mathfun/practice" className="card-comic-sm bg-white font-black text-sm px-5 py-2 rounded-xl inline-block hover:bg-gray-50 transition">
          📚 Luyện thêm các chủ đề khác →
        </Link>
      </div>

      {!studentId && (
        <div className="mt-2 card-comic bg-[#FFD015] rounded-2xl p-5 text-center">
          <p className="font-black text-lg mb-3">Select your name in Practice to track progress! 👆</p>
          <Link href="/mathfun/practice" className="card-comic-sm bg-[#1a1a1a] text-white font-black px-8 py-3 rounded-xl inline-block hover:opacity-90 transition">
            Go to Practice →
          </Link>
        </div>
      )}
    </div>
  );
}
