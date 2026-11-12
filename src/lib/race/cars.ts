// The garage: ten vehicles to race in. They differ in looks only, so the race stays about the maths.
export type CarKind = 'sport' | 'super' | 'f1' | 'rally' | 'jeep' | 'pickup' | 'monster' | 'buggy' | 'kart' | 'van';

export interface CarModel { id: string; kind: CarKind; name: string; blurb: string; color: string; accent: string }

export const CARS: CarModel[] = [
  { id: 'sport', kind: 'sport', name: 'Xe thể thao', blurb: 'Coupe hai cửa, cánh gió sau', color: '#2f6bff', accent: '#ffffff' },
  { id: 'super', kind: 'super', name: 'Siêu xe', blurb: 'Thấp, dẹt, mũi nhọn như mũi tên', color: '#ff8a00', accent: '#1f2937' },
  { id: 'f1', kind: 'f1', name: 'Xe đua công thức', blurb: 'Bánh hở, cánh gió trước sau', color: '#0ea5a4', accent: '#fde047' },
  { id: 'rally', kind: 'rally', name: 'Xe rally', blurb: 'Hatchback có dàn đèn và số đua', color: '#f1f5f9', accent: '#2563eb' },
  { id: 'jeep', kind: 'jeep', name: 'Xe địa hình', blurb: 'Gầm cao, khung chống lật, bánh dự phòng', color: '#4d7c0f', accent: '#1f2937' },
  { id: 'pickup', kind: 'pickup', name: 'Xe bán tải', blurb: 'Thùng sau chở đồ, lốp to', color: '#b45309', accent: '#fcd34d' },
  { id: 'monster', kind: 'monster', name: 'Xe quái vật', blurb: 'Bánh khổng lồ, nhún nhảy', color: '#7c3aed', accent: '#a3e635' },
  { id: 'buggy', kind: 'buggy', name: 'Xe buggy sa mạc', blurb: 'Khung ống thép, máy đặt sau', color: '#f59e0b', accent: '#111827' },
  { id: 'kart', kind: 'kart', name: 'Xe kart', blurb: 'Nhỏ xíu, sát mặt đường', color: '#ec4899', accent: '#22d3ee' },
  { id: 'van', kind: 'van', name: 'Xe van', blurb: 'Hộp vuông vui nhộn nhiều cửa sổ', color: '#06b6d4', accent: '#fde047' },
];

export const carById = (id: string | null | undefined): CarModel => CARS.find((c) => c.id === id) ?? CARS[0];
