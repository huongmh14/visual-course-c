import { svgEl, resetSvgIds } from "./svg-primitives.js";

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

function trimTrackPoints(points, trimPx = 10) {
  if (!Array.isArray(points) || points.length < 2) return points;
  const pts = points.map(([x, y]) => [x, y]);
  const last = pts.length - 1;

  const dx1 = pts[1][0] - pts[0][0];
  const dy1 = pts[1][1] - pts[0][1];
  const len1 = Math.hypot(dx1, dy1);

  const dx2 = pts[last][0] - pts[last - 1][0];
  const dy2 = pts[last][1] - pts[last - 1][1];
  const len2 = Math.hypot(dx2, dy2);

  if (len1 > 36) {
    pts[0] = [
      Math.round((pts[0][0] + (dx1 / len1) * trimPx) * 10) / 10,
      Math.round((pts[0][1] + (dy1 / len1) * trimPx) * 10) / 10
    ];
  }
  if (len2 > 36) {
    pts[last] = [
      Math.round((pts[last][0] - (dx2 / len2) * trimPx) * 10) / 10,
      Math.round((pts[last][1] - (dy2 / len2) * trimPx) * 10) / 10
    ];
  }
  return pts;
}

export function renderScene(svg, scene, animator, ctx) {
  const { t, vertical = false } = ctx;
  svg.innerHTML = "";
  resetSvgIds();

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

  const defs = svgEl("defs");
  const marker = svgEl("marker", {
    id: "arrow-head",
    viewBox: "0 0 8 8",
    refX: "6.5",
    refY: "4",
    markerWidth: "5.5",
    markerHeight: "5.5",
    orient: "auto-start-reverse"
  });
  marker.appendChild(
    svgEl("path", {
      d: "M 0 0.8 L 7 4 L 0 7.2 z",
      fill: "context-stroke"
    })
  );
  defs.appendChild(marker);
  svg.appendChild(defs);

  const staticLayer = svgEl("g", { id: "scene-static" });
  const packetLayer = svgEl("g", { id: "scene-packets" });
  svg.appendChild(staticLayer);
  svg.appendChild(packetLayer);

  const tracks = [];
  const addPacketTrack = (points, color, count = 2, speed = 0.34, label = "") => {
    tracks.push({ points: trimTrackPoints(points), color, count, speed, label });
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
              fill: "var(--ink)",
              class: "packet-label",
              "paint-order": "stroke",
              stroke: "var(--bg-canvas)",
              "stroke-width": "4",
              "stroke-linejoin": "round"
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
