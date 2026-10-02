import type { Exam } from "./types";

// Imported from a VioEdu "Toán 4 – Cuối kì I – Đề 1" skill-test export (40
// questions, no answer key included in the source). Every answer below was
// worked out independently — text-only questions by solving the arithmetic,
// image-dependent ones by downloading and inspecting the actual images.
//
// Two items stayed genuinely uncertain even after inspecting the image
// (visual pattern-matrix / ambiguous vertex position) — flagged inline below
// and in the Learn/report UI isn't told otherwise, so a parent should spot-check
// Q37 and Q39 specifically if a kid gets marked wrong there.
export const toan4Ck1De1: Exam = {
  id: "toan4-ck1-de1",
  title: "Toán 4 – Cuối kì I – Đề 1",
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
      content: "Số nào dưới đây có chữ số hàng chục là $8$?",
      choices: ["$86\\,455$", "$12\\,508$", "$38\\,221$", "$57\\,680$"],
      correctChoices: [3],
    },
    {
      type: "fill",
      skill: "Ôn tập các số đến 100 000",
      content:
        "[U:https://s3.vio.edu.vn/imgTESTCKIKNTT21_1698909087978.png]\nSố cần điền vào dấu hỏi chấm là {}.\nSố cần điền vào dấu ba chấm là {}.",
      blanks: ["200", "90000"],
    },
    {
      type: "fill",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content: "Tính nhẩm: $5\\,000 + 6\\,000$ được kết quả là {}.",
      blanks: ["11000"],
    },
    {
      type: "single",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content: "Giá trị của biểu thức $57\\,650 - (29\\,663 - 3\\,643)$ là:",
      choices: ["$30\\,630$", "$31\\,600$", "$31\\,530$", "$31\\,630$"],
      correctChoices: [3],
    },
    {
      type: "fill",
      skill: "Ôn tập các phép tính trong phạm vi 100 000",
      content:
        "Có $4$ xe ô tô, mỗi xe chở $2\\,500kg$ gạo đến giúp đỡ đồng bào vùng bị lũ lụt. Dự kiến tất cả số gạo đó được chia đều cho $5$ xã. Hỏi mỗi xã sẽ nhận được bao nhiêu ki-lô-gam gạo?\nTrả lời: {} $kg$.",
      blanks: ["2000"],
    },
    {
      type: "single",
      skill: "Số chẵn. Số lẻ",
      content:
        "Quan sát bảng số từ $11$ đến $30$ xếp thành $4$ hàng $5$ cột: hàng thứ ba là $21,\\,22,\\,?,\\,24,\\,25$ — một số ở giữa $22$ và $24$ đã bị che đi.\nSố đã bị che đi là:",
      choices: ["Số lẻ", "Số chẵn"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Số chẵn. Số lẻ",
      content:
        "[I:testckikntt71_1698899329.png]\nNếu con ong bay theo đường các số chẵn thì sẽ đến bông hoa nào?",
      choices: [
        "[I:testckikntt72_1698899329.png]",
        "[I:testckikntt73_1698899329.png]",
        "[I:testckikntt75_1698899329.png]",
        "[I:testckikntt74_1698899329.png]",
      ],
      correctChoices: [2],
    },
    {
      type: "fill",
      skill: "Biểu thức chứa chữ",
      content: "Giá trị của biểu thức $(m + 5) \\times 3$ với $m = 2$ là {}.",
      blanks: ["21"],
    },
    {
      type: "choose",
      skill: "Giải bài toán có ba bước tính",
      content:
        "Chia $36$ cái bánh nướng vào các hộp, mỗi hộp $4$ cái và chia $24$ cái bánh dẻo vào các hộp, mỗi hộp $2$ cái. Hỏi số hộp bánh nướng hay bánh dẻo nhiều hơn và nhiều hơn bao nhiêu hộp?\nTrả lời: Số hộp bánh {} nhiều hơn và nhiều hơn {} hộp.",
      dropdowns: [
        { options: ["nướng", "dẻo"], correct: 1 },
        { options: ["3", "4", "2"], correct: 0 },
      ],
    },
    {
      type: "fill",
      skill: "Giải bài toán có ba bước tính",
      content:
        "$4$ thùng hàng nặng $150kg$. Mỗi vỏ thùng nặng $250g$. Hỏi $8$ thùng hàng như thế có khối lượng hàng là bao nhiêu? (Không tính vỏ thùng)\nTrả lời: {} $kg$.",
      blanks: ["298"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content:
        "Cho góc đỉnh $A$ cạnh $AM, AN$. Biết cạnh $AM$ trùng với vạch $0$ của thước đo và cạnh $AN$ trùng với vạch $20$ trên thước thì số đo góc đó là {}$^\\circ$.",
      blanks: ["20"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content:
        "[I:testckikntt121_1698899329.png]\nGóc đỉnh $A$ cạnh $AH, AK$ có số đo là: {}$^\\circ$\nGóc đỉnh $K$ cạnh $KA, KH$ có số đo là: {}$^\\circ$",
      blanks: ["50", "60"],
    },
    {
      type: "fill",
      skill: "Đo góc. Đơn vị đo góc",
      content: "Sử dụng thước đo góc, số đo góc tạo bởi hai kim đồng hồ khi đồng hồ chỉ $5$ giờ đúng là: {}$^\\circ$.",
      blanks: ["150"],
    },
    {
      type: "single",
      skill: "Góc nhọn. Góc tù. Góc bẹt",
      content: "Có một bánh xe bằng gỗ đã hỏng (như hình vẽ).\n[I:testckikntt141_1698899329.png]\nGóc tạo bởi nan xe màu xanh và nan xe màu đỏ là:",
      choices: ["Góc tù", "Góc nhọn", "Góc bẹt"],
      correctChoices: [1],
    },
    {
      type: "fill",
      skill: "Số có sáu chữ số. Số 1 000 000",
      content: "Một con cá đang \"nói\" số: Sáu trăm linh ba nghìn hai trăm bốn mươi.\nSố cần điền vào dấu hỏi chấm là: {}.",
      blanks: ["603240"],
    },
    {
      type: "multi",
      skill: "Hàng và lớp",
      content: "Chữ số $6$ trong số $415\\,260$ thuộc hàng nào, lớp nào?",
      choices: ["Lớp đơn vị", "Lớp nghìn", "Hàng chục nghìn", "Hàng chục"],
      correctChoices: [0, 3],
    },
    {
      type: "fill",
      skill: "Các số trong phạm vi lớp triệu",
      content:
        "Bạn Hoa cắt hai mảnh giấy đã ghi hai số thành $4$ mảnh nhỏ như hình sau:\n[U:https://s3.vio.edu.vn/imgTESTCKIKNTT171_1698908538865.png]\nGhép các mảnh nhỏ và cho biết số ghi trên mỗi mảnh giấy ban đầu là số nào?\nTrả lời: $25\\,066$ {} và $17\\,456$ {}.",
      blanks: ["379", "520"],
    },
    {
      type: "single",
      skill: "Làm tròn số đến hàng trăm nghìn",
      content: "Khi làm tròn số $2\\,542\\,687$ đến hàng trăm nghìn, ta thực hiện:",
      choices: ["Làm tròn lên", "Làm tròn xuống"],
      correctChoices: [1],
    },
    {
      type: "fill",
      skill: "Làm tròn số đến hàng trăm nghìn",
      content: "Một chiếc xe đạp giá $2\\,280\\,000$ đồng. Làm tròn giá tiền chiếc xe đạp đến hàng trăm nghìn.\nGiá tiền của chiếc xe đạp là {} đồng.",
      blanks: ["2300000"],
    },
    {
      type: "choose",
      skill: "So sánh các số có nhiều chữ số",
      content: "$5\\,405\\,000$ {} $5\\,000\\,000 + 400\\,000 + 50$.",
      dropdowns: [{ options: [">", "=", "<"], correct: 0 }],
    },
    {
      type: "fill",
      skill: "Làm quen với dãy số tự nhiên",
      content: "Ba số tự nhiên liên tiếp: $96;\\ 97;$ {}.",
      blanks: ["98"],
    },
    {
      type: "fill",
      skill: "Luyện tập chung (Số có nhiều chữ số)",
      content:
        "Rô-bốt dùng $7$ tấm thẻ: $0,\\,0,\\,0,\\,3,\\,5,\\,6,\\,8$ để lập một số có bảy chữ số. Biết rằng lớp nghìn (ba chữ số ở giữa) không chứa chữ số $0$ và chữ số $3$.\nRô-bốt sắp xếp các số lập được theo thứ tự từ bé đến lớn. Hỏi số thứ ba trong dãy số đó là số nào?\nTrả lời: {}.",
      blanks: ["3658000"],
    },
    {
      type: "fill",
      skill: "Yến. Tạ. Tấn",
      content:
        "Biết tổng cân nặng của chim cánh cụt bố và chim cánh cụt mẹ là $90kg$. Tổng cân nặng của chim cánh cụt bố, chim cánh cụt mẹ và chim cánh cụt con là $1$ tạ.\nVậy cân nặng của chim cánh cụt con là: {} $kg$.",
      blanks: ["10"],
    },
    {
      type: "single",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content: "“Ba trăm sáu mươi hai đề-xi-mét vuông” được viết là:",
      choices: ["$362dm^2$", "$362m^2$", "$3\\,602dm^2$", "$362dm$"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content:
        "Chú Ba có ba tấm pin mặt trời hình vuông cạnh $1m$. Chú đã ghép ba tấm pin đó thành một tấm pin hình chữ nhật có chiều dài là $3m$. Diện tích của tấm pin hình chữ nhật đó là:",
      choices: ["$300mm^2$", "$300dm^2$", "$300m^2$", "$300cm^2$"],
      correctChoices: [1],
    },
    {
      type: "fill",
      skill: "Đề-xi-mét vuông. Mét vuông. Mi-li-mét vuông",
      content:
        "Mặt sàn căn phòng của Nam có dạng hình vuông cạnh $4m$. Bố của Nam dự định lát sàn căn phòng bằng các tấm gỗ hình chữ nhật có chiều dài $5dm$ và chiều rộng $1dm$. Hỏi bố cần dùng bao nhiêu tấm gỗ để lát kín sàn căn phòng đó?\nTrả lời: {} tấm gỗ.",
      blanks: ["320"],
    },
    {
      type: "fill",
      skill: "Giây. Thế kỉ",
      content: "$5$ thế kỉ $=$ {} năm.",
      blanks: ["500"],
    },
    {
      type: "fill",
      skill: "Luyện tập chung (Đơn vị đo đại lượng)",
      content:
        "Một chiếc xe chở được nhiều nhất $8$ tạ hàng hóa. Biết trên xe đã có $50$ thùng na bở, mỗi thùng nặng $5kg$. Người ta muốn xếp thêm những thùng na dai lên xe, mỗi thùng cân nặng $6kg$. Hỏi chiếc xe đó có thể chở được thêm nhiều nhất bao nhiêu thùng na dai nữa?\nTrả lời: {} thùng.",
      blanks: ["91"],
    },
    {
      type: "fill",
      skill: "Phép cộng các số có nhiều chữ số",
      content:
        "Trong $1$ phút, vệ tinh màu xanh bay được quãng đường dài $400\\,000m$, vệ tinh màu đỏ bay được quãng đường dài hơn vệ tinh màu xanh là $112\\,000m$. Hỏi trong $1$ phút, vệ tinh màu đỏ bay được quãng đường dài bao nhiêu mét?\nTrả lời: {} $m$.",
      blanks: ["512000"],
    },
    {
      type: "fill",
      skill: "Phép trừ các số có nhiều chữ số",
      content:
        "Trên bảng có ghi số $4\\,250\\,683$. Xóa đi một chữ số bất kì (giữ nguyên thứ tự các chữ số còn lại) để thu được số có sáu chữ số.\nSố lớn nhất có thể nhận được sau khi xóa là {}.\nSố bé nhất có thể nhận được sau khi xóa là {}.\nHiệu của số lớn nhất và số bé nhất vừa tìm được là {}.",
      blanks: ["450683", "250683", "200000"],
    },
    {
      type: "single",
      skill: "Tính chất giao hoán và kết hợp của phép cộng",
      content: "Biết $5\\,412 + 356 = 5\\,768$ khi đó:",
      choices: ["$356+5\\,412=5\\,868$", "$356+5\\,412=5\\,668$", "$356+5\\,412=5\\,768$", "$356+5\\,412=5\\,758$"],
      correctChoices: [2],
    },
    {
      type: "single",
      skill: "Tìm hai số biết tổng và hiệu của hai số đó",
      content:
        "Kẹo mua một cuốn sách tô màu và một hộp chì màu. Giá của hộp chì màu nhiều hơn giá của cuốn sách là $5\\,000$ đồng. Biết khi Kẹo đưa cô bán hàng $2$ tờ $50\\,000$ đồng thì cô bán hàng trả lại Kẹo $5\\,000$ đồng. Hỏi hộp chì màu giá bao nhiêu tiền?",
      choices: ["$45\\,000$ đồng", "$30\\,000$ đồng", "$50\\,000$ đồng", "$35\\,000$ đồng"],
      correctChoices: [2],
    },
    {
      type: "single",
      skill: "Hai đường thẳng vuông góc",
      content:
        "Có ba ống nước A, B, C. Đức cần nối ba ống nước này với nhau: ống A vuông góc với ống B, ống B vuông góc với ống C.\nPhương án nối nào dưới đây phù hợp?",
      choices: ["[I:testckikntt333_1698899329.png]", "[I:testckikntt332_1698899329.png]"],
      correctChoices: [0],
    },
    {
      type: "single",
      skill: "Hai đường thẳng vuông góc",
      content:
        "Đức và các bạn đang chơi vòng quay mặt trời có $8$ ca-bin cách đều nhau; Đức ngồi ở ca-bin trên cùng, bảy ca-bin còn lại đánh số $1$ đến $7$ theo chiều kim đồng hồ.\nBiết Chi ngồi ở ca-bin gắn thanh sắt vuông góc với thanh sắt gắn ca-bin Đức đang ngồi. Hỏi Chi có thể ngồi ở ca-bin nào?",
      choices: ["$2;\\ 6$", "$4;\\ 6$", "$2;\\ 5$", "$1;\\ 7$"],
      correctChoices: [0],
    },
    {
      type: "choose",
      skill: "Hai đường thẳng song song",
      content: "Cho hình sau:\n[I:testckikntt351_1698899329.png]\nHai đoạn thẳng $BC$ và $NM$ {} với nhau.",
      dropdowns: [{ options: ["song song", "vuông góc"], correct: 0 }],
    },
    {
      type: "fill",
      skill: "Hình bình hành. Hình thoi",
      content: "Cho hình bình hành $ABCD$ có cạnh $AB = 5cm$.\nKhi đó độ dài cạnh $CD$ là {}$cm$.",
      blanks: ["5"],
    },
    {
      type: "single",
      skill: "Ôn tập hình học",
      content: "[I:testckikntt371_1698899329.png]\nHình thích hợp đặt vào ô có dấu hỏi chấm là:",
      choices: [
        "[I:testckikntt376_1698899329.png]",
        "[I:testckikntt375_1698899329.png]",
        "[I:testckikntt373_1698899329.png]",
        "[I:testckikntt374_1698899329.png]",
      ],
      correctChoices: [3],
    },
    {
      type: "choose",
      skill: "Xếp hình. Vẽ hình",
      content: "[I:testckikntt381_1698899329.png]\nĐể được hình thoi thì cần vẽ theo các nét đứt màu {}.",
      dropdowns: [{ options: ["đen", "đỏ"], correct: 1 }],
    },
    {
      type: "single",
      skill: "Xếp hình. Vẽ hình",
      content:
        "Biết $A, B, C, D$ là bốn đỉnh của một hình bình hành. Hỏi đỉnh $C$ đã bị con vật nào che mất?\n[U:https://s3.vio.edu.vn/imgTESTCKIKNTT391_1698907569618.png]",
      choices: ["Con cua", "Con bạch tuộc", "Con cá"],
      correctChoices: [1],
    },
    {
      type: "fill",
      skill: "Xếp hình. Vẽ hình",
      content:
        "Bạn Mai đang xếp các khối lập phương giống nhau: một hàng trên có $3$ khối, một hàng dưới có $4$ khối (thẳng hàng với $3$ khối trên và thêm $1$ khối nhô ra), để tạo thành khối hộp chữ nhật. Hỏi bạn Mai phải xếp ít nhất bao nhiêu khối lập phương như thế nữa để tạo thành khối hộp chữ nhật?\nTrả lời: {} khối lập phương.",
      blanks: ["1"],
    },
  ],
};
