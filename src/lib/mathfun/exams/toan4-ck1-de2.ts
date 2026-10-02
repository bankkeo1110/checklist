import type { Exam } from "./types";

// Original questions (not from any external source), written to mirror
// Đề 1's skill coverage and question-type mix for a 4th-grade "Cuối kì I"
// practice test. Text/KaTeX only — no external images — so every answer is
// one I computed and verified directly, with no ambiguity.
export const toan4Ck1De2: Exam = {
  id: "toan4-ck1-de2",
  title: "Toán 4 – Cuối kì I – Đề 2",
  grade: 4,
  durationMinutes: 60,
  skills: [
    { label: "Ôn tập các số đến 100 000", count: 2 },
    { label: "Ôn tập các phép tính trong phạm vi 100 000", count: 3 },
    { label: "Số chẵn. Số lẻ", count: 2 },
    { label: "Biểu thức chứa chữ", count: 1 },
    { label: "Giải bài toán có ba bước tính", count: 2 },
    { label: "Đo góc. Đơn vị đo góc", count: 3 },
    { label: "Góc nhọn. Góc tù. Góc bẹt", count: 1 },
    { label: "Số có sáu chữ số. Số 1 000 000", count: 1 },
    { label: "Hàng và lớp", count: 1 },
    { label: "Các số trong phạm vi lớp triệu", count: 1 },
    { label: "Làm tròn số đến hàng trăm nghìn", count: 2 },
    { label: "So sánh các số có nhiều chữ số", count: 1 },
    { label: "Làm quen với dãy số tự nhiên", count: 1 },
    { label: "Luyện tập chung (Số có nhiều chữ số)", count: 1 },
    { label: "Yến. Tạ. Tấn", count: 1 },
    { label: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông", count: 3 },
    { label: "Giây. Thế kỉ", count: 1 },
    { label: "Luyện tập chung (Đơn vị đo đại lượng)", count: 1 },
    { label: "Phép cộng các số có nhiều chữ số", count: 1 },
    { label: "Phép trừ các số có nhiều chữ số", count: 1 },
    { label: "Tính chất giao hoán và kết hợp của phép cộng", count: 1 },
    { label: "Tìm hai số biết tổng và hiệu của hai số đó", count: 1 },
    { label: "Hai đường thẳng vuông góc", count: 2 },
    { label: "Hai đường thẳng song song", count: 1 },
    { label: "Hình bình hành. Hình thoi", count: 1 },
    { label: "Ôn tập hình học", count: 1 },
    { label: "Xếp hình. Vẽ hình", count: 3 },
  ],
  questions: [
    {
      type: "single",
      skill: "Ôn tập các số đến 100 000",
      content: "Số nào dưới đây có chữ số hàng trăm là $7$?",
      choices: ["$54\\,732$", "$81\\,699$", "$23\\,815$", "$60\\,374$"],
      correctChoices: [0],
    },
    {
      type: "fill",
      skill: "Ôn tập các số đến 100 000",
      content: "Tính nhẩm: $7\\,000 + 8\\,000$ được kết quả là {}.",
      blanks: ["15000"],
    },
    {
      type: "single",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content: "Giá trị của biểu thức $46\\,820 - (18\\,450 - 5\\,230)$ là:",
      choices: ["$33\\,600$", "$33\\,200$", "$34\\,600$", "$32\\,600$"],
      correctChoices: [0],
    },
    {
      type: "fill",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content: "Tính nhẩm: $9\\,000 - 3\\,500$ được kết quả là {}.",
      blanks: ["5500"],
    },
    {
      type: "fill",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content:
        "Có $6$ thùng sách, mỗi thùng có $1\\,200$ quyển. Số sách đó được chia đều cho $4$ thư viện. Hỏi mỗi thư viện nhận được bao nhiêu quyển sách?\nTrả lời: {} quyển.",
      blanks: ["1800"],
    },
    {
      type: "single",
      skill: "Số chẵn. Số lẻ",
      content: "Tổng của hai số chẵn bất kì luôn luôn là một số:",
      choices: ["Số chẵn", "Số lẻ", "Có thể chẵn hoặc lẻ"],
      correctChoices: [0],
    },
    {
      type: "fill",
      skill: "Số chẵn. Số lẻ",
      content: "Số chẵn lớn nhất có ba chữ số là {}.",
      blanks: ["998"],
    },
    {
      type: "fill",
      skill: "Biểu thức chứa chữ",
      content: "Giá trị của biểu thức $(a \\times 4) - 7$ với $a = 6$ là {}.",
      blanks: ["17"],
    },
    {
      type: "choose",
      skill: "Giải bài toán có ba bước tính",
      content:
        "Một cửa hàng có $48$ quyển vở xếp vào các hộp, mỗi hộp $6$ quyển và có $35$ cây bút xếp vào các hộp, mỗi hộp $5$ cây. Hỏi số hộp vở hay số hộp bút nhiều hơn và nhiều hơn bao nhiêu hộp?\nTrả lời: Số hộp {} nhiều hơn và nhiều hơn {} hộp.",
      dropdowns: [
        { options: ["vở", "bút"], correct: 0 },
        { options: ["1", "2", "3"], correct: 0 },
      ],
    },
    {
      type: "fill",
      skill: "Giải bài toán có ba bước tính",
      content:
        "$4$ thùng hàng nặng $100kg$. Mỗi vỏ thùng nặng $500g$. Hỏi $6$ thùng hàng như thế có khối lượng hàng là bao nhiêu? (Không tính vỏ thùng)\nTrả lời: {} $kg$.",
      blanks: ["147"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content:
        "Cho góc đỉnh $B$ cạnh $BM, BN$. Biết cạnh $BM$ trùng với vạch $0$ của thước đo và cạnh $BN$ trùng với vạch $65$ trên thước thì số đo góc đó là {}$^\\circ$.",
      blanks: ["65"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content:
        "Tam giác $DEF$ có số đo góc $D$ là $80^\\circ$ và góc $E$ là $55^\\circ$.\nTổng ba góc của một tam giác luôn là {}$^\\circ$.\nVậy góc $F$ có số đo là {}$^\\circ$.",
      blanks: ["180", "45"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content: "Số đo góc tạo bởi hai kim đồng hồ khi đồng hồ chỉ $4$ giờ đúng là: {}$^\\circ$.",
      blanks: ["120"],
    },
    {
      type: "single",
      skill: "Góc nhọn. Góc tù. Góc bẹt",
      content: "Một góc có số đo $95^\\circ$ là:",
      choices: ["Góc nhọn", "Góc tù", "Góc bẹt", "Góc vuông"],
      correctChoices: [1],
    },
    {
      type: "fill",
      skill: "Số có sáu chữ số. Số 1 000 000",
      content: "Số liền sau của $999\\,999$ là {}.",
      blanks: ["1000000"],
    },
    {
      type: "multi",
      skill: "Hàng và lớp",
      content: "Chữ số $7$ trong số $572\\,940$ thuộc hàng nào, lớp nào?",
      choices: ["Lớp nghìn", "Lớp đơn vị", "Hàng chục nghìn", "Hàng nghìn"],
      correctChoices: [0, 2],
    },
    {
      type: "fill",
      skill: "Các số trong phạm vi lớp triệu",
      content: "Số gồm $7$ triệu, $3$ trăm nghìn, $5$ chục và $2$ đơn vị viết là {}.",
      blanks: ["7300052"],
    },
    {
      type: "single",
      skill: "Làm tròn số đến hàng trăm nghìn",
      content: "Khi làm tròn số $3\\,681\\,240$ đến hàng trăm nghìn, ta thực hiện:",
      choices: ["Làm tròn lên", "Làm tròn xuống"],
      correctChoices: [0],
    },
    {
      type: "fill",
      skill: "Làm tròn số đến hàng trăm nghìn",
      content: "Một chiếc tủ lạnh giá $7\\,650\\,000$ đồng. Làm tròn giá tiền đến hàng trăm nghìn.\nGiá tiền làm tròn là {} đồng.",
      blanks: ["7700000"],
    },
    {
      type: "choose",
      skill: "So sánh các số có nhiều chữ số",
      content: "$6\\,203\\,000$ {} $6\\,000\\,000 + 203\\,500$.",
      dropdowns: [{ options: [">", "=", "<"], correct: 2 }],
    },
    {
      type: "fill",
      skill: "Làm quen với dãy số tự nhiên",
      content: "Ba số tự nhiên liên tiếp: {}$;\\ 150;\\ 151$.",
      blanks: ["149"],
    },
    {
      type: "fill",
      skill: "Luyện tập chung (Số có nhiều chữ số)",
      content:
        "Dùng các chữ số $1,\\,2,\\,4,\\,6$ (mỗi chữ số dùng đúng một lần) để lập các số có bốn chữ số khác nhau. Sắp xếp các số đó theo thứ tự từ bé đến lớn. Số thứ hai trong dãy số đó là số nào?\nTrả lời: {}.",
      blanks: ["1264"],
    },
    {
      type: "fill",
      skill: "Yến. Tạ. Tấn",
      content: "Một xe tải chở $2$ tấn $300kg$ gạo. Hỏi xe tải đó chở bao nhiêu ki-lô-gam gạo?\nTrả lời: {} $kg$.",
      blanks: ["2300"],
    },
    {
      type: "single",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content: "“Năm trăm linh tám xăng-ti-mét vuông” được viết là:",
      choices: ["$508cm^2$", "$58cm^2$", "$5\\,080cm^2$", "$508cm$"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content:
        "Bạn Lan có bốn miếng bìa hình vuông cạnh $1dm$. Bạn ghép bốn miếng đó thành một hình chữ nhật có chiều dài $4dm$. Diện tích hình chữ nhật đó là:",
      choices: ["$400mm^2$", "$400cm^2$", "$40cm^2$", "$4m^2$"],
      correctChoices: [1],
    },
    {
      type: "fill",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content:
        "Mặt bàn hình chữ nhật có chiều dài $15dm$, chiều rộng $8dm$. Người ta dán các miếng decal hình vuông cạnh $1dm$ để phủ kín mặt bàn. Hỏi cần bao nhiêu miếng decal?\nTrả lời: {} miếng.",
      blanks: ["120"],
    },
    {
      type: "fill",
      skill: "Giây. Thế kỉ",
      content: "$3$ phút $=$ {} giây.",
      blanks: ["180"],
    },
    {
      type: "fill",
      skill: "Luyện tập chung (Đơn vị đo đại lượng)",
      content:
        "Một thang máy chở được nhiều nhất $5$ tạ. Hiện đã có $6$ người lớn lên thang máy, mỗi người nặng $60kg$. Hỏi thang máy có thể chở thêm được nhiều nhất bao nhiêu trẻ em nữa, biết mỗi trẻ em nặng $25kg$?\nTrả lời: {} trẻ em.",
      blanks: ["5"],
    },
    {
      type: "fill",
      skill: "Phép cộng các số có nhiều chữ số",
      content:
        "Một kho hàng có $235\\,000kg$ gạo. Người ta nhập thêm vào kho $189\\,000kg$ gạo nữa. Hỏi kho đó có tất cả bao nhiêu ki-lô-gam gạo?\nTrả lời: {} $kg$.",
      blanks: ["424000"],
    },
    {
      type: "fill",
      skill: "Phép trừ các số có nhiều chữ số",
      content:
        "Một cửa hàng có $582\\,400$ viên gạch. Trong một tuần, cửa hàng đã bán $246\\,750$ viên. Hỏi cửa hàng còn lại bao nhiêu viên gạch?\nTrả lời: {} viên.",
      blanks: ["335650"],
    },
    {
      type: "single",
      skill: "Tính chất giao hoán và kết hợp của phép cộng",
      content: "Biết $2\\,340 + 5\\,160 = 7\\,500$, khi đó:",
      choices: ["$5\\,160+2\\,340=7\\,400$", "$5\\,160+2\\,340=7\\,500$", "$5\\,160+2\\,340=7\\,600$", "$5\\,160+2\\,340=7\\,510$"],
      correctChoices: [1],
    },
    {
      type: "single",
      skill: "Tìm hai số biết tổng và hiệu của hai số đó",
      content:
        "Bin mua một quả bóng và một chiếc vợt cầu lông. Giá chiếc vợt nhiều hơn giá quả bóng là $30\\,000$ đồng. Biết Bin đưa cô bán hàng $100\\,000$ đồng thì được trả lại $10\\,000$ đồng. Hỏi giá quả bóng là bao nhiêu tiền?",
      choices: ["$30\\,000$ đồng", "$45\\,000$ đồng", "$60\\,000$ đồng", "$20\\,000$ đồng"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Hai đường thẳng vuông góc",
      content: "Hình chữ nhật $ABCD$ có cạnh $AB$ vuông góc với những cạnh nào?",
      choices: ["$AD$ và $BC$", "Chỉ có $AD$", "Chỉ có $BC$", "$CD$ và $BC$"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Hai đường thẳng vuông góc",
      content:
        "Thanh gỗ $X$ vuông góc với thanh gỗ $Y$, thanh gỗ $Y$ lại vuông góc với thanh gỗ $Z$. Hỏi thanh $X$ và thanh $Z$ có quan hệ như thế nào với nhau?",
      choices: ["Song song với nhau", "Vuông góc với nhau", "Cắt nhau nhưng không vuông góc"],
      correctChoices: [0],
    },
    {
      type: "choose",
      skill: "Hai đường thẳng song song",
      content: "Cho hình chữ nhật $MNPQ$. Hai cạnh $MN$ và $QP$ {} với nhau.",
      dropdowns: [{ options: ["song song", "vuông góc"], correct: 0 }],
    },
    {
      type: "fill",
      skill: "Hình bình hành. Hình thoi",
      content: "Hình thoi $EFGH$ có cạnh $EF = 7cm$. Khi đó độ dài cạnh $GH$ là {}$cm$.",
      blanks: ["7"],
    },
    {
      type: "multi",
      skill: "Ôn tập hình học",
      content: "Hình nào dưới đây luôn có bốn góc vuông?",
      choices: ["Hình vuông", "Hình chữ nhật", "Hình thoi", "Hình bình hành"],
      correctChoices: [0, 1],
    },
    {
      type: "choose",
      skill: "Xếp hình. Vẽ hình",
      content: "Khi vẽ một hình thoi bằng thước và ê-ke, hai đường chéo của hình thoi cần {} với nhau và cắt nhau tại trung điểm mỗi đường.",
      dropdowns: [{ options: ["vuông góc", "song song"], correct: 0 }],
    },
    {
      type: "fill",
      skill: "Xếp hình. Vẽ hình",
      content:
        "Bạn Nam xếp các khối lập phương cạnh $1cm$ thành một hình hộp chữ nhật có chiều dài $4cm$, chiều rộng $3cm$, chiều cao $2cm$. Hỏi bạn Nam cần dùng tất cả bao nhiêu khối lập phương?\nTrả lời: {} khối.",
      blanks: ["24"],
    },
    {
      type: "single",
      skill: "Xếp hình. Vẽ hình",
      content:
        "Ghép hai hình tam giác vuông cân bằng nhau (mỗi hình có hai cạnh góc vuông bằng nhau) theo cạnh huyền thì được một hình mới. Hình mới đó là hình gì?",
      choices: ["Hình vuông", "Hình chữ nhật", "Hình thoi", "Hình bình hành"],
      correctChoices: [0],
    },
  ],
};
