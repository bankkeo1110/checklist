/** Toán lớp 5 — bản đồ "Kho báu trong rừng sâu": 7 đảo, mỗi đảo gom một nhóm bài học trong curriculum. */

export type Scenery = 'palm' | 'mountain' | 'chest';

export interface Island {
  n: number;
  title: string;
  /** Short symbol shown in the white bubble next to the island. */
  icon: string;
  /** Island centre on the 1280×720 map canvas. */
  x: number;
  y: number;
  scenery: Scenery;
  /** The monster guarding the island — the kid "fights" it by answering. */
  guard: string;
  guardName: string;
  lessonIds: string[];
}

export const MAP_W = 1280;
export const MAP_H = 720;
export const MAP_TITLE = 'TOÁN LỚP 5 · KHO BÁU TRONG RỪNG SÂU';

export const ISLANDS: Island[] = [
  { n: 1, title: 'Phân số', icon: '½', x: 130, y: 570, scenery: 'palm', guard: '🦀', guardName: 'Cua Kẹp Phân Số',
    lessonIds: ['hk1-on-tap-phan-so'] },
  { n: 2, title: 'Số thập phân', icon: '0,5', x: 335, y: 470, scenery: 'palm', guard: '🐙', guardName: 'Bạch Tuộc Dấu Phẩy',
    lessonIds: ['hk1-so-thap-phan', 'hk1-so-sanh-lam-tron-stp', 'hk1-cong-tru-stp', 'hk1-nhan-stp', 'hk1-chia-stp', 'hk1-don-vi-do'] },
  { n: 3, title: 'Tỉ số phần trăm', icon: '%', x: 190, y: 285, scenery: 'palm', guard: '🦜', guardName: 'Vẹt Phần Trăm',
    lessonIds: ['hk1-ti-so-phan-tram', 'hk2-phan-tram-ung-dung', 'hk2-ti-le'] },
  { n: 4, title: 'Diện tích', icon: 'm²', x: 470, y: 240, scenery: 'mountain', guard: '🦍', guardName: 'Khỉ Đột Thước Dây',
    lessonIds: ['hk1-dien-tich-ha', 'hk1-hinh-tam-giac', 'hk1-hinh-thang', 'hk2-hinh-tron'] },
  { n: 5, title: 'Thể tích', icon: 'm³', x: 700, y: 400, scenery: 'palm', guard: '🐊', guardName: 'Cá Sấu Khối Hộp',
    lessonIds: ['hk2-hinh-hop-chu-nhat', 'hk2-hinh-lap-phuong', 'hk2-the-tich'] },
  { n: 6, title: 'Vận tốc – Thời gian', icon: 'km/h', x: 965, y: 260, scenery: 'mountain', guard: '🐆', guardName: 'Báo Tốc Độ',
    lessonIds: ['hk2-so-do-thoi-gian', 'hk2-van-toc', 'hk2-chuyen-dong'] },
  { n: 7, title: 'Ôn tập cuối năm', icon: '★', x: 1120, y: 470, scenery: 'chest', guard: '🐉', guardName: 'Rồng Giữ Kho Báu',
    lessonIds: ['hk2-thong-ke-xac-suat', 'hk2-on-tap-hinh-hoc', 'hk1-bai-toan-tong-hop', 'hk2-bai-toan-tong-hop'] },
];

export interface BadgeLike { topic: string; badge: string; bestScore: number; attempts: number }

export interface IslandProgress { done: number; total: number; complete: boolean; started: boolean }

export function islandProgress(island: Island, badges: BadgeLike[]): IslandProgress {
  const have = new Set(badges.map((b) => b.topic));
  const done = island.lessonIds.filter((id) => have.has(id)).length;
  const total = island.lessonIds.length;
  return { done, total, complete: done === total, started: done > 0 };
}

/** The island the kid should sail to next: the first one not yet completed (or the last if all done). */
export function currentIslandNumber(badges: BadgeLike[]): number {
  const next = ISLANDS.find((i) => !islandProgress(i, badges).complete);
  return (next ?? ISLANDS[ISLANDS.length - 1]).n;
}

export function islandOfLesson(lessonId: string): Island | undefined {
  return ISLANDS.find((i) => i.lessonIds.includes(lessonId));
}

/** Every lesson in journey order (island 1 → 7). */
export const JOURNEY: string[] = ISLANDS.flatMap((i) => i.lessonIds);

/** The lesson that follows `lessonId` on the journey, or undefined at the very end. */
export function nextLessonId(lessonId: string): string | undefined {
  const i = JOURNEY.indexOf(lessonId);
  return i >= 0 ? JOURNEY[i + 1] : undefined;
}
