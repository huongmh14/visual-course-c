import {
  PALETTE,
  svgEl,
  drawPillTag,
  drawFlatCard,
  addWire
} from "../svg-primitives.js";

function drawLabel(parent, x, y, text, opts = {}) {
  const {
    size = 10.5,
    weight = 500,
    anchor = "middle",
    fill = "var(--ink-muted)"
  } = opts;
  parent.appendChild(
    svgEl(
      "text",
      {
        x,
        y,
        "text-anchor": anchor,
        "font-size": String(size),
        "font-weight": String(weight),
        fill
      },
      text
    )
  );
}

function drawDiodeUp(parent, x, yTip, yBase, fill = PALETTE.rose.top) {
  const w = 10;
  parent.appendChild(
    svgEl("polygon", {
      points: `${x},${yTip} ${x - w},${yBase} ${x + w},${yBase}`,
      fill,
      stroke: "#1c1b18",
      "stroke-width": "1.5"
    })
  );
  parent.appendChild(
    svgEl("line", {
      x1: x - w,
      y1: yTip,
      x2: x + w,
      y2: yTip,
      stroke: "#1c1b18",
      "stroke-width": "2.2"
    })
  );
}

function scenePowerLdoVsBuck(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "Nguồn LDO vs Buck Converter & Rò dòng ESD khi trộn 5V / 3.3V",
      "LDO vs Buck Efficiency & 5V→3.3V ESD Clamp Fault Current"
    ),
    t(
      "LDO đốt điện áp dư thành nhiệt: P_loss = (Vin - Vout) × I_load",
      "LDO burns excess voltage as heat: P_loss = (Vin - Vout) × I_load"
    )
  );

  // Top Rail: 12V -> LDO (AMS1117) -> 3.3V @ 300mA
  drawPillTag(g, 64, 134, "12V (3.6W)", PALETTE.amber.top, "#1c1b18");
  drawFlatCard(
    g,
    150,
    82,
    205,
    108,
    PALETTE.rose.top,
    "LDO (AMS1117-3.3)",
    t(
      "P_heat = (12 - 3.3) × 0.3A\n= 2,610 mW (NÓNG! 27.5%)\nTỏa nhiệt nặng, dễ ngắt nhiệt",
      "P_heat = (12 - 3.3) × 0.3A\n= 2,610 mW (HOT! 27.5%)\nSevere heat, thermal cutoff risk"
    )
  );

  drawFlatCard(
    g,
    428,
    92,
    134,
    88,
    PALETTE.paper.top,
    "3.3V @ 300 mA",
    t("0.99W Load\nChỉ hợp <50 mA", "0.99W Load\nOK only <50 mA")
  );

  addWire(g, [[108, 134], [150, 134]], "#d38383", false, { markerEnd: true });
  addWire(g, [[355, 136], [428, 136]], "#d38383", false, { markerEnd: true });
  addPacketTrack([[355, 136], [428, 136]], "#e57373", 1, 0.36, "2.6W heat");

  // Bottom Rail: 12V -> Buck (90%) -> 3.3V @ 300mA
  drawPillTag(g, 64, 294, "12V (1.1W)", PALETTE.amber.top, "#1c1b18");
  drawFlatCard(
    g,
    150,
    240,
    205,
    108,
    PALETTE.sage.top,
    t("Mạch hạ áp Buck (90%)", "Buck Converter (90%)"),
    t(
      "Đóng cắt + Cuộn cảm\nTổn hao 110 mW (MÁT ✓)\nMát & tiết kiệm pin hơn hẳn",
      "Switching + Inductor\nP_loss = 110 mW (COOL ✓)\nCool & battery-friendly"
    )
  );

  drawFlatCard(
    g,
    428,
    250,
    134,
    88,
    PALETTE.sky.top,
    "3.3V @ 300 mA",
    t("0.99W Load\nTiết kiệm 2.5W!", "0.99W Load\nSaves 2.5W!")
  );

  addWire(g, [[108, 294], [150, 294]], "#84b684", false, { markerEnd: true });
  addWire(g, [[355, 294], [428, 294]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[355, 294], [428, 294]], "#84be88", 1, 0.38, "90% eff");

  drawPillTag(
    g,
    298,
    388,
    t("LDO lãng phí nhiệt gấp ~24× Buck ở dòng 300 mA", "LDO wastes ~24× more heat than Buck at 300 mA"),
    PALETTE.paper.top,
    "#1c1b18"
  );

  // Right Warning Block: 5V TX -> 3.3V Non-FT GPIO ESD fault
  drawFlatCard(
    g,
    584,
    76,
    268,
    330,
    PALETTE.rose.top,
    t("NGUY HIỂM: 5V TX → GPIO 3.3V", "DANGER: 5V TX → Non-FT 3.3V Pin"),
    t("Diode ESD ghim dòng ngược lên VDD!", "ESD clamp injects current into VDD!"),
    { valign: "top" }
  );

  // Inner schematic box
  g.appendChild(
    svgEl("rect", {
      x: 598,
      y: 128,
      width: 240,
      height: 152,
      rx: 6,
      fill: "var(--bg-elevated)",
      stroke: "var(--border)",
      "stroke-width": "1.2"
    })
  );

  // 3.3V VDD rail inside schematic
  addWire(g, [[700, 148], [826, 148]], "#d38383");
  drawLabel(g, 646, 152, "VDD = 3.3V", { size: 10.5, weight: 700, fill: "var(--ink)" });

  // 5V TX source block
  drawFlatCard(g, 608, 186, 74, 44, PALETTE.amber.top, "5V TX", "5.0V out");
  addWire(g, [[682, 208], [744, 208]], "#d38383");
  addWire(g, [[744, 148], [744, 266]], "var(--border)");
  addWire(g, [[724, 266], [764, 266]], "var(--border)");
  drawLabel(g, 744, 276, "GND", { size: 9 });

  drawDiodeUp(g, 744, 166, 184, PALETTE.rose.top);
  drawDiodeUp(g, 744, 224, 242, PALETTE.paper.top);

  g.appendChild(
    svgEl("circle", {
      cx: 744,
      cy: 208,
      r: 4.5,
      fill: "#e57373",
      stroke: "#1c1b18",
      "stroke-width": "1.3"
    })
  );
  drawLabel(g, 712, 224, t("Chân 3.3V", "3.3V pin"), { size: 9.5, weight: 700, fill: "var(--ink)" });
  drawLabel(g, 796, 174, "ESD Diode", { size: 9.5, weight: 600, fill: "var(--ink)" });
  drawLabel(g, 796, 190, "Vf ≈ 0.7V", { size: 9.5 });

  addPacketTrack(
    [[682, 208], [744, 208], [744, 148], [824, 148]],
    "#e57373",
    1,
    0.36,
    "I_fault"
  );

  drawFlatCard(
    g,
    598,
    292,
    240,
    98,
    "var(--bg-elevated)",
    t("Kéo VDD vọt lên ~4.3V!", "Pulls 3.3V Rail up to ~4.3V!"),
    t(
      "Áp chân > 3.3V + 0.7V = 4.0V\nTreo / cháy chip & diode bảo vệ\nSửa: cầu chia 1k/2k hoặc chân 5V",
      "Pin > 3.3V + 0.7V = 4.0V\nLatches / burns chip & ESD\nFix: 1k/2k divider or 5V pin"
    )
  );
}

function sceneMosfetFlybackDecap(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "Mạch MOSFET đóng cắt cuộn dây + Diode bảo vệ & Tụ lọc 100 nF",
      "N-MOSFET Inductive Driver, Flyback Diode & 100 nF Filter Cap"
    ),
    t(
      "Đặt tụ 100 nF sát chân nguồn; diode xả dòng ngược bảo vệ MOSFET khi ngắt",
      "Place 100 nF right by power pins; flyback diode protects MOSFET on turn-off"
    )
  );

  // 3.3V rail + 100nF Decoupling cap
  drawPillTag(g, 145, 92, "3.3V VDD", PALETTE.sky.top, "#1c1b18");
  addWire(g, [[96, 92], [200, 92]], "#84b4df");
  addWire(g, [[96, 92], [96, 200]], "#84b4df");
  addWire(g, [[82, 200], [110, 200]], "var(--ink)");
  addWire(g, [[82, 212], [110, 212]], "var(--ink)");
  addWire(g, [[96, 212], [96, 346]], "var(--border)");

  drawLabel(g, 74, 198, "100 nF", { size: 10.5, weight: 700, anchor: "end", fill: "var(--ink)" });
  drawLabel(g, 74, 214, "X7R", { size: 10, anchor: "end" });
  drawLabel(g, 74, 230, t("sát chân", "by pin"), { size: 9.5, anchor: "end" });

  // MCU Block
  addWire(g, [[200, 92], [200, 134]], "#84b4df");
  addWire(g, [[200, 304], [200, 346]], "var(--border)");
  drawFlatCard(g, 136, 134, 128, 170, PALETTE.sky.top, "MCU (3.3V)", "VDD ← 100 nF", { valign: "top" });
  drawLabel(g, 200, 204, "GPIO Push-Pull", { fill: "#1c1b18", weight: 600 });
  drawLabel(g, 200, 228, "HIGH = 3.3V", { fill: "#3f3c33" });
  drawLabel(g, 200, 246, "LOW  = 0V", { fill: "#3f3c33" });
  drawLabel(g, 200, 286, "VSS (GND)", { fill: "#1c1b18", weight: 600 });

  // Gate network: 100 ohm series + 10k pull-down
  addWire(g, [[264, 240], [424, 240]], "#d3b25a", false, { markerEnd: true });
  g.appendChild(
    svgEl("rect", {
      x: 296,
      y: 231,
      width: 44,
      height: 18,
      rx: 3,
      fill: PALETTE.amber.top,
      stroke: "#1c1b18",
      "stroke-width": "1.3"
    })
  );
  drawLabel(g, 318, 266, "100 Ω", { size: 10, weight: 700, fill: "var(--ink)" });

  addWire(g, [[374, 240], [374, 346]], "var(--border)");
  g.appendChild(
    svgEl("rect", {
      x: 365,
      y: 270,
      width: 18,
      height: 44,
      rx: 3,
      fill: PALETTE.paper.top,
      stroke: "#1c1b18",
      "stroke-width": "1.3"
    })
  );
  drawLabel(g, 358, 290, "10 kΩ", { size: 10, weight: 700, anchor: "end", fill: "var(--ink)" });
  drawLabel(g, 358, 305, t("kéo GND", "pull-down"), { size: 9.5, anchor: "end" });

  // N-MOSFET
  drawFlatCard(
    g,
    424,
    212,
    148,
    96,
    PALETTE.amber.top,
    "N-MOSFET",
    t(
      "AO3400 / IRLZ44N\nNgưỡng mở ≈ 1–2V\nTrở dẫn < 50 mΩ",
      "AO3400 / IRLZ44N\nTurn-on ≈ 1–2V\nOn-resist < 50 mΩ"
    )
  );

  // Source to GND
  addWire(g, [[498, 308], [498, 346]], "var(--border)");
  addWire(g, [[96, 346], [536, 346]], "var(--border)");
  drawPillTag(g, 560, 346, "GND (0V)", PALETTE.paper.top, "#1c1b18");

  // +12V rail + Inductive Coil + Drain + Flyback diode loop
  drawPillTag(g, 418, 76, "+12V DC", PALETTE.rose.top, "#1c1b18");
  addWire(g, [[456, 84], [660, 84]], "#d38383");
  addWire(g, [[498, 84], [498, 98]], "#d38383");

  drawFlatCard(
    g,
    436,
    98,
    124,
    72,
    PALETTE.lavender.top,
    t("Cuộn Relay", "Inductive Load"),
    t("Cuộn hút 12V\nTích năng lượng từ", "12V Relay Coil\nStores magnetic energy")
  );

  addWire(g, [[498, 170], [498, 212]], "#84b684");
  addWire(g, [[498, 192], [660, 192], [660, 84]], "#84b684");
  drawDiodeUp(g, 660, 126, 150, PALETTE.sage.top);

  drawLabel(g, 682, 130, t("Diode xả ngược", "Flyback Diode"), {
    size: 11,
    weight: 700,
    anchor: "start",
    fill: "var(--ink)"
  });
  drawLabel(g, 682, 146, "1N5819 / 1N4148", { size: 10, anchor: "start" });
  drawLabel(
    g,
    682,
    162,
    t("(mắc ngược tải)", "(reverse across coil)"),
    { size: 9.5, anchor: "start" }
  );

  drawFlatCard(
    g,
    636,
    224,
    214,
    102,
    PALETTE.sage.top,
    t("Vòng xả dòng cảm ứng", "Safe Kickback Loop"),
    t(
      "Khi MOSFET ngắt:\ndòng cuộn dây xả qua Diode\nGiữ áp ở mức ≤ 12.7V ✓",
      "When MOSFET turns OFF:\ncoil current loops via Diode\nClamps voltage ≤ 12.7V ✓"
    )
  );

  // 2 animated tracks: gate drive & flyback loop
  addPacketTrack([[264, 240], [424, 240]], "#f5d88b", 1, 0.36, "Gate 3.3V");
  addPacketTrack(
    [[498, 170], [498, 192], [660, 192], [660, 84], [498, 84], [498, 98]],
    "#84be88",
    1,
    0.34,
    "flyback"
  );

  drawPillTag(
    g,
    440,
    396,
    t(
      "Thiếu Diode → gai áp trăm Volt làm chết MOSFET! (Thử bỏ diode chỉ làm trên mô phỏng Falstad)",
      "No Diode → 100V+ spike kills MOSFET! (Only test removing diode in Falstad simulator)"
    ),
    PALETTE.rose.top,
    "#1c1b18"
  );
}

function sceneOpampRcFilter(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "Mạch lọc RC + Tầng đệm Op-Amp làm phẳng xung PWM vào chân đọc áp",
      "RC Low-Pass Filter + Op-Amp Buffer Smoothing PWM for 12-bit ADC"
    ),
    t(
      "Biến xung vuông thành áp DC phẳng và giữ ổn định áp khi chip lấy mẫu",
      "Smooths PWM into steady DC and prevents voltage droop when the ADC samples"
    )
  );

  // Stage 1: PWM 3.3V
  drawFlatCard(g, 26, 96, 160, 196, PALETTE.sky.top, "PWM 3.3V", "Duty D = 50% (20 kHz)", { valign: "top" });
  g.appendChild(
    svgEl("path", {
      d: "M42,200 L42,162 L68,162 L68,200 L94,200 L94,162 L120,162 L120,200 L146,200 L146,162 L170,162",
      fill: "none",
      stroke: "#1c1b18",
      "stroke-width": "2"
    })
  );
  drawLabel(g, 106, 232, "V_avg = 1.65V", { fill: "#1c1b18", weight: 700 });
  drawLabel(g, 106, 254, t("Nhiều hài cao tần", "High-freq ripple"), { fill: "#3f3c33" });

  // Stage 2: RC Low-Pass Filter
  drawFlatCard(
    g,
    232,
    96,
    178,
    196,
    PALETTE.amber.top,
    t("Lọc thông thấp RC", "RC Low-Pass Filter"),
    "τ = R × C",
    { valign: "top" }
  );
  addWire(g, [[246, 166], [264, 166]], "#1c1b18");
  g.appendChild(
    svgEl("rect", {
      x: 264,
      y: 158,
      width: 44,
      height: 16,
      rx: 3,
      fill: PALETTE.paper.top,
      stroke: "#1c1b18",
      "stroke-width": "1.3"
    })
  );
  drawLabel(g, 286, 152, "R = 10 kΩ", { size: 9.5, weight: 700, fill: "#1c1b18" });
  addWire(g, [[308, 166], [394, 166]], "#1c1b18");
  addWire(g, [[348, 166], [348, 190]], "#1c1b18");
  addWire(g, [[336, 190], [360, 190]], "#1c1b18");
  addWire(g, [[336, 198], [360, 198]], "#1c1b18");
  addWire(g, [[348, 198], [348, 214]], "#1c1b18");
  drawLabel(g, 366, 200, "100nF", { size: 9.5, weight: 700, anchor: "start", fill: "#1c1b18" });

  g.appendChild(
    svgEl("path", {
      d: "M256,240 Q274,234 292,240 T328,240 T364,240 T388,240",
      fill: "none",
      stroke: "#1c1b18",
      "stroke-width": "1.8"
    })
  );
  drawLabel(g, 321, 268, t("Đầu ra yếu (10 kΩ)!", "High output R (10 kΩ)!"), {
    fill: "#1c1b18",
    weight: 600
  });

  // Stage 3: Op-Amp Unity Buffer
  drawFlatCard(
    g,
    456,
    96,
    178,
    196,
    PALETTE.sage.top,
    "Op-Amp Buffer",
    "V_out = V_in (Gain = 1)",
    { valign: "top" }
  );
  g.appendChild(
    svgEl("polygon", {
      points: "510,152 510,208 574,180",
      fill: PALETTE.paper.top,
      stroke: "#1c1b18",
      "stroke-width": "1.6"
    })
  );
  drawLabel(g, 520, 173, "+", { size: 11, weight: 700, fill: "#1c1b18" });
  drawLabel(g, 520, 194, "−", { size: 11, weight: 700, fill: "#1c1b18" });
  addWire(g, [[490, 169], [510, 169]], "#1c1b18");
  addWire(g, [[574, 180], [598, 180]], "#1c1b18");
  addWire(g, [[586, 180], [586, 222], [498, 222], [498, 190], [510, 190]], "#1c1b18");
  drawLabel(g, 545, 248, t("Không rút dòng mạch RC", "Draws zero RC current"), {
    size: 9.8,
    fill: "#1c1b18",
    weight: 600
  });
  drawLabel(g, 545, 268, t("Đầu ra khỏe (nạp tụ nhanh)", "Strong drive (fast sample)"), {
    size: 9.8,
    fill: "#3f3c33"
  });

  // Stage 4: ADC 12-bit S&H Cap
  drawFlatCard(
    g,
    680,
    96,
    174,
    196,
    PALETTE.lavender.top,
    "ADC 12-bit S&H",
    "0 .. 4095 counts",
    { valign: "top" }
  );
  addWire(g, [[706, 172], [732, 172], [756, 160]], "#1c1b18");
  addWire(g, [[758, 172], [784, 172], [784, 192]], "#1c1b18");
  addWire(g, [[770, 192], [798, 192]], "#1c1b18");
  addWire(g, [[770, 200], [798, 200]], "#1c1b18");
  addWire(g, [[784, 200], [784, 218]], "#1c1b18");
  drawLabel(g, 804, 198, "C_SH", { size: 9.5, weight: 700, anchor: "start", fill: "#1c1b18" });
  drawLabel(g, 767, 246, "1.65V → 2048", { fill: "#1c1b18", weight: 700 });
  drawLabel(g, 767, 268, t("Nạp tụ S&H nhanh ✓", "Fast S&H settle ✓"), { fill: "#3f3c33" });

  // Inter-stage wires & packets
  addWire(g, [[186, 174], [232, 174]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[410, 174], [456, 174]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[634, 174], [680, 174]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[186, 174], [232, 174]], "#84b4df", 1, 0.36, "PWM");
  addPacketTrack([[410, 174], [456, 174]], "#f5d88b", 1, 0.36, "V_filt");
  addPacketTrack([[634, 174], [680, 174]], "#84be88", 1, 0.36, "low Z");

  // Bottom f_c & EMA formula cards
  drawFlatCard(
    g,
    26,
    316,
    402,
    88,
    "var(--bg-elevated)",
    t("Tần số cắt của mạch lọc RC", "RC Filter Cutoff Frequency"),
    t(
      "f_c = 1 / (2π · R · C) = 159 Hz (≪ 20 kHz PWM)\nChọn f_c ≤ f_PWM / 100 để gợn sóng < 1%",
      "f_c = 1 / (2π · R · C) = 159 Hz (≪ 20 kHz PWM)\nPick f_c ≤ f_PWM / 100 for <1% ripple"
    )
  );

  drawFlatCard(
    g,
    452,
    316,
    402,
    88,
    "var(--bg-elevated)",
    t("Bộ lọc làm mượt bằng phần mềm (EMA)", "Software Smoothing Filter (EMA)"),
    "y[n] = y[n-1] + α · (x[n] - y[n-1])\nα = Δt / (τ + Δt)  (Q-format >> shift, no float)"
  );
}

function sceneSerialBusesWave(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    10,
    800,
    42,
    "var(--bg-elevated)",
    t(
      "So sánh lớp vật lý 3 chuẩn: I2C Open-Drain vs SPI Push-Pull vs CAN/RS-485",
      "Physical Layer Comparison: I2C Open-Drain vs SPI Push-Pull vs CAN/RS-485"
    ),
    t(
      "Tốc độ, số dây, điện trở kéo lên / kết cuối 120 Ω và khả năng chống nhiễu",
      "Speed, wiring, pull-ups vs push-pull drivers, 120 Ω termination & noise immunity"
    )
  );

  // Band 1: I2C (Open-Drain + 4.7k pull-ups)
  drawFlatCard(g, 30, 64, 820, 112, "var(--bg-elevated)", "", "");
  drawFlatCard(
    g,
    44,
    76,
    178,
    88,
    PALETTE.amber.top,
    "1. I2C (Open-Drain)",
    t("100–400 kHz (2 dây)\nChỉ kéo xuống 0V, cần trở kéo", "100–400 kHz (2 wires)\nPulls LOW only + pull-up")
  );

  drawFlatCard(g, 256, 98, 96, 62, PALETTE.paper.top, "Master", "Open-Drain");
  drawFlatCard(g, 676, 98, 122, 62, PALETTE.sky.top, "Slave 0x68", "ACK bit = 0");

  addWire(g, [[352, 120], [676, 120]], "#d3b25a");
  addWire(g, [[352, 152], [676, 152]], "#84b4df");
  drawLabel(g, 378, 114, "SCL", { size: 9.5, weight: 700, fill: "var(--ink)" });
  drawLabel(g, 378, 146, "SDA", { size: 9.5, weight: 700, fill: "var(--ink)" });

  // 3.3V pull-ups at x=425 (to SCL) & x=465 (to SDA)
  drawPillTag(g, 445, 78, "3.3V + 4.7 kΩ", PALETTE.paper.top, "#1c1b18");
  addWire(g, [[425, 89], [425, 120]], "#d3b25a");
  addWire(g, [[465, 89], [465, 152]], "#84b4df");
  addPacketTrack([[490, 152], [676, 152]], "#84b4df", 1, 0.34, "0x68+ACK");

  // Band 2: SPI (4-wire Push-Pull)
  drawFlatCard(g, 30, 188, 820, 110, "var(--bg-elevated)", "", "");
  drawFlatCard(
    g,
    44,
    200,
    178,
    86,
    PALETTE.sky.top,
    "2. SPI (Push-Pull)",
    t("1–50 MHz (4 dây)\nGửi-nhận 2 chiều, 0 cần trở", "1–50 MHz (4 wires)\nFull-duplex, no pull-up")
  );

  drawFlatCard(g, 256, 202, 96, 82, PALETTE.paper.top, "SPI Master", "SCK / CS");
  drawFlatCard(g, 676, 202, 122, 82, PALETTE.sage.top, "SPI Slave", "Full-Duplex");

  const spiLines = [
    [212, "#84b4df", "MOSI"],
    [234, "#84be88", "MISO"],
    [256, "#d3b25a", "SCK (MHz)"],
    [278, "#ad9cd8", "CS# (active 0)"]
  ];
  spiLines.forEach(([y, color, lbl]) => {
    addWire(g, [[352, y], [676, y]], color);
    drawLabel(g, 405, y - 5, lbl, { size: 9, weight: 700, fill: "var(--ink)" });
  });
  addPacketTrack([[465, 212], [676, 212]], "#84b4df", 1, 0.46, "TX");
  addPacketTrack([[676, 234], [465, 234]], "#84be88", 1, 0.46, "RX");

  // Band 3: CAN / RS-485 Differential Pair
  drawFlatCard(g, 30, 310, 820, 110, "var(--bg-elevated)", "", "");
  drawFlatCard(
    g,
    44,
    322,
    178,
    86,
    PALETTE.sage.top,
    "3. CAN / RS-485",
    t("Cặp dây xoắn (100m+)\nChống nhiễu rất tốt", "Twisted pair (100m+)\nHigh noise immunity")
  );

  drawFlatCard(g, 256, 332, 66, 62, PALETTE.amber.top, "120 Ω", "Term");
  drawFlatCard(g, 766, 332, 66, 62, PALETTE.amber.top, "120 Ω", "Term");

  addWire(g, [[322, 350], [766, 350]], "#d38383");
  addWire(g, [[322, 378], [766, 378]], "#84b4df");
  drawLabel(g, 354, 344, "CAN_H", { size: 9.5, weight: 700, fill: "var(--ink)" });
  drawLabel(g, 354, 372, "CAN_L", { size: 9.5, weight: 700, fill: "var(--ink)" });

  // Twisted pair X crossings
  [505, 595].forEach((tx) => {
    addWire(g, [[tx - 8, 354], [tx + 8, 374]], "var(--border)");
    addWire(g, [[tx - 8, 374], [tx + 8, 354]], "var(--border)");
  });

  drawPillTag(g, 405, 400, "Node 1 (TX)", PALETTE.paper.top, "#1c1b18");
  drawPillTag(g, 695, 400, "Node 2 (RX)", PALETTE.paper.top, "#1c1b18");

  addPacketTrack([[405, 350], [695, 350]], "#e57373", 1, 0.36, "V+");
  addPacketTrack([[405, 378], [695, 378]], "#84b4df", 1, 0.36, "V−");
}

function sceneDatasheetPinBudget(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    12,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "Đọc thông số STM32: Chân chịu 5V vs 3.3V, Tổng dòng chip & Kiểm tra DMM",
      "STM32 Datasheet Limits: 5V vs 3.3V Pins, Total Current & DMM Check"
    ),
    t(
      "Đo thông mạch bằng đồng hồ DMM trước khi cấp điện · Không đo dòng trực tiếp qua pin!",
      "Check DMM continuity before powering on · Never measure current straight across a battery!"
    )
  );

  // Left: STM32 LQFP-48 Package Diagram
  drawFlatCard(
    g,
    32,
    74,
    330,
    324,
    "var(--bg-elevated)",
    t("Sơ đồ chân STM32F103 (LQFP-48)", "STM32F103 Package (LQFP-48)"),
    "",
    { valign: "top" }
  );

  // IC dark silicon body
  g.appendChild(
    svgEl("rect", {
      x: 152,
      y: 144,
      width: 118,
      height: 140,
      rx: 8,
      fill: "#2d2b26",
      stroke: "var(--border)",
      "stroke-width": "1.6"
    })
  );
  g.appendChild(
    svgEl("circle", {
      cx: 166,
      cy: 158,
      r: 4.5,
      fill: "#faf7ef"
    })
  );
  drawLabel(g, 211, 206, "STM32F103", { size: 12, weight: 700, fill: "#faf7ef" });
  drawLabel(g, 211, 224, "VDD = 3.3V", { size: 10, fill: "#e6decb" });
  drawLabel(g, 211, 240, "Boot0 = 0", { size: 10, fill: "#e6decb" });

  // Left pins: FT vs TT
  const leftPins = [
    [164, "FT (5V OK)", PALETTE.sage.top, "#84b684"],
    [200, "TT (3.3V!)", PALETTE.rose.top, "#d38383"],
    [236, "FT (I2C)", PALETTE.sage.top, "#84b684"],
    [272, "TTa ≤3.6V", PALETTE.rose.top, "#d38383"]
  ];
  leftPins.forEach(([py, label, bg, wireCol]) => {
    addWire(g, [[126, py], [152, py]], wireCol);
    drawPillTag(g, 82, py, label, bg, "#1c1b18");
  });

  // Right pins: SWDIO, SWCLK, GPIO 20mA
  addWire(g, [[270, 168], [294, 168]], "#84b4df");
  drawLabel(g, 298, 172, "SWDIO", { size: 9.5, weight: 700, anchor: "start", fill: "var(--ink)" });

  addWire(g, [[270, 204], [294, 204]], "#84b4df");
  drawLabel(g, 298, 208, "SWCLK", { size: 9.5, weight: 700, anchor: "start", fill: "var(--ink)" });

  addWire(g, [[270, 256], [294, 256]], "#d3b25a");
  drawLabel(g, 298, 260, "≤ 20 mA", { size: 9.5, weight: 700, anchor: "start", fill: "var(--ink)" });

  drawLabel(
    g,
    197,
    318,
    t("FT = Chân nhận được áp 5V (an toàn)", "FT = Five-volt Tolerant (5V input safe)"),
    { size: 10, weight: 600, fill: "var(--ink)" }
  );
  drawLabel(
    g,
    197,
    338,
    t("TT = Chỉ 3.3V (cấm quá 3.6V!)", "TT = 3.3V-only (NEVER > 3.6V!)"),
    { size: 10 }
  );
  drawLabel(
    g,
    197,
    358,
    t("Không nạp qua UART quên kéo Boot0!", "Pull Boot0 = 0 to boot from Flash"),
    { size: 10 }
  );

  // Top-Right: Single-pin 20 mA vs Package Sum <= 120 mA Meter
  drawFlatCard(
    g,
    422,
    74,
    428,
    120,
    "var(--bg-elevated)",
    t("Giới hạn dòng: 1 chân vs Tổng cả chip", "Current Budget: Single-Pin vs Package Sum"),
    "I_pin ≤ 20 mA   |   ΣI_VDD / ΣI_VSS ≤ 120 mA (Abs Max)",
    { valign: "top" }
  );

  // Meter 1: single pin OK
  drawLabel(g, 440, 140, "1 Pin (LED): 12 / 20 mA ✓", {
    size: 10,
    weight: 600,
    anchor: "start",
    fill: "var(--ink)"
  });
  g.appendChild(
    svgEl("rect", {
      x: 626,
      y: 129,
      width: 204,
      height: 14,
      rx: 7,
      fill: PALETTE.paper.top,
      stroke: "var(--border)",
      "stroke-width": "1.2"
    })
  );
  g.appendChild(
    svgEl("rect", {
      x: 626,
      y: 129,
      width: 122,
      height: 14,
      rx: 7,
      fill: "#84b684"
    })
  );

  // Meter 2: package sum overflow
  drawLabel(g, 440, 172, "8 LED×18 mA = 144 > 120 mA!", {
    size: 10,
    weight: 700,
    anchor: "start",
    fill: "var(--ink)"
  });
  g.appendChild(
    svgEl("rect", {
      x: 626,
      y: 161,
      width: 204,
      height: 14,
      rx: 7,
      fill: PALETTE.paper.top,
      stroke: "var(--border)",
      "stroke-width": "1.2"
    })
  );
  g.appendChild(
    svgEl("rect", {
      x: 626,
      y: 161,
      width: 204,
      height: 14,
      rx: 7,
      fill: "#e57373"
    })
  );

  // Middle-Right: SWD 4-Pin Header
  drawFlatCard(
    g,
    422,
    206,
    428,
    82,
    PALETTE.sky.top,
    t("Cổng Debug SWD 4 chân (ST-Link)", "4-Pin SWD Debug Header (ST-Link)"),
    t("Không nối VCC nếu board đang có nguồn ngoài!", "Skip VCC if board is externally powered!"),
    { valign: "top" }
  );
  drawPillTag(g, 476, 269, "VCC", PALETTE.paper.top, "#1c1b18");
  drawPillTag(g, 566, 269, "SWDIO", PALETTE.amber.top, "#1c1b18");
  drawPillTag(g, 666, 269, "SWCLK", PALETTE.amber.top, "#1c1b18");
  drawPillTag(g, 776, 269, "GND (0V)", PALETTE.sage.top, "#1c1b18");

  // Bottom-Right: 6-Step DMM Smoke Test Badge
  drawFlatCard(
    g,
    422,
    298,
    428,
    102,
    PALETTE.amber.top,
    t("Kiểm tra 6 bước bằng đồng hồ DMM trước khi bật điện", "6-Step Pre-Power DMM Safety Check"),
    t(
      "1. Soi mạch → 2. Đo thông mạch VDD–GND (≠ 0Ω)\n3. Kiểm cực tụ/diode → 4. Cấp nguồn giới hạn dòng\n5. Đo áp 3.3V (±5%) → Không đo dòng trực tiếp qua pin",
      "1. Visual check → 2. Continuity VDD–GND (no short)\n3. Cap/diode polarity → 4. Current-limited power\n5. Verify 3.3V (±5%) → Never probe current across battery"
    )
  );

  // Gutter connecting tracks
  addWire(g, [[362, 136], [422, 136]], "#d38383", false, { markerEnd: true });
  addWire(g, [[362, 247], [422, 247]], "#84b4df", false, { markerEnd: true });
  addPacketTrack([[362, 136], [422, 136]], "#e57373", 1, 0.34, "ΣI_VDD");
  addPacketTrack([[362, 247], [422, 247]], "#84b4df", 1, 0.36, "SWD");
}

export function registerElectronicsScenes(register) {
  register("power_ldo_vs_buck", scenePowerLdoVsBuck);
  register("mosfet_flyback_decap", sceneMosfetFlybackDecap);
  register("opamp_rc_filter", sceneOpampRcFilter);
  register("serial_buses_wave", sceneSerialBusesWave);
  register("datasheet_pin_budget", sceneDatasheetPinBudget);
}
