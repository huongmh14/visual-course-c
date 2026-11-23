import { svgEl } from "./svg-primitives.js";

/**
 * Open-Closed Scene Plugin Registry.
 * New modules register diagram renderers without modifying the core renderer.
 */

const registry = new Map();

export function registerScene(type, renderFn) {
  registry.set(type, renderFn);
}

export function hasScene(type) {
  return registry.has(type);
}

export function listRegisteredScenes() {
  return Array.from(registry.keys());
}

export function renderScene(svg, scene, animator, ctx) {
  const { t, vertical = false } = ctx;
  svg.innerHTML = "";

  const labels = scene.nodes?.map(([title, value]) => `${title}: ${value}`);
  svg.setAttribute(
    "aria-label",
    labels?.join(". ") ||
      t("Mô phỏng bộ nhớ và dữ liệu vi điều khiển", "Microcontroller memory and data diagram")
  );
  svg.setAttribute(
    "viewBox",
    scene.type === "flow" ? (vertical ? "0 0 300 292" : "0 0 880 220") : "0 0 880 430"
  );

  const staticLayer = svgEl("g", { id: "scene-static" });
  const packetLayer = svgEl("g", { id: "scene-packets" });
  svg.appendChild(staticLayer);
  svg.appendChild(packetLayer);

  const tracks = [];
  const addPacketTrack = (points, color, count = 2, speed = 0.34, label = "") => {
    tracks.push({ points, color, count, speed, label });
  };

  const renderer = registry.get(scene.type) || registry.get("mcu_overview");
  if (renderer) {
    renderer(staticLayer, scene, { addPacketTrack, t, vertical });
  }

  for (const trk of tracks) {
    trk.nodes = [];
    for (let i = 0; i < trk.count; i++) {
      const g = svgEl("g");
      g.appendChild(
        svgEl("circle", {
          r: 6.5,
          fill: trk.color,
          stroke: "#1c1b18",
          "stroke-width": "1.5"
        })
      );
      if (trk.label) {
        g.appendChild(
          svgEl(
            "text",
            {
              y: -11,
              "text-anchor": "middle",
              "font-size": "9.5",
              "font-weight": "700",
              fill: "var(--ink)"
            },
            trk.label
          )
        );
      }
      packetLayer.appendChild(g);
      trk.nodes.push(g);
    }
  }

  animator.setTracks(tracks);
}
