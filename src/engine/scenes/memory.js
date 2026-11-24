import { PALETTE, svgEl, drawIsoBlock, drawPillTag, drawFlatCard, addWire } from "../svg-primitives.js";

function sceneMcuOverview(g, _scene, { addPacketTrack, t }) {
  drawIsoBlock(g, 440, 150, 120, 80, 22, "amber", "AHB / APB Bus", "32-bit Address");
  drawIsoBlock(g, 440, 16, 128, 82, 24, "sky", "ARM Cortex-M3", "CPU Core (72 MHz)");
  drawIsoBlock(g, 200, 150, 124, 82, 32, "lavender", "FLASH (64 KB)", "0x0800_0000");
  drawIsoBlock(g, 680, 150, 124, 82, 28, "sage", "SRAM (20 KB)", "0x2000_0000");
  drawIsoBlock(g, 440, 294, 144, 86, 24, "paper", "PERIPHERALS", "0x4000_0000 (GPIO)");

  const cpuP = [440, 128];
  const busP = [440, 166];
  const flashP = [294, 204];
  const sramP = [612, 204];
  const periphP = [440, 296];

  addWire(g, [cpuP, busP]);
  addWire(g, [flashP, [372, 204]]);
  addWire(g, [[538, 204], sramP]);
  addWire(g, [[440, 256], periphP]);

  drawPillTag(g, 195, 116, t("Lưu code & const", "Stores code & constants"));
  drawPillTag(g, 685, 116, t("Lưu biến & Stack", "Stores variables & stack"));
  drawPillTag(g, 632, 345, t("Điều khiển chân I/O", "Controls I/O pins"));

  addPacketTrack([flashP, [372, 204]], "#c7b8ea", 1, 0.36, "fetch");
  addPacketTrack([[538, 204], sramP], "#84be88", 1, 0.32, "R/W");
  addPacketTrack([[440, 256], periphP], "#f5d88b", 1, 0.28, "GPIO");
}

function sceneIntTrap(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    70,
    24,
    740,
    48,
    "var(--bg-elevated)",
    "int adc_mv = 40000;   // 0x9C40 = 1001_1100_0100_0000",
    t("Cùng một dòng code C nhưng kích thước int khác nhau theo chip!", "The same C code can use different int widths on different chips.")
  );

  drawIsoBlock(g, 245, 118, 140, 88, 28, "rose", "8-bit AVR MCU", "sizeof(int) = 2B");
  drawFlatCard(g, 145, 306, 200, 74, PALETTE.rose.top, "avr-gcc: adc_mv = -25,536", t("Kết quả phụ thuộc triển khai", "Implementation-defined result"));

  drawIsoBlock(g, 635, 118, 140, 88, 28, "sage", "32-bit STM32", "sizeof(int) = 4B");
  drawFlatCard(g, 535, 306, 200, 74, PALETTE.sage.top, "adc_mv = +40,000", t("0x00009C40 → AN TOÀN", "0x00009C40 → IN RANGE"));

  addWire(g, [[440, 72], [245, 118]], "#d38383", false, { markerEnd: true });
  addWire(g, [[440, 72], [635, 118]], "#84b684", false, { markerEnd: true });
  addWire(g, [[245, 258], [245, 306]], "#d38383", false, { markerEnd: true });
  addWire(g, [[635, 258], [635, 306]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[440, 72], [245, 118]], "#e57373", 1, 0.36, "0x9C40");
  addPacketTrack([[440, 72], [635, 118]], "#84be88", 1, 0.36, "0x00009C40");
  addPacketTrack([[245, 258], [245, 306]], "#e57373", 1, 0.36);
  addPacketTrack([[635, 258], [635, 306]], "#84be88", 1, 0.36);
}

function sceneStdintSram(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    80,
    42,
    720,
    44,
    "var(--bg-elevated)",
    t("Bản đồ 8 Byte SRAM liên tiếp (0x2000_0000 → 0x2000_0007)", "Eight consecutive SRAM bytes (0x2000_0000 → 0x2000_0007)"),
    t("Mỗi ô = 1 Byte (8-bit). Dùng <stdint.h> để đặt biến vừa khít!", "Each cell is one byte (8 bits). Use <stdint.h> for exact widths.")
  );

  const cellW = 84;
  const startX = 100;
  const rowY = 175;
  const labels = [
    { val: "250", tag: "uint8_t", fill: PALETTE.sage.top },
    { val: "pad", tag: "(align)", fill: PALETTE.paper.top },
    { val: "0x83", tag: "int16_t", fill: PALETTE.amber.top },
    { val: "0xFF", tag: "int16_t", fill: PALETTE.amber.top },
    { val: "0x00", tag: "uint32_t", fill: PALETTE.lavender.top },
    { val: "0xC2", tag: "uint32_t", fill: PALETTE.lavender.top },
    { val: "0x01", tag: "uint32_t", fill: PALETTE.lavender.top },
    { val: "0x00", tag: "uint32_t", fill: PALETTE.lavender.top }
  ];

  labels.forEach((cell, i) => {
    const cx = startX + i * (cellW + 4);
    drawFlatCard(g, cx, rowY, cellW, 92, cell.fill, cell.val, cell.tag);
    g.appendChild(
      svgEl("text", { x: cx + cellW / 2, y: rowY - 10, "text-anchor": "middle", "font-size": "10", fill: "var(--ink-muted)" }, `0x..0${i}`)
    );
  });

  drawPillTag(g, 142, 310, "led_bright (1B)", PALETTE.sage.top);
  drawPillTag(g, 360, 310, "temp_x10 = -125 (2B)", PALETTE.amber.top);
  drawPillTag(g, 628, 310, "baudrate = 115200 (4B)", PALETTE.lavender.top);

  addPacketTrack([[142, 90], [142, 175]], "#84be88", 1, 0.35);
  addPacketTrack([[360, 90], [360, 175]], "#f5d88b", 1, 0.35);
  addPacketTrack([[628, 90], [628, 175]], "#d9c8f0", 1, 0.35);
}

function sceneFlashVsSram(g, _scene, { addPacketTrack, t }) {
  drawIsoBlock(g, 225, 26, 135, 82, 20, "lavender", "FLASH .text", t("Mã máy chương trình", "Machine code"));
  drawIsoBlock(g, 225, 156, 135, 82, 20, "lavender", "FLASH .rodata", "const font_rom[256]");
  drawIsoBlock(g, 225, 286, 135, 82, 20, "amber", "FLASH .data_init", t("Bản sao font_ram", "Initial font_ram data"));

  drawIsoBlock(g, 670, 86, 135, 82, 20, "amber", "SRAM .data", "font_ram[256] (256B)");
  drawIsoBlock(g, 670, 228, 135, 82, 20, "sage", "SRAM .bss", "rx_count = 0");

  drawIsoBlock(g, 450, 260, 105, 68, 22, "sky", "CPU Core", t("Đọc thẳng .rodata", "Read .rodata directly"));

  addWire(g, [[342, 340], [599, 140]], "#d3b25a", true, { markerEnd: true });
  addWire(g, [[342, 220], [391, 294]], "#ad9cd8", false, { markerEnd: true });

  drawPillTag(g, 450, 74, t("Startup copy khi cấp nguồn", "Copied during startup"), PALETTE.amber.top);
  drawPillTag(g, 450, 396, t("0 byte SRAM nhờ const!", "0 SRAM bytes in this example"), PALETTE.sage.top);

  addPacketTrack([[342, 340], [599, 140]], "#f5d88b", 2, 0.34, "boot copy");
  addPacketTrack([[342, 220], [391, 294]], "#d9c8f0", 2, 0.38, "read");
}

function sceneOverflowAlu(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    110,
    40,
    660,
    44,
    "var(--bg-elevated)",
    "uint8_t tick = 255; tick++;  // 0xFF (1111 1111₂) + 1",
    t("Cộng trong int, rồi lưu vào uint8_t theo modulo 256", "Add as int, then store as uint8_t modulo 256")
  );

  const bitW = 54;
  const x0 = 225;
  for (let i = 0; i < 8; i++) {
    drawFlatCard(g, x0 + i * (bitW + 4), 115, bitW, 48, PALETTE.amber.top, "1", `b${7 - i}`);
  }
  drawPillTag(g, 145, 139, "tick = 255", PALETTE.amber.top);

  drawFlatCard(g, 365, 195, 150, 44, PALETTE.sky.top, "255 + 1 = 256", t("Cộng trong int", "Addition as int"));

  drawFlatCard(g, 162, 275, 56, 52, PALETTE.rose.top, "1", "b8");
  for (let i = 0; i < 8; i++) {
    drawFlatCard(g, x0 + i * (bitW + 4), 275, bitW, 52, PALETTE.paper.top, "0", `b${7 - i}`);
  }
  drawPillTag(g, 455, 360, t("Kết quả trong uint8_t = 0 (Wrap-around!)", "uint8_t result = 0 (wraparound)"), PALETTE.rose.top);

  addWire(g, [[440, 165], [440, 195]]);
  addWire(g, [[440, 240], [440, 275]]);
  addWire(g, [[365, 217], [190, 275]], "#d38383", true);

  addPacketTrack([[440, 165], [440, 240], [440, 275]], "#84be88", 1, 0.4);
  addPacketTrack([[365, 217], [190, 275]], "#e57373", 2, 0.42, t("tràn b8", "carry b8"));
}

function sceneTwosComplement(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    90,
    38,
    700,
    42,
    "var(--bg-elevated)",
    t("Biểu diễn số âm int8_t bằng Mã bù 2 (Two's Complement)", "Negative int8_t values in two’s complement"),
    t("Bit cao nhất (MSB b7) mang trọng số âm (-128)", "The most significant bit (b7) has weight −128")
  );

  const bitsA = ["0", "0", "0", "0", "1", "0", "1", "0"];
  const bitsB = ["1", "1", "1", "1", "1", "0", "1", "1"];
  const bitsR = ["0", "0", "0", "0", "0", "1", "0", "1"];
  const bitW = 54;
  const x0 = 256;

  drawPillTag(g, 152, 128, "a = +10 (0x0A)", PALETTE.sage.top);
  bitsA.forEach((b, i) => {
    drawFlatCard(g, x0 + i * (bitW + 4), 105, bitW, 46, i === 0 ? PALETTE.lavender.top : PALETTE.sage.top, b, i === 0 ? "-128" : `+${1 << (7 - i)}`);
  });

  drawPillTag(g, 152, 190, "b = -5 (0xFB)", PALETTE.amber.top);
  bitsB.forEach((b, i) => {
    drawFlatCard(g, x0 + i * (bitW + 4), 167, bitW, 46, i === 0 ? PALETTE.lavender.top : PALETTE.amber.top, b, i === 0 ? "-128" : `+${1 << (7 - i)}`);
  });

  drawFlatCard(g, 395, 232, 185, 42, PALETTE.sky.top, t("Cộng nhị phân", "Binary addition"), t("Minh họa trên 8 bit", "8-bit example"));

  drawPillTag(g, 152, 313, "sum = +5 (0x05)", PALETTE.sage.top);
  bitsR.forEach((b, i) => {
    drawFlatCard(g, x0 + i * (bitW + 4), 290, bitW, 46, i === 0 ? PALETTE.lavender.top : PALETTE.sage.top, b, "");
  });

  addWire(g, [[487, 213], [487, 232]], "var(--border)", false, { markerEnd: true });
  addWire(g, [[487, 274], [487, 290]], "var(--border)", false, { markerEnd: true });
  addPacketTrack([[283, 151], [487, 250], [487, 290]], "#d9c8f0", 1, 0.35);
  addPacketTrack([[687, 213], [487, 250], [687, 290]], "#84be88", 1, 0.35);
}

function sceneLittleEndian(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    190,
    44,
    500,
    74,
    PALETTE.lavender.top,
    t("Giá trị 32 bit: 0x12345678", "32-bit value: 0x12345678"),
    t("Byte cao [12]  |  [34]  |  [56]  |  [78] Byte thấp", "High byte [12]  |  [34]  |  [56]  |  [78] Low byte")
  );

  const cells = [
    { addr: "0x2000_0000", val: "0x78", sub: t("Byte thấp", "Low byte"), tone: PALETTE.sage.top, srcX: 575 },
    { addr: "0x2000_0001", val: "0x56", sub: "Byte 1", tone: PALETTE.amber.top, srcX: 485 },
    { addr: "0x2000_0002", val: "0x34", sub: "Byte 2", tone: PALETTE.amber.top, srcX: 395 },
    { addr: "0x2000_0003", val: "0x12", sub: "Byte cao", tone: PALETTE.lavender.top, srcX: 305 }
  ];

  cells.forEach((c, i) => {
    const x = 115 + i * 170;
    const y = 240;
    drawFlatCard(g, x, y, 145, 92, c.tone, c.val, c.sub);
    g.appendChild(
      svgEl("text", { x: x + 72, y: y - 10, "text-anchor": "middle", "font-size": "11", "font-weight": "700", fill: "var(--ink)" }, c.addr)
    );
    addWire(g, [[c.srcX, 118], [x + 72, y - 22]], i === 0 ? "#84b684" : "var(--border)", i > 0);
    addPacketTrack(
      [[c.srcX, 118], [x + 72, y - 22]],
      i === 0 ? "#84be88" : i === 3 ? "#d9c8f0" : "#f5d88b",
      1,
      0.32 + i * 0.04,
      c.val
    );
  });

  drawPillTag(g, 440, 368, t("Little-Endian: Byte thấp nhất nằm ở địa chỉ thấp nhất", "Little-endian: the lowest address holds the least significant byte"), PALETTE.sage.top);
}

function sceneEndianWire(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(g, 55, 115, 185, 110, PALETTE.paper.top, "STM32 SRAM", "mv = 1000 (0x03E8)\n[0]=0xE8, [1]=0x03");

  drawFlatCard(g, 330, 62, 220, 64, PALETTE.rose.top, t("Ép con trỏ thô (LỖI)", "Raw pointer cast (WRONG)"), t("Gửi 0xE8 trước, 0x03 sau", "Send 0xE8 then 0x03"));
  drawFlatCard(g, 635, 62, 195, 74, PALETTE.rose.top, "0xE803 = 59,395!", t("Bên nhận hiểu sai 59 lần", "Receiver decodes the wrong value"));

  drawFlatCard(g, 330, 232, 220, 64, PALETTE.sage.top, t("Dịch bit (mv >> 8)", "Bit shift (mv >> 8)"), t("Gửi 0x03 trước, 0xE8 sau", "Send 0x03 then 0xE8"));
  drawFlatCard(g, 635, 227, 195, 74, PALETTE.sage.top, "0x03E8 = 1,000 mV", t("Khôi phục chính xác!", "Correctly decoded"));

  addWire(g, [[240, 150], [330, 94]], "#d38383", false, { markerEnd: true });
  addWire(g, [[550, 94], [635, 94]], "#d38383", false, { markerEnd: true });
  addWire(g, [[240, 195], [330, 264]], "#84b684", false, { markerEnd: true });
  addWire(g, [[550, 264], [635, 264]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[240, 150], [330, 94], [635, 94]], "#e57373", 2, 0.36, "E8 → 03");
  addPacketTrack([[240, 195], [330, 264], [635, 264]], "#84be88", 2, 0.36, "03 → E8");
}

function sceneMmioLed(g, _scene, { addPacketTrack, t }) {
  drawIsoBlock(g, 155, 138, 125, 86, 28, "sky", "CPU Core", "ODR |= (1 << 5)");
  drawIsoBlock(g, 435, 138, 138, 90, 28, "lavender", "GPIOA_ODR", "0x4001_080C [b5]");

  drawFlatCard(g, 645, 130, 160, 110, PALETTE.sage.top, t("Chân PA5 = 3.3 V", "Pin PA5 = 3.3 V"), t("ĐÈN LED SÁNG!", "LED ON"));
  g.appendChild(svgEl("circle", { cx: 725, cy: 295, r: 28, fill: PALETTE.sage.top, stroke: "var(--border)", "stroke-width": "2" }));
  g.appendChild(svgEl("circle", { cx: 725, cy: 295, r: 14, fill: "#4caf50", stroke: "#1c1b18", "stroke-width": "1.5" }));
  g.appendChild(svgEl("text", { x: 725, y: 342, "text-anchor": "middle", "font-size": "11", "font-weight": "700", fill: "var(--ink)" }, "LED ON (HIGH)"));

  addWire(g, [[263, 200], [357, 200]], "#ad9cd8", false, { markerEnd: true });
  addWire(g, [[554, 195], [645, 185]], "#84b684", false, { markerEnd: true });
  addWire(g, [[725, 240], [725, 267]], "#84b684", false, { markerEnd: true });

  drawPillTag(g, 310, 118, "APB2 Bus Write", PALETTE.lavender.top);
  addPacketTrack([[263, 200], [357, 200]], "#d9c8f0", 2, 0.38, "0x0020");
  addPacketTrack([[554, 195], [645, 185]], "#84be88", 2, 0.4, "3.3V");
}

function sceneRecapMap(g, _scene, { addPacketTrack, t }) {
  drawIsoBlock(g, 160, 156, 130, 82, 24, "sky", "Code C + stdint", "uint8_t / uint32_t");
  drawIsoBlock(g, 450, 22, 135, 76, 20, "lavender", "FLASH 0x0800_0000", ".text + const .rodata");
  drawIsoBlock(g, 450, 156, 135, 76, 20, "sage", "SRAM 0x2000_0000", ".data + .bss (LE)");
  drawIsoBlock(g, 450, 290, 135, 76, 20, "amber", "MMIO 0x4000_0000", t("Thanh ghi Ngoại vi", "Peripheral registers"));

  drawFlatCard(g, 675, 164, 165, 92, PALETTE.sage.top, t("Phần cứng thật", "Physical hardware"), "LED, Timer, UART,\nCAN, LoRa SX1278");

  addWire(g, [[272, 204], [384, 70]], "#ad9cd8", false, { markerEnd: true });
  addWire(g, [[272, 210], [384, 204]], "#84b684", false, { markerEnd: true });
  addWire(g, [[272, 216], [384, 338]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[567, 358], [675, 210]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[272, 204], [384, 70]], "#d9c8f0", 1, 0.32);
  addPacketTrack([[272, 210], [384, 204]], "#84be88", 1, 0.35);
  addPacketTrack([[272, 216], [384, 338], [567, 358], [675, 210]], "#f5d88b", 2, 0.32);
}

export function registerMemoryScenes(registerScene) {
  registerScene("mcu_overview", sceneMcuOverview);
  registerScene("int_trap", sceneIntTrap);
  registerScene("stdint_sram", sceneStdintSram);
  registerScene("flash_vs_sram", sceneFlashVsSram);
  registerScene("overflow_alu", sceneOverflowAlu);
  registerScene("twos_complement", sceneTwosComplement);
  registerScene("little_endian", sceneLittleEndian);
  registerScene("endian_wire", sceneEndianWire);
  registerScene("mmio_led", sceneMmioLed);
  registerScene("recap_map", sceneRecapMap);
}
