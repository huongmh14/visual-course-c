import {
  PALETTE,
  svgEl,
  drawIsoBlock,
  drawPillTag,
  drawFlatCard,
  addWire
} from "../svg-primitives.js";

function drawBitRow(parent, x, y, bits, options = {}) {
  const {
    cellW = 52,
    cellH = 44,
    gap = 6,
    highlight = {},
    showIndex = false,
    showWeight = false,
    label = "",
    suffix = ""
  } = options;

  if (label) {
    parent.appendChild(
      svgEl(
        "text",
        {
          x: x - 12,
          y: y + cellH / 2 + 4,
          "text-anchor": "end",
          "font-size": "11.5",
          "font-weight": "700",
          fill: "var(--ink)"
        },
        label
      )
    );
  }

  for (let i = 0; i < bits.length; i++) {
    const bitIdx = bits.length - 1 - i;
    const extraGap = bits.length === 8 && i >= 4 ? 14 : 0;
    const cx = x + i * (cellW + gap) + extraGap;
    const val = bits[i];
    const tone = highlight[bitIdx] || (val === 1 ? "sky" : "paper");
    const c = PALETTE[tone] || PALETTE.paper;

    if (showIndex) {
      parent.appendChild(
        svgEl(
          "text",
          {
            x: cx + cellW / 2,
            y: y - 24,
            "text-anchor": "middle",
            "font-size": "10",
            "font-weight": "700",
            fill: "var(--ink-muted)"
          },
          `b${bitIdx}`
        )
      );
    }

    if (showWeight) {
      parent.appendChild(
        svgEl(
          "text",
          {
            x: cx + cellW / 2,
            y: y - 9,
            "text-anchor": "middle",
            "font-size": "9.5",
            "font-weight": "600",
            fill: "var(--ink-muted)"
          },
          String(1 << bitIdx)
        )
      );
    }

    parent.appendChild(
      svgEl("rect", {
        x: cx,
        y,
        width: cellW,
        height: cellH,
        rx: 7,
        fill: c.top,
        stroke: "var(--border)",
        "stroke-width": "1.5"
      })
    );
    parent.appendChild(
      svgEl(
        "text",
        {
          x: cx + cellW / 2,
          y: y + cellH / 2 + 6,
          "text-anchor": "middle",
          "font-size": "16",
          "font-weight": "700",
          fill: "#1c1b18"
        },
        String(val)
      )
    );
  }

  if (suffix) {
    const endX = x + bits.length * (cellW + gap) + (bits.length === 8 ? 14 : 0) + 10;
    parent.appendChild(
      svgEl(
        "text",
        {
          x: endX,
          y: y + cellH / 2 + 4,
          "text-anchor": "start",
          "font-size": "11.5",
          "font-weight": "700",
          fill: "var(--ink)"
        },
        suffix
      )
    );
  }
}

function sceneBitwiseBitsHex(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    110,
    24,
    660,
    46,
    "var(--bg-elevated)",
    t("Một số nguyên, nhiều cách viết: 10 = 0b0000_1010 = 0x0A", "One Integer, Many Forms: 10 = 0b0000_1010 = 0x0A"),
    t("Bit 0 ở bên phải (trọng số 1); mỗi chữ số Hex gom đúng 4 bit (1 nibble)", "Bit 0 is on the right (weight 1); each Hex digit packs exactly 4 bits")
  );

  drawBitRow(g, 195, 134, [0, 0, 0, 0, 1, 0, 1, 0], {
    cellW: 52,
    cellH: 46,
    gap: 6,
    showIndex: true,
    showWeight: true,
    highlight: { 3: "amber", 1: "sage" },
    label: "uint8_t",
    suffix: "= 10U"
  });

  drawFlatCard(g, 195, 204, 226, 48, PALETTE.paper.top, "High nibble: 0000 → 0x0", t("Bit 7..4 = 0", "Bits 7..4 = 0"));
  drawFlatCard(g, 441, 204, 226, 48, PALETTE.sky.top, "Low nibble: 1010 → 0xA", t("8 + 2 = 10 (0x0A)", "8 + 2 = 10 (0x0A)"));

  addWire(g, [[308, 180], [308, 204]], "#8c8475", true);
  addWire(g, [[554, 180], [554, 204]], "#84b4df");

  drawFlatCard(
    g,
    75,
    296,
    325,
    86,
    PALETTE.amber.top,
    t("Vị trí bit (index) = 3U", "Bit Index = 3U"),
    t("Chỉ số 0..7 — KHÔNG phải mặt nạ!", "Position 0..7 — NOT a mask!")
  );
  drawFlatCard(
    g,
    480,
    296,
    325,
    86,
    PALETTE.sage.top,
    t("Mặt nạ bit (mask) = 1U << 3U = 8U", "Bit Mask = 1U << 3U = 8U"),
    t("0000 1000 (0x08) — chỉ bật đúng bit 3", "0000 1000 (0x08) — selects only bit 3")
  );

  addWire(g, [[400, 339], [480, 339]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[400, 339], [480, 339]], "#84be88", 1, 0.35, "1U<<3");
  drawPillTag(g, 440, 274, t("Phân biệt 10U ≠ 010 (bát phân = 8)", "Note: 10U ≠ 010 (octal = 8)"), PALETTE.lavender.top);
}

function sceneBitwiseOpsGrid(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    100,
    22,
    680,
    44,
    "var(--bg-elevated)",
    t("6 toán tử Bitwise trên a = 6U (0110) và b = 3U (0011)", "6 Bitwise Operators on a = 6U (0110) and b = 3U (0011)"),
    t("Tính độc lập từng cột bit — không nhớ (carry) sang cột bên cạnh", "Each bit column computes independently — no carry between columns")
  );

  drawBitRow(g, 104, 102, [0, 1, 1, 0], { cellW: 54, cellH: 36, gap: 6, label: "a = 6U", highlight: { 2: "sky", 1: "sky" } });
  drawBitRow(g, 104, 150, [0, 0, 1, 1], { cellW: 54, cellH: 36, gap: 6, label: "b = 3U", highlight: { 1: "amber", 0: "amber" } });

  drawBitRow(g, 104, 214, [0, 0, 1, 0], { cellW: 54, cellH: 36, gap: 6, label: "a & b", suffix: "= 2", highlight: { 1: "sage" } });
  drawBitRow(g, 104, 262, [0, 1, 1, 1], { cellW: 54, cellH: 36, gap: 6, label: "a | b", suffix: "= 7", highlight: { 2: "sky", 1: "sky", 0: "sky" } });
  drawBitRow(g, 104, 310, [0, 1, 0, 1], { cellW: 54, cellH: 36, gap: 6, label: "a ^ b", suffix: "= 5", highlight: { 2: "lavender", 0: "lavender" } });

  drawFlatCard(
    g,
    440,
    98,
    395,
    82,
    PALETTE.amber.top,
    t("Dịch trái: 6U << 2U = 24U (× 2²)", "Left Shift: 6U << 2U = 24U (× 2²)"),
    t("0000 0110  →  0001 1000  (chèn 0 từ phải)", "0000 0110  →  0001 1000  (0 shifted in on right)")
  );
  drawFlatCard(
    g,
    440,
    198,
    395,
    82,
    PALETTE.sky.top,
    t("Dịch phải: 6U >> 2U = 1U (÷ 2²)", "Right Shift: 6U >> 2U = 1U (÷ 2²)"),
    t("0000 0110  →  0000 0001  (bit 1 bị đẩy rơi mất)", "0000 0110  →  0000 0001  (low bit shifted out)")
  );
  drawFlatCard(
    g,
    440,
    298,
    395,
    88,
    PALETTE.rose.top,
    t("NOT (~a): đảo toàn bộ unsigned int!", "NOT (~a): inverts full unsigned int!"),
    t("(uint8_t)~6U = 1111 1001 = 249 (cần ép 8-bit)", "(uint8_t)~6U = 1111 1001 = 249 (narrow to 8-bit)")
  );

  addWire(g, [[348, 120], [440, 138]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[348, 120], [440, 238]], "#84b4df", false, { markerEnd: true });
  addPacketTrack([[348, 120], [440, 138]], "#f5d88b", 1, 0.34, "<< 2");
  addPacketTrack([[348, 120], [440, 238]], "#84b4df", 1, 0.34, ">> 2");
}

function sceneBitwiseMaskClear(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    90,
    20,
    700,
    44,
    "var(--bg-elevated)",
    t("Từ 03_clear_bit.c: Vì sao xóa bit 3 của 0x88 phải dùng & ~mask?", "From 03_clear_bit.c: Why Clear Bit 3 of 0x88 with & ~mask?"),
    t("Mục tiêu: xóa đúng bit 3 về 0, GIỮ NGUYÊN bit 7 (0x88 → 0x80 = 128)", "Goal: clear only bit 3 to 0, PRESERVE bit 7 (0x88 → 0x80 = 128)")
  );

  drawBitRow(g, 195, 102, [1, 0, 0, 0, 1, 0, 0, 0], {
    cellW: 48,
    cellH: 36,
    gap: 5,
    showIndex: true,
    highlight: { 7: "sage", 3: "amber" },
    label: "data",
    suffix: "= 0x88"
  });

  drawBitRow(g, 195, 156, [1, 1, 1, 1, 0, 1, 1, 1], {
    cellW: 48,
    cellH: 36,
    gap: 5,
    highlight: { 7: "sage", 3: "rose" },
    label: "~mask",
    suffix: "= 0xF7"
  });

  drawFlatCard(
    g,
    60,
    232,
    370,
    108,
    PALETTE.sage.top,
    t("ĐÚNG: data & ~(1U << 3U) = 0x80 ✓", "SAFE: data & ~(1U << 3U) = 0x80 ✓"),
    t("1000 0000 (128) — Bit 7 gặp 1 nên giữ nguyên, Bit 3 gặp 0 bị xóa", "1000 0000 (128) — Bit 7 hits 1 (kept), Bit 3 hits 0 (cleared)")
  );
  drawFlatCard(
    g,
    450,
    232,
    370,
    108,
    PALETTE.rose.top,
    t("SAI: data & (1U << 3U) = 0x08 ❌", "BUG: data & (1U << 3U) = 0x08 ❌"),
    t("0000 1000 (8) — Lọc ra bit 3 nhưng XÓA SẠCH bit 7!", "0000 1000 (8) — Extracts bit 3 but WIPES OUT bit 7!")
  );

  addWire(g, [[340, 192], [245, 232]], "#84b684", false, { markerEnd: true });
  addWire(g, [[490, 192], [635, 232]], "#d38383", true, { markerEnd: true });
  addPacketTrack([[340, 192], [245, 232]], "#84be88", 1, 0.36, "& ~mask");

  drawPillTag(g, 200, 378, "SET: reg |= mask", PALETTE.sky.top);
  drawPillTag(g, 440, 378, "CLEAR: reg &= ~mask", PALETTE.sage.top);
  drawPillTag(g, 680, 378, "TOGGLE: reg ^= mask", PALETTE.lavender.top);
}

function sceneBitwiseFlagsCheck(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    16,
    800,
    46,
    "var(--bg-elevated)",
    t("Kiểm tra nhiều cờ: ANY (ít nhất 1) vs ALL (đủ tất cả) & Bẫy ngoặc ()", "Multi-Flag Checks: ANY vs ALL & Operator Precedence Trap"),
    t("Ví dụ: permissions = READ (0001), wanted = READ | WRITE (0011)", "Example: permissions = READ (0001), wanted = READ | WRITE (0011)")
  );

  drawIsoBlock(g, 150, 108, 128, 78, 24, "sky", "flags = 0x01", "READ (b0) = 1");
  drawIsoBlock(g, 150, 258, 128, 78, 24, "amber", "wanted = 0x03", "READ | WRITE");

  drawFlatCard(
    g,
    356,
    82,
    484,
    84,
    PALETTE.sage.top,
    t("ANY: (flags & wanted) != 0U  →  true", "ANY: (flags & wanted) != 0U  →  true"),
    t("0001 & 0011 = 0001 ≠ 0 — Có ít nhất 1 cờ bật", "0001 & 0011 = 0001 ≠ 0 — At least one flag is set")
  );
  drawFlatCard(
    g,
    356,
    182,
    484,
    84,
    PALETTE.lavender.top,
    t("ALL: (flags & wanted) == wanted  →  false", "ALL: (flags & wanted) == wanted  →  false"),
    t("0001 ≠ 0011 — Thiếu cờ WRITE (b1 = 0)", "0001 ≠ 0011 — Missing WRITE flag (b1 = 0)")
  );
  drawFlatCard(
    g,
    356,
    282,
    484,
    104,
    PALETTE.rose.top,
    t("BẪY NGOẶC: status & 0x04U == 0U ❌", "PRECEDENCE BUG: status & 0x04U == 0U ❌"),
    t("== ưu tiên cao hơn & → thành status & (0x04U == 0U) = 0! Luôn đóng ngoặc (status & mask) == 0U", "== binds tighter than & → status & (0x04U == 0U) = 0! Always write (status & mask) == 0U")
  );

  addWire(g, [[252, 156], [348, 124]], "#84b684", false, { markerEnd: true });
  addWire(g, [[252, 294], [348, 224]], "#ad9cd8", false, { markerEnd: true });
  addPacketTrack([[252, 156], [348, 124]], "#84be88", 1, 0.35, "!= 0U");
  addPacketTrack([[252, 294], [348, 224]], "#ad9cd8", 1, 0.35, "== wanted");
}

function sceneBitwiseFieldRmw(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    80,
    20,
    720,
    44,
    "var(--bg-elevated)",
    t("Thay trường 2 bit [7:6] trong config = 0xFFFF thành mode = 1 (01)", "Update 2-Bit Field [7:6] in config = 0xFFFF to mode = 1 (01)"),
    t("Quy trình 3 bước CMSIS: Xóa trường cũ (& ~Msk) → Dịch giá trị (<< Pos) → Ghép (|)", "3-Step CMSIS Pattern: Clear old field (& ~Msk) → Shift new value (<< Pos) → OR (|)")
  );

  drawFlatCard(
    g,
    66,
    94,
    200,
    86,
    PALETTE.paper.top,
    t("1. Ban đầu: 0xFFFF", "1. Before: 0xFFFF"),
    t("Bit [7:6] = 11 (cũ)", "Bits [7:6] = 11 (old)")
  );
  drawFlatCard(
    g,
    340,
    94,
    200,
    86,
    PALETTE.amber.top,
    t("2. Xóa: & ~mask → 0xFF3F", "2. Clear: & ~mask → 0xFF3F"),
    t("mask = 3U << 6 (0x00C0)", "mask = 3U << 6 (0x00C0)")
  );
  drawFlatCard(
    g,
    614,
    94,
    200,
    86,
    PALETTE.sage.top,
    t("3. Ghép: | (1U << 6) → 0xFF7F", "3. Merge: | (1U << 6) → 0xFF7F"),
    t("Bit [7:6] = 01 ✓", "Bits [7:6] = 01 ✓")
  );

  addWire(g, [[266, 137], [340, 137]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[540, 137], [614, 137]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[266, 137], [340, 137]], "#f5d88b", 1, 0.35, "& ~Msk");
  addPacketTrack([[540, 137], [614, 137]], "#84be88", 1, 0.35, "| val<<Pos");

  drawBitRow(g, 195, 224, [0, 1, 1, 1, 1, 1, 1, 1], {
    cellW: 48,
    cellH: 38,
    gap: 5,
    showIndex: true,
    highlight: { 7: "amber", 6: "amber", 5: "sage", 4: "sage", 3: "sage", 2: "sage", 1: "sage", 0: "sage" },
    label: "Low 8b",
    suffix: "= 0x7F"
  });

  drawFlatCard(
    g,
    95,
    302,
    690,
    92,
    PALETTE.sky.top,
    t("Bất biến bắt buộc kiểm chứng bằng assert:", "Required Invariant Verified by assert:"),
    "assert((after & ~mask) == (before & ~mask));   // Mọi bit ngoài [7:6] giữ nguyên 100%"
  );
}

function sceneBitwiseC17Traps(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    90,
    20,
    700,
    44,
    "var(--bg-elevated)",
    t("4 bẫy C17 hay làm hỏng code Bitwise trên MCU", "4 C17 Traps That Silently Break Embedded Bitwise Code"),
    t("Biến nhận kết quả KHÔNG quyết định kiểu tính biểu thức", "The destination variable does NOT control the type used to evaluate the expression")
  );

  drawFlatCard(
    g,
    55,
    92,
    365,
    126,
    PALETTE.rose.top,
    t("Bẫy 1: Nâng kiểu (Integer Promotion)", "Trap 1: Integer Promotion"),
    t("uint8_t m = 0x0F; → ~m thành int (-16), KHÔNG phải 0xF0!", "uint8_t m = 0x0F; → ~m promotes to int (-16), NOT 0xF0!"),
    { valign: "top" }
  );
  drawPillTag(g, 238, 192, "(uint8_t)~(unsigned int)m → 0xF0 ✓", PALETTE.sage.top);

  drawFlatCard(
    g,
    460,
    92,
    365,
    126,
    PALETTE.amber.top,
    t("Bẫy 2: Dịch quá độ rộng / số âm = UB", "Trap 2: Shift >= Width or Negative = UB"),
    t("1U << 32U, 1U << -1, -1 << 1 đều là Undefined Behavior!", "1U << 32U, 1U << -1, -1 << 1 are Undefined Behavior!"),
    { valign: "top" }
  );
  drawPillTag(g, 642, 192, "if (n < 8U && (reg & (1U << n))) ✓", PALETTE.sage.top);

  drawFlatCard(
    g,
    55,
    252,
    365,
    126,
    PALETTE.lavender.top,
    t("Bẫy 3: 1U chỉ chắc chắn >= 16 bit", "Trap 3: 1U Is Only Guaranteed >= 16-bit"),
    t("Thanh ghi 32-bit phải dùng UINT32_C(1) << pos, không dùng 1U", "32-bit registers need UINT32_C(1) << pos, not bare 1U"),
    { valign: "top" }
  );
  drawPillTag(g, 238, 352, "UINT32_C(3) << (2U * pin) ✓", PALETTE.sky.top);

  drawFlatCard(
    g,
    460,
    252,
    365,
    126,
    PALETTE.sky.top,
    t("Bẫy 4: Signed >> và printf sai định dạng", "Trap 4: Signed >> and Wrong printf Spec"),
    t("-4 >> 1 là implementation-defined; in uint32_t dùng PRIX32", "-4 >> 1 is implementation-defined; print uint32_t with PRIX32"),
    { valign: "top" }
  );
  drawPillTag(g, 642, 352, "printf(\"0x%08\" PRIX32, reg) ✓", PALETTE.paper.top);

  addWire(g, [[420, 155], [460, 155]], "#d38383", true, { markerEnd: true });
  addPacketTrack([[420, 155], [460, 155]], "#e57373", 1, 0.32, "guard");
}

function sceneBitwiseMcuHw(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    80,
    20,
    720,
    44,
    "var(--bg-elevated)",
    t("Từ RAM lên phần cứng thật: Race Condition (ISR), BSRR & Giải mã ADC", "From RAM to Real MCU: ISR Race, Atomic BSRR & ADC Decoding"),
    t("volatile KHÔNG làm reg |= mask thành thao tác nguyên tử!", "volatile does NOT make reg |= mask atomic!")
  );

  drawFlatCard(
    g,
    45,
    88,
    360,
    134,
    PALETTE.rose.top,
    t("NGUY HIỂM: Main & ISR cùng RMW (ODR |= ...)", "DANGER: Main & ISR Race on RMW (ODR |= ...)"),
    t("Main đọc ODR → ISR xen vào ghi bit 5 → Main ghi đè → MẤT cờ ISR!", "Main reads ODR → ISR sets bit 5 → Main writes stale value → ISR flag LOST!")
  );
  drawFlatCard(
    g,
    475,
    88,
    360,
    134,
    PALETTE.sage.top,
    t("AN TOÀN: Ghi nguyên tử STM32 BSRR ✓", "SAFE: Atomic STM32 BSRR Write ✓"),
    t("Set pin n: BSRR = 1U << n  |  Reset: BSRR = 1U << (n + 16) (không đọc cũ)", "Set pin n: BSRR = 1U << n  |  Reset: BSRR = 1U << (n + 16) (no read step)")
  );

  addWire(g, [[405, 155], [475, 155]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[405, 155], [475, 155]], "#84be88", 1, 0.34, "BSRR");

  drawFlatCard(
    g,
    55,
    254,
    770,
    138,
    PALETTE.sky.top,
    t("Ghép gói cảm biến theo giá trị số (không phụ thuộc Endian RAM)", "Decode Sensor Bytes Numerically (Endian-Independent)"),
    t("high = [S3..S0 | D11..D8], low = [D7..D0]  →  ((uint16_t)(high & 0x0FU) << 8U) | low", "high = [S3..S0 | D11..D8], low = [D7..D0]  →  ((uint16_t)(high & 0x0FU) << 8U) | low"),
    { valign: "top" }
  );
  drawPillTag(g, 215, 354, "high = 0xA3 → & 0x0F = 0x03", PALETTE.amber.top);
  drawPillTag(g, 455, 354, "<< 8 = 0x0300 | 0x5C", PALETTE.paper.top);
  drawPillTag(g, 680, 354, "ADC = 0x035C = 860 ✓", PALETTE.sage.top);
}

function sceneBitwiseLabFlow(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    80,
    20,
    720,
    44,
    "var(--bg-elevated)",
    t("Quy trình giải bài Bitwise Ngày 04: Yêu cầu → Mask → Biểu thức → assert", "Day-04 Bitwise Workflow: Requirement → Mask → Expression → assert"),
    t("Biên dịch chuẩn C17 trên Ubuntu WSL: gcc -std=c17 -Wall -Wextra -Wpedantic -Werror", "Compile with C17 on Ubuntu WSL: gcc -std=c17 -Wall -Wextra -Wpedantic -Werror")
  );

  drawIsoBlock(g, 125, 130, 104, 70, 22, "sky", t("1. Yêu cầu", "1. Spec"), "set / clear / field");
  drawIsoBlock(g, 330, 130, 104, 70, 22, "amber", t("2. Tạo Mask", "2. Mask"), "1U << n / _Msk");
  drawIsoBlock(g, 535, 130, 104, 70, 22, "lavender", t("3. Biểu thức", "3. Expr"), "& | ^ ~ + guard");
  drawIsoBlock(g, 740, 130, 104, 70, 22, "sage", t("4. Kiểm thử", "4. Verify"), "assert + biên");

  const pts = [
    [215, 175],
    [269, 175],
    [420, 175],
    [474, 175],
    [625, 175],
    [679, 175]
  ];
  addWire(g, [pts[0], pts[1]], "#84b4df", false, { markerEnd: true });
  addWire(g, [pts[2], pts[3]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [pts[4], pts[5]], "#84b684", false, { markerEnd: true });
  addPacketTrack([pts[0], pts[1]], "#84b4df", 1, 0.4, "spec");
  addPacketTrack([pts[2], pts[3]], "#f5d88b", 1, 0.4, "mask");
  addPacketTrack([pts[4], pts[5]], "#84be88", 1, 0.4, "pass");

  drawFlatCard(g, 55, 266, 180, 110, PALETTE.paper.top, t("Bài 1 (20đ)", "Ex 1 (20pts)"), t("set/clear/toggle/test + chặn bit >= 8", "set/clear/toggle/test + guard bit >= 8"));
  drawFlatCard(g, 250, 266, 180, 110, PALETTE.paper.top, t("Bài 2 (15đ)", "Ex 2 (15pts)"), t("should_sample(flags) lọc cờ cảm biến", "should_sample(flags) sensor gating"));
  drawFlatCard(g, 445, 266, 180, 110, PALETTE.paper.top, t("Bài 3 (25đ)", "Ex 3 (25pts)"), t("configure_mode() 16 pin GPIO 2-bit", "configure_mode() 16-pin 2-bit GPIO"));
  drawFlatCard(g, 640, 266, 185, 110, PALETTE.sage.top, t("Bài 4 (20đ) + Mini", "Ex 4 (20pts) + Mini"), t("decode_adc 12-bit, BSRR, LM75A, CRC-8", "12-bit decode_adc, BSRR, LM75A, CRC-8"));
}

export function registerBitwiseScenes(registerScene) {
  registerScene("bitwise_bits_hex", sceneBitwiseBitsHex);
  registerScene("bitwise_ops_grid", sceneBitwiseOpsGrid);
  registerScene("bitwise_mask_clear", sceneBitwiseMaskClear);
  registerScene("bitwise_flags_check", sceneBitwiseFlagsCheck);
  registerScene("bitwise_field_rmw", sceneBitwiseFieldRmw);
  registerScene("bitwise_c17_traps", sceneBitwiseC17Traps);
  registerScene("bitwise_mcu_hw", sceneBitwiseMcuHw);
  registerScene("bitwise_lab_flow", sceneBitwiseLabFlow);
}
