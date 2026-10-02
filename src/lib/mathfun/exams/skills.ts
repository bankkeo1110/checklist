// Short, kid-friendly explanations for every skill tested across the exams —
// the "Learn" page's content. Keyed by the exact skill label used in each
// exam's `skills`/question `skill` fields.
export const SKILL_NOTES: Record<string, string> = {
  "Ôn tập các số đến 100 000":
    "Mỗi chữ số trong một số có một \"hàng\" riêng: hàng đơn vị, hàng chục, hàng trăm, hàng nghìn, hàng chục nghìn… Ví dụ ở số $57\\,680$: chữ số $8$ đứng ở hàng chục. Đọc số từ trái sang phải theo từng hàng để không bị nhầm.",
  "Ôn tập các phép tính trong phạm vi 100 000":
    "Khi tính biểu thức có dấu ngoặc, luôn làm phép tính trong ngoặc trước. Với bài toán chia đều, nhớ tính tổng số lượng trước rồi mới chia cho số phần.",
  "Số chẵn. Số lẻ":
    "Số chẵn là số có chữ số tận cùng là $0,2,4,6,8$ (chia hết cho $2$); số lẻ có chữ số tận cùng là $1,3,5,7,9$. Chẵn $+$ chẵn $=$ chẵn; chẵn $\\times$ bất kì $=$ chẵn.",
  "Biểu thức chứa chữ":
    "Biểu thức chứa chữ (như $m+5$) chỉ cần thay số vào chữ rồi tính như bình thường. Nhớ làm theo đúng thứ tự: trong ngoặc trước, nhân chia trước, cộng trừ sau.",
  "Giải bài toán có ba bước tính":
    "Bài toán nhiều bước thường cần: (1) tìm một đại lượng trung gian, (2) tìm đại lượng trung gian thứ hai, (3) so sánh hoặc kết hợp hai kết quả đó để trả lời câu hỏi. Viết rõ từng bước ra giấy sẽ không bị rối.",
  "Đo góc. Đơn vị đo góc":
    "Dùng thước đo góc: đặt tâm thước trùng đỉnh góc, một cạnh trùng vạch $0$, rồi đọc số đo ở vạch mà cạnh kia đi qua. Đơn vị đo góc là độ ($^\\circ$). Tổng ba góc trong một tam giác luôn bằng $180^\\circ$.",
  "Góc nhọn. Góc tù. Góc bẹt":
    "Góc nhọn nhỏ hơn $90^\\circ$, góc vuông đúng bằng $90^\\circ$, góc tù lớn hơn $90^\\circ$ nhưng nhỏ hơn $180^\\circ$, góc bẹt đúng bằng $180^\\circ$ (giống một đường thẳng).",
  "Số có sáu chữ số. Số 1 000 000":
    "Số liền sau của $999\\,999$ là $1\\,000\\,000$ (một triệu) — số nhỏ nhất có bảy chữ số. Khi cộng thêm $1$ vào một số toàn chữ số $9$, tất cả các chữ số $9$ đó biến thành $0$ và thêm một chữ số $1$ ở đầu.",
  "Hàng và lớp":
    "Mỗi $3$ hàng liên tiếp (từ phải sang) tạo thành một \"lớp\": lớp đơn vị (đơn vị, chục, trăm), lớp nghìn (nghìn, chục nghìn, trăm nghìn), lớp triệu (triệu, chục triệu, trăm triệu).",
  "Các số trong phạm vi lớp triệu":
    "Số có đến $9$ chữ số thuộc phạm vi lớp triệu. Để viết một số từ lời mô tả (ví dụ \"$7$ triệu, $3$ trăm nghìn…\"), cộng dồn giá trị của từng phần lại với nhau.",
  "Làm tròn số đến hàng trăm nghìn":
    "Nhìn vào chữ số ở hàng chục nghìn (hàng ngay bên phải hàng cần làm tròn): nếu từ $5$ trở lên thì làm tròn lên (hàng trăm nghìn tăng thêm $1$), nếu nhỏ hơn $5$ thì làm tròn xuống (giữ nguyên), các hàng phía sau đều thành $0$.",
  "So sánh các số có nhiều chữ số":
    "So sánh từ chữ số đầu tiên bên trái: số nào có chữ số lớn hơn ở hàng cao nhất khác nhau thì số đó lớn hơn. Nếu có phép tính, hãy tính ra kết quả trước rồi mới so sánh.",
  "Làm quen với dãy số tự nhiên":
    "Hai số tự nhiên liên tiếp hơn kém nhau đúng $1$ đơn vị. Số liền sau $=$ số đó $+1$; số liền trước $=$ số đó $-1$.",
  "Luyện tập chung (Số có nhiều chữ số)":
    "Khi lập số từ các chữ số cho trước, chữ số đầu tiên (bên trái) không được là $0$. Khi xóa một chữ số để số còn lại lớn nhất, hãy thử xóa chữ số đầu tiên nhỏ hơn chữ số đứng ngay sau nó.",
  "Yến. Tạ. Tấn":
    "$1$ yến $= 10kg$; $1$ tạ $= 100kg$; $1$ tấn $= 1\\,000kg$. Muốn đổi sang ki-lô-gam, nhân với số đó; muốn đổi ngược lại, chia cho số đó.",
  "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông":
    "$1m^2=100dm^2$; $1dm^2=100cm^2$; $1cm^2=100mm^2$ (mỗi bước đổi đơn vị độ dài gấp $10$ lần thì đơn vị diện tích gấp $100$ lần). Diện tích hình chữ nhật $=$ chiều dài $\\times$ chiều rộng (cùng đơn vị).",
  "Giây. Thế kỉ":
    "$1$ phút $= 60$ giây; $1$ thế kỉ $= 100$ năm. Muốn đổi sang đơn vị nhỏ hơn, nhân lên; muốn đổi sang đơn vị lớn hơn, chia xuống.",
  "Luyện tập chung (Đơn vị đo đại lượng)":
    "Khi bài toán có nhiều đơn vị khác nhau (kg, tạ, tấn…), hãy đổi tất cả về cùng một đơn vị trước khi cộng, trừ hay so sánh.",
  "Phép cộng các số có nhiều chữ số":
    "Đặt tính thẳng cột theo từng hàng (đơn vị thẳng đơn vị, chục thẳng chục…), cộng từ phải sang trái, nhớ ghi số nhớ sang hàng tiếp theo nếu có.",
  "Phép trừ các số có nhiều chữ số":
    "Đặt tính thẳng cột như phép cộng, trừ từ phải sang trái; nếu số bị trừ ở một hàng nhỏ hơn số trừ, phải mượn $1$ từ hàng liền trước.",
  "Tính chất giao hoán và kết hợp của phép cộng":
    "Giao hoán: $a+b=b+a$ (đổi chỗ các số hạng, tổng không đổi). Kết hợp: $(a+b)+c=a+(b+c)$ (nhóm các số hạng lại thế nào cũng được).",
  "Tìm hai số biết tổng và hiệu của hai số đó":
    "Số bé $=$ (tổng $-$ hiệu) $\\div 2$; số lớn $=$ (tổng $+$ hiệu) $\\div 2$. Luôn kiểm tra lại: số lớn $+$ số bé phải đúng bằng tổng đã cho.",
  "Hai đường thẳng vuông góc":
    "Hai đường thẳng vuông góc khi chúng cắt nhau và tạo thành một góc $90^\\circ$ (góc vuông). Trong hình chữ nhật hay hình vuông, hai cạnh kề nhau (chung một đỉnh) luôn vuông góc với nhau.",
  "Hai đường thẳng song song":
    "Hai đường thẳng song song không bao giờ cắt nhau, dù kéo dài mãi, và luôn cách đều nhau. Trong hình chữ nhật, hình bình hành, hai cặp cạnh đối diện luôn song song với nhau.",
  "Hình bình hành. Hình thoi":
    "Hình bình hành có hai cặp cạnh đối diện song song và bằng nhau. Hình thoi là một hình bình hành đặc biệt có cả bốn cạnh bằng nhau, và hai đường chéo vuông góc với nhau tại trung điểm mỗi đường.",
  "Ôn tập hình học":
    "Ôn lại các hình đã học: hình vuông (4 cạnh bằng nhau, 4 góc vuông), hình chữ nhật (4 góc vuông, 2 cặp cạnh đối bằng nhau), hình bình hành và hình thoi (xem ở trên).",
  "Xếp hình. Vẽ hình":
    "Khi vẽ hai đường thẳng vuông góc, dùng ê-ke: đặt một cạnh góc vuông của ê-ke trùng với đường thẳng đã cho, cạnh còn lại chính là đường vuông góc cần vẽ. Khối hộp chữ nhật xếp từ các khối lập phương có số khối $=$ chiều dài $\\times$ chiều rộng $\\times$ chiều cao (tính theo số khối mỗi chiều).",
};

export function skillNote(skill: string): string | undefined {
  return SKILL_NOTES[skill];
}
