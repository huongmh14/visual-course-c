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
  drawPillTag(g, 75, 134, "12V (3.6W)", PALETTE.amber.top, "#1c1b18");
  drawFlatCard(
    g,
    150,
    82,
    205,
    108,
    PALETTE.rose.top,
    "LDO (AMS1117-3.3)",
    "P_heat = (12 - 3.3) × 0.3A"
  );
  drawLabel(g, 252, 142, "= 2,610 mW  (HOT! η = 27.5%)", {
    fill: "#1c1b18",
    weight: 700
  });
  drawLabel(
    g,
    252,
    164,
    t("Tỏa nhiệt nặng, dễ ngắt nhiệt", "Severe heat, thermal cutoff risk"),
    { fill: "#3f3c33" }
  );

  drawFlatCard(
    g,
    428,
    92,
    134,
    88,
    PALETTE.paper.top,
    "3.3V @ 300 mA",
    "0.99W Load"
  );
  drawLabel(g, 495, 156, t("Chỉ hợp <50 mA", "OK only <50 mA"), { fill: "#3f3c33" });

  addWire(g, [[118, 134], [150, 134]], "#d38383");
  addWire(g, [[355, 136], [428, 136]], "#d38383");
  addPacketTrack([[355, 136], [428, 136]], "#e57373", 1, 0.36, "2.6W heat");

  // Bottom Rail: 12V -> Buck (90%) -> 3.3V @ 300mA
  drawPillTag(g, 75, 294, "12V (1.1W)", PALETTE.amber.top, "#1c1b18");
  drawFlatCard(
    g,
    150,
    240,
    205,
    108,
    PALETTE.sage.top,
    "Buck (90% Eff)",
    "Switching + Inductor"
  );
  drawLabel(g, 252, 300, "P_loss = 110 mW  (COOL ✓)", {
    fill: "#1c1b18",
    weight: 700
  });
  drawLabel(
    g,
    252,
    322,
    t("Mát & tiết kiệm pin vượt trội", "Cool & battery-friendly"),
    { fill: "#3f3c33" }
  );

  drawFlatCard(
    g,
    428,
    250,
    134,
    88,
    PALETTE.sky.top,
    "3.3V @ 300 mA",
    "0.99W Load"
  );
  drawLabel(g, 495, 314, t("Tiết kiệm 2.5W!", "Saves 2.5W!"), {
    fill: "#1c1b18",
    weight: 600
  });

  addWire(g, [[118, 294], [150, 294]], "#84b684");
  addWire(g, [[355, 294], [428, 294]], "#84b684");
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
    t("Diode ESD ghim dòng ngược lên VDD!", "ESD clamp injects current into VDD!")
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
  drawLabel(g, 712, 224, "Non-FT", { size: 9.5, weight: 700, fill: "var(--ink)" });
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
    "V_pin > 3.3V + 0.7V = 4.0V"
  );
  drawLabel(g, 718, 352, t("Treo / cháy MCU & cháy ESD", "Latches up / burns MCU & ESD"), {
    size: 10
  });
  drawLabel(g, 718, 372, t("Sửa: cầu chia 1k/2k hoặc chân FT", "Fix: 1k/2k divider or FT pin"), {
    size: 10,
    weight: 700,
    fill: "var(--ink)"
  });
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
      "Mạch lái MOSFET N-Channel tải cảm + Diode Flyback & Tụ 100 nF",
      "Logic-Level N-MOSFET Inductive Driver, Flyback Diode & 100 nF Decoupling"
    ),
    t(
      "Đặt 100 nF sát VDD-VSS; diode xả ngược chặn xung -L·dI/dt đánh thủng Drain",
      "Place 100 nF right across VDD-VSS; flyback diode clamps -L·dI/dt kickback"
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
  drawFlatCard(g, 136, 134, 128, 170, PALETTE.sky.top, "MCU (3.3V)", "VDD ← 100 nF");
  drawLabel(g, 200, 198, "GPIO Push-Pull", { fill: "#1c1b18", weight: 600 });
  drawLabel(g, 200, 222, "HIGH = 3.3V", { fill: "#3f3c33" });
  drawLabel(g, 200, 240, "LOW  = 0V", { fill: "#3f3c33" });
  drawLabel(g, 200, 286, "VSS (GND)", { fill: "#1c1b18", weight: 600 });

  // Gate network: 100 ohm series + 10k pull-down
  addWire(g, [[264, 240], [424, 240]], "#d3b25a");
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
    "AO3400 / IRLZ44N"
  );
  drawLabel(g, 498, 268, "Vgs(th) ≈ 1.0–2.0V", { fill: "#1c1b18", weight: 600 });
  drawLabel(g, 498, 288, "Rds(on) < 50 mΩ", { fill: "#3f3c33" });

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
    "12V Coil (L)"
  );
  drawLabel(g, 498, 154, "V = -L · dI/dt", { fill: "#1c1b18", weight: 600 });

  addWire(g, [[498, 170], [498, 212]], "#84b684");
  addWire(g, [[498, 192], [660, 192], [660, 84]], "#84b684");
  drawDiodeUp(g, 660, 126, 150, PALETTE.sage.top);

  drawLabel(g, 682, 130, "Flyback Diode", {
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
    t("(mắc ngược // tải)", "(reverse parallel)"),
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
    t("Khi MOSFET ngắt:", "When MOSFET turns OFF:")
  );
  drawLabel(
    g,
    743,
    282,
    t("xả -L·dI/dt qua Diode về +12V", "recirculates -L·dI/dt to +12V"),
    { fill: "#1c1b18", weight: 600 }
  );
  drawLabel(g, 743, 302, t("Ghim V_DS ≤ 12.7V ✓", "Clamps V_DS ≤ 12.7V ✓"), {
    fill: "#3f3c33"
  });

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
      "Thiếu Diode Flyback → gai áp hàng trăm Volt đánh chết MOSFET ngay lần tắt đầu!",
      "Missing Flyback Diode → 100V+ inductive spike kills the MOSFET on first turn-off!"
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
      "Lọc thông thấp RC + Đệm Op-Amp (Unity Buffer) vào ADC 12-bit",
      "RC Low-Pass Filter + Op-Amp Unity Buffer Driving 12-bit ADC"
    ),
    t(
      "Làm phẳng xung PWM thành DC sạch và cách ly trở kháng trước tụ lấy mẫu S&H của ADC",
      "Smooths PWM ripple into steady DC and isolates impedance from the ADC S&H capacitor"
    )
  );

  // Stage 1: PWM 3.3V
  drawFlatCard(g, 30, 96, 162, 196, PALETTE.sky.top, "PWM 3.3V", "Duty D = 50% (20 kHz)");
  g.appendChild(
    svgEl("path", {
      d: "M48,200 L48,162 L74,162 L74,200 L100,200 L100,162 L126,162 L126,200 L152,200 L152,162 L174,162",
      fill: "none",
      stroke: "#1c1b18",
      "stroke-width": "2"
    })
  );
  drawLabel(g, 111, 232, "V_avg = 1.65V", { fill: "#1c1b18", weight: 700 });
  drawLabel(g, 111, 254, t("Nhiều hài cao tần", "High-freq ripple"), { fill: "#3f3c33" });

  // Stage 2: RC Low-Pass Filter
  drawFlatCard(
    g,
    248,
    96,
    176,
    196,
    PALETTE.amber.top,
    t("Lọc thông thấp RC", "RC Low-Pass Filter"),
    "τ = R × C"
  );
  addWire(g, [[262, 166], [282, 166]], "#1c1b18");
  g.appendChild(
    svgEl("rect", {
      x: 282,
      y: 158,
      width: 44,
      height: 16,
      rx: 3,
      fill: PALETTE.paper.top,
      stroke: "#1c1b18",
      "stroke-width": "1.3"
    })
  );
  drawLabel(g, 304, 152, "R = 10 kΩ", { size: 9.5, weight: 700, fill: "#1c1b18" });
  addWire(g, [[326, 166], [408, 166]], "#1c1b18");
  addWire(g, [[366, 166], [366, 190]], "#1c1b18");
  addWire(g, [[354, 190], [378, 190]], "#1c1b18");
  addWire(g, [[354, 198], [378, 198]], "#1c1b18");
  addWire(g, [[366, 198], [366, 214]], "#1c1b18");
  drawLabel(g, 392, 200, "100nF", { size: 9.5, weight: 700, fill: "#1c1b18" });

  g.appendChild(
    svgEl("path", {
      d: "M272,240 Q290,234 308,240 T344,240 T380,240 T404,240",
      fill: "none",
      stroke: "#1c1b18",
      "stroke-width": "1.8"
    })
  );
  drawLabel(g, 336, 268, t("Z_out cao (10 kΩ)!", "High Z_out (10 kΩ)!"), {
    fill: "#1c1b18",
    weight: 600
  });

  // Stage 3: Op-Amp Unity Buffer
  drawFlatCard(
    g,
    480,
    96,
    158,
    196,
    PALETTE.sage.top,
    "Op-Amp Buffer",
    "V_out = V_in (Gain = 1)"
  );
  g.appendChild(
    svgEl("polygon", {
      points: "524,152 524,208 588,180",
      fill: PALETTE.paper.top,
      stroke: "#1c1b18",
      "stroke-width": "1.6"
    })
  );
  drawLabel(g, 534, 173, "+", { size: 11, weight: 700, fill: "#1c1b18" });
  drawLabel(g, 534, 194, "−", { size: 11, weight: 700, fill: "#1c1b18" });
  addWire(g, [[504, 169], [524, 169]], "#1c1b18");
  addWire(g, [[588, 180], [612, 180]], "#1c1b18");
  addWire(g, [[600, 180], [600, 222], [512, 222], [512, 190], [524, 190]], "#1c1b18");
  drawLabel(g, 559, 248, t("Z_in ≈ ∞ (không rút RC)", "Z_in ≈ ∞ (zero RC droop)"), {
    fill: "#1c1b18",
    weight: 600
  });
  drawLabel(g, 559, 268, t("Z_out < 1 Ω (lái S&H)", "Z_out < 1 Ω (drives S&H)"), {
    fill: "#3f3c33"
  });

  // Stage 4: ADC 12-bit S&H Cap
  drawFlatCard(
    g,
    694,
    96,
    156,
    196,
    PALETTE.lavender.top,
    "ADC 12-bit S&H",
    "0 .. 4095 counts"
  );
  addWire(g, [[712, 172], [738, 172], [762, 160]], "#1c1b18");
  addWire(g, [[764, 172], [790, 172], [790, 192]], "#1c1b18");
  addWire(g, [[776, 192], [804, 192]], "#1c1b18");
  addWire(g, [[776, 200], [804, 200]], "#1c1b18");
  addWire(g, [[790, 200], [790, 218]], "#1c1b18");
  drawLabel(g, 816, 198, "C_SH", { size: 9.5, weight: 700, fill: "#1c1b18" });
  drawLabel(g, 772, 246, "1.65V → 2048", { fill: "#1c1b18", weight: 700 });
  drawLabel(g, 772, 268, t("Nạp tụ S&H nhanh ✓", "Fast S&H settle ✓"), { fill: "#3f3c33" });

  // Inter-stage wires & packets
  addWire(g, [[192, 174], [248, 174]], "#84b4df");
  addWire(g, [[424, 174], [480, 174]], "#d3b25a");
  addWire(g, [[638, 174], [694, 174]], "#84b684");

  addPacketTrack([[192, 174], [248, 174]], "#84b4df", 1, 0.36, "PWM");
  addPacketTrack([[424, 174], [480, 174]], "#f5d88b", 1, 0.36, "V_filt");
  addPacketTrack([[638, 174], [694, 174]], "#84be88", 1, 0.36, "low Z");

  // Bottom f_c & EMA formula cards
  drawFlatCard(
    g,
    30,
    316,
    398,
    86,
    "var(--bg-elevated)",
    t("Tần số cắt lọc Analog (Cutoff f_c)", "Analog RC Cutoff Frequency (f_c)"),
    "f_c = 1 / (2π · R · C)  =  159 Hz  (≪ 20 kHz PWM)"
  );
  drawLabel(
    g,
    229,
    380,
    t("Chọn f_c ≤ f_PWM / 100 để gợn sóng < 1%", "Pick f_c ≤ f_PWM / 100 for <1% ripple")
  );

  drawFlatCard(
    g,
    452,
    316,
    398,
    86,
    "var(--bg-elevated)",
    t("Lọc số tương đương trên MCU (EMA)", "Discrete MCU Equivalent (EMA Filter)"),
    "y[n] = y[n-1] + α · (x[n] - y[n-1])"
  );
  drawLabel(
    g,
    651,
    380,
    "α = Δt / (τ + Δt)   (Q-format >> shift, no float)"
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
    "100–400 kHz (2 wires)"
  );
  drawLabel(
    g,
    133,
    144,
    t("Chỉ kéo LOW, cần R_pu", "Pulls LOW only + R_pu"),
    { fill: "#3f3c33" }
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
    "1–50 MHz (4 wires)"
  );
  drawLabel(
    g,
    133,
    268,
    t("Full-duplex, không R kéo", "Full-duplex, no pull-up"),
    { fill: "#3f3c33" }
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
    t("Vi sai 2 dây (100m+)", "Differential (100m+)")
  );
  drawLabel(
    g,
    133,
    390,
    t("Khử nhiễu EMI cực tốt", "High EMI immunity"),
    { fill: "#3f3c33" }
  );

  drawFlatCard(g, 256, 332, 54, 62, PALETTE.amber.top, "120 Ω", "Term");
  drawFlatCard(g, 766, 332, 54, 62, PALETTE.amber.top, "120 Ω", "Term");

  addWire(g, [[310, 350], [766, 350]], "#d38383");
  addWire(g, [[310, 378], [766, 378]], "#84b4df");
  drawLabel(g, 342, 344, "CAN_H", { size: 9.5, weight: 700, fill: "var(--ink)" });
  drawLabel(g, 342, 372, "CAN_L", { size: 9.5, weight: 700, fill: "var(--ink)" });

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
      "Đọc Datasheet STM32: Chân FT vs TT, Tổng dòng ΣI_VDD, SWD & Smoke Test",
      "STM32 Datasheet Budget: FT vs TT Pins, ΣI_VDD Cap, SWD & Smoke Test"
    ),
    t(
      "Kiểm tra giới hạn Abs Max & đo thông mạch DMM trước khi cấp nguồn cho board",
      "Verify Absolute Maximum Ratings & DMM continuity before powering any board"
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
    ""
  );

  // IC dark silicon body
  g.appendChild(
    svgEl("rect", {
      x: 138,
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
      cx: 152,
      cy: 158,
      r: 4.5,
      fill: "#faf7ef"
    })
  );
  drawLabel(g, 197, 206, "STM32F103", { size: 12, weight: 700, fill: "#faf7ef" });
  drawLabel(g, 197, 224, "VDD = 3.3V", { size: 10, fill: "#e6decb" });
  drawLabel(g, 197, 240, "Boot0 = 0", { size: 10, fill: "#e6decb" });

  // Left pins: FT vs TT
  const leftPins = [
    [164, "FT (5V OK)", PALETTE.sage.top, "#84b684"],
    [200, "TT (3.3V!)", PALETTE.rose.top, "#d38383"],
    [236, "FT (I2C)", PALETTE.sage.top, "#84b684"],
    [272, "TTa ≤3.6V", PALETTE.rose.top, "#d38383"]
  ];
  leftPins.forEach(([py, label, bg, wireCol]) => {
    addWire(g, [[112, py], [138, py]], wireCol);
    drawPillTag(g, 76, py, label, bg, "#1c1b18");
  });

  // Right pins: SWDIO, SWCLK, GPIO 20mA
  addWire(g, [[256, 168], [284, 168]], "#84b4df");
  drawLabel(g, 290, 172, "SWDIO", { size: 9.5, weight: 700, anchor: "start", fill: "var(--ink)" });

  addWire(g, [[256, 204], [284, 204]], "#84b4df");
  drawLabel(g, 290, 208, "SWCLK", { size: 9.5, weight: 700, anchor: "start", fill: "var(--ink)" });

  addWire(g, [[256, 256], [284, 256]], "#d3b25a");
  drawLabel(g, 290, 260, "≤ 20 mA", { size: 9.5, weight: 700, anchor: "start", fill: "var(--ink)" });

  drawLabel(
    g,
    197,
    318,
    t("FT = Chịu 5V ở chế độ Input (an toàn)", "FT = Five-volt Tolerant (5V input safe)"),
    { size: 10, weight: 600, fill: "var(--ink)" }
  );
  drawLabel(
    g,
    197,
    338,
    t("TT = Chỉ 3.3V (cấm > VDD + 0.3V!)", "TT = 3.3V-only (NEVER > VDD + 0.3V!)"),
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
    "I_pin ≤ 20 mA   |   ΣI_VDD / ΣI_VSS ≤ 120 mA (Abs Max)"
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
    208,
    428,
    78,
    PALETTE.sky.top,
    t("Cổng Debug SWD 4 chân (ST-Link)", "4-Pin SWD Debug Header (ST-Link)"),
    t("Không nối VCC nếu board đang có nguồn ngoài!", "Skip VCC if board is externally powered!")
  );
  drawPillTag(g, 476, 266, "VCC", PALETTE.paper.top, "#1c1b18");
  drawPillTag(g, 566, 266, "SWDIO", PALETTE.amber.top, "#1c1b18");
  drawPillTag(g, 666, 266, "SWCLK", PALETTE.amber.top, "#1c1b18");
  drawPillTag(g, 776, 266, "GND (0V)", PALETTE.sage.top, "#1c1b18");

  // Bottom-Right: 6-Step DMM Smoke Test Badge
  drawFlatCard(
    g,
    422,
    298,
    428,
    100,
    PALETTE.amber.top,
    t("Smoke Test 6 bước bằng DMM trước khi bật điện", "6-Step Pre-Power DMM Smoke Test"),
    t("1. Soi mạch   →   2. Đo thông mạch VDD–GND (≠ 0Ω)", "1. Visual check → 2. Continuity VDD–GND (no short)")
  );
  drawLabel(
    g,
    636,
    356,
    t("3. Kiểm cực tụ/diode → 4. Cấp nguồn giới hạn dòng", "3. Cap/diode polarity → 4. Current-limited power"),
    { fill: "#1c1b18", weight: 600 }
  );
  drawLabel(
    g,
    636,
    376,
    t("5. Đo áp 3.3V (±5%) → 6. Kiểm tra nhiệt trước khi nạp", "5. Verify 3.3V (±5%) → 6. Thermal check before flash"),
    { fill: "#3f3c33" }
  );

  // Gutter connecting tracks
  addWire(g, [[362, 136], [422, 136]], "#d38383");
  addWire(g, [[362, 247], [422, 247]], "#84b4df");
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
