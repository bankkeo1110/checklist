import { type Lesson, fmt, dec, numQ, strQ, fracQ, decQ, pctQ, rand, pick, shuffle, lcm } from './qutil';

type Gen = ReturnType<Lesson['gen']>;

/** random decimal with p places, as an integer scaled by 10^p */
const mkD = (p: number, maxInt = 99) => rand(1, maxInt) * 10 ** p + rand(0, 10 ** p - 1);
/** show a scaled integer WITH trailing zeros kept (to compare 4,5 with 4,50) */
const showP = (scaled: number, p: number) => (p === 0 ? String(scaled) : (scaled / 10 ** p).toFixed(p).replace('.', ','));
const cmp = (x: number, y: number) => (x < y ? '<' : x > y ? '>' : '=');
const HANG = ['chục', 'đơn vị', 'phần mười', 'phần trăm', 'phần nghìn'];

const gen = {
  onTapPhanSo: (): Gen => pick<() => Gen>([
    () => {
      const q1 = pick([2, 3, 4, 5, 6]);
      let q2 = pick([2, 3, 4, 5, 6, 8]);
      if (q1 === q2) q2 = 8;
      const L = lcm(q1, q2), a = rand(1, q1 - 1), b = rand(1, q2 - 1), sub = Math.random() < 0.5;
      let x = a * (L / q1), y = b * (L / q2), s1 = `${a}/${q1}`, s2 = `${b}/${q2}`;
      if (sub && x < y) { [x, y] = [y, x]; [s1, s2] = [s2, s1]; }
      const n = sub ? x - y : x + y;
      return fracQ(`${s1} ${sub ? '−' : '+'} ${s2} = ?`, n, L, `Quy đồng mẫu số chung ${L}: ${x}/${L} ${sub ? '−' : '+'} ${y}/${L} = ${n}/${L}, rút gọn nếu được.`, [[a + b, q1 + q2], [x + y, L]]);
    },
    () => {
      const a = rand(1, 5), b = rand(2, 9), c = rand(1, 5), d = rand(2, 9), mul = Math.random() < 0.5;
      return mul
        ? fracQ(`${a}/${b} × ${c}/${d} = ?`, a * c, b * d, `Nhân tử với tử, mẫu với mẫu: ${a * c}/${b * d}, rút gọn nếu được.`, [[a + c, b + d]])
        : fracQ(`${a}/${b} : ${c}/${d} = ?`, a * d, b * c, `Chia cho phân số: nhân với phân số đảo ngược: ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}.`, [[a * c, b * d]]);
    },
    () => {
      const w = rand(1, 6), b = rand(2, 9), a = rand(1, b - 1), n = w * b + a;
      return strQ(`Viết hỗn số ${w} ${a}/${b} thành phân số:`, `${n}/${b}`, [`${w + a}/${b}`, `${w * a + b}/${b}`, `${n + 1}/${b}`, `${n}/${b + 1}`],
        `${w} ${a}/${b} = (${w} × ${b} + ${a})/${b} = ${n}/${b}.`);
    },
    () => {
      const b = rand(2, 9), w = rand(1, 6), a = rand(1, b - 1), n = w * b + a;
      return strQ(`Viết phân số ${n}/${b} thành hỗn số:`, `${w} ${a}/${b}`, [`${w + 1} ${a}/${b}`, `${w + 2} ${a}/${b}`, `${a} ${w}/${b}`, `${w} ${a + 1}/${b + 1}`],
        `${n} : ${b} = ${w} dư ${a} nên ${n}/${b} = ${w} ${a}/${b}.`);
    },
    () => {
      const k = pick([1, 2, 3]), a = rand(1, 10 ** k - 1);
      return decQ(`Viết phân số thập phân ${a}/${10 ** k} dưới dạng số thập phân:`, a, k, `Mẫu số ${10 ** k} nên số thập phân có ${k} chữ số ở phần thập phân: ${dec(a, k)}.`, [a * 10, Math.floor(a / 10) || a + 1, a + 1]);
    },
  ])(),

  soThapPhan: (): Gen => pick<() => Gen>([
    () => {
      const d = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5), pos = rand(0, 4);
      const n = d[0] * 10000 + d[1] * 1000 + d[2] * 100 + d[3] * 10 + d[4];
      return strQ(`Trong số ${dec(n, 3)}, chữ số ${d[pos]} thuộc hàng nào?`, `Hàng ${HANG[pos]}`, HANG.filter((_, i) => i !== pos).map((x) => `Hàng ${x}`),
        `Phần nguyên gồm hàng chục, đơn vị; phần thập phân gồm hàng phần mười, phần trăm, phần nghìn. Chữ số ${d[pos]} ở hàng ${HANG[pos]}.`);
    },
    () => {
      const d = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5), pos = rand(0, 4), sc = [10000, 1000, 100, 10, 1];
      const n = d[0] * 10000 + d[1] * 1000 + d[2] * 100 + d[3] * 10 + d[4];
      return decQ(`Giá trị của chữ số ${d[pos]} trong số ${dec(n, 3)} là:`, d[pos] * sc[pos], 3, `Chữ số ${d[pos]} ở hàng ${HANG[pos]} nên có giá trị ${dec(d[pos] * sc[pos], 3)}.`,
        [d[pos] * sc[Math.min(4, pos + 1)], d[pos] * sc[Math.max(0, pos - 1)], d[pos] * 100]);
    },
    () => {
      const w = rand(1, 9), k = pick([1, 2, 3]), a = rand(1, 10 ** k - 1);
      return decQ(`Viết hỗn số ${w} ${a}/${10 ** k} dưới dạng số thập phân:`, w * 10 ** k + a, k, `${w} ${a}/${10 ** k} = ${w} + ${a}/${10 ** k} = ${dec(w * 10 ** k + a, k)}.`, [w * 10 ** k + a * 10, a, w * 10 ** k]);
    },
    () => {
      const k = pick([1, 2, 3]), a = rand(1, 10 ** k - 1);
      return numQ(`${showP(a, k)} = .../${10 ** k}`, a, `${showP(a, k)} có ${k} chữ số ở phần thập phân nên bằng ${a}/${10 ** k}.`, [a * 10, Math.floor(a / 10) || a + 1, a + 1]);
    },
    () => {
      const u = rand(1, 9), t = rand(1, 9), h = rand(1, 9);
      return decQ(`Số thập phân gồm ${u} đơn vị, ${t} phần mười và ${h} phần trăm viết là:`, u * 100 + t * 10 + h, 2, `Viết phần nguyên ${u}, dấu phẩy, rồi ${t} (phần mười) và ${h} (phần trăm): ${dec(u * 100 + t * 10 + h, 2)}.`, [u * 100 + h * 10 + t, t * 100 + u * 10 + h, u * 100 + t, u * 1000 + t * 10 + h]);
    },
    () => {
      const a = rand(1, 9), b = rand(1, 9);
      return strQ(`Số nào dưới đây bằng ${a},${b}?`, `${a},${b}0`, [`${a},0${b}`, `${a}${b},0`, `${a},${b}1`, `0,${a}${b}`], 'Viết thêm chữ số 0 vào tận cùng bên phải phần thập phân thì giá trị số thập phân không đổi.');
    },
  ])(),

  soSanhLamTron: (): Gen => pick<() => Gen>([
    () => {
      const p1 = rand(1, 3), X = mkD(p1, 20), equal = Math.random() < 0.2, p2 = equal ? p1 + 1 : rand(1, 3);
      const Y = equal ? X * 10 : Math.random() < 0.5 ? X * 10 ** (p2 - p1) + pick([1, 10, -1, -10]) : mkD(p2, 20);
      const ans = cmp(X * 10 ** (3 - p1), Y * 10 ** (3 - p2));
      return strQ(`Điền dấu thích hợp: ${showP(X, p1)} ... ${showP(Y, p2)}`, ans, ['<', '>', '='], `So sánh phần nguyên trước; nếu bằng nhau thì so sánh phần mười, phần trăm… (thêm chữ số 0 cho cùng số chữ số thập phân). Kết quả: ${ans}.`);
    },
    () => {
      const s = new Set<number>();
      while (s.size < 3) s.add(mkD(2, 9));
      const v = [...s], sorted = [...v].sort((a, b) => a - b), show = (l: number[]) => l.map((x) => dec(x, 2)).join(' < ');
      const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => show(p.map((i) => v[i])));
      return strQ(`Sắp xếp các số ${v.map((x) => dec(x, 2)).join('; ')} theo thứ tự từ bé đến lớn:`, show(sorted), perms, `So sánh phần nguyên rồi phần thập phân: ${show(sorted)}.`);
    },
    () => {
      const idx = rand(0, 2), n = mkD(3, 30), target = [100, 10, 1000][idx], name = ['phần mười', 'phần trăm', 'đơn vị'][idx];
      const ans = Math.round(n / target) * target, dg = Math.floor((n % target) / (target / 10));
      return decQ(`Làm tròn số ${dec(n, 3)} đến hàng ${name}, ta được:`, ans, 3, `Chữ số ngay sau hàng ${name} là ${dg}: ${dg >= 5 ? 'từ 5 trở lên nên làm tròn lên' : 'bé hơn 5 nên làm tròn xuống'}. Kết quả ${dec(ans, 3)}.`,
        [ans + target, ans - target, Math.floor(n / target) * target + (ans === Math.floor(n / target) * target ? target : 0)]);
    },
    () => {
      const s = new Set<number>();
      while (s.size < 4) { const v = mkD(2, 9); s.add(Math.random() < 0.5 ? Math.floor(v / 10) * 10 : v); }
      const vals = [...s], big = Math.random() < 0.5, ans = big ? Math.max(...vals) : Math.min(...vals);
      return strQ(`Số nào ${big ? 'lớn' : 'bé'} nhất trong các số: ${vals.map((x) => dec(x, 2)).join('; ')}?`, dec(ans, 2), vals.map((x) => dec(x, 2)), `So sánh các số thập phân: số ${big ? 'lớn' : 'bé'} nhất là ${dec(ans, 2)}.`);
    },
    () => {
      const X = rand(11, 98), lo = X * 10, hi = (X + 1) * 10, d = rand(1, 9);
      return strQ(`Số nào lớn hơn ${dec(X, 1)} và bé hơn ${dec(X + 1, 1)}?`, dec(lo + d, 2), [dec(lo, 2), dec(hi, 2), dec(lo - d, 2), dec(hi + d, 2)],
        `${dec(X, 1)} = ${dec(lo, 2)} và ${dec(X + 1, 1)} = ${dec(hi, 2)}. Số ${dec(lo + d, 2)} nằm giữa hai số đó.`);
    },
  ])(),

  congTru: (): Gen => pick<() => Gen>([
    () => {
      const p1 = rand(1, 2), p2 = rand(1, 2), p = Math.max(p1, p2), X = mkD(p1, 90), Y = mkD(p2, 90), A = X * 10 ** (p - p1), B = Y * 10 ** (p - p2);
      return decQ(`${dec(X, p1)} + ${dec(Y, p2)} = ?`, A + B, p, `Viết các số sao cho dấu phẩy thẳng cột rồi cộng như số tự nhiên: ${dec(A + B, p)}.`, [A + B + 10 ** (p - 1), A + B - 10 ** (p - 1), A + B + 10 ** p, A + B - 1]);
    },
    () => {
      const pa = rand(1, 2), pb = rand(1, 2), p = Math.max(pa, pb);
      let x = mkD(pa, 90), y = mkD(pb, 40), sa = pa, sb = pb, A = x * 10 ** (p - pa), B = y * 10 ** (p - pb);
      if (A < B) { [x, y] = [y, x]; [sa, sb] = [sb, sa]; [A, B] = [B, A]; }
      return decQ(`${dec(x, sa)} − ${dec(y, sb)} = ?`, A - B, p, `Đặt tính thẳng cột dấu phẩy rồi trừ như số tự nhiên: ${dec(A - B, p)}.`, [A - B + 10 ** (p - 1), A - B - 10 ** (p - 1), A + B, A - B + 1]);
    },
    () => {
      const Y = mkD(1, 30), Z = mkD(1, 30);
      return Math.random() < 0.5
        ? decQ(`Tìm x: x + ${dec(Y, 1)} = ${dec(Y + Z, 1)}`, Z, 1, `x = ${dec(Y + Z, 1)} − ${dec(Y, 1)} = ${dec(Z, 1)}.`, [Y + Z + Y, Y + Z, Math.abs(Y - Z)])
        : decQ(`Tìm x: x − ${dec(Y, 1)} = ${dec(Z, 1)}`, Y + Z, 1, `x = ${dec(Z, 1)} + ${dec(Y, 1)} = ${dec(Y + Z, 1)}.`, [Math.abs(Y - Z), Y, Z]);
    },
    () => {
      const x = rand(11, 89), y = 100 - x, z = mkD(1, 30);
      return decQ(`Tính nhanh: ${dec(x, 1)} + ${dec(z, 1)} + ${dec(y, 1)}`, 100 + z, 1, `Ghép hai số có tổng tròn: (${dec(x, 1)} + ${dec(y, 1)}) + ${dec(z, 1)} = 10 + ${dec(z, 1)} = ${dec(100 + z, 1)}.`, [z, 200 + z, 110 + z]);
    },
    () => {
      const a = mkD(1, 9), b = mkD(2, 9), A = a * 10;
      return decQ(`Mua ${dec(a, 1)} kg táo và ${dec(b, 2)} kg cam. Cả hai loại nặng bao nhiêu ki-lô-gam?`, A + b, 2, `Tổng khối lượng = ${dec(a, 1)} + ${dec(b, 2)} = ${dec(A + b, 2)} kg.`, [A + b + 10, A + b - 10, Math.abs(b - A)]);
    },
    () => {
      const L = mkD(2, 20) + 400, c = rand(100, 399);
      return decQ(`Một sợi dây dài ${dec(L, 2)} m, người ta cắt đi ${dec(c, 2)} m. Sợi dây còn lại dài bao nhiêu mét?`, L - c, 2, `Còn lại = ${dec(L, 2)} − ${dec(c, 2)} = ${dec(L - c, 2)} m.`, [L - c + 10, L - c - 10, L + c]);
    },
  ])(),

  nhan: (): Gen => pick<() => Gen>([
    () => {
      const p = rand(1, 2), X = mkD(p, 20), n = rand(2, 9);
      return decQ(`${dec(X, p)} × ${n} = ?`, X * n, p, `Nhân như số tự nhiên rồi đặt dấu phẩy để phần thập phân có ${p} chữ số: ${dec(X * n, p)}.`, [X * n + 10 ** (p - 1), X * n * 10, Math.floor(X * n / 10) || X, X * (n + 1)]);
    },
    () => {
      const p = rand(1, 2), X = mkD(p, 30), k = pick([10, 100, 1000]);
      return decQ(`${dec(X, p)} × ${fmt(k)} = ?`, X * k, p, `Nhân với ${fmt(k)}: chuyển dấu phẩy sang phải ${String(k).length - 1} chữ số: ${dec(X * k, p)}.`, [X * k * 10, Math.floor(X * k / 10), X + k]);
    },
    () => {
      const p = rand(0, 1), X = rand(1, 999), k = pick([1, 2]);
      return decQ(`${dec(X, p)} × ${k === 1 ? '0,1' : '0,01'} = ?`, X, p + k, `Nhân với ${k === 1 ? '0,1' : '0,01'} là chia cho ${k === 1 ? 10 : 100}: chuyển dấu phẩy sang trái ${k} chữ số, được ${dec(X, p + k)}.`, [X * 10, Math.floor(X / 10) || 1, X + 1]);
    },
    () => {
      const p2 = rand(1, 2), X = rand(12, 99), Y = rand(12, 99);
      return decQ(`${dec(X, 1)} × ${dec(Y, p2)} = ?`, X * Y, 1 + p2, `Nhân như số tự nhiên: ${X} × ${Y} = ${X * Y}; hai thừa số có ${1 + p2} chữ số thập phân nên kết quả là ${dec(X * Y, 1 + p2)}.`, [X * Y * 10, Math.floor(X * Y / 10), X * Y + 10]);
    },
    () => {
      const w = mkD(1, 30), n = rand(3, 12);
      return decQ(`Mỗi bao gạo nặng ${dec(w, 1)} kg. ${n} bao gạo như vậy nặng bao nhiêu ki-lô-gam?`, w * n, 1, `Cân nặng = ${dec(w, 1)} × ${n} = ${dec(w * n, 1)} kg.`, [w * n + 10, w * n * 10, w + n]);
    },
    () => {
      const a = rand(11, 99), b = pick([25, 5, 4, 8]), c = b === 25 ? 4 : b === 5 ? 2 : b === 4 ? 25 : 125;
      return decQ(`Tính nhanh: ${dec(a, 1)} × ${b} × ${c}`, a * b * c, 1, `Nhóm ${b} × ${c} = ${b * c} trước (giao hoán, kết hợp): ${dec(a, 1)} × ${b * c} = ${dec(a * b * c, 1)}.`, [a * b * c * 10, Math.floor(a * b * c / 10), a * b * c + 10]);
    },
  ])(),

  chia: (): Gen => pick<() => Gen>([
    () => {
      const p = rand(1, 2), q = mkD(p, 20), n = rand(2, 9);
      return decQ(`${dec(q * n, p)} : ${n} = ?`, q, p, `Chia như số tự nhiên, khi hết phần nguyên thì đặt dấu phẩy ở thương: ${dec(q * n, p)} : ${n} = ${dec(q, p)}.`, [q * 10, Math.floor(q / 10) || 1, q + 10 ** (p - 1)]);
    },
    () => {
      const p = rand(1, 2), X = mkD(p, 900), k = pick([10, 100, 1000]);
      return decQ(`${dec(X, p)} : ${fmt(k)} = ?`, X, p + String(k).length - 1, `Chia cho ${fmt(k)}: chuyển dấu phẩy sang trái ${String(k).length - 1} chữ số.`, [X * 10, Math.floor(X / 10) || 1, X * k]);
    },
    () => {
      const b = pick([2, 4, 5, 8, 20, 25]), a = rand(1, 99), ans = a * 1000 / b;
      return decQ(`${a} : ${b} = ? (thương là số thập phân)`, ans, 3, `Sau khi hết phần nguyên, thêm dấu phẩy vào thương và viết thêm chữ số 0 vào số dư rồi chia tiếp: ${a} : ${b} = ${dec(ans, 3)}.`, [ans * 10, Math.floor(ans / 10), ans + 100, Math.max(0, ans - 100)]);
    },
    () => {
      const Y = rand(2, 9), q = rand(2, 30);
      return numQ(`${dec(Y * q, 1)} : ${dec(Y, 1)} = ?`, q, `Nhân cả số bị chia và số chia với 10 để số chia thành số tự nhiên: ${Y * q} : ${Y} = ${q}.`, [q * 10, q + 1, Math.max(1, q - 1), Y]);
    },
    () => {
      const n = rand(3, 9), q = mkD(1, 9);
      return decQ(`Chia đều ${dec(q * n, 1)} kg đường vào ${n} túi. Mỗi túi có bao nhiêu ki-lô-gam đường?`, q, 1, `${dec(q * n, 1)} : ${n} = ${dec(q, 1)} kg.`, [q * 10, q + 1, q - 1]);
    },
    () => {
      const Y = rand(2, 9), q = rand(3, 20);
      return numQ(`Tìm x: x × ${dec(Y, 1)} = ${dec(Y * q, 1)}`, q, `x = ${dec(Y * q, 1)} : ${dec(Y, 1)} = ${q}.`, [q * 10, q + Y, Y * q]);
    },
  ])(),

  donVi: (): Gen => {
    const u = pick<[string, string, number]>([['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['tấn', 'kg', 1000], ['m', 'dm', 10]]);
    const p = String(u[2]).length - 1;
    return pick<() => Gen>([
      () => {
        const a = rand(1, 20), b = rand(1, u[2] - 1);
        return decQ(`${a} ${u[0]} ${b} ${u[1]} = ... ${u[0]}`, a * u[2] + b, p, `${b} ${u[1]} = ${dec(b, p)} ${u[0]} nên ${a} ${u[0]} ${b} ${u[1]} = ${dec(a * u[2] + b, p)} ${u[0]}.`, [a * u[2] * 10 + b, a * 10 + b, a * u[2] + b * 10]);
      },
      () => {
        const N = rand(2, 9) * u[2] + rand(1, u[2] - 1);
        return decQ(`${fmt(N)} ${u[1]} = ... ${u[0]}`, N, p, `1 ${u[0]} = ${fmt(u[2])} ${u[1]} nên ${fmt(N)} ${u[1]} = ${dec(N, p)} ${u[0]}.`, [N * 10, Math.floor(N / 10), N + u[2]]);
      },
      () => {
        const X = rand(1, 9) * u[2] + rand(1, u[2] - 1);
        return numQ(`${dec(X, p)} ${u[0]} = ... ${u[1]}`, X, `1 ${u[0]} = ${fmt(u[2])} ${u[1]} nên ${dec(X, p)} ${u[0]} = ${fmt(X)} ${u[1]}.`, [X * 10, Math.floor(X / 10), X + u[2]]);
      },
    ])();
  },

  dienTichHa: (): Gen => pick<() => Gen>([
    () => {
      const k = rand(2, 40);
      return numQ(`${k} ha = ... m²`, k * 10000, `1 ha = 10 000 m² nên ${k} ha = ${fmt(k * 10000)} m².`, [k * 1000, k * 100000, k * 100]);
    },
    () => {
      const k = rand(2, 40);
      return numQ(`${fmt(k * 10000)} m² = ... ha`, k, `${fmt(k * 10000)} : 10 000 = ${k} ha.`, [k * 10, k * 100, k + 1]);
    },
    () => {
      const x = rand(1, 9) * 5;
      return numQ(`${dec(x, 1)} ha = ... m²`, x * 1000, `1 ha = 10 000 m² nên ${dec(x, 1)} ha = ${fmt(x * 1000)} m².`, [x * 100, x * 10000, x * 500]);
    },
    () => {
      const k = rand(2, 30);
      return numQ(`${k} km² = ... ha`, k * 100, `1 km² = 100 ha nên ${k} km² = ${fmt(k * 100)} ha.`, [k * 10, k * 1000, k * 10000]);
    },
    () => {
      const L = rand(2, 12) * 50, W = rand(2, 12) * 50, S = L * W;
      return decQ(`Một thửa ruộng hình chữ nhật dài ${L} m, rộng ${W} m. Diện tích thửa ruộng là bao nhiêu héc-ta?`, S / 1000, 1, `Diện tích = ${L} × ${W} = ${fmt(S)} m² = ${dec(S / 1000, 1)} ha (1 ha = 10 000 m²).`, [S / 100, S / 10, S / 1000 + 50]);
    },
    () => {
      const a = rand(2, 9), b = rand(1, 9) * 5000, ans = cmp(a * 10000, b);
      return strQ(`Điền dấu thích hợp: ${a} ha ... ${fmt(b)} m²`, ans, ['<', '>', '='], `${a} ha = ${fmt(a * 10000)} m². So sánh với ${fmt(b)} m²: ${ans}.`);
    },
  ])(),

  tamGiac: (): Gen => pick<() => Gen>([
    () => {
      const a = rand(4, 30), h = 2 * rand(2, 15);
      return numQ(`Tam giác có độ dài đáy ${a} cm, chiều cao ${h} cm. Diện tích tam giác là bao nhiêu xăng-ti-mét vuông?`, a * h / 2, `Diện tích tam giác = đáy × chiều cao : 2 = ${a} × ${h} : 2 = ${a * h / 2} cm².`, [a * h, a + h, a * h / 4]);
    },
    () => {
      const a = rand(2, 10) * 2, h = rand(3, 20), S = a * h / 2;
      return numQ(`Tam giác có diện tích ${S} dm², độ dài đáy ${a} dm. Chiều cao tương ứng là bao nhiêu đề-xi-mét?`, h, `Chiều cao = diện tích × 2 : đáy = ${S} × 2 : ${a} = ${h} dm.`, [S * 2, a, h + 1, h * 2]);
    },
    () => {
      const X = 2 * rand(6, 40), h = rand(3, 15);
      return decQ(`Tam giác có đáy ${dec(X, 1)} cm, chiều cao ${h} cm. Diện tích tam giác là bao nhiêu xăng-ti-mét vuông?`, X * h / 2, 1, `${dec(X, 1)} × ${h} : 2 = ${dec(X * h / 2, 1)} cm².`, [X * h, X * h / 4, X * h / 2 + 10]);
    },
    () => {
      const a = 2 * rand(2, 12), b = rand(3, 15);
      return numQ(`Tam giác vuông có hai cạnh góc vuông dài ${a} cm và ${b} cm. Diện tích là bao nhiêu xăng-ti-mét vuông?`, a * b / 2, `Hai cạnh góc vuông là đáy và chiều cao: ${a} × ${b} : 2 = ${a * b / 2} cm².`, [a * b, a + b, a * b / 2 + a]);
    },
    () => {
      const q = pick<[string, string, string[], string]>([
        ['Chiều cao của tam giác là đoạn thẳng nào?', 'Đoạn thẳng hạ từ đỉnh vuông góc với đáy', ['Đoạn thẳng nối hai đỉnh bất kì', 'Cạnh dài nhất của tam giác', 'Đoạn thẳng song song với đáy'], 'Chiều cao ứng với một đáy là đoạn thẳng kẻ từ đỉnh đối diện, vuông góc với đáy đó.'],
        ['Công thức tính diện tích tam giác là:', 'S = a × h : 2', ['S = a × h', 'S = (a + b) × h : 2', 'S = a × a'], 'Diện tích tam giác bằng độ dài đáy nhân chiều cao rồi chia 2.'],
      ]);
      return strQ(q[0], q[1], q[2], q[3]);
    },
  ])(),

  hinhThang: (): Gen => pick<() => Gen>([
    () => {
      const a = rand(5, 25), b = rand(3, 20), h = 2 * rand(2, 10);
      return numQ(`Hình thang có đáy lớn ${a} cm, đáy bé ${b} cm, chiều cao ${h} cm. Diện tích hình thang là bao nhiêu xăng-ti-mét vuông?`, (a + b) * h / 2, `Diện tích = (đáy lớn + đáy bé) × chiều cao : 2 = (${a} + ${b}) × ${h} : 2 = ${(a + b) * h / 2} cm².`, [(a + b) * h, a * h / 2, (a + b) / 2 + h]);
    },
    () => {
      const t = rand(4, 20), h = rand(2, 12), S = t * h / 2;
      if (S !== Math.floor(S)) return gen.hinhThang();
      return numQ(`Hình thang có diện tích ${S} m², tổng hai đáy là ${t} m. Chiều cao là bao nhiêu mét?`, h, `Chiều cao = diện tích × 2 : tổng hai đáy = ${S} × 2 : ${t} = ${h} m.`, [S, t, h + 1, h * 2]);
    },
    () => {
      const a = rand(8, 25), b = rand(3, 7), h = 2 * rand(2, 9), S = (a + b) * h / 2;
      return numQ(`Hình thang có diện tích ${S} cm², chiều cao ${h} cm, đáy lớn ${a} cm. Đáy bé là bao nhiêu xăng-ti-mét?`, b, `Tổng hai đáy = ${S} × 2 : ${h} = ${a + b} cm. Đáy bé = ${a + b} − ${a} = ${b} cm.`, [a + b, S / h, b + 1, b - 1]);
    },
    () => {
      const A = rand(30, 90), B = rand(10, 29), h = 2 * rand(2, 8);
      return decQ(`Hình thang có đáy lớn ${dec(A, 1)} m, đáy bé ${dec(B, 1)} m, chiều cao ${h} m. Diện tích là bao nhiêu mét vuông?`, (A + B) * h / 2, 1, `(${dec(A, 1)} + ${dec(B, 1)}) × ${h} : 2 = ${dec((A + B) * h / 2, 1)} m².`, [(A + B) * h, (A + B) * h / 4, (A + B) * h / 2 + 10]);
    },
    () => {
      const q = pick<[string, string, string[], string]>([
        ['Hình thang có đặc điểm nào sau đây?', 'Có một cặp cạnh đối diện song song', ['Có bốn cạnh bằng nhau', 'Có bốn góc vuông', 'Không có cạnh nào song song'], 'Hình thang là tứ giác có một cặp cạnh đối diện song song (hai đáy).'],
        ['Công thức tính diện tích hình thang là:', 'S = (a + b) × h : 2', ['S = a × b × h', 'S = a × h', 'S = (a + b) × 2'], 'Diện tích hình thang bằng tổng hai đáy nhân chiều cao rồi chia 2.'],
      ]);
      return strQ(q[0], q[1], q[2], q[3]);
    },
  ])(),

  phanTram: (): Gen => pick<() => Gen>([
    () => {
      const b = rand(1, 10) * 20, pct = rand(1, 19) * 5, a = b * pct / 100;
      return pctQ(`Tìm tỉ số phần trăm của ${a} và ${b}.`, pct, `${a} : ${b} = ${pct / 100} = ${pct}%.`, [pct + 5, pct - 5, pct * 2, 100 - pct]);
    },
    () => {
      const n = rand(1, 10) * 20, pct = rand(1, 19) * 5;
      return numQ(`Tìm ${pct}% của ${n}.`, n * pct / 100, `${n} : 100 × ${pct} = ${n * pct / 100}.`, [n * pct / 10, n - n * pct / 100, n + pct]);
    },
    () => {
      const x = rand(1, 10) * 20, pct = rand(1, 19) * 5, v = x * pct / 100;
      return numQ(`${pct}% của một số là ${v}. Số đó là bao nhiêu?`, x, `Số đó = ${v} : ${pct} × 100 = ${x}.`, [v * pct, x / 2, x + pct, v + pct]);
    },
    () => {
      const d = pick([2, 4, 5, 10, 20, 25, 50]), a = rand(1, d - 1);
      return pctQ(`Viết phân số ${a}/${d} thành tỉ số phần trăm.`, a * 100 / d, `${a}/${d} = ${a * 100 / d}/100 = ${a * 100 / d}%.`, [a * 10, a * 100 / d + 5, 100 - a * 100 / d, a]);
    },
    () => {
      const p = rand(1, 99);
      return decQ(`Viết ${p}% dưới dạng số thập phân:`, p, 2, `${p}% = ${p}/100 = ${dec(p, 2)}.`, [p * 10, Math.floor(p / 10) || 1, p + 1]);
    },
    () => {
      const n = rand(2, 10) * 20, pct = rand(1, 15) * 5;
      return numQ(`Lớp có ${n} học sinh, trong đó ${pct}% là học sinh giỏi. Lớp có bao nhiêu học sinh giỏi?`, n * pct / 100, `${n} × ${pct} : 100 = ${n * pct / 100} học sinh.`, [n - n * pct / 100, n / pct, pct]);
    },
  ])(),

  tongHop: (): Gen => pick<() => Gen>([
    () => {
      const price = rand(5, 40) * 1000, w = rand(2, 9) * 10 + 5;
      return numQ(`Giá 1 ki-lô-gam gạo là ${fmt(price)} đồng. Mua ${dec(w, 1)} kg gạo phải trả bao nhiêu đồng?`, price * w / 10, `${fmt(price)} × ${dec(w, 1)} = ${fmt(price * w / 10)} đồng.`, [price * w, price * w / 100, price * (w + 5) / 10]);
    },
    () => {
      const m = rand(12, 40), n = rand(5, 20);
      return decQ(`May một bộ quần áo cần ${dec(m, 1)} m vải. May ${n} bộ như vậy cần bao nhiêu mét vải?`, m * n, 1, `${dec(m, 1)} × ${n} = ${dec(m * n, 1)} m.`, [m * n * 10, m * n + 10, m + n]);
    },
    () => {
      const L = mkD(1, 20) + 100, W = mkD(1, 9);
      return decQ(`Hình chữ nhật dài ${dec(L, 1)} m, rộng ${dec(W, 1)} m. Chu vi hình chữ nhật là bao nhiêu mét?`, (L + W) * 2, 1, `Chu vi = (dài + rộng) × 2 = (${dec(L, 1)} + ${dec(W, 1)}) × 2 = ${dec((L + W) * 2, 1)} m.`, [L + W, (L + W) * 2 + 10, (L + W) * 4]);
    },
    () => {
      const X = rand(20, 90), Y = rand(11, 60);
      return decQ(`Hình chữ nhật dài ${dec(X, 1)} m, rộng ${dec(Y, 1)} m. Diện tích hình chữ nhật là bao nhiêu mét vuông?`, X * Y, 2, `Diện tích = dài × rộng = ${dec(X, 1)} × ${dec(Y, 1)} = ${dec(X * Y, 2)} m².`, [X * Y * 10, Math.floor(X * Y / 10), (X + Y) * 2]);
    },
    () => {
      const n = rand(2, 10) * 20, pct = rand(2, 14) * 5;
      return numQ(`Một bể chứa ${n} lít nước, đã dùng ${pct}% số nước. Hỏi bể còn lại bao nhiêu lít nước?`, n - n * pct / 100, `Đã dùng ${n} × ${pct} : 100 = ${n * pct / 100} lít. Còn lại ${n} − ${n * pct / 100} = ${n - n * pct / 100} lít.`, [n * pct / 100, n + n * pct / 100, n - pct]);
    },
    () => {
      const m = rand(30, 80), o1 = rand(-6, 6), o2 = rand(-6, 6), v = [m + o1, m + o2, m - o1 - o2];
      return decQ(`Ba bạn cân nặng ${v.map((x) => dec(x, 1)).join(' kg; ')} kg. Trung bình mỗi bạn nặng bao nhiêu ki-lô-gam?`, m, 1, `Tổng ${v.map((x) => dec(x, 1)).join(' + ')} = ${dec(m * 3, 1)}; chia 3 được ${dec(m, 1)} kg.`, [m + 3, m - 3, m * 3]);
    },
  ])(),
};

export const LESSONS_HK1: Lesson[] = [
  {
    id: 'hk1-on-tap-phan-so', semester: 1, label: 'Ôn tập phân số, hỗn số', emoji: '🍕', color: 'bg-purple-100 border-purple-400 text-purple-800',
    description: 'Cộng trừ nhân chia phân số, hỗn số, phân số thập phân',
    rule: '**Cộng, trừ**: cùng mẫu số thì cộng (trừ) tử số, giữ nguyên mẫu số; khác mẫu số thì quy đồng rồi tính.\n**Nhân**: $\\dfrac{a}{b}\\times\\dfrac{c}{d}=\\dfrac{a\\times c}{b\\times d}$. **Chia**: $\\dfrac{a}{b}:\\dfrac{c}{d}=\\dfrac{a}{b}\\times\\dfrac{d}{c}$.\n**Hỗn số** $w\\,\\dfrac{a}{b}=\\dfrac{w\\times b+a}{b}$. Muốn viết phân số lớn hơn $1$ thành hỗn số: lấy tử chia mẫu, thương là phần nguyên, số dư là tử số của phần phân số.\n**Phân số thập phân** là phân số có mẫu số $10; 100; 1000;\\dots$ và viết được thành số thập phân: $\\dfrac{35}{100}=0{,}35$.',
    examples: [
      { q: '$\\dfrac{1}{2}+\\dfrac{1}{3}=?$', a: 'Mẫu số chung $6$: $\\dfrac{3}{6}+\\dfrac{2}{6}=\\dfrac{5}{6}$.' },
      { q: 'Viết $2\\,\\dfrac{3}{4}$ thành phân số.', a: '$\\dfrac{2\\times 4+3}{4}=\\dfrac{11}{4}$.' },
      { q: 'Viết $\\dfrac{7}{10}$ thành số thập phân.', a: '$0{,}7$.' },
    ],
    gen: gen.onTapPhanSo,
  },
  {
    id: 'hk1-so-thap-phan', semester: 1, label: 'Khái niệm số thập phân', emoji: '🔟', color: 'bg-sky-100 border-sky-400 text-sky-800',
    description: 'Phần nguyên, phần thập phân, hàng, giá trị chữ số',
    rule: 'Số thập phân gồm **phần nguyên** (bên trái dấu phẩy) và **phần thập phân** (bên phải dấu phẩy). Ví dụ $12{,}345$: phần nguyên $12$, phần thập phân $345$.\nCác hàng của phần thập phân: **phần mười**, **phần trăm**, **phần nghìn**… mỗi hàng bằng $\\dfrac{1}{10}$ hàng liền trước.\nViết thêm (hoặc bỏ) chữ số $0$ ở tận cùng bên phải phần thập phân thì giá trị số không đổi: $4{,}5=4{,}50=4{,}500$.',
    examples: [
      { q: 'Trong số $54{,}376$, chữ số $7$ ở hàng nào, giá trị bao nhiêu?', a: 'Hàng phần trăm, giá trị $0{,}07$.' },
      { q: 'Viết $3\\,\\dfrac{7}{100}$ thành số thập phân.', a: '$3{,}07$.' },
      { q: '$0{,}35 = \\dfrac{?}{100}$', a: '$\\dfrac{35}{100}$.' },
    ],
    gen: gen.soThapPhan,
  },
  {
    id: 'hk1-so-sanh-lam-tron-stp', semester: 1, label: 'So sánh, làm tròn số thập phân', emoji: '⚖️', color: 'bg-indigo-100 border-indigo-400 text-indigo-800',
    description: 'So sánh, sắp xếp, làm tròn số thập phân',
    rule: '**So sánh**: so sánh phần nguyên trước; nếu bằng nhau thì so sánh phần mười, rồi phần trăm, phần nghìn… (có thể thêm chữ số $0$ để các số có cùng số chữ số thập phân).\n**Làm tròn** đến một hàng: nhìn chữ số ngay bên phải hàng đó; từ $5$ trở lên thì làm tròn lên, bé hơn $5$ thì làm tròn xuống.',
    examples: [
      { q: 'So sánh $5{,}38$ và $5{,}4$.', a: '$5{,}4=5{,}40$; $38<40$ nên $5{,}38<5{,}4$.' },
      { q: 'Làm tròn $12{,}478$ đến hàng phần trăm.', a: 'Chữ số hàng phần nghìn là $8\\ge 5$ nên làm tròn lên: $12{,}48$.' },
    ],
    gen: gen.soSanhLamTron,
  },
  {
    id: 'hk1-cong-tru-stp', semester: 1, label: 'Cộng, trừ số thập phân', emoji: '➕', color: 'bg-green-100 border-green-400 text-green-800',
    description: 'Cộng, trừ số thập phân, tìm x, tính nhanh',
    rule: 'Viết các số hạng sao cho **các dấu phẩy thẳng cột**, rồi cộng (trừ) như số tự nhiên, cuối cùng đặt dấu phẩy thẳng cột với các dấu phẩy ở trên. Có thể thêm chữ số $0$ để các số có cùng số chữ số thập phân.\nTìm $x$: số hạng $=$ tổng $-$ số hạng kia; số bị trừ $=$ hiệu $+$ số trừ.\nTính chất giao hoán, kết hợp vẫn đúng với số thập phân: ghép các số có tổng tròn để tính nhanh.',
    examples: [
      { q: '$12{,}5+3{,}75=?$', a: '$12{,}50+3{,}75=16{,}25$.' },
      { q: 'Tìm $x$: $x+2{,}4=7$.', a: '$x=7-2{,}4=4{,}6$.' },
      { q: 'Tính nhanh $4{,}6+3{,}7+5{,}4$.', a: '$(4{,}6+5{,}4)+3{,}7=10+3{,}7=13{,}7$.' },
    ],
    gen: gen.congTru,
  },
  {
    id: 'hk1-nhan-stp', semester: 1, label: 'Nhân số thập phân', emoji: '✖️', color: 'bg-red-100 border-red-400 text-red-800',
    description: 'Nhân với số tự nhiên, số thập phân, 10; 100; 0,1; 0,01',
    rule: '**Nhân với số tự nhiên**: nhân như số tự nhiên, rồi đặt dấu phẩy ở tích sao cho phần thập phân có bằng số chữ số của thừa số thập phân.\n**Nhân hai số thập phân**: nhân như số tự nhiên, rồi đếm **tổng số chữ số ở phần thập phân của cả hai thừa số**, tách ra ở tích bấy nhiêu chữ số.\n**Nhân với $10; 100; 1000$**: chuyển dấu phẩy sang **phải** $1; 2; 3$ chữ số. **Nhân với $0{,}1; 0{,}01$**: chuyển dấu phẩy sang **trái** $1; 2$ chữ số.',
    examples: [
      { q: '$2{,}5\\times 4=?$', a: '$25\\times 4=100$; có $1$ chữ số thập phân nên $=10{,}0=10$.' },
      { q: '$1{,}2\\times 0{,}3=?$', a: '$12\\times 3=36$; hai thừa số có $2$ chữ số thập phân nên $=0{,}36$.' },
      { q: '$3{,}47\\times 100=?$', a: '$347$.' },
    ],
    gen: gen.nhan,
  },
  {
    id: 'hk1-chia-stp', semester: 1, label: 'Chia số thập phân', emoji: '➗', color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    description: 'Chia cho số tự nhiên, cho số thập phân, cho 10; 100; 1000',
    rule: '**Chia số thập phân cho số tự nhiên**: chia như số tự nhiên; khi hết phần nguyên thì đặt dấu phẩy ở thương rồi chia tiếp.\n**Chia số tự nhiên cho số tự nhiên mà thương là số thập phân**: sau khi hết phần nguyên, thêm dấu phẩy ở thương và viết thêm chữ số $0$ vào bên phải số dư rồi chia tiếp.\n**Chia cho số thập phân**: nhân cả số bị chia và số chia với $10; 100;\\dots$ để số chia thành số tự nhiên, rồi chia.\n**Chia cho $10; 100; 1000$**: chuyển dấu phẩy sang **trái** $1; 2; 3$ chữ số.',
    examples: [
      { q: '$7:2=?$', a: '$7:2=3$ dư $1$; viết thêm $0$: $10:2=5$. Vậy $7:2=3{,}5$.' },
      { q: '$4{,}5:0{,}9=?$', a: '$45:9=5$.' },
      { q: '$235{,}6:100=?$', a: '$2{,}356$.' },
    ],
    gen: gen.chia,
  },
  {
    id: 'hk1-don-vi-do', semester: 1, label: 'Đổi đơn vị bằng số thập phân', emoji: '📏', color: 'bg-orange-100 border-orange-400 text-orange-800',
    description: 'Viết số đo độ dài, khối lượng dưới dạng số thập phân',
    rule: 'Hai đơn vị hơn kém nhau $10$ lần thì dùng $1$ chữ số thập phân; $100$ lần dùng $2$ chữ số; $1\\,000$ lần dùng $3$ chữ số.\nĐổi từ đơn vị **lớn sang bé**: chuyển dấu phẩy sang phải (nhân). Đổi từ đơn vị **bé sang lớn**: chuyển dấu phẩy sang trái (chia).\nVí dụ: $1\\,m=100\\,cm$, $1\\,km=1\\,000\\,m$, $1\\,kg=1\\,000\\,g$, $1$ tấn $=1\\,000\\,kg$.',
    examples: [
      { q: '$3\\,m\\ 45\\,cm=\\dots m$', a: '$3{,}45\\,m$.' },
      { q: '$2\\,500\\,g=\\dots kg$', a: '$2{,}5\\,kg$.' },
      { q: '$4{,}5\\,m=\\dots cm$', a: '$450\\,cm$.' },
    ],
    gen: gen.donVi,
  },
  {
    id: 'hk1-dien-tich-ha', semester: 1, label: 'Héc-ta, ki-lô-mét vuông', emoji: '🌾', color: 'bg-lime-100 border-lime-400 text-lime-800',
    description: 'Đổi ha, km², m² và diện tích thửa ruộng',
    rule: '$1\\,ha=10\\,000\\,m^2$ (héc-ta là diện tích hình vuông cạnh $100$ m). $1\\,km^2=100\\,ha=1\\,000\\,000\\,m^2$.\nĐổi sang đơn vị nhỏ hơn thì nhân; đổi sang đơn vị lớn hơn thì chia. Muốn tính diện tích theo ha, tính diện tích theo $m^2$ rồi chia cho $10\\,000$.',
    examples: [
      { q: '$3\\,ha=\\dots m^2$', a: '$30\\,000\\,m^2$.' },
      { q: '$50\\,000\\,m^2=\\dots ha$', a: '$5\\,ha$.' },
      { q: '$2\\,km^2=\\dots ha$', a: '$200\\,ha$.' },
    ],
    gen: gen.dienTichHa,
  },
  {
    id: 'hk1-hinh-tam-giac', semester: 1, label: 'Diện tích hình tam giác', emoji: '🔺', color: 'bg-rose-100 border-rose-400 text-rose-800',
    description: 'Đáy, chiều cao, diện tích tam giác',
    rule: '**Chiều cao** của tam giác là đoạn thẳng hạ từ một đỉnh **vuông góc** với đáy đối diện.\n**Diện tích tam giác** $S=\\dfrac{a\\times h}{2}$ ($a$: độ dài đáy, $h$: chiều cao tương ứng, cùng đơn vị).\nTìm ngược: $h=\\dfrac{2\\times S}{a}$; $a=\\dfrac{2\\times S}{h}$. Tam giác vuông: hai cạnh góc vuông là đáy và chiều cao.',
    examples: [
      { q: 'Tam giác đáy $10$ cm, cao $6$ cm. Diện tích?', a: '$10\\times 6:2=30\\,cm^2$.' },
      { q: 'Tam giác diện tích $24\\,dm^2$, đáy $8$ dm. Chiều cao?', a: '$24\\times 2:8=6$ dm.' },
    ],
    gen: gen.tamGiac,
  },
  {
    id: 'hk1-hinh-thang', semester: 1, label: 'Diện tích hình thang', emoji: '⏢', color: 'bg-teal-100 border-teal-400 text-teal-800',
    description: 'Hai đáy, chiều cao, diện tích hình thang',
    rule: 'Hình thang có **một cặp cạnh đối diện song song** (hai đáy). Chiều cao là khoảng cách giữa hai đáy.\n**Diện tích hình thang** $S=\\dfrac{(a+b)\\times h}{2}$ ($a$, $b$: hai đáy).\nTìm ngược: tổng hai đáy $=\\dfrac{2\\times S}{h}$; $h=\\dfrac{2\\times S}{a+b}$.',
    examples: [
      { q: 'Hình thang đáy lớn $12$ cm, đáy bé $8$ cm, cao $5$ cm. Diện tích?', a: '$(12+8)\\times 5:2=50\\,cm^2$.' },
      { q: 'Diện tích $60\\,m^2$, tổng hai đáy $20$ m. Chiều cao?', a: '$60\\times 2:20=6$ m.' },
    ],
    gen: gen.hinhThang,
  },
  {
    id: 'hk1-ti-so-phan-tram', semester: 1, label: 'Tỉ số phần trăm', emoji: '💯', color: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800',
    description: 'Tỉ số %, tìm % của một số, tìm số khi biết %',
    rule: '**Tỉ số phần trăm** của $a$ và $b$: lấy $a:b$ rồi nhân $100$ và viết thêm $\\%$. Ví dụ $15:60=0{,}25=25\\%$.\n**Tìm $p\\%$ của một số**: lấy số đó chia $100$ rồi nhân $p$.\n**Tìm một số khi biết $p\\%$ của nó là $v$**: lấy $v$ chia $p$ rồi nhân $100$.\n$p\\%=\\dfrac{p}{100}$, ví dụ $45\\%=0{,}45$.',
    examples: [
      { q: 'Tìm tỉ số phần trăm của $15$ và $60$.', a: '$15:60=0{,}25=25\\%$.' },
      { q: 'Tìm $20\\%$ của $150$.', a: '$150:100\\times 20=30$.' },
      { q: '$30\\%$ của một số là $60$. Số đó là bao nhiêu?', a: '$60:30\\times 100=200$.' },
    ],
    gen: gen.phanTram,
  },
  {
    id: 'hk1-bai-toan-tong-hop', semester: 1, label: 'Toán có lời văn số thập phân', emoji: '📖', color: 'bg-emerald-100 border-emerald-400 text-emerald-800',
    description: 'Bài toán thực tế với số thập phân và phần trăm',
    rule: 'Các bước giải toán có lời văn: **(1) đọc kĩ đề**, tìm cái đã cho và cái cần tìm; **(2) lập kế hoạch** giải; **(3) tính từng bước**, ghi đúng đơn vị; **(4) kiểm tra** kết quả có hợp lí không.\nVới số thập phân: nhớ **đặt dấu phẩy đúng chỗ** và đổi các số đo về **cùng một đơn vị** trước khi tính.\nChu vi hình chữ nhật $=(\\text{dài}+\\text{rộng})\\times 2$; diện tích $=\\text{dài}\\times\\text{rộng}$.',
    examples: [
      { q: 'Mỗi bao gạo nặng $12{,}5$ kg. $4$ bao nặng bao nhiêu?', a: '$12{,}5\\times 4=50$ kg.' },
      { q: 'Bể có $200$ lít, đã dùng $35\\%$. Còn bao nhiêu lít?', a: 'Đã dùng $70$ lít; còn $200-70=130$ lít.' },
    ],
    gen: gen.tongHop,
  },
];
