// Turns a student's logged answers into strengths / weaknesses, and into a report a parent can
// paste into Claude for a written analysis. Pure functions: the API route feeds it DB rows.
import { LESSONS } from './curriculum';
import { islandOfLesson } from './islands';
import { CHALLENGE_TOPIC } from './practice-logic';

export interface AnswerRow {
  topic: string;
  kind: string | null;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  isRetry: boolean | null;
  answeredAt: string | Date | null;
}

export interface SessionRow {
  topic: string;
  correct: number | null;
  total: number | null;
  finishedAt: string | Date | null;
}

export interface Tally { correct: number; total: number; acc: number }
export interface KindStat extends Tally { kind: string; lesson: string; thinking: boolean }
export interface LessonStat extends Tally { topic: string; label: string; island: number | null }

export interface Analysis {
  answered: number;
  correct: number;
  acc: number;
  finished: number;
  thinking: Tally;
  /** Second tries at missed questions: did the explanation land? */
  retries: Tally;
  byLesson: LessonStat[];
  byKind: KindStat[];
  /** At least MIN_SEEN answers and under 70% right — worst first. */
  weak: KindStat[];
  /** At least MIN_SEEN answers and 85%+ right — best first. */
  strong: KindStat[];
  recentWrong: AnswerRow[];
  sessions: SessionRow[];
}

export const MIN_SEEN = 3;
const pct = (c: number, t: number) => (t ? Math.round((c / t) * 100) : 0);
const tally = (c: number, t: number): Tally => ({ correct: c, total: t, acc: pct(c, t) });

export function lessonLabel(topic: string): string {
  if (topic === CHALLENGE_TOPIC) return 'Thử thách tổng hợp';
  return LESSONS.find((l) => l.id === topic)?.label ?? topic;
}

/** The dạng a row is counted under; rows logged before kinds existed group per lesson. */
export function kindOf(r: Pick<AnswerRow, 'kind' | 'topic'>): string {
  return r.kind ?? `Chưa phân dạng · ${lessonLabel(r.topic)}`;
}

export function analyse(rows: AnswerRow[], sessions: SessionRow[]): Analysis {
  const lessons = new Map<string, { c: number; t: number }>();
  const kinds = new Map<string, { c: number; t: number; topics: Map<string, number> }>();
  let correct = 0, thC = 0, thT = 0, reC = 0, reT = 0;

  for (const r of rows) {
    if (r.isCorrect) correct++;
    const l = lessons.get(r.topic) ?? { c: 0, t: 0 };
    l.t++; if (r.isCorrect) l.c++;
    lessons.set(r.topic, l);

    const k = kindOf(r), ks = kinds.get(k) ?? { c: 0, t: 0, topics: new Map() };
    ks.t++; if (r.isCorrect) ks.c++;
    if (r.topic !== CHALLENGE_TOPIC) ks.topics.set(r.topic, (ks.topics.get(r.topic) ?? 0) + 1);
    kinds.set(k, ks);

    if (k.startsWith('Tư duy')) { thT++; if (r.isCorrect) thC++; }
    if (r.isRetry) { reT++; if (r.isCorrect) reC++; }
  }

  const byLesson: LessonStat[] = [...lessons.entries()].map(([topic, v]) => ({
    topic, label: lessonLabel(topic), island: islandOfLesson(topic)?.n ?? null, ...tally(v.c, v.t),
  })).sort((a, b) => (a.island ?? 99) - (b.island ?? 99) || a.label.localeCompare(b.label));

  const byKind: KindStat[] = [...kinds.entries()].map(([kind, v]) => {
    const top = [...v.topics.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return { kind, lesson: top ? lessonLabel(top) : 'Thử thách tổng hợp', thinking: kind.startsWith('Tư duy'), ...tally(v.c, v.t) };
  }).sort((a, b) => (b.total - b.correct) - (a.total - a.correct) || b.total - a.total);

  const seen = byKind.filter((k) => k.total >= MIN_SEEN);
  return {
    answered: rows.length,
    correct,
    acc: pct(correct, rows.length),
    finished: sessions.length,
    thinking: tally(thC, thT),
    retries: tally(reC, reT),
    byLesson,
    byKind,
    weak: seen.filter((k) => k.acc < 70).sort((a, b) => a.acc - b.acc || b.total - a.total),
    strong: seen.filter((k) => k.acc >= 85).sort((a, b) => b.acc - a.acc || b.total - a.total),
    recentWrong: rows.filter((r) => !r.isCorrect).slice(0, 30),
    sessions,
  };
}

const day = (d: string | Date | null) => (d ? new Date(d).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '');

/** A self-contained report: instructions for Claude first, then the data as tables. */
export function toMarkdown(name: string, rangeLabel: string, a: Analysis): string {
  const L: string[] = [];
  L.push(`# Báo cáo học Toán lớp 5 — ${name}`, '');
  L.push(`Giai đoạn: ${rangeLabel} · Xuất ngày ${day(new Date())}`, '');
  L.push('## Yêu cầu dành cho Claude', '');
  L.push(
    `Bạn là giáo viên Toán tiểu học giàu kinh nghiệm. Dưới đây là kết quả luyện tập Toán lớp 5 (chương trình Việt Nam) của bé ${name} trên ứng dụng MathFun. Mỗi câu là trắc nghiệm 4 lựa chọn; dạng bắt đầu bằng "Tư duy" là bài toán có lời văn cần đọc hiểu và giải 2–3 bước. Hãy phân tích bằng tiếng Việt, ngắn gọn, dễ hiểu cho phụ huynh:`,
    '',
    '1. **Điểm mạnh**: các dạng toán bé làm tốt và vì sao có thể nói vậy.',
    '2. **Điểm yếu**: các dạng toán bé hay sai. Dựa vào các câu sai cụ thể (đáp án bé chọn so với đáp án đúng), đoán nguyên nhân sai (chưa hiểu khái niệm, tính nhầm, đọc đề sót ý, nhầm đơn vị, quên một bước…).',
    '3. **Kỹ năng đọc hiểu và tư duy nhiều bước**: nhận xét riêng về các câu "Tư duy".',
    '4. **Kế hoạch 2 tuần**: nên ôn dạng nào trước, mỗi ngày làm gì (10–20 phút), kèm 3–5 bài tập mẫu tự soạn cho dạng yếu nhất, có lời giải.',
    '5. **Gợi ý cho phụ huynh**: cách hướng dẫn và động viên bé ở nhà.',
    '',
    'Lưu ý: dạng có ít hơn 3 câu thì chưa đủ để kết luận chắc chắn.',
    '',
  );

  L.push('## Tổng quan', '');
  L.push(`- Số câu đã trả lời: ${a.answered} · đúng ${a.correct} (${a.acc}%)`);
  L.push(`- Số bài đã hoàn thành (hạ gục quái): ${a.finished}`);
  L.push(`- Câu tư duy nhiều bước: ${a.thinking.correct}/${a.thinking.total} đúng (${a.thinking.acc}%)`);
  L.push(`- Làm lại câu đã sai: ${a.retries.correct}/${a.retries.total} đúng (${a.retries.acc}%)`, '');

  L.push('## Theo bài học', '', '| Đảo | Bài | Đúng/Tổng | Tỉ lệ đúng |', '|---|---|---|---|');
  for (const l of a.byLesson) L.push(`| ${l.island ?? '–'} | ${l.label} | ${l.correct}/${l.total} | ${l.acc}% |`);
  L.push('');

  L.push('## Theo dạng toán (sai nhiều xếp trước)', '', '| Dạng toán | Thuộc bài | Đúng | Sai | Tỉ lệ đúng |', '|---|---|---|---|---|');
  for (const k of a.byKind) L.push(`| ${k.kind} | ${k.lesson} | ${k.correct} | ${k.total - k.correct} | ${k.acc}% |`);
  L.push('');

  if (a.recentWrong.length) {
    L.push(`## ${a.recentWrong.length} câu làm sai gần nhất`, '');
    a.recentWrong.forEach((r, i) => {
      L.push(`${i + 1}. [${kindOf(r)}] ${r.question.replace(/\n/g, ' ')}`);
      L.push(`   - Bé chọn: **${r.studentAnswer}** · Đáp án đúng: **${r.correctAnswer}**${r.isRetry ? ' · (lần làm lại)' : ''} · ${day(r.answeredAt)}`);
    });
    L.push('');
  }

  if (a.sessions.length) {
    L.push('## Các bài đã hoàn thành', '', '| Ngày | Bài | Đúng/Tổng |', '|---|---|---|');
    for (const s of a.sessions.slice(0, 40)) L.push(`| ${day(s.finishedAt)} | ${lessonLabel(s.topic)} | ${s.total ? `${s.correct}/${s.total}` : '–'} |`);
    L.push('');
  }
  return L.join('\n');
}
