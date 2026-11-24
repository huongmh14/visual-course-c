import {
  PALETTE,
  drawIsoBlock,
  drawPillTag,
  drawFlatCard,
  addWire
} from "../svg-primitives.js";

function sceneCTypesRange(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Chọn kiểu <stdint.h> khớp miền giá trị: Mẫu ADC 12-bit (0..4095)",
      "Choose <stdint.h> width by range: 12-bit ADC sample (0..4095)"
    ),
    t(
      "Kiểu quyết định miền lưu trữ & số byte sizeof(raw); tránh phụ thuộc int trần",
      "Type sets storable range & sizeof(raw) bytes; avoid platform-dependent bare int"
    )
  );

  drawIsoBlock(
    g,
    150,
    148,
    128,
    82,
    26,
    "sky",
    "ADC 12-bit",
    "raw = 4095 (0x0FFF)"
  );

  drawFlatCard(
    g,
    390,
    102,
    430,
    78,
    PALETTE.rose.top,
    t("uint8_t (1 byte): 0..255 ❌", "uint8_t (1 byte): 0..255 ❌"),
    t(
      "4095 tràn xuống 255! Mất sạch 4 bit cao của mẫu ADC",
      "4095 overflows (mod 256 → 255)! Loses top 4 ADC bits"
    )
  );

  drawFlatCard(
    g,
    390,
    198,
    430,
    78,
    PALETTE.sage.top,
    t("uint16_t (2 bytes): 0..65,535 ✓", "uint16_t (2 bytes): 0..65,535 ✓"),
    t(
      "sizeof(raw) = 2B · Đủ chuẩn chứa 0..4095 & dự phòng an toàn",
      "sizeof(raw) = 2B · Exact fit for 0..4095 with headroom"
    )
  );

  drawFlatCard(
    g,
    390,
    294,
    430,
    78,
    PALETTE.lavender.top,
    t("uint32_t (4 bytes): 0..4.29B", "uint32_t (4 bytes): 0..4.29B"),
    t(
      "Độ rộng cố định trên mọi MCU (rất hợp cho tổng cộng dồn)",
      "Fixed 32-bit width across targets (ideal for accumulators)"
    )
  );

  addWire(g, [[262, 185], [390, 141]], "#d38383", false, { markerEnd: true });
  addWire(g, [[262, 200], [390, 237]], "#84b684", false, { markerEnd: true });
  addWire(g, [[262, 215], [390, 333]], "#ad9cd8", false, { markerEnd: true });

  addPacketTrack([[262, 185], [390, 141]], "#e57373", 1, 0.36, "overflow");
  addPacketTrack([[262, 200], [390, 237]], "#84be88", 1, 0.36, "2B ✓");
  addPacketTrack([[262, 215], [390, 333]], "#c7b8ea", 1, 0.34, "4B");

  drawPillTag(
    g,
    440,
    400,
    t(
      "sizeof(int) có thể là 2B (AVR) hoặc 4B (STM32) — ưu tiên <stdint.h>",
      "sizeof(int) may be 2B (AVR) or 4B (STM32) — prefer <stdint.h>"
    ),
    PALETTE.amber.top
  );
}

function sceneCScanfGuard(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Kiểm tra scanf() == 1 TRƯỚC khi dùng biến celsius",
      "Check scanf() == 1 BEFORE reading celsius"
    ),
    t(
      "Truyền địa chỉ &celsius để scanf ghi vào RAM; luôn xử lý nhánh nhập sai hoặc EOF",
      "Pass &celsius so scanf writes to RAM; always guard bad input or EOF"
    )
  );

  drawFlatCard(
    g,
    48,
    126,
    180,
    118,
    PALETTE.sky.top,
    "stdin",
    t("Ca hợp lệ: \"25.5\"\nCa lỗi: \"abc\"", "Valid: \"25.5\"\nInvalid: \"abc\"")
  );

  drawFlatCard(
    g,
    290,
    122,
    248,
    126,
    PALETTE.amber.top,
    "scanf(\"%lf\", &celsius)",
    t("Trả về số trường đọc được\n(cần == 1)", "Returns assigned fields\n(require == 1)")
  );

  drawFlatCard(
    g,
    600,
    96,
    232,
    88,
    PALETTE.sage.top,
    t("trả về 1 → Hợp lệ ✓", "returns 1 → Valid ✓"),
    t("Ghi 25.5 vào &celsius\nprintf → 25.50 C", "Writes 25.5 to &celsius\nprintf → 25.50 C")
  );

  drawFlatCard(
    g,
    600,
    214,
    232,
    88,
    PALETTE.rose.top,
    t("khác 1 → Lỗi ❌", "!= 1 → Error ❌"),
    t("celsius vẫn chứa rác!\nIn lỗi & return 1;", "celsius holds stack garbage!\nPrint error & return 1;")
  );

  addWire(g, [[228, 185], [290, 185]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[538, 160], [600, 140]], "#84b684", false, { markerEnd: true });
  addWire(g, [[538, 210], [600, 258]], "#d38383", false, { markerEnd: true });

  addPacketTrack([[228, 185], [290, 185]], "#84b4df", 1, 0.36, "&celsius");
  addPacketTrack([[538, 160], [600, 140]], "#84be88", 1, 0.36, "== 1 ✓");
  addPacketTrack([[538, 210], [600, 258]], "#e57373", 1, 0.36, "!= 1 ❌");

  drawPillTag(
    g,
    440,
    364,
    t(
      "Tách I/O (scanf/printf) khỏi hàm tính để tái sử dụng với dữ liệu cảm biến",
      "Keep I/O in main() so the calculation helper works with sensor readings too"
    ),
    PALETTE.sage.top
  );
}

function sceneCTempFunc(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Hàm celsius_to_fahrenheit(100.0): Tránh bẫy chia nguyên (9 / 5)",
      "celsius_to_fahrenheit(100.0): Avoid integer division trap (9 / 5)"
    ),
    t(
      "Viết rõ đầu vào, kiểu trả về và công thức F = C × 9.0 / 5.0 + 32.0 trước khi code",
      "Specify inputs, return type, and F = C × 9.0 / 5.0 + 32.0 before writing the body"
    )
  );

  drawIsoBlock(g, 138, 142, 126, 80, 26, "sky", "celsius = 100.0", "double param");

  drawFlatCard(
    g,
    360,
    96,
    460,
    100,
    PALETTE.rose.top,
    t("BẪY: 100.0 * (9 / 5) + 32 = 132.0 °F ❌", "TRAP: 100.0 * (9 / 5) + 32 = 132.0 °F ❌"),
    t(
      "9 / 5 chia nguyên bị cắt về 1 (mất 0.8) → sai lệch hẳn 80 °F!",
      "Integer 9 / 5 truncates to 1 (drops 0.8) → 80 °F error!"
    )
  );

  drawFlatCard(
    g,
    360,
    228,
    460,
    102,
    PALETTE.sage.top,
    t("CHUẨN: 100.0 * (9.0 / 5.0) + 32.0 = 212.00 °F ✓", "SAFE: 100.0 * (9.0 / 5.0) + 32.0 = 212.00 °F ✓"),
    t(
      "9.0 / 5.0 = 1.80 (số thực) · Giữ thân hàm thuần túy, không gọi scanf/printf bên trong",
      "9.0 / 5.0 = 1.80 (floating point) · Pure helper testable without stdin/stdout"
    )
  );

  addWire(g, [[246, 178], [360, 146]], "#d38383", false, { markerEnd: true });
  addWire(g, [[246, 206], [360, 279]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[246, 178], [360, 146]], "#e57373", 1, 0.36, "9/5 = 1");
  addPacketTrack([[246, 206], [360, 279]], "#84be88", 1, 0.36, "9.0 / 5.0");

  drawPillTag(
    g,
    440,
    376,
    "0 °C → 32.0 °F   |   100 °C → 212.0 °F   |   −40 °C → −40.0 °F",
    PALETTE.lavender.top
  );
}

function sceneCSumWiden(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Tổng 3 mẫu uint16_t: Mở rộng lên uint32_t & chia cho 3.0",
      "Sum of 3 uint16_t samples: Widen to uint32_t & divide by 3.0"
    ),
    t(
      "Đổi kiểu TRƯỚC khi cộng hoặc chia để phép tính trung gian không tràn hay mất phần lẻ",
      "Promote operands BEFORE adding or dividing to preserve range and fraction"
    )
  );

  drawFlatCard(
    g,
    48,
    124,
    198,
    120,
    PALETTE.amber.top,
    "3 × 65,535 (uint16_t)",
    t(
      "Tổng thật = 196,605\n(Vượt ngưỡng 65,535!)",
      "True sum = 196,605\n(Exceeds 65,535 max!)"
    )
  );

  drawFlatCard(
    g,
    314,
    96,
    518,
    98,
    PALETTE.rose.top,
    t("LỖI: a + b + c (16-bit) & (double)(5 / 3) ❌", "BUG: a + b + c (16-bit) & (double)(5 / 3) ❌"),
    t(
      "Tràn tích lũy trên đích int 16-bit · (5 / 3) mất phần lẻ thành 1.00 trước khi ép kiểu",
      "Overflows on 16-bit int targets · (5 / 3) truncates to 1 before double cast"
    )
  );

  drawFlatCard(
    g,
    314,
    224,
    518,
    102,
    PALETTE.sage.top,
    t("CHUẨN: (uint32_t)a + b + c;   sum / 3.0 ✓", "SAFE: (uint32_t)a + b + c;   sum / 3.0 ✓"),
    t(
      "Toán hạng đầu là uint32_t → chứa đủ 196,605 · 5 / 3.0 giữ nguyên 1.666…",
      "Leading uint32_t holds 196,605 safely · 5 / 3.0 keeps 1.666… fractional precision"
    )
  );

  addWire(g, [[246, 164], [314, 145]], "#d38383", false, { markerEnd: true });
  addWire(g, [[246, 204], [314, 275]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[246, 164], [314, 145]], "#e57373", 1, 0.36, "wrap ❌");
  addPacketTrack([[246, 204], [314, 275]], "#84be88", 1, 0.36, "uint32_t ✓");

  drawPillTag(
    g,
    440,
    374,
    t(
      "Kiểm thử biên: average_adc3(65535, 65535, 65535) == 65535.0",
      "Boundary test: average_adc3(65535, 65535, 65535) == 65535.0"
    ),
    PALETTE.sky.top
  );
}

function sceneCTypesLab(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Thực hành Bài 01: Viết 3 chương trình C17 & tự kiểm thử biên",
      "Lab 01: Write 3 C17 programs & verify edge cases"
    ),
    t(
      "Ghi ca thường + ca biên + đầu ra dự kiến trước khi chạy và đối chiếu từng bài",
      "Log normal + boundary cases + expected outputs before running each binary"
    )
  );

  drawFlatCard(
    g,
    48,
    100,
    232,
    118,
    PALETTE.sky.top,
    "1. types.c",
    t(
      "In sizeof int, uint8/16/32\nChọn uint16_t cho ADC 12-bit",
      "Print sizeof int, uint8/16/32\nPick uint16_t for 12-bit ADC"
    )
  );

  drawFlatCard(
    g,
    324,
    100,
    232,
    118,
    PALETTE.amber.top,
    "2. temperature.c",
    t(
      "Thử: 0, 100, −40 & 'abc'\nKiểm tra scanf == 1",
      "Test: 0, 100, −40 & 'abc'\nGuard scanf == 1"
    )
  );

  drawFlatCard(
    g,
    600,
    100,
    232,
    118,
    PALETTE.sage.top,
    "3. average.c",
    t(
      "1 2 2 → 1.67 | 1 x 2 → lỗi\naverage_adc3(65535×3) ✓",
      "1 2 2 → 1.67 | 1 x 2 → err\naverage_adc3(65535×3) ✓"
    )
  );

  drawFlatCard(
    g,
    110,
    256,
    660,
    74,
    "var(--bg-elevated)",
    "gcc -std=c17 -Wall -Wextra -Wpedantic",
    t(
      "0 cảnh báo + mọi ca thường & ca biên khớp kết quả dự kiến → git commit",
      "0 warnings + all normal & boundary cases match predictions → git commit"
    )
  );

  addWire(g, [[164, 218], [260, 256]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[440, 218], [440, 256]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[716, 218], [620, 256]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[164, 218], [260, 256]], "#84b4df", 1, 0.34, "sizeof");
  addPacketTrack([[440, 218], [440, 256]], "#f5d88b", 1, 0.34, "°C→°F");
  addPacketTrack([[716, 218], [620, 256]], "#84be88", 1, 0.34, "avg");

  drawPillTag(
    g,
    440,
    376,
    t(
      "Dự đoán trước → Nhập → Tính trong hàm → Kiểm tra kết quả",
      "Predict first → Read input → Pure calculation → Verify output"
    ),
    PALETTE.sage.top
  );
}

function sceneCShortCircuit(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Đoản mạch && (Short-Circuit): Chặn chia 0 trước khi tính %",
      "Short-Circuit && Guard: Block divide-by-zero before scaling"
    ),
    t(
      "C chỉ tính vế phải của && khi vế trái khác 0; nâng toán hạng lên uint32_t trước khi nhân",
      "C evaluates the right operand of && only when the left side is nonzero"
    )
  );

  drawFlatCard(
    g,
    48,
    120,
    178,
    122,
    PALETTE.sky.top,
    "sample = 740",
    t("Ngưỡng cảnh báo: ≥ 70%\nlimit = 1000 hoặc 0", "Alert limit: ≥ 70%\nlimit = 1000 or 0")
  );

  drawFlatCard(
    g,
    290,
    124,
    218,
    114,
    PALETTE.amber.top,
    "limit != 0  &&  ...",
    t("Vế trái == 0 → DỪNG NGAY\n(Bỏ qua hoàn toàn phép chia)", "Left == 0 → STOP EARLY\n(Skips right side completely)")
  );

  drawFlatCard(
    g,
    576,
    94,
    256,
    90,
    PALETTE.rose.top,
    t("limit = 0 → high = false ✓", "limit = 0 → high = false ✓"),
    t("An toàn! Không thực hiện phép / 0\nTránh lỗi phần cứng", "Safe! Division by 0 never runs\nPrevents fault trap")
  );

  drawFlatCard(
    g,
    576,
    208,
    256,
    92,
    PALETTE.sage.top,
    t("limit = 1000 → high = true", "limit = 1000 → high = true"),
    t("(uint32_t)740*100 / 1000 = 74\n74 ≥ 70 → Bật cờ high", "(uint32_t)740*100 / 1000 = 74\n74 ≥ 70 → Alert flag set")
  );

  addWire(g, [[226, 181], [290, 181]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[508, 158], [576, 139]], "#d38383", false, { markerEnd: true });
  addWire(g, [[508, 204], [576, 254]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[226, 181], [290, 181]], "#84b4df", 1, 0.34, "check");
  addPacketTrack([[508, 158], [576, 139]], "#e57373", 1, 0.36, "skip /0");
  addPacketTrack([[508, 204], [576, 254]], "#84be88", 1, 0.36, "74%");

  drawPillTag(
    g,
    440,
    360,
    t(
      "Dùng <stdbool.h> cho bool & ép (uint32_t) trước sample * 100 để tránh tràn 16-bit",
      "Use <stdbool.h> for bool & cast (uint32_t) before sample * 100 to prevent overflow"
    ),
    PALETTE.amber.top
  );
}

function sceneCForBounds(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Vòng for quét mảng: Điều kiện i < n giữ chỉ số trong 0..n-1",
      "For Loop Over Array: Condition i < n keeps index in 0..n-1"
    ),
    t(
      "Kiểm tra điều kiện trước mỗi lượt; đếm số mẫu ≥ 700 trong samples[3]",
      "Evaluates guard before every iteration; counts samples ≥ 700 in samples[3]"
    )
  );

  const slots = [
    { x: 52, title: "samples[0] = 690", sub: t("690 < 700 → bỏ qua", "690 < 700 → skip"), fill: PALETTE.paper.top },
    { x: 252, title: "samples[1] = 700", sub: t("700 ≥ 700 → ++count (1)", "700 ≥ 700 → ++count (1)"), fill: PALETTE.sage.top },
    { x: 452, title: "samples[2] = 740", sub: t("740 ≥ 700 → ++count (2)", "740 ≥ 700 → ++count (2)"), fill: PALETTE.sage.top },
    { x: 652, title: t("i = 3: DỪNG ❌", "i = 3: STOP ❌"), sub: t("i < 3 sai → không đọc ngoài mảng", "i < 3 false → no OOB read"), fill: PALETTE.rose.top }
  ];

  slots.forEach((s, i) => {
    drawFlatCard(g, s.x, 114, 176, 102, s.fill, s.title, s.sub);
    if (i > 0) {
      const pts = [[s.x - 24, 165], [s.x, 165]];
      addWire(g, pts, i === 3 ? "#d38383" : "#84b684", i === 3, { markerEnd: true });
      addPacketTrack(pts, i === 3 ? "#e57373" : "#84be88", 1, 0.34, `i=${i}`);
    }
  });

  drawFlatCard(
    g,
    130,
    254,
    620,
    76,
    "var(--bg-elevated)",
    "n = sizeof samples / sizeof samples[0] = 3   →   high_count = 2",
    t(
      "Dùng size_t từ <stddef.h>; khi n = 0 thân vòng for chạy đúng 0 lần",
      "Use size_t from <stddef.h>; when n = 0 the loop body runs 0 times"
    )
  );

  drawPillTag(
    g,
    440,
    376,
    t(
      "sizeof(samples) chỉ cho số phần tử khi nhìn thấy đối tượng mảng (không dùng sau decay con trỏ)",
      "sizeof(samples) counts elements only where the array object itself is visible"
    ),
    PALETTE.sky.top
  );
}

function sceneCDowhileTimeout(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "while vs do-while: Giới hạn số lần đọc cờ chống treo phần cứng",
      "while vs do-while: Bounded Retry Loop Prevents Hardware Hang"
    ),
    t(
      "while kiểm tra đầu lượt (có thể chạy 0 lần); do-while kiểm tra cuối lượt (chạy ≥ 1 lần)",
      "while checks at top (0+ runs); do-while checks at bottom (≥ 1 run guaranteed)"
    )
  );

  drawFlatCard(
    g,
    48,
    126,
    226,
    112,
    PALETTE.sky.top,
    "do { ready = read_ready();",
    t("++tries;   // tries = 1..4\nLuôn đọc cờ ít nhất 1 lần", "++tries;   // tries = 1..4\nReads hardware flag at least once")
  );

  drawFlatCard(
    g,
    330,
    126,
    228,
    112,
    PALETTE.amber.top,
    "while (!ready && tries < 4)",
    t("Chưa sẵn sàng & còn lượt → lặp\nNgược lại → thoát vòng ngay", "Not ready & retries left → retry\nOtherwise → exit loop")
  );

  drawFlatCard(
    g,
    616,
    94,
    216,
    86,
    PALETTE.sage.top,
    t("ready == true (tries=1) ✓", "ready == true (tries=1) ✓"),
    t("Phần cứng phản hồi ngay\nThoát sau đúng 1 lần đọc", "Hardware responded early\nExits after 1 read")
  );

  drawFlatCard(
    g,
    616,
    206,
    216,
    88,
    PALETTE.rose.top,
    t("tries == 4 & !ready ❌", "tries == 4 & !ready ❌"),
    t("Chạm ngưỡng timeout sau 4 lượt\nKhông làm treo vô hạn", "Hit retry cap after 4 reads\nPrevents infinite hang")
  );

  addWire(g, [[274, 182], [330, 182]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[558, 158], [616, 137]], "#84b684", false, { markerEnd: true });
  addWire(g, [[558, 206], [616, 250]], "#d38383", false, { markerEnd: true });
  addWire(g, [[444, 126], [444, 88], [161, 88], [161, 126]], "#d3b25a", true, { markerEnd: true });

  addPacketTrack([[274, 182], [330, 182]], "#84b4df", 1, 0.34, "poll");
  addPacketTrack([[558, 158], [616, 137]], "#84be88", 1, 0.36, "ready");
  addPacketTrack([[558, 206], [616, 250]], "#e57373", 1, 0.36, "timeout");
  addPacketTrack([[444, 126], [444, 88], [161, 88], [161, 126]], "#f5d88b", 1, 0.28, "retry");

  drawPillTag(
    g,
    440,
    358,
    t(
      "Trong super-loop thực tế, kiểm tra 1 lần mỗi tick thay vì chặn CPU chờ đợi",
      "In a firmware super-loop, sample once per tick with timestamps instead of busy-waiting"
    ),
    PALETTE.lavender.top
  );
}

function sceneCSwitchHysteresis(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Switch máy trạng thái (FSM) với vùng trễ 650..700 chống giật cờ",
      "Switch State Machine (FSM) with 650..700 Hysteresis Band"
    ),
    t(
      "Mỗi lần gọi next_state(state, sample) chỉ xét nhánh case hiện tại rồi return trạng thái mới",
      "Each call to next_state(state, sample) evaluates one case branch and returns next state"
    )
  );

  drawIsoBlock(
    g,
    185,
    142,
    136,
    86,
    26,
    "sky",
    "case WAIT:",
    t("Giữ nếu < 700", "Hold if < 700")
  );

  drawIsoBlock(
    g,
    665,
    142,
    136,
    86,
    26,
    "rose",
    "case ALERT:",
    t("Giữ nếu ≥ 650", "Hold if ≥ 650")
  );

  addWire(g, [[298, 154], [588, 154]], "#d38383", false, { markerEnd: true });
  addWire(g, [[588, 232], [298, 232]], "#84b684", false, { markerEnd: true });

  drawPillTag(g, 443, 120, "sample >= 700 → return ALERT", PALETTE.rose.top);
  drawPillTag(g, 443, 268, "sample < 650 → return WAIT", PALETTE.sage.top);

  addPacketTrack([[298, 154], [588, 154]], "#e57373", 1, 0.34, "≥ 700");
  addPacketTrack([[588, 232], [298, 232]], "#84be88", 1, 0.34, "< 650");

  drawFlatCard(
    g,
    120,
    316,
    640,
    74,
    PALETTE.lavender.top,
    t(
      "Vùng trễ (Hysteresis) 650..699: Giữ nguyên trạng thái đang có!",
      "Hysteresis Band 650..699: Hold Current State!"
    ),
    t(
      "Ngăn dao động quanh 700 bật/tắt cảnh báo liên tục · Nhánh default trả WAIT để an toàn",
      "Prevents oscillation around 700 from chattering alerts · default: safely resets to WAIT"
    )
  );
}

function sceneCFsmCsvLab(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    60,
    18,
    760,
    48,
    "var(--bg-elevated)",
    t(
      "Thực hành Bài 03: Chạy next_state() trên chuỗi mẫu biên (datasets/fsm.csv)",
      "Lab 03: Trace next_state() across boundary samples (datasets/fsm.csv)"
    ),
    t(
      "Ôn FizzBuzz, số nguyên tố, bảng cửu chương, switch máy tính và kiểm thử chuỗi cảnh báo",
      "Review FizzBuzz, prime check, multiplication table, switch calc & assert next_state()"
    )
  );

  const trace = [
    { sample: "699", state: "→ WAIT", sub: t("Khởi tạo WAIT", "Starts WAIT"), fill: PALETTE.paper.top },
    { sample: "700", state: "→ ALERT", sub: t("Đạt ngưỡng 700", "Hits ≥ 700"), fill: PALETTE.rose.top },
    { sample: "680", state: "→ ALERT", sub: t("Giữ vùng trễ", "Hold band"), fill: PALETTE.amber.top },
    { sample: "650", state: "→ ALERT", sub: t("Biên ≥ 650 giữ", "At 650 holds"), fill: PALETTE.amber.top },
    { sample: "649", state: "→ WAIT", sub: t("Hồi < 650 ✓", "< 650 clears ✓"), fill: PALETTE.sage.top }
  ];

  trace.forEach((item, i) => {
    const x = 47 + i * 162;
    drawFlatCard(g, x, 110, 138, 118, item.fill, `${item.sample}\n${item.state}`, item.sub);
    if (i > 0) {
      const pts = [[x - 24, 169], [x, 169]];
      addWire(g, pts, "var(--border)", false, { markerEnd: true });
      addPacketTrack(pts, "#84be88", 1, 0.36);
    }
  });

  drawFlatCard(
    g,
    110,
    264,
    660,
    76,
    "var(--bg-elevated)",
    "gcc -std=c17 -Wall -Wextra -Wpedantic  +  assert()",
    t(
      "Kỳ vọng: WAIT → ALERT → ALERT → ALERT → WAIT · Đang ALERT nhận 670 giữ ALERT",
      "Expected: WAIT → ALERT → ALERT → ALERT → WAIT · ALERT + 670 stays ALERT"
    )
  );

  drawPillTag(
    g,
    440,
    378,
    t(
      "FizzBuzz(15) · Prime(1/2/9) · 9×9=81 · Chia 0 phải báo lỗi",
      "FizzBuzz(15) · Prime(1/2/9) · 9×9=81 · Divide-by-zero error branch"
    ),
    PALETTE.sky.top
  );
}

export function registerEarlyCScenes(registerScene) {
  registerScene("c_types_range", sceneCTypesRange);
  registerScene("c_scanf_guard", sceneCScanfGuard);
  registerScene("c_temp_func", sceneCTempFunc);
  registerScene("c_sum_widen", sceneCSumWiden);
  registerScene("c_types_lab", sceneCTypesLab);
  registerScene("c_short_circuit", sceneCShortCircuit);
  registerScene("c_for_bounds", sceneCForBounds);
  registerScene("c_dowhile_timeout", sceneCDowhileTimeout);
  registerScene("c_switch_hysteresis", sceneCSwitchHysteresis);
  registerScene("c_fsm_csv_lab", sceneCFsmCsvLab);
}
