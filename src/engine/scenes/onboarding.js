import {
  PALETTE,
  svgEl,
  drawIsoBlock,
  drawPillTag,
  drawFlatCard,
  addWire
} from "../svg-primitives.js";

function sceneIntroLoop(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    100,
    24,
    680,
    44,
    "var(--bg-elevated)",
    t("Vòng lặp học chủ động 70 phút/tối", "70-Minute Active Learning Loop"),
    t("Không đọc thụ động: Đoán → Phá code để thấy lỗi → Tự trả lời câu hỏi mở", "Don't read passively: Predict → Break code to see failure → Answer open questions")
  );

  drawIsoBlock(g, 165, 144, 136, 86, 26, "sky", t("1. Đoán 15s", "1. Predict 15s"), t("Trước khi bấm Next", "Before clicking Next"));
  drawIsoBlock(g, 440, 144, 136, 86, 26, "amber", t("2. Thử sai + assert", "2. Break + assert"), t("Gặp lỗi để nhớ lâu", "Fail fast to remember"));
  drawIsoBlock(g, 715, 144, 136, 86, 26, "sage", t("3. Câu hỏi mở", "3. Open Question"), t("Viết bằng lời mình", "Explain in own words"));

  const w1 = [[284, 204], [364, 204]];
  const w2 = [[559, 204], [639, 204]];
  const loopBack = [[735, 290], [735, 328], [185, 328], [185, 290]];

  addWire(g, w1, "#84b4df", false, { markerEnd: true });
  addWire(g, w2, "#d3b25a", false, { markerEnd: true });
  addWire(g, loopBack, "#84b684", true, { markerEnd: true });

  drawPillTag(g, 322, 126, t("Kiểm chứng trực quan", "Visual feedback"), PALETTE.sky.top);
  drawPillTag(g, 597, 126, t("Ghi chú bài toán thật", "Real-world note"), PALETTE.amber.top);
  drawPillTag(g, 460, 368, t("Khóa kiến thức · Lặp lại ở bước sau", "Lock insight · Repeat next step"), PALETTE.sage.top);

  addPacketTrack(w1, "#84b4df", 1, 0.36, "predict");
  addPacketTrack(w2, "#f5d88b", 1, 0.36, "assert");
  addPacketTrack(loopBack, "#84be88", 1, 0.28, "reflect");
}

function sceneIntroCaseBms(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    100,
    38,
    680,
    42,
    "var(--bg-elevated)",
    t("Bài toán thực tế #1: Đồng hồ pin xe điện tụt từ 99% → 0%", "Real Case #1: EV Battery Gauge Drops 99% → 0%"),
    t("Cảm biến gửi giá trị vượt ngưỡng 8-bit hoặc cộng dồn bị tràn", "Sensor reading overflows an 8-bit integer or accumulator")
  );

  drawIsoBlock(g, 190, 165, 125, 84, 28, "sky", "Pin BMS + ADC", "0..4200 mV | ±5A");
  drawFlatCard(
    g,
    390,
    112,
    410,
    78,
    PALETTE.rose.top,
    t("LỖI: uint8_t sum = 200 + 80; // = 24 ❌", "BUG: uint8_t sum = 200 + 80; // = 24 ❌"),
    t("Tràn modulo 256 → Báo pin ảo 0% giữa đường!", "Modulo 256 wrap → False 0% battery fault!")
  );
  drawFlatCard(
    g,
    390,
    244,
    410,
    78,
    PALETTE.sage.top,
    t("CHUẨN: uint16_t mv; int16_t ma; ✓", "SAFE: uint16_t mv; int16_t ma; ✓"),
    t("Đủ miền 0..4200 mV & dòng sạc/xả âm dương", "Fits 0..4200 mV and bidirectional current")
  );

  addWire(g, [[298, 200], [390, 151]], "#d38383", false, { markerEnd: true });
  addWire(g, [[298, 225], [390, 283]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[298, 200], [390, 151]], "#e57373", 2, 0.38, "overflow");
  addPacketTrack([[298, 225], [390, 283]], "#84be88", 2, 0.36, "uint16_t");
}

function sceneIntroCaseDebounce(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    90,
    38,
    700,
    42,
    "var(--bg-elevated)",
    t("Bài toán thực tế #2: Bấm nút 1 lần nhưng máy chạy 3 lần", "Real Case #2: Single Button Press Triggers 3 Times"),
    t("Tiếp điểm cơ rung hàng mili-giây; dùng delay() sẽ làm đơ các tác vụ khác", "Mechanical contacts bounce; delay() stalls the entire MCU")
  );

  // Raw bounce signal card + mini square-wave path
  drawFlatCard(g, 70, 155, 210, 115, PALETTE.rose.top, t("Nút bấm cơ (Rung)", "Bouncy Switch"), "1 → 0 → 1 → 0 → 0 → 0", { valign: "top" });
  addWire(g, [
    [95, 232], [115, 232], [115, 252], [135, 252], [135, 232],
    [155, 232], [155, 252], [250, 252]
  ], "#5a1818");

  // Middle filter vs delay warning
  drawPillTag(g, 440, 116, t("KHÔNG dùng delay_ms(50) chặn CPU!", "AVOID blocking delay_ms(50)!"), PALETTE.rose.top, "#5a1818");
  drawIsoBlock(g, 440, 165, 130, 82, 26, "amber", t("Lấy mẫu mỗi 5 ms", "5 ms Sampler"), t("Đếm 3 lần giống nhau", "3 equal samples"));

  // Clean output
  drawFlatCard(g, 630, 165, 185, 95, PALETTE.sage.top, t("1 Sự kiện nhấn ✓", "1 Clean Press ✓"), t("CPU vẫn rảnh đọc cảm biến", "CPU stays responsive"));

  addWire(g, [[280, 212], [369, 212]], "#d38383", false, { markerEnd: true });
  addWire(g, [[552, 212], [630, 212]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[280, 212], [369, 212]], "#e57373", 2, 0.42, "0/1 dội");
  addPacketTrack([[552, 212], [630, 212]], "#84be88", 1, 0.32, "PRESS");
}

function sceneIntroCaseUart(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    85,
    38,
    710,
    42,
    "var(--bg-elevated)",
    t("Bài toán thực tế #3: Nhiệt độ trên màn hình hiện 59.395 °C", "Real Case #3: Dashboard Displays 59,395 °C"),
    t("STM32 gửi byte thấp trước, còn đường truyền đọc byte cao trước", "STM32 sends low byte first, while the wire expects high byte first")
  );

  drawIsoBlock(g, 180, 165, 130, 84, 28, "sky", "STM32 SRAM", "0x03E8 → [E8][03]");

  drawFlatCard(
    g,
    395,
    112,
    405,
    76,
    PALETTE.rose.top,
    t("LỖI: uart_send(&raw, 2) ❌", "BUG: uart_send(&raw, 2) ❌"),
    t("Dây truyền: E8 → 03  ⇒  Gateway đọc 0xE803 = 59,395", "Wire: E8 → 03  ⇒  Gateway reads 0xE803 = 59,395")
  );
  drawFlatCard(
    g,
    395,
    244,
    405,
    76,
    PALETTE.sage.top,
    t("CHUẨN: (raw >> 8) & 0xFF trước ✓", "SAFE: Send (raw >> 8) first ✓"),
    t("Dây truyền: 03 → E8  ⇒  Gateway đọc 0x03E8 = 10.00 °C", "Wire: 03 → E8  ⇒  Gateway reads 0x03E8 = 10.00 °C")
  );

  addWire(g, [[292, 200], [395, 150]], "#d38383", false, { markerEnd: true });
  addWire(g, [[292, 228], [395, 282]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[292, 200], [395, 150]], "#e57373", 2, 0.36, "E8 → 03");
  addPacketTrack([[292, 228], [395, 282]], "#84be88", 2, 0.36, "03 → E8");
}

function sceneIntroRoadmap(g, _scene, { addPacketTrack, t }) {
  const stages = [
    { x: 135, y: 240, tone: "sky", title: "01. C Nhúng + CSV", sub: t("Bài 00–11", "Lessons 00–11") },
    { x: 335, y: 188, tone: "amber", title: t("02. Điện tử cơ bản", "02. Electronics"), sub: t("Bài 12–19", "Lessons 12–19") },
    { x: 535, y: 136, tone: "lavender", title: "03. STM32 Cortex-M", sub: t("Bài 20–26", "Lessons 20–26") },
    { x: 735, y: 84, tone: "sage", title: "04. RTOS & LoRa", sub: t("Bài 27–30", "Lessons 27–30") }
  ];

  stages.forEach((st, i) => {
    drawIsoBlock(g, st.x, st.y, 124, 78, 24, st.tone, st.title, st.sub);
    if (i > 0) {
      const prev = stages[i - 1];
      const pA = [prev.x + 104, prev.y + 54];
      const pB = [st.x - 66, st.y + 38];
      addWire(g, [pA, pB], "#84b684", false, { markerEnd: true });
      addPacketTrack([pA, pB], "#84be88", 1, 0.35);
    }
  });

  drawPillTag(g, 440, 368, t("Mỗi chặng đều có bài tập PC + dataset CSV + câu hỏi mở", "Every stage pairs C labs + CSV datasets + open questions"), PALETTE.sage.top);
}

function sceneIntroWeek1Lab(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    70,
    24,
    740,
    50,
    "var(--bg-elevated)",
    t("Khởi động Tuần 1: Quy trình học, ghi chú .md & repo C", "Week 1 Kickoff: Study Rhythm, .md Notes & C Repo"),
    t("Chốt khung giờ · Xuất câu hỏi mở thành file notes.md · Biên dịch với -Werror", "Lock your daily slot · Export Open Qs to notes.md · Build cleanly with -Werror")
  );

  drawFlatCard(
    g,
    52,
    104,
    216,
    114,
    PALETTE.sky.top,
    t("1. Đoán 15s trên sơ đồ", "1. Predict 15s on stage"),
    t("Dừng ở bước PROBLEM\nĐoán tràn số / thứ tự byte\nrồi mới bấm Bước tiếp", "Pause on PROBLEM steps\nPredict overflow / endian\nbefore clicking Next")
  );
  drawFlatCard(
    g,
    332,
    104,
    216,
    114,
    PALETTE.amber.top,
    t("2. Ghi câu hỏi mở (.md)", "2. Save Open Qs (.md)"),
    t("Viết ngắn bằng lời mình\nNhấn Sao chép (.md)\nlưu vào week01/notes.md", "Write 3 concise lines\nClick Copy (.md)\nsave into week01/notes.md")
  );
  drawFlatCard(
    g,
    612,
    104,
    216,
    114,
    PALETTE.sage.top,
    t("3. Repo week01 + -Werror", "3. week01 Repo + -Werror"),
    t("mkdir -p embedded-journey\ngcc -Wall -Wextra\n-Werror main.c", "mkdir -p embedded-journey\ngcc -Wall -Wextra\n-Werror main.c")
  );

  addWire(g, [[268, 161], [332, 161]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[548, 161], [612, 161]], "#d3b25a", false, { markerEnd: true });
  addPacketTrack([[268, 161], [332, 161]], "#84b4df", 1, 0.36, "predict");
  addPacketTrack([[548, 161], [612, 161]], "#f5d88b", 1, 0.36, ".md");

  drawFlatCard(
    g,
    115,
    266,
    650,
    72,
    "var(--bg-elevated)",
    t("Đầu ra Tuần 1: 1 file notes.md + 3 bài C biên dịch không cảnh báo", "Week 1 Output: 1 notes.md + 3 Warning-Free C Programs"),
    t("types.c · temperature.c · average.c — chạy đủ ca biên & assert trước khi commit", "types.c · temperature.c · average.c — verify edge cases & asserts before commit")
  );

  addWire(g, [[720, 218], [720, 266]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[720, 218], [720, 266]], "#84be88", 1, 0.36, "commit");

  drawPillTag(g, 195, 376, t("Space: Dừng soi sơ đồ", "Space: Pause diagram"), PALETTE.sky.top);
  drawPillTag(g, 440, 376, t("Nút Sao chép (.md)", "Copy (.md) button"), PALETTE.amber.top);
  drawPillTag(g, 685, 376, "gcc -Wall -Wextra -Werror", PALETTE.sage.top);
}

export function registerOnboardingScenes(registerScene) {
  registerScene("intro_loop", sceneIntroLoop);
  registerScene("intro_case_bms", sceneIntroCaseBms);
  registerScene("intro_case_debounce", sceneIntroCaseDebounce);
  registerScene("intro_case_uart", sceneIntroCaseUart);
  registerScene("intro_roadmap", sceneIntroRoadmap);
  registerScene("intro_week1_lab", sceneIntroWeek1Lab);
}
