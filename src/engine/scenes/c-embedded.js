import {
  PALETTE,
  svgEl,
  drawIsoBlock,
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

function sceneConvPromotionTrap(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    46,
    "var(--bg-elevated)",
    t(
      "Chuyển đổi kiểu ngầm C17: So sánh Signed/Unsigned & Thu hẹp 8-bit",
      "C17 Implicit Conversions: Signed/Unsigned Promotion & 8-bit Narrowing"
    ),
    t(
      "C nâng kiểu toán hạng trước khi tính biểu thức, rồi mới cắt gọn khi gán vào biến đích",
      "C promotes operands before evaluating, then narrows only on final assignment"
    )
  );

  // Top track: -1 < 1U trap
  drawFlatCard(
    g,
    40,
    80,
    190,
    92,
    PALETTE.sky.top,
    "int a = -1;",
    "0xFFFFFFFF (signed)\nuint32_t b = 1U;"
  );

  drawFlatCard(
    g,
    295,
    80,
    265,
    92,
    PALETTE.amber.top,
    t("Nâng hạng: int → unsigned int", "Usual Conversion: int → unsigned"),
    "-1  →  0xFFFFFFFFU\n4,294,967,295U < 1U ?"
  );

  drawFlatCard(
    g,
    625,
    80,
    215,
    92,
    PALETTE.rose.top,
    t("KẾT QUẢ: 0 (FALSE) !", "RESULT: 0 (FALSE) !"),
    t("4.29B < 1 là SAI ngầm!\nSửa: khớp kiểu signed", "4.29B < 1 is FALSE!\nFix: match signedness")
  );

  addWire(g, [[230, 126], [295, 126]], "#d38383", false, { markerEnd: true });
  addWire(g, [[560, 126], [625, 126]], "#d38383", false, { markerEnd: true });
  addPacketTrack([[230, 126], [295, 126]], "#e57373", 1, 0.36, "int→uint");
  addPacketTrack([[560, 126], [625, 126]], "#e57373", 1, 0.36, "0 (false)");

  drawPillTag(
    g,
    440,
    196,
    t(
      "Bật -Wsign-compare: KHÔNG trộn signed & unsigned trong phép so sánh",
      "-Wsign-compare: NEVER mix signed & unsigned in comparisons"
    ),
    PALETTE.rose.top,
    "#1c1b18"
  );

  // Bottom track: uint8_t(250) + uint8_t(10)
  drawFlatCard(
    g,
    40,
    232,
    190,
    100,
    PALETTE.paper.top,
    "uint8_t x = 250, y = 10;",
    t("Hẹp hơn int (32-bit)\nuint8_t sum = x + y;", "Narrower than int\nuint8_t sum = x + y;")
  );

  drawFlatCard(
    g,
    295,
    232,
    265,
    100,
    PALETTE.amber.top,
    t("Integer Promotion → int", "Integer Promotion → int"),
    t("(int)250 + (int)10 = 260\n0x0104 (chưa tràn ở int)", "(int)250 + (int)10 = 260\n0x0104 (no overflow in int)")
  );

  drawFlatCard(
    g,
    625,
    232,
    215,
    100,
    PALETTE.sage.top,
    t("Gán uint8_t (mod 256)", "Narrow uint8_t (mod 256)"),
    t("0x0104 & 0xFF = 4\nMất bit 8! Cần u16", "0x0104 & 0xFF = 4\nBit 8 dropped! Use u16")
  );

  addWire(g, [[230, 282], [295, 282]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[560, 282], [625, 282]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[230, 282], [295, 282]], "#f5d88b", 1, 0.36, "int 260");
  addPacketTrack([[560, 282], [625, 282]], "#84be88", 1, 0.36, "u8 = 4");

  drawPillTag(
    g,
    440,
    368,
    t(
      "An toàn: uint16_t sum = (uint16_t)x + y;  →  260 (không mất bit) ✓",
      "Safe: uint16_t sum = (uint16_t)x + y;  →  260 (lossless) ✓"
    ),
    PALETTE.sage.top,
    "#1c1b18"
  );
}

function sceneConvTimerWrap(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "Tràn bộ đếm 16-bit (Timer Rollover): Trừ Modulo an toàn 100%",
      "16-bit Timer Rollover: Wrap-Safe Unsigned Subtraction"
    ),
    t(
      "KHÔNG dùng if (now >= start + 20) — sẽ kẹt hoặc kích sai khi vượt mốc 0xFFFF!",
      "NEVER write if (now >= start + 20) — breaks across 0xFFFF rollover!"
    )
  );

  // Left: 16-bit timer ring
  const cx = 220;
  const cy = 235;
  const r = 104;

  g.appendChild(
    svgEl("circle", {
      cx,
      cy,
      r,
      fill: "none",
      stroke: "var(--border)",
      "stroke-width": "18"
    })
  );

  const ptAt = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  const startPt = ptAt(-135);
  const nowPt = ptAt(-45);
  g.appendChild(
    svgEl("path", {
      d: `M ${startPt[0].toFixed(1)} ${startPt[1].toFixed(1)} A ${r} ${r} 0 0 1 ${nowPt[0].toFixed(1)} ${nowPt[1].toFixed(1)}`,
      fill: "none",
      stroke: "#84b684",
      "stroke-width": "18",
      "stroke-linecap": "round"
    })
  );

  drawPillTag(g, 220, 86, "0xFFFF → 0x0000", PALETTE.amber.top, "#1c1b18");

  g.appendChild(
    svgEl("circle", {
      cx: startPt[0],
      cy: startPt[1],
      r: 7,
      fill: "#e8ca78",
      stroke: "#1c1b18",
      "stroke-width": "1.6"
    })
  );
  drawLabel(g, 130, 165, "start = 0xFFF0", {
    size: 11,
    weight: 700,
    anchor: "end",
    fill: "var(--ink)"
  });

  g.appendChild(
    svgEl("circle", {
      cx: nowPt[0],
      cy: nowPt[1],
      r: 7,
      fill: "#84b4df",
      stroke: "#1c1b18",
      "stroke-width": "1.6"
    })
  );
  drawLabel(g, 310, 184, "now = 0x0005", {
    size: 11,
    weight: 700,
    anchor: "start",
    fill: "var(--ink)"
  });

  drawLabel(g, cx, cy - 12, "TIMx->CNT", { size: 13, weight: 700, fill: "var(--ink)" });
  drawLabel(g, cx, cy + 6, "0x0000 .. 0xFFFF", { size: 10.5 });
  drawLabel(g, cx, cy + 24, t("Vòng 65,536 tick", "65,536-tick ring"), { size: 10.5 });
  drawLabel(g, cx, 366, "0x8000 (half: 32,768)", { size: 10 });

  drawPillTag(
    g,
    220,
    396,
    t("Điều kiện: interval < 32,768 ticks", "Invariant: interval < 32,768 ticks"),
    PALETTE.paper.top,
    "#1c1b18"
  );

  const arcPoints = [-135, -120, -105, -90, -75, -60, -45].map(ptAt);
  addPacketTrack(arcPoints, "#84be88", 1, 0.36, "+21");

  // Right: modular subtraction -> comparator -> bug card
  drawFlatCard(
    g,
    425,
    86,
    415,
    94,
    PALETTE.sky.top,
    t("1. Phép trừ Unsigned 16-bit (mod 2¹⁶)", "1. 16-bit Unsigned Subtraction (mod 2¹⁶)"),
    "(uint16_t)(0x0005U - 0xFFF0U) = 0x0015 = 21\n0xFFF0→0xFFFF (16) + 0x0005 (5) = 21 ticks ✓"
  );

  drawFlatCard(
    g,
    425,
    202,
    415,
    90,
    PALETTE.sage.top,
    t("2. Bộ so sánh Timeout (elapsed >= 20)", "2. Timeout Comparator (elapsed >= 20)"),
    t("(uint16_t)(now - start) >= 20U → 21 >= 20 → TRUE ✓\nChuẩn 100% khi tràn qua 0xFFFF → 0x0000", "(uint16_t)(now - start) >= 20U → 21 >= 20 → TRUE ✓\nZero glitch across 0xFFFF → 0x0000")
  );

  drawFlatCard(
    g,
    425,
    312,
    415,
    92,
    PALETTE.rose.top,
    t("BẪY CỔ ĐIỂN: if (now >= deadline) ← SAI!", "CLASSIC BUG: if (now >= deadline) ← FAILS!"),
    t("deadline = (uint16_t)(0xFFF0 + 20) = 0x0004\nTại 0xFFF1 > 0x0004 → kích timeout SỚM!", "deadline = (uint16_t)(0xFFF0 + 20) = 0x0004\nAt 0xFFF1 > 0x0004 → fires PREMATURELY!")
  );

  addWire(g, [[324, 235], [425, 235]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[324, 235], [425, 235]], "#84be88", 1, 0.36, "21 ticks");
}

function sceneModularBuildDag(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "Chuỗi Build C mô-đun: Header → Biên dịch (-MMD -MP) → Linker → Flash / SRAM",
      "Modular C Build DAG: Headers → Compile (-MMD -MP) → Link → Flash / SRAM"
    ),
    t(
      "File .d giúp Make chỉ build lại đúng .c bị ảnh hưởng khi sửa một file .h",
      "Auto-generated .d dependency files recompile only .c units affected by a .h edit"
    )
  );

  // Col 1: .h and .c units
  drawFlatCard(
    g,
    32,
    86,
    168,
    96,
    PALETTE.lavender.top,
    "sensor.h",
    t("#ifndef SENSOR_H\n#define SENSOR_H\nKhai báo API & type", "#ifndef SENSOR_H\n#define SENSOR_H\nPublic API & types")
  );

  drawFlatCard(
    g,
    32,
    206,
    168,
    82,
    PALETTE.sky.top,
    "sensor.c",
    t('#include "sensor.h"\nHàm + biến static', '#include "sensor.h"\nImpl + static state')
  );

  drawFlatCard(
    g,
    32,
    308,
    168,
    78,
    PALETTE.sky.top,
    "main.c",
    t('#include "sensor.h"\nmain() gọi sensor', '#include "sensor.h"\nmain() calls API')
  );

  // Col 2: gcc -c -MMD -MP -> .o + .d
  drawPillTag(g, 360, 86, "gcc -std=c17 -c -MMD -MP", PALETTE.amber.top, "#1c1b18");

  drawFlatCard(
    g,
    265,
    118,
    190,
    110,
    PALETTE.paper.top,
    "sensor.o + sensor.d",
    t("Mã máy + đồ thị .h\n.text  .data  .bss\nsensor.o: sensor.c .h", "Object + header deps\n.text  .data  .bss\nsensor.o: sensor.c .h")
  );

  drawFlatCard(
    g,
    265,
    266,
    190,
    110,
    PALETTE.paper.top,
    "main.o + main.d",
    t("Chờ giải quyết symbol\nmain.o: main.c sensor.h\nU sensor_read", "Unresolved externals\nmain.o: main.c sensor.h\nU sensor_read")
  );

  // Col 3: Linker
  drawIsoBlock(g, 568, 180, 108, 76, 24, "amber", "Linker (ld)", "firmware.elf");

  // Col 4: Flash & SRAM
  drawFlatCard(
    g,
    710,
    96,
    144,
    128,
    PALETTE.lavender.top,
    "FLASH (ROM)",
    "0x0800_0000\n.text (code)\n.rodata (const)\n+ .data init"
  );

  drawFlatCard(
    g,
    710,
    256,
    144,
    124,
    PALETTE.sage.top,
    "SRAM (RAM)",
    "0x2000_0000\n.data (init != 0)\n.bss  (zeroed)\nstack / static"
  );

  // Wires
  addWire(g, [[200, 134], [265, 164]], "#ad9cd8", true, { markerEnd: true });
  addWire(g, [[200, 134], [265, 310]], "#ad9cd8", true, { markerEnd: true });
  addWire(g, [[200, 247], [232, 247], [232, 182], [265, 182]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[200, 347], [232, 347], [232, 322], [265, 322]], "#84b4df", false, { markerEnd: true });

  addWire(g, [[455, 173], [504, 218]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[455, 321], [504, 244]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[660, 218], [710, 160]], "#ad9cd8", false, { markerEnd: true });
  addWire(g, [[660, 244], [710, 318]], "#84b684", false, { markerEnd: true });

  addPacketTrack([[200, 247], [232, 247], [232, 182], [265, 182]], "#84b4df", 1, 0.34, ".o/.d");
  addPacketTrack([[455, 173], [504, 218]], "#f5d88b", 1, 0.38, "link");
  addPacketTrack([[660, 218], [710, 160]], "#c7b8ea", 1, 0.36, ".text");
  addPacketTrack([[660, 244], [710, 318]], "#84be88", 1, 0.36, ".bss");

  drawPillTag(
    g,
    440,
    405,
    t(
      "arm-none-eabi-size firmware.elf  →  kiểm tra Flash/RAM ngay sau khi Link",
      "arm-none-eabi-size firmware.elf  →  verify Flash/SRAM usage post-link"
    ),
    PALETTE.paper.top,
    "#1c1b18"
  );
}

function sceneFsmCallbackTable(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "FSM dạng Bảng & Callback Con trỏ hàm (Event-Driven Firmware)",
      "Table-Driven FSM & Function-Pointer Callback Dispatch"
    ),
    t(
      "Tách lớp phần cứng bằng callback cb(evt, ctx) và chuyển trạng thái O(1) qua table[STATE][EVT]",
      "Decouple HAL IRQ via cb(evt, void *ctx) and dispatch transitions in O(1) via table[STATE][EVT]"
    )
  );

  // Top pipeline
  drawFlatCard(
    g,
    40,
    74,
    210,
    92,
    PALETTE.sky.top,
    t("1. Ngắt / Sự kiện (IRQ)", "1. Peripheral IRQ / Event"),
    "EXTI / Keypad / Timer\nevt = KEY_DIGIT / PIN_OK"
  );

  drawFlatCard(
    g,
    315,
    74,
    250,
    92,
    PALETTE.amber.top,
    "2. Callback Dispatch",
    "typedef void (*cb_t)(evt, void *ctx);\nif (cb) cb(evt, ctx);"
  );

  drawFlatCard(
    g,
    630,
    74,
    210,
    92,
    PALETTE.lavender.top,
    t("3. Tra bảng O(1)", "3. O(1) Table Lookup"),
    "next = table[state][evt];\nstate = next; action(ctx);"
  );

  addWire(g, [[250, 120], [315, 120]], "#84b4df", false, { markerEnd: true });
  addWire(g, [[565, 120], [630, 120]], "#d3b25a", false, { markerEnd: true });
  addPacketTrack([[250, 120], [315, 120]], "#84b4df", 1, 0.38, "IRQ");
  addPacketTrack([[565, 120], [630, 120]], "#f5d88b", 1, 0.38, "cb(evt)");

  // Bottom-Left: 2D State Transition Table
  drawFlatCard(
    g,
    40,
    190,
    412,
    216,
    "var(--bg-elevated)",
    t("Bảng chuyển trạng thái table[STATE][EVT]", "2D State Table table[STATE][EVT]"),
    "",
    { valign: "top" }
  );

  const cols = ["STATE \\ EVT", "KEY_DIGIT", "PIN_OK", "3×_FAIL"];
  const rows = [
    ["LOCKED", "→ ENTERING", "—", "—"],
    ["ENTERING", "ENTERING", "→ UNLOCKED", "→ LOCKOUT"],
    ["UNLOCKED", "—", "→ LOCKED", "—"],
    ["LOCKOUT", "—", "—", "TMR→LOCKED"]
  ];
  const cellColors = {
    "→ ENTERING": PALETTE.amber.top,
    "→ UNLOCKED": PALETTE.sage.top,
    "→ LOCKOUT": PALETTE.rose.top,
    "TMR→LOCKED": PALETTE.sky.top
  };

  const tx = 50;
  const ty = 224;
  const colW = 98;
  const rowH = 33;

  cols.forEach((col, cIdx) => {
    const cx = tx + cIdx * colW;
    g.appendChild(
      svgEl("rect", {
        x: cx,
        y: ty,
        width: colW,
        height: rowH,
        fill: PALETTE.paper.top,
        stroke: "var(--border)",
        "stroke-width": "1.2"
      })
    );
    drawLabel(g, cx + colW / 2, ty + 20, col, { size: 9.5, weight: 700, fill: "#1c1b18" });
  });

  rows.forEach((row, rIdx) => {
    const ry = ty + (rIdx + 1) * rowH;
    row.forEach((val, cIdx) => {
      const cx = tx + cIdx * colW;
      const bg =
        cIdx === 0 ? PALETTE.paper.top : cellColors[val] || "var(--bg-elevated)";
      const fg = bg.startsWith("var(") ? "var(--ink-muted)" : "#1c1b18";
      g.appendChild(
        svgEl("rect", {
          x: cx,
          y: ry,
          width: colW,
          height: rowH,
          fill: bg,
          stroke: "var(--border)",
          "stroke-width": "1.1"
        })
      );
      drawLabel(g, cx + colW / 2, ry + 20, val, {
        size: 9.5,
        weight: cIdx === 0 || cellColors[val] ? 700 : 500,
        fill: fg
      });
    });
  });

  // Bottom-Right: Runtime State Graph
  drawFlatCard(
    g,
    472,
    190,
    370,
    216,
    "var(--bg-elevated)",
    t("Luồng chuyển trạng thái thực thi", "Runtime State Transitions"),
    "",
    { valign: "top" }
  );

  drawFlatCard(g, 490, 232, 128, 46, PALETTE.paper.top, "LOCKED", "idle / lock=1");
  drawFlatCard(g, 684, 232, 140, 46, PALETTE.amber.top, "ENTERING", "tries < 3");
  drawFlatCard(g, 490, 344, 128, 46, PALETTE.sage.top, "UNLOCKED", "relay ON ✓");
  drawFlatCard(g, 684, 344, 140, 46, PALETTE.rose.top, "LOCKOUT", "5s cooldown");

  addWire(g, [[618, 255], [684, 255]], "#d3b25a", false, { markerEnd: true });
  addWire(g, [[684, 268], [618, 354]], "#84b684", false, { markerEnd: true });
  addWire(g, [[754, 278], [754, 344]], "#d38383", false, { markerEnd: true });

  addPacketTrack([[618, 255], [684, 255]], "#f5d88b", 1, 0.36, "digit");
  addPacketTrack([[684, 268], [618, 354]], "#84be88", 1, 0.36, "OK");
  addPacketTrack([[754, 278], [754, 344]], "#e57373", 1, 0.34, "fail");
}

function sceneRingbufStaticPool(g, _scene, { addPacketTrack, t }) {
  drawFlatCard(
    g,
    40,
    14,
    800,
    44,
    "var(--bg-elevated)",
    t(
      "Ring Buffer UART & Pool bộ nhớ tĩnh O(1) — Tuyệt đối không malloc()",
      "Lock-Free UART Ring Buffer & Static O(1) Memory Pool — Zero malloc()"
    ),
    t(
      "SPSC không cần khóa giữa ISR và main; pool khối cố định cho WCET xác định 100%",
      "Single-producer/consumer ISR→main queue; fixed-block pool prevents heap fragmentation"
    )
  );

  // Left: 8-slot circular ring buffer
  drawFlatCard(
    g,
    32,
    74,
    396,
    308,
    "var(--bg-elevated)",
    t("Ring Buffer 8 ô (N = 2³ → mask = & 7)", "8-Slot Circular Buffer (N = 2³ → & 7)"),
    t("head chỉ ISR ghi  |  tail chỉ main đọc", "ISR writes head  |  main reads tail"),
    { valign: "top" }
  );

  const cx = 236;
  const cy = 248;
  const r = 78;
  g.appendChild(
    svgEl("circle", {
      cx,
      cy,
      r,
      fill: "none",
      stroke: "var(--border)",
      "stroke-width": "2",
      "stroke-dasharray": "5 4"
    })
  );

  const slotData = ["", "'A'", "'T'", "'\\r'", "", "", "", ""];
  for (let i = 0; i < 8; i++) {
    const rad = ((-90 + i * 45) * Math.PI) / 180;
    const sx = cx + r * Math.cos(rad);
    const sy = cy + r * Math.sin(rad);
    const active = slotData[i] !== "";
    const fill = i === 0 ? PALETTE.sage.top : i === 4 ? PALETTE.amber.top : active ? PALETTE.sky.top : PALETTE.paper.top;

    g.appendChild(
      svgEl("rect", {
        x: sx - 22,
        y: sy - 15,
        width: 44,
        height: 30,
        rx: 6,
        fill,
        stroke: "var(--border)",
        "stroke-width": "1.4"
      })
    );
    drawLabel(g, sx, sy - 2, `[${i}]`, { size: 9, weight: 700, fill: "#3f3c33" });
    drawLabel(g, sx, sy + 10, active ? slotData[i] : i === 0 ? "tail" : i === 4 ? "head" : "—", {
      size: 9.5,
      weight: 700,
      fill: "#1c1b18"
    });
  }

  drawLabel(g, cx, cy - 6, "(idx + 1) & 7", { size: 11, weight: 700, fill: "var(--ink)" });
  drawLabel(g, cx, cy + 12, "Empty: head == tail", { size: 9.5 });

  drawPillTag(g, 88, 154, "main (tail)", PALETTE.sage.top, "#1c1b18");
  drawPillTag(g, 88, 344, "ISR (head)", PALETTE.amber.top, "#1c1b18");

  addWire(g, [[214, 166], [138, 154]], "#84b684", false, { markerEnd: true });
  addWire(g, [[138, 344], [214, 328]], "#d3b25a", false, { markerEnd: true });
  addPacketTrack([[214, 166], [138, 154]], "#84be88", 1, 0.36, "pop");
  addPacketTrack([[138, 344], [214, 328]], "#f5d88b", 1, 0.36, "push");

  // Right Top: Static Memory Pool
  drawFlatCard(
    g,
    452,
    74,
    396,
    208,
    "var(--bg-elevated)",
    t("Static Memory Pool (Khối cố định 32B)", "Static Memory Pool (Fixed 32B Blocks)"),
    t("Free list O(1): alloc()/free() không phân mảnh RAM", "O(1) free list: deterministic, zero fragmentation"),
    { valign: "top" }
  );

  drawFlatCard(g, 472, 134, 170, 48, PALETTE.sky.top, "Blk #0 (USED)", "UART RX frame");
  drawFlatCard(g, 658, 134, 170, 48, PALETTE.sage.top, "Blk #1 (FREE)", "next → #3");
  drawFlatCard(g, 472, 192, 170, 48, PALETTE.sky.top, "Blk #2 (USED)", "CAN TX payload");
  drawFlatCard(g, 658, 192, 170, 48, PALETTE.sage.top, "Blk #3 (FREE)", "next → NULL");

  drawPillTag(g, 558, 260, "free_head → #1 → #3", PALETTE.amber.top, "#1c1b18");
  addWire(g, [[640, 260], [743, 260], [743, 240]], "#84b684", false, { markerEnd: true });
  addPacketTrack([[640, 260], [743, 260], [743, 240]], "#84be88", 1, 0.38, "O(1)");

  // Right Bottom: MISRA Gate Badge
  drawFlatCard(
    g,
    452,
    294,
    396,
    88,
    PALETTE.rose.top,
    t("Cổng kiểm soát MISRA-C & An toàn Embedded", "MISRA-C & Embedded Safety Gate"),
    t("Kiểm tra tĩnh bắt buộc trước khi build Firmware", "Mandatory compile-time rules before flashing"),
    { valign: "top" }
  );
  drawPillTag(g, 520, 360, "No malloc", PALETTE.paper.top, "#1c1b18");
  drawPillTag(g, 650, 360, "No recursion", PALETTE.paper.top, "#1c1b18");
  drawPillTag(g, 778, 360, "-Werror", PALETTE.sage.top, "#1c1b18");

  drawPillTag(
    g,
    440,
    404,
    t(
      "WCET xác định 100% — Không bao giờ Out-of-Memory bất ngờ lúc chạy",
      "100% Deterministic WCET — Zero runtime OOM or heap fragmentation"
    ),
    PALETTE.sage.top,
    "#1c1b18"
  );
}

export function registerCEmbeddedScenes(register) {
  register("conv_promotion_trap", sceneConvPromotionTrap);
  register("conv_timer_wrap", sceneConvTimerWrap);
  register("modular_build_dag", sceneModularBuildDag);
  register("fsm_callback_table", sceneFsmCallbackTable);
  register("ringbuf_static_pool", sceneRingbufStaticPool);
}
