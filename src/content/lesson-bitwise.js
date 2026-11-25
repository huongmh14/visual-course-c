export function createBitwiseLesson() {
  return {
    id: "b02-bitwise",
    number: "04",
    title: "Bitwise: từ từng bit đến thanh ghi nhúng",
    duration: "75 phút",
    level: "Nền tảng",
    subtitle:
      "Đi từng bước từ bit 0..7, mặt nạ bit, cờ trạng thái, nhóm nhiều bit (_Pos/_Msk), các bẫy hay gặp khi dịch bit tới thanh ghi BSRR và giải mã ADC 12-bit.",
    locked: false,
    youllLearn: [
      "Đọc vị trí bit 0..7, đổi nhị phân ↔ hex và phân biệt index với bit mask",
      "Tính tay và kiểm chứng 6 toán tử bitwise (& | ^ ~ << >>)",
      "Thao tác Set, Clear (& ~mask), Toggle và Test mà không làm hỏng các bit khác",
      "Kiểm tra nhiều cờ (Any / All / None) và tránh bẫy ưu tiên toán tử & vs ==",
      "Thay đổi nhóm nhiều bit (_Pos / _Msk) và kiểm tra các bit khác không bị ảnh hưởng",
      "Tránh 4 bẫy hay gặp: tự mở rộng kiểu số, dịch bit quá cỡ, dấu âm và in đúng kiểu",
      "Liên hệ phần cứng MCU thật: xung đột main/ngắt, ghi 1 lần bằng thanh ghi BSRR và giải mã ADC"
    ],
    steps: [
      {
        id: "s1",
        badge: "CONCEPT",
        title: "Một số nguyên, nhiều cách viết: Bit 0..7, Hex & Mask",
        body:
          "Trong một byte 8 bit, **bit 0 nằm bên phải** có trọng số 1, bit `n` có trọng số `2^n`. Số `10` thập phân = `0000 1010` nhị phân = `0x0A` hex — chúng là **cùng một giá trị**, không phải ba kiểu dữ liệu khác nhau. Mỗi chữ số hex gom đúng 4 bit (`0xA = 1010`, `0xA5 = 1010 0101 = 165`). Luôn phân biệt **vị trí bit (index)** `3U` với **mặt nạ bit (mask)** `1U << 3U` bằng `8U` (`0x08`).",
        codeLang: "C · hằng số không dấu & mặt nạ bit",
        code: `#include <stdint.h>

const unsigned int dec_val = 10U;      /* 0000 1010 */
const unsigned int hex_val = 0x0AU;    /* cùng giá trị 10 */
/* Chú ý: 010 là bát phân = 8, KHÔNG phải 10! Tránh viết 0b (nhiều trình biên dịch cũ không nhận) */

const unsigned int bit_index = 3U;     /* vị trí bit 3 (0..7) */
const unsigned int bit_mask  = 1U << bit_index; /* 0000 1000 = 8U = 0x08 */`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Mỗi bài bitwise đi qua đúng 4 bước: yêu cầu → tạo mask → viết biểu thức → kiểm tra bằng assert. Đừng học thuộc 6 ký hiệu rời rạc."
        },
        diff: [
          { op: "+", text: "Dùng hậu tố U (như 0x0AU, 1U) để hằng số mang kiểu không dấu ngay từ đầu." },
          { op: "-", text: "Tránh viết 010 khi muốn số 10 — tiền tố 0 trong C là hệ bát phân (octal = 8)." }
        ],
        kpis: [
          { label: "Bit 0 (LSB)", value: "Trọng số 1", sub: "Nằm bên phải", tone: "sky" },
          { label: "1 chữ số Hex", value: "4 bit", sub: "1 nibble (0..F)", tone: "amber" },
          { label: "Mask bit 3", value: "1U << 3U", sub: "= 8U (0x08), ≠ 3U", tone: "sage" }
        ],
        legend: [
          { label: "Vị trí bit (index)", color: "#e8ca78" },
          { label: "Mặt nạ bit (mask)", color: "#84be88" },
          { label: "Nibble 4-bit", color: "#84b4df" }
        ],
        learnUnlock: [0],
        scene: { type: "bitwise_bits_hex" }
      },
      {
        id: "s2",
        badge: "CONCEPT",
        title: "6 toán tử Bitwise & Dịch bit (& | ^ ~ << >>)",
        body:
          "Bốn toán tử `&` (AND lọc bit), `|` (OR bật bit), `^` (XOR đảo bit chọn), `~` (NOT đảo tất cả bit) xử lý độc lập từng cột bit. Hai toán tử dịch `<<` và `>>` dịch bit sang trái/phải và chèn `0` với số không dấu (`6U << 2U = 24U`, `6U >> 2U = 1U`). Riêng `~a` đảo **toàn bộ độ rộng `unsigned int`** sau khi tự nâng lên kiểu `int` — muốn lấy kết quả 8 bit phải thu hẹp rõ ràng `(uint8_t)~a`.",
        codeLang: "C · các phép toán bit & tự kiểm tra",
        code: `const unsigned int a = 6U;   /* 0000 0110 */
const unsigned int b = 3U;   /* 0000 0011 */

assert((a & b) == 2U);       /* 0000 0010 */
assert((a | b) == 7U);       /* 0000 0111 */
assert((a ^ b) == 5U);       /* 0000 0101 */
assert((uint8_t)~a == 249U); /* 1111 1001 = 0xF9 */
assert((a << 2U) == 24U);    /* 0001 1000 (nhân 4) */
assert((a >> 2U) == 1U);     /* 0000 0001 (chia nguyên 4) */`,
        callout: {
          type: "watch-out",
          label: "LƯU Ý",
          text: "Dịch phải đẩy các bit thấp rơi mất và không khôi phục được khi dịch trái lại. Biến nhận kết quả (ví dụ uint8_t) không tự ép phép ~ hay << chạy ở 8 bit."
        },
        diff: [
          { op: "+", text: "Với a = 6U (0110) và b = 3U (0011): AND=2, OR=7, XOR=5." },
          { op: "-", text: "Không giả định ~6U bằng 249 nếu chưa ép về uint8_t — trên 32-bit ~6U là 0xFFFFFFF9." }
        ],
        kpis: [
          { label: "a & b / a | b", value: "2 / 7", sub: "a=6 (0110), b=3 (0011)", tone: "sky" },
          { label: "a ^ b", value: "5", sub: "0101 (khác nhau → 1)", tone: "lavender" },
          { label: "(uint8_t)~a", value: "249 (0xF9)", sub: "Thu hẹp về 8-bit", tone: "rose" }
        ],
        legend: [
          { label: "AND / giữ bit", color: "#84be88" },
          { label: "Dịch trái <<", color: "#e8ca78" },
          { label: "NOT ~ toàn từ", color: "#e57373" }
        ],
        learnUnlock: [1],
        scene: { type: "bitwise_ops_grid" }
      },
      {
        id: "s3",
        badge: "CONCEPT",
        title: "Mặt nạ bit: Set, Clear (& ~mask), Toggle & Test",
        body:
          "Ví dụ xóa bit: `data = 0x88` (`1000 1000`) đang bật cả bit 7 và bit 3. Muốn **chỉ xóa bit 3** mà giữ nguyên bit 7, phải đảo mặt nạ bằng `~mask` (`1111 0111 = 0xF7`) rồi AND: `data &= ~(1U << 3U)` → `0x80` (`128`). Nếu nhầm viết `data & mask`, phép AND sẽ lọc ra bit 3 (`0x08`) và xóa sạch bit 7! Nhớ 3 tính chất kiểm thử: Set/Clear hai lần cho kết quả như một lần; Toggle hai lần trả về ban đầu.",
        codeLang: "C · xóa bit & chuỗi thao tác nối tiếp",
        code: `/* 1) Chỉ xóa bit 3, giữ bit 7 */
uint8_t data = 0x88U;          /* 1000 1000 */
data &= (uint8_t)~(1U << 3U);  /* & 1111 0111 → 1000 0000 = 0x80 (128) */

/* 2) Chuỗi thao tác nối tiếp trên reg = 0x0AU (0000 1010) */
unsigned int reg = 0x0AU;
reg |=  (1U << 0U);            /* Set bit 0    → 0x0B (0000 1011) */
reg &= ~(1U << 1U);            /* Clear bit 1  → 0x09 (0000 1001) */
reg ^=  (1U << 3U);            /* Toggle bit 3 → 0x01 (0000 0001) */
bool is_set = (reg & (1U << 0U)) != 0U; /* true */`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Tại sao các bit ngoài mask không đổi? Vì x | 0 = x (Set), x & 1 = x (Clear với ~mask), và x ^ 0 = x (Toggle)."
        },
        diff: [
          { op: "+", text: "0x88 & ~(1U << 3U) = 0x80 (128): bit 7 được giữ nguyên, bit 3 bị xóa." },
          { op: "-", text: "0x88 & (1U << 3U) = 0x08 (8): sai mục tiêu vì làm mất bit 7." }
        ],
        kpis: [
          { label: "SET bit n", value: "reg |= mask", sub: "Bit chọn → 1", tone: "sky" },
          { label: "CLEAR bit n", value: "reg &= ~mask", sub: "Bit chọn → 0", tone: "sage" },
          { label: "TOGGLE bit n", value: "reg ^= mask", sub: "Đảo 0 ↔ 1", tone: "lavender" }
        ],
        legend: [
          { label: "Bit được bảo toàn", color: "#84be88" },
          { label: "Bit đích cần xóa", color: "#e57373" },
          { label: "Mặt nạ tác động", color: "#e8ca78" }
        ],
        learnUnlock: [2],
        scene: { type: "bitwise_mask_clear" },
        openQuestions: [
          {
            id: "q-bitwise-clear",
            prompt: "Với data = 0x88 (1000 1000), vì sao muốn xóa bit 3 phải viết data &= ~(1U << 3U) thay vì data &= (1U << 3U)? Chuyện gì xảy ra nếu xóa bit 3 hai lần liên tiếp?",
            hint: "So sánh bảng bit 0x88 & 0xF7 với 0x88 & 0x08, và chú ý tính lặp lại kết quả không đổi của thao tác clear."
          }
        ]
      },
      {
        id: "s4",
        badge: "CONCEPT",
        title: "Cờ trạng thái (Flags), Any vs All & Bẫy ưu tiên toán tử",
        body:
          "Một biến không dấu lưu được nhiều cờ độc lập (`READ = 1U << 0`, `WRITE = 1U << 1`, `EXEC = 1U << 2`, ghép bằng `|`). Khi kiểm tra với `wanted = READ | WRITE`, phải phân biệt **ít nhất một cờ** `(flags & wanted) != 0U` với **đủ tất cả cờ** `(flags & wanted) == wanted`. Tuyệt đối không viết `(flags & wanted) == 1U` (sai khi bit 1 bật → kết quả là `2`), và luôn **đóng ngoặc** quanh `&` vì `==` ưu tiên cao hơn `&`!",
        codeLang: "C · cờ trạng thái & bẫy ngoặc ()",
        code: `const unsigned int READ   = 1U << 0U; /* 0001 */
const unsigned int WRITE  = 1U << 1U; /* 0010 */
const unsigned int wanted = READ | WRITE;
unsigned int perms = READ;

bool any  = (perms & wanted) != 0U;     /* true  (có READ) */
bool all  = (perms & wanted) == wanted; /* false (thiếu WRITE) */
bool none = (perms & wanted) == 0U;     /* false */

/* Bẫy ưu tiên toán tử: == ưu tiên CAO HƠN & */
unsigned int status = 0x04U;
/* SAI:  if (status & 0x04U == 0U) -> status & (0x04U == 0U) -> luôn 0! */
/* ĐÚNG: */
if ((status & 0x04U) == 0U) { /* bit 2 đang tắt */ }`,
        callout: {
          type: "watch-out",
          label: "LƯU Ý",
          text: "Khác với && và ||, toán tử & và | KHÔNG bỏ qua vế phải. Ngoài ra, nếu wanted == 0U thì phép kiểm tra ALL trả true còn ANY trả false — cần chặn mask rỗng ở đầu vào nếu chính sách yêu cầu."
        },
        diff: [
          { op: "+", text: "Luôn so sánh (flags & mask) != 0U hoặc == mask, không so với == 1U." },
          { op: "-", text: "Không dùng flags == SENSOR_READY khi các cờ khác (như BUTTON) được phép cùng bật." }
        ],
        kpis: [
          { label: "ANY (≥ 1 cờ)", value: "(f & m) != 0U", sub: "Khác 0 là đạt", tone: "sage" },
          { label: "ALL (đủ cờ)", value: "(f & m) == m", sub: "Khớp nguyên mask", tone: "lavender" },
          { label: "Ưu tiên C", value: "== cao hơn &", sub: "Bắt buộc đóng ngoặc", tone: "rose" }
        ],
        legend: [
          { label: "Kiểm tra ANY", color: "#84be88" },
          { label: "Kiểm tra ALL", color: "#ad9cd8" },
          { label: "Bẫy thiếu ngoặc", color: "#e57373" }
        ],
        learnUnlock: [3],
        scene: { type: "bitwise_flags_check" },
        quiz: [
          {
            prompt: "Cho flags = 0x02U và mask = 0x06U (unsigned int). Kết quả của (flags & mask) != 0U và (flags & mask) == mask lần lượt là gì?",
            options: ["true và true", "true và false", "false và false"],
            correctIndex: 1,
            explain: "0x02 & 0x06 = 0x02: khác 0 nên ANY là true, nhưng 0x02 ≠ 0x06 nên ALL là false."
          }
        ]
      },
      {
        id: "s5",
        badge: "CONCEPT",
        title: "Đọc/ghi nhóm nhiều bit (_Pos / _Msk)",
        body:
          "Thanh ghi cấu hình như `GPIO->MODER` dùng mỗi nhóm **2 bit** cho một pin (`pin n` nằm ở vị trí `pos = 2 * n`, mặt nạ `UINT32_C(3) << pos`). Muốn thay nhóm cũ `11` thành `01`, chỉ viết `|=` sẽ **không xóa được bit 1 cũ**! Phải làm theo quy trình 3 bước (`_Pos / _Msk`): (1) Xóa nhóm cũ `reg & ~Msk`, (2) Dịch giá trị mới `val << Pos`, (3) OR ghép vào. Luôn tránh dùng `struct` bit-field cho thanh ghi phần cứng vì thứ tự bit và độ rộng truy cập bus do trình biên dịch quyết định.",
        codeLang: "C · đọc/ghi nhóm nhiều bit (_Pos / _Msk) & assert",
        code: `#define GPIO_MODER_MODER3_Pos (6U)
#define GPIO_MODER_MODER3_Msk (UINT32_C(0x3) << GPIO_MODER_MODER3_Pos)

uint32_t config = UINT32_C(0xFFFF);
const uint32_t before = config;
const uint32_t mode   = UINT32_C(1); /* 0..3: kiểm tra miền trước! */

/* Xóa nhóm [7:6] rồi ghép mode = 01 vào đúng vị trí */
config = (config & ~GPIO_MODER_MODER3_Msk)
       | ((mode << GPIO_MODER_MODER3_Pos) & GPIO_MODER_MODER3_Msk);

assert(config == UINT32_C(0xFF7F));
assert(((config & GPIO_MODER_MODER3_Msk) >> GPIO_MODER_MODER3_Pos) == 1U);
assert((config & ~GPIO_MODER_MODER3_Msk) == (before & ~GPIO_MODER_MODER3_Msk));`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Kiểm tra quan trọng nhất khi test thay nhóm bit: assert((after & ~mask) == (before & ~mask)) — chứng minh 100% các bit ngoài nhóm không bị đụng tới."
        },
        diff: [
          { op: "+", text: "Kiểm tra pin <= 15 và mode <= 3 trước khi dịch; không tự cắt mode sai thành hợp lệ." },
          { op: "-", text: "Không dùng struct { unsigned mode : 2; } cho thanh ghi phần cứng vì vị trí bit phụ thuộc trình biên dịch." }
        ],
        kpis: [
          { label: "Vị trí pin n", value: "pos = 2 * n", sub: "Pin 3 → bit [7:6]", tone: "sky" },
          { label: "Mask 2-bit", value: "3U << pos", sub: "0x00C0 cho pin 3", tone: "amber" },
          { label: "Kết quả mẫu", value: "0xFFFF → 0xFF7F", sub: "Đọc lại = 1", tone: "sage" }
        ],
        legend: [
          { label: "Xóa nhóm cũ", color: "#e8ca78" },
          { label: "Ghép giá trị mới", color: "#84be88" },
          { label: "Bit ngoài nhóm", color: "#84b4df" }
        ],
        learnUnlock: [4],
        scene: { type: "bitwise_field_rmw" }
      },
      {
        id: "s6",
        badge: "CONCEPT",
        title: "4 bẫy hay gặp: Tự mở rộng kiểu số, Dịch bit quá cỡ, Dấu âm & Printf",
        body:
          "Trên GCC 32-bit, `uint8_t mask = 0x0FU` bị **tự nâng lên kiểu `int` trước khi tính** `~mask`, nên `~mask` có giá trị `-16` chứ không phải `0xF0`! Về phép dịch bit: dịch số lượng âm (`1U << -1`), dịch quá/bằng độ rộng (`1U << 32U`), hoặc dịch trái số âm (`-1 << 1`) đều gây **lỗi khó lường (dễ hỏng chương trình)**; dịch phải số âm (`-4 >> 1`) thì kết quả tùy vào trình biên dịch. Ngoài ra, `1U` chỉ đảm bảo tối thiểu 16 bit — mặt nạ 32 bit phải dùng `UINT32_C(1)`.",
        codeLang: "C · tránh lỗi tự mở rộng kiểu, dịch quá cỡ & printf",
        code: `#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>

/* 1) Tự nâng lên kiểu int khi đảo uint8_t */
uint8_t mask8 = 0x0FU;
uint8_t inv8  = (uint8_t)~(unsigned int)mask8; /* 0xF0 rõ ràng */

/* 2) Chặn chỉ số trước khi dịch nhờ && */
unsigned int bit = 32U, reg = 0x01U;
bool set = (bit < 8U) && ((reg & (1U << bit)) != 0U); /* an toàn, không lỗi dịch quá cỡ */

/* 3) Mặt nạ 32-bit và định dạng in chuẩn */
uint32_t reg32 = UINT32_C(1) << 31U;
printf("reg32 = 0x%08" PRIX32 "\\n", reg32);`,
        callout: {
          type: "watch-out",
          label: "LƯU Ý",
          text: "Lỗi khó lường không có \"đáp án số đúng\" — đừng thấy chạy thử ra số trên PC rồi coi đó là quy tắc. Luôn chặn miền bằng && trước phép dịch (đổi thành & sẽ mất kiểm tra sớm và vẫn bị lỗi)."
        },
        diff: [
          { op: "+", text: "Dùng UINT32_C(1) << pos cho thanh ghi 32-bit và PRIX32 từ <inttypes.h> để in." },
          { op: "-", text: "Tránh 1U << 32U, 1U << -1, -1 << 1 (đều gây lỗi khó lường, dễ hỏng chương trình)." }
        ],
        kpis: [
          { label: "~mask8 (int)", value: "-16 (32-bit)", sub: "Ép uint8_t → 0xF0", tone: "rose" },
          { label: "Chặn dịch bit", value: "n < width &&", sub: "Kiểm tra trước khi dịch", tone: "amber" },
          { label: "Mask 32-bit", value: "UINT32_C(1)", sub: "Chạy đúng mọi chip", tone: "sky" }
        ],
        legend: [
          { label: "Tự nâng kiểu / Lỗi dịch", color: "#e57373" },
          { label: "Chặn miền &&", color: "#e8ca78" },
          { label: "Cách viết an toàn", color: "#84be88" }
        ],
        learnUnlock: [5],
        scene: { type: "bitwise_c17_traps" },
        quiz: [
          {
            prompt: "Trên vi điều khiển 32-bit (int/unsigned int 32 bit), biểu thức nào sau đây gây lỗi khó lường (dễ hỏng chương trình)?",
            options: ["1U << 31U", "1U << 32U", "(uint8_t)~(unsigned int)0x0FU"],
            correctIndex: 1,
            explain: "Dịch bằng hoặc lớn hơn độ rộng số (32 bit với unsigned int) là lỗi khó lường trong C. 1U << 31U hợp lệ (0x80000000U)."
          }
        ]
      },
      {
        id: "s7",
        badge: "CONCEPT",
        title: "Từ RAM tới MCU thật: W1C, BSRR, Race ISR & Giải mã cảm biến",
        body:
          "Một dòng `GPIOA->ODR |= mask` thực chất là chuỗi **Đọc → Sửa → Ghi** gồm nhiều lệnh máy. Nếu ngắt (ISR) xen vào giữa lúc `main` đang đọc-sửa, cờ mà ngắt vừa bật sẽ bị `main` ghi đè làm mất — thêm `volatile` **không** biến `|=` thành thao tác trọn vẹn một lần! Trên STM32, dùng thanh ghi `BSRR` ghi 1 lần duy nhất (bật ở bit `0..15`, tắt ở bit `16..31`) và đọc tài liệu chip cho thanh ghi **ghi 1 để xóa (W1C)**. Khi ghép gói cảm biến (như ADC 12-bit hoặc nhiệt độ LM75A 11-bit có dấu), dùng mặt nạ & dịch bit trên **giá trị số** để không phụ thuộc thứ tự byte của CPU.",
        codeLang: "C · Ghi 1 lần bằng thanh ghi BSRR, giải mã ADC 12-bit & mở rộng dấu",
        code: `/* 1) STM32 BSRR: ghi 1 lần không bị ngắt xen vào, không đọc ODR cũ */
/* GPIOA->BSRR = UINT32_C(1) << pin;         // Set pin */
/* GPIOA->BSRR = UINT32_C(1) << (pin + 16U); // Reset pin */

/* 2) Giải mã ADC 12-bit (high = [S3..S0 D11..D8], low = [D7..D0]) */
uint16_t decode_adc(uint8_t high, uint8_t low) {
    return (uint16_t)(((uint16_t)(high & 0x0FU) << 8U) | (uint16_t)low);
}

/* 3) Mở rộng dấu chạy đúng mọi chip cho trường N-bit (ví dụ LM75A 11-bit) */
int32_t sign_extend_11(uint32_t u) {
    return (u >= UINT32_C(1024)) ? (int32_t)u - 2048 : (int32_t)u;
}`,
        callout: {
          type: "watch-out",
          label: "LƯU Ý",
          text: "volatile chỉ ép trình biên dịch không bỏ lượt đọc/ghi; nó KHÔNG khóa ngắt hay giúp lệnh chạy trọn vẹn một lần. Với thanh ghi W1C, ghi |= mask sẽ vô tình xóa nhầm các cờ khác đang bằng 1!"
        },
        diff: [
          { op: "+", text: "decode_adc(0xA3, 0x5C) bỏ 4 bit trạng thái 0xA → trả 0x035C = 860 trên mọi CPU." },
          { op: "-", text: "Không dùng con trỏ ép kiểu bộ nhớ để đọc gói cảm biến từ bus UART/I2C." }
        ],
        kpis: [
          { label: "BSRR Bật / Tắt", value: "1<<n / 1<<(n+16)", sub: "Ghi 1 lần (không bị ngắt)", tone: "sage" },
          { label: "ADC 12-bit", value: "0xA3, 0x5C → 860", sub: "Bỏ 4 bit trạng thái", tone: "sky" },
          { label: "Mở rộng dấu 11b", value: "u - 2048", sub: "Chạy đúng mọi chip", tone: "amber" }
        ],
        legend: [
          { label: "Rủi ro RMW / ISR", color: "#e57373" },
          { label: "Ghi 1 lần bằng BSRR", color: "#84be88" },
          { label: "Giải mã gói cảm biến", color: "#84b4df" }
        ],
        learnUnlock: [6],
        scene: { type: "bitwise_mcu_hw" },
        openQuestions: [
          {
            id: "q-bitwise-volatile",
            prompt: "Có người nói: \"Thanh ghi đã khai báo volatile thì reg |= mask chắc chắn chạy trọn vẹn một lần khi main và ISR cùng cập nhật.\" Nhận xét này đúng hay sai? Giải thích cơ chế mất cờ và cách phần cứng STM32 giải quyết bằng BSRR.",
            hint: "Tách reg |= mask thành 3 bước Đọc → Sửa → Ghi và đặt một ngắt (ISR) xen vào giữa bước Đọc và Ghi."
          }
        ]
      },
      {
        id: "s8",
        badge: "LAB",
        title: "Thực hành · Tự kiểm tra assert, 4 bài cốt lõi & Mini-project",
        body:
          "Chạy `05_bitwise_self_check.c` trên Ubuntu WSL với cờ nghiêm ngặt `-Wall -Wextra -Wpedantic -Werror` để xác nhận toàn bộ phép toán cơ bản. Sau đó hoàn thành **4 bài thực hành (80 điểm)** trong `08_practice_exercises.md` (đặt trong `submission.c` kèm `assert`): (1) `set/clear/toggle/test_bit` chặn `bit >= 8`, (2) `should_sample(flags)` cho cảm biến, (3) `configure_mode(reg, pin, mode)` cho 16 pin GPIO 2-bit, (4) `decode_adc(high, low)` 12-bit. Khi vững, nâng cấp lên `09_embedded_mini_projects.md`: Driver GPIO `struct` + BSRR, cảm biến nhiệt độ LM75A, chống dội nút bằng thanh ghi dịch và khung UART CRC-8.",
        codeLang: "C · mẫu kiểm thử assert (08_practice_exercises.md)",
        code: `/* Biên dịch & chạy trên Ubuntu WSL:
 * gcc -Wall -Wextra -Wpedantic -Werror submission.c -o /tmp/bitwise && /tmp/bitwise
 */
assert(set_bit(0x20U, 1U) == 0x22U);
assert(clear_bit(0x22U, 5U) == 0x02U);
assert(set_bit(0x35U, 8U) == 0x35U);          /* ngoài miền -> giữ nguyên */
assert(!test_bit(0xFFU, 32U));                /* chặn trước khi dịch */

assert(should_sample(0x01U) && should_sample(0x81U));
assert(!should_sample(0x03U) && !should_sample(0x09U));

assert(configure_mode(0xFFFFFFFFU, 3U, 1U) == 0xFFFFFF7FU);
assert(configure_mode(0x12345678U, 16U, 1U) == 0x12345678U);
assert(decode_adc(0xA3U, 0x5CU) == 860U);`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Giữ nguyên assert khi biên dịch (không thêm -DNDEBUG). Với mỗi hàm, luôn test thêm ca biên (bit 0, 7, 8, 32; pin 0, 15, 16; mode 0..4) và chứng minh các bit ngoài mask không đổi."
        },
        diff: [
          { op: "+", text: "Bộ đề cốt lõi 100đ: 10 câu lý thuyết (07_theory_questions.md) + 4 bài C (08_practice_exercises.md)." },
          { op: "+", text: "Nâng cao 100đ: 09_embedded_mini_projects.md (GPIO struct/BSRR, LM75A, Debounce shift-reg, UART CRC-8)." }
        ],
        kpis: [
          { label: "Lý thuyết", value: "10 câu · 20đ", sub: "07_theory_questions.md", tone: "sky" },
          { label: "Thực hành C", value: "4 bài · 80đ", sub: "08_practice_exercises.md", tone: "amber" },
          { label: "Mini-project", value: "4 bài · 100đ", sub: "BSRR, LM75A, CRC-8", tone: "sage" }
        ],
        legend: [
          { label: "Yêu cầu & Mask", color: "#84b4df" },
          { label: "Biểu thức Bitwise", color: "#ad9cd8" },
          { label: "Tự kiểm tra assert", color: "#84be88" }
        ],
        learnUnlock: [],
        scene: { type: "bitwise_lab_flow" },
        quiz: [
          {
            prompt: "Với reg = 0x24U, sau chuỗi lệnh: reg |= (1U << 0U); reg &= ~(1U << 5U); reg ^= (1U << 2U); giá trị cuối của reg là bao nhiêu?",
            options: ["0x01U", "0x05U", "0x21U"],
            correctIndex: 0,
            explain: "0x24 (0010 0100) → Set b0: 0x25 → Clear b5: 0x05 → Toggle b2: 0x01."
          },
          {
            prompt: "Hàm decode_adc(0xA3U, 0x5CU) bỏ 4 bit trạng thái cao của byte high và ghép 12 bit dữ liệu. Kết quả thập phân là bao nhiêu?",
            options: ["860", "2620", "163"],
            correctIndex: 0,
            explain: "(0xA3 & 0x0F) = 0x03; (0x03 << 8) | 0x5C = 0x035C = 3 × 256 + 92 = 860."
          }
        ]
      }
    ]
  };
}
