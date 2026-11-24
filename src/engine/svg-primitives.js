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

let clipSeq = 0;

export function resetSvgIds() {
  clipSeq = 0;
}

export function svgEl(tag, attrs = {}, text = null) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, v);
  }
  if (text !== null) node.textContent = text;
  return node;
}

export function visualLength(str) {
  let count = 0;
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    if (cp > 0x2600 && (cp === 0x274c || cp === 0x2705 || cp >= 0x1f000)) {
      count += 2;
    } else {
      count += 1;
    }
  }
  return count;
}

function splitWordOnSlash(word, limit) {
  if (!word.includes("/") || visualLength(word) <= limit) return [word];
  const parts = word.split("/");
  const chunks = [];
  let cur = "";
  for (let i = 0; i < parts.length; i++) {
    const piece = i < parts.length - 1 ? `${parts[i]}/` : parts[i];
    if (!cur) {
      cur = piece;
    } else if (visualLength(cur) + visualLength(piece) <= limit) {
      cur += piece;
    } else {
      chunks.push(cur);
      cur = piece;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

function hardSplitToken(token, limit) {
  if (visualLength(token) <= limit) return [token];
  const out = [];
  let cur = "";
  for (const ch of token) {
    if (visualLength(cur + ch) > limit && cur) {
      out.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

export function wrapTextLines(text, maxChars) {
  if (text === null || text === undefined || text === "") return [];
  const limit = Math.max(4, Math.floor(maxChars));
  const rawLines = String(text).split(/\r?\n/);
  const result = [];

  for (const raw of rawLines) {
    if (raw.trim() === "") {
      result.push("");
      continue;
    }
    if (visualLength(raw) <= limit) {
      result.push(raw);
      continue;
    }

    const words = raw.trim().split(/\s+/);
    let current = "";
    for (const word of words) {
      const subParts =
        visualLength(word) > limit ? splitWordOnSlash(word, limit) : [word];
      for (const part of subParts) {
        const atomic =
          visualLength(part) > limit ? hardSplitToken(part, limit) : [part];
        for (const tok of atomic) {
          if (!current) {
            current = tok;
          } else if (visualLength(current) + 1 + visualLength(tok) <= limit) {
            current += ` ${tok}`;
          } else {
            result.push(current);
            current = tok;
          }
        }
      }
    }
    if (current) result.push(current);
  }
  return result;
}

export function appendWrappedText(parent, x, y, lines, attrs = {}) {
  const lineList = Array.isArray(lines) ? lines : wrapTextLines(lines, 1000);
  if (lineList.length === 0) return null;

  const { lineHeight: customLH, ...svgAttrs } = attrs;
  const fontSize = Number(svgAttrs["font-size"] || 11);
  const lh = customLH ?? Math.round(fontSize * 1.28 * 10) / 10;

  const textEl = svgEl("text", {
    x,
    y,
    "dominant-baseline": "alphabetic",
    ...svgAttrs
  });

  let pendingDy = 0;
  let hasPlaced = false;
  for (const line of lineList) {
    if (line === "") {
      pendingDy += lh;
      continue;
    }
    textEl.appendChild(
      svgEl(
        "tspan",
        {
          x,
          dy: String(hasPlaced ? lh + pendingDy : pendingDy)
        },
        line
      )
    );
    pendingDy = 0;
    hasPlaced = true;
  }

  parent.appendChild(textEl);
  return textEl;
}

function layoutTextBlock(w, h, title, sub, tiers, options = {}) {
  const {
    padX = 22,
    padY = 14,
    allowDivider = true,
    dividerMinH = 66,
    preferUnwrapped = false
  } = options;

  const usableW = Math.max(16, w - padX);
  const availH = Math.max(16, h - padY);
  const budget = (fontSize) => Math.max(4, Math.floor(usableW / (fontSize * 0.61)));
  const rawTitleLines = title ? String(title).split(/\r?\n/).length : 0;
  const rawSubLines = sub ? String(sub).split(/\r?\n/).length : 0;

  let firstFitting = null;
  let chosen = null;
  for (let idx = 0; idx < tiers.length; idx++) {
    const { titleSize, subSize } = tiers[idx];
    const titleLines = title ? wrapTextLines(title, budget(titleSize)) : [];
    const subLines = sub ? wrapTextLines(sub, budget(subSize)) : [];

    const titleLH = Math.round(titleSize * 1.26 * 10) / 10;
    const subLH = Math.round(subSize * 1.28 * 10) / 10;
    const hasBoth = titleLines.length > 0 && subLines.length > 0;
    const showDivider = allowDivider && hasBoth && h >= dividerMinH;

    const firstSize = titleLines.length ? titleSize : subSize;
    const lastSize = subLines.length ? subSize : titleSize;
    const cap = Math.round(firstSize * 0.74 * 10) / 10;
    const desc = Math.round(lastSize * 0.24 * 10) / 10;

    const titleSpan = titleLines.length > 1 ? (titleLines.length - 1) * titleLH : 0;
    const subSpan = subLines.length > 1 ? (subLines.length - 1) * subLH : 0;
    const titleToSubStep = hasBoth
      ? showDivider
        ? Math.round((titleSize * 0.22 + 9 + subSize * 0.74) * 10) / 10
        : Math.round((5.5 + subSize * 0.85) * 10) / 10
      : 0;

    const totalH = cap + titleSpan + titleToSubStep + subSpan + desc;
    const layout = {
      titleSize,
      subSize,
      titleLines,
      subLines,
      titleLH,
      subLH,
      showDivider,
      cap,
      titleSpan,
      titleToSubStep,
      totalH
    };
    chosen = layout;
    if (totalH <= availH) {
      if (!firstFitting) firstFitting = layout;
      const unwrapped =
        titleLines.length <= rawTitleLines && subLines.length <= rawSubLines;
      if (!preferUnwrapped || unwrapped) {
        return layout;
      }
    }
  }
  return firstFitting || chosen;
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

  if (title || sub) {
    const diamondW = (w + d) * 0.866;
    const maxTextW = Math.max(76, Math.round(diamondW * 0.54));
    const maxTextH = Math.max(36, Math.round((w + d) * 0.5 * 0.68));

    const layout = layoutTextBlock(
      maxTextW,
      maxTextH,
      title,
      sub,
      [
        { titleSize: 11, subSize: 9.5 },
        { titleSize: 10, subSize: 8.8 },
        { titleSize: 9.2, subSize: 8.2 }
      ],
      { padX: 6, padY: 4, allowDivider: false, preferUnwrapped: true }
    );

    const haloStyle = `paint-order: stroke; stroke: ${c.top}; stroke-width: 2.5px; stroke-linejoin: round;`;
    const firstBaseY = cy - layout.totalH / 2 + layout.cap;
    const lastTitleY = firstBaseY + layout.titleSpan;
    const subBaseY = layout.titleLines.length
      ? lastTitleY + layout.titleToSubStep
      : firstBaseY;

    if (layout.titleLines.length) {
      appendWrappedText(g, cx, firstBaseY, layout.titleLines, {
        "text-anchor": "middle",
        "font-size": String(layout.titleSize),
        "font-weight": "700",
        fill: "#1c1b18",
        style: haloStyle,
        lineHeight: layout.titleLH
      });
    }
    if (layout.subLines.length) {
      appendWrappedText(g, cx, subBaseY, layout.subLines, {
        "text-anchor": "middle",
        "font-size": String(layout.subSize),
        "font-weight": "500",
        fill: "#3a372f",
        style: haloStyle,
        lineHeight: layout.subLH
      });
    }
  }

  parent.appendChild(g);
  return { g, topCenter: [cx, cy], frontCorner: p2 };
}

export function drawPillTag(parent, x, y, text, bg = "var(--bg-elevated)", fg = null) {
  const w = Math.max(58, Math.ceil(visualLength(text) * 6.8 + 20));
  const cx = Math.max(10 + w / 2, Math.min(870 - w / 2, x));
  const textColor = fg || (bg.startsWith("var(") ? "var(--ink)" : "#1c1b18");

  const g = svgEl("g");
  g.appendChild(
    svgEl("rect", {
      x: cx - w / 2,
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
        x: cx,
        y: y + 4,
        "text-anchor": "middle",
        "font-size": "10.5",
        "font-weight": "600",
        fill: textColor
      },
      text
    )
  );
  parent.appendChild(g);
}

export function drawFlatCard(parent, x, y, w, h, fill, title, sub = "", options = {}) {
  const { valign = "center" } = options;
  const g = svgEl("g");

  const layoutTargetH = Math.max(h, title && sub ? 54 : h);
  const layout =
    title || sub
      ? layoutTextBlock(
          w,
          layoutTargetH,
          title,
          sub,
          [
            { titleSize: 11.5, subSize: 10 },
            { titleSize: 10.5, subSize: 9.3 },
            { titleSize: 9.8, subSize: 8.8 }
          ],
          { padX: 22, padY: 14, allowDivider: true, dividerMinH: 66 }
        )
      : null;

  const neededH = layout ? Math.ceil(layout.totalH + 14) : h;
  const finalH = Math.min(424 - y, Math.max(h, neededH));
  const finalY = y <= 24 && finalH > h ? Math.max(6, y - Math.floor((finalH - h) / 2)) : y;

  g.appendChild(
    svgEl("rect", {
      x: x + 2,
      y: finalY + 2,
      width: w,
      height: finalH,
      rx: 9,
      fill: "var(--border)"
    })
  );
  g.appendChild(
    svgEl("rect", {
      x,
      y: finalY,
      width: w,
      height: finalH,
      rx: 9,
      fill,
      stroke: "var(--border)",
      "stroke-width": "1.5"
    })
  );

  if (layout) {
    const clipId = `card-clip-${++clipSeq}`;
    const clip = svgEl("clipPath", { id: clipId });
    clip.appendChild(
      svgEl("rect", {
        x: x + 3,
        y: finalY + 2,
        width: Math.max(0, w - 6),
        height: Math.max(0, finalH - 4),
        rx: 7
      })
    );
    g.appendChild(clip);

    const textGroup = svgEl("g", { "clip-path": `url(#${clipId})` });
    const isCssVar = fill.startsWith("var(");
    const titleFill = isCssVar ? "var(--ink)" : "#1c1b18";
    const subFill = isCssVar ? "var(--ink-muted)" : "#3f3c33";
    const dividerStroke = isCssVar ? "var(--border-soft)" : "rgba(28, 27, 24, 0.16)";

    const topPad =
      valign === "top"
        ? 10
        : Math.max(7, (finalH - layout.totalH) / 2);

    const firstBaseY = finalY + topPad + layout.cap;
    const lastTitleY = firstBaseY + layout.titleSpan;
    const subBaseY = layout.titleLines.length
      ? lastTitleY + layout.titleToSubStep
      : firstBaseY;

    if (layout.titleLines.length) {
      appendWrappedText(textGroup, x + w / 2, firstBaseY, layout.titleLines, {
        "text-anchor": "middle",
        "font-size": String(layout.titleSize),
        "font-weight": "700",
        fill: titleFill,
        lineHeight: layout.titleLH
      });
    }

    if (layout.showDivider) {
      const dividerY = Math.round((lastTitleY + layout.titleSize * 0.22 + 4.5) * 10) / 10;
      textGroup.appendChild(
        svgEl("line", {
          x1: x + 12,
          y1: dividerY,
          x2: x + w - 12,
          y2: dividerY,
          stroke: dividerStroke,
          "stroke-width": "1"
        })
      );
    } else if (valign === "top" && layout.titleLines.length && !layout.subLines.length && finalH >= 100) {
      const dividerY = Math.round((lastTitleY + layout.titleSize * 0.22 + 7) * 10) / 10;
      textGroup.appendChild(
        svgEl("line", {
          x1: x + 12,
          y1: dividerY,
          x2: x + w - 12,
          y2: dividerY,
          stroke: dividerStroke,
          "stroke-width": "1"
        })
      );
    }

    if (layout.subLines.length) {
      appendWrappedText(textGroup, x + w / 2, subBaseY, layout.subLines, {
        "text-anchor": "middle",
        "font-size": String(layout.subSize),
        "font-weight": "500",
        fill: subFill,
        lineHeight: layout.subLH
      });
    }

    g.appendChild(textGroup);
  }

  parent.appendChild(g);
  return g;
}

export function addWire(parent, points, color = "var(--border)", dashed = false, options = {}) {
  const { markerEnd = false, strokeWidth = 2.2 } = options;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const attrs = {
    d,
    fill: "none",
    stroke: color,
    "stroke-width": String(strokeWidth),
    "stroke-dasharray": dashed ? "6 4" : "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  };
  if (markerEnd) {
    attrs["marker-end"] = typeof markerEnd === "string" ? markerEnd : "url(#arrow-head)";
  }
  parent.appendChild(svgEl("path", attrs));
}
