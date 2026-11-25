export function createPhaseACLessons() {
  return [
    {
      id: "c-operators-conversions",
      number: "05",
      title: "Toán tử, chuyển kiểu & bẫy Signed/Unsigned",
      duration: "70 phút",
      level: "Nền tảng",
      subtitle:
        "Hiểu cách C tự nâng kích thước số, tránh bẫy so sánh -1 < 1U, tràn phép nhân ADC trên vi điều khiển 16-bit, đo thời gian quay vòng và phép toán chống tràn.",
      locked: false,
      youllLearn: [
        "Xác định đúng kiểu và giá trị của biểu thức khi C tự nâng kích thước số trước lúc tính",
        "Tránh lỗi khó lường khi chia INT32_MIN / -1, sửa biến 2 lần (i = i++) và tràn nhân ADC trên chip 16-bit",
        "Viết kiểm tra hết thời gian (now - start) >= timeout chạy đúng cả khi bộ đếm 16-bit/32-bit quay vòng về 0"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Tự nâng kích thước số, bẫy -1 < 1U & chia làm tròn",
          body:
            "Mỗi biểu thức C vừa có **giá trị**, vừa có **kiểu dữ liệu**. Trước khi tính `+ - * /`, các kiểu nhỏ hơn `int` (`uint8_t`, `int8_t`, `uint16_t`) được C **tự nâng lên `int`** (nếu `int` chứa đủ miền giá trị). Khi trộn số có dấu `int` với số không dấu `unsigned int` (ví dụ `-1 < 1U`), C tự ép `-1` thành `UINT_MAX` (`4294967295U`), khiến biểu thức trả về **SAI (`0`)**! Phép chia nguyên `/` luôn cắt phần thập phân về `0`, nên muốn làm tròn gần nhất nửa ra xa `0` (`div_round`, ví dụ `7 / 2 → 4`, `-7 / 2 → -4`), phải xét thương `q = a / b`, phần dư `r = a % b` và dấu mà không cộng `b / 2` thẳng vào `a` kẻo tràn số.",
          codeLang: "C · tự nâng kiểu, bẫy -1 < 1U & div_round",
          code: `#include <limits.h>
#include <stdint.h>

/* 1) Tự nâng kiểu: uint8_t + uint8_t được tính ở kiểu int */
uint8_t u1 = 200U, u2 = 100U;
int sum = u1 + u2;            /* 300 ở int (không phải 44!), ép (uint8_t) mới thành 44 */

/* 2) Bẫy -1 < 1U: số âm bị ép sang số dương cực đại unsigned int */
int x = -1;
unsigned int len = 1U;
/* (x < len) cho kết quả 0 vì (unsigned int)(-1) == UINT_MAX! */
int safe_cmp = (x < 0) || ((unsigned int)x < len); /* luôn chặn số âm trước */

/* 3) Chia làm tròn nửa ra xa 0, không bị tràn ở gần INT32_MAX */
int32_t div_round(int32_t a, int32_t b) {
    if (b == 0) return 0;
    if (a == INT32_MIN && b == -1) return INT32_MAX; /* chặn tràn chia âm */
    int32_t q = a / b;
    int32_t r = a % b;
    int32_t abs_r = (r < 0) ? -r : r; /* r ∈ (INT32_MIN, INT32_MAX] nên -r an toàn nếu b != -1 */
    int32_t abs_b_half = ((b < 0) ? -(b / 2) : (b / 2));
    /* So 2*|r| >= |b| mà không nhân 2 gây tràn bằng cách so với nửa |b| */
    int32_t add_one = (b % 2 == 0) ? (abs_r >= abs_b_half) : (abs_r > abs_b_half);
    if (add_one) {
        int same_sign = ((a < 0) == (b < 0));
        q += same_sign ? 1 : -1;
    }
    return q;
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Không tắt cảnh báo -Wsign-compare bằng cách ép kiểu bừa! Luôn tự hỏi: giá trị âm có hợp lệ không? Nếu có, chặn x < 0 trước rồi mới so sánh phần không âm."
          },
          diff: [
            { op: "+", text: "u1 = 200U, u2 = 100U → u1 + u2 tính ở int = 300; ép (uint8_t) mới thu hẹp còn 44." },
            { op: "-", text: "-1 < 1U thành 4294967295U < 1U (sai) — và -1L < 1U đổi kết quả giữa Linux 64-bit và STM32 32-bit." }
          ],
          kpis: [
            { label: "uint8_t + uint8_t", value: "Kiểu int", sub: "200 + 100 = 300", tone: "sky" },
            { label: "-1 < 1U", value: "0 (FALSE)", sub: "-1 → UINT_MAX", tone: "rose" },
            { label: "div_round(-7, 2)", value: "-4", sub: "Nửa ra xa 0", tone: "sage" }
          ],
          legend: [
            { label: "Tự nâng lên int", color: "#84b4df" },
            { label: "Ép signed → unsigned", color: "#e57373" },
            { label: "Làm tròn an toàn", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: { type: "conv_promotion_trap" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Bẫy tràn khi chia số âm, sửa biến 2 lần & nhân ADC 16-bit",
          body:
            "Trên CPU bù hai 32-bit, `INT32_MIN` bằng `-2^31`, còn `INT32_MAX` chỉ tới `2^31 - 1`. Do đó `INT32_MIN / -1` bằng `+2^31`, **vượt quá miền `int32_t` và gây lỗi khó lường (trình biên dịch xử lý tùy ý)** — trên PC x86 thường sập ngay với `SIGFPE`! Tương tự, `i = i++` hay `a[i] = i++` sửa cùng một biến hai lần trong một biểu thức cũng là lỗi khó lường hoàn toàn. Còn khi quy đổi ADC 12-bit `raw * 3300U / 4095U`, tích `4095 * 3300 = 13,513,500` chạy êm trên STM32 (`int` 32-bit) nhưng trên chip 16-bit (AVR/MSP430 có `unsigned int` rộng `0..65535`), nếu ép `(uint32_t)` **sau** phép nhân `(uint32_t)(raw * 3300U)` sẽ bị **tràn quay vòng 16-bit cho ra sai số** (`13,513,500 mod 65,536 = 13,084`)!",
          codeLang: "C · chặn lỗi chia âm & mở rộng kiểu trước phép nhân",
          code: `#include <limits.h>
#include <stdbool.h>
#include <stdint.h>

/* 1) Chia số nguyên an toàn cho mọi cặp int32_t */
bool safe_div(int32_t a, int32_t b, int32_t *out) {
    if (out == NULL || b == 0 || (a == INT32_MIN && b == -1)) {
        return false;
    }
    *out = a / b;
    return true;
}

/* 2) Tránh lỗi khó lường: mỗi biểu thức chỉ sửa biến tối đa 1 lần */
/* SAI: int k = i++ + ++i; */
/* ĐÚNG: tách thành từng câu lệnh rõ ràng */

/* 3) ADC 12-bit (0..4095) -> mV (0..3300) chạy giống nhau trên mọi chip 16/32-bit */
uint16_t adc_to_mv(uint16_t raw) {
    /* Ép toán hạng đầu sang uint32_t TRƯỚC khi nhân để không tràn quay vòng 16-bit */
    uint32_t mv = ((uint32_t)raw * 3300U + 2047U) / 4095U;
    return (uint16_t)mv;
}`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Quy tắc ép kiểu vàng: ép một toán hạng sang kiểu rộng hơn TRƯỚC phép tính để mở rộng miền trung gian; chỉ ép kiểu SAU phép tính khi chủ đích thu hẹp kết quả."
          },
          diff: [
            { op: "+", text: "((uint32_t)raw * 3300U + 2047U) / 4095U cho cùng kết quả 13,513,500 trên cả AVR 16-bit lẫn STM32 32-bit." },
            { op: "-", text: "(uint32_t)(raw * 3300U) trên chip int 16-bit bị tràn quay vòng 16-bit, chỉ còn 13,513,500 mod 65,536 = 13,084!" }
          ],
          kpis: [
            { label: "INT32_MIN / -1", value: "Tràn số âm", sub: "Chặn trước khi chia", tone: "rose" },
            { label: "4095 × 3300", value: "13,513,500", sub: "Quay vòng sai trên 16-bit", tone: "amber" },
            { label: "Ép trước nhân", value: "(uint32_t)raw * 3300U", sub: "Chạy chuẩn mọi chip", tone: "sage" }
          ],
          legend: [
            { label: "Ép kiểu mở rộng", color: "#84be88" },
            { label: "Miền trung gian 32-bit", color: "#84b4df" },
            { label: "Chặn lỗi chia biên", color: "#e57373" }
          ],
          learnUnlock: [1],
          scene: {
            type: "flow",
            nodes: [
              ["raw (uint16_t)", "Tối đa 4095U"],
              ["(uint32_t)raw * 3300U", "Mở rộng 32-bit trước khi nhân → 13,513,500"],
              ["(+ 2047U) / 4095U", "Làm tròn gần nhất → 3300 mV chuẩn xác"]
            ]
          },
          openQuestions: [
            {
              id: "q-conv-adc16",
              scenario: "CÂU HỎI KỸ THUẬT · CHIP 16-BIT VS 32-BIT",
              prompt:
                "Trên PC 64-bit và STM32 (`int` 32-bit), hai dòng `(uint32_t)(raw * 3300U)` và `(uint32_t)raw * 3300U` cho cùng một đáp án khi `raw = 4095`. Vì sao trên chip AVR có `int` 16-bit dòng đầu lại bị tràn quay vòng ra sai số, và vì sao `INT32_MIN / -1` lại là lỗi khó lường dù không chia cho 0?",
              placeholder: "Phân tích kiểu trung gian khi nhân trên unsigned int 16-bit và miền giá trị bù hai của INT32_MIN...",
              hint: "Kiểm tra kiểu của raw * 3300U khi unsigned int chỉ rộng 16 bit (0..65535), và so sánh |-2147483648| với INT32_MAX = +2147483647."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Đo thời gian vượt ngưỡng quay vòng (Timer)",
          body:
            "Bộ đếm thời gian 1 ms trên vi điều khiển luôn quay vòng về `0` sau `UINT16_MAX` (`65,535`) hoặc `UINT32_MAX` (`49,7` ngày). Cách viết ngây thơ `now >= start + timeout` **hỏng ngay trước lúc quay vòng** vì `start + timeout` quay về số nhỏ trước `now`. Phép trừ không dấu `now - start` tính theo vòng tròn `2^N` luôn cho đúng khoảng thời gian đã trôi qua (`now = 5, start = 0xFFFFFFF0 → 21`). Riêng với timer **16-bit (`uint16_t`)**, nếu không ép `(uint16_t)(now - start)`, cả hai số bị tự nâng thành `int` nên `5 - 65520 = -65515 < 20` bị sai!",
          codeLang: "C · đo thời gian quay vòng 16-bit & 32-bit",
          code: `#include <stdbool.h>
#include <stdint.h>

/* Đúng trên mọi độ rộng timer miễn khoảng chờ < 1 vòng đếm 2^N */
bool timeout_elapsed32(uint32_t now, uint32_t start, uint32_t timeout) {
    return (uint32_t)(now - start) >= timeout;
}

bool timeout_elapsed16(uint16_t now, uint16_t start, uint16_t timeout) {
    /* Nếu bỏ (uint16_t): int(5) - int(0xFFF0) = -65515 -> sai! */
    return (uint16_t)(now - start) >= timeout;
}

/* Ví dụ kiểm thử ngay mốc quay vòng:
 * start = 0xFFF0U, now = 5U -> đã qua 21 tick (0xFFF0..0xFFFF là 16, 0..5 là 5)
 * (uint16_t)(5U - 0xFFF0U) == 21U >= 20U -> true!
 */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Luôn viết (uint16_t)(now - start) >= timeout hoặc (uint32_t)(now - start) >= timeout. Phép trừ quay vòng cho đúng hiệu đã trôi qua miễn thời gian chờ thực < một vòng đếm."
          },
          diff: [
            { op: "+", text: "now = 5U, start = 0xFFF0U → (uint16_t)(now - start) = 21U, so với timeout = 20U trả true." },
            { op: "-", text: "now >= start + timeout với start = 0xFFF0U, timeout = 20U cho start + timeout = 4 → sai khi now = 0xFFF5U!" }
          ],
          kpis: [
            { label: "Timer 32-bit", value: "49,7 ngày", sub: "1 tick = 1 ms", tone: "sky" },
            { label: "5 - 0xFFF0 (int)", value: "-65,515", sub: "Sai do tự nâng kiểu", tone: "rose" },
            { label: "(uint16_t)(5 - 0xFFF0)", value: "21 tick", sub: "Quay vòng 65,536 chuẩn", tone: "sage" }
          ],
          legend: [
            { label: "Quay vòng qua 0", color: "#e8ca78" },
            { label: "Nâng kiểu âm (lỗi)", color: "#e57373" },
            { label: "Hiệu quay vòng chuẩn", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: { type: "conv_timer_wrap" }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Chia làm tròn, đo thời gian & phép toán chống tràn",
          body:
            "Hoàn thiện bộ bài thực hành trong `submission.c` trên Ubuntu WSL với `-Wall -Wextra -Werror -fsanitize=undefined` (và thử soi thêm cảnh báo bằng `-Wconversion`): (1) `div_round(a, b)` đúng mọi tổ hợp dấu + biên `INT32_MIN`, (2) `timeout_elapsed16/32` qua mốc quay vòng, (3) `adc_to_temp_x10(raw)` cho cảm biến TMP36 (`500 mV + 10 mV/°C`) trả `INT16_MIN` khi `raw > 4095U`, (4) phép cộng bão hòa kẹp trần `sat_add_u8`, `sat_add_i16` và `brightness_step(level, delta)` kẹp `[0..255]` không tràn.",
          codeLang: "C · submission.c & kiểm tra biên",
          code: `/* Biên dịch:
 * gcc -Wall -Wextra -Werror -fsanitize=undefined submission.c -o /tmp/operators_lab
 */
assert(div_round(7, 2) == 4);
assert(div_round(-7, 2) == -4);
assert(div_round(INT32_MIN, -1) == INT32_MAX);
assert(div_round(9, 0) == 0);

assert(timeout_elapsed16(5U, 0xFFF0U, 20U) == true);
assert(timeout_elapsed16(5U, 0xFFF0U, 22U) == false);
assert(timeout_elapsed32(5U, 0xFFFFFFF0U, 20U) == true);

assert(adc_to_temp_x10(931U) == 250);      /* 750 mV -> 25.0 C */
assert(adc_to_temp_x10(4096U) == INT16_MIN);

assert(sat_add_u8(200U, 100U) == 255U);
assert(sat_add_i16(-30000, -10000) == -32768);
assert(brightness_step(250U, 10) == 255U);
assert(brightness_step(5U, -10) == 0U);`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Với sat_add_i16(a, b), có thể cộng trên int32_t rồi kẹp, nhưng khi viết sat_add_i32(int32_t a, int32_t b) phải kiểm tra điều kiện tràn TRƯỚC khi cộng vì tràn số có dấu gây lỗi khó lường."
          },
          diff: [
            { op: "+", text: "Bật -fsanitize=undefined để bắt tức thì mọi lỗi tràn có dấu hoặc chia cho 0 lúc chạy thử." },
            { op: "+", text: "Dùng INT16_MIN làm mã lỗi cho adc_to_temp_x10 thay cho -1 (vì -1 ứng với -0.1 °C hợp lệ)." }
          ],
          kpis: [
            { label: "Lý thuyết", value: "10 câu · 20đ", sub: "Câu hỏi nâng kiểu & tràn", tone: "sky" },
            { label: "4 hàm thực hành", value: "80 điểm", sub: "div, timeout, ADC, sat", tone: "amber" },
            { label: "Kiểm lỗi chạy", value: "UBSan sạch", sub: "-fsanitize=undefined", tone: "sage" }
          ],
          legend: [
            { label: "Đầu vào & biên", color: "#84b4df" },
            { label: "Kiểm tra an toàn", color: "#e8ca78" },
            { label: "Assert đạt chuẩn", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["6 bước thiết kế", "Liệt kê giá trị trung gian max/min"],
              ["Viết code C an toàn", "div_round + timeout + adc_temp + sat_add"],
              ["UBSan + assert", "Chạy sạch mọi ca biên INT32_MIN / 0xFFF0"]
            ]
          },
          quiz: [
            {
              prompt:
                "Với uint16_t now = 5U, start = 0xFFF0U, timeout = 20U trên PC 32-bit, vì sao điều kiện `if (now - start >= timeout)` KHÔNG chạy trong khi `if ((uint16_t)(now - start) >= timeout)` chạy đúng?",
              options: [
                "Vì uint16_t tự nâng lên int nên 5 - 65520 = -65515 < 20; ép (uint16_t) đưa hiệu về vòng 65536 = 21",
                "Vì phép trừ hai số uint16_t luôn bị tràn thành 0",
                "Vì hằng số 20U có kiểu unsigned long"
              ],
              correctIndex: 0,
              explain:
                "Theo quy tắc tự nâng kiểu, hai số uint16_t nâng thành int (32-bit) trước khi trừ nên cho kết quả âm -65515. Ép (uint16_t) khôi phục đúng hiệu quay vòng 2^16 = 21."
            },
            {
              prompt:
                "Trên chip AVR có `int` 16-bit, với `uint16_t raw = 4095U`, biểu thức nào tính `raw * 3300U` KHÔNG bị tràn quay vòng 16-bit?",
              options: [
                "(uint32_t)(raw * 3300U)",
                "(uint32_t)raw * 3300U",
                "(uint16_t)raw * 3300"
              ],
              correctIndex: 1,
              explain:
                "Phải ép một toán hạng sang uint32_t TRƯỚC phép nhân; nếu ép sau (raw * 3300U), phép nhân đã chạy ở unsigned int 16-bit và quay vòng sai số trước khi ép kiểu."
            }
          ]
        }
      ]
    },
    {
      id: "c-modular-makefile",
      number: "06",
      title: "Hàm độc lập, Chia nhiều tệp, Chuỗi UART & Makefile",
      duration: "75 phút",
      level: "Nền tảng",
      subtitle:
        "Tách hàm độc lập không giấu biến ẩn, chia tệp .h/.c sạch sẽ, lọc nhiễu cảm biến, đọc chuỗi UART an toàn và tự động hóa biên dịch bằng Makefile.",
      locked: false,
      youllLearn: [
        "Thiết kế hàm độc lập (không biến ẩn) và mẫu bool fn(..., T *out) trả nhiều kết quả sạch sẽ",
        "Chia nhiều tệp .h/.c đúng chuẩn (include guard, extern, static inline) và biên dịch tự động bằng Makefile",
        "Viết bộ lọc nhiễu cảm biến (Median-3, Moving Avg-4) và đọc/ghép chuỗi UART chống tràn bộ đệm"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Hàm độc lập (không biến ẩn), vùng chống rung & trả nhiều kết quả",
          body:
            "Đặt trạng thái cảnh báo vào biến `static` giấu bên trong hàm khiến hàm **không dùng lại được cho 2 cảm biến** và rất khó kiểm thử độc lập. Giải pháp là viết **hàm độc lập** `alarm_update(bool current, int16_t temp_c)` nhận trạng thái cũ qua tham số và trả về trạng thái mới (vùng chống rung — hysteresis: bật `>= 60 °C`, tắt `<= 55 °C`, ở giữa giữ nguyên `current`). Khi hàm có thể báo lỗi (chia 0, `NULL`, ngoài miền), dùng mẫu chuẩn firmware **trả về `bool`** (hoặc mã lỗi `enum`), còn giá trị thật ghi qua con trỏ đầu ra `*out` — và **không đụng vào `*out`** nếu kiểm tra lỗi thất bại!",
          codeLang: "C · hàm độc lập, chống rung & trả kết quả qua con trỏ",
          code: `#include <limits.h>
#include <stdbool.h>
#include <stdint.h>

/* Hàm độc lập có vùng chống rung (hysteresis): không giấu static ẩn, dùng cho nhiều kênh */
bool alarm_update(bool current, int16_t temp_c) {
    if (temp_c >= 60) {
        return true;
    }
    if (temp_c <= 55) {
        return false;
    }
    return current;
}

/* Trả về bool báo thành công/lỗi + ghi kết quả thật qua con trỏ *out_q */
bool safe_div_i32(int32_t a, int32_t b, int32_t *out_q) {
    if (out_q == NULL || b == 0 || (a == INT32_MIN && b == -1)) {
        return false; /* giữ nguyên *out_q khi lỗi */
    }
    *out_q = a / b;
    return true;
}`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Tách logic xử lý khỏi printf/scanf: hàm nghiệp vụ độc lập không gọi printf nên chạy y hệt trên cả bộ test PC lẫn vi điều khiển STM32."
          },
          diff: [
            { op: "+", text: "Truyền trạng thái current từ ngoài vào giúp 1 hàm alarm_update phục vụ đồng thời nhiều cảm biến." },
            { op: "-", text: "Tránh nhét static bool alarm bên trong hàm khi hệ thống có nhiều kênh đo độc lập." }
          ],
          kpis: [
            { label: "Hàm độc lập", value: "0 biến ẩn", sub: "Cùng input → cùng output", tone: "sage" },
            { label: "Chống rung", value: "55..60 °C", sub: "Tránh nhấp nháy rơ-le", tone: "amber" },
            { label: "Trả nhiều giá trị", value: "bool + *out", sub: "Lỗi thì giữ nguyên *out", tone: "sky" }
          ],
          legend: [
            { label: "Ngõ vào tường minh", color: "#84b4df" },
            { label: "Kiểm tra biên / NULL", color: "#e8ca78" },
            { label: "Cập nhật *out an toàn", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: {
            type: "flow",
            nodes: [
              ["(current, temp_c)", "Tham số tường minh, không biến ẩn"],
              ["Guard NULL / biên", "Lỗi → trả false, giữ nguyên *out"],
              ["Kết quả dự đoán được", "Dễ viết assert test mọi chuyển trạng thái"]
            ]
          }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Chia nhiều tệp .h/.c, Macro vs hàm inline & tự biên dịch bằng Makefile",
          body:
            "File `.h` chỉ chứa **khai báo (`extern` / mẫu hàm), kiểu dữ liệu và `static inline`**, tuyệt đối không đặt định nghĩa biến toàn cục hay hàm thường không có `static inline` kẻo trình liên kết (linker) báo **`multiple definition`** khi hai tệp `.c` cùng `#include`. Mọi macro hàm như `SQR(x)` phải bọc ngoặc `((x) * (x))` (hoặc dùng `do { ... } while (0)` cho nhiều lệnh), nhưng ưu tiên **`static inline`** để trình biên dịch kiểm tra kiểu và không tính đối số `x++` hai lần. Trong `Makefile`, bật chế độ tự tạo tệp phụ thuộc `.d` kèm `-include $(DEPS)` để tự biên dịch lại `.o` khi `.h` thay đổi, và khai báo `.PHONY` cho `all`, `test`, `size`, `clean`.",
          codeLang: "Header .h + Makefile tự theo dõi phụ thuộc",
          code: `/* --- sensor_filter.h --- */
#ifndef SENSOR_FILTER_H
#define SENSOR_FILTER_H
#include <stdint.h>

static inline int32_t sf_max_i32(int32_t a, int32_t b) {
    return (a > b) ? a : b; /* an toàn với sf_max_i32(x++, y) */
}
uint16_t sf_median3_u16(uint16_t a, uint16_t b, uint16_t c);
#endif

/* --- Makefile --- */
// CFLAGS  := -Wall -Wextra -Werror -Wshadow -Isrc
// DEPS    := $(OBJS:.o=.d)
// .PHONY: all test size clean
// -include $(DEPS) /* ghép thêm cờ tạo tệp .d khi biên dịch .c -> .o */`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Không dùng .h để định nghĩa biến toàn cục hay đặt thân hàm non-inline! Và nếu Makefile không sinh tệp phụ thuộc .d + -include $(DEPS), sửa hằng số trong .h nhưng gõ make sẽ KHÔNG build lại .c!"
          },
          diff: [
            { op: "+", text: "static inline kiểm tra kiểu chặt và chỉ tính đối số đúng 1 lần, thay thế macro hàm đơn giản." },
            { op: "-", text: "Đặt int g_count = 0; trong file .h sẽ gây lỗi multiple definition ở bước liên kết (ld)." }
          ],
          kpis: [
            { label: "Chống nạp trùng", value: "#ifndef _H", sub: "Bảo vệ header trong 1 tệp", tone: "sky" },
            { label: "Đa lệnh macro", value: "do{...}while(0)", sub: "An toàn trong nhánh if/else", tone: "amber" },
            { label: "Tự theo dõi .h", value: "Tệp .d + DEPS", sub: "Tự build lại khi .h đổi", tone: "sage" }
          ],
          legend: [
            { label: "Biên dịch .c → .o + .d", color: "#84b4df" },
            { label: "Theo dõi phụ thuộc .h", color: "#e8ca78" },
            { label: "Liên kết tạo chương trình", color: "#84be88" }
          ],
          learnUnlock: [1],
          scene: { type: "modular_build_dag" },
          openQuestions: [
            {
              id: "q-mod-scratch",
              scenario: "THIẾT KẾ THƯ VIỆN NHÚNG · BỘ LỌC NHIỀU TỆP",
              prompt:
                "1) Trong `sf_pipeline_filter(raw_in, clean_out, scratch, len)`, vì sao API bắt người gọi truyền mảng tạm `scratch[]` từ ngoài vào thay vì khai báo một mảng `static uint16_t scratch[256]` bên trong hàm hay gọi `malloc`? 2) Nếu `Makefile` thiếu cơ chế sinh tệp phụ thuộc `.d` (`-include $(DEPS)`), lỗi gì âm thầm xảy ra khi bạn đổi hằng `#define SENSOR_VREF_MV` trong file `.h`?",
              placeholder: "Phân tích RAM cố định / dùng đa luồng của scratch[] và lỗi biên dịch thiếu .o của Makefile...",
              hint: "Nghĩ về giới hạn kích thước cố định, khả năng chạy nhiều luồng/ngắt an toàn (zero-heap) trên vi điều khiển và việc make chỉ nhìn giờ sửa của .c nếu không có tệp .d."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Truyền mảng kèm kích thước, lọc nhiễu cảm biến & đọc chuỗi UART an toàn",
          body:
            "Khi truyền mảng vào hàm `f(const uint16_t buf[], size_t len)`, `buf` bị thu gọn thành con trỏ địa chỉ nên `sizeof(buf)` chỉ trả về kích thước con trỏ (4 hoặc 8 byte), **không** trả về số phần tử — chỉ dùng `ARRAY_LEN(arr)` ngay chỗ khai báo mảng thật! Với tín hiệu cảm biến có gai nhiễu đột biến, tầng **Median-3** (lấy số giữa của 3 mẫu liên tiếp) gạt bỏ gai 1 mẫu trước khi **Moving Avg-4** (trung bình trượt 4 mẫu) làm mượt. Với chuỗi UART/CLI, **cấm dùng `atoi`, `strcpy`, `strtok`**: viết `parse_u16` kiểm tra từng chữ số chống tràn `(65535U - d) / 10U`, kiểm tra cắt cụt `snprintf(...) >= buf_size`, và tính checksum NMEA bằng XOR từng byte.",
          codeLang: "C · lọc nhiễu cảm biến + parse_u16 & checksum NMEA",
          code: `/* 1) Trung vị 3 điểm (loại gai nhiễu tức thời không làm mờ sườn tín hiệu) */
uint16_t sf_median3_u16(uint16_t a, uint16_t b, uint16_t c) {
    if (a > b) { uint16_t t = a; a = b; b = t; }
    if (b > c) { uint16_t t = b; b = c; c = t; }
    if (a > b) { uint16_t t = a; a = b; b = t; }
    return b;
}

/* 2) Đọc số nguyên không dấu thay atoi: bắt ký tự lạ và chặn tràn u16 */
bool parse_u16(const char *s, uint16_t *out) {
    if (s == NULL || out == NULL || s[0] == '\\0') return false;
    uint32_t acc = 0U;
    for (size_t i = 0U; s[i] != '\\0'; i++) {
        if (s[i] < '0' || s[i] > '9') return false;
        uint32_t d = (uint32_t)(s[i] - '0');
        if (acc > (65535U - d) / 10U) return false; /* chặn tràn trước khi nhân 10 */
        acc = acc * 10U + d;
    }
    *out = (uint16_t)acc;
    return true;
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "atoi(\"abc\") trả 0 không báo lỗi còn tràn số trong atoi gây lỗi khó lường! Tương tự, snprintf trả về độ dài ĐÁNG LẼ phải ghi — phải kiểm tra n < 0 || (size_t)n >= buf_size để bắt lỗi bị cắt cụt chuỗi."
          },
          diff: [
            { op: "+", text: "Median-3 giữ nguyên sườn dốc tín hiệu nhưng triệt tiêu hoàn toàn gai nhiễu đơn lẻ mà không kéo lệch mức nền." },
            { op: "-", text: "strtok làm biến đổi (ghi '\\0' vào) chuỗi gốc và dùng con trỏ tĩnh toàn cục không an toàn." }
          ],
          kpis: [
            { label: "Tham số mảng", value: "Con trỏ + len", sub: "sizeof chỉ cho 4/8 byte", tone: "rose" },
            { label: "Lọc 2 tầng", value: "Med-3 → Avg-4", sub: "Khử gai rồi làm mượt", tone: "sky" },
            { label: "NMEA XOR", value: "$payload*CS", sub: "XOR từng byte payload", tone: "sage" }
          ],
          legend: [
            { label: "Khử gai Median-3", color: "#ad9cd8" },
            { label: "Làm mượt Avg-4", color: "#84b4df" },
            { label: "Đọc chuỗi an toàn", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["raw_in[] + len", "Truyền kích thước tường minh, từ chối NULL/trùng"],
              ["Median-3 → Avg-4", "Triệt gai đột biến trước khi chia trung bình 4"],
              ["parse_u16 / snprintf", "Kiểm tra ký tự, tràn 65535 và cắt cụt buffer"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Gói thư viện lọc cảm biến nhiều tệp & tự kiểm thử",
          body:
            "Xây dựng thư viện lọc cảm biến gồm nhiều tệp `.h/.c`: module `sensor_filter.h/.c` (Median-3, Moving Avg-4, Hysteresis, bộ lọc 2 tầng truyền `scratch[]` chống trùng vùng nhớ `in == out`), module `cli.h/.c` (giấu cấu hình `th = 3000, hys = 200` bằng `static`, hỗ trợ lệnh `SET TH`, `SET HYS`, `GET`, `RESET` với mã lỗi `cli_status_t`), `main.c` và `test_filter.c`. Biên dịch qua `Makefile` tự theo dõi thay đổi `.h`, chạy `make`, `make test` và `make size` để xem dung lượng Flash/SRAM (`.text/.data/.bss`), kèm tài liệu API trong `README.md`.",
          codeLang: "Makefile & assert · kiểm thử thư viện nhiều tệp",
          code: `/* Chạy trong thư mục bài lab trên Ubuntu WSL:
 * make clean && make && make test && make size
 */
uint16_t raw[] = {1000U, 1020U, 9900U, 1010U, 1005U}; /* gai 9900 bị Median-3 xóa */
uint16_t scratch[5] = {0}, clean[5] = {0};
assert(sf_pipeline_filter(raw, clean, scratch, 5U) == true);
assert(sf_pipeline_filter(raw, clean, clean, 5U) == false); /* từ chối trùng buffer */

assert(cli_exec("SET TH 200", resp, sizeof resp) == CLI_ERR_RANGE); /* th <= hys mặc định 200 */
assert(cli_exec("SET TH 3500", resp, sizeof resp) == CLI_OK);
assert(cli_exec("GET", resp, sizeof resp) == CLI_OK);`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Tiêu chuẩn API sạch: một kỹ sư khác chỉ cần đọc README.md và các file .h là dùng đúng 100% thư viện mà không cần mở bất kỳ file .c nào."
          },
          diff: [
            { op: "+", text: "make test phải chạy sạch 0 cảnh báo với -Wall -Wextra -Werror -Wshadow." },
            { op: "+", text: "make size in chính xác dung lượng .text (Flash), .data và .bss (SRAM) của chương trình." }
          ],
          kpis: [
            { label: "Module lọc", value: "25 điểm", sub: "Med-3 + Avg-4 + Hys", tone: "sky" },
            { label: "Đọc lệnh CLI", value: "25 điểm", sub: "Không strtok / atoi", tone: "amber" },
            { label: "Makefile & API", value: "50 điểm", sub: "Auto rebuild + README", tone: "sage" }
          ],
          legend: [
            { label: "Header công khai .h", color: "#84b4df" },
            { label: "Đóng gói static .c", color: "#ad9cd8" },
            { label: "make test & size", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["sensor_filter + cli", "Tách .h/.c, giấu cấu hình static trong cli.c"],
              ["Makefile tự động", "Tự rebuild khi .h đổi, hỗ trợ DEBUG=1"],
              ["make test && make size", "Kiểm thử assert toàn diện & soi Flash/SRAM"]
            ]
          },
          quiz: [
            {
              prompt:
                "Khai báo nào đặt trong tệp `.h` sẽ gây lỗi `multiple definition` của trình liên kết khi hai tệp `.c` cùng `#include` nó?",
              options: [
                "extern uint32_t g_tick;",
                "static inline uint32_t clamp_u32(uint32_t x) { return x; }",
                "uint32_t g_tick = 0U;"
              ],
              correctIndex: 2,
              explain:
                "uint32_t g_tick = 0U; là định nghĩa biến toàn cục nên tạo biến trùng ở mọi tệp .c include .h. Hãy đặt extern trong .h và định nghĩa đúng 1 lần trong một .c."
            },
            {
              prompt:
                "Khi gọi `int n = snprintf(buf, sizeof(buf), \"%s\", src);`, điều kiện nào cho biết chuỗi `src` đã bị cắt cụt (không vừa `buf`)?",
              options: [
                "n == 0",
                "n < 0 || (size_t)n >= sizeof(buf)",
                "n == (int)(sizeof(buf) - 1)"
              ],
              correctIndex: 1,
              explain:
                "snprintf trả về số ký tự cần ghi (chưa tính '\\0'). Nếu n >= sizeof(buf), ít nhất ký tự cuối hoặc phần đuôi đã bị cắt bỏ (nếu n == sizeof(buf) - 1 thì vẫn vừa khít)."
            }
          ]
        }
      ]
    },
    {
      id: "c-callbacks-fsm",
      number: "07",
      title: "Hàm gọi lại (Callback), Bảng chọn lệnh & Máy trạng thái",
      duration: "75 phút",
      level: "Trung bình",
      subtitle:
        "Phân biệt 3 vị trí const trên thanh ghi, dùng con trỏ hàm kèm user_ctx, bảng chọn lệnh gọn gàng, kiểm tra đủ nhánh enum bằng -Wswitch và thiết kế máy trạng thái.",
      locked: false,
      youllLearn: [
        "Đọc đúng 3 vị trí const (chân đọc IDR vs chân ghi ODR), duyệt mảng bằng p < end và truyền callback kèm void *user_ctx",
        "Xây dựng Bảng chọn lệnh (Dispatch Table) và Máy trạng thái dùng enum + -Wswitch không để default che lấp trạng thái thiếu",
        "Đóng gói sự kiện gọn nhẹ bằng Hộp dữ liệu kèm nhãn (Tagged Union) và đọc byte bằng memcpy cho an toàn"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "3 cách dùng const với thanh ghi & Hàm gọi lại (Callback) kèm ngữ cảnh",
          body:
            "Đọc khai báo con trỏ **từ phải sang trái quanh dấu `*`**: `const volatile uint32_t *idr` là con trỏ trỏ tới ô nhớ **chỉ đọc và phần cứng tự đổi** (`GPIOx->IDR` — đọc được nhưng không được ghi); còn `volatile uint32_t *const odr` là con trỏ có **địa chỉ cố định** (luôn trỏ đúng `0x4001080C`) nhưng giá trị thanh ghi ghi/đổi được. Khi viết thư viện duyệt mẫu hay trình xử lý sự kiện dùng **hàm gọi lại (Callback / con trỏ hàm `typedef`)**, luôn kèm tham số **`void *user_ctx`** để nhiều thiết bị (như 2 cảm biến hoặc 2 nút nhấn) truyền ngữ cảnh riêng vào callback mà không cần biến toàn cục.",
          codeLang: "C · 3 vị trí const & callback kèm user_ctx",
          code: `#include <stddef.h>
#include <stdint.h>

/* 1) Đọc từ phải sang trái: */
const volatile uint32_t *p_idr = NULL;      /* Giá trị *p_idr chỉ đọc, con trỏ đổi được */
volatile uint32_t *const p_odr = (volatile uint32_t *)0x4001080CU; /* Địa chỉ cố định */

/* 2) Typedef con trỏ hàm callback + ngữ cảnh người gọi */
typedef void (*sample_cb_t)(uint16_t sample, void *user_ctx);

typedef struct {
    uint16_t threshold;
    size_t count;
} threshold_ctx_t;

void for_each_sample(const uint16_t *buf, size_t len,
                     sample_cb_t cb, void *user_ctx) {
    if (buf == NULL || len == 0U || cb == NULL) return;
    const uint16_t *end = buf + len; /* một phần tử sau cuối chỉ để so sánh, không *end! */
    for (const uint16_t *p = buf; p < end; p++) {
        cb(*p, user_ctx);
    }
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Không trả về địa chỉ biến cục bộ trên stack (con trỏ lơ lửng) và luôn kiểm tra NULL trước khi đọc con trỏ hoặc gọi hàm callback cb(x, ctx)!"
          },
          diff: [
            { op: "+", text: "typedef void (*sample_cb_t)(uint16_t, void *) giúp chữ ký hàm đăng ký callback sạch và dễ đọc." },
            { op: "-", text: "Quên void *user_ctx ép lập trình viên dùng biến toàn cục, làm driver chỉ chạy được 1 thiết bị." }
          ],
          kpis: [
            { label: "const T *p", value: "Chỉ đọc *p", sub: "Mô hình thanh ghi IDR", tone: "sky" },
            { label: "T *const p", value: "Cố định địa chỉ", sub: "Trỏ cứng vào ODR", tone: "amber" },
            { label: "void *user_ctx", value: "0 global", sub: "Đa kênh / an toàn", tone: "sage" }
          ],
          legend: [
            { label: "Bảo vệ const / NULL", color: "#e8ca78" },
            { label: "Duyệt con trỏ p < end", color: "#84b4df" },
            { label: "Callback + user_ctx", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: {
            type: "flow",
            nodes: [
              ["const / NULL guard", "Chặn con trỏ rỗng & bảo vệ thanh ghi chỉ đọc"],
              ["for (p = buf; p < end; p++)", "Duyệt mảng nhanh theo bước nhảy sizeof(*p)"],
              ["cb(*p, user_ctx)", "Đẩy dữ liệu ra ngoài không dùng biến toàn cục"]
            ]
          }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Bảng chọn lệnh (Dispatch Table), Enum & Máy trạng thái",
          body:
            "Thay vì chuỗi `if (strcmp(...)) ... else if ...` dài dằng dặc, **Bảng chọn lệnh (Dispatch Table)** đặt cặp `{tên_lệnh, handler}` vào mảng `static const` nằm gọn trong Flash (`.rodata`) — thêm lệnh mới chỉ cần thêm 1 dòng vào bảng. Với máy trạng thái FSM (`enum`), luôn đặt phần tử đếm cuối như `STATE_COUNT`, kiểm tra giá trị ngoài miền trước khi vào `switch`, và **bỏ `default:`** khi bật `-Wswitch` để trình biên dịch báo lỗi ngay nếu bạn thêm trạng thái mới mà quên xử lý nó! Gom toàn bộ quy tắc chuyển trạng thái vào hàm `door_fsm_step` giúp dễ theo dõi và kiểm thử.",
          codeLang: "C · Bảng chọn lệnh & Máy trạng thái Enum -Wswitch",
          code: `typedef enum {
    STATE_LOCKED = 0,
    STATE_ENTERING,
    STATE_UNLOCKED,
    STATE_LOCKOUT,
    STATE_COUNT
} door_state_t;

const char *door_state_name(door_state_t s) {
    switch (s) { /* Không đặt default: để -Wswitch bắt thiếu nhánh enum! */
    case STATE_LOCKED:   return "LOCKED";
    case STATE_ENTERING: return "ENTERING";
    case STATE_UNLOCKED: return "UNLOCKED";
    case STATE_LOCKOUT:  return "LOCKOUT";
    case STATE_COUNT:    break;
    }
    return "INVALID"; /* xử lý ngoài miền an toàn */
}

/* Bảng chọn lệnh đặt trong .rodata (Flash), không tốn RAM */
typedef bool (*cmd_fn_t)(const char *arg, void *ctx);
typedef struct { const char *name; cmd_fn_t fn; } cmd_entry_t;
static const cmd_entry_t k_cmds[] = {
    { "SET", handle_set }, { "GET", handle_get }, { "RESET", handle_reset }
};`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Đặt default: trong switch theo enum vô tình che mất cảnh báo của -Wswitch khi sau này dự án thêm trạng thái mới. Hãy liệt kê đủ các case và kiểm tra biên trước switch."
          },
          diff: [
            { op: "+", text: "Bảng k_cmds[] dùng static const nằm trong Flash (.rodata), không tốn SRAM." },
            { op: "+", text: "Bỏ default: trên enum + sentinel _COUNT biến trình biên dịch thành công cụ kiểm tra thiếu trạng thái." }
          ],
          kpis: [
            { label: "Bảng chọn lệnh", value: "static const", sub: "Bảng tra trong Flash", tone: "sky" },
            { label: "Kiểm tra Enum", value: "-Wswitch", sub: "Bắt thiếu case lúc build", tone: "amber" },
            { label: "4 trạng thái", value: "LOCKED..LOCKOUT", sub: "Chuyển tiếp rõ ràng", tone: "sage" }
          ],
          legend: [
            { label: "Chọn lệnh / Sự kiện", color: "#84b4df" },
            { label: "Kiểm tra điều kiện / -Wswitch", color: "#e8ca78" },
            { label: "Trạng thái kế tiếp", color: "#84be88" }
          ],
          learnUnlock: [1],
          scene: { type: "fsm_callback_table" },
          openQuestions: [
            {
              id: "q-fsm-wswitch",
              scenario: "KIẾN TRÚC FIRMWARE · BẢNG CHỌN LỆNH & MÁY TRẠNG THÁI",
              prompt:
                "1) Vì sao trong hàm nhận `enum` như `door_state_name`, ta cố tình **không** viết nhánh `default:` mà bật cờ `-Wswitch`? 2) Khi dùng một kiểu callback `typedef void (*btn_cb_t)(uint8_t event, void *ctx)` cho cả nút POWER và nút MODE, tham số `void *ctx` giải quyết vấn đề gì mà biến toàn cục gây ra?",
              placeholder: "Giải thích tác dụng phát hiện thiếu case của -Wswitch và tách trạng thái riêng qua user_ctx...",
              hint: "Hãy tưởng tượng sau 3 tháng bạn thêm STATE_MAINTENANCE vào enum, và tưởng tượng bạn có 2 nút bấm dùng chung 1 hàm callback."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Đọc byte số thực bằng memcpy & Hộp dữ liệu đa năng kèm nhãn",
          body:
            "Đọc byte thô của một `float` bằng cách ép kiểu con trỏ `*(uint32_t *)&f` là **ép kiểu con trỏ sai luật của C (nên dùng memcpy cho an toàn)** — trình biên dịch có thể tối ưu sai khi bật `-O2`! Cách chuẩn, an toàn và chạy nhanh ngang một lệnh thanh ghi là dùng **`memcpy(&bits, &val, sizeof(bits))`**. Để đóng gói nhiều loại sự kiện khác nhau vào cùng một mảng tĩnh hay hàng đợi vòng, ta dùng **Hộp dữ liệu kèm nhãn (Tagged Union)**: một `struct` gồm nhãn `type` (`enum`) đi kèm một `union` chứa dữ liệu riêng của từng sự kiện (`digit`, `sensor`, `fault_code`), luôn kiểm tra `type` trước khi đọc nhánh `union`.",
          codeLang: "C · đọc bit bằng memcpy & Hộp dữ liệu kèm nhãn",
          code: `#include <stdint.h>
#include <string.h>

/* 1) Đổi biểu diễn bit an toàn (GCC -O2 tối ưu thành 1 lệnh thanh ghi!) */
uint32_t float_to_u32_bits(float val) {
    uint32_t bits = 0U;
    memcpy(&bits, &val, sizeof(bits));
    return bits;
}

/* 2) Hộp dữ liệu kèm nhãn cho sự kiện khóa cửa (tiết kiệm RAM) */
typedef enum {
    EVT_DIGIT = 0, EVT_SUBMIT, EVT_CLEAR,
    EVT_TICK_1S, EVT_DOOR_OPENED, EVT_DOOR_CLOSED, EVT_COUNT
} door_evt_type_t;

typedef struct {
    door_evt_type_t type;
    union {
        char digit; /* Chỉ hợp lệ khi type == EVT_DIGIT ('0'..'9') */
    } data;
} door_event_t;`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Không bao giờ đọc trường của union khi nhãn `type` đang chỉ loại sự kiện khác! Luôn kiểm tra evt->type và miền giá trị (như '0'..'9') trước khi dùng evt->data.digit."
          },
          diff: [
            { op: "+", text: "memcpy(&bits, &val, sizeof(bits)) đúng chuẩn C trên mọi mức tối ưu -O2/-O3." },
            { op: "-", text: "*(uint32_t *)&val là ép kiểu con trỏ sai luật của C, dễ bị tối ưu sai khi bật -O2." }
          ],
          kpis: [
            { label: "Đọc byte float", value: "memcpy()", sub: "An toàn luật con trỏ C", tone: "sage" },
            { label: "Hộp kèm nhãn", value: "type + union", sub: "Tiết kiệm RAM hàng đợi", tone: "sky" },
            { label: "Kiểm tra nhãn", value: "evt->type", sub: "Chặt trước khi đọc union", tone: "amber" }
          ],
          legend: [
            { label: "Nhãn nhận diện type", color: "#84b4df" },
            { label: "Vùng nhớ dùng chung", color: "#ad9cd8" },
            { label: "Đọc đúng biến thể", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["door_event_t.type", "Xác định dữ liệu nào đang nằm trong union"],
              ["Validate payload", "Kiểm tra '0'..'9' nếu là EVT_DIGIT"],
              ["memcpy() đọc bit", "Chuyển biểu diễn bit an toàn luật C"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Viết bộ điều khiển khóa cửa tự động",
          body:
            "Xây dựng bộ điều khiển khóa cửa thông minh gồm `door_fsm.h`, `door_fsm.c`, `test_door_fsm.c`, `Makefile` và `DESIGN.md` (kèm sơ đồ **Mermaid `stateDiagram-v2`** ánh xạ 1-1 từng mũi tên sang ca `assert`). Kiểm chứng toàn bộ hành vi: giữ trạng thái an toàn khi bấm xác nhận lúc chưa nhập phím, đếm sai PIN 3 lần chuyển sang `STATE_LOCKOUT`, hết giờ `10 s` khi đang nhập ở `STATE_ENTERING`, báo tràn `input_overflow` nếu bấm quá 4 phím, và mở cửa lúc đang khóa kích hoạt `alarm_active = true` giữ nguyên cho đến khi mở đúng PIN.",
          codeLang: "C · hợp đồng & assert kiểm chứng khóa cửa tự động",
          code: `door_ctx_t ctx;
assert(door_fsm_init(&ctx, "1234") == true);
assert(ctx.state == STATE_LOCKED);

/* 1) Cạy cửa khi đang khóa -> báo động giữ nguyên ngay cả khi đóng lại */
door_event_t open_ev = { .type = EVT_DOOR_OPENED };
door_event_t close_ev = { .type = EVT_DOOR_CLOSED };
assert(door_fsm_step(&ctx, &open_ev) && ctx.alarm_active == true);
assert(door_fsm_step(&ctx, &close_ev) && ctx.alarm_active == true);

/* 2) Bấm ký tự không phải '0'..'9' -> trả false, không làm hỏng ctx */
door_event_t bad_digit = { .type = EVT_DIGIT, .data.digit = 'A' };
assert(door_fsm_step(&ctx, &bad_digit) == false);
assert(ctx.state == STATE_LOCKED && ctx.alarm_active == true);`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Không dùng biến toàn cục trong door_fsm.c: mọi trạng thái nằm trong struct door_ctx_t để test_door_fsm.c chạy hàng chục kịch bản độc lập sạch sẽ."
          },
          diff: [
            { op: "+", text: "Bắt buộc kiểm tra độ phủ 100% đường chuyển trên sơ đồ Mermaid stateDiagram-v2 trong DESIGN.md." },
            { op: "+", text: "Chạy sạch gcc -Wall -Wextra -Werror -Wshadow với UBSan/ASan." }
          ],
          kpis: [
            { label: "Ngữ cảnh FSM", value: "door_ctx_t", sub: "0 biến toàn cục", tone: "sky" },
            { label: "Độ phủ chuyển", value: "100% mũi tên", sub: "Ánh xạ sơ đồ ↔ assert", tone: "amber" },
            { label: "Bẫy biên", value: "Overflow & Lockout", sub: "3 lần sai / 10s timeout", tone: "sage" }
          ],
          legend: [
            { label: "Khởi tạo & Hợp đồng", color: "#84b4df" },
            { label: "Quy tắc chuyển trạng thái", color: "#ad9cd8" },
            { label: "Kiểm chứng assert", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["Mermaid stateDiagram-v2", "Vẽ rõ 4 trạng thái & các sự kiện biên"],
              ["door_fsm.h / .c", "Context struct + -Wswitch + tagged union"],
              ["test_door_fsm.c", "Assert từng mũi tên & lỗi NULL / bad digit"]
            ]
          },
          quiz: [
            {
              prompt:
                "Khai báo con trỏ nào mô tả đúng thanh ghi đầu vào chỉ đọc `GPIOA->IDR` (chân cứng có thể tự đổi giá trị, nhưng firmware không được phép ghi qua con trỏ)?",
              options: [
                "const volatile uint32_t *p_idr",
                "uint32_t *const p_idr",
                "volatile uint32_t *p_idr"
              ],
              correctIndex: 0,
              explain:
                "volatile ép trình biên dịch luôn đọc lại từ phần cứng mỗi lần truy cập; const cấm firmware ghi vào *p_idr."
            },
            {
              prompt:
                "Vì sao nên dùng `memcpy(&u32, &f32, sizeof u32)` thay cho `*(uint32_t *)&f32` khi soi mẫu bit của một `float` trong C?",
              options: [
                "Vì memcpy() tự động đảo byte Big-Endian thành Little-Endian",
                "Vì ép kiểu con trỏ khác loại là ép kiểu con trỏ sai luật của C (nên dùng memcpy cho an toàn và được -O2 tối ưu thành 1 lệnh)",
                "Vì sizeof(float) luôn bằng 8 byte"
              ],
              correctIndex: 1,
              explain:
                "Đọc đối tượng float thông qua con trỏ uint32_t* là ép kiểu con trỏ sai luật của C (nên dùng memcpy cho an toàn). memcpy() là cách chuẩn mực để sao chép các byte thô giữa hai kiểu."
            }
          ]
        }
      ]
    },
    {
      id: "c-ringbuf-pool-misra",
      number: "08",
      title: "Hàng đợi vòng (Ring Buffer), Kho nhớ cố định & Viết C an toàn (MISRA)",
      duration: "80 phút",
      level: "Trung bình",
      subtitle:
        "Hàng đợi vòng tốc độ ổn định, kho nhớ tĩnh thay malloc, đọc số 64-bit không bị ngắt xen ngang, kiểm thử bằng tệp CSV và quy tắc viết code C an toàn (MISRA).",
      locked: false,
      youllLearn: [
        "Cài đặt Hàng đợi vòng (Ring Buffer) lũy thừa của 2 với head/tail tách biệt và Kho nhớ tĩnh thay malloc",
        "Tránh xé dữ liệu khi đọc 64-bit qua read_u64_coherent, kiểm thử bằng tệp CSV và soi rò rỉ bộ nhớ với Valgrind",
        "Áp dụng bộ cờ cảnh báo chặt và quy tắc viết C an toàn (MISRA) cho khung CAN & khóa liên động"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Hàng đợi vòng tốc độ ổn định & Kho nhớ tĩnh thay malloc",
          body:
            "Trên hệ nhúng chạy 24/7, `malloc`/`free` gây **phân mảnh RAM**, thời gian cấp phát lúc nhanh lúc chậm và dễ cạn bộ nhớ bất ngờ. **Hàng đợi vòng (Ring Buffer)** dung lượng lũy thừa của 2 (kiểm tra lúc biên dịch bằng `_Static_assert((CAP & (CAP - 1U)) == 0U)`) chỉ tốn một mảng cố định và hai chỉ số `head`/`tail` quay vòng bằng `& (CAP - 1U)` thay cho phép chia `%`: ngắt `UART_ISR` chỉ ghi `head`, còn `main` chỉ ghi `tail` (chừa 1 ô trống hoặc dùng chỉ số nguyên tử `atomic` — tránh dùng biến `count++` chung dễ bị ngắt xen ngang!). Khi cần cấp phát gói tin cố định, **Kho nhớ tĩnh (Static Pool)** dùng mảng `pool_block_t` căn chỉnh theo `max_align_t` cho tốc độ ổn định và **0 phân mảnh**.",
          codeLang: "C · Hàng đợi vòng SPSC (tách head/tail) & Kho nhớ tĩnh",
          code: `#define DEMO_RB_CAP 8U
_Static_assert((DEMO_RB_CAP > 0U) && ((DEMO_RB_CAP & (DEMO_RB_CAP - 1U)) == 0U),
               "Capacity must be a power of 2");

typedef struct {
    uint8_t buf[DEMO_RB_CAP];
    volatile uint8_t head; /* Chỉ bên ghi (ISR) cập nhật head */
    volatile uint8_t tail; /* Chỉ bên đọc (main) cập nhật tail */
} demo_rb8_t;

bool demo_rb_push(demo_rb8_t *rb, uint8_t byte) {
    if (rb == NULL) return false;
    uint8_t next = (uint8_t)((rb->head + 1U) & (DEMO_RB_CAP - 1U)); /* tốc độ ổn định, không % */
    if (next == rb->tail) return false; /* đầy (chừa 1 ô phân biệt đầy/rỗng, không cần count++) */
    rb->buf[rb->head] = byte;
    rb->head = next;
    return true;
}

/* Kho nhớ tĩnh (căn chỉnh chuẩn max_align_t, 0 malloc/free) */
typedef union { max_align_t align; uint8_t bytes[32]; } pool_block_t;`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Đừng dùng biến count++ chung giữa ngắt (ISR) và main! Mô hình 1 bên ghi - 1 bên đọc (SPSC) tách riêng head (chỉ ISR ghi) và tail (chỉ main ghi) hoặc dùng chỉ số nguyên tử giúp khỏi lo ngắt cắt ngang."
          },
          diff: [
            { op: "+", text: "& (CAP - 1U) biên dịch thành đúng 1 lệnh AND nhanh gấp nhiều lần phép chia % trên Cortex-M0/M3." },
            { op: "-", text: "Gọi malloc/free trong ngắt hoặc vòng lặp thời gian thực dễ gây sập chip và phân mảnh RAM." }
          ],
          kpis: [
            { label: "Quay vòng chỉ số", value: "& (CAP - 1U)", sub: "_Static_assert 2^k", tone: "sky" },
            { label: "Tốc độ ổn định", value: "Luôn hằng số", sub: "Tách head/tail, 0 chia %", tone: "sage" },
            { label: "Phân mảnh Heap", value: "0 byte", sub: "Thay thế malloc/free", tone: "amber" }
          ],
          legend: [
            { label: "Ngắt ghi (head)", color: "#e8ca78" },
            { label: "Main đọc (tail)", color: "#84be88" },
            { label: "Ô Kho nhớ tĩnh", color: "#ad9cd8" }
          ],
          learnUnlock: [0],
          scene: { type: "ringbuf_static_pool" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Đọc số 64-bit không bị ngắt xen ngang & Kiểm thử bằng tệp CSV",
          body:
            "Trên STM32 32-bit, đọc một bộ đếm 64-bit chia thành 2 thanh ghi `hi` và `lo` có thể bị **xé dữ liệu** nếu ngắt tăng `lo` từ `0xFFFFFFFF → 0` làm `hi` nhảy lên ngay giữa hai lần đọc — thêm `volatile` **không** ngăn được! Phải dùng vòng đọc kiểm tra **`read_u64_coherent` (`hi1`, `lo`, `hi2`)** hoặc đoạn tắt ngắt ngắn. Trên PC, ta kiểm thử firmware bằng **tệp CSV**: đọc từng dòng bằng `fgets` + phân tích chặt `parse_u32_span` (kiểm tra `errno` & `endptr`), xuất báo cáo rồi so sánh với file chuẩn, và chạy `valgrind --leak-check=full --show-leak-kinds=all --error-exitcode=1` (chú ý **không** chạy Valgrind trên file build kèm `-fsanitize=address`!).",
          codeLang: "C · read_u64_coherent & kiểm tra rò rỉ Valgrind",
          code: `/* Đọc 64-bit nhất quán giữa main và ngắt trên vi điều khiển 32-bit */
bool read_u64_coherent(const volatile uint32_t *hi_reg,
                       const volatile uint32_t *lo_reg,
                       uint32_t max_retries, uint64_t *out_val) {
    if (!hi_reg || !lo_reg || !max_retries || !out_val) return false;
    for (uint32_t i = 0U; i < max_retries; i++) {
        uint32_t hi1 = *hi_reg;
        uint32_t lo  = *lo_reg;
        uint32_t hi2 = *hi_reg;
        if (hi1 == hi2) { /* không có tràn giữa lúc đọc lo */
            *out_val = ((uint64_t)hi1 << 32) | (uint64_t)lo;
            return true;
        }
    }
    return false;
}
/* Lệnh Valgrind chuẩn (build KHÔNG bật -fsanitize=address):
 * valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes --error-exitcode=1 /tmp/app
 */`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Tuyệt đối không kết hợp -fsanitize=address với Valgrind! ASan chiếm vùng nhớ theo dõi khổng lồ khiến Valgrind báo lỗi ngay lúc khởi động."
          },
          diff: [
            { op: "+", text: "Đọc hi1 → lo → hi2 rồi lặp lại khi hi1 != hi2 đảm bảo đọc cặp (hi, lo) khớp nhau mà không cần tắt ngắt dài." },
            { op: "+", text: "parse_u32_span dùng strtoul + kiểm tra endptr và chặn dấu +/- đầu chuỗi mà strtoul mặc định bỏ qua." }
          ],
          kpis: [
            { label: "Chống xé 64-bit", value: "hi1 == hi2", sub: "Đọc kép không khóa ngắt", tone: "sky" },
            { label: "Đọc tệp CSV", value: "fgets + span", sub: "Chặn dấu +/- & ký tự rác", tone: "amber" },
            { label: "Cổng Valgrind", value: "--error-exitcode=1", sub: "0 rò rỉ, 0 đọc sai", tone: "sage" }
          ],
          legend: [
            { label: "Đọc kép hi1/lo/hi2", color: "#84b4df" },
            { label: "Chạy thử tệp CSV", color: "#e8ca78" },
            { label: "0 rò rỉ Valgrind", color: "#84be88" }
          ],
          learnUnlock: [1],
          scene: {
            type: "flow",
            nodes: [
              ["read_u64_coherent", "Đọc hi1, lo, hi2; thử lại nếu ngắt chen ngang"],
              ["Chạy thử tệp CSV", "fgets + parse_u32_span xuất report.csv đối chiếu"],
              ["Valgrind sạch", "Bắt 100% rò rỉ/đọc bậy (build không kèm ASan)"]
            ]
          },
          openQuestions: [
            {
              id: "q-rb-hil",
              scenario: "ĐỒNG BỘ NGẮT & HÀNG ĐỢI VÒNG",
              prompt:
                "1) Nếu viết hàng đợi vòng kiểu cũ có biến `count` dùng chung giữa `UART_ISR` (`rb->count++`) và `main` (`rb->count--`), vì sao vẫn bị sai lệch dữ liệu dù đã thêm `volatile`? Thiết kế SPSC (1 bên ghi, 1 bên đọc) tách `head`/`tail` giải quyết triệt để thế nào? 2) Vì sao `read_u64_coherent` phải đọc thanh ghi `hi` tận 2 lần?",
              placeholder: "Giải thích thao tác Đọc-Sửa-Ghi trên count chung và kịch bản tràn 32-bit giữa lần đọc hi1 và lo...",
              hint: "count++ gồm 3 bước đọc-cộng-ghi nên dễ bị ngắt cắt ngang; tách head (chỉ ISR ghi) và tail (chỉ main ghi) loại bỏ ghi chung. Với 64-bit, nghĩ xem hi nhảy lên đúng lúc nào."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Quy tắc viết code C an toàn (MISRA): bật cảnh báo chặt & khóa biến ngoài biên",
          body:
            "Trong phần mềm ô tô/y tế (**MISRA C**), code không chỉ chạy đúng ở ca đẹp mà phải từ chối mọi dữ liệu vật lý phi lý và cấm mọi phép đổi kiểu ngầm. Bật bộ cờ **`-Wconversion -Wsign-conversion -Wcast-qual -Wstrict-prototypes`**, kiểm tra macro bằng `#if defined(...)` (`-Wundef`), dùng `static inline` kèm chặn miền `bit_pos < 32U` cho `1U << pos`, luôn đặt giá trị an toàn `*out = 0U` ngay đầu hàm trước mọi nhánh trả lỗi, và kiểm tra chặt độ dài, CRC, bộ đếm vòng, mã lỗi `0xFFFFU` cũng như khóa liên động phanh trước khi cho phép sang số.",
          codeLang: "C · viết code an toàn kiểu MISRA",
          code: `/* 1) Kiểm tra macro an toàn (-Wundef) & dịch bit chặn miền */
#if !defined(ECU_ENABLE_TRACE)
#define ECU_ENABLE_TRACE 0
#endif

static inline uint32_t ecu_bit_u32(uint8_t bit_pos) {
    if (bit_pos >= 32U) return 0U;
    return 1U << (unsigned int)bit_pos;
}

/* 2) Đặt giá trị an toàn trước mọi nhánh lỗi (fail-safe default) */
ecu_status_t ecu_pedal_to_permille(uint16_t raw_adc, uint16_t *out_permille) {
    if (out_permille == NULL) return ECU_ERR_NULL;
    *out_permille = 0U; /* an toàn ngay từ đầu kể cả khi thoát nhánh lỗi! */
    if (raw_adc > 4095U) return ECU_ERR_ARG;
    if (raw_adc <= 199U) return ECU_ERR_SENSOR_SHORT_GND;
    if (raw_adc >= 3901U) return ECU_ERR_SENSOR_SHORT_VCC;
    /* ... quy đổi tuyến tính trong dải hợp lệ ... */
    return ECU_OK;
}`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Nguyên tắc phòng vệ MISRA: (1) không đổi kiểu mất dấu/cắt bit ngầm, (2) gán sẵn giá trị an toàn cho mọi biến đầu ra trước khi kiểm tra, (3) tách riêng lỗi phần cứng (chập mass/chập nguồn) khỏi số đo hợp lệ."
          },
          diff: [
            { op: "+", text: "Bật -Wconversion -Wsign-conversion giúp lộ ngay mọi chỗ ép ngầm int ↔ unsigned hay mất bit." },
            { op: "+", text: "Chốt trạng thái GEAR_FAULT và yêu cầu (brake_pressed && speed <= 2.0 km/h) trước khi sang số." }
          ],
          kpis: [
            { label: "Cờ kiểu MISRA", value: "-Wconversion", sub: "+ sign-conv, cast-qual", tone: "sky" },
            { label: "An toàn mặc định", value: "*out = 0U", sub: "Gán trước mọi return lỗi", tone: "amber" },
            { label: "Chẩn đoán ADC", value: "<200 / >3900", sub: "Bắt chập GND / chập VCC", tone: "rose" }
          ],
          legend: [
            { label: "Cờ cảnh báo chặt", color: "#84b4df" },
            { label: "Chặn miền & chẩn đoán", color: "#e8ca78" },
            { label: "Khóa an toàn mặc định", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["-Wconversion -Wcast-qual", "Khóa chặt mọi đổi kiểu ngầm lúc biên dịch"],
              ["Fail-safe *out = 0U", "Không trả dữ liệu rác khi cảm biến hỏng"],
              ["CAN + Khóa liên động", "Kiểm độ dài/CRC/biên trước khi điều khiển"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Bộ ghi dữ liệu an toàn không dùng malloc",
          body:
            "Hoàn thiện bộ ghi dữ liệu cảm biến chạy RAM cố định: nối luồng xử lý từ `raw_log.csv` → `ring_buffer` tĩnh (dung lượng lũy thừa 2, đọc theo lô để chạy tệp dài bất kỳ với **RAM không đổi**) → `divider_adc` (`uint64_t` 1 phép chia duy nhất quy đổi cầu `30 kΩ / 10 kΩ` lên tới `13200 mV`) → lọc 2 tầng `Median-3` → `Moving Avg-4` → máy trạng thái có chống rung → xuất `report.csv` đối chiếu với `expected_report.csv`. Bắt buộc **0 `malloc/free`**, **0 `float/double`**, chạy sạch UBSan/ASan, Valgrind (`make valgrind`) và các cờ kiểm tra an toàn kiểu MISRA.",
          codeLang: "C · luồng xử lý Data Logger (0 malloc, 0 float)",
          code: `/* Quy đổi cầu phân áp 30k / 10k bằng ĐÚNG 1 phép chia uint64_t */
bool adc12_divider_to_vin_mv(uint16_t raw, uint32_t vref_mv,
                             uint32_t r1_ohm, uint32_t r2_ohm,
                             uint32_t *out_vin_mv) {
    if (out_vin_mv == NULL || raw > 4095U || r2_ohm == 0U) return false;
    uint64_t num = (uint64_t)raw * (uint64_t)vref_mv * ((uint64_t)r1_ohm + r2_ohm);
    uint64_t den = 4095ULL * (uint64_t)r2_ohm;
    *out_vin_mv = (uint32_t)((num + (den / 2ULL)) / den);
    return true;
}
/* raw = 4095, vref = 3300, r1 = 30000, r2 = 10000 -> out_vin_mv = 13200 mV */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Gộp tử số và mẫu số vào một phép chia uint64_t duy nhất tránh sai số làm tròn kép. Dùng Valgrind kiểm tra 0 rò rỉ + so sánh diff expected_report.csv để kiểm thử tự động."
          },
          diff: [
            { op: "+", text: "Toàn bộ đường xử lý dữ liệu dùng RAM cố định qua ring_buffer tĩnh và filter_ctx_t trên stack." },
            { op: "+", text: "Kiểm thử với cả make test (ASan/UBSan) và make valgrind (build thường) đạt 0 lỗi, 0 rò rỉ." }
          ],
          kpis: [
            { label: "Heap / Float", value: "0 / 0", sub: "RAM tĩnh cố định 100%", tone: "sage" },
            { label: "Thang đo pin 3S", value: "0..13,200 mV", sub: "1 phép chia uint64_t", tone: "sky" },
            { label: "Đối chiếu chuẩn", value: "CSV + Valgrind", sub: "Khớp 100% expected", tone: "amber" }
          ],
          legend: [
            { label: "CSV Batch → RingBuf", color: "#84b4df" },
            { label: "Divider + Filter + FSM", color: "#ad9cd8" },
            { label: "Đối chiếu & Valgrind", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["raw_log.csv → ring_buffer", "Nạp theo lô, dùng RAM tĩnh cố định"],
              ["divider_adc → Med3 → Avg4", "1 phép chia uint64_t, không float"],
              ["monitor_fsm → report.csv", "Đối chiếu diff & Valgrind 0 rò rỉ"]
            ]
          },
          quiz: [
            {
              prompt:
                "Vì sao hàng đợi vòng (`ring_buffer`) dùng `_Static_assert((RB_CAP & (RB_CAP - 1U)) == 0U)` trước khi cập nhật chỉ số bằng `(idx + 1U) & (RB_CAP - 1U)`?",
              options: [
                "Để biến ring_buffer thành bộ nhớ cấp phát động trên heap",
                "Vì phép mặt nạ `& (CAP - 1U)` chỉ quay vòng đúng từ `CAP - 1` về `0` khi `CAP` là lũy thừa của 2",
                "Để ép kích thước phần tử luôn bằng 8 byte"
              ],
              correctIndex: 1,
              explain:
                "Nếu CAP = 10, CAP - 1 = 9 (0b1001) sẽ bỏ qua nhiều ô nhớ và nhảy sai chỉ số. Chỉ khi CAP là 2^k, CAP - 1 mới gồm toàn bit 1 liên tiếp (ví dụ 15 = 0b1111)."
            },
            {
              prompt:
                "Chuyện gì xảy ra nếu bạn chạy `valgrind` trực tiếp trên tệp thực thi vừa biên dịch kèm cờ `-fsanitize=address`?",
              options: [
                "Valgrind báo xung đột/không khởi chạy được vì ASan đã chiếm vùng nhớ theo dõi khổng lồ",
                "Valgrind tự động tắt ASan và chạy nhanh gấp đôi",
                "Chương trình không xuất ra output chuẩn"
              ],
              correctIndex: 0,
              explain:
                "ASan và Valgrind đều chiếm quyền quản lý bộ nhớ ảo theo cơ chế riêng nên xung đột nhau. Luôn build bản riêng không có -fsanitize=address khi chạy Valgrind."
            }
          ]
        }
      ]
    }
  ];
}
