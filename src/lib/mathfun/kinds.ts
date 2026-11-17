import type { Question } from './questions';
import { rand } from './qutil';

/**
 * Dạng toán for each question template, by lesson generator key and template position.
 * Labels are unique across the whole curriculum so stats can group by label alone.
 */
export const KINDS: Record<string, string[]> = {
  onTapPhanSo: ["Cộng, trừ phân số khác mẫu", "Nhân, chia phân số", "Đổi hỗn số ra phân số", "Đổi phân số ra hỗn số", "Phân số thập phân ra số thập phân"],
  soThapPhan: ["Hàng của chữ số trong số thập phân", "Giá trị của chữ số trong số thập phân", "Đổi hỗn số ra số thập phân", "Số thập phân ra phân số thập phân", "Viết số thập phân từ các hàng", "Số thập phân bằng nhau"],
  soSanhLamTron: ["So sánh hai số thập phân", "Sắp xếp số thập phân", "Làm tròn số thập phân", "Tìm số lớn nhất/bé nhất", "Tìm số thập phân nằm giữa hai số"],
  congTru: ["Cộng số thập phân", "Trừ số thập phân", "Tìm x (cộng, trừ số thập phân)", "Tính nhanh tổng số thập phân", "Toán lời văn: cộng số thập phân", "Toán lời văn: trừ số thập phân"],
  nhan: ["Nhân số thập phân với số tự nhiên", "Nhân nhẩm với 10, 100, 1000", "Nhân nhẩm với 0,1; 0,01", "Nhân hai số thập phân", "Toán lời văn: nhân số thập phân", "Tính nhanh tích (× 4 × 25)"],
  chia: ["Chia số thập phân cho số tự nhiên", "Chia nhẩm cho 10, 100, 1000", "Chia số tự nhiên, thương thập phân", "Chia cho số thập phân", "Toán lời văn: chia số thập phân", "Tìm x (nhân, chia số thập phân)"],
  donVi: ["Đổi số đo hai đơn vị ra số thập phân", "Đổi đơn vị bé ra đơn vị lớn", "Đổi đơn vị lớn ra đơn vị bé"],
  dienTichHa: ["Đổi ha ra m²", "Đổi m² ra ha", "Đổi ha (số thập phân) ra m²", "Đổi km² ra ha", "Toán lời văn: diện tích ra héc-ta", "So sánh số đo diện tích"],
  tamGiac: ["Diện tích tam giác", "Tìm chiều cao tam giác từ diện tích", "Diện tích tam giác (số thập phân)", "Diện tích tam giác vuông", "Nhận biết chiều cao tam giác"],
  hinhThang: ["Diện tích hình thang", "Tìm chiều cao hình thang", "Tìm đáy bé hình thang", "Diện tích hình thang (số thập phân)", "Công thức diện tích hình thang"],
  phanTram: ["Tìm tỉ số phần trăm của hai số", "Tìm giá trị phần trăm của một số", "Tìm một số khi biết giá trị phần trăm", "Đổi phân số ra tỉ số phần trăm", "Đổi phần trăm ra số thập phân", "Toán lời văn: tìm phần trăm của số"],
  tongHop: ["Toán lời văn: giá tiền × số thập phân", "Toán lời văn: nhân số đo", "Chu vi hình chữ nhật (số thập phân)", "Diện tích hình chữ nhật (số thập phân)", "Toán lời văn: phần còn lại sau khi dùng %", "Trung bình cộng số thập phân"],
  hinhTron: ["Chu vi hình tròn từ đường kính", "Chu vi hình tròn từ bán kính", "Diện tích hình tròn từ bán kính", "Tìm đường kính từ chu vi", "Tìm bán kính từ chu vi", "Diện tích hình tròn từ đường kính", "Công thức, khái niệm hình tròn", "Toán lời văn: bánh xe lăn", "Bán kính gấp lên – diện tích gấp mấy lần"],
  hopChuNhat: ["Diện tích xung quanh hình hộp chữ nhật", "Diện tích toàn phần hình hộp chữ nhật", "Tìm chiều cao từ diện tích xung quanh", "Diện tích xung quanh (số thập phân)", "Đặc điểm hình hộp chữ nhật", "Toán lời văn: sơn thùng không nắp"],
  lapPhuong: ["Diện tích xung quanh hình lập phương", "Diện tích toàn phần hình lập phương", "Tìm cạnh từ diện tích toàn phần", "Diện tích toàn phần (số thập phân)", "Toán lời văn: dán giấy hộp lập phương", "Đặc điểm hình lập phương", "Từ diện tích xung quanh ra toàn phần", "Toán lời văn: sơn một số mặt", "Cạnh gấp lên – diện tích gấp mấy lần"],
  theTich: ["Thể tích hình hộp chữ nhật", "Thể tích hình lập phương", "Đổi đơn vị thể tích", "Thể tích ra lít", "Tìm chiều cao từ thể tích", "Toán lời văn: bể nước chứa bao nhiêu lít"],
  thoiGian: ["Cộng số đo thời gian", "Trừ số đo thời gian", "Nhân số đo thời gian", "Chia số đo thời gian", "Đổi giờ phút ra giờ (số thập phân)", "Đổi giờ (số thập phân) ra phút", "Tính thời gian từ giờ bắt đầu, kết thúc"],
  vanToc: ["Tính vận tốc", "Tính quãng đường", "Tính thời gian đi", "Đổi m/giây ra km/giờ", "Vận tốc theo mét/phút", "Quãng đường trong 30 phút"],
  chuyenDong: ["Hai xe ngược chiều gặp nhau", "Xe đuổi kịp cùng chiều", "Hai xe ngược chiều từ một điểm", "Tìm vận tốc xe kia khi gặp nhau"],
  phanTramUngDung: ["Giá sau khi giảm %", "Giá bán khi lãi %", "Tỉ số phần trăm trong thực tế", "Sản lượng tăng %", "Tìm số khi biết % (tiền lương)", "Tìm phần còn lại khi biết %"],
  tiLe: ["Tỉ lệ thuận (rút về đơn vị)", "Tỉ lệ nghịch (người – ngày)", "Tổng – tỉ: tìm số lớn", "Hiệu – tỉ: tìm số bé", "Tỉ lệ bản đồ", "Tỉ lệ thuận: giá tiền"],
  thongKe: ["Đọc biểu đồ hình quạt", "Trung bình cộng", "Xác suất: lấy bi", "Xác suất: gieo xúc xắc", "Tỉ số phần trăm kết quả thử nghiệm", "Đọc bảng số liệu"],
  onTapHinh: ["Diện tích hình ghép (chữ nhật + tam giác)", "Diện tích phần còn lại (vuông – tròn)", "Chu vi nửa hình tròn", "Diện tích hình tròn từ chu vi", "Công thức thể tích"],
  tongHop2: ["Toán lời văn: giờ đến nơi", "Toán lời văn: bể nước theo %", "Toán lời văn: bánh xe đi được bao xa", "Toán lời văn: tổng – tỉ chu vi", "Toán lời văn: hộp chứa bao nhiêu lít", "Toán lời văn: điểm trung bình"],
};

/** Pick one template at random and tag the question with its dạng. */
export function pickK(key: string, templates: (() => Question)[]): Question {
  const i = rand(0, templates.length - 1);
  const q = templates[i]();
  return { ...q, kind: q.kind ?? KINDS[key]?.[i] ?? `${key}#${i + 1}` };
}
