// Tư duy nhiều bước: word problems that need careful reading and 2–3 steps, one set per lesson.
// Each one names its dạng ("Tư duy: …"), explains every step, and offers the typical wrong
// answers (the slip a kid makes when skipping a step or misreading "ít hơn", "còn lại", "không").
import type { Question } from './questions';
import { fmt, dec, numQ, strQ, fracQ, decQ, rand, pick, shuffle, gcd, lcm, longFirst } from './qutil';

type Tpl = [kind: string, gen: () => Question];

/** "**Bước 1:** … \n**Bước 2:** …" */
const B = (...steps: string[]) => steps.map((s, i) => `**Bước ${i + 1}:** ${s}`).join('\n');
/** A duration: 45 → "45 phút", 75 → "1 giờ 15 phút", 120 → "2 giờ". */
const dur = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? `${m} phút` : m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
};
/** A clock time in minutes after midnight: 455 → "7 giờ 35 phút". */
const hm = (min: number) => (min % 60 === 0 ? `${min / 60} giờ` : `${Math.floor(min / 60)} giờ ${min % 60} phút`);
/** Distinct wrong clock times, never equal to the answer. */
const wrongTimes = (ans: number, cands: number[]) => [...new Set(cands.filter((t) => t !== ans && t > 0))].map(hm);
const isInt = (x: number) => Number.isInteger(x);
/** A numerator in 1…den−1 that makes num/den already in lowest terms. */
const coprime = (den: number) => pick(Array.from({ length: den - 1 }, (_, i) => i + 1).filter((n) => gcd(n, den) === 1));

export const TU_DUY: Record<string, Tpl[]> = {
  'hk1-on-tap-phan-so': [
    ['Tư duy: phân số của phần còn lại', () => {
      const b = pick([3, 4, 5]), a = coprime(b), d = pick([2, 3, 4]), c = coprime(d), k = rand(2, 6);
      const N = b * d * k, day1 = (N * a) / b, left1 = N - day1, day2 = (left1 * c) / d, left = left1 - day2;
      return numQ(
        `Một cửa hàng có ${N} kg gạo. Ngày đầu bán ${a}/${b} số gạo, ngày thứ hai bán ${c}/${d} số gạo còn lại. Hỏi cửa hàng còn lại bao nhiêu ki-lô-gam gạo?`,
        left,
        B(`Ngày đầu bán: ${N} × ${a}/${b} = ${day1} kg, còn ${N} − ${day1} = ${left1} kg.`,
          `Ngày thứ hai bán ${c}/${d} của số gạo CÒN LẠI: ${left1} × ${c}/${d} = ${day2} kg.`,
          `Còn lại: ${left1} − ${day2} = ${left} kg.`),
        [N - day1 - (N * c) / d, left1, day2],
      );
    }],
    ['Tư duy: hai ngày đọc sách – còn bao nhiêu trang', () => {
      let b = 0, d = 0, a = 0, c = 0;
      do { b = rand(3, 6); d = rand(3, 6); a = coprime(b); c = coprime(d); } while (b === d || a * d + c * b >= b * d);
      const N = lcm(b, d) * rand(2, 6), r1 = (N * a) / b, r2 = (N * c) / d, left = N - r1 - r2;
      return numQ(
        `Bạn An đọc một quyển truyện dày ${N} trang. Ngày thứ nhất An đọc ${a}/${b} quyển truyện, ngày thứ hai đọc ${c}/${d} quyển truyện. Hỏi An còn bao nhiêu trang chưa đọc?`,
        left,
        B(`Ngày thứ nhất đọc: ${N} × ${a}/${b} = ${r1} trang.`, `Ngày thứ hai đọc: ${N} × ${c}/${d} = ${r2} trang.`, `Chưa đọc: ${N} − ${r1} − ${r2} = ${left} trang.`),
        [r1 + r2, N - r1, N - r2],
      );
    }],
  ],

  'hk1-so-thap-phan': [
    ['Tư duy: lập số thập phân từ điều kiện', () => {
      const [label, ip] = pick<[string, number]>([['số lớn nhất có một chữ số', 9], ['số bé nhất có hai chữ số', 10], ['số chẵn lớn nhất có một chữ số', 8], ['số lẻ bé nhất có hai chữ số', 11]]);
      const t = rand(1, 3), h = 2 * t, th = t + h, ans = `${ip},${t}${h}${th}`;
      return strQ(
        `Tìm số thập phân có: phần nguyên là ${label}; chữ số hàng phần mười là ${t}; chữ số hàng phần trăm gấp đôi chữ số hàng phần mười; chữ số hàng phần nghìn bằng tổng hai chữ số hàng phần mười và hàng phần trăm.`,
        ans,
        [`${ip},${h}${t}${th}`, `${ip},${t}${th}${h}`, `${ip === 9 ? 10 : ip === 10 ? 9 : ip === 8 ? 9 : 10},${t}${h}${th}`, `${ip},${t}${h}${h + 1}`],
        B(`Phần nguyên: ${label} là ${ip}.`, `Phần mười: ${t}; phần trăm: ${t} × 2 = ${h}; phần nghìn: ${t} + ${h} = ${th}.`, `Ghép lại: ${ans}.`),
      );
    }],
    ['Tư duy: số thập phân lớn nhất, bé nhất từ các chữ số', () => {
      const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), big = Math.random() < 0.5;
      const s = [...ds].sort((x, y) => (big ? y - x : x - y)), ans = `${s[0]},${s[1]}${s[2]}`;
      return strQ(
        `Dùng cả ba chữ số ${ds.join('; ')} (mỗi chữ số dùng đúng một lần), hãy viết số thập phân ${big ? 'LỚN' : 'BÉ'} nhất có phần nguyên gồm một chữ số.`,
        ans,
        [`${s[0]},${s[2]}${s[1]}`, `${s[1]},${s[0]}${s[2]}`, `${s[2]},${s[1]}${s[0]}`, `${s[1]},${s[2]}${s[0]}`],
        B(`Phần nguyên chỉ có một chữ số, muốn số ${big ? 'lớn' : 'bé'} nhất thì phần nguyên là chữ số ${big ? 'lớn' : 'bé'} nhất: ${s[0]}.`,
          `Hai chữ số còn lại xếp ${big ? 'giảm dần' : 'tăng dần'} ở phần thập phân: ${s[1]}${s[2]}.`, `Số cần tìm: ${ans}.`),
      );
    }],
  ],

  'hk1-so-sanh-lam-tron-stp': [
    ['Tư duy: đếm số thập phân nằm giữa hai số', () => {
      const A = rand(1, 20), t = rand(0, 7), g = pick([1, 2]), count = 10 * g - 1;
      return numQ(
        `Có bao nhiêu số thập phân có đúng hai chữ số ở phần thập phân, lớn hơn ${A},${t} và bé hơn ${A},${t + g}?`,
        count,
        B(`Viết thêm chữ số 0 cho cùng hai chữ số thập phân: ${A},${t} = ${A},${t}0 và ${A},${t + g} = ${A},${t + g}0.`,
          `Các số cần tìm: ${A},${t}1; ${A},${t}2; …; ${A},${t + g - 1}9.`,
          `Phần thập phân chạy từ ${t * 10 + 1} đến ${(t + g) * 10 - 1}: có ${(t + g) * 10 - 1} − ${t * 10 + 1} + 1 = ${count} số.`),
        [count + 1, count - 1, g, 10 * g + 1],
      );
    }],
    ['Tư duy: tìm chữ số khi biết kết quả làm tròn', () => {
      const A = rand(1, 30), d = rand(0, 9), x = d >= 5 ? rand(0, 8) : rand(0, 9), t = d >= 5 ? x + 1 : x;
      return strQ(
        `Số ${A},□${d} khi làm tròn đến hàng phần mười thì được ${A},${t}. Chữ số trong ô vuông là:`,
        String(x),
        [...new Set([t, x + 1, x - 1, x + 2, x - 2, x + 3, x - 3])].filter((v) => v >= 0 && v <= 9 && v !== x).slice(0, 3).map(String),
        B(`Làm tròn đến hàng phần mười thì xét chữ số hàng phần trăm: ${d} ${d >= 5 ? '≥ 5 nên làm tròn LÊN (chữ số hàng phần mười tăng thêm 1)' : '< 5 nên GIỮ NGUYÊN chữ số hàng phần mười'}.`,
          d >= 5 ? `Kết quả có hàng phần mười là ${t} nên chữ số ban đầu là ${t} − 1 = ${x}.` : `Kết quả có hàng phần mười là ${t} nên chữ số ban đầu cũng là ${x}.`,
          `Thử lại: ${A},${x}${d} làm tròn được ${A},${t}.`),
      );
    }],
  ],

  'hk1-cong-tru-stp': [
    ['Tư duy: ba thùng – tìm thùng thứ ba', () => {
      const a = rand(100, 300), dd = rand(11, 80), t2 = a + dd, t3 = rand(80, 300), S = a + t2 + t3;
      return decQ(
        `Ba thùng có tổng cộng ${dec(S, 1)} lít dầu. Thùng thứ nhất có ${dec(a, 1)} lít, thùng thứ hai nhiều hơn thùng thứ nhất ${dec(dd, 1)} lít. Hỏi thùng thứ ba có bao nhiêu lít dầu?`,
        t3, 1,
        B(`Thùng thứ hai: ${dec(a, 1)} + ${dec(dd, 1)} = ${dec(t2, 1)} lít.`, `Hai thùng đầu có: ${dec(a, 1)} + ${dec(t2, 1)} = ${dec(a + t2, 1)} lít.`, `Thùng thứ ba: ${dec(S, 1)} − ${dec(a + t2, 1)} = ${dec(t3, 1)} lít.`),
        [S - a - dd, S - 2 * a, t3 + dd],
      );
    }],
    ['Tư duy: "ít hơn" – còn phải làm bao nhiêu', () => {
      const S = rand(200, 400), d1 = rand(40, 90), dd = rand(5, 30), d2 = d1 - dd, left = S - d1 - d2;
      return decQ(
        `Một đội công nhân phải sửa ${dec(S, 1)} km đường. Ngày thứ nhất sửa được ${dec(d1, 1)} km, ngày thứ hai sửa được ÍT HƠN ngày thứ nhất ${dec(dd, 1)} km. Hỏi đội còn phải sửa bao nhiêu ki-lô-mét đường nữa?`,
        left, 1,
        B(`Ngày thứ hai sửa: ${dec(d1, 1)} − ${dec(dd, 1)} = ${dec(d2, 1)} km.`, `Hai ngày sửa được: ${dec(d1, 1)} + ${dec(d2, 1)} = ${dec(d1 + d2, 1)} km.`, `Còn phải sửa: ${dec(S, 1)} − ${dec(d1 + d2, 1)} = ${dec(left, 1)} km.`),
        [S - d1 - (d1 + dd), S - d1 - dd, S - d1],
      );
    }],
  ],

  'hk1-nhan-stp': [
    ['Tư duy: mua hàng và tiền trả lại', () => {
      let a10 = 0, b10 = 0, x = 0, y = 0, ca = 0, cb = 0, paid = 0;
      do {
        a10 = pick([5, 12, 15, 25, 35]); b10 = pick([5, 15, 25]); x = 1000 * rand(15, 60); y = 1000 * rand(40, 90);
        ca = (a10 * x) / 10; cb = (b10 * y) / 10; paid = pick([200000, 500000]);
      } while (ca + cb >= paid);
      const total = ca + cb;
      return numQ(
        `Mẹ mua ${dec(a10, 1)} kg táo, giá ${fmt(x)} đồng một ki-lô-gam, và ${dec(b10, 1)} kg nho, giá ${fmt(y)} đồng một ki-lô-gam. Mẹ đưa cô bán hàng ${fmt(paid)} đồng. Cô bán hàng phải trả lại mẹ bao nhiêu tiền?`,
        paid - total,
        B(`Tiền táo: ${fmt(x)} × ${dec(a10, 1)} = ${fmt(ca)} đồng.`, `Tiền nho: ${fmt(y)} × ${dec(b10, 1)} = ${fmt(cb)} đồng.`, `Trả lại: ${fmt(paid)} − (${fmt(ca)} + ${fmt(cb)}) = ${fmt(paid - total)} đồng.`),
        [total, paid - ca, paid - cb],
      );
    }],
    ['Tư duy: chiều dài gấp mấy lần chiều rộng', () => {
      const W = rand(12, 65), k = rand(2, 4), L = k * W, S = L * W;
      return decQ(
        `Một mảnh vườn hình chữ nhật có chiều rộng ${dec(W, 1)} m, chiều dài gấp ${k} lần chiều rộng. Diện tích mảnh vườn là bao nhiêu mét vuông?`,
        S, 2,
        B(`Chiều dài: ${dec(W, 1)} × ${k} = ${dec(L, 1)} m.`, `Diện tích: ${dec(L, 1)} × ${dec(W, 1)} = ${dec(S, 2)} m².`),
        [(L + W) * 2 * 10, L * 10, W * W],
      );
    }],
  ],

  'hk1-chia-stp': [
    ['Tư duy: cần ít nhất bao nhiêu chai (phép chia có dư)', () => {
      const c = pick([50, 75, 125, 150]), n = rand(6, 20), r = 25 * rand(1, c / 25 - 1), A = c * n + r;
      return numQ(
        `Có ${dec(A, 2)} lít nước mắm, rót vào các chai, mỗi chai chứa ${dec(c, 2)} lít. Hỏi cần ít nhất bao nhiêu chai để chứa hết số nước mắm đó?`,
        n + 1,
        B(`${dec(A, 2)} : ${dec(c, 2)} = ${n} (dư ${dec(r, 2)} lít).`, `Rót đầy ${n} chai vẫn còn thừa ${dec(r, 2)} lít, nên cần thêm 1 chai nữa.`, `Cần ít nhất: ${n} + 1 = ${n + 1} chai.`),
        [n, n + 2, n - 1],
      );
    }],
    ['Tư duy: rút về đơn vị với số thập phân', () => {
      const x = pick([6, 7, 8, 9, 12]), D = 10 * rand(5, 40), f = (x * D) / 10;
      return decQ(
        `Một ô tô cứ đi 100 km thì tiêu thụ hết ${x} lít xăng. Hỏi ô tô đi quãng đường ${D} km thì tiêu thụ bao nhiêu lít xăng?`,
        f, 1,
        B(`Đi 1 km tiêu thụ: ${x} : 100 = ${dec(x, 2)} lít.`, `Đi ${D} km tiêu thụ: ${dec(x, 2)} × ${D} = ${dec(f, 1)} lít.`),
        [x * D, f * 10, Math.round((D * 10) / x)],
      );
    }],
  ],

  'hk1-don-vi-do': [
    ['Tư duy: cộng hai đơn vị rồi đổi ra tấn', () => {
      const A = rand(2, 15), Bk = 50 * rand(1, 19), total = 100 * A + Bk;
      return decQ(
        `Một xe tải chở ${A} tạ gạo và ${Bk} kg ngô. Hỏi xe chở tất cả bao nhiêu tấn?`,
        total, 3,
        B(`Đổi: ${A} tạ = ${A * 100} kg.`, `Tất cả: ${A * 100} + ${Bk} = ${fmt(total)} kg.`, `Đổi ra tấn: ${fmt(total)} kg = ${dec(total, 3)} tấn (1 tấn = 1 000 kg).`),
        [total * 10, 1000 * A + Bk, A * 10 + Bk],
      );
    }],
    ['Tư duy: đổi đơn vị rồi chia đều', () => {
      const s = 5 * rand(5, 30), n = rand(3, 9), total = s * n, a = Math.floor(total / 100), b = total % 100;
      const len = a === 0 ? `${b} cm` : b === 0 ? `${a} m` : `${a} m ${b} cm`;
      return decQ(
        `Một sợi dây dài ${len} được cắt thành ${n} đoạn bằng nhau. Mỗi đoạn dài bao nhiêu mét?`,
        s, 2,
        B(`Đổi: ${len} = ${total} cm.`, `Mỗi đoạn: ${total} : ${n} = ${s} cm.`, `Đổi ra mét: ${s} cm = ${dec(s, 2)} m.`),
        [s * 10, s * 100, total],
      );
    }],
  ],

  'hk1-dien-tich-ha': [
    ['Tư duy: chiều rộng theo phân số rồi đổi ra héc-ta', () => {
      const b = pick([2, 3, 4, 5]), a = coprime(b), k = rand(1, 3), L = b * 100 * k, W = a * 100 * k, S = L * W, ha = S / 10000;
      return numQ(
        `Một khu đất hình chữ nhật có chiều dài ${fmt(L)} m, chiều rộng bằng ${a}/${b} chiều dài. Diện tích khu đất là bao nhiêu héc-ta?`,
        ha,
        B(`Chiều rộng: ${fmt(L)} × ${a}/${b} = ${fmt(W)} m.`, `Diện tích: ${fmt(L)} × ${fmt(W)} = ${fmt(S)} m².`, `Đổi: ${fmt(S)} m² = ${ha} ha (1 ha = 10 000 m²).`),
        [ha * 10, ha * 100, (L * L) / 10000],
      );
    }],
    ['Tư duy: phần còn lại rồi đổi ra m²', () => {
      const n = pick([2, 3, 4, 5]), k = rand(1, 6), S = n * k, con = (n - 1) * k;
      return numQ(
        `Một trang trại có ${S} ha đất. Người ta dùng 1/${n} diện tích để trồng lúa, phần còn lại trồng cây ăn quả. Diện tích trồng cây ăn quả là bao nhiêu mét vuông?`,
        con * 10000,
        B(`Đất trồng lúa: ${S} : ${n} = ${k} ha.`, `Đất trồng cây ăn quả: ${S} − ${k} = ${con} ha.`, `Đổi: ${con} ha = ${fmt(con * 10000)} m².`),
        [k * 10000, con * 1000, con * 100000],
      );
    }],
  ],

  'hk1-hinh-tam-giac': [
    ['Tư duy: chiều cao theo phân số của đáy', () => {
      let q = 0, p = 0;
      do { q = pick([2, 3, 4, 5]); p = rand(1, q + 1); } while (p === q || gcd(p, q) !== 1);
      const k = 2 * rand(1, 4), a = q * k, h = p * k, S = (a * h) / 2;
      return numQ(
        `Một hình tam giác có độ dài đáy ${a} cm, chiều cao bằng ${p}/${q} độ dài đáy. Diện tích hình tam giác là bao nhiêu xăng-ti-mét vuông?`,
        S,
        B(`Chiều cao: ${a} × ${p}/${q} = ${h} cm.`, `Diện tích: ${a} × ${h} : 2 = ${S} cm².`),
        [a * h, (a * a) / 2, S + a],
      );
    }],
    ['Tư duy: phần còn lại sau khi làm luống hoa tam giác', () => {
      let L = 0, W = 0;
      do { [L, W] = longFirst(rand(6, 30), rand(4, 20)); } while ((L * W) % 2 !== 0);
      return numQ(
        `Một mảnh vườn hình chữ nhật dài ${L} m, rộng ${W} m. Người ta làm một luống hoa hình tam giác có đáy là một cạnh chiều dài của vườn, đỉnh nằm trên cạnh chiều dài đối diện. Diện tích phần vườn còn lại là bao nhiêu mét vuông?`,
        (L * W) / 2,
        B(`Diện tích vườn: ${L} × ${W} = ${L * W} m².`, `Tam giác có đáy ${L} m, chiều cao bằng chiều rộng vườn ${W} m: ${L} × ${W} : 2 = ${(L * W) / 2} m².`,
          `Còn lại: ${L * W} − ${(L * W) / 2} = ${(L * W) / 2} m² (đúng bằng một nửa mảnh vườn).`),
        [L * W, (L * W) / 4, (L + W) * 2],
      );
    }],
    ['Tư duy: tam giác có diện tích bằng hình vuông', () => {
      const c = rand(3, 12), S = c * c, divs = Array.from({ length: 40 }, (_, i) => i + 2).filter((d) => (2 * S) % d === 0 && d !== 2 * S);
      const d = pick(divs), h = (2 * S) / d;
      return numQ(
        `Một hình tam giác có diện tích bằng diện tích hình vuông cạnh ${c} cm. Đáy của tam giác dài ${d} cm. Chiều cao của tam giác là bao nhiêu xăng-ti-mét?`,
        h,
        B(`Diện tích hình vuông: ${c} × ${c} = ${S} cm² — đây cũng là diện tích tam giác.`, `Chiều cao = diện tích × 2 : đáy = ${S} × 2 : ${d} = ${h} cm.`),
        [S / d, h * 2, h / 2].filter(isInt),
      );
    }],
  ],

  'hk1-hinh-thang': [
    ['Tư duy: đáy bé và chiều cao tính từ đáy lớn', () => {
      const [p, q] = pick<[number, number]>([[2, 3], [3, 4], [3, 5], [1, 2]]), k = rand(1, 4);
      const a = 2 * q * k, b = 2 * p * k, h = (p + q) * k, S = ((a + b) * h) / 2;
      return numQ(
        `Một thửa ruộng hình thang có đáy lớn ${a} m, đáy bé bằng ${p}/${q} đáy lớn, chiều cao bằng trung bình cộng của hai đáy. Diện tích thửa ruộng là bao nhiêu mét vuông?`,
        S,
        B(`Đáy bé: ${a} × ${p}/${q} = ${b} m.`, `Chiều cao: (${a} + ${b}) : 2 = ${h} m.`, `Diện tích: (${a} + ${b}) × ${h} : 2 = ${S} m².`),
        [(a + b) * h, a * h, S + h],
      );
    }],
    ['Tư duy: diện tích hình thang – thu hoạch thóc', () => {
      const h = 20, sum = 10 * rand(4, 12), b = rand(10, sum / 2 - 1), a = sum - b, S = (sum * h) / 2, x = pick([50, 60, 64, 70, 75]), kg = (S / 100) * x;
      return decQ(
        `Một thửa ruộng hình thang có đáy lớn ${a} m, đáy bé ${b} m, chiều cao ${h} m. Trung bình cứ 100 m² thu hoạch được ${x} kg thóc. Hỏi cả thửa ruộng thu hoạch được bao nhiêu tạ thóc?`,
        kg, 2,
        B(`Diện tích: (${a} + ${b}) × ${h} : 2 = ${S} m².`, `Số thóc: ${S} : 100 × ${x} = ${fmt(kg)} kg.`, `Đổi: ${fmt(kg)} kg = ${dec(kg, 2)} tạ (1 tạ = 100 kg).`),
        [kg * 100, kg * 10, kg * 2],
      );
    }],
  ],

  'hk1-ti-so-phan-tram': [
    ['Tư duy: nam nhiều hơn nữ bao nhiêu bạn', () => {
      let N = 0, p = 0;
      do { N = pick([20, 25, 30, 32, 35, 40, 45, 50]); p = 5 * rand(4, 9); } while ((N * p) % 100 !== 0);
      const nu = (N * p) / 100, nam = N - nu;
      return numQ(
        `Lớp 5A có ${N} học sinh, trong đó số học sinh nữ chiếm ${p}%. Hỏi số học sinh nam nhiều hơn số học sinh nữ bao nhiêu bạn?`,
        nam - nu,
        B(`Số học sinh nữ: ${N} × ${p} : 100 = ${nu} bạn.`, `Số học sinh nam: ${N} − ${nu} = ${nam} bạn.`, `Nam nhiều hơn nữ: ${nam} − ${nu} = ${nam - nu} bạn.`),
        [nam, nu, 100 - 2 * p],
      );
    }],
    ['Tư duy: biết tiền lãi và phần trăm – tìm giá bán', () => {
      const p = pick([10, 15, 20, 25]), von = 10000 * rand(5, 40), lai = (von * p) / 100, ban = von + lai;
      return numQ(
        `Bán một chiếc quạt, cửa hàng được lãi ${fmt(lai)} đồng, số tiền lãi bằng ${p}% tiền vốn. Hỏi cửa hàng đã bán chiếc quạt với giá bao nhiêu tiền?`,
        ban,
        B(`Tiền vốn: ${fmt(lai)} : ${p} × 100 = ${fmt(von)} đồng.`, `Giá bán = tiền vốn + tiền lãi = ${fmt(von)} + ${fmt(lai)} = ${fmt(ban)} đồng.`),
        [von, von - lai, lai * 2],
      );
    }],
  ],

  'hk1-bai-toan-tong-hop': [
    ['Tư duy: bán theo phân số rồi bán thêm', () => {
      const A = 4 * rand(10, 40), sang = A / 4, rest = (A - sang) * 10, chieu = rand(20, rest - 10), left = rest - chieu;
      return decQ(
        `Một cửa hàng có ${A} kg đường. Buổi sáng bán 1/4 số đường, buổi chiều bán ${dec(chieu, 1)} kg. Hỏi cửa hàng còn lại bao nhiêu ki-lô-gam đường?`,
        left, 1,
        B(`Buổi sáng bán: ${A} : 4 = ${sang} kg.`, `Còn sau buổi sáng: ${A} − ${sang} = ${A - sang} kg.`, `Còn lại: ${A - sang} − ${dec(chieu, 1)} = ${dec(left, 1)} kg.`),
        [A * 10 - chieu, sang * 10, chieu],
      );
    }],
    ['Tư duy: trung bình cộng – tìm số thứ ba', () => {
      let m = 0, a = 0, d = 0, s3 = 0;
      do { m = rand(100, 300); a = rand(50, m); d = rand(5, 60); s3 = 3 * m - a - (a + d); } while (s3 <= 0);
      return decQ(
        `Trung bình cộng của ba số là ${dec(m, 1)}. Số thứ nhất là ${dec(a, 1)}, số thứ hai hơn số thứ nhất ${dec(d, 1)}. Tìm số thứ ba.`,
        s3, 1,
        B(`Tổng ba số: ${dec(m, 1)} × 3 = ${dec(3 * m, 1)}.`, `Số thứ hai: ${dec(a, 1)} + ${dec(d, 1)} = ${dec(a + d, 1)}.`, `Số thứ ba: ${dec(3 * m, 1)} − ${dec(a, 1)} − ${dec(a + d, 1)} = ${dec(s3, 1)}.`),
        [3 * m - a - d, Math.max(1, m * 2 - a), 3 * m - a],
      );
    }],
  ],

  'hk2-hinh-tron': [
    ['Tư duy: bánh xe lăn bao nhiêu vòng', () => {
      const r = pick([5, 15, 25, 35]), C10 = (628 * r) / 10, n = 10 * rand(5, 50);
      return numQ(
        `Một bánh xe có bán kính ${r} cm. Bánh xe lăn trên mặt đất được quãng đường ${dec(n * C10, 3)} m. Hỏi bánh xe đã lăn bao nhiêu vòng? (π = 3,14)`,
        n,
        B(`Chu vi bánh xe: ${r} × 2 × 3,14 = ${dec(C10, 1)} cm.`, `Đổi: ${dec(n * C10, 3)} m = ${dec(n * C10, 1)} cm.`, `Số vòng: ${dec(n * C10, 1)} : ${dec(C10, 1)} = ${n} vòng.`),
        [n * 2, n / 2, n * 10],
      );
    }],
    ['Tư duy: diện tích thành giếng (hình vành khăn)', () => {
      const r = rand(5, 12), w = rand(2, 5), R = r + w, S = 314 * (R * R - r * r);
      return decQ(
        `Miệng một cái giếng là hình tròn bán kính ${r} dm. Người ta xây thành giếng rộng ${w} dm bao quanh miệng giếng. Diện tích thành giếng là bao nhiêu đề-xi-mét vuông? (π = 3,14)`,
        S, 2,
        B(`Bán kính hình tròn lớn (gồm cả thành giếng): ${r} + ${w} = ${R} dm.`,
          `Diện tích hình tròn lớn: ${R} × ${R} × 3,14 = ${dec(314 * R * R, 2)} dm²; miệng giếng: ${r} × ${r} × 3,14 = ${dec(314 * r * r, 2)} dm².`,
          `Thành giếng: ${dec(314 * R * R, 2)} − ${dec(314 * r * r, 2)} = ${dec(S, 2)} dm².`),
        [314 * w * w, 314 * R * R, 628 * R * w],
      );
    }],
  ],

  'hk2-hinh-hop-chu-nhat': [
    ['Tư duy: quét vôi phòng học (trừ cửa)', () => {
      const [a, b] = longFirst(rand(6, 10), rand(4, 8)), h = rand(3, 4), c = rand(6, 12), xq = 2 * (a + b) * h, tran = a * b, S = xq + tran - c;
      return numQ(
        `Một phòng học dạng hình hộp chữ nhật dài ${a} m, rộng ${b} m, cao ${h} m. Người ta quét vôi bốn bức tường xung quanh và trần nhà. Diện tích các cửa là ${c} m². Hỏi diện tích cần quét vôi là bao nhiêu mét vuông?`,
        S,
        B(`Diện tích bốn bức tường: (${a} + ${b}) × 2 × ${h} = ${xq} m².`, `Diện tích trần nhà: ${a} × ${b} = ${tran} m².`, `Cần quét vôi: ${xq} + ${tran} − ${c} = ${S} m² (trừ phần cửa).`),
        [xq + tran, xq - c, xq + 2 * tran - c],
      );
    }],
    ['Tư duy: biết chu vi đáy và hiệu hai cạnh', () => {
      const b = rand(3, 10), d = rand(1, 6), a = b + d, h = rand(2, 9), P = 2 * (a + b), xq = P * h, tp = xq + 2 * a * b;
      return numQ(
        `Một hình hộp chữ nhật có chu vi mặt đáy ${P} cm, chiều dài hơn chiều rộng ${d} cm, chiều cao ${h} cm. Tính diện tích toàn phần của hình hộp chữ nhật (cm²).`,
        tp,
        B(`Nửa chu vi đáy: ${P} : 2 = ${a + b} cm; chiều dài: (${a + b} + ${d}) : 2 = ${a} cm; chiều rộng: ${a} − ${d} = ${b} cm.`,
          `Diện tích xung quanh: ${P} × ${h} = ${xq} cm².`, `Diện tích toàn phần: ${xq} + ${a} × ${b} × 2 = ${tp} cm².`),
        [xq, xq + a * b, tp + 2 * d * h],
      );
    }],
  ],

  'hk2-hinh-lap-phuong': [
    ['Tư duy: ghép hai hình lập phương', () => {
      const a = rand(2, 12), ans = 10 * a * a;
      return numQ(
        `Ghép hai hình lập phương bằng nhau, mỗi hình có cạnh ${a} cm, thành một hình hộp chữ nhật. Diện tích toàn phần của hình hộp chữ nhật đó là bao nhiêu xăng-ti-mét vuông?`,
        ans,
        B(`Hai hình lập phương có tất cả 12 mặt; khi ghép, 2 mặt áp vào nhau bị che mất, còn 10 mặt.`, `Mỗi mặt: ${a} × ${a} = ${a * a} cm².`, `Diện tích toàn phần: ${a * a} × 10 = ${ans} cm².`),
        [12 * a * a, 6 * a * a, 8 * a * a],
      );
    }],
    ['Tư duy: hộp không có nắp', () => {
      const a = rand(3, 15), ans = 5 * a * a;
      return numQ(
        `Người ta làm một cái hộp KHÔNG CÓ NẮP bằng bìa cứng, dạng hình lập phương cạnh ${a} cm. Diện tích bìa cần dùng là bao nhiêu xăng-ti-mét vuông? (không tính mép dán)`,
        ans,
        B(`Hộp không có nắp nên chỉ có 5 mặt: 4 mặt xung quanh và 1 mặt đáy.`, `Mỗi mặt: ${a} × ${a} = ${a * a} cm².`, `Bìa cần dùng: ${a * a} × 5 = ${ans} cm².`),
        [6 * a * a, 4 * a * a, a * a],
      );
    }],
    ['Tư duy: cạnh gấp lên – diện tích hơn bao nhiêu', () => {
      const a = rand(2, 8), k = rand(2, 3), A = 6 * a * a, Bk = 6 * k * a * k * a, diff = Bk - A;
      return numQ(
        `Hình lập phương A có cạnh ${a} cm. Hình lập phương B có cạnh gấp ${k} lần cạnh hình A. Diện tích toàn phần của hình B hơn hình A bao nhiêu xăng-ti-mét vuông?`,
        diff,
        B(`Cạnh hình B: ${a} × ${k} = ${k * a} cm.`, `Diện tích toàn phần: A = ${a} × ${a} × 6 = ${A} cm²; B = ${k * a} × ${k * a} × 6 = ${Bk} cm².`, `Hơn: ${Bk} − ${A} = ${diff} cm².`),
        [Bk, A * (k - 1), A * k],
      );
    }],
  ],

  'hk2-the-tich': [
    ['Tư duy: đổ thêm bao nhiêu nước cho đầy bể', () => {
      const [a, b] = longFirst(rand(10, 20), rand(6, 15)), q = pick([2, 3, 4, 5]), p = coprime(q), c = q * rand(2, 4), hw = (c * p) / q, add = a * b * (c - hw);
      return numQ(
        `Một bể nước dạng hình hộp chữ nhật dài ${a} dm, rộng ${b} dm, cao ${c} dm. Mực nước trong bể đang cao bằng ${p}/${q} chiều cao của bể. Cần đổ thêm bao nhiêu lít nước để bể đầy? (1 dm³ = 1 lít)`,
        add,
        B(`Mực nước đang cao: ${c} × ${p}/${q} = ${hw} dm.`, `Phần còn trống cao: ${c} − ${hw} = ${c - hw} dm.`, `Cần đổ thêm: ${a} × ${b} × ${c - hw} = ${add} dm³ = ${add} lít.`),
        [a * b * c, a * b * hw, a * b * (c - hw + 1)],
      );
    }],
    ['Tư duy: nước dâng lên – thể tích hòn đá', () => {
      const [a, b] = longFirst(rand(20, 60), rand(15, 40)), h10 = rand(5, 40), V = a * b * h10;
      return decQ(
        `Một bể kính dạng hình hộp chữ nhật dài ${a} cm, rộng ${b} cm đang chứa nước. Thả một hòn đá chìm hẳn vào bể thì mực nước dâng lên thêm ${dec(h10, 1)} cm (nước không tràn ra ngoài). Thể tích hòn đá là bao nhiêu xăng-ti-mét khối?`,
        V, 1,
        B(`Phần nước dâng lên có dạng hình hộp chữ nhật dài ${a} cm, rộng ${b} cm, cao ${dec(h10, 1)} cm.`, `Thể tích hòn đá bằng thể tích phần nước dâng lên: ${a} × ${b} × ${dec(h10, 1)} = ${dec(V, 1)} cm³.`),
        [a * b * 10, (a + b) * 2 * h10, V * 10],
      );
    }],
    ['Tư duy: khối gỗ bị cắt bỏ một góc', () => {
      const a = rand(5, 12), b = rand(2, a - 2), V = a ** 3 - b ** 3;
      return numQ(
        `Một khối gỗ hình lập phương cạnh ${a} cm. Người ta cắt bỏ ở một góc một khối hình lập phương nhỏ cạnh ${b} cm. Thể tích phần gỗ còn lại là bao nhiêu xăng-ti-mét khối?`,
        V,
        B(`Thể tích khối gỗ ban đầu: ${a} × ${a} × ${a} = ${a ** 3} cm³.`, `Thể tích phần bị cắt: ${b} × ${b} × ${b} = ${b ** 3} cm³.`, `Còn lại: ${a ** 3} − ${b ** 3} = ${V} cm³.`),
        [(a - b) ** 3, a ** 3, a ** 3 - 6 * b * b],
      );
    }],
  ],

  'hk2-so-do-thoi-gian': [
    ['Tư duy: làm nhiều sản phẩm – xong lúc mấy giờ', () => {
      const per = pick([15, 20, 25, 30, 35, 40, 45, 50, 75, 80, 90]), n = rand(2, 5), start = 60 * rand(7, 9) + pick([0, 15, 30]), total = per * n, end = start + total;
      return strQ(
        `Một người thợ làm xong một sản phẩm hết ${dur(per)}. Người đó bắt đầu làm lúc ${hm(start)} và làm liền ${n} sản phẩm, không nghỉ. Hỏi người đó làm xong lúc mấy giờ?`,
        hm(end),
        wrongTimes(end, [start + per, end + per, end - per, end + 60, start + total - 60]),
        B(`Thời gian làm ${n} sản phẩm: ${dur(per)} × ${n} = ${dur(total)}.`, `Làm xong lúc: ${hm(start)} + ${dur(total)} = ${hm(end)}.`),
      );
    }],
    ['Tư duy: thời gian đi học cả tuần', () => {
      const leave = 6 * 60 + pick([30, 35, 40, 45, 50]), d = pick([15, 20, 25, 30]), arrive = leave + d, total = 2 * d * 5;
      return strQ(
        `Lan đi từ nhà lúc ${hm(leave)} và đến trường lúc ${hm(arrive)}. Đường về nhà Lan cũng đi hết chừng ấy thời gian. Mỗi tuần Lan đi học 5 ngày. Hỏi mỗi tuần Lan đi trên đường (cả đi và về) hết bao nhiêu thời gian?`,
        dur(total),
        [dur(d * 5), dur(d * 2), dur(total + 30), dur(d * 7 * 2)],
        B(`Mỗi lượt đi: ${hm(arrive)} − ${hm(leave)} = ${d} phút.`, `Mỗi ngày (đi và về): ${d} × 2 = ${2 * d} phút.`, `Cả tuần: ${2 * d} × 5 = ${total} phút = ${dur(total)}.`),
      );
    }],
  ],

  'hk2-van-toc': [
    ['Tư duy: trừ thời gian nghỉ rồi tính vận tốc', () => {
      const T = pick([90, 120, 150, 180]), rest = pick([15, 20, 30]), start = 60 * rand(6, 9) + pick([0, 15, 30]), end = start + T + rest, v = 2 * rand(15, 25), D = (v * T) / 60;
      const hours = dec((T * 10) / 60, 1);
      return numQ(
        `Một người đi xe máy từ A lúc ${hm(start)} và đến B lúc ${hm(end)}. Dọc đường người đó nghỉ ${rest} phút. Quãng đường AB dài ${D} km. Tính vận tốc của xe máy (km/giờ).`,
        v,
        B(`Từ lúc đi đến lúc đến: ${hm(end)} − ${hm(start)} = ${dur(T + rest)}.`, `Thời gian thực sự đi: ${dur(T + rest)} − ${rest} phút = ${dur(T)} = ${hours} giờ.`, `Vận tốc: ${D} : ${hours} = ${v} km/giờ.`),
        [Math.round((D * 60) / (T + rest)), D, v + 10],
      );
    }],
    ['Tư duy: ca nô đi xuôi dòng', () => {
      let v = 0, u = 0, t10 = 0, D = 0;
      do { v = rand(15, 30); u = rand(2, 5); t10 = pick([15, 20, 25, 30]); D = ((v + u) * t10) / 10; } while (!isInt(D));
      return decQ(
        `Một ca nô đi xuôi dòng từ bến A đến bến B. Vận tốc của ca nô khi nước lặng là ${v} km/giờ, vận tốc dòng nước là ${u} km/giờ. Quãng sông AB dài ${D} km. Hỏi ca nô đi hết bao nhiêu giờ?`,
        t10, 1,
        B(`Đi xuôi dòng thì dòng nước đẩy thêm: vận tốc xuôi dòng = ${v} + ${u} = ${v + u} km/giờ.`, `Thời gian: ${D} : ${v + u} = ${dec(t10, 1)} giờ.`),
        [Math.round((D * 10) / v), Math.round((D * 10) / (v - u)), t10 + 5],
      );
    }],
  ],

  'hk2-chuyen-dong': [
    ['Tư duy: đi sau rồi đuổi kịp lúc mấy giờ', () => {
      let v1 = 0, gap = 0, dv = 0, d = 0, tMin = 0;
      do { v1 = rand(30, 45); gap = pick([1, 2]); dv = pick([10, 15, 20]); d = v1 * gap; tMin = d * (60 / dv); } while (tMin % 30 !== 0 || tMin > 360);
      const v2 = v1 + dv;
      const start1 = 60 * rand(6, 8), start2 = start1 + 60 * gap, meet = start2 + tMin;
      return strQ(
        `Lúc ${hm(start1)}, một xe máy đi từ A với vận tốc ${v1} km/giờ. Đến ${hm(start2)}, một ô tô cũng đi từ A đuổi theo xe máy với vận tốc ${v2} km/giờ. Hỏi ô tô đuổi kịp xe máy lúc mấy giờ?`,
        hm(meet),
        wrongTimes(meet, [start1 + tMin, meet + 60, start2 + Math.round((d * 60) / v2), meet - 30]),
        B(`Khi ô tô xuất phát, xe máy đã đi được: ${v1} × ${gap} = ${d} km.`, `Mỗi giờ ô tô gần xe máy thêm: ${v2} − ${v1} = ${dv} km; thời gian đuổi kịp: ${d} : ${dv} = ${dec(tMin / 6, 1)} giờ = ${dur(tMin)}.`, `Đuổi kịp lúc: ${hm(start2)} + ${dur(tMin)} = ${hm(meet)}.`),
      );
    }],
    ['Tư duy: ngược chiều, xuất phát khác giờ', () => {
      const v1 = rand(30, 50), v2 = rand(30, 50), t = rand(1, 3), D = v1 + (v1 + v2) * t, start1 = 60 * rand(6, 8), start2 = start1 + 60, meet = start2 + 60 * t;
      return strQ(
        `Quãng đường AB dài ${D} km. Lúc ${hm(start1)}, một xe máy đi từ A về B với vận tốc ${v1} km/giờ. Lúc ${hm(start2)}, một ô tô đi từ B về A với vận tốc ${v2} km/giờ. Hỏi hai xe gặp nhau lúc mấy giờ?`,
        hm(meet),
        wrongTimes(meet, [start1 + 60 * t, start2 + Math.round((D * 60) / (v1 + v2)), meet + 60, meet + 30]),
        B(`Đến ${hm(start2)}, xe máy đã đi ${v1} × 1 = ${v1} km; quãng đường còn lại: ${D} − ${v1} = ${D - v1} km.`,
          `Mỗi giờ hai xe gần nhau: ${v1} + ${v2} = ${v1 + v2} km; thời gian để gặp nhau: ${D - v1} : ${v1 + v2} = ${t} giờ.`,
          `Gặp nhau lúc: ${hm(start2)} + ${t} giờ = ${hm(meet)}.`),
      );
    }],
  ],

  'hk2-phan-tram-ung-dung': [
    ['Tư duy: giảm giá hai lần liên tiếp', () => {
      const P = 100000 * rand(3, 20), a = pick([10, 20]), b = pick([10, 20, 25]), after1 = (P * (100 - a)) / 100, after2 = (after1 * (100 - b)) / 100, wrong = (P * (100 - a - b)) / 100;
      return numQ(
        `Một chiếc xe đạp giá ${fmt(P)} đồng. Lần thứ nhất cửa hàng giảm giá ${a}%, lần thứ hai giảm tiếp ${b}% theo giá mới. Hỏi sau hai lần giảm, giá chiếc xe đạp là bao nhiêu tiền?`,
        after2,
        B(`Sau lần 1: ${fmt(P)} × (100 − ${a}) : 100 = ${fmt(after1)} đồng.`, `Lần 2 giảm ${b}% của giá MỚI: ${fmt(after1)} × (100 − ${b}) : 100 = ${fmt(after2)} đồng.`,
          `Chú ý: giảm ${a}% rồi giảm tiếp ${b}% không phải là giảm ${a + b}% (sai lầm hay gặp: ${fmt(wrong)} đồng).`),
        [wrong, after1, P - after2],
      );
    }],
    ['Tư duy: tiền lãi tiết kiệm hai tháng', () => {
      const P = 1000000 * rand(1, 9), r = pick([1, 2]), l1 = (P * r) / 100, m1 = P + l1, l2 = (m1 * r) / 100, m2 = m1 + l2;
      return numQ(
        `Một người gửi tiết kiệm ${fmt(P)} đồng với lãi suất ${r}% một tháng. Hết tháng thứ nhất, tiền lãi được cộng vào tiền gửi. Hỏi sau 2 tháng người đó có tất cả bao nhiêu tiền?`,
        m2,
        B(`Lãi tháng thứ nhất: ${fmt(P)} × ${r} : 100 = ${fmt(l1)} đồng; tiền gửi sau tháng thứ nhất: ${fmt(m1)} đồng.`, `Lãi tháng thứ hai tính trên ${fmt(m1)}: ${fmt(m1)} × ${r} : 100 = ${fmt(l2)} đồng.`, `Sau 2 tháng: ${fmt(m1)} + ${fmt(l2)} = ${fmt(m2)} đồng.`),
        [P + 2 * l1, m1, m2 - P],
      );
    }],
    ['Tư duy: phần trăm của một phần trăm', () => {
      let N = 0, p = 0, q = 0, fb = 0, girls = 0;
      do { N = pick([40, 50, 60, 80, 100, 120]); p = pick([25, 40, 50, 60, 75]); q = pick([20, 25, 40, 50]); fb = (N * p) / 100; girls = (fb * q) / 100; } while (!isInt(fb) || !isInt(girls));
      return numQ(
        `Khối lớp 5 có ${N} học sinh, trong đó ${p}% số học sinh thích bóng đá. Trong số các bạn thích bóng đá, có ${q}% là học sinh nữ. Hỏi có bao nhiêu học sinh NAM thích bóng đá?`,
        fb - girls,
        B(`Số bạn thích bóng đá: ${N} × ${p} : 100 = ${fb} bạn.`, `Số bạn nữ thích bóng đá: ${fb} × ${q} : 100 = ${girls} bạn.`, `Số bạn nam thích bóng đá: ${fb} − ${girls} = ${fb - girls} bạn.`),
        [girls, fb, (N * (100 - q)) / 100].filter(isInt),
      );
    }],
  ],

  'hk2-ti-le': [
    ['Tư duy: thêm người – gạo đủ ăn bao nhiêu ngày', () => {
      let N = 0, D = 0, d = 0, M = 0;
      do { N = 10 * rand(3, 12); D = rand(15, 40); d = rand(3, D - 5); M = 10 * rand(1, 6); } while ((N * (D - d)) % (N + M) !== 0);
      const ans = (N * (D - d)) / (N + M);
      return numQ(
        `Một bếp ăn dự trữ đủ gạo cho ${N} người ăn trong ${D} ngày. Sau ${d} ngày, có thêm ${M} người đến ăn. Hỏi số gạo còn lại đủ cho tất cả ăn trong bao nhiêu ngày nữa? (mức ăn của mỗi người như nhau)`,
        ans,
        B(`Số gạo còn lại đủ cho ${N} người ăn trong: ${D} − ${d} = ${D - d} ngày.`, `Số người lúc sau: ${N} + ${M} = ${N + M} người.`, `Số người tăng thì số ngày giảm: ${N} × ${D - d} : ${N + M} = ${ans} ngày.`),
        [D - d, Math.round((N * D) / (N + M)), D - d - ans > 0 ? D - d - ans : ans + 3],
      );
    }],
    ['Tư duy: tuổi mẹ – tuổi con (hiệu không đổi)', () => {
      const k = pick([3, 4, 5]), unit = rand(6, 10), b = rand(2, 5), hieu = (k - 1) * unit, now = unit - b;
      return numQ(
        `Hiện nay mẹ hơn con ${hieu} tuổi. Sau ${b} năm nữa, tuổi con bằng 1/${k} tuổi mẹ. Tính tuổi con hiện nay.`,
        now,
        B(`Hiệu số tuổi không đổi theo thời gian: sau ${b} năm mẹ vẫn hơn con ${hieu} tuổi.`, `Sau ${b} năm, coi tuổi con là 1 phần thì tuổi mẹ là ${k} phần; hiệu ${k - 1} phần = ${hieu} tuổi nên tuổi con lúc đó: ${hieu} : ${k - 1} = ${unit} tuổi.`, `Tuổi con hiện nay: ${unit} − ${b} = ${now} tuổi.`),
        [unit, unit + b, k * unit - b],
      );
    }],
  ],

  'hk2-thong-ke-xac-suat': [
    ['Tư duy: bài cuối cần bao nhiêu điểm', () => {
      const m = rand(6, 8), dl = pick([25, 50]), m2x100 = m * 100 + dl, need = m + (4 * dl) / 100;
      return numQ(
        `Trung bình cộng điểm ba bài kiểm tra Toán của An là ${m}. An muốn trung bình cộng điểm của bốn bài là ${dec(m2x100, 2)} thì bài kiểm tra thứ tư phải được bao nhiêu điểm?`,
        need,
        B(`Tổng điểm 3 bài: ${m} × 3 = ${3 * m}.`, `Tổng điểm 4 bài cần có: ${dec(m2x100, 2)} × 4 = ${(4 * m2x100) / 100}.`, `Bài thứ tư: ${(4 * m2x100) / 100} − ${3 * m} = ${need} điểm.`),
        [Math.round(m2x100 / 100), need + 1, 10],
      );
    }],
    ['Tư duy: xác suất "KHÔNG phải"', () => {
      const r = rand(2, 8), x = rand(1, 7), y = rand(1, 7), T = r + x + y;
      return fracQ(
        `Một hộp có ${r} viên bi đỏ, ${x} viên bi xanh và ${y} viên bi vàng. Lấy ngẫu nhiên một viên bi. Phân số chỉ khả năng lấy được viên bi KHÔNG phải màu đỏ là:`,
        x + y, T,
        B(`Tổng số bi: ${r} + ${x} + ${y} = ${T} viên.`, `Số bi không phải màu đỏ: ${x} + ${y} = ${x + y} viên.`, `Khả năng: ${x + y}/${T}.`),
        [[r, T], [x + y, r], [x, T]],
      );
    }],
    ['Tư duy: biểu đồ hình quạt – so sánh hai phần', () => {
      let N = 0, a = 0, b = 0, c = 0;
      do { N = pick([40, 60, 80, 100, 120]); a = pick([25, 30, 35, 40]); b = pick([15, 20, 25]); c = 100 - a - b; } while (c <= b || (N * (c - b)) % 100 !== 0 || (N * b) % 100 !== 0 || (N * c) % 100 !== 0);
      const ans = (N * (c - b)) / 100;
      return numQ(
        `Biểu đồ hình quạt cho biết khối 5 có ${N} học sinh: ${a}% thích môn Toán, ${b}% thích môn Tiếng Việt, số còn lại thích môn Khoa học. Số học sinh thích Khoa học nhiều hơn số học sinh thích Tiếng Việt bao nhiêu bạn?`,
        ans,
        B(`Phần trăm thích Khoa học: 100% − ${a}% − ${b}% = ${c}%.`, `Thích Khoa học nhiều hơn Tiếng Việt: ${c}% − ${b}% = ${c - b}%.`, `Số bạn: ${N} × ${c - b} : 100 = ${ans} bạn.`),
        [(N * c) / 100, (N * b) / 100, c - b],
      );
    }],
  ],

  'hk2-on-tap-hinh-hoc': [
    ['Tư duy: đào ao tròn trong mảnh đất', () => {
      const [a, b] = longFirst(rand(20, 50), rand(16, 40)), r = rand(3, Math.floor(b / 2) - 1), S = 100 * a * b - 314 * r * r;
      return decQ(
        `Một mảnh đất hình chữ nhật dài ${a} m, rộng ${b} m. Ở giữa mảnh đất người ta đào một cái ao hình tròn bán kính ${r} m. Diện tích phần đất còn lại là bao nhiêu mét vuông? (π = 3,14)`,
        S, 2,
        B(`Diện tích mảnh đất: ${a} × ${b} = ${a * b} m².`, `Diện tích ao: ${r} × ${r} × 3,14 = ${dec(314 * r * r, 2)} m².`, `Còn lại: ${a * b} − ${dec(314 * r * r, 2)} = ${dec(S, 2)} m².`),
        [100 * a * b - 628 * r, 100 * a * b - 314 * 4 * r * r, 314 * r * r],
      );
    }],
    ['Tư duy: hình vuông cùng chu vi với hình chữ nhật', () => {
      let a = 0, b = 0;
      do { [a, b] = longFirst(rand(8, 30), rand(4, 20)); } while ((a + b) % 2 !== 0 || a === b);
      const s = (a + b) / 2, diff = s * s - a * b;
      return numQ(
        `Một hình vuông có chu vi bằng chu vi hình chữ nhật dài ${a} cm, rộng ${b} cm. Diện tích hình vuông lớn hơn diện tích hình chữ nhật bao nhiêu xăng-ti-mét vuông?`,
        diff,
        B(`Chu vi hình chữ nhật: (${a} + ${b}) × 2 = ${2 * (a + b)} cm; cạnh hình vuông: ${2 * (a + b)} : 4 = ${s} cm.`, `Diện tích hình vuông: ${s} × ${s} = ${s * s} cm²; hình chữ nhật: ${a} × ${b} = ${a * b} cm².`, `Hơn: ${s * s} − ${a * b} = ${diff} cm².`),
        [s * s, a * b, diff * 2],
      );
    }],
    ['Tư duy: kính làm bể cá không nắp', () => {
      const [a, b] = longFirst(rand(6, 15), rand(4, 10)), c = rand(4, 9), xq = 2 * (a + b) * c, S = xq + a * b;
      return numQ(
        `Người ta làm một bể cá bằng kính, KHÔNG CÓ NẮP, dạng hình hộp chữ nhật dài ${a} dm, rộng ${b} dm, cao ${c} dm. Diện tích kính dùng làm bể là bao nhiêu đề-xi-mét vuông? (không tính mép dán)`,
        S,
        B(`Bốn mặt xung quanh: (${a} + ${b}) × 2 × ${c} = ${xq} dm².`, `Chỉ có một mặt đáy (không có nắp): ${a} × ${b} = ${a * b} dm².`, `Kính cần dùng: ${xq} + ${a * b} = ${S} dm².`),
        [xq + 2 * a * b, xq, a * b * c],
      );
    }],
  ],

  'hk2-bai-toan-tong-hop': [
    ['Tư duy: giờ đến nơi khi có nghỉ dọc đường', () => {
      let v = 0, tMin = 0;
      do { v = pick([30, 40, 45, 50, 60]); tMin = pick([90, 120, 150, 180, 210]); } while ((v * tMin) % 60 !== 0);
      const D = (v * tMin) / 60, rest = pick([15, 20, 30]), start = 60 * rand(6, 8) + pick([0, 15, 30, 45]), arrive = start + tMin + rest;
      return strQ(
        `Quãng đường từ nhà bác Ba đến thành phố dài ${D} km. Bác đi ô tô với vận tốc ${v} km/giờ, khởi hành lúc ${hm(start)} và nghỉ dọc đường ${rest} phút. Hỏi bác đến thành phố lúc mấy giờ?`,
        hm(arrive),
        wrongTimes(arrive, [start + tMin, arrive + rest, arrive + 30, start + tMin - rest]),
        B(`Thời gian xe chạy: ${D} : ${v} = ${dur(tMin)}.`, `Cộng thời gian nghỉ: ${dur(tMin)} + ${rest} phút = ${dur(tMin + rest)}.`, `Đến nơi lúc: ${hm(start)} + ${dur(tMin + rest)} = ${hm(arrive)}.`),
      );
    }],
    ['Tư duy: hai vòi cùng chảy vào bể', () => {
      let V = 0, c = 0, a = 0, b = 0, need = 0;
      do { V = 100 * rand(5, 20); c = pick([20, 25, 40, 50]); a = rand(5, 20); b = rand(5, 20); need = (V * (100 - c)) / 100; } while (!isInt(need) || need % (a + b) !== 0 || need / (a + b) > 120);
      const t = need / (a + b), have = V - need;
      return numQ(
        `Một bể chứa được ${fmt(V)} lít nước, hiện đang có lượng nước bằng ${c}% sức chứa của bể. Người ta mở cùng lúc hai vòi: vòi thứ nhất mỗi phút chảy ${a} lít, vòi thứ hai mỗi phút chảy ${b} lít. Hỏi sau bao nhiêu phút thì bể đầy?`,
        t,
        B(`Lượng nước đang có: ${fmt(V)} × ${c} : 100 = ${fmt(have)} lít; còn thiếu: ${fmt(V)} − ${fmt(have)} = ${fmt(need)} lít.`, `Mỗi phút hai vòi chảy được: ${a} + ${b} = ${a + b} lít.`, `Thời gian: ${fmt(need)} : ${a + b} = ${t} phút.`),
        [V / (a + b), need / a, t * 2].filter(isInt),
      );
    }],
    ['Tư duy: mua hàng có giảm giá', () => {
      let n = 0, x = 0, m = 0, y = 0, disc = 0, total = 0, pay = 0, note = 0;
      do {
        n = rand(3, 10); x = 1000 * rand(5, 15); m = rand(2, 6); y = 1000 * rand(3, 12); disc = pick([10, 20]);
        total = n * x + m * y; pay = (total * (100 - disc)) / 100; note = pick([100000, 200000, 500000]);
      } while (pay > note || !isInt(pay));
      return numQ(
        `Bạn Minh mua ${n} quyển vở, giá ${fmt(x)} đồng một quyển, và ${m} cây bút, giá ${fmt(y)} đồng một cây. Cửa hàng giảm giá ${disc}% trên tổng số tiền. Minh đưa ${fmt(note)} đồng. Hỏi Minh được trả lại bao nhiêu tiền?`,
        note - pay,
        B(`Tổng tiền: ${n} × ${fmt(x)} + ${m} × ${fmt(y)} = ${fmt(total)} đồng.`, `Sau khi giảm ${disc}%: ${fmt(total)} × (100 − ${disc}) : 100 = ${fmt(pay)} đồng.`, `Trả lại: ${fmt(note)} − ${fmt(pay)} = ${fmt(note - pay)} đồng.`),
        [note - total, pay, (total * disc) / 100],
      );
    }],
  ],
};

/** Share of questions in a lesson that are tư duy (multi-step reading) problems. */
export const THINK_SHARE = 0.3;
