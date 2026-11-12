import { type Lesson, fmt, dec, numQ, strQ, fracQ, decQ, pctQ, rand, pick, shuffle, gcd } from './qutil';

type Gen = ReturnType<Lesson['gen']>;

/** minutes -> "2 giờ 15 phút" */
const hm = (T: number) => (T >= 60 ? `${Math.floor(T / 60)} giờ${T % 60 ? ` ${T % 60} phút` : ''}` : `${T} phút`);
const timeQ = (question: string, T: number, explanation: string): Gen =>
  strQ(question, hm(T), [T + 10, T - 10, T + 60, T - 60, T + 25].filter((x) => x > 0).map(hm), explanation);
/** coprime pair p < q */
function coprimePair(maxQ: number): [number, number] {
  for (;;) {
    const q = rand(2, maxQ), p = rand(1, q - 1);
    if (gcd(p, q) === 1) return [p, q];
  }
}

const gen = {
  hinhTron: (): Gen => pick<() => Gen>([
    () => {
      const d = rand(2, 40);
      return decQ(`Hình tròn có đường kính ${d} cm. Chu vi hình tròn là bao nhiêu xăng-ti-mét? (π = 3,14)`, d * 314, 2, `Chu vi = đường kính × 3,14 = ${d} × 3,14 = ${dec(d * 314, 2)} cm.`, [d * 157, d * 31, d * 3140, d * 314 + 100]);
    },
    () => {
      const r = rand(2, 30);
      return decQ(`Hình tròn có bán kính ${r} cm. Chu vi hình tròn là bao nhiêu xăng-ti-mét? (π = 3,14)`, r * 628, 2, `Chu vi = bán kính × 2 × 3,14 = ${r} × 2 × 3,14 = ${dec(r * 628, 2)} cm.`, [r * 314, r * 157, r * 6280, r * 628 + 100]);
    },
    () => {
      const r = rand(2, 20);
      return decQ(`Hình tròn có bán kính ${r} dm. Diện tích hình tròn là bao nhiêu đề-xi-mét vuông? (π = 3,14)`, r * r * 314, 2, `Diện tích = bán kính × bán kính × 3,14 = ${r} × ${r} × 3,14 = ${dec(r * r * 314, 2)} dm².`, [r * 628, r * r * 628, r * 314, r * r * 31]);
    },
    () => {
      const d = rand(3, 40);
      return numQ(`Hình tròn có chu vi ${dec(d * 314, 2)} cm. Đường kính hình tròn là bao nhiêu xăng-ti-mét? (π = 3,14)`, d, `Đường kính = chu vi : 3,14 = ${dec(d * 314, 2)} : 3,14 = ${d} cm.`, [d * 2, Math.floor(d / 2) || 1, d + 1, d - 1]);
    },
    () => {
      const r = rand(2, 25);
      return numQ(`Hình tròn có chu vi ${dec(r * 628, 2)} cm. Bán kính hình tròn là bao nhiêu xăng-ti-mét? (π = 3,14)`, r, `Bán kính = chu vi : 3,14 : 2 = ${dec(r * 628, 2)} : 3,14 : 2 = ${r} cm.`, [r * 2, 2 * r + 1, r + 1, r - 1]);
    },
    () => {
      const r = rand(2, 20);
      return decQ(`Hình tròn có đường kính ${2 * r} m. Diện tích hình tròn là bao nhiêu mét vuông? (π = 3,14)`, r * r * 314, 2, `Bán kính = ${2 * r} : 2 = ${r} m. Diện tích = ${r} × ${r} × 3,14 = ${dec(r * r * 314, 2)} m².`, [4 * r * r * 314, 2 * r * r * 314, r * 628]);
    },
    () => {
      const q = pick<[string, string, string[], string]>([
        ['Đường kính của hình tròn gấp mấy lần bán kính?', '2 lần', ['3 lần', '4 lần', '1/2 lần'], 'Đường kính bằng 2 lần bán kính: d = r × 2.'],
        ['Công thức tính chu vi hình tròn theo bán kính r là:', 'C = r × 2 × 3,14', ['C = r × r × 3,14', 'C = r × 3,14', 'C = r × 4'], 'Chu vi C = r × 2 × 3,14 (hay C = d × 3,14).'],
        ['Công thức tính diện tích hình tròn theo bán kính r là:', 'S = r × r × 3,14', ['S = r × 2 × 3,14', 'S = r × 3,14', 'S = r × r × 2'], 'Diện tích S = r × r × 3,14.'],
      ]);
      return strQ(q[0], q[1], q[2], q[3]);
    },
    () => {
      const d = rand(2, 9) * 10, n = rand(5, 30);
      return decQ(`Một bánh xe có đường kính ${d} cm. Bánh xe lăn ${n} vòng thì đi được bao nhiêu xăng-ti-mét? (π = 3,14)`, d * 314 * n, 2,
        `Mỗi vòng bánh xe đi được đúng một chu vi = ${d} × 3,14 = ${dec(d * 314, 2)} cm. ${n} vòng: ${dec(d * 314, 2)} × ${n} = ${dec(d * 314 * n, 2)} cm.`,
        [d * 314, d * 157 * n, d * n * 100]);
    },
    () => strQ('Nếu bán kính hình tròn gấp lên 2 lần thì diện tích hình tròn gấp lên mấy lần?', '4 lần', ['2 lần', '3 lần', '6 lần'],
      'Diện tích = r × r × 3,14. Bán kính gấp 2 lần thì r × r gấp 2 × 2 = 4 lần.'),
  ])(),

  hopChuNhat: (): Gen => pick<() => Gen>([
    () => {
      const a = rand(3, 20), b = rand(2, 15), h = rand(2, 12);
      return numQ(`Hình hộp chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm, chiều cao ${h} cm. Diện tích xung quanh là bao nhiêu xăng-ti-mét vuông?`, (a + b) * 2 * h, `Sxq = chu vi đáy × chiều cao = (${a} + ${b}) × 2 × ${h} = ${(a + b) * 2 * h} cm².`, [a * b * 2 + (a + b) * 2 * h, a * b * h, (a + b) * h]);
    },
    () => {
      const a = rand(3, 20), b = rand(2, 15), h = rand(2, 12);
      return numQ(`Hình hộp chữ nhật có chiều dài ${a} dm, chiều rộng ${b} dm, chiều cao ${h} dm. Diện tích toàn phần là bao nhiêu đề-xi-mét vuông?`, (a + b) * 2 * h + 2 * a * b, `Sxq = (${a} + ${b}) × 2 × ${h} = ${(a + b) * 2 * h}; diện tích hai đáy = 2 × ${a} × ${b} = ${2 * a * b}; Stp = ${(a + b) * 2 * h + 2 * a * b} dm².`, [(a + b) * 2 * h, a * b * h, (a + b) * 2 * h + a * b]);
    },
    () => {
      const a = rand(3, 15), b = rand(2, 12), h = rand(2, 10);
      return numQ(`Hình hộp chữ nhật có diện tích xung quanh ${(a + b) * 2 * h} cm², chiều dài ${a} cm, chiều rộng ${b} cm. Chiều cao là bao nhiêu xăng-ti-mét?`, h, `Chiều cao = Sxq : chu vi đáy = ${(a + b) * 2 * h} : ${(a + b) * 2} = ${h} cm.`, [a + b, h + 1, h * 2, (a + b) * h]);
    },
    () => {
      const a = rand(3, 15), b = rand(2, 12), X = rand(11, 49);
      return decQ(`Hình hộp chữ nhật có chiều dài ${a} m, chiều rộng ${b} m, chiều cao ${dec(X, 1)} m. Diện tích xung quanh là bao nhiêu mét vuông?`, (a + b) * 2 * X, 1, `Sxq = (${a} + ${b}) × 2 × ${dec(X, 1)} = ${dec((a + b) * 2 * X, 1)} m².`, [(a + b) * X, (a + b) * 2 * X * 10, a * b * X]);
    },
    () => {
      const q = pick<[string, string, string[], string]>([
        ['Hình hộp chữ nhật có bao nhiêu mặt?', '6 mặt', ['4 mặt', '8 mặt', '12 mặt'], 'Hình hộp chữ nhật có 6 mặt, 8 đỉnh, 12 cạnh.'],
        ['Hình hộp chữ nhật có bao nhiêu đỉnh?', '8 đỉnh', ['6 đỉnh', '12 đỉnh', '4 đỉnh'], 'Hình hộp chữ nhật có 6 mặt, 8 đỉnh, 12 cạnh.'],
        ['Hình hộp chữ nhật có bao nhiêu cạnh?', '12 cạnh', ['6 cạnh', '8 cạnh', '10 cạnh'], 'Hình hộp chữ nhật có 6 mặt, 8 đỉnh, 12 cạnh.'],
      ]);
      return strQ(q[0], q[1], q[2], q[3]);
    },
    () => {
      const a = rand(2, 8), b = rand(2, 6), h = rand(2, 6);
      return numQ(`Người ta quét sơn mặt ngoài (cả sáu mặt) của một cái thùng hình hộp chữ nhật không nắp rỗng dài ${a} dm, rộng ${b} dm, cao ${h} dm. Diện tích cần quét sơn là bao nhiêu đề-xi-mét vuông?`, (a + b) * 2 * h + 2 * a * b,
        `Quét cả sáu mặt nên tính diện tích toàn phần: (${a} + ${b}) × 2 × ${h} + 2 × ${a} × ${b} = ${(a + b) * 2 * h + 2 * a * b} dm².`, [(a + b) * 2 * h, (a + b) * 2 * h + a * b, a * b * h]);
    },
  ])(),

  lapPhuong: (): Gen => pick<() => Gen>([
    () => {
      const a = rand(2, 20);
      return numQ(`Hình lập phương có cạnh ${a} cm. Diện tích xung quanh là bao nhiêu xăng-ti-mét vuông?`, a * a * 4, `Sxq = cạnh × cạnh × 4 = ${a} × ${a} × 4 = ${a * a * 4} cm².`, [a * a * 6, a * a, a * 4]);
    },
    () => {
      const a = rand(2, 20);
      return numQ(`Hình lập phương có cạnh ${a} dm. Diện tích toàn phần là bao nhiêu đề-xi-mét vuông?`, a * a * 6, `Stp = cạnh × cạnh × 6 = ${a} × ${a} × 6 = ${a * a * 6} dm².`, [a * a * 4, a * a, a * a * 5]);
    },
    () => {
      const a = rand(2, 15);
      return numQ(`Hình lập phương có diện tích toàn phần ${a * a * 6} cm². Cạnh của hình lập phương là bao nhiêu xăng-ti-mét?`, a, `Diện tích một mặt = ${a * a * 6} : 6 = ${a * a}; vì ${a} × ${a} = ${a * a} nên cạnh dài ${a} cm.`, [a * 2, a + 1, a * a, a - 1]);
    },
    () => {
      const X = rand(11, 59);
      return decQ(`Hình lập phương có cạnh ${dec(X, 1)} m. Diện tích toàn phần là bao nhiêu mét vuông?`, X * X * 6, 2, `Stp = ${dec(X, 1)} × ${dec(X, 1)} × 6 = ${dec(X * X * 6, 2)} m².`, [X * X * 4, X * X, X * X * 60]);
    },
    () => {
      const a = rand(3, 12);
      return numQ(`Dán giấy màu kín cả sáu mặt một hộp quà hình lập phương cạnh ${a} cm. Diện tích giấy cần dùng (không tính chỗ dán) là bao nhiêu xăng-ti-mét vuông?`, a * a * 6, `Sáu mặt nên dùng diện tích toàn phần: ${a} × ${a} × 6 = ${a * a * 6} cm².`, [a * a * 4, a * a, a * 6]);
    },
    () => {
      const q = pick<[string, string, string[], string]>([
        ['Hình lập phương có bao nhiêu mặt, và các mặt như thế nào?', '6 mặt, đều là hình vuông bằng nhau', ['4 mặt, đều là hình vuông', '6 mặt, là các hình chữ nhật khác nhau', '8 mặt, đều là hình tam giác'], 'Hình lập phương có 6 mặt là các hình vuông bằng nhau, 8 đỉnh, 12 cạnh bằng nhau.'],
        ['Hình lập phương có bao nhiêu cạnh?', '12 cạnh', ['6 cạnh', '8 cạnh', '4 cạnh'], 'Hình lập phương có 12 cạnh bằng nhau.'],
      ]);
      return strQ(q[0], q[1], q[2], q[3]);
    },
    () => {
      const a = rand(2, 15);
      return numQ(`Hình lập phương có diện tích xung quanh ${a * a * 4} dm². Diện tích toàn phần là bao nhiêu đề-xi-mét vuông?`, a * a * 6,
        `Diện tích một mặt = ${a * a * 4} : 4 = ${a * a} dm². Toàn phần = ${a * a} × 6 = ${a * a * 6} dm².`, [a * a * 4, a * a, a * a * 8]);
    },
    () => {
      const a = rand(2, 12), n = rand(2, 3);
      return numQ(`Một khối gỗ hình lập phương cạnh ${a} cm được sơn kín ${n === 2 ? 'hai' : 'ba'} mặt. Diện tích phần được sơn là bao nhiêu xăng-ti-mét vuông?`, a * a * n,
        `Mỗi mặt có diện tích ${a} × ${a} = ${a * a} cm²; ${n} mặt là ${a * a} × ${n} = ${a * a * n} cm².`, [a * a, a * a * 6, a * a * 4]);
    },
    () => strQ('Nếu cạnh hình lập phương gấp lên 2 lần thì diện tích toàn phần gấp lên mấy lần?', '4 lần', ['2 lần', '6 lần', '8 lần'],
      'Diện tích một mặt gấp 2 × 2 = 4 lần, sáu mặt đều như vậy nên diện tích toàn phần cũng gấp 4 lần.'),
  ])(),

  theTich: (): Gen => pick<() => Gen>([
    () => {
      const u = pick<[string, string]>([['cm', 'xăng-ti-mét'], ['dm', 'đề-xi-mét'], ['m', 'mét']]), a = rand(3, 20), b = rand(2, 12), c = rand(2, 10);
      return numQ(`Hình hộp chữ nhật có chiều dài ${a} ${u[0]}, rộng ${b} ${u[0]}, cao ${c} ${u[0]}. Thể tích hình hộp là bao nhiêu ${u[1]} khối?`, a * b * c, `V = dài × rộng × cao = ${a} × ${b} × ${c} = ${a * b * c} ${u[0]}³.`, [(a + b + c), (a + b) * 2 * c, a * b * c + a * b]);
    },
    () => {
      const a = rand(2, 12);
      return numQ(`Hình lập phương có cạnh ${a} cm. Thể tích là bao nhiêu xăng-ti-mét khối?`, a ** 3, `V = cạnh × cạnh × cạnh = ${a} × ${a} × ${a} = ${a ** 3} cm³.`, [a * a * 6, a * a, a * 3, a ** 3 + a]);
    },
    () => {
      const t = rand(0, 2), k = rand(2, 40);
      if (t === 0) return numQ(`${k} dm³ = ... cm³`, k * 1000, `1 dm³ = 1 000 cm³ nên ${k} dm³ = ${fmt(k * 1000)} cm³.`, [k * 100, k * 10000, k]);
      if (t === 1) return numQ(`${k} m³ = ... dm³`, k * 1000, `1 m³ = 1 000 dm³ nên ${k} m³ = ${fmt(k * 1000)} dm³.`, [k * 100, k * 10000, k * 10]);
      const N = k * 100 + rand(1, 99);
      return decQ(`${fmt(N)} cm³ = ... dm³`, N, 3, `1 000 cm³ = 1 dm³ nên ${fmt(N)} cm³ = ${dec(N, 3)} dm³.`, [N * 10, Math.floor(N / 10), N + 1000]);
    },
    () => {
      const k = rand(2, 50) * 5;
      return numQ(`Một chiếc bể có thể tích ${k} dm³. Bể đó chứa được bao nhiêu lít nước? (1 lít = 1 dm³)`, k, `Vì 1 lít = 1 dm³ nên ${k} dm³ = ${k} lít.`, [k * 10, k * 1000, k / 5]);
    },
    () => {
      const a = rand(3, 12), b = rand(2, 10), c = rand(2, 8);
      return numQ(`Hình hộp chữ nhật có thể tích ${a * b * c} cm³, chiều dài ${a} cm, chiều rộng ${b} cm. Chiều cao là bao nhiêu xăng-ti-mét?`, c, `Chiều cao = thể tích : (dài × rộng) = ${a * b * c} : ${a * b} = ${c} cm.`, [a + b, c + 1, c * 2, a * b]);
    },
    () => {
      const a = rand(2, 6), b = rand(2, 5), c = rand(1, 4);
      return numQ(`Một bể nước hình hộp chữ nhật dài ${a} m, rộng ${b} m, cao ${c} m. Bể chứa tối đa bao nhiêu lít nước? (1 m³ = 1 000 lít)`, a * b * c * 1000, `V = ${a} × ${b} × ${c} = ${a * b * c} m³ = ${fmt(a * b * c * 1000)} lít.`, [a * b * c * 100, a * b * c, a * b * c * 10000]);
    },
  ])(),

  thoiGian: (): Gen => pick<() => Gen>([
    () => {
      const a = rand(30, 400), b = rand(20, 300);
      return timeQ(`${hm(a)} + ${hm(b)} = ?`, a + b, `Cộng giờ với giờ, phút với phút; nếu số phút từ 60 trở lên thì đổi ra giờ. Kết quả: ${hm(a + b)}.`);
    },
    () => {
      const b = rand(20, 300), a = b + rand(20, 300);
      return timeQ(`${hm(a)} − ${hm(b)} = ?`, a - b, `Trừ giờ với giờ, phút với phút (mượn 1 giờ = 60 phút khi cần). Kết quả: ${hm(a - b)}.`);
    },
    () => {
      const a = rand(20, 150), n = rand(2, 5);
      return timeQ(`${hm(a)} × ${n} = ?`, a * n, `Nhân từng số đo với ${n} rồi đổi phút ra giờ nếu từ 60 phút trở lên: ${hm(a * n)}.`);
    },
    () => {
      const q = rand(20, 120), n = rand(2, 5);
      return timeQ(`${hm(q * n)} : ${n} = ?`, q, `Chia số giờ cho ${n}, giờ dư đổi ra phút cộng với số phút rồi chia tiếp: ${hm(q)}.`);
    },
    () => {
      const h = rand(1, 5), m = pick([15, 30, 45]);
      return decQ(`${h} giờ ${m} phút = ... giờ`, h * 100 + m * 100 / 60, 2, `${m} phút = ${m}/60 giờ = ${dec(m * 100 / 60, 2)} giờ nên kết quả là ${dec(h * 100 + m * 100 / 60, 2)} giờ.`, [h * 100 + m, h * 10 + m, (h + 1) * 100 + m * 100 / 60]);
    },
    () => {
      const h = rand(1, 4), f = pick([25, 50, 75]);
      return numQ(`${h},${f} giờ = ... phút`, h * 60 + f * 60 / 100, `0,${f} giờ = ${f * 60 / 100} phút; ${h} giờ = ${h * 60} phút; tổng ${h * 60 + f * 60 / 100} phút.`, [h * 100 + f, h * 60 + f, h * 60 + f * 60 / 100 + 10]);
    },
    () => {
      const s = rand(6, 14) * 60 + pick([0, 15, 30, 45]), d = rand(40, 300), e = s + d;
      const at = (T: number) => `${Math.floor(T / 60)} giờ${T % 60 ? ` ${T % 60} phút` : ''}`;
      return timeQ(`Một chuyến đi bắt đầu lúc ${at(s)} và kết thúc lúc ${at(e)}. Chuyến đi kéo dài bao lâu?`, d, `Thời gian = lúc kết thúc − lúc bắt đầu = ${at(e)} − ${at(s)} = ${hm(d)}.`);
    },
  ])(),

  vanToc: (): Gen => pick<() => Gen>([
    () => {
      const v = rand(20, 90), t = rand(2, 6);
      return numQ(`Một ô tô đi quãng đường ${v * t} km trong ${t} giờ. Vận tốc của ô tô là bao nhiêu ki-lô-mét trên giờ?`, v, `Vận tốc = quãng đường : thời gian = ${v * t} : ${t} = ${v} km/giờ.`, [v * t, v + t, v - 5 > 0 ? v - 5 : v + 5, v * 2]);
    },
    () => {
      const v = 2 * rand(10, 45);
      return numQ(`Một xe máy đi với vận tốc ${v} km/giờ trong 2,5 giờ. Quãng đường xe đi được là bao nhiêu ki-lô-mét?`, v * 5 / 2, `Quãng đường = vận tốc × thời gian = ${v} × 2,5 = ${v * 5 / 2} km.`, [v * 2, v * 3, v + 2.5 | 0, v * 25]);
    },
    () => {
      const v = 2 * rand(10, 40), tt = pick([5, 10, 15, 20, 25, 30, 40]), s = v * tt / 10;
      return decQ(`Một người đi xe đạp với vận tốc ${v} km/giờ. Hỏi đi quãng đường ${s} km hết bao nhiêu giờ?`, tt, 1, `Thời gian = quãng đường : vận tốc = ${s} : ${v} = ${dec(tt, 1)} giờ.`, [tt * 2, tt + 10, Math.max(5, tt - 5), tt * 10]);
    },
    () => {
      const ms = pick([5, 10, 15, 20, 25]);
      return Math.random() < 0.5
        ? numQ(`${ms} m/giây = ... km/giờ`, ms * 36 / 10, `Một giờ có 3 600 giây nên ${ms} m/giây đi được ${ms * 3600} m = ${ms * 36 / 10} km trong 1 giờ.`, [ms * 36, ms * 3.6 + 10, ms * 6, ms])
        : numQ(`${ms * 36 / 10} km/giờ = ... m/giây`, ms, `${ms * 36 / 10} km = ${ms * 360} m... đi trong 3 600 giây nên ${ms * 36 / 10} km/giờ = ${ms} m/giây.`, [ms * 2, ms + 5, Math.max(1, ms - 5), ms * 36 / 10]);
    },
    () => {
      const v = rand(40, 120), t = rand(5, 30);
      return numQ(`Một người đi bộ được ${v * t} m trong ${t} phút. Vận tốc của người đó là bao nhiêu mét trên phút?`, v, `Vận tốc = ${v * t} : ${t} = ${v} m/phút.`, [v * t, v + t, v + 10, v - 10]);
    },
    () => {
      const v = 2 * rand(10, 40);
      return numQ(`Một xe máy đi với vận tốc ${v} km/giờ. Trong 30 phút xe đi được bao nhiêu ki-lô-mét?`, v / 2, `30 phút = 0,5 giờ nên quãng đường = ${v} × 0,5 = ${v / 2} km.`, [v * 30, v, v / 4, v * 2]);
    },
  ])(),

  chuyenDong: (): Gen => pick<() => Gen>([
    () => {
      const v1 = rand(30, 60), v2 = rand(25, 55), t = rand(2, 5);
      return numQ(`Hai ô tô cùng khởi hành một lúc từ hai tỉnh cách nhau ${(v1 + v2) * t} km và đi ngược chiều nhau. Vận tốc lần lượt là ${v1} km/giờ và ${v2} km/giờ. Sau mấy giờ hai ô tô gặp nhau?`, t,
        `Mỗi giờ hai xe tiến lại gần nhau ${v1} + ${v2} = ${v1 + v2} km. Thời gian gặp nhau = ${(v1 + v2) * t} : ${v1 + v2} = ${t} giờ.`, [t + 1, Math.max(1, t - 1), v1 + v2, t * 2]);
    },
    () => {
      const v2 = rand(30, 50), dv = rand(5, 20), v1 = v2 + dv, t = rand(2, 6);
      return numQ(`Ô tô đi với vận tốc ${v1} km/giờ đuổi theo xe máy đi cùng chiều với vận tốc ${v2} km/giờ ở phía trước cách ${dv * t} km. Sau mấy giờ ô tô đuổi kịp xe máy?`, t,
        `Mỗi giờ ô tô gần xe máy thêm ${v1} − ${v2} = ${dv} km. Thời gian đuổi kịp = ${dv * t} : ${dv} = ${t} giờ.`, [t + 1, Math.max(1, t - 1), v1 + v2, t * 2]);
    },
    () => {
      const v1 = rand(30, 60), v2 = rand(25, 55), t = rand(2, 5);
      return numQ(`Hai xe cùng xuất phát từ một nơi và đi ngược chiều nhau với vận tốc ${v1} km/giờ và ${v2} km/giờ. Sau ${t} giờ hai xe cách nhau bao nhiêu ki-lô-mét?`, (v1 + v2) * t,
        `Mỗi giờ hai xe rời xa nhau ${v1} + ${v2} = ${v1 + v2} km. Sau ${t} giờ: ${v1 + v2} × ${t} = ${(v1 + v2) * t} km.`, [Math.abs(v1 - v2) * t, v1 * t, (v1 + v2) * t + t]);
    },
    () => {
      const v1 = rand(30, 60), v2 = rand(25, 55), t = rand(2, 5);
      return numQ(`Hai thành phố cách nhau ${(v1 + v2) * t} km. Hai xe cùng khởi hành, đi ngược chiều và gặp nhau sau ${t} giờ. Xe thứ nhất đi ${v1} km/giờ. Vận tốc xe thứ hai là bao nhiêu ki-lô-mét trên giờ?`, v2,
        `Tổng vận tốc hai xe = ${(v1 + v2) * t} : ${t} = ${v1 + v2} km/giờ. Vận tốc xe thứ hai = ${v1 + v2} − ${v1} = ${v2} km/giờ.`, [v1 + v2, (v1 + v2) * t - v1, v2 + 5, Math.max(1, v2 - 5)]);
    },
  ])(),

  phanTramUngDung: (): Gen => pick<() => Gen>([
    () => {
      const price = rand(5, 40) * 10000, pct = rand(1, 8) * 5;
      return numQ(`Một chiếc áo giá ${fmt(price)} đồng, được giảm giá ${pct}%. Giá chiếc áo sau khi giảm là bao nhiêu đồng?`, price - price * pct / 100, `Số tiền được giảm = ${fmt(price)} × ${pct} : 100 = ${fmt(price * pct / 100)}. Giá sau giảm = ${fmt(price)} − ${fmt(price * pct / 100)} = ${fmt(price - price * pct / 100)} đồng.`, [price * pct / 100, price + price * pct / 100, price - pct]);
    },
    () => {
      const buy = rand(4, 40) * 10000, pct = rand(1, 8) * 5;
      return numQ(`Một cửa hàng mua một món hàng giá ${fmt(buy)} đồng và bán lãi ${pct}% so với giá mua. Giá bán món hàng là bao nhiêu đồng?`, buy + buy * pct / 100, `Tiền lãi = ${fmt(buy)} × ${pct} : 100 = ${fmt(buy * pct / 100)}. Giá bán = ${fmt(buy)} + ${fmt(buy * pct / 100)} = ${fmt(buy + buy * pct / 100)} đồng.`, [buy * pct / 100, buy - buy * pct / 100, buy + pct]);
    },
    () => {
      const b = pick([20, 25, 50, 100]), a = rand(1, b - 1);
      return pctQ(`Lớp có ${b} học sinh, trong đó ${a} học sinh đạt loại giỏi. Học sinh giỏi chiếm bao nhiêu phần trăm số học sinh cả lớp?`, a * 100 / b, `${a} : ${b} = ${a * 100 / b}/100 = ${a * 100 / b}%.`, [a, a * 100 / b + 5, 100 - a * 100 / b, a * 10]);
    },
    () => {
      const base = rand(2, 20) * 100, pct = rand(2, 30);
      return numQ(`Năm ngoái một trại thu hoạch được ${fmt(base)} kg rau. Năm nay sản lượng tăng ${pct}% so với năm ngoái. Năm nay trại thu hoạch được bao nhiêu ki-lô-gam rau?`, base + base / 100 * pct, `Số tăng thêm = ${fmt(base)} : 100 × ${pct} = ${base / 100 * pct}. Năm nay: ${fmt(base)} + ${base / 100 * pct} = ${fmt(base + base / 100 * pct)} kg.`, [base / 100 * pct, base - base / 100 * pct, base + pct]);
    },
    () => {
      const x = rand(5, 40) * 100000, pct = rand(1, 6) * 5, v = x * pct / 100;
      return numQ(`Bác Lan tiết kiệm ${pct}% tiền lương mỗi tháng, tức là ${fmt(v)} đồng. Tiền lương mỗi tháng của bác Lan là bao nhiêu đồng?`, x, `Tiền lương = ${fmt(v)} : ${pct} × 100 = ${fmt(x)} đồng.`, [v * pct, x / 2, x + v]);
    },
    () => {
      const n = rand(2, 10) * 20, pct = rand(2, 14) * 5;
      return numQ(`Lớp có ${n} học sinh, trong đó ${pct}% là học sinh nữ. Hỏi lớp có bao nhiêu học sinh nam?`, n - n * pct / 100, `Số học sinh nữ = ${n} × ${pct} : 100 = ${n * pct / 100}. Số học sinh nam = ${n} − ${n * pct / 100} = ${n - n * pct / 100}.`, [n * pct / 100, n + n * pct / 100, n - pct]);
    },
  ])(),

  tiLe: (): Gen => pick<() => Gen>([
    () => {
      const per = rand(4, 15), a = rand(3, 8), b = rand(a + 1, 14);
      return numQ(`${a} hộp bánh có ${per * a} cái. Hỏi ${b} hộp bánh như thế có bao nhiêu cái?`, per * b, `Một hộp có ${per * a} : ${a} = ${per} cái. ${b} hộp có ${per} × ${b} = ${per * b} cái.`, [per * a, per + b, per * b + per]);
    },
    () => {
      const p1 = rand(3, 8), d1 = rand(4, 12), k = p1 * d1, divs = [2, 3, 4, 6].filter((x) => k % x === 0), p2 = k / pick(divs.length ? divs : [1]);
      const days = k / p2;
      return numQ(`${p1} người làm xong một công việc trong ${d1} ngày. Hỏi ${p2} người (làm với năng suất như nhau) làm xong công việc đó trong mấy ngày?`, days, `Một người làm xong trong ${p1} × ${d1} = ${k} ngày. ${p2} người làm xong trong ${k} : ${p2} = ${days} ngày.`, [d1 + 1, k, d1 * 2, Math.max(1, days - 1)]);
    },
    () => {
      const [p, q] = coprimePair(7), k = rand(2, 12), s = (p + q) * k;
      return numQ(`Tổng của hai số là ${s}. Tỉ số của hai số đó là ${p}/${q}. Tìm số lớn.`, Math.max(p, q) * k, `Tổng số phần: ${p} + ${q} = ${p + q}. Một phần: ${s} : ${p + q} = ${k}. Số lớn = ${k} × ${Math.max(p, q)} = ${Math.max(p, q) * k}.`, [Math.min(p, q) * k, k, s - k]);
    },
    () => {
      const p = rand(1, 5), q = rand(p + 1, 7), k = rand(2, 10), h = (q - p) * k;
      return numQ(`Hiệu của hai số là ${h}. Tỉ số của số bé và số lớn là ${p}/${q}. Tìm số bé.`, p * k, `Hiệu số phần: ${q} − ${p} = ${q - p}. Một phần: ${h} : ${q - p} = ${k}. Số bé = ${k} × ${p} = ${p * k}.`, [q * k, k, h + k]);
    },
    () => {
      const ratio = pick([1000, 2000, 5000, 10000]), len = rand(2, 9), real = len * ratio / 100;
      return numQ(`Trên bản đồ tỉ lệ 1 : ${fmt(ratio)}, quãng đường dài ${len} cm. Độ dài thật của quãng đường là bao nhiêu mét?`, real, `${len} × ${fmt(ratio)} = ${fmt(len * ratio)} cm = ${fmt(real)} m.`, [len * ratio, real * 10, real / 10, len * 100]);
    },
    () => {
      const price = rand(5, 30) * 1000, a = rand(3, 6), b = rand(7, 12);
      return numQ(`Mua ${a} quyển vở hết ${fmt(price * a)} đồng. Hỏi mua ${b} quyển vở như thế hết bao nhiêu tiền?`, price * b, `Giá một quyển: ${fmt(price * a)} : ${a} = ${fmt(price)} đồng. ${b} quyển: ${fmt(price)} × ${b} = ${fmt(price * b)} đồng.`, [price * a, price + b, price * b + price]);
    },
  ])(),

  thongKe: (): Gen => pick<() => Gen>([
    () => {
      const n = rand(2, 10) * 20, parts = [pick([20, 25, 30]), pick([30, 35, 40])];
      const rest = 100 - parts[0] - parts[1];
      return numQ(`Biểu đồ hình quạt cho biết lớp có ${n} học sinh: loại giỏi ${parts[0]}%, loại khá ${parts[1]}%, loại trung bình ${rest}%. Lớp có bao nhiêu học sinh loại khá?`, n * parts[1] / 100, `${n} × ${parts[1]} : 100 = ${n * parts[1] / 100} học sinh.`, [n * parts[0] / 100, n * rest / 100, parts[1], n - n * parts[1] / 100]);
    },
    () => {
      const m = rand(30, 90), o1 = rand(-8, 8), o2 = rand(-8, 8), v = [m + o1, m + o2, m - o1 - o2];
      return decQ(`Trung bình cộng của các số ${v.map((x) => dec(x, 1)).join('; ')} là:`, m, 1, `Tổng = ${dec(m * 3, 1)}; chia 3 được ${dec(m, 1)}.`, [m + 3, m - 3, m * 3]);
    },
    () => {
      const r = rand(2, 9), x = rand(1, 9), cols = ['đỏ', 'xanh'];
      return fracQ(`Hộp có ${r} viên bi ${cols[0]} và ${x} viên bi ${cols[1]}. Lấy ngẫu nhiên một viên bi. Phân số chỉ khả năng lấy được bi ${cols[0]} là:`, r, r + x, `Có ${r + x} viên bi, trong đó ${r} viên bi ${cols[0]} nên khả năng là ${r}/${r + x}${gcd(r, r + x) > 1 ? ' (rút gọn nếu được)' : ''}.`, [[x, r + x], [r, x], [r + x, r]]);
    },
    () => {
      const side = pick([[3, 6], [2, 6], [1, 6], [4, 6]]) as [number, number], name = { 3: 'mặt có số chấm chẵn hoặc lẻ (3 trong 6 mặt)', 2: 'mặt có số chấm là 5 hoặc 6', 1: 'mặt 6 chấm', 4: 'mặt có số chấm bé hơn 5' }[side[0]];
      return fracQ(`Gieo một con xúc xắc. Phân số chỉ khả năng xuất hiện ${name} là:`, side[0], side[1], `Có ${side[0]} kết quả thuận lợi trong tổng ${side[1]} kết quả: ${side[0]}/${side[1]}, rút gọn nếu được.`, [[side[1], side[0]], [side[0] + 1, side[1]]]);
    },
    () => {
      const n = pick([20, 25, 50, 100]), a = rand(1, n - 1);
      return pctQ(`Tung một đồng xu ${n} lần, được ${a} lần mặt sấp. Tỉ số phần trăm số lần xuất hiện mặt sấp là bao nhiêu?`, a * 100 / n, `${a} : ${n} = ${a * 100 / n}%.`, [a, a * 100 / n + 5, 100 - a * 100 / n, a * 10]);
    },
    () => {
      const days = shuffle(['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu']).slice(0, 4), s = shuffle(Array.from({ length: 30 }, (_, i) => i + 5)).slice(0, 4);
      const table = days.map((d, i) => `${d}: ${s[i]}`).join('; '), big = Math.random() < 0.5, best = big ? Math.max(...s) : Math.min(...s);
      return strQ(`Số bạn đến thư viện: ${table}. Ngày nào có ${big ? 'nhiều' : 'ít'} bạn đến nhất?`, days[s.indexOf(best)], days, `So sánh các số liệu: ${best} là số ${big ? 'lớn' : 'bé'} nhất, ứng với ${days[s.indexOf(best)]}.`);
    },
  ])(),

  onTapHinh: (): Gen => pick<() => Gen>([
    () => {
      const a = 2 * rand(2, 10), b = rand(3, 12), h = rand(2, 8);
      return numQ(`Một mảnh bìa gồm hình chữ nhật dài ${a} cm, rộng ${b} cm ghép với một hình tam giác có đáy ${a} cm, chiều cao ${h} cm. Diện tích cả mảnh bìa là bao nhiêu xăng-ti-mét vuông?`, a * b + a * h / 2, `Diện tích chữ nhật = ${a} × ${b} = ${a * b}; diện tích tam giác = ${a} × ${h} : 2 = ${a * h / 2}. Tổng = ${a * b + a * h / 2} cm².`, [a * b, a * b + a * h, a * b - a * h / 2]);
    },
    () => {
      const r = rand(2, 15);
      return decQ(`Trong một hình vuông cạnh ${2 * r} cm, người ta cắt một hình tròn lớn nhất (đường kính bằng cạnh hình vuông). Diện tích phần còn lại của hình vuông là bao nhiêu xăng-ti-mét vuông? (π = 3,14)`, 86 * r * r, 2,
        `Diện tích hình vuông = ${2 * r} × ${2 * r} = ${4 * r * r}; diện tích hình tròn (bán kính ${r}) = ${r} × ${r} × 3,14 = ${dec(r * r * 314, 2)}. Phần còn lại = ${dec(86 * r * r, 2)} cm².`, [r * r * 314, 400 * r * r, 4 * r * r * 314 - 400 * r * r]);
    },
    () => {
      const d = rand(2, 30);
      return decQ(`Chu vi của một nửa hình tròn đường kính ${d} cm (tính cả đường kính) là bao nhiêu xăng-ti-mét? (π = 3,14)`, 257 * d, 2, `Nửa đường tròn = ${d} × 3,14 : 2 = ${dec(157 * d, 2)}; cộng đường kính ${d} được ${dec(257 * d, 2)} cm.`, [157 * d, 314 * d, 157 * d + 200 * d]);
    },
    () => {
      const r = rand(2, 20);
      return decQ(`Một bánh xe có chu vi ${dec(r * 628, 2)} cm. Diện tích hình tròn bánh xe là bao nhiêu xăng-ti-mét vuông? (π = 3,14)`, r * r * 314, 2, `Bán kính = ${dec(r * 628, 2)} : 3,14 : 2 = ${r} cm. Diện tích = ${r} × ${r} × 3,14 = ${dec(r * r * 314, 2)} cm².`, [r * 628, r * r * 628, r * r * 31]);
    },
    () => {
      const q = pick<[string, string, string[], string]>([
        ['Công thức tính diện tích hình thang là:', 'S = (a + b) × h : 2', ['S = a × h : 2', 'S = r × r × 3,14', 'S = a × b'], 'Diện tích hình thang bằng tổng hai đáy nhân chiều cao rồi chia 2.'],
        ['Công thức tính thể tích hình hộp chữ nhật là:', 'V = a × b × c', ['V = a × b', 'V = (a + b) × 2 × c', 'V = a × a × 6'], 'Thể tích hình hộp chữ nhật = dài × rộng × cao.'],
        ['Công thức tính diện tích toàn phần hình lập phương cạnh a là:', 'S = a × a × 6', ['S = a × a × 4', 'S = a × a × a', 'S = a × 12'], 'Hình lập phương có 6 mặt là hình vuông cạnh a.'],
      ]);
      return strQ(q[0], q[1], q[2], q[3]);
    },
  ])(),

  tongHop: (): Gen => pick<() => Gen>([
    () => {
      const v = rand(30, 60), t = rand(2, 5), sh = rand(6, 10);
      const e = sh * 60 + 30 + t * 60;
      return strQ(`Một ô tô khởi hành lúc ${sh} giờ 30 phút, đi quãng đường ${v * t} km với vận tốc ${v} km/giờ. Ô tô đến nơi lúc mấy giờ?`, hm(e),
        [e + 30, e - 30, e + 60, sh * 60 + 30 + t * 60 + 10].map(hm), `Thời gian đi = ${v * t} : ${v} = ${t} giờ. Đến nơi lúc ${sh} giờ 30 phút + ${t} giờ = ${hm(e)}.`);
    },
    () => {
      const a = rand(2, 6), b = rand(2, 5), c = rand(1, 4), pct = pick([40, 50, 60, 75, 80]);
      return numQ(`Một bể hình hộp chữ nhật dài ${a} m, rộng ${b} m, cao ${c} m đang chứa nước đầy ${pct}% thể tích. Bể đang chứa bao nhiêu lít nước? (1 m³ = 1 000 lít)`, a * b * c * 10 * pct, `Thể tích bể = ${a} × ${b} × ${c} = ${a * b * c} m³ = ${fmt(a * b * c * 1000)} lít. Lượng nước = ${fmt(a * b * c * 1000)} × ${pct} : 100 = ${fmt(a * b * c * 10 * pct)} lít.`, [a * b * c * 1000, a * b * c * pct, a * b * c * 100 * pct]);
    },
    () => {
      const d = pick([20, 25, 40, 50]), n = rand(10, 100);
      return decQ(`Bánh xe đạp có đường kính ${d} cm. Xe lăn ${n} vòng thì đi được bao nhiêu mét? (π = 3,14)`, d * 314 * n, 4, `Một vòng đi được ${d} × 3,14 = ${dec(d * 314, 2)} cm. ${n} vòng: ${dec(d * 314 * n, 2)} cm = ${dec(d * 314 * n, 4)} m.`, [d * 314 * n * 10, d * 314 * n / 10 | 0, d * 157 * n]);
    },
    () => {
      const [p, q] = coprimePair(6), k = rand(3, 12);
      return numQ(`Một thửa ruộng hình chữ nhật có chiều dài gấp ${q}/${p} lần chiều rộng và nửa chu vi là ${(p + q) * k} m. Chiều dài thửa ruộng là bao nhiêu mét?`, q * k, `Chiều rộng ứng với ${p} phần, chiều dài ứng với ${q} phần; tổng ${p + q} phần = ${(p + q) * k} m nên mỗi phần ${k} m. Chiều dài = ${k} × ${q} = ${q * k} m.`, [p * k, k, (p + q) * k - k]);
    },
    () => {
      const a = rand(3, 9), b = rand(2, 7), c = rand(2, 6);
      return numQ(`Một hộp gỗ hình hộp chữ nhật có dài ${a} dm, rộng ${b} dm, cao ${c} dm. Hộp chứa được bao nhiêu lít nước? (1 lít = 1 dm³)`, a * b * c, `V = ${a} × ${b} × ${c} = ${a * b * c} dm³ = ${a * b * c} lít.`, [a + b + c, a * b * c + a * b, (a + b) * 2 * c]);
    },
    () => {
      // Scores are out of 10, so every value has to land in 1…10 — otherwise draw again.
      const m = rand(5, 9), n = rand(3, 5), off = Array.from({ length: n - 1 }, () => rand(-2, 2));
      const last = -off.reduce((s, x) => s + x, 0);
      if (m + last < 1 || m + last > 10) return gen.tongHop();
      const v = [...off, last].map((x) => m + x);
      return numQ(`Điểm kiểm tra của ${n} bạn lần lượt là ${v.join('; ')}. Điểm trung bình của ${n} bạn là bao nhiêu?`, m, `Tổng = ${v.join(' + ')} = ${m * n}; chia ${n} được ${m}.`, [m + 1, m - 1, m * n]);
    },
  ])(),
};

export const LESSONS_HK2: Lesson[] = [
  {
    id: 'hk2-hinh-tron', semester: 2, label: 'Hình tròn, đường tròn', emoji: '⭕', color: 'bg-sky-100 border-sky-400 text-sky-800',
    description: 'Chu vi và diện tích hình tròn',
    rule: 'Đường kính $d=2\\times r$ (bán kính $r$). Số $\\pi\\approx 3{,}14$.\n**Chu vi hình tròn**: $C=d\\times 3{,}14$ hay $C=r\\times 2\\times 3{,}14$. Tìm ngược: $d=C:3{,}14$; $r=C:3{,}14:2$.\n**Diện tích hình tròn**: $S=r\\times r\\times 3{,}14$. Nếu đề cho đường kính, hãy tìm bán kính trước ($r=d:2$).',
    examples: [
      { q: 'Hình tròn bán kính $5$ cm. Chu vi?', a: '$5\\times 2\\times 3{,}14=31{,}4$ cm.' },
      { q: 'Hình tròn bán kính $4$ dm. Diện tích?', a: '$4\\times 4\\times 3{,}14=50{,}24\\,dm^2$.' },
      { q: 'Chu vi hình tròn là $18{,}84$ cm. Đường kính?', a: '$18{,}84:3{,}14=6$ cm.' },
    ],
    gen: gen.hinhTron,
  },
  {
    id: 'hk2-hinh-hop-chu-nhat', semester: 2, label: 'Hình hộp chữ nhật', emoji: '📦', color: 'bg-amber-100 border-amber-400 text-amber-800',
    description: 'Diện tích xung quanh và toàn phần hình hộp chữ nhật',
    rule: 'Hình hộp chữ nhật có $6$ mặt, $8$ đỉnh, $12$ cạnh; kích thước: chiều dài $a$, chiều rộng $b$, chiều cao $h$.\n**Diện tích xung quanh**: $S_{xq}=(a+b)\\times 2\\times h$ (chu vi đáy nhân chiều cao).\n**Diện tích toàn phần**: $S_{tp}=S_{xq}+2\\times a\\times b$ (cộng thêm diện tích hai đáy).',
    examples: [
      { q: 'Hộp dài $5$ cm, rộng $3$ cm, cao $4$ cm. $S_{xq}=?$', a: '$(5+3)\\times 2\\times 4=64\\,cm^2$.' },
      { q: 'Cũng hộp đó, $S_{tp}=?$', a: '$64+2\\times 5\\times 3=94\\,cm^2$.' },
    ],
    gen: gen.hopChuNhat,
  },
  {
    id: 'hk2-hinh-lap-phuong', semester: 2, label: 'Hình lập phương', emoji: '🧊', color: 'bg-orange-100 border-orange-400 text-orange-800',
    description: 'Diện tích xung quanh và toàn phần hình lập phương',
    rule: 'Hình lập phương có $6$ mặt là các hình vuông bằng nhau, $8$ đỉnh, $12$ cạnh bằng nhau (cạnh $a$).\n**Diện tích xung quanh**: $S_{xq}=a\\times a\\times 4$.\n**Diện tích toàn phần**: $S_{tp}=a\\times a\\times 6$.\nTìm cạnh khi biết $S_{tp}$: lấy $S_{tp}:6$ được diện tích một mặt, rồi tìm số nhân với chính nó ra số đó.',
    examples: [
      { q: 'Hình lập phương cạnh $3$ cm. $S_{tp}=?$', a: '$3\\times 3\\times 6=54\\,cm^2$.' },
      { q: 'Hình lập phương cạnh $5$ dm. $S_{xq}=?$', a: '$5\\times 5\\times 4=100\\,dm^2$.' },
    ],
    gen: gen.lapPhuong,
  },
  {
    id: 'hk2-the-tich', semester: 2, label: 'Thể tích', emoji: '🧪', color: 'bg-cyan-100 border-cyan-400 text-cyan-800',
    description: 'cm³, dm³, m³ và thể tích hình hộp, hình lập phương',
    rule: '**Đơn vị**: $1\\,m^3=1\\,000\\,dm^3$; $1\\,dm^3=1\\,000\\,cm^3$ (mỗi đơn vị thể tích gấp $1\\,000$ lần đơn vị liền sau). $1$ lít $=1\\,dm^3$.\n**Thể tích hình hộp chữ nhật**: $V=a\\times b\\times c$ (dài $\\times$ rộng $\\times$ cao, cùng đơn vị). **Hình lập phương**: $V=a\\times a\\times a$.\nTìm chiều cao: $c=V:(a\\times b)$.',
    examples: [
      { q: 'Hộp dài $6$ cm, rộng $4$ cm, cao $3$ cm. Thể tích?', a: '$6\\times 4\\times 3=72\\,cm^3$.' },
      { q: '$5\\,dm^3=\\dots cm^3$', a: '$5\\,000\\,cm^3$.' },
      { q: 'Bể có thể tích $250\\,dm^3$ chứa được bao nhiêu lít?', a: '$250$ lít.' },
    ],
    gen: gen.theTich,
  },
  {
    id: 'hk2-so-do-thoi-gian', semester: 2, label: 'Số đo thời gian', emoji: '⏰', color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    description: 'Cộng, trừ, nhân, chia số đo thời gian và đổi đơn vị',
    rule: '$1$ giờ $=60$ phút; $1$ phút $=60$ giây. Khi **cộng** hay **nhân** mà số phút (giây) từ $60$ trở lên thì đổi ra giờ (phút). Khi **trừ** mà phút (giây) không đủ thì mượn $1$ giờ $=60$ phút.\n**Chia** số đo thời gian: chia số giờ trước; giờ dư đổi ra phút cộng vào số phút rồi chia tiếp.\nĐổi ra số thập phân: $15$ phút $=0{,}25$ giờ; $30$ phút $=0{,}5$ giờ; $45$ phút $=0{,}75$ giờ.\nThời gian kéo dài $=$ lúc kết thúc $-$ lúc bắt đầu.',
    examples: [
      { q: '$2$ giờ $45$ phút $+\\ 1$ giờ $30$ phút $=?$', a: '$3$ giờ $75$ phút $=4$ giờ $15$ phút.' },
      { q: '$1$ giờ $25$ phút $\\times 3=?$', a: '$3$ giờ $75$ phút $=4$ giờ $15$ phút.' },
      { q: '$1{,}5$ giờ $=\\dots$ phút', a: '$90$ phút.' },
    ],
    gen: gen.thoiGian,
  },
  {
    id: 'hk2-van-toc', semester: 2, label: 'Vận tốc, quãng đường, thời gian', emoji: '🚗', color: 'bg-green-100 border-green-400 text-green-800',
    description: 'v = s : t, s = v × t, t = s : v',
    rule: '**Vận tốc** $v=s:t$ (quãng đường chia thời gian). **Quãng đường** $s=v\\times t$. **Thời gian** $t=s:v$.\nĐơn vị phải khớp nhau: km, giờ thì $v$ tính bằng km/giờ; m, giây thì $v$ tính bằng m/giây. Nếu thời gian cho bằng phút thì đổi ra giờ trước (ví dụ $30$ phút $=0{,}5$ giờ).\nĐổi vận tốc: $1\\,m/giây=3{,}6\\,km/giờ$.',
    examples: [
      { q: 'Ô tô đi $150$ km trong $3$ giờ. Vận tốc?', a: '$150:3=50$ km/giờ.' },
      { q: 'Xe máy đi $40$ km/giờ trong $2{,}5$ giờ. Quãng đường?', a: '$40\\times 2{,}5=100$ km.' },
      { q: '$10\\,m/giây=\\dots km/giờ$', a: '$10\\times 3{,}6=36$ km/giờ.' },
    ],
    gen: gen.vanToc,
  },
  {
    id: 'hk2-chuyen-dong', semester: 2, label: 'Toán chuyển động', emoji: '🏃', color: 'bg-lime-100 border-lime-400 text-lime-800',
    description: 'Hai vật chuyển động ngược chiều, cùng chiều',
    rule: '**Ngược chiều, đi lại gần nhau** (gặp nhau): mỗi giờ hai vật gần nhau thêm $v_1+v_2$. Thời gian gặp nhau $=\\text{khoảng cách}:(v_1+v_2)$.\n**Ngược chiều, rời xa nhau**: sau $t$ giờ cách nhau $(v_1+v_2)\\times t$.\n**Cùng chiều, đuổi kịp**: mỗi giờ vật nhanh gần vật chậm thêm $v_1-v_2$. Thời gian đuổi kịp $=\\text{khoảng cách}:(v_1-v_2)$.',
    examples: [
      { q: 'Hai xe cách nhau $180$ km, đi ngược chiều với vận tốc $50$ và $40$ km/giờ. Sau mấy giờ gặp nhau?', a: '$180:(50+40)=2$ giờ.' },
      { q: 'Xe A (60 km/giờ) đuổi xe B (45 km/giờ) cách $30$ km. Sau mấy giờ đuổi kịp?', a: '$30:(60-45)=2$ giờ.' },
    ],
    gen: gen.chuyenDong,
  },
  {
    id: 'hk2-phan-tram-ung-dung', semester: 2, label: 'Giải toán về phần trăm', emoji: '💯', color: 'bg-rose-100 border-rose-400 text-rose-800',
    description: 'Giảm giá, tiền lãi, tăng giảm theo phần trăm',
    rule: 'Ba dạng cơ bản: **(1)** tìm tỉ số phần trăm của hai số: $a:b\\times 100$; **(2)** tìm $p\\%$ của một số: số $:100\\times p$; **(3)** tìm số khi biết $p\\%$ của nó: giá trị $:p\\times 100$.\nGiảm giá $p\\%$: giá mới $=$ giá cũ $-$ giá cũ $\\times p\\%$. Bán lãi $p\\%$: giá bán $=$ giá mua $+$ giá mua $\\times p\\%$. Tăng $p\\%$: số mới $=$ số cũ $+$ số cũ $\\times p\\%$.',
    examples: [
      { q: 'Áo giá $200\\,000$ đồng, giảm $15\\%$. Giá sau giảm?', a: 'Giảm $200\\,000:100\\times 15=30\\,000$; còn $170\\,000$ đồng.' },
      { q: 'Lớp $40$ học sinh, $30$ bạn đạt khá giỏi. Tỉ số phần trăm?', a: '$30:40=0{,}75=75\\%$.' },
    ],
    gen: gen.phanTramUngDung,
  },
  {
    id: 'hk2-ti-le', semester: 2, label: 'Tỉ lệ, tổng/hiệu – tỉ', emoji: '🧩', color: 'bg-purple-100 border-purple-400 text-purple-800',
    description: 'Rút về đơn vị, tỉ lệ nghịch, tổng–tỉ, hiệu–tỉ, bản đồ',
    rule: '**Rút về đơn vị** (tỉ lệ thuận): tìm giá trị một đơn vị rồi nhân với số đơn vị cần tìm.\n**Tỉ lệ nghịch**: tìm tích không đổi (ví dụ số người $\\times$ số ngày) rồi chia cho đại lượng mới.\n**Tổng – tỉ**: một phần $=$ tổng $:$ tổng số phần. **Hiệu – tỉ**: một phần $=$ hiệu $:$ hiệu số phần.\n**Bản đồ tỉ lệ $1:n$**: $1$ cm trên bản đồ ứng với $n$ cm thật.',
    examples: [
      { q: '$4$ hộp có $48$ cái bánh. $7$ hộp có bao nhiêu cái?', a: 'Một hộp $12$ cái; $7$ hộp $84$ cái.' },
      { q: '$6$ người làm xong trong $8$ ngày. $12$ người làm xong trong mấy ngày?', a: '$6\\times 8=48$ (ngày làm của $1$ người); $48:12=4$ ngày.' },
    ],
    gen: gen.tiLe,
  },
  {
    id: 'hk2-thong-ke-xac-suat', semester: 2, label: 'Thống kê và xác suất', emoji: '📊', color: 'bg-indigo-100 border-indigo-400 text-indigo-800',
    description: 'Biểu đồ hình quạt, trung bình cộng, khả năng xảy ra',
    rule: '**Biểu đồ hình quạt** cho biết tỉ số phần trăm của từng phần so với toàn thể (tổng là $100\\%$). Số lượng của một phần $=$ tổng số $\\times$ tỉ số phần trăm.\n**Trung bình cộng** $=$ tổng các số $:$ số các số hạng.\n**Khả năng xảy ra** của một kết quả có thể viết bằng phân số: (số kết quả thuận lợi)/(tổng số kết quả có thể xảy ra).',
    examples: [
      { q: 'Lớp $40$ học sinh, $25\\%$ đạt loại giỏi. Có bao nhiêu bạn giỏi?', a: '$40\\times 25:100=10$ bạn.' },
      { q: 'Hộp có $3$ bi đỏ, $2$ bi xanh. Khả năng lấy được bi đỏ?', a: '$\\dfrac{3}{5}$.' },
    ],
    gen: gen.thongKe,
  },
  {
    id: 'hk2-on-tap-hinh-hoc', semester: 2, label: 'Ôn tập hình học', emoji: '📐', color: 'bg-teal-100 border-teal-400 text-teal-800',
    description: 'Hình ghép, hình tròn trong hình vuông, công thức các hình',
    rule: 'Công thức cần nhớ:\nTam giác $S=\\dfrac{a\\times h}{2}$; hình thang $S=\\dfrac{(a+b)\\times h}{2}$; hình tròn $C=r\\times 2\\times 3{,}14$, $S=r\\times r\\times 3{,}14$.\nHình hộp chữ nhật $S_{xq}=(a+b)\\times 2\\times h$, $V=a\\times b\\times c$; hình lập phương $S_{tp}=a\\times a\\times 6$, $V=a\\times a\\times a$.\nHình ghép: chia thành các hình đã biết rồi **cộng** các diện tích; phần còn lại: lấy diện tích hình lớn **trừ** diện tích hình bị cắt.',
    examples: [
      { q: 'Hình vuông cạnh $10$ cm, cắt hình tròn đường kính $10$ cm. Diện tích còn lại?', a: '$10\\times 10-5\\times 5\\times 3{,}14=100-78{,}5=21{,}5\\,cm^2$.' },
      { q: 'Nửa hình tròn đường kính $10$ cm: chu vi (cả đường kính)?', a: '$10\\times 3{,}14:2+10=25{,}7$ cm.' },
    ],
    gen: gen.onTapHinh,
  },
  {
    id: 'hk2-bai-toan-tong-hop', semester: 2, label: 'Toán có lời văn tổng hợp', emoji: '📖', color: 'bg-emerald-100 border-emerald-400 text-emerald-800',
    description: 'Bài toán nhiều bước kết hợp các kiến thức đã học',
    rule: 'Các bước giải: **(1) đọc kĩ đề** và xác định dạng toán (vận tốc, phần trăm, tỉ số, hình học…); **(2) lập kế hoạch** giải; **(3) tính từng bước**, ghi đúng đơn vị; **(4) kiểm tra** lại.\nNhớ đổi các đơn vị về cùng loại trước khi tính ($1\\,m^3=1\\,000$ lít; $30$ phút $=0{,}5$ giờ).\nBài toán hình học: vẽ hình nhanh và ghi các số liệu lên hình.',
    examples: [
      { q: 'Ô tô đi $120$ km với vận tốc $40$ km/giờ, khởi hành lúc $7$ giờ. Đến lúc mấy giờ?', a: 'Thời gian $120:40=3$ giờ; đến lúc $10$ giờ.' },
      { q: 'Bể $2\\,m^3$ chứa nước đầy $50\\%$. Có bao nhiêu lít nước?', a: '$2\\,000\\times 50:100=1\\,000$ lít.' },
    ],
    gen: gen.tongHop,
  },
];
