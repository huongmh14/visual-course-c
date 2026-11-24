export function createPhaseACLessons() {
  return [
    {
      id: "c-operators-conversions",
      number: "05",
      title: "Toán tử, chuyển kiểu & bẫy Signed/Unsigned",
      duration: "70 phút",
      level: "Nền tảng",
      subtitle:
        "Ngày 03 · Hiểu integer promotion, bẫy so sánh -1 < 1U, tràn phép nhân ADC trên MCU 16-bit, quay vòng timer và phép chia/cộng bão hòa không UB.",
      locked: false,
      youllLearn: [
        "Xác định đúng kiểu và giá trị của biểu thức qua quy tắc nâng kiểu (integer promotion) và chuyển đổi số học",
        "Tránh UB khi chia INT32_MIN / -1, sửa biến nhiều lần (i = i++) và tràn phép nhân ADC trên đích 16-bit",
        "Viết kiểm tra hết thời gian (now - start) >= timeout đúng cả khi bộ đếm 16-bit/32-bit quay vòng"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Integer Promotion, bẫy -1 < 1U & chia làm tròn gần nhất",
          body:
            "Mỗi biểu thức C vừa có **giá trị**, vừa có **kiểu**. Trước khi thực hiện `+ - * /`, các kiểu hẹp hơn `int` (`uint8_t`, `int8_t`, `uint16_t`) được **nâng lên `int`** (nếu `int` chứa đủ miền giá trị). Khi trộn `int` với `unsigned int` (ví dụ `-1 < 1U`), quy tắc chuyển đổi số học ép `-1` thành `UINT_MAX` (`4294967295U`), khiến biểu thức cho **SAI (`0`)**! Phép chia nguyên `/` luôn làm tròn về `0`, nên muốn làm tròn gần nhất nửa ra xa `0` (`div_round`, ví dụ `7 / 2 → 4`, `-7 / 2 → -4`), phải xét thương `q = a / b`, phần dư `r = a % b` và dấu mà không cộng `b / 2` trực tiếp vào `a` để tránh tràn.",
          codeLang: "C17 · integer promotion, -1 < 1U & div_round",
          code: `#include <limits.h>
#include <stdint.h>

/* 1) Nâng kiểu: uint8_t + uint8_t tính ở kiểu int */
uint8_t u1 = 200U, u2 = 100U;
int sum = u1 + u2;            /* 300 ở int (không phải 44!), ép (uint8_t) mới thành 44 */

/* 2) Bẫy -1 < 1U: int bị ép sang unsigned int */
int x = -1;
unsigned int len = 1U;
/* (x < len) cho kết quả 0 vì (unsigned int)(-1) == UINT_MAX! */
int safe_cmp = (x < 0) || ((unsigned int)x < len); /* luôn kiểm tra âm trước */

/* 3) Chia làm tròn nửa ra xa 0 không tràn với INT32_MAX */
int32_t div_round(int32_t a, int32_t b) {
    if (b == 0) return 0;
    if (a == INT32_MIN && b == -1) return INT32_MAX; /* chặn UB */
    int32_t q = a / b;
    int32_t r = a % b;
    int32_t abs_r = (r < 0) ? -r : r; /* r ∈ (INT32_MIN, INT32_MAX] nên -r an toàn nếu b != -1 */
    int32_t abs_b_half = ((b < 0) ? -(b / 2) : (b / 2));
    /* Kiểm tra 2*|r| >= |b| mà không nhân 2 gây tràn bằng cách so với nửa |b| */
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
            { label: "Nâng kiểu lên int", color: "#84b4df" },
            { label: "Ép signed → unsigned", color: "#e57373" },
            { label: "Làm tròn an toàn", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: { type: "conv_promotion_trap" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Chia INT32_MIN / -1, UB sửa biến & ADC trên MCU 16-bit",
          body:
            "Trên CPU bù hai 32-bit, `INT32_MIN` bằng `-2^31`, còn `INT32_MAX` chỉ tới `2^31 - 1`. Do đó `INT32_MIN / -1` bằng `+2^31`, **vượt quá miền `int32_t` và là Undefined Behavior (UB)** — trên x86 thường gây crash `SIGFPE`! Tương tự, `i = i++` hay `a[i] = i++` sửa cùng một biến hai lần không có điểm phân tách thứ tự là UB hoàn toàn. Khi quy đổi ADC 12-bit `raw * 3300U / 4095U`, tích `4095 * 3300 = 13,513,500` chạy êm trên STM32 (`int` 32-bit) nhưng **tràn 16-bit** trên AVR/MSP430 nếu bạn ép `(uint32_t)` **sau** phép nhân `(uint32_t)(raw * 3300U)`.",
          codeLang: "C17 · chặn UB & mở rộng kiểu trước phép nhân",
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

/* 2) UB: mỗi câu lệnh chỉ sửa tối đa 1 lần */
/* SAI (UB): int k = i++ + ++i; */
/* ĐÚNG: tách thành từng câu lệnh rõ ràng */

/* 3) ADC 12-bit (0..4095) -> mV (0..3300) chạy giống nhau trên mọi MCU 16/32-bit */
uint16_t adc_to_mv(uint16_t raw) {
    /* Ép toán hạng đầu sang uint32_t TRƯỚC khi nhân để không tràn int 16-bit */
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
            { op: "-", text: "(uint32_t)(raw * 3300U) trên MCU int 16-bit chỉ giữ 13,513,500 mod 65,536 = 13,084!" }
          ],
          kpis: [
            { label: "INT32_MIN / -1", value: "UB (Tràn +2³¹)", sub: "Bắt buộc chặn trước /", tone: "rose" },
            { label: "4095 × 3300", value: "13,513,500", sub: "Tràn int 16-bit (65,535)", tone: "amber" },
            { label: "Ép trước nhân", value: "(uint32_t)raw *", sub: "Di động mọi MCU", tone: "sage" }
          ],
          legend: [
            { label: "Ép kiểu mở rộng", color: "#84be88" },
            { label: "Miền trung gian 32-bit", color: "#84b4df" },
            { label: "Chặn UB biên", color: "#e57373" }
          ],
          learnUnlock: [1],
          scene: {
            type: "flow",
            nodes: [
              ["raw (uint16_t)", "Tối đa 4095U"],
              ["(uint32_t)raw * 3300U", "Mở rộng 32-bit trước khi nhân → 13,513,500"],
              ["(+ 2047U) / 4095U", "Làm tròn gần nhất → 3300 mV không UB"]
            ]
          },
          openQuestions: [
            {
              id: "q-conv-adc16",
              scenario: "CÂU HỎI KỸ THUẬT · MCU 16-BIT VS 32-BIT",
              prompt:
                "Trên PC Ubuntu 64-bit và STM32 (`int` 32-bit), hai dòng `(uint32_t)(raw * 3300U)` và `(uint32_t)raw * 3300U` cho cùng một đáp án khi `raw = 4095`. Vì sao trên MCU AVR có `int` 16-bit dòng đầu lại sai, và vì sao `INT32_MIN / -1` lại bị coi là UB dù phép chia không chia cho 0?",
              placeholder: "Phân tích kiểu trung gian khi nhân trên int 16-bit và miền giá trị bù hai của INT32_MIN...",
              hint: "Kiểm tra kiểu của raw * 3300U khi unsigned int chỉ rộng 16 bit (0..65535), và so sánh |-2147483648| với INT32_MAX = +2147483647."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Quay vòng Timer không dấu: (uint32_t)(now - start) >= timeout",
          body:
            "Bộ đếm tick 1 ms trên MCU luôn quay vòng về `0` sau `UINT16_MAX` (`65,535`) hoặc `UINT32_MAX` (`49,7` ngày). Cách viết ngây thơ `now >= start + timeout` **hỏng ngay trước lúc quay vòng** vì `start + timeout` quay về số nhỏ trước `now`. Phép trừ không dấu `now - start` tính theo modulo `2^N` luôn cho đúng khoảng thời gian đã trôi qua (`now = 5, start = 0xFFFFFFF0 → 21`). Riêng với timer **16-bit (`uint16_t`)**, nếu không ép `(uint16_t)(now - start)`, cả hai toán hạng bị nâng thành `int` nên `5 - 65520 = -65515 < 20` bị sai!",
          codeLang: "C17 · timeout quay vòng 16-bit & 32-bit",
          code: `#include <stdbool.h>
#include <stdint.h>

/* Đúng trên mọi độ rộng timer nếu khoảng chờ < 2^N */
bool timeout_elapsed32(uint32_t now, uint32_t start, uint32_t timeout) {
    return (uint32_t)(now - start) >= timeout;
}

bool timeout_elapsed16(uint16_t now, uint16_t start, uint16_t timeout) {
    /* Nếu bỏ (uint16_t): int(5) - int(0xFFF0) = -65515 -> sai! */
    return (uint16_t)(now - start) >= timeout;
}

/* Ví dụ kiểm thử tại biên quay vòng:
 * start = 0xFFF0U, now = 5U -> đã qua 21 tick (0xFFF0..0xFFFF là 16, 0..5 là 5)
 * (uint16_t)(5U - 0xFFF0U) == 21U >= 20U -> true!
 */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Luôn viết (uint16_t)(now - start) >= timeout hoặc (uint32_t)(now - start) >= timeout. Phép trừ modulo cho đúng hiệu đã trôi qua miễn chu kỳ chờ thực < một vòng đếm."
          },
          diff: [
            { op: "+", text: "now = 5U, start = 0xFFF0U → (uint16_t)(now - start) = 21U, so với timeout = 20U trả true." },
            { op: "-", text: "now >= start + timeout với start = 0xFFF0U, timeout = 20U cho start + timeout = 4 → sai khi now = 0xFFF5U!" }
          ],
          kpis: [
            { label: "Timer 32-bit", value: "49,7 ngày", sub: "1 tick = 1 ms", tone: "sky" },
            { label: "5 - 0xFFF0 (int)", value: "-65,515", sub: "Sai do integer promotion", tone: "rose" },
            { label: "(uint16_t)(5 - 0xFFF0)", value: "21 tick", sub: "Modulo 65,536 chuẩn", tone: "sage" }
          ],
          legend: [
            { label: "Quay vòng qua 0", color: "#e8ca78" },
            { label: "Promotion âm (lỗi)", color: "#e57373" },
            { label: "Hiệu modulo chuẩn", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: { type: "conv_timer_wrap" }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · div_round, timeout16 & phép toán bão hòa (03-operators)",
          body:
            "Hoàn thiện bộ bài tập `03-operators-conversions/04_practice_exercises.md` trong `submission.c` trên Ubuntu WSL với `-std=c17 -Wall -Wextra -Wpedantic -Werror -fsanitize=undefined` (và thử soi thêm cảnh báo bằng `-Wconversion`): (1) `div_round(a, b)` mọi tổ hợp dấu + biên `INT32_MIN`, (2) `timeout_elapsed16/32` qua mốc quay vòng, (3) `adc_to_temp_x10(raw)` cho TMP36 (`500 mV + 10 mV/°C`) trả `INT16_MIN` khi `raw > 4095U`, (4) phép cộng bão hòa `sat_add_u8`, `sat_add_i16` và `brightness_step(level, delta)` kẹp `[0..255]` không tràn.",
          codeLang: "C17 · submission.c & assert biên (03-operators-conversions)",
          code: `/* Biên dịch:
 * gcc -std=c17 -Wall -Wextra -Wpedantic -Werror -fsanitize=undefined submission.c -o /tmp/day03
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
            text: "Với sat_add_i16(a, b), có thể cộng trên int32_t rồi kẹp, nhưng khi viết sat_add_i32(int32_t a, int32_t b) phải kiểm tra điều kiện tràn TRƯỚC khi cộng vì tràn số có dấu là UB."
          },
          diff: [
            { op: "+", text: "Bật -fsanitize=undefined để bắt tức thì mọi lỗi tràn có dấu hoặc chia cho 0 lúc chạy thử." },
            { op: "+", text: "Dùng INT16_MIN làm mã lỗi cho adc_to_temp_x10 thay cho -1 (vì -1 ứng với -0.1 °C hợp lệ)." }
          ],
          kpis: [
            { label: "Lý thuyết", value: "10 câu · 20đ", sub: "03_theory_questions.md", tone: "sky" },
            { label: "4 hàm C17", value: "80 điểm", sub: "div, timeout, ADC, sat", tone: "amber" },
            { label: "Sanitizer", value: "UBSan sạch", sub: "-fsanitize=undefined", tone: "sage" }
          ],
          legend: [
            { label: "Đầu vào & biên", color: "#84b4df" },
            { label: "Kiểm tra không UB", color: "#e8ca78" },
            { label: "Assert đạt chuẩn", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["6 bước thiết kế", "Liệt kê giá trị trung gian max/min"],
              ["Cài đặt C17", "div_round + timeout + adc_temp + sat_add"],
              ["UBSan + assert", "Chạy sạch mọi ca biên INT32_MIN / 0xFFF0"]
            ]
          },
          quiz: [
            {
              prompt:
                "Với uint16_t now = 5U, start = 0xFFF0U, timeout = 20U trên PC 32-bit, vì sao điều kiện `if (now - start >= timeout)` KHÔNG chạy trong khi `if ((uint16_t)(now - start) >= timeout)` chạy đúng?",
              options: [
                "Vì uint16_t tự nâng lên int nên 5 - 65520 = -65515 < 20; ép (uint16_t) đưa hiệu về modulo 65536 = 21",
                "Vì phép trừ hai số uint16_t luôn bị tràn thành 0",
                "Vì hằng số 20U có kiểu unsigned long"
              ],
              correctIndex: 0,
              explain:
                "Theo integer promotion, hai toán hạng uint16_t nâng thành int (32-bit) trước khi trừ cho kết quả âm -65515. Ép (uint16_t) khôi phục đúng phần dư modulo 2^16 = 21."
            },
            {
              prompt:
                "Trên MCU AVR có `int` 16-bit, với `uint16_t raw = 4095U`, biểu thức nào tính `raw * 3300U` KHÔNG bị tràn 16-bit?",
              options: [
                "(uint32_t)(raw * 3300U)",
                "(uint32_t)raw * 3300U",
                "(uint16_t)raw * 3300"
              ],
              correctIndex: 1,
              explain:
                "Phải ép một toán hạng sang uint32_t TRƯỚC phép nhân; nếu ép sau (raw * 3300U), phép nhân đã chạy ở unsigned int 16-bit và tràn trước khi ép kiểu."
            }
          ]
        }
      ]
    },
    {
      id: "c-modular-makefile",
      number: "06",
      title: "Hàm thuần, Header nhiều tệp, Chuỗi UART & Makefile",
      duration: "75 phút",
      level: "Nền tảng",
      subtitle:
        "Ngày 06–10 & P2 · Tách hàm thuần không trạng thái ẩn, bảo vệ header đa tệp, lọc mảng cảm biến, parse chuỗi an toàn và build chuẩn Makefile (-MMD -MP).",
      locked: false,
      youllLearn: [
        "Thiết kế hàm thuần và mẫu bool fn(..., T *out) tách khỏi printf/biến static toàn cục ẩn",
        "Tổ chức nhiều tệp .h/.c đúng chuẩn (include guard, extern, static inline) với Makefile -MMD -MP",
        "Viết bộ lọc mảng cảm biến (Median-3, Moving Avg-4) và parse/format chuỗi UART/NMEA chống tràn"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Hàm thuần, vùng trễ (Hysteresis) & hợp đồng bool fn(..., T *out)",
          body:
            "Đặt trạng thái cảnh báo vào biến `static` bên trong hàm khiến hàm **không dùng lại được cho 2 cảm biến** và khó test độc lập. Giải pháp là viết **hàm thuần** `alarm_update(bool current, int16_t temp_c)` nhận trạng thái cũ qua tham số và trả về trạng thái mới (vùng trễ bật `>= 60 °C`, tắt `<= 55 °C`, ở giữa giữ `current`). Khi hàm có thể lỗi (chia 0, `NULL`, ngoài miền), dùng mẫu chuẩn firmware **trả về `bool`** (hoặc `enum status_t`) còn giá trị thật ghi qua con trỏ đầu ra `*out` — và **không sửa `*out`** nếu kiểm tra lỗi thất bại!",
          codeLang: "C17 · 02_functions_self_check.c — hàm thuần & out-pointer",
          code: `#include <limits.h>
#include <stdbool.h>
#include <stdint.h>

/* Hàm thuần vùng trễ (hysteresis): không giữ static ẩn, test được mọi kênh */
bool alarm_update(bool current, int16_t temp_c) {
    if (temp_c >= 60) {
        return true;
    }
    if (temp_c <= 55) {
        return false;
    }
    return current;
}

/* Mẫu trả trạng thái bool + ghi kết quả qua con trỏ đầu ra */
bool safe_div_i32(int32_t a, int32_t b, int32_t *out_q) {
    if (out_q == NULL || b == 0 || (a == INT32_MIN && b == -1)) {
        return false; /* không động vào *out_q khi lỗi */
    }
    *out_q = a / b;
    return true;
}`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Tách logic xử lý khỏi printf/scanf: hàm nghiệp vụ thuần không gọi printf nên chạy y hệt trên cả unit test PC lẫn STM32."
          },
          diff: [
            { op: "+", text: "Truyền trạng thái current từ ngoài vào giúp 1 hàm alarm_update phục vụ đồng thời nhiều cảm biến." },
            { op: "-", text: "Tránh nhét static bool alarm bên trong hàm khi hệ thống có nhiều kênh đo độc lập." }
          ],
          kpis: [
            { label: "Hàm thuần", value: "0 side-effect", sub: "Cùng input → cùng output", tone: "sage" },
            { label: "Vùng trễ", value: "55..60 °C", sub: "Chống nhấp nháy rơ-le", tone: "amber" },
            { label: "Hợp đồng lỗi", value: "bool + *out", sub: "Lỗi thì giữ nguyên *out", tone: "sky" }
          ],
          legend: [
            { label: "Ngõ vào thuần", color: "#84b4df" },
            { label: "Kiểm tra biên / NULL", color: "#e8ca78" },
            { label: "Cập nhật *out an toàn", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: {
            type: "flow",
            nodes: [
              ["(current, temp_c)", "Tham số tường minh, không global ẩn"],
              ["Guard NULL / biên", "Lỗi → trả false, giữ nguyên *out"],
              ["Pure output", "Dễ viết assert test mọi chuyển trạng thái"]
            ]
          }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Header nhiều tệp, Macro vs static inline & Makefile -MMD -MP",
          body:
            "File `.h` chỉ chứa **khai báo (`extern` / prototype), kiểu dữ liệu và `static inline`**, tuyệt đối không đặt định nghĩa biến toàn cục hay hàm thường không có `static inline` kẻo linker báo **`multiple definition`** khi hai tệp `.c` cùng `#include`. Mọi macro hàm như `SQR(x)` phải bọc ngoặc `((x) * (x))` (hoặc dùng `do { ... } while (0)` cho nhiều lệnh), nhưng ưu tiên **`static inline`** để trình biên dịch kiểm tra kiểu và không tính đối số `x++` hai lần. Trong `Makefile`, bật `-MMD -MP` cùng `-include $(DEPS)` để tự động biên dịch lại `.o` khi `.h` thay đổi, và khai báo `.PHONY` cho `all`, `test`, `size`, `clean`.",
          codeLang: "Header C17 + Makefile (-MMD -MP)",
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
// CFLAGS  := -std=c17 -Wall -Wextra -Wpedantic -Werror -Wshadow -MMD -MP -Isrc
// DEPS    := $(OBJS:.o=.d)
// .PHONY: all test size clean
// -include $(DEPS)`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Không dùng #define để định nghĩa biến toàn cục hay đặt thân hàm non-inline trong .h. Thiếu -MMD -MP hoặc -include $(DEPS), sửa hằng trong .h nhưng gõ make sẽ KHÔNG build lại .c!"
          },
          diff: [
            { op: "+", text: "static inline kiểm tra kiểu tĩnh và chỉ tính đối số đúng 1 lần, thay thế macro hàm đơn giản." },
            { op: "-", text: "Đặt int g_count = 0; trong file .h sẽ gây lỗi multiple definition ở bước liên kết (ld)." }
          ],
          kpis: [
            { label: "Include guard", value: "#ifndef _H", sub: "Chống nạp trùng trong 1 TU", tone: "sky" },
            { label: "Đa lệnh macro", value: "do{...}while(0)", sub: "An toàn trong nhánh if/else", tone: "amber" },
            { label: "Auto-dep", value: "-MMD -MP", sub: "Tự theo dõi sửa file .h", tone: "sage" }
          ],
          legend: [
            { label: "Biên dịch .c → .o + .d", color: "#84b4df" },
            { label: "Theo dõi phụ thuộc .h", color: "#e8ca78" },
            { label: "Liên kết tạo ELF", color: "#84be88" }
          ],
          learnUnlock: [1],
          scene: { type: "modular_build_dag" },
          openQuestions: [
            {
              id: "q-mod-scratch",
              scenario: "THIẾT KẾ THƯ VIỆN NHÚNG · P2 SENSOR LIB",
              prompt:
                "1) Trong `sf_pipeline_filter(raw_in, clean_out, scratch, len)`, vì sao API bắt người gọi truyền mảng tạm `scratch[]` từ ngoài vào thay vì khai báo một mảng `static uint16_t scratch[256]` bên trong hàm hay gọi `malloc`? 2) Nếu thiếu cờ `-MMD -MP` và `-include $(DEPS)` trong `Makefile`, lỗi gì âm thầm xảy ra khi bạn đổi hằng `#define SENSOR_VREF_MV` trong file `.h`?",
              placeholder: "Phân tích reentrancy/RAM cố định của scratch[] và lỗi stale .o của Makefile...",
              hint: "Nghĩ về giới hạn kích thước mảng cố định/thread-safety/zero-heap trên MCU và việc make chỉ nhìn timestamp của .c nếu không có tệp .d."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Suy biến mảng (Array Decay), lọc Median-3/Avg-4 & chuỗi UART an toàn",
          body:
            "Khi truyền mảng vào hàm `f(const uint16_t buf[], size_t len)`, `buf` tự suy biến thành con trỏ nên `sizeof(buf)` trả về kích thước con trỏ (4 hoặc 8 byte), **không** trả về số phần tử — chỉ dùng `ARRAY_LEN(arr)` trong cùng scope của mảng thật! Với tín hiệu cảm biến có gai nhiễu đột biến, tầng **Median-3** gạt bỏ gai 1 mẫu trước khi **Moving Avg-4** làm mượt. Với chuỗi UART/CLI, **cấm dùng `atoi`, `strcpy`, `strtok`**: viết `parse_u16` chặn từng chữ số chống tràn `(65535U - d) / 10U`, kiểm tra cắt cụt `snprintf(...) >= buf_size`, và tính checksum NMEA bằng XOR từng byte payload.",
          codeLang: "C17 · lọc nhiễu + parse_u16 & NMEA XOR checksum",
          code: `/* 1) Trung vị 3 điểm (loại gai nhiễu tức thời không làm mờ sườn) */
uint16_t sf_median3_u16(uint16_t a, uint16_t b, uint16_t c) {
    if (a > b) { uint16_t t = a; a = b; b = t; }
    if (b > c) { uint16_t t = b; b = c; c = t; }
    if (a > b) { uint16_t t = a; a = b; b = t; }
    return b;
}

/* 2) Parse số nguyên không dấu thay atoi: phát hiện chữ lạ và tràn u16 */
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
            text: "atoi(\"abc\") trả 0 không báo lỗi còn tràn số trong atoi là UB! Tương tự, snprintf luôn trả độ dài ĐÁNG LẼ phải ghi — phải kiểm tra n < 0 || (size_t)n >= buf_size để bắt lỗi cắt cụt chuỗi."
          },
          diff: [
            { op: "+", text: "Median-3 giữ nguyên biên nhưng triệt tiêu hoàn toàn gai nhiễu đơn lẻ (spike) mà không kéo lệch mức nền." },
            { op: "-", text: "strtok làm biến đổi (ghi '\\0' vào) chuỗi gốc và dùng con trỏ tĩnh toàn cục không an toàn." }
          ],
          kpis: [
            { label: "Array param", value: "Con trỏ + len", sub: "sizeof cho 4/8 byte", tone: "rose" },
            { label: "Lọc 2 tầng", value: "Med-3 → Avg-4", sub: "Khử gai rồi làm mượt", tone: "sky" },
            { label: "NMEA XOR", value: "$payload*CS", sub: "XOR từng byte payload", tone: "sage" }
          ],
          legend: [
            { label: "Khử gai Median-3", color: "#ad9cd8" },
            { label: "Làm mượt Avg-4", color: "#84b4df" },
            { label: "Parser an toàn", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["raw_in[] + len", "Truyền kích thước tường minh, từ chối NULL/aliasing"],
              ["Median-3 → Avg-4", "Triệt gai đột biến trước khi chia trung bình 4"],
              ["parse_u16 / snprintf", "Kiểm tra ký tự, tràn 65535 và cắt cụt buffer"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Xây dựng thư viện đa tệp p2-sensor-lib (make test & size)",
          body:
            "Hoàn thành Mini-project `p2-sensor-lib/work/` kết hợp toàn bộ kiến thức Tuần 2: module `sensor_filter.h/.c` (Median-3, Moving Avg-4, Hysteresis, Pipeline 2 tầng truyền `scratch[]` chống aliasing `in == out`), module `cli.h/.c` (đóng gói cấu hình `th = 3000, hys = 200` bằng `static`, hỗ trợ `SET TH`, `SET HYS`, `GET`, `RESET` với enum lỗi `cli_status_t`), `main.c` và `test_filter.c`. Biên dịch qua `Makefile` có `-MMD -MP`, chạy `make`, `make test` và `make size` xem kích thước từng section `.text/.data/.bss`, kèm tài liệu API trong `work/README.md`.",
          codeLang: "Makefile & assert · p2-sensor-lib/work",
          code: `/* Chạy tại p2-sensor-lib/work trên Ubuntu WSL:
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
            text: "Tiêu chuẩn API sạch: một kỹ sư khác chỉ cần đọc work/README.md và các file .h là sử dụng đúng 100% thư viện mà không phải mở bất kỳ file .c nào."
          },
          diff: [
            { op: "+", text: "make test phải chạy sạch 0 cảnh báo với -std=c17 -Wall -Wextra -Wpedantic -Werror -Wshadow." },
            { op: "+", text: "make size in chính xác dung lượng .text (Flash), .data và .bss (SRAM) của chương trình." }
          ],
          kpis: [
            { label: "Module lọc", value: "25 điểm", sub: "Med-3 + Avg-4 + Hys", tone: "sky" },
            { label: "Parser CLI", value: "25 điểm", sub: "Không strtok / atoi", tone: "amber" },
            { label: "Makefile & API", value: "50 điểm", sub: "-MMD -MP + README", tone: "sage" }
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
              ["Makefile (-MMD -MP)", "Tự rebuild khi .h đổi, hỗ trợ DEBUG=1"],
              ["make test && make size", "Kiểm thử assert toàn diện & soi Flash/SRAM"]
            ]
          },
          quiz: [
            {
              prompt:
                "Khai báo nào đặt trong tệp `.h` sẽ gây lỗi `multiple definition` của linker khi hai tệp `.c` cùng `#include` nó?",
              options: [
                "extern uint32_t g_tick;",
                "static inline uint32_t clamp_u32(uint32_t x) { return x; }",
                "uint32_t g_tick = 0U;"
              ],
              correctIndex: 2,
              explain:
                "uint32_t g_tick = 0U; là định nghĩa biến toàn cục (tạo symbol mạnh) nên bị trùng ở mọi translation unit include .h. Hãy đặt extern trong .h và định nghĩa đúng 1 lần trong một .c."
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
      title: "Callback ngắt, Dispatch Table, Enum & Máy trạng thái FSM",
      duration: "75 phút",
      level: "Trung bình",
      subtitle:
        "Ngày 11–14 & P3 · Phân biệt 3 vị trí const, con trỏ hàm + user_ctx, bảng điều phối lệnh, -Wswitch với enum, tagged union và thiết kế FSM khóa cửa.",
      locked: false,
      youllLearn: [
        "Đọc đúng 3 vị trí const (IDR vs ODR), dùng con trỏ p < end và truyền callback với void *user_ctx",
        "Xây dựng Dispatch Table và FSM dùng enum + -Wswitch không để default che lấp trạng thái thiếu",
        "Đóng gói dữ liệu sự kiện gọn nhẹ bằng Tagged Union và đổi bit an toàn bằng memcpy thay ép kiểu union"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "3 vị trí const trên thanh ghi MMIO & Callback có void *user_ctx",
          body:
            "Đọc khai báo con trỏ **từ phải sang trái quanh dấu `*`**: `const volatile uint32_t *idr` là con trỏ trỏ tới ô nhớ **chỉ đọc và dễ biến đổi bởi phần cứng** (`GPIOx->IDR` — đọc được nhưng không được ghi); còn `volatile uint32_t *const odr` là con trỏ có **địa chỉ cố định** (luôn trỏ đúng `0x4001080C`) nhưng giá trị thanh ghi thay đổi được. Khi viết thư viện duyệt mẫu hay trình xử lý sự kiện dùng **con trỏ hàm (`typedef`)**, luôn kèm tham số **`void *user_ctx`** để nhiều instance (như 2 cảm biến hoặc 2 nút nhấn) truyền ngữ cảnh riêng vào callback mà không cần biến toàn cục.",
          codeLang: "C17 · 3 vị trí const & callback kèm user_ctx",
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
            text: "Không trả về địa chỉ biến cục bộ trên stack (dangling pointer) và luôn kiểm tra NULL trước khi giải tham chiếu con trỏ hoặc gọi con trỏ hàm cb(x, ctx)!"
          },
          diff: [
            { op: "+", text: "typedef void (*sample_cb_t)(uint16_t, void *) giúp chữ ký hàm đăng ký callback sạch và dễ đọc." },
            { op: "-", text: "Quên void *user_ctx ép lập trình viên dùng biến toàn cục, làm driver chỉ chạy được 1 instance." }
          ],
          kpis: [
            { label: "const T *p", value: "Chỉ đọc *p", sub: "Mô hình thanh ghi IDR", tone: "sky" },
            { label: "T *const p", value: "Cố định địa chỉ", sub: "Trỏ cứng vào ODR", tone: "amber" },
            { label: "void *user_ctx", value: "0 global", sub: "Đa kênh / reentrant", tone: "sage" }
          ],
          legend: [
            { label: "Bảo vệ const / NULL", color: "#e8ca78" },
            { label: "Số học p < end", color: "#84b4df" },
            { label: "Callback + user_ctx", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: {
            type: "flow",
            nodes: [
              ["const / NULL guard", "Chặn con trỏ rỗng & bảo vệ thanh ghi chỉ đọc"],
              ["for (p = buf; p < end; p++)", "Duyệt mảng O(1) bước nhảy sizeof(*p)"],
              ["cb(*p, user_ctx)", "Đẩy dữ liệu ra caller không dùng global"]
            ]
          }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Dispatch Table, Enum + -Wswitch & Máy trạng thái FSM",
          body:
            "Thay vì chuỗi `if (strcmp(...)) ... else if ...` dài dằng dặc, **Dispatch Table** đặt cặp `{tên_lệnh, handler}` vào mảng `static const` nằm gọn trong Flash (`.rodata`) — thêm lệnh mới chỉ cần thêm 1 dòng vào bảng. Với máy trạng thái FSM (`enum`), luôn đặt phần tử đếm cuối như `STATE_COUNT`, kiểm tra giá trị ngoài miền trước khi vào `switch`, và **bỏ `default:`** khi bật `-Wswitch` để trình biên dịch báo lỗi ngay nếu bạn thêm trạng thái mới mà quên xử lý nó! Khi có nhiều cặp `(state, event)`, **Transition Table** (hoặc `switch` theo `state` với hàm `door_fsm_step`) giữ 100% logic chuyển trạng thái tập trung một chỗ.",
          codeLang: "C17 · Dispatch Table & Enum -Wswitch FSM",
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

/* Dispatch Table lệnh đặt trong .rodata (Flash) */
typedef bool (*cmd_fn_t)(const char *arg, void *ctx);
typedef struct { const char *name; cmd_fn_t fn; } cmd_entry_t;
static const cmd_entry_t k_cmds[] = {
    { "SET", handle_set }, { "GET", handle_get }, { "RESET", handle_reset }
};`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Đặt default: trong switch theo enum vô tình che mất cảnh báo của -Wswitch khi sau này dự án bổ sung trạng thái mới. Hãy liệt kê đủ các case và kiểm tra bounds trước switch."
          },
          diff: [
            { op: "+", text: "Bảng k_cmds[] dùng static const nằm trong Flash (.rodata), không tốn SRAM." },
            { op: "+", text: "Bỏ default: trên enum + sentinel _COUNT biến trình biên dịch thành công cụ kiểm tra thiếu trạng thái." }
          ],
          kpis: [
            { label: "Dispatch Table", value: "static const", sub: "Bảng tra trong Flash", tone: "sky" },
            { label: "Enum check", value: "-Wswitch", sub: "Bắt thiếu case lúc build", tone: "amber" },
            { label: "4 trạng thái", value: "LOCKED..LOCKOUT", sub: "Chuyển tiếp tường minh", tone: "sage" }
          ],
          legend: [
            { label: "Dispatch / Input Event", color: "#84b4df" },
            { label: "Kiểm tra điều kiện / -Wswitch", color: "#e8ca78" },
            { label: "Trạng thái kế tiếp", color: "#84be88" }
          ],
          learnUnlock: [1],
          scene: { type: "fsm_callback_table" },
          openQuestions: [
            {
              id: "q-fsm-wswitch",
              scenario: "KIẾN TRÚC FIRMWARE · DISPATCH & FSM",
              prompt:
                "1) Vì sao trong hàm nhận `enum` như `door_state_name`, ta cố tình **không** viết nhánh `default:` mà bật cờ `-Wswitch`? 2) Khi dùng một kiểu callback `typedef void (*btn_cb_t)(uint8_t event, void *ctx)` cho cả nút POWER và nút MODE, tham số `void *ctx` giải quyết vấn đề gì mà biến toàn cục gây ra?",
              placeholder: "Giải thích tác dụng phát hiện thiếu case của -Wswitch và tách state qua user_ctx...",
              hint: "Hãy tưởng tượng sau 3 tháng bạn thêm STATE_MAINTENANCE vào enum, và tưởng tượng bạn có 2 nút bấm dùng chung 1 hàm callback."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Type-punning bằng memcpy & Tagged Union cho hàng đợi sự kiện",
          body:
            "Đọc byte thô của một `float` bằng ép kiểu con trỏ `*(uint32_t *)&f` vi phạm quy tắc **Strict Aliasing** trong C17 (là UB!). Cách chuẩn, an toàn và tối ưu ngang một lệnh thanh ghi dưới `-O2` là dùng **`memcpy(&bits, &val, sizeof(bits))`**. Để đóng gói nhiều loại sự kiện khác nhau vào cùng một mảng tĩnh hay Ring Buffer, ta dùng **Tagged Union**: một `struct` gồm trường thẻ `type` (`enum`) đi kèm một `union` chứa payload riêng của từng loại sự kiện (`digit`, `sensor{ch, mv}`, `fault_code`), luôn chỉ đọc nhánh `union` khớp với `type`.",
          codeLang: "C17 · memcpy type-punning & Tagged Union (14-enum-union-fsm)",
          code: `#include <stdint.h>
#include <string.h>

/* 1) Đổi biểu diễn bit an toàn Strict Aliasing (GCC -O2 tối ưu thành 1 lệnh!) */
uint32_t float_to_u32_bits(float val) {
    uint32_t bits = 0U;
    memcpy(&bits, &val, sizeof(bits));
    return bits;
}

/* 2) Tagged Union cho sự kiện khóa cửa (chỉ ~8 byte thay vì cộng dồn mọi trường) */
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
            text: "Không bao giờ đọc trường của union khi tag `type` đang chỉ định loại sự kiện khác! Luôn kiểm tra evt->type và miền giá trị (như '0'..'9') trước khi dùng evt->data.digit."
          },
          diff: [
            { op: "+", text: "memcpy(&bits, &val, sizeof(bits)) hợp chuẩn C17 trên mọi mức tối ưu -O2/-O3." },
            { op: "-", text: "*(uint32_t *)&val vi phạm strict aliasing, có thể bị compiler tối ưu sai khi -O2." }
          ],
          kpis: [
            { label: "Type-punning", value: "memcpy()", sub: "Chuẩn C17, 0 UB aliasing", tone: "sage" },
            { label: "Tagged Union", value: "tag + union", sub: "Tiết kiệm RAM hàng đợi", tone: "sky" },
            { label: "Kiểm tra tag", value: "evt->type", sub: "Chặt trước khi đọc union", tone: "amber" }
          ],
          legend: [
            { label: "Thẻ nhận diện type", color: "#84b4df" },
            { label: "Payload dùng chung RAM", color: "#ad9cd8" },
            { label: "Đọc đúng biến thể", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["door_event_t.type", "Xác định biến thể đang hoạt động trong union"],
              ["Validate payload", "Kiểm tra '0'..'9' nếu EVT_DIGIT"],
              ["memcpy() bit-cast", "Chuyển biểu diễn bit an toàn strict aliasing"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Bộ điều khiển khóa cửa thông minh p3-door-lock-fsm",
          body:
            "Xây dựng Mini-project `p3-door-lock-fsm/work/` gồm `door_fsm.h`, `door_fsm.c`, `test_door_fsm.c`, `Makefile` và `DESIGN.md` (kèm sơ đồ **Mermaid `stateDiagram-v2`** ánh xạ 1-1 từng mũi tên sang ca `assert`). Kiểm chứng toàn bộ hành vi: giữ trạng thái an toàn khi `EVT_SUBMIT` lúc chưa nhập phím, đếm sai PIN 3 lần chuyển sang `STATE_LOCKOUT`, timeout `10 s` khi đang nhập ở `STATE_ENTERING`, tràn bộ đệm `input_overflow` nếu bấm quá 4 phím, và mở cửa lúc `STATE_LOCKED` kích hoạt `alarm_active = true` không tắt cho đến khi mở đúng PIN.",
          codeLang: "C17 · hợp đồng & assert kiểm chứng P3 (p3-door-lock-fsm)",
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
            text: "Không dùng biến toàn cục trong door_fsm.c: mọi trạng thái nằm trong struct door_ctx_t để test_door_fsm.c chạy hàng chục kịch bản độc lập và song song sạch sẽ."
          },
          diff: [
            { op: "+", text: "Bắt buộc kiểm tra độ phủ 100% đường chuyển trên sơ đồ Mermaid stateDiagram-v2 trong DESIGN.md." },
            { op: "+", text: "Chạy sạch gcc -std=c17 -Wall -Wextra -Wpedantic -Werror -Wshadow với UBSan/ASan." }
          ],
          kpis: [
            { label: "Ngữ cảnh FSM", value: "door_ctx_t", sub: "0 biến toàn cục", tone: "sky" },
            { label: "Độ phủ chuyển", value: "100% mũi tên", sub: "Ánh xạ Mermaid ↔ assert", tone: "amber" },
            { label: "Bẫy biên", value: "Overflow & Lockout", sub: "3 lần sai / 10s timeout", tone: "sage" }
          ],
          legend: [
            { label: "Khởi tạo & Hợp đồng", color: "#84b4df" },
            { label: "Quy tắc chuyển FSM", color: "#ad9cd8" },
            { label: "Traceability assert", color: "#84be88" }
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
                "volatile ép compiler luôn đọc lại từ phần cứng mỗi lần truy cập; const cấm firmware ghi vào *p_idr."
            },
            {
              prompt:
                "Vì sao nên dùng `memcpy(&u32, &f32, sizeof u32)` thay cho `*(uint32_t *)&f32` khi soi mẫu bit của một `float` trong C17?",
              options: [
                "Vì memcpy() tự động đảo byte Big-Endian thành Little-Endian",
                "Vì ép con trỏ khác kiểu vi phạm Strict Aliasing (UB), còn memcpy() hợp chuẩn C17 và được -O2 tối ưu triệt để",
                "Vì sizeof(float) luôn bằng 8 byte"
              ],
              correctIndex: 1,
              explain:
                "Truy cập đối tượng float thông qua con trỏ uint32_t* vi phạm quy tắc Strict Aliasing (C17 6.5p7). memcpy() là cách duy nhất chuẩn mực để sao chép biểu diễn bit giữa hai kiểu."
            }
          ]
        }
      ]
    },
    {
      id: "c-ringbuf-pool-misra",
      number: "08",
      title: "Ring Buffer ISR, Static Pool, CSV HIL & MISRA C",
      duration: "80 phút",
      level: "Trung bình",
      subtitle:
        "Ngày 15–20 & P4 · Hàng đợi vòng tĩnh O(1), cấp phát tĩnh Static Pool thay malloc, đọc đồng bộ 64-bit, kiểm thử hồi quy CSV HIL với Valgrind và phòng vệ MISRA C.",
      locked: false,
      youllLearn: [
        "Cài đặt Ring Buffer lũy thừa của 2 (& (CAP-1)) và Static Memory Pool O(1) thay malloc trên MCU",
        "Tránh torn-read với read_u64_coherent, mô phỏng HIL bằng CSV và soi 0 leak bằng Valgrind",
        "Áp dụng bộ cờ phòng vệ và quy tắc MISRA C Automotive cho giải mã CAN & khóa liên động"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Ring Buffer tĩnh O(1) cho ISR/main & Static Memory Pool thay malloc",
          body:
            "Trên hệ nhúng chạy 24/7, `malloc`/`free` gây **phân mảnh heap**, thời gian cấp phát bất định và nguy cơ cạn RAM giữa chừng. **Ring Buffer tĩnh** dung lượng lũy thừa của 2 (kiểm tra lúc biên dịch bằng `_Static_assert((CAP & (CAP - 1U)) == 0U)`) chỉ tốn một mảng cố định và hai chỉ số `head`/`tail` quay vòng bằng `& (CAP - 1U)` thay cho phép chia `%` tốn chu kỳ CPU: `UART_ISR` đẩy byte vào `head`, vòng lặp `main` rút ra từ `tail`. Khi cần cấp phát các gói tin kích thước cố định, **Static Memory Pool** quản lý mảng `pool_block_t` căn chỉnh theo `max_align_t` cho thời gian $O(1)$ xác định và **0 phân mảnh**.",
          codeLang: "C17 · Ring Buffer 8 byte & Static Pool (16 & 18)",
          code: `#define DEMO_RB_CAP 8U
_Static_assert((DEMO_RB_CAP > 0U) && ((DEMO_RB_CAP & (DEMO_RB_CAP - 1U)) == 0U),
               "Capacity must be a power of 2");

typedef struct {
    uint8_t buf[DEMO_RB_CAP];
    uint8_t head;
    uint8_t tail;
    uint8_t count;
} demo_rb8_t;

bool demo_rb_push(demo_rb8_t *rb, uint8_t byte) {
    if (rb == NULL || rb->count >= DEMO_RB_CAP) return false;
    rb->buf[rb->head] = byte;
    rb->head = (uint8_t)((rb->head + 1U) & (DEMO_RB_CAP - 1U)); /* O(1), không dùng % */
    rb->count++;
    return true;
}

/* Static Memory Pool (căn chỉnh chuẩn max_align_t, 0 malloc/free) */
typedef union { max_align_t align; uint8_t bytes[32]; } pool_block_t;`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Nếu giữa ISR (producer) và main (consumer) không muốn dùng vùng găng khóa ngắt cho biến count chung, thiết kế lock-free SPSC tách riêng head (chỉ ISR ghi) và tail (chỉ main ghi) với 1 ô trống phân biệt đầy/rỗng!"
          },
          diff: [
            { op: "+", text: "& (CAP - 1U) biên dịch thành đúng 1 lệnh AND nhanh gấp nhiều lần phép chia % trên Cortex-M0/M3." },
            { op: "-", text: "Gọi malloc/free trong vòng lặp ngắt hoặc xử lý gói tin thời gian thực dễ gây HardFault và phân mảnh heap." }
          ],
          kpis: [
            { label: "Quay vòng chỉ số", value: "& (CAP - 1U)", sub: "_Static_assert 2^k", tone: "sky" },
            { label: "Độ phức tạp", value: "O(1) cứng", sub: "Cả push/pop & pool", tone: "sage" },
            { label: "Heap fragmentation", value: "0 byte", sub: "Thay thế malloc/free", tone: "amber" }
          ],
          legend: [
            { label: "ISR Producer (head)", color: "#e8ca78" },
            { label: "Main Consumer (tail)", color: "#84be88" },
            { label: "Static Pool Block", color: "#ad9cd8" }
          ],
          learnUnlock: [0],
          scene: { type: "ringbuf_static_pool" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "volatile vs Atomicity, Offline CSV HIL & Valgrind 0-leak",
          body:
            "Trên STM32 32-bit, đọc một bộ đếm 64-bit chia thành 2 thanh ghi `hi` và `lo` có thể bị **xé dữ liệu (torn read)** nếu ngắt tăng `lo` từ `0xFFFFFFFF → 0` làm `hi` nhảy lên ngay giữa hai lần đọc — thêm `volatile` **không** giải quyết được! Phải dùng vòng đọc kiểm tra **`read_u64_coherent` (`hi1`, `lo`, `hi2`)** hoặc đoạn găng tắt ngắt ngắn. Trên PC, ta kiểm thử firmware bằng **Offline CSV HIL**: đọc từng dòng bằng `fgets` + phân tích nghiêm ngặt `parse_u32_span` (kiểm tra `errno` & `endptr`), xuất báo cáo rồi so sánh diff với file kỳ vọng, và chạy `valgrind --leak-check=full --show-leak-kinds=all --error-exitcode=1` (chú ý **không** chạy Valgrind trên file build với `-fsanitize=address`!).",
          codeLang: "C17 · read_u64_coherent (15-memory-layout) & Valgrind",
          code: `/* Đọc 64-bit nhất quán giữa main và ngắt trên MCU 32-bit */
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
            text: "Tuyệt đối không kết hợp -fsanitize=address với Valgrind! ASan chiếm vùng shadow memory khổng lồ khiến Valgrind báo lỗi khởi tạo ngay lập tức."
          },
          diff: [
            { op: "+", text: "Đọc hi1 → lo → hi2 rồi lặp lại khi hi1 != hi2 đảm bảo đọc được cặp (hi, lo) nhất quán không cần khóa dài." },
            { op: "+", text: "parse_u32_span dùng strtoul + kiểm tra endptr và chặn dấu +/- đầu chuỗi mà strtoul mặc định bỏ qua." }
          ],
          kpis: [
            { label: "Torn-read fix", value: "hi1 == hi2", sub: "Lock-free double read", tone: "sky" },
            { label: "CSV Parser", value: "fgets + span", sub: "Chặn dấu +/- & rác", tone: "amber" },
            { label: "Valgrind gate", value: "--error-exitcode=1", sub: "0 leak, 0 invalid R/W", tone: "sage" }
          ],
          legend: [
            { label: "Đọc kép hi1/lo/hi2", color: "#84b4df" },
            { label: "CSV HIL Replay", color: "#e8ca78" },
            { label: "0 Leak Valgrind", color: "#84be88" }
          ],
          learnUnlock: [1],
          scene: {
            type: "flow",
            nodes: [
              ["read_u64_coherent", "Đọc hi1, lo, hi2; thử lại nếu rollover chen ngang"],
              ["CSV HIL Replay", "fgets + parse_u32_span xuất report.csv đối chiếu"],
              ["Valgrind clean", "Bắt 100% leak/invalid read (build không kèm ASan)"]
            ]
          },
          openQuestions: [
            {
              id: "q-rb-hil",
              scenario: "ĐỒNG BỘ ISR & RING BUFFER",
              prompt:
                "1) Khi `UART_ISR` gọi `demo_rb_push` còn `main` gọi `demo_rb_pop` trên cùng biến `demo_rb8_t` có trường `count` dùng chung, tại sao `rb->count++` và `rb->count--` có thể bị lệch race condition dù đã khai báo `volatile`? Làm sao sửa cho mô hình SPSC (1 producer, 1 consumer)? 2) Vì sao `read_u64_coherent` phải đọc `hi` tận 2 lần?",
              placeholder: "Giải thích RMW trên biến count chung và kịch bản rollover giữa lần đọc hi1 và lo...",
              hint: "count++ là Read-Modify-Write nên có thể bị ISR cắt ngang; với SPSC không dùng count, ISR chỉ ghi head còn main chỉ ghi tail. Với u64, nghĩ xem hi có thể thay đổi đúng lúc nào."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Phòng vệ MISRA C Automotive: cờ biên dịch chặt & kiểm soát biên CAN",
          body:
            "Trong phần mềm ô tô/y tế (**MISRA C**), code không chỉ chạy đúng ở ca đẹp mà phải từ chối mọi dữ liệu vật lý phi lý và tắt sạch mọi chuyển đổi ngầm. Bật bộ cờ **`-Wconversion -Wsign-conversion -Wcast-qual -Wstrict-prototypes`**, kiểm tra macro bằng `#if defined(...)` (`-Wundef`), dùng `static inline` kèm chặn miền `bit_pos < 32U` cho `1U << pos`, luôn đặt giá trị an toàn `*out = 0U` ngay đầu hàm trước mọi nhánh trả lỗi, và kiểm tra chặt DLC, CRC, rolling counter, mã lỗi `0xFFFFU` cũng như khóa liên động (Interlock) phanh trước khi chuyển số.",
          codeLang: "C17 · phòng vệ kiểu MISRA C (20-misra-c-automotive)",
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
    /* ... quy đổi tuyến tính trong deadband .. full scale ... */
    return ECU_OK;
}`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Nguyên tắc phòng vệ MISRA: (1) không chuyển đổi mất dấu/thu hẹp ngầm, (2) gán sẵn giá trị fail-safe cho mọi biến đầu ra trước kiểm tra, (3) luôn tách lỗi phần cứng (chập mass/chập nguồn) khỏi giá trị hợp lệ."
          },
          diff: [
            { op: "+", text: "Bật -Wconversion -Wsign-conversion giúp lộ ngay mọi chỗ ép ngầm int ↔ unsigned hay mất bit." },
            { op: "+", text: "Chốt trạng thái GEAR_FAULT và yêu cầu (brake_pressed && speed <= 2.0 km/h) trước khi sang số." }
          ],
          kpis: [
            { label: "Cờ MISRA-like", value: "-Wconversion", sub: "+ sign-conv, cast-qual", tone: "sky" },
            { label: "Fail-safe", value: "*out = 0U", sub: "Gán trước mọi return lỗi", tone: "amber" },
            { label: "Chẩn đoán ADC", value: "<200 / >3900", sub: "Bắt chập GND / chập VCC", tone: "rose" }
          ],
          legend: [
            { label: "Cờ cảnh báo chặt", color: "#84b4df" },
            { label: "Chặn miền & chẩn đoán", color: "#e8ca78" },
            { label: "Khóa an toàn fail-safe", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["-Wconversion -Wcast-qual", "Khóa chặt mọi chuyển đổi ngầm ở lúc build"],
              ["Fail-safe *out = 0U", "Không trả dữ liệu rác khi cảm biến hỏng"],
              ["CAN + Interlock", "Kiểm DLC/CRC/Counter/Range trước khi chấp hành"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Capstone Data Logger p4-data-logger & Kiểm định MISRA C",
          body:
            "Hoàn thiện đồ án tổng kết giai đoạn A `p4-data-logger/work/`: kết nối luồng xử lý từ `raw_log.csv` → `ring_buffer` tĩnh (`RB_CAP` lũy thừa 2, đọc theo lô để chứng minh chạy tệp dài bất kỳ với **RAM hằng số**) → `divider_adc` (`uint64_t` 1 phép chia duy nhất quy đổi cầu `30 kΩ / 10 kΩ` lên tới `13200 mV`) → lọc 2 tầng `Median-3` → `Moving Avg-4` → `monitor_fsm` có độ trễ → xuất `report.csv` đối chiếu regression với `expected_report.csv`. Bắt buộc **0 `malloc/free`**, **0 `float/double`**, chạy sạch UBSan/ASan, Valgrind (`make valgrind`), và thử thêm cờ bài `20-misra-c-automotive`.",
          codeLang: "C17 · luồng Data Logger P4 (0 malloc, 0 float)",
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
            text: "Tính gộp một phép chia uint64_t duy nhất tránh sai số làm tròn kép ở bước trung gian. Dùng Valgrind kiểm tra 0 leak + so sánh diff expected_report.csv làm cổng regression tự động."
          },
          diff: [
            { op: "+", text: "Toàn bộ đường xử lý dữ liệu dùng RAM hằng số qua ring_buffer tĩnh và filter_ctx_t trên stack." },
            { op: "+", text: "Kiểm thử với cả make test (ASan/UBSan) và make valgrind (build thường) đạt 0 lỗi, 0 leak." }
          ],
          kpis: [
            { label: "Heap / Float", value: "0 / 0", sub: "RAM tĩnh hằng số 100%", tone: "sage" },
            { label: "Thang đo 3S", value: "0..13,200 mV", sub: "1 phép chia uint64_t", tone: "sky" },
            { label: "Regression", value: "CSV + Valgrind", sub: "Khớp 100% expected", tone: "amber" }
          ],
          legend: [
            { label: "CSV Batch → RingBuf", color: "#84b4df" },
            { label: "Divider + Filter + FSM", color: "#ad9cd8" },
            { label: "Regression & Valgrind", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["raw_log.csv → ring_buffer", "Nạp theo lô, dùng RAM tĩnh O(1)"],
              ["divider_adc → Med3 → Avg4", "1 phép chia uint64_t, không float"],
              ["monitor_fsm → report.csv", "Đối chiếu diff & Valgrind 0 leak"]
            ]
          },
          quiz: [
            {
              prompt:
                "Vì sao `ring_buffer` trong `p4-data-logger` dùng `_Static_assert((RB_CAP & (RB_CAP - 1U)) == 0U)` trước khi cập nhật chỉ số bằng `(idx + 1U) & (RB_CAP - 1U)`?",
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
                "Valgrind báo xung đột/không khởi chạy được vì ASan đã chiếm vùng shadow memory khổng lồ",
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
