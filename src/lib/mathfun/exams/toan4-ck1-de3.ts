import type { Exam } from "./types";

// Original questions (not from any external source) — a third variant with
// fresh numbers/scenarios, same skill coverage as Đề 1/2. Text/KaTeX only.
export const toan4Ck1De3: Exam = {
  id: "toan4-ck1-de3",
  title: "Toán 4 – Cuối kì I – Đề 3",
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
      content: "Số nào dưới đây có chữ số hàng nghìn là $9$?",
      choices: ["$39\\,452$", "$81\\,245$", "$64\\,708$", "$27\\,308$"],
      correctChoices: [0],
    },
    {
      type: "fill",
      skill: "Ôn tập các số đến 100 000",
      content: "Tính nhẩm: $4\\,000 + 9\\,000$ được kết quả là {}.",
      blanks: ["13000"],
    },
    {
      type: "single",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content: "Giá trị của biểu thức $68\\,500 - (24\\,300 + 9\\,700)$ là:",
      choices: ["$34\\,500$", "$35\\,500$", "$33\\,500$", "$34\\,000$"],
      correctChoices: [0],
    },
    {
      type: "fill",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content: "Tính nhẩm: $12\\,000 - 4\\,500$ được kết quả là {}.",
      blanks: ["7500"],
    },
    {
      type: "fill",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content:
        "Có $5$ hộp kẹo, mỗi hộp có $840$ viên. Số kẹo đó được chia đều cho $3$ lớp học. Hỏi mỗi lớp nhận được bao nhiêu viên kẹo?\nTrả lời: {} viên.",
      blanks: ["1400"],
    },
    {
      type: "single",
      skill: "Số chẵn. Số lẻ",
      content: "Tích của một số chẵn với một số bất kì luôn luôn là một số:",
      choices: ["Số chẵn", "Số lẻ", "Có thể chẵn hoặc lẻ"],
      correctChoices: [0],
    },
    {
      type: "fill",
      skill: "Số chẵn. Số lẻ",
      content: "Số lẻ nhỏ nhất có bốn chữ số là {}.",
      blanks: ["1001"],
    },
    {
      type: "fill",
      skill: "Biểu thức chứa chữ",
      content: "Giá trị của biểu thức $(b + 9) \\times 2$ với $b = 5$ là {}.",
      blanks: ["28"],
    },
    {
      type: "choose",
      skill: "Giải bài toán có ba bước tính",
      content:
        "Một trại giống có $54$ cây cam được trồng vào các hàng, mỗi hàng $6$ cây và có $40$ cây bưởi được trồng vào các hàng, mỗi hàng $5$ cây. Hỏi số hàng cam hay số hàng bưởi nhiều hơn và nhiều hơn bao nhiêu hàng?\nTrả lời: Số hàng {} nhiều hơn và nhiều hơn {} hàng.",
      dropdowns: [
        { options: ["cam", "bưởi"], correct: 0 },
        { options: ["1", "2", "3"], correct: 0 },
      ],
    },
    {
      type: "fill",
      skill: "Giải bài toán có ba bước tính",
      content:
        "$4$ thùng hàng nặng $106kg$. Mỗi vỏ thùng nặng $500g$. Hỏi $7$ thùng hàng như thế có khối lượng hàng là bao nhiêu? (Không tính vỏ thùng)\nTrả lời: {} $kg$.",
      blanks: ["182"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content:
        "Cho góc đỉnh $C$ cạnh $CP, CQ$. Biết cạnh $CP$ trùng với vạch $0$ của thước đo và cạnh $CQ$ trùng với vạch $110$ trên thước thì số đo góc đó là {}$^\\circ$.",
      blanks: ["110"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content:
        "Tam giác $GHI$ có góc $G$ là $45^\\circ$ và góc $H$ là $75^\\circ$.\nTổng ba góc của một tam giác luôn là {}$^\\circ$.\nVậy góc $I$ có số đo là {}$^\\circ$.",
      blanks: ["180", "60"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content: "Số đo góc (không tù) tạo bởi hai kim đồng hồ khi đồng hồ chỉ $8$ giờ đúng là: {}$^\\circ$.",
      blanks: ["120"],
    },
    {
      type: "single",
      skill: "Góc nhọn. Góc tù. Góc bẹt",
      content: "Một góc có số đo $180^\\circ$ là:",
      choices: ["Góc nhọn", "Góc tù", "Góc bẹt", "Góc vuông"],
      correctChoices: [2],
    },
    {
      type: "fill",
      skill: "Số có sáu chữ số. Số 1 000 000",
      content: "Số liền trước của $500\\,000$ là {}.",
      blanks: ["499999"],
    },
    {
      type: "multi",
      skill: "Hàng và lớp",
      content: "Chữ số $4$ trong số $304\\,681$ thuộc hàng nào, lớp nào?",
      choices: ["Lớp nghìn", "Lớp đơn vị", "Hàng nghìn", "Hàng trăm nghìn"],
      correctChoices: [0, 2],
    },
    {
      type: "fill",
      skill: "Các số trong phạm vi lớp triệu",
      content: "Số gồm $9$ triệu, $4$ chục nghìn, $6$ trăm và $3$ đơn vị viết là {}.",
      blanks: ["9040603"],
    },
    {
      type: "single",
      skill: "Làm tròn số đến hàng trăm nghìn",
      content: "Khi làm tròn số $5\\,249\\,800$ đến hàng trăm nghìn, ta thực hiện:",
      choices: ["Làm tròn lên", "Làm tròn xuống"],
      correctChoices: [1],
    },
    {
      type: "fill",
      skill: "Làm tròn số đến hàng trăm nghìn",
      content: "Một chiếc ti vi giá $6\\,420\\,000$ đồng. Làm tròn giá tiền đến hàng trăm nghìn.\nGiá tiền làm tròn là {} đồng.",
      blanks: ["6400000"],
    },
    {
      type: "choose",
      skill: "So sánh các số có nhiều chữ số",
      content: "$8\\,071\\,000$ {} $8\\,000\\,000 + 71\\,000$.",
      dropdowns: [{ options: [">", "=", "<"], correct: 1 }],
    },
    {
      type: "fill",
      skill: "Làm quen với dãy số tự nhiên",
      content: "Ba số tự nhiên liên tiếp: $320;\\ 321;$ {}.",
      blanks: ["322"],
    },
    {
      type: "fill",
      skill: "Luyện tập chung (Số có nhiều chữ số)",
      content:
        "Dùng các chữ số $3,\\,5,\\,7,\\,9$ (mỗi chữ số dùng đúng một lần) để lập các số có bốn chữ số khác nhau. Sắp xếp các số đó theo thứ tự từ lớn đến bé. Số thứ hai trong dãy số đó là số nào?\nTrả lời: {}.",
      blanks: ["9735"],
    },
    {
      type: "fill",
      skill: "Yến. Tạ. Tấn",
      content: "Một xe tải chở $3$ tấn $150kg$ xi măng. Hỏi xe tải đó chở bao nhiêu ki-lô-gam xi măng?\nTrả lời: {} $kg$.",
      blanks: ["3150"],
    },
    {
      type: "single",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content: "“Chín trăm hai mươi mi-li-mét vuông” được viết là:",
      choices: ["$920mm^2$", "$92mm^2$", "$9\\,200mm^2$", "$920mm$"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content:
        "Bạn Hà có sáu miếng bìa hình vuông cạnh $1dm$. Bạn ghép sáu miếng đó thành một hình chữ nhật có chiều dài $6dm$. Diện tích hình chữ nhật đó là:",
      choices: ["$600mm^2$", "$60cm^2$", "$600cm^2$", "$6m^2$"],
      correctChoices: [2],
    },
    {
      type: "fill",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content:
        "Một sân chơi hình chữ nhật có chiều dài $12m$ ($= 120dm$), chiều rộng $9m$ ($=90dm$). Người ta lát sân bằng các viên gạch hình vuông cạnh $3dm$. Hỏi cần bao nhiêu viên gạch để lát kín sân?\nTrả lời: {} viên.",
      blanks: ["1200"],
    },
    {
      type: "fill",
      skill: "Giây. Thế kỉ",
      content: "$2$ thế kỉ $=$ {} năm.",
      blanks: ["200"],
    },
    {
      type: "fill",
      skill: "Luyện tập chung (Đơn vị đo đại lượng)",
      content:
        "Một chiếc xe chở được nhiều nhất $6$ tạ hàng. Hiện đã có $8$ bao gạo, mỗi bao nặng $50kg$. Hỏi xe đó có thể chở thêm được nhiều nhất bao nhiêu bao đường nữa, biết mỗi bao đường nặng $20kg$?\nTrả lời: {} bao.",
      blanks: ["10"],
    },
    {
      type: "fill",
      skill: "Phép cộng các số có nhiều chữ số",
      content:
        "Một nhà máy sản xuất được $156\\,000$ sản phẩm trong tháng $1$ và $178\\,500$ sản phẩm trong tháng $2$. Hỏi nhà máy đó sản xuất được tất cả bao nhiêu sản phẩm trong hai tháng?\nTrả lời: {} sản phẩm.",
      blanks: ["334500"],
    },
    {
      type: "fill",
      skill: "Phép trừ các số có nhiều chữ số",
      content:
        "Một thư viện có $425\\,600$ quyển sách. Thư viện đã cho mượn $137\\,850$ quyển. Hỏi thư viện còn lại bao nhiêu quyển sách?\nTrả lời: {} quyển.",
      blanks: ["287750"],
    },
    {
      type: "single",
      skill: "Tính chất giao hoán và kết hợp của phép cộng",
      content: "Biết $(2\\,100+1\\,900)+3\\,000=7\\,000$. Theo tính chất kết hợp, biểu thức đó cũng bằng:",
      choices: ["$2\\,100+(1\\,900+3\\,000)$", "$2\\,100-(1\\,900+3\\,000)$", "$2\\,100\\times(1\\,900+3\\,000)$", "$(2\\,100+1\\,900)\\times3\\,000$"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Tìm hai số biết tổng và hiệu của hai số đó",
      content:
        "Hai thùng dầu có tổng cộng $85$ lít. Thùng thứ nhất nhiều hơn thùng thứ hai $15$ lít. Hỏi thùng thứ hai có bao nhiêu lít dầu?",
      choices: ["$35$ lít", "$50$ lít", "$40$ lít", "$45$ lít"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Hai đường thẳng vuông góc",
      content: "Hình vuông $MNPQ$ có cạnh $MN$ vuông góc với những cạnh nào?",
      choices: ["$MQ$ và $NP$", "Chỉ có $MQ$", "Chỉ có $NP$", "$QP$ và $NP$"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Hai đường thẳng vuông góc",
      content: "Thanh sắt $P$ vuông góc với thanh sắt $Q$. Thanh sắt $Q$ song song với thanh sắt $R$. Hỏi thanh $P$ và thanh $R$ có quan hệ gì với nhau?",
      choices: ["Vuông góc với nhau", "Song song với nhau", "Cắt nhau nhưng không vuông góc"],
      correctChoices: [0],
    },
    {
      type: "choose",
      skill: "Hai đường thẳng song song",
      content: "Cho hình bình hành $RSTU$. Hai cạnh $RS$ và $UT$ {} với nhau.",
      dropdowns: [{ options: ["song song", "vuông góc"], correct: 0 }],
    },
    {
      type: "fill",
      skill: "Hình bình hành. Hình thoi",
      content: "Hình bình hành $KLMN$ có cạnh $KL = 9cm$. Khi đó độ dài cạnh $MN$ là {}$cm$.",
      blanks: ["9"],
    },
    {
      type: "multi",
      skill: "Ôn tập hình học",
      content: "Hình nào dưới đây có hai cặp cạnh đối diện song song với nhau?",
      choices: ["Hình bình hành", "Hình thoi", "Hình thang", "Hình tam giác"],
      correctChoices: [0, 1],
    },
    {
      type: "choose",
      skill: "Xếp hình. Vẽ hình",
      content: "Khi vẽ hai đường thẳng vuông góc bằng ê-ke, ta đặt một cạnh góc vuông của ê-ke {} với đường thẳng đã cho.",
      dropdowns: [{ options: ["trùng", "song song", "cắt nhưng không trùng"], correct: 0 }],
    },
    {
      type: "fill",
      skill: "Xếp hình. Vẽ hình",
      content:
        "Bạn Lan xếp các khối lập phương cạnh $1cm$ thành một hình hộp chữ nhật có chiều dài $5cm$, chiều rộng $2cm$, chiều cao $3cm$. Hỏi bạn Lan cần dùng tất cả bao nhiêu khối lập phương?\nTrả lời: {} khối.",
      blanks: ["30"],
    },
    {
      type: "single",
      skill: "Xếp hình. Vẽ hình",
      content:
        "Ghép bốn hình tam giác vuông cân bằng nhau quanh một hình vuông nhỏ ở giữa (kiểu xếp \"cối xay gió\") sao cho các cạnh ghép khít nhau. Hình lớn bên ngoài tạo thành là hình gì?",
      choices: ["Hình vuông", "Hình chữ nhật (không vuông)", "Hình thoi", "Hình bình hành"],
      correctChoices: [0],
    },
  ],
};
