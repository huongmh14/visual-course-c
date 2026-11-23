import { createIntroLesson } from "./lesson-intro.js";

export function applyFoundationCurriculum(course) {
  const { modules } = course;
  const [c, stm32, systems] = modules;

  function step(title, body, codeLang, code, nodes, takeaway, cases) {
    return {
      title, body, codeLang, code,
      scene: { type: "flow", nodes },
      callout: { type: "key-idea", label: "CẦN NHỚ", text: takeaway },
      diff: cases.map((text) => ({ op: "+", text })),
      kpis: [], legend: []
    };
  }

  function lesson(id, title, duration, subtitle, steps, quiz) {
    return {
      id, title, duration: duration + " phút", subtitle, level: "Nền tảng", locked: false,
      youllLearn: steps.slice(0, -1).map((s) => s.title),
      steps: steps.map((s, i) => ({
        ...s, id: "s" + (i + 1), badge: i === steps.length - 1 ? "LAB" : "CONCEPT",
        learnUnlock: i < steps.length - 1 ? [i] : [],
        quiz: i === steps.length - 1 ? [quiz] : []
      }))
    };
  }

  c.title = "01. Ôn C cho nhúng";
  const memory = c.lessons.find(({ id }) => id === "b01-memory-types");
  c.lessons = [
    createIntroLesson(),
    lesson("c-types-io", "Kiểu dữ liệu, biến, printf & scanf", 70,
      "T1 N3 · Chọn kiểu theo miền giá trị, nhập và in trên PC, rồi tách phép tính thành hàm dùng được với dữ liệu cảm biến.", [
      step("Chọn kiểu từ miền giá trị",
        "Một biến có kiểu và giá trị. Kiểu cho biết miền giá trị có thể lưu và cách C xử lý giá trị đó. ADC 12 bit có 4096 mã, từ 0 đến 4095, nên một biến uint16_t đủ chứa một mẫu. Thử dự đoán kích thước từng kiểu trước khi chạy.",
        "C · đo kích thước kiểu",
        `#include <stdint.h>
#include <stdio.h>

int main(void) {
    uint16_t raw = 4095;
    printf("raw: %zu byte(s)\\n", sizeof raw);
    printf("int: %zu byte(s)\\n", sizeof(int));
    return 0;
}`,
        [["ADC 12 bit", "0…4095"], ["Kiểu lưu", "uint16_t"], ["Kích thước", "sizeof raw"]],
        "sizeof là toán tử và trả kích thước theo byte của C với kiểu size_t. printf và scanf là hàm thư viện chuẩn khai báo trong <stdio.h>.",
        ["Viết thêm phép đo cho uint8_t, uint16_t và uint32_t.", "Đối chiếu giới hạn của uint8_t với mã ADC lớn nhất. sizeof(int) phụ thuộc hệ biên dịch đích."]),
      step("Đọc và kiểm tra trước khi tính",
        "Trên PC, scanf đọc đầu vào chuẩn. %lf yêu cầu địa chỉ của một biến double để ghi kết quả vào đó. Chỉ dùng biến sau khi scanf trả về 1, tức là đã đọc và gán thành công một giá trị. printf dùng %.2f để hiển thị số thực với hai chữ số sau dấu thập phân.",
        "C · nhập, kiểm tra và in",
        `#include <stdio.h>

int main(void) {
    double celsius;
    if (scanf("%lf", &celsius) != 1) {
        puts("Invalid input");
        return 1;
    }
    printf("%.2f C\\n", celsius);
    return 0;
}`,
        [["Đầu vào", "25.5 hoặc abc"], ["scanf", "1 hoặc 0"], ["Đầu ra", "25.50 C hoặc báo lỗi"]],
        "&celsius cho scanf địa chỉ để ghi. Ở firmware, dữ liệu có thể đến từ bộ đọc cảm biến. Hàm tính nhận giá trị đó làm đối số.",
        ["Nhập 25.5 rồi nhập abc. Dự đoán nhánh chạy trong mỗi trường hợp.", "Thử kết thúc đầu vào trước khi nhập số. Chương trình phải đi vào nhánh báo lỗi."]),
      step("Viết hàm tính từ yêu cầu",
        "Yêu cầu là nhận nhiệt độ °C và trả về °F. Viết đầu vào, kiểu trả về và công thức F = C × 9/5 + 32 trước khi viết thân hàm. Tính tay với 100 °C. Nếu viết (9 / 5), phép chia nguyên cho 1 trước khi nhân, nên kết quả sai là 132 °F.",
        "C · hàm đổi nhiệt độ",
        `double celsius_to_fahrenheit(double celsius) {
    return celsius * (9.0 / 5.0) + 32.0;
}`,
        [["Đầu vào", "100 °C"], ["Tính", "100 × 1.8 + 32"], ["Giá trị trả về", "212 °F"]],
        "Giữ scanf và printf trong main. Gọi cùng một hàm tính từ bài kiểm thử hoặc khi nhận giá trị của cảm biến.",
        ["0 °C → 32 °F, 100 °C → 212 °F, −40 °C → −40 °F.", "Trong main, thay giá trị in bằng kết quả gọi celsius_to_fahrenheit(celsius)."]),
      step("Tính cả miền giá trị của tổng",
        "Trước khi viết hàm trung bình, liệt kê đầu vào, đầu ra và các bước trung gian. Ba mẫu uint16_t có tổng tối đa 196605 nên cần kiểu rộng hơn cho tổng. Bên trong hàm, đổi kiểu toán hạng đầu trước khi cộng để biểu thức có đủ miền giá trị cả trên đích có int 16 bit.",
        "C · tính tổng rộng hơn kiểu mẫu",
        `uint32_t sum = (uint32_t)a + b + c;
double integer_result = 5 / 3;
double fractional_result = 5 / 3.0;`,
        [["Ba mẫu", "1, 2, 2"], ["Tổng", "5"], ["Chia thực", "1.666…"]],
        "Gán vào double sau phép chia nguyên chỉ đổi kiểu của kết quả đã mất phần lẻ. Dùng 3.0 để giữ phần lẻ khi chia tổng.",
        ["Với ba mẫu 65535, tổng là 196605 và trung bình là 65535.", "Áp dụng cùng cách tính cho ba mẫu ADC 12 bit như 0, 2048 và 4095."]),
      step("Thực hành · viết ba chương trình và tự kiểm tra",
        "Viết types.c để in kích thước kiểu, temperature.c để đọc và đổi nhiệt độ, average.c để đọc ba số và in trung bình. Với mỗi file, ghi một ca thường, một ca biên và đầu ra mong đợi trước khi chạy. Trong average.c, viết average3 cho ba số thực, rồi thử biến thể average_adc3 với dữ liệu mẫu giả lập.",
        "C · chữ ký bài tập",
        `double celsius_to_fahrenheit(double celsius);
double average3(double a, double b, double c);
double average_adc3(uint16_t a, uint16_t b, uint16_t c);`,
        [["Dự đoán", "kiểu, miền và đầu ra"], ["Viết", "nhập → hàm → in"], ["Kiểm tra", "đối chiếu rồi commit"]],
        "Biên dịch từng file với -std=c17 -Wall -Wextra -Wpedantic. Commit khi cả ba file đều qua các ca thử và biên dịch không cảnh báo.",
        ["types.c: in sizeof của int, uint8_t, uint16_t và uint32_t. Giải thích chọn kiểu nào cho một mẫu ADC 12 bit.",
          "temperature.c: thử 0, 100, −40 và abc. Mỗi đầu vào hợp lệ in đúng °F, abc báo lỗi.",
          "average.c: dùng scanf với ba %lf và kiểm tra giá trị trả về là 3. Thử 1 2 2 → 1.67, -1 0 1 → 0.00, 1 x 2 → báo lỗi.",
          "Thử gọi average_adc3(65535, 65535, 65535) và kiểm tra kết quả là 65535."])
    ], {
      prompt: "Tổng nguyên sum = 5. Biểu thức nào giữ lại phần lẻ của trung bình?",
      options: ["(double)(sum / 3)", "sum / 3.0", "sum / 3"], correctIndex: 1,
      explain: "Toán hạng 3.0 làm phép chia dùng số thực. Ép kiểu sau khi chia nguyên không khôi phục phần lẻ."
    }),
    lesson("c-control-flow", "If, switch, vòng lặp & máy trạng thái", 45,
      "Theo dõi điều kiện, chỉ số và trạng thái qua từng bước trước khi đưa logic lên vi điều khiển.", [
      step("Đọc điều kiện theo thứ tự thực thi",
        "Trong C, 0 là sai và giá trị khác 0 là đúng. Với &&, chỉ khi vế trái đúng thì vế phải mới chạy. Dùng quy tắc này để kiểm tra mẫu hợp lệ trước khi tính tỷ lệ.",
        "C · phân loại mẫu",
        "uint16_t sample = 740;\nuint16_t limit = 1000;\nbool high = limit != 0 && (uint32_t)sample * 100 / limit >= 70;",
        [["Mẫu", "740 / 1000"], ["Kiểm tra", "limit ≠ 0"], ["Cảnh báo", "74% ≥ 70%"]],
        "Khi limit bằng 0, C bỏ qua toàn bộ vế phải. Ép kiểu trước phép nhân để phép tính đủ rộng.",
        ["Đổi limit thành 0 và dự đoán high.", "Dùng <stdbool.h> và <stdint.h> cho các kiểu trong ví dụ."]),
      step("Đi qua mảng theo từng mẫu",
        "Vòng for kiểm tra điều kiện trước mỗi lượt. Với 3 phần tử, điều kiện i < n chỉ cho phép các chỉ số 0, 1, 2. Mỗi lượt có thể xử lý một mẫu rồi chuyển sang lượt tiếp theo.",
        "C · đếm mẫu vượt ngưỡng",
        "uint16_t samples[] = {690, 700, 740};\nsize_t n = sizeof samples / sizeof samples[0];\nsize_t high_count = 0;\nfor (size_t i = 0; i < n; ++i) {\n    if (samples[i] >= 700) ++high_count;\n}",
        [["Chỉ số 0", "690 → bỏ qua"], ["Chỉ số 1", "700 → đếm"], ["Chỉ số 2", "740 → đếm"]],
        "Phép sizeof để tính số phần tử áp dụng tại nơi còn thấy đối tượng mảng. Dùng size_t từ <stddef.h>.",
        ["Kết quả high_count là 2.", "Với n = 0, thân vòng lặp chạy 0 lần."]),
      step("While, do while và giới hạn chờ",
        "while kiểm tra trước mỗi lượt, nên có thể chạy 0 lần. do while kiểm tra cuối lượt, nên luôn chạy ít nhất một lần. Ví dụ đọc một cờ trước rồi cho phép thử lại đến khi đủ 4 lần đọc.",
        "C · đọc cờ có giới hạn",
        "unsigned tries = 0;\nbool ready;\ndo {\n    ready = read_ready();\n    ++tries;\n} while (!ready && tries < 4);\n// ready == false sau vòng lặp: đã chạm giới hạn thử.",
        [["Đọc lần đầu", "tries = 1"], ["Kiểm tra", "!ready && tries < 4"], ["Kết thúc", "sẵn sàng hoặc hết lượt"]],
        "Giới hạn lượt đọc giúp thoát khi phần cứng chưa phản hồi. Trong superloop, có thể đọc một lần mỗi lượt và dùng mốc thời gian để các việc khác tiếp tục chạy.",
        ["Giả lập read_ready() trả true ngay: 1 lần đọc.", "Giả lập luôn trả false: đúng 4 lần đọc."]),
      step("Switch chọn hành vi theo trạng thái",
        "Một lần gọi hàm xử lý một sự kiện và trả về trạng thái kế tiếp. Vòng lặp firmware có thể gọi hàm cho mỗi mẫu. return kết thúc hàm ngay tại nhánh được chọn.",
        "C · chuyển trạng thái",
        "enum State { WAIT, ALERT };\nenum State next_state(enum State state, unsigned sample) {\n    switch (state) {\n        case WAIT:  return sample >= 700 ? ALERT : WAIT;\n        case ALERT: return sample < 650 ? WAIT : ALERT;\n        default:    return WAIT;\n    }\n}",
        [["WAIT", "mẫu = 700"], ["Điều kiện", "mẫu ≥ 700"], ["ALERT", "giữ đến khi < 650"]],
        "Hai ngưỡng 700 và 650 tạo vùng trễ, giúp trạng thái ổn định khi mẫu dao động quanh 700.",
        ["WAIT, 699 → WAIT", "WAIT, 700 → ALERT", "ALERT, 650 → ALERT", "ALERT, 649 → WAIT"]),
      step("Thực hành · ôn 4 bài C và viết cảnh báo",
        "Chạy lại FizzBuzz, kiểm tra số nguyên tố, bảng cửu chương và máy tính switch trong c-nhung/day-05-if-switch-loop. Sau đó tự viết next_state, dùng for đưa từng mẫu vào hàm rồi in trạng thái tương ứng.",
        "C · dữ liệu kiểm thử",
        "unsigned samples[] = {699, 700, 680, 650, 649};\n// Bắt đầu từ WAIT. Gọi next_state cho từng mẫu.",
        [["Chuỗi mẫu", "699, 700, 680…"], ["next_state", "mỗi mẫu một lượt"], ["Kết quả", "so với bảng test"]],
        "Chạy trên PC bằng GCC với -std=c17 -Wall -Wextra -Wpedantic. Dùng assert hoặc so sánh kết quả in ra.",
        ["Chuỗi kỳ vọng: WAIT, ALERT, ALERT, ALERT, WAIT.", "FizzBuzz: 15 → FizzBuzz. Prime: 1 sai, 2 đúng, 9 sai.", "Bảng cửu chương: 9 × 9 = 81. Máy tính: 6 / 2 = 3; chia 0 phải báo lỗi."])
    ], {
      prompt: "Đang ở ALERT, nhận mẫu 670. Trạng thái mới là gì?",
      options: ["WAIT", "ALERT", "Lỗi vì 670 < 700"],
      correctIndex: 1, explain: "Trong ALERT, chỉ mẫu dưới 650 mới đưa hệ thống về WAIT."
    }),
    memory,
    lesson("b02-bitwise", "Bitwise & mặt nạ bit", 30,
      "Đọc và thay đổi đúng bit trong thanh ghi giả lập bằng phép toán trên số nguyên.", [
      step("Mỗi bit biểu diễn một cờ",
        "Bit 0 ở bên phải. Giá trị 1u << 2 đưa bit 1 đến vị trí 2. Phép & giữ lại những vị trí cùng bằng 1 ở cả hai toán hạng.",
        "C · kiểm tra cờ",
        "unsigned reg = 0x05u;\nunsigned mask = 1u << 2;\nbool is_set = (reg & mask) != 0;",
        [["reg", "0000 0101"], ["mask", "0000 0100"], ["AND", "0000 0100"]],
        "Đặt ngoặc quanh phép & trước khi so sánh. Kiểm tra chỉ số bit trước khi dịch nếu chỉ số đến từ dữ liệu nhập.",
        ["Bit 2 đang bật. Dùng mặt nạ bit 1 thì kết quả bằng 0."]),
      step("Giữ nguyên các bit khác khi cập nhật",
        "Dùng OR để đặt bit, AND với mặt nạ đảo để xóa bit, XOR để đảo bit. Cả ba cập nhật trên thanh ghi giả lập đều đọc giá trị cũ trước khi tạo giá trị mới.",
        "C · cập nhật thanh ghi giả lập",
        "unsigned reg = 0x80u;\nconst unsigned mask = 1u << 2;\nreg |= mask;   // 0x84\nreg ^= mask;   // 0x80\nreg &= ~mask;  // 0x80",
        [["Ban đầu", "0x80"], ["Đặt bit 2", "0x84"], ["Đảo bit 2", "0x80"]],
        "Với MMIO thật, tra datasheet về kiểu truy cập của từng bit. Có thanh ghi dùng ghi 1 để xóa cờ hoặc dùng thanh ghi SET/CLEAR riêng.",
        ["Bit 7 giữ nguyên qua cả ba lệnh."]),
      step("Thực hành · bộ cờ cho ba ngoại vi",
        "Dùng bit 0 cho LED, bit 1 cho buzzer và bit 2 cho logging. Viết hàm đặt, xóa và đọc cờ trên một từ unsigned. So sánh toàn bộ giá trị với bảng test để phát hiện thay đổi ngoài ý muốn.",
        "C · mẫu kiểm thử",
        "unsigned flags = 0x80u;\nconst unsigned led = 1u << 0;\nconst unsigned logging = 1u << 2;\n// Đặt LED, đặt logging, xóa LED và kiểm tra sau mỗi lệnh.",
        [["0x80", "ban đầu"], ["0x85", "đã đặt hai cờ"], ["0x84", "đã xóa LED"]],
        "Dùng assert(flags == 0x84u) sau bước cuối để kiểm tra cả bit 7 lẫn các cờ.",
        ["Giá trị sau từng thao tác: 0x81 → 0x85 → 0x84.", "Đọc LED: false. Đọc logging: true."])
    ], {
      prompt: "Với reg = 0x03 và mask = 0x01, reg &= ~mask cho kết quả gì?",
      options: ["0x00", "0x01", "0x02"], correctIndex: 2, explain: "Bit 0 bị xóa, bit 1 vẫn bật."
    }),
    lesson("b03-pointers-mmio", "Hàm, mảng & con trỏ", 35,
      "Theo dõi đối tượng, địa chỉ và độ dài khi truyền bộ đệm vào một hàm C.", [
      step("Hàm nhận một bản sao của đối số",
        "C truyền đối số theo giá trị. Khi đối số là &flag, hàm nhận bản sao địa chỉ. Phép *dst ghi vào đúng đối tượng mà con trỏ trỏ đến.",
        "C · truyền địa chỉ",
        "void enable(unsigned *dst) {\n    *dst |= 1u;\n}\n// Trong main:\n// unsigned flag = 0;\n// enable(&flag);",
        [["flag", "giá trị 0"], ["dst", "giữ địa chỉ &flag"], ["*dst", "ghi flag thành 1"]],
        "Chỉ giải tham chiếu con trỏ hợp lệ đến đối tượng còn sống. Hợp đồng của enable yêu cầu dst trỏ tới unsigned có thể ghi.",
        ["Nếu enable chỉ nhận unsigned rồi sửa tham số, flag của bên gọi vẫn là 0."]),
      step("Kích thước mảng là một phần của hợp đồng hàm",
        "Trong tham số, const uint16_t samples[] được điều chỉnh thành con trỏ. Hàm cần đối số n để biết có thể truy cập bao nhiêu phần tử. const cấm sửa mẫu qua con trỏ này.",
        "C · tìm mẫu lớn nhất",
        "uint16_t peak(const uint16_t *samples, size_t n) {\n    uint16_t max = 0;\n    for (size_t i = 0; i < n; ++i) {\n        if (samples[i] > max) max = samples[i];\n    }\n    return max;\n}",
        [["Bộ đệm", "{100, 740, 690}"], ["Con trỏ + n", "địa chỉ đầu, n = 3"], ["peak", "740"]],
        "Caller chịu trách nhiệm cung cấp ít nhất n phần tử hợp lệ. Hợp đồng ví dụ trả về 0 khi n bằng 0.",
        ["Dùng <stdint.h> và <stddef.h>.", "peak(NULL, 0) trả 0; vòng lặp không đọc bộ nhớ."]),
      step("Thực hành · xử lý bộ đệm ADC",
        "Tự viết hàm đếm mẫu >= ngưỡng. Truyền con trỏ, chiều dài và ngưỡng. Dùng const cho dữ liệu vào, rồi thử cả bộ đệm rỗng và một phần của bộ đệm.",
        "C · chữ ký bài tập",
        "size_t count_high(const uint16_t *samples, size_t n,\n                  uint16_t threshold);",
        [["Mẫu", "600, 700, 800"], ["Ngưỡng", "700"], ["Kết quả", "2 mẫu đạt"]],
        "Thử truyền samples + 1 với n = 1 để kiểm tra hàm tôn trọng phạm vi mà caller cung cấp.",
        ["{600, 700, 800}, n = 3, threshold = 700 → 2.", "Cùng mảng, n = 1 → 0.", "samples + 1, n = 1 → 1. NULL, n = 0 → 0."])
    ], {
      prompt: "Bên trong hàm, sizeof(samples) với tham số const uint16_t *samples đo gì?",
      options: ["Số phần tử", "Kích thước con trỏ", "Số byte toàn bộ mảng"], correctIndex: 1,
      explain: "Tham số samples có kiểu con trỏ. Bên gọi truyền riêng n."
    }),
    lesson("b04-struct-union", "Struct, padding & gói tin", 30,
      "Gom dữ liệu liên quan trong RAM và tự quy định thứ tự byte khi truyền UART.", [
      step("Struct mô tả dữ liệu trong chương trình",
        "Compiler có thể chèn padding giữa hoặc sau các thành viên để đáp ứng yêu cầu căn chỉnh. Dùng sizeof và offsetof để xem bố cục thực trên hệ đang biên dịch.",
        "C · quan sát bố cục",
        "struct Sample {\n    uint8_t kind;\n    uint16_t raw;\n};\n// Dùng <stddef.h> cho offsetof.\n// Đo sizeof(struct Sample) và offsetof(struct Sample, raw).",
        [["kind", "1 byte"], ["Padding", "ABI quyết định"], ["raw", "2 byte"]],
        "Quy tắc alignment phụ thuộc hệ đích. Hai thành viên tổng 3 byte có thể tạo struct 4 byte.",
        ["In sizeof và offsetof bằng %zu.", "union dùng vùng nhớ chung cho các thành viên; struct cấp chỗ cho từng thành viên."]),
      step("Ghi từng byte theo giao thức",
        "Giao thức mẫu yêu cầu ba byte: loại, byte cao, byte thấp. Dịch phải để lấy byte cao; phép chuyển sang uint8_t lấy 8 bit thấp cho byte cuối.",
        "C · đóng gói khung",
        "void encode(struct Sample s, uint8_t out[3]) {\n    out[0] = s.kind;\n    out[1] = (uint8_t)(s.raw >> 8);\n    out[2] = (uint8_t)s.raw;\n}",
        [["kind", "0x01"], ["raw", "0x1234"], ["UART", "01 12 34"]],
        "Caller phải cung cấp chỗ ghi ít nhất 3 byte. Hàm mô tả thứ tự truyền trực tiếp, độc lập với endian và padding của struct.",
        ["raw = 0x00FF → 00 FF.", "raw = 0xFF00 → FF 00."]),
      step("Thực hành · nhận gói UART 3 byte",
        "Viết hàm giải mã const uint8_t *in và size_t n. Trả false nếu n khác 3 hoặc con trỏ đầu vào/đầu ra là NULL. Khi thành công, ghép byte cao, thấp và lưu vào struct Sample.",
        "C · chữ ký bài tập",
        "bool decode(const uint8_t *in, size_t n, struct Sample *out);\n// Gợi ý: raw = (uint16_t)(((uint32_t)in[1] << 8) | in[2]);",
        [["Gói vào", "01 12 34"], ["Độ dài", "3 byte"], ["Kết quả", "kind=1, raw=0x1234"]],
        "Kiểm tra n trước khi đọc in[1] và in[2]. Sau đó thử encode rồi decode cùng một đối tượng.",
        ["01 12 34 → true, kind = 1, raw = 0x1234.", "Gói 2 hoặc 4 byte → false. Gói hợp lệ với con trỏ NULL → false."])
    ], {
      prompt: "Vì sao gửi nguyên struct Sample có thể tạo khung sai?",
      options: ["Vì UART chỉ nhận ký tự", "Vì padding và thứ tự byte có thể khác giao thức", "Vì uint16_t luôn chiếm 4 byte"],
      correctIndex: 1, explain: "Giao thức quy định vị trí và thứ tự byte. Bố cục struct do ABI và compiler quyết định."
    }),
    lesson("b05-volatile-storage", "Vòng đời biến, volatile & super-loop", 35,
      "Phân biệt biến sống qua nhiều lần gọi, truy cập ngoại vi và xử lý thời gian không chặn.", [
      step("Biến static cục bộ giữ giá trị giữa các lần gọi",
        "Scope xác định nơi có thể dùng tên. Thời gian sống xác định khi nào đối tượng tồn tại. Biến ticks ở đây có scope trong hàm và tồn tại suốt quá trình chạy.",
        "C · bộ đếm số lần gọi",
        "unsigned calls(void) {\n    static unsigned ticks;\n    return ++ticks;\n}",
        [["Gọi lần 1", "1"], ["Gọi lần 2", "2"], ["Gọi lần 3", "3"]],
        "Vị trí vật lý của biến phụ thuộc công cụ và cấu hình liên kết. Xem map file để biết đối tượng thực sự nằm ở đâu.",
        ["Đổi static unsigned ticks; thành unsigned ticks = 0; thì mỗi lần đều trả 1."]),
      step("Volatile và thanh ghi ngoại vi",
        "Cần đọc lại thanh ghi trạng thái mỗi vòng vì phần cứng có thể thay đổi nó. Khi kiểu thanh ghi do nhà sản xuất cung cấp có volatile, compiler phải thực hiện các truy cập theo quy tắc volatile của hệ triển khai.",
        "C · kiểm tra một lần",
        "bool ready(const volatile uint32_t *status) {\n    return (*status & 1u) != 0;\n}",
        [["Ngoại vi", "cập nhật trạng thái"], ["CPU", "đọc *status"], ["Firmware", "kiểm tra bit 0"]],
        "volatile không bảo đảm nguyên tử và không thay thế đồng bộ. Dùng định nghĩa thanh ghi từ header của MCU khi chuyển sang phần cứng.",
        ["Thử hàm trên PC với một đối tượng volatile uint32_t trong RAM; khi chạy thật dùng địa chỉ do MCU quy định."]),
      step("Thực hành · bật LED theo tick không chặn",
        "Mô phỏng tick 32 bit tăng theo mili giây. Viết hàm kiểm tra đã đủ 100 ms từ lần cập nhật trước bằng phép trừ modulo, sau đó đảo trạng thái LED và cập nhật last. Gọi hàm một lần cho mỗi tick mẫu.",
        "C · công thức cho bài tập",
        "uint32_t elapsed = (uint32_t)(now - last);\n// Xử lý LED khi elapsed >= 100; tiếp tục xử lý nút ở vòng sau.",
        [["last", "UINT32_MAX − 49"], ["now", "50"], ["elapsed", "100 ms"]],
        "Phép trừ modulo biểu diễn đúng khoảng đã trôi qua nếu khoảng thực ngắn hơn một chu kỳ đầy đủ của bộ đếm.",
        ["last=0: now=99 → giữ, now=100 → đảo.", "last=UINT32_MAX−49: now=49 → giữ, now=50 → đảo.", "Sau khi đảo tại now=100, gọi lại với now=100 → giữ."])
    ], {
      prompt: "volatile có bảo đảm phép count++ chạy nguyên tử giữa hai ngữ cảnh không?",
      options: ["Có", "Không"], correctIndex: 1, explain: "count++ gồm đọc, tính và ghi. Cần cơ chế đồng bộ phù hợp."
    })
  ];

  memory.steps.push({
    ...step("Thực hành · tách byte trước khi gửi",
      "Tự viết hàm ghi số uint16_t ra mảng hai byte theo thứ tự thấp trước. Sau đó tăng biến uint8_t từ 250 thêm 10 và giải thích vì sao kết quả cuối là 4.",
      "C · chữ ký bài tập",
      "void write_le16(uint16_t value, uint8_t bytes[2]);",
      [["Giá trị", "0x1234"], ["bytes[0]", "0x34"], ["bytes[1]", "0x12"]],
      "Dùng phép dịch và ép kiểu để biểu diễn thứ tự byte mà giao thức yêu cầu.",
      ["0x0000 → 00 00.", "0x1234 → 34 12.", "0xFFFF → FF FF."]),
    id: "s11", badge: "LAB"
  });

  modules.splice(1, 0, {
    id: "mod-electronics", title: "02. Điện tử cho nhúng", color: "#88b7dd",
    lessons: [
      lesson("e-led-ohm", "Điện áp, dòng điện & LED", 30,
        "Dùng định luật Ohm để chọn điện trở hạn dòng và kiểm tra mạch LED DC 3,3 V.", [
        step("Đo điện áp giữa hai điểm",
          "Lấy GND làm mốc 0 V. Điện áp là chênh lệch giữa hai điểm. Dòng qua LED chỉ có đường đi khi mạch kín và LED phân cực thuận.",
          "Sơ đồ nối dây",
          "+3,3 V ── 330 Ω ── anode LED | cathode ── GND",
          [["+3,3 V", "nguồn DC"], ["330 Ω + LED", "mắc nối tiếp"], ["GND", "đường về nguồn"]],
          "Đo điện áp bằng đồng hồ ở chế độ DC V, hai que đặt song song với phần tử cần đo.",
          ["Ngắt nguồn trước khi thay dây. Dùng nguồn DC thấp áp cho các bài lắp mạch."]),
        step("Tính dòng qua điện trở",
          "Giả sử LED đỏ có Vf xấp xỉ 2,0 V ở dòng đang xét. Điện trở chịu phần chênh 3,3 − 2,0 = 1,3 V. Với 330 Ω, dòng xấp xỉ 3,9 mA.",
          "Tính toán",
          "V_R = V_nguồn − V_f\nI = V_R / R = 1,3 V / 330 Ω ≈ 3,9 mA",
          [["Nguồn", "3,3 V"], ["LED", "≈ 2,0 V"], ["Điện trở", "1,3 V → 3,9 mA"]],
          "Vf và điện áp chân GPIO thay đổi theo dòng. Khi chuyển sang điều khiển bằng GPIO, kiểm tra thông số điện DC của chân và của cả nhóm chân.",
          ["Với giả thiết Vf không đổi: 220 Ω → 5,9 mA; 470 Ω → 2,8 mA."]),
        step("Thực hành · đo sụt áp và suy ra dòng",
          "Tính trước VR, sau đó dùng mô phỏng mạch hoặc lắp LED đỏ và điện trở 330 Ω với nguồn 3,3 V. Đo điện áp hai đầu điện trở, rồi tính dòng từ số đo thực tế.",
          "Bảng ghi kết quả",
          "VR dự đoán ≈ 1,3 V\nVR đo được = ____ V\nI suy ra = VR đo được / 330 Ω",
          [["Dự đoán", "VR ≈ 1,3 V"], ["Đo VR", "hai đầu điện trở"], ["Suy ra I", "I = VR / R"]],
          "Ghi cả Vf và VR để kiểm tra tổng sụt áp quanh vòng mạch xấp xỉ điện áp nguồn.",
          ["So sánh dòng với dự đoán 3,9 mA; giải thích sai lệch bằng Vf thực, nguồn và dung sai điện trở."])
      ], {
        prompt: "Giữ nguyên nguồn và LED. Tăng điện trở nối tiếp từ 330 Ω lên 470 Ω thì dòng thường thế nào?",
        options: ["Tăng", "Giảm", "Giữ nguyên"], correctIndex: 1, explain: "Điện trở lớn hơn làm giảm dòng qua mạch nối tiếp."
      }),
      lesson("e-gpio-button", "GPIO, pull-up & nút nhấn", 35,
        "Biến điện áp tại chân GPIO thành một sự kiện nhấn đáng tin cậy.", [
        step("Pull-up giữ chân ở mức xác định",
          "Nối chân input lên 3,3 V qua điện trở 10 kΩ. Nút nhấn nối chân ấy xuống GND. Khi nhả nút, chân lên mức cao; khi nhấn, chân xuống mức thấp.",
          "Sơ đồ nút active-low",
          "3,3 V ── 10 kΩ ──●── nút ── GND\n                 └── GPIO input",
          [["Nhả nút", "pull-up kéo lên"], ["GPIO", "đọc HIGH"], ["Firmware", "pressed = false"]],
          "Input hở không có mức logic đáng tin cậy. Ngưỡng LOW và HIGH được quy định trong datasheet MCU.",
          ["Nhấn → LOW. Nhả → HIGH.", "Khi nhấn, dòng qua điện trở xấp xỉ 3,3 V / 10 kΩ = 0,33 mA."]),
        step("Chống dội bằng các mẫu liên tiếp",
          "Tiếp điểm cơ có thể đổi mức nhiều lần trong vài mili giây. Lấy một mẫu mỗi 5 ms và chỉ công nhận trạng thái mới sau 3 mẫu liên tiếp giống nhau.",
          "Chuỗi đo active-low",
          "Mốc (ms):  0  5  10  15  20  25\nGPIO:      1  0   1   0   0   0",
          [["5–10 ms", "0 rồi 1 → dội"], ["15–25 ms", "0, 0, 0"], ["25 ms", "phát sự kiện nhấn"]],
          "Khi mẫu đổi, đặt lại bộ đếm. Chỉ phát sự kiện khi trạng thái đã lọc chuyển từ nhả sang nhấn.",
          ["Nếu GPIO giữ 0 sau 25 ms, chỉ có một sự kiện nhấn."]),
        step("Thực hành · một lần nhấn, một lần đổi đèn",
          "Viết bộ lọc bằng C chạy trên PC. Bắt đầu ở trạng thái nhả và cho chuỗi GPIO 0/1 đi qua bộ lọc. Đảo trạng thái LED đúng một lần cho mỗi lần nhấn đã lọc.",
          "C · dữ liệu kiểm thử",
          "unsigned raw[] = {1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0};",
          [["Mẫu GPIO", "0 = đang nhấn"], ["Bộ lọc", "3 mẫu liên tiếp"], ["LED", "đảo 2 lần"]],
          "Khi có board, dùng chung GND, cấu hình chân làm input và đo điện áp lúc nhấn/nhả trước khi kiểm tra phần mềm.",
          ["Chuỗi mẫu: 2 lần nhấn, sự kiện ở chỉ số 5 và 12.", "Chuỗi toàn 1 hoặc 1,0,1,0,1: không có sự kiện."])
      ], {
        prompt: "Trong mạch pull-up, nhấn nút nối GPIO xuống GND sẽ đọc gì?",
        options: ["HIGH", "LOW", "Luôn không xác định"], correctIndex: 1,
        explain: "Nút đóng tạo đường nối từ chân input xuống GND, nên đọc LOW."
      }),
      lesson("e-divider-adc", "Chia áp, ADC & đo điện áp", 35,
        "Tính điện áp tại chân ADC và quy đổi mã số thành một ước lượng điện áp.", [
        step("Hai điện trở tạo ra một nút giữa",
          "Với 10 kΩ phía nguồn và 10 kΩ phía GND, điện áp nút giữa xấp xỉ bằng một nửa Vin nếu tải ở nút giữa đủ nhỏ. Dùng Vin từ 0 đến 3,3 V cho bài mô phỏng này.",
          "Sơ đồ chia áp",
          "Vin ── 10 kΩ ──●── 10 kΩ ── GND\n               └── ADC",
          [["Vin", "3,30 V"], ["Hai điện trở", "tỷ lệ 1/2"], ["ADC", "Vout ≈ 1,65 V"]],
          "Khi gắn ADC thật, kiểm tra dải đầu vào và trở kháng nguồn theo datasheet. Với hai điện trở 10 kΩ, trở kháng Thévenin là 5 kΩ.",
          ["Vin = 0 V → Vout = 0 V.", "Vin = 2,0 V → Vout ≈ 1,0 V."]),
        step("ADC biến điện áp thành một mã nguyên",
          "ADC 12 bit có 4096 mã từ 0 đến 4095. Với Vref = 3,3 V, mã gần 2048 tương ứng khoảng 1,65 V. Dùng ánh xạ hai đầu thang để ước lượng mV trong ví dụ.",
          "C · ước lượng mV tại chân ADC",
          "uint32_t adc_mv(uint16_t code) {\n    return ((uint32_t)code * 3300u + 2047u) / 4095u;\n}",
          [["Tín hiệu vào", "≈ 1,65 V"], ["ADC 12 bit", "≈ 2048"], ["Firmware", "≈ 1650 mV"]],
          "4095 là mã cực đại. Bề rộng một bước lượng tử lý tưởng là Vref / 4096. Kết quả trên board còn phụ thuộc Vref thực, sai số ADC và thời gian lấy mẫu.",
          ["Hợp đồng: code nằm trong 0..4095.", "2048 → 1650 mV theo công thức."]),
        step("Thực hành · so bảng tính với số đo",
          "Dùng C viết hàm adc_mv và kiểm tra ba đầu vào. Nếu có board, lắp bộ chia áp từ 3,3 V và đo nút giữa bằng đồng hồ; so sánh với điện áp tính từ mã ADC.",
          "Dữ liệu kiểm thử",
          "code =    0 →    0 mV\ncode = 2048 → 1650 mV\ncode = 4095 → 3300 mV",
          [["Dữ liệu thử", "0, 2048, 4095"], ["Quy đổi", "mã → mV"], ["Đối chiếu", "đồng hồ nếu có"]],
          "Ghi rõ bạn đang so Vout tại chân ADC. Nếu suy ngược Vin của bộ chia 1/2, nhân Vout đã quy đổi với 2.",
          ["Kiểm tra kết quả tăng theo mã.", "Phần lắp mạch: so sánh số đo và nêu một nguyên nhân nếu có chênh lệch."])
      ], {
        prompt: "Nếu bộ chia 1/2 cho Vout = 1,65 V, Vin xấp xỉ bằng bao nhiêu?",
        options: ["0,825 V", "1,65 V", "3,30 V"], correctIndex: 2,
        explain: "Vout bằng một nửa Vin với hai điện trở bằng nhau và tải đủ nhỏ."
      }),
      lesson("e-pwm", "PWM, tần số & điều khiển LED", 35,
        "Từ dạng xung tới một chương trình mô phỏng chỉnh sáng LED bằng ADC và nút nhấn.", [
        step("Một chu kỳ có phần bật và phần tắt",
          "PWM đổi thời gian ở mức cao trong mỗi chu kỳ. Với chu kỳ 1 ms và thời gian cao 0,25 ms, tần số là 1 kHz và duty là 25%. Mức cao của xung vẫn gần 3,3 V trong ví dụ.",
          "Dạng xung PWM 25%",
          "    ┌──┐       ┌──┐\n────┘  └───────┘  └───────\n    ←  1 ms   →",
          [["Mức cao", "250 µs"], ["Mức thấp", "750 µs"], ["Chu kỳ", "1 ms / 1 kHz"]],
          "LED kèm điện trở nối tiếp có thể thay đổi độ sáng bằng PWM. Độ sáng cảm nhận không nhất thiết tỷ lệ tuyến tính với duty.",
          ["Duty 0%: luôn thấp. Duty 100%: luôn cao."]),
        step("Đổi giá trị ADC thành số tick mức cao",
          "Giả lập timer đếm 0..999. Nếu đầu ra cao khi counter < on_ticks thì on_ticks bằng 250 cho duty 25%. Giá trị 1000 bảo đảm bật trong toàn chu kỳ của mô hình.",
          "C · PWM giả lập",
          "uint32_t on_ticks(uint16_t adc) {\n    return ((uint32_t)adc * 1000u + 2047u) / 4095u;\n}",
          [["ADC", "2048 / 4095"], ["Thời gian cao", "500 / 1000 tick"], ["Duty", "50%"]],
          "Với timer thật, tra chế độ so sánh và cách xử lý hai đầu thang 0% và 100% trong tài liệu MCU.",
          ["ADC 0 → 0 tick; 2048 → 500 tick; 4095 → 1000 tick."]),
        step("Thực hành tổng hợp · chỉnh sáng có nút bật/tắt",
          "Trên PC, kết hợp 3 khối: lấy mẫu nút active-low và chống dội, lưu trạng thái bật/tắt, đổi ADC thành duty PWM. Đếm số tick mức cao trong một chu kỳ giả lập để xác nhận kết quả.",
          "C · điều kiện đầu ra mỗi tick",
          "bool high = enabled && counter < on_ticks(adc);",
          [["Nút + ADC", "mẫu số"], ["C xử lý", "lọc, trạng thái, duty"], ["LED", "tick cao / 1000"]],
          "Khởi tạo enabled = false. Khi chuyển sang board, đo dạng xung nếu có thiết bị và dùng điện trở nối tiếp với LED.",
          ["ADC 2048, đang tắt → 0 tick cao.", "Nhấn đã lọc, ADC 2048 → 500 tick cao.", "Giữ nút → vẫn 500. Nhấn lần nữa → 0 tick cao."])
      ], {
        prompt: "Chu kỳ 1 ms, tín hiệu cao 0,75 ms. Duty là bao nhiêu?",
        options: ["25%", "75%", "100%"], correctIndex: 1,
        explain: "Duty = thời gian mức cao / chu kỳ = 0,75 / 1 = 75%."
      })
    ]
  });
  stm32.title = "03. STM32 & ARM Cortex-M";
  systems.title = "04. Hệ thống nhúng & RTOS";
  modules.flatMap((mod) => mod.lessons).forEach((item, index) => {
    item.number = String(index).padStart(2, "0");
  });
  return course;
}
