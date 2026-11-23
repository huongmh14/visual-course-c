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
    130,
    36,
    620,
    42,
    "var(--bg-elevated)",
    t("Vòng lặp học chủ động 70 phút/tối", "70-Minute Active Learning Loop"),
    t("Không đọc thụ động: Đoán → Phá code để thấy lỗi → Tự trả lời câu hỏi mở", "Don't read passively: Predict → Break code to see failure → Answer open questions")
  );

  drawIsoBlock(g, 240, 125, 130, 82, 26, "sky", t("1. Đoán 15 giây", "1. Predict 15s"), t("Trước khi bấm Next", "Before clicking Next"));
  drawIsoBlock(g, 640, 125, 130, 82, 26, "amber", t("2. Phá code + assert", "2. Break + assert"), t("Thử sai để nhớ lâu", "Fail fast to remember"));
  drawIsoBlock(g, 440, 265, 140, 84, 28, "sage", t("3. Câu hỏi mở", "3. Open Question"), t("Viết lại bằng lời mình", "Explain in own words"));

  const p1 = [305, 175];
  const p2 = [575, 175];
  const p3 = [505, 305];
  const p4 = [375, 305];

  addWire(g, [p1, p2], "#84b4df");
  addWire(g, [[610, 225], p3], "#d3b25a");
  addWire(g, [p4, [270, 225]], "#84b684");

  drawPillTag(g, 440, 148, t("Kiểm chứng trực quan", "Visual feedback"), PALETTE.sky.top);
  drawPillTag(g, 645, 290, t("Ghi chú bài toán thật", "Real-world note"), PALETTE.amber.top);
  drawPillTag(g, 235, 290, t("Khóa kiến thức", "Lock insight"), PALETTE.sage.top);

  addPacketTrack([p1, p2], "#84b4df", 1, 0.36, "predict");
  addPacketTrack([[610, 225], p3], "#f5d88b", 1, 0.36, "assert");
  addPacketTrack([p4, [270, 225]], "#84be88", 1, 0.36, "reflect");
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

  addWire(g, [[255, 200], [390, 151]], "#d38383");
  addWire(g, [[255, 225], [390, 283]], "#84b684");

  addPacketTrack([[255, 200], [390, 151]], "#e57373", 2, 0.38, "overflow");
  addPacketTrack([[255, 225], [390, 283]], "#84be88", 2, 0.36, "uint16_t");
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
  drawFlatCard(g, 70, 155, 210, 115, PALETTE.rose.top, t("Nút bấm cơ (Rung)", "Bouncy Switch"), "1 → 0 → 1 → 0 → 0 → 0");
  addWire(g, [
    [95, 232], [115, 232], [115, 252], [135, 252], [135, 232],
    [155, 232], [155, 252], [250, 252]
  ], "#5a1818");

  // Middle filter vs delay warning
  drawPillTag(g, 440, 116, t("KHÔNG dùng delay_ms(50) chặn CPU!", "AVOID blocking delay_ms(50)!"), PALETTE.rose.top, "#5a1818");
  drawIsoBlock(g, 440, 165, 130, 82, 26, "amber", t("Lấy mẫu mỗi 5 ms", "5 ms Sampler"), t("Đếm 3 lần giống nhau", "3 equal samples"));

  // Clean output
  drawFlatCard(g, 630, 165, 185, 95, PALETTE.sage.top, t("1 Sự kiện nhấn ✓", "1 Clean Press ✓"), t("CPU vẫn rảnh đọc cảm biến", "CPU stays responsive"));

  addWire(g, [[280, 212], [375, 212]], "#d38383");
  addWire(g, [[505, 212], [630, 212]], "#84b684");

  addPacketTrack([[280, 212], [375, 212]], "#e57373", 2, 0.42, "0/1 dội");
  addPacketTrack([[505, 212], [630, 212]], "#84be88", 1, 0.32, "PRESS");
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
    t("STM32 (Little-Endian) gửi thô byte trong RAM sang giao thức Big-Endian", "STM32 (little-endian) dumps raw RAM bytes into a big-endian protocol")
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

  addWire(g, [[245, 200], [395, 150]], "#d38383");
  addWire(g, [[245, 228], [395, 282]], "#84b684");

  addPacketTrack([[245, 200], [395, 150]], "#e57373", 2, 0.36, "E8 → 03");
  addPacketTrack([[245, 228], [395, 282]], "#84be88", 2, 0.36, "03 → E8");
}

function sceneIntroRoadmap(g, _scene, { addPacketTrack, t }) {
  const stages = [
    { x: 115, y: 245, tone: "sky", title: "01. C Nhúng + CSV", sub: t("Tuần 1–4 · Bài 00–07", "Weeks 1–4 · L00–07") },
    { x: 325, y: 195, tone: "amber", title: t("02. Điện tử cơ bản", "02. Electronics"), sub: t("Ohm, Pull-up, ADC, PWM", "Ohm, Pull-up, ADC, PWM") },
    { x: 545, y: 145, tone: "lavender", title: "03. STM32 Cortex-M", sub: t("Tuần 5–12 · GPIO/IRQ/UART", "Weeks 5–12 · Peripherals") },
    { x: 755, y: 95, tone: "sage", title: "04. RTOS & LoRa", sub: t("Tuần 13–24+ · Dự án thật", "Weeks 13–24+ · Real Capstones") }
  ];

  stages.forEach((st, i) => {
    drawIsoBlock(g, st.x, st.y, 125, 78, 24, st.tone, st.title, st.sub);
    if (i > 0) {
      const prev = stages[i - 1];
      const pA = [prev.x + 60, prev.y + 42];
      const pB = [st.x - 55, st.y + 42];
      addWire(g, [pA, pB], "#84b684");
      addPacketTrack([pA, pB], "#84be88", 1, 0.35);
    }
  });

  drawPillTag(g, 440, 355, t("Mỗi chặng đều có bài tập PC + dataset CSV + câu hỏi mở", "Every stage pairs C labs + CSV datasets + open questions"), PALETTE.sage.top);
}

export function registerOnboardingScenes(registerScene) {
  registerScene("intro_loop", sceneIntroLoop);
  registerScene("intro_case_bms", sceneIntroCaseBms);
  registerScene("intro_case_debounce", sceneIntroCaseDebounce);
  registerScene("intro_case_uart", sceneIntroCaseUart);
  registerScene("intro_roadmap", sceneIntroRoadmap);
}
