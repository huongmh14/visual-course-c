import { PALETTE, drawFlatCard, addWire } from "../svg-primitives.js";

export function registerFlowScene(registerScene) {
  registerScene("flow", (staticLayer, scene, { addPacketTrack, vertical }) => {
    scene.nodes.forEach(([title, value], i) => {
      const x = vertical ? 45 : 66 + i * 254;
      const y = vertical ? 22 + i * 96 : 82;
      if (i > 0) {
        const points = vertical
          ? [[150, y - 40], [150, y]]
          : [[x - 44, y + 28], [x, y + 28]];
        addWire(staticLayer, points);
        addPacketTrack(points, "#84be88", 1);
      }
      const card = drawFlatCard(
        staticLayer,
        x,
        y,
        210,
        56,
        [PALETTE.sky.top, PALETTE.lavender.top, PALETTE.sage.top][i],
        title,
        value
      );
      card.classList.add("lesson-flow-node");
    });
  });
}
