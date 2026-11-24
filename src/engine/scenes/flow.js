import { PALETTE, drawFlatCard, drawPillTag, addWire } from "../svg-primitives.js";

const FLOW_TONES = [
  PALETTE.sky.top,
  PALETTE.lavender.top,
  PALETTE.sage.top,
  PALETTE.amber.top
];

export function registerFlowScene(registerScene) {
  registerScene("flow", (staticLayer, scene, { addPacketTrack, t, vertical }) => {
    const nodes = scene.nodes || [];
    const count = nodes.length;
    if (count === 0) return;

    if (vertical) {
      const cardW = 248;
      const cardX = 26;
      const cardH = count >= 4 ? 58 : 68;
      const gap = count >= 4 ? 14 : 26;
      const totalH = count * cardH + (count - 1) * gap;
      const y0 = Math.max(10, Math.round((320 - totalH) / 2));

      nodes.forEach(([title, value], i) => {
        const y = y0 + i * (cardH + gap);
        if (i > 0) {
          const points = [
            [150, y - gap],
            [150, y - 2]
          ];
          addWire(staticLayer, points, "var(--border)", false, { markerEnd: true });
          addPacketTrack(points, "#84be88", 1, 0.36);
        }
        const card = drawFlatCard(
          staticLayer,
          cardX,
          y,
          cardW,
          cardH,
          FLOW_TONES[i % FLOW_TONES.length],
          `${String(i + 1).padStart(2, "0")} · ${title}`,
          value
        );
        card.classList.add("lesson-flow-node");
      });
      return;
    }

    if (scene.header) {
      drawFlatCard(staticLayer, 50, 14, 780, 48, "var(--bg-elevated)", scene.header, scene.subheader || "");
    }

    let cardW = 240;
    let gap = 38;
    if (count === 2) {
      cardW = 336;
      gap = 80;
    } else if (count === 3) {
      cardW = 240;
      gap = 38;
    } else if (count === 4) {
      cardW = 188;
      gap = 22;
    } else if (count > 4) {
      gap = 16;
      cardW = Math.max(120, Math.floor((832 - gap * (count - 1)) / count));
    } else if (count === 1) {
      cardW = 360;
      gap = 0;
    }

    const totalW = count * cardW + Math.max(0, count - 1) * gap;
    const x0 = Math.round((880 - totalW) / 2);
    const y = scene.header ? 112 : 76;
    const h = 132;

    nodes.forEach(([title, value], i) => {
      const x = x0 + i * (cardW + gap);
      const tone = FLOW_TONES[i % FLOW_TONES.length];
      if (i > 0) {
        const points = [
          [x - gap, y + h / 2],
          [x - 2, y + h / 2]
        ];
        addWire(staticLayer, points, "var(--border)", false, { markerEnd: true });
        addPacketTrack(points, "#84be88", 1, 0.34);
      }

      drawPillTag(
        staticLayer,
        x + cardW / 2,
        y - 22,
        String(i + 1).padStart(2, "0"),
        tone,
        "#1c1b18"
      );
      addWire(
        staticLayer,
        [
          [x + cardW / 2, y - 11],
          [x + cardW / 2, y]
        ],
        "var(--border)"
      );

      const card = drawFlatCard(staticLayer, x, y, cardW, h, tone, title, value);
      card.classList.add("lesson-flow-node");
    });

    drawPillTag(
      staticLayer,
      440,
      y + h + 28,
      t("Theo dõi luồng dữ liệu qua từng chặng từ trái sang phải", "Follow data transformations step by step from left to right"),
      "var(--bg-elevated)"
    );
  });
}
