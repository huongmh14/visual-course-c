/**
 * Isometric & flat SVG drawing primitives for hardware diagrams.
 */

export const NS = "http://www.w3.org/2000/svg";

export const PALETTE = {
  sage: { top: "#c7e4c6", left: "#9ec99d", right: "#84b684" },
  amber: { top: "#fae4a7", left: "#e8ca78", right: "#d3b25a" },
  lavender: { top: "#e5dcf7", left: "#c7b8ea", right: "#ad9cd8" },
  rose: { top: "#f8cfcf", left: "#e7a5a5", right: "#d38383" },
  sky: { top: "#d4e8fa", left: "#a8cdee", right: "#84b4df" },
  paper: { top: "#faf7ef", left: "#e6decb", right: "#d5cbb5" },
  dark: { top: "#42403a", left: "#2d2b26", right: "#1f1e1a" }
};

export function svgEl(tag, attrs = {}, text = null) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, v);
  }
  if (text !== null) node.textContent = text;
  return node;
}

export function drawIsoBlock(parent, x, y, w, d, h, tone = "paper", title = "", sub = "") {
  const c = PALETTE[tone] || PALETTE.paper;
  const dx1 = w * 0.866;
  const dy1 = w * 0.5;
  const dx2 = d * 0.866;
  const dy2 = d * 0.5;

  const p0 = [x, y];
  const p1 = [x + dx1, y + dy1];
  const p2 = [x + dx1 - dx2, y + dy1 + dy2];
  const p3 = [x - dx2, y + dy2];

  const g = svgEl("g");
  const stroke = "var(--border)";

  g.appendChild(
    svgEl("polygon", {
      points: `${p0[0]},${p0[1]} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`,
      fill: c.top,
      stroke,
      "stroke-width": "1.6",
      "stroke-linejoin": "round"
    })
  );
  g.appendChild(
    svgEl("polygon", {
      points: `${p3[0]},${p3[1]} ${p2[0]},${p2[1]} ${p2[0]},${p2[1] + h} ${p3[0]},${p3[1] + h}`,
      fill: c.left,
      stroke,
      "stroke-width": "1.6",
      "stroke-linejoin": "round"
    })
  );
  g.appendChild(
    svgEl("polygon", {
      points: `${p2[0]},${p2[1]} ${p1[0]},${p1[1]} ${p1[0]},${p1[1] + h} ${p2[0]},${p2[1] + h}`,
      fill: c.right,
      stroke,
      "stroke-width": "1.6",
      "stroke-linejoin": "round"
    })
  );

  const cx = (p0[0] + p2[0]) / 2;
  const cy = (p0[1] + p2[1]) / 2;
  if (title) {
    g.appendChild(
      svgEl(
        "text",
        {
          x: cx,
          y: cy + (sub ? -3 : 4),
          "text-anchor": "middle",
          "font-size": "12",
          "font-weight": "700",
          fill: "#1c1b18"
        },
        title
      )
    );
  }
  if (sub) {
    g.appendChild(
      svgEl(
        "text",
        {
          x: cx,
          y: cy + 13,
          "text-anchor": "middle",
          "font-size": "10",
          "font-weight": "500",
          fill: "#3c3931"
        },
        sub
      )
    );
  }
  parent.appendChild(g);
  return { g, topCenter: [cx, cy], frontCorner: p2 };
}

export function drawPillTag(parent, x, y, text, bg = "var(--bg-elevated)", fg = "var(--ink)") {
  const w = Math.max(54, text.length * 7.2 + 16);
  const g = svgEl("g");
  g.appendChild(
    svgEl("rect", {
      x: x - w / 2,
      y: y - 11,
      width: w,
      height: 22,
      rx: 11,
      fill: bg,
      stroke: "var(--border)",
      "stroke-width": "1.3"
    })
  );
  g.appendChild(
    svgEl(
      "text",
      {
        x,
        y: y + 4,
        "text-anchor": "middle",
        "font-size": "11",
        "font-weight": "600",
        fill: fg
      },
      text
    )
  );
  parent.appendChild(g);
}

export function drawFlatCard(parent, x, y, w, h, fill, title, sub = "") {
  const g = svgEl("g");
  g.appendChild(
    svgEl("rect", {
      x: x + 2,
      y: y + 2,
      width: w,
      height: h,
      rx: 8,
      fill: "var(--border)"
    })
  );
  g.appendChild(
    svgEl("rect", {
      x,
      y,
      width: w,
      height: h,
      rx: 8,
      fill,
      stroke: "var(--border)",
      "stroke-width": "1.5"
    })
  );
  if (title) {
    g.appendChild(
      svgEl(
        "text",
        {
          x: x + w / 2,
          y: y + (sub ? 22 : h / 2 + 4),
          "text-anchor": "middle",
          "font-size": "12",
          "font-weight": "700",
          fill: fill.startsWith("var(") ? "var(--ink)" : "#1c1b18"
        },
        title
      )
    );
  }
  if (sub) {
    g.appendChild(
      svgEl(
        "text",
        {
          x: x + w / 2,
          y: y + 38,
          "text-anchor": "middle",
          "font-size": "10.5",
          fill: fill.startsWith("var(") ? "var(--ink-muted)" : "#3f3c33"
        },
        sub
      )
    );
  }
  parent.appendChild(g);
  return g;
}

export function addWire(parent, points, color = "var(--border)", dashed = false) {
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  parent.appendChild(
    svgEl("path", {
      d,
      fill: "none",
      stroke: color,
      "stroke-width": "2.2",
      "stroke-dasharray": dashed ? "6 4" : "none",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    })
  );
}
