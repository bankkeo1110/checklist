'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCredit } from '@/lib/mathfun/footballCredit';
import { LESSONS } from '@/lib/mathfun/curriculum';
import { CHALLENGE_TOPIC } from '@/lib/mathfun/practice-logic';
import { currentIslandNumber, ISLANDS, islandOfLesson } from '@/lib/mathfun/islands';
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
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only readable after mount */
    setLastTopic(topic);
    setCreditSec(getCredit());
    /* eslint-enable react-hooks/set-state-in-effect */
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
            if (!topic && data.recentAnswers?.length) setLastTopic(data.recentAnswers[0]?.topic ?? null);
          });
      })
      .catch(() => { /* not signed in: the map still works, nothing is recorded */ });
  }, []);

  const lessonIds = new Set(LESSONS.map(l => l.id));
  const doneCount = badges.filter(b => lessonIds.has(b.topic)).length;
  const lastLesson = LESSONS.find(l => l.id === lastTopic);
  // Nothing played yet: point the kid at the first lesson of the island they are on.
  const island = ISLANDS.find(i => i.n === currentIslandNumber(badges))!;
  const suggested = lastLesson ?? LESSONS.find(l => l.id === island.lessonIds.find(id => !badges.some(b => b.topic === id))) ?? LESSONS[0];
  const suggestedIsland = islandOfLesson(suggested.id);
  const suggestedBadge = badges.find(b => b.topic === suggested.id);

  return (
    <div className="max-w-6xl mx-auto">

      {/* Row 1 — greeting + counter */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="card-comic bg-white rounded-2xl p-5 max-w-sm">
          <h2 className="font-black text-2xl text-[#1a1a1a]">
            {studentName ? `Chào ${studentName}! 🧮` : 'Toán lớp 5 — Kho báu trong rừng sâu 🧮'}
          </h2>
          <p className="text-gray-500 mt-1 font-semibold">Đi qua 7 hòn đảo, hạ hết quái vật để lấy kho báu.</p>
        </div>
        <div className="card-comic bg-green-500 text-white font-black text-center px-7 py-3 rounded-2xl shrink-0">
          <div className="text-4xl leading-none">{doneCount}/{LESSONS.length}</div>
          <div className="text-xs tracking-[0.15em] mt-1">BÀI ĐÃ XONG</div>
        </div>
      </div>

      {/* Map — the way into every lesson */}
      <h2 className="font-black text-xs tracking-[0.2em] text-[#1a1a1a] mb-3 flex items-center gap-2 flex-wrap">
        <span>🗺️</span><span>HÀNH TRÌNH TOÁN LỚP 5</span>
        <span className="text-gray-400 font-bold">(chạm vào đảo để chọn bài)</span>
      </h2>
      <div className="mb-6"><IslandMap badges={badges} /></div>

      {/* Row 2 — continue + mixed challenge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="card-comic bg-[#4A6CF7] text-white rounded-2xl p-6 flex flex-col justify-between min-h-[170px]">
          <div>
            <span className="bg-[#FFD015] text-[#1a1a1a] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wide">
              {lastLesson ? 'Đánh tiếp' : 'Bắt đầu ở đây'}
            </span>
            <h3 className="font-black text-2xl mt-3 mb-1">{suggested.emoji} {suggested.label}</h3>
            <p className="text-blue-200 text-sm font-semibold">
              {suggestedIsland ? `Đảo ${suggestedIsland.n} · ${suggestedIsland.guard} ${suggestedIsland.guardName}` : ''}
              {suggestedBadge ? ` · tốt nhất ${suggestedBadge.bestScore}% ${BADGE_EMOJI[suggestedBadge.badge]}` : ' · chưa đánh bại'}
            </p>
          </div>
          <Link href={`/mathfun/practice?topic=${suggested.id}`}
            className="mt-4 bg-[#FFD015] text-[#1a1a1a] font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-yellow-300 transition w-fit">
            ⚔️ VÀO TRẬN
          </Link>
        </div>

        <div className="card-comic bg-[#E85555] text-white rounded-2xl p-6 flex flex-col justify-between min-h-[170px]">
          <div>
            <h3 className="font-black text-2xl mb-2 tracking-wide">🐲 THỬ THÁCH TỔNG HỢP</h3>
            <p className="text-red-100 font-semibold">Câu hỏi trộn từ tất cả các bài đã học — xem hôm nay trụ được bao lâu!</p>
          </div>
          <Link href={`/mathfun/practice?topic=${CHALLENGE_TOPIC}`}
            className="mt-4 border-2 border-white text-white font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-white hover:text-[#E85555] transition w-fit">
            VÀO THỬ →
          </Link>
        </div>
      </div>

      {/* Reward: football */}
      <Link href="/child/games/football" className="card-comic bg-green-500 text-white rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-all">
        <div>
          <h3 className="font-black text-xl">⚽ Đá bóng thưởng</h3>
          <p className="text-green-50 font-semibold text-sm">Hạ một con quái vật để được chơi 5 phút (không sai câu nào: 7 phút).</p>
        </div>
        <div className="shrink-0 text-center font-black">
          <div className="text-3xl leading-none">{Math.floor(creditSec / 60)}:{String(creditSec % 60).padStart(2, '0')}</div>
          <div className="text-xs tracking-widest mt-1">CÒN LẠI</div>
        </div>
      </Link>

      {!studentId && (
        <div className="mt-2 card-comic bg-[#FFD015] rounded-2xl p-5 text-center">
          <p className="font-black text-lg mb-3">Chọn tên của con ở trang Luyện tập để lưu huy hiệu nhé! 👆</p>
          <Link href="/mathfun/practice" className="card-comic-sm bg-[#1a1a1a] text-white font-black px-8 py-3 rounded-xl inline-block hover:opacity-90 transition">
            Tới trang luyện tập →
          </Link>
        </div>
      )}
    </div>
  );
}
