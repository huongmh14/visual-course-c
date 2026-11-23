/**
 * RequestAnimationFrame packet animator along piecewise linear SVG paths.
 */

export function interpolateTrack(points, t) {
  if (points.length < 2) return points[0];
  let totalLen = 0;
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    const dy = points[i + 1][1] - points[i][1];
    const len = Math.hypot(dx, dy);
    segs.push({ a: points[i], b: points[i + 1], len });
    totalLen += len;
  }
  let dist = (t % 1) * totalLen;
  for (const s of segs) {
    if (dist <= s.len || s === segs[segs.length - 1]) {
      const r = s.len === 0 ? 0 : dist / s.len;
      return [s.a[0] + (s.b[0] - s.a[0]) * r, s.a[1] + (s.b[1] - s.a[1]) * r];
    }
    dist -= s.len;
  }
  return points[points.length - 1];
}

export function createAnimator({ initialPlaying = true } = {}) {
  let playing = initialPlaying;
  let animTick = 0;
  let lastFrameTime = 0;
  let tracks = [];
  let rafId = null;

  function updatePositions() {
    for (const trk of tracks) {
      if (!trk.nodes) continue;
      trk.nodes.forEach((node, i) => {
        const offset = i / trk.count;
        const t = (animTick * trk.speed + offset) % 1;
        const [px, py] = interpolateTrack(trk.points, t);
        node.setAttribute("transform", `translate(${px.toFixed(1)}, ${py.toFixed(1)})`);
      });
    }
  }

  function tick(ts) {
    if (!lastFrameTime) lastFrameTime = ts;
    const dt = (ts - lastFrameTime) / 1000;
    lastFrameTime = ts;
    if (playing) {
      animTick += dt;
      updatePositions();
    }
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (typeof requestAnimationFrame !== "function" || rafId !== null) return;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      if (typeof cancelAnimationFrame === "function" && rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = null;
    },
    setTracks(nextTracks) {
      tracks = nextTracks;
      updatePositions();
    },
    updatePositions,
    resetTick() {
      animTick = 0;
    },
    replay() {
      animTick = 0;
      playing = true;
      updatePositions();
    },
    play() {
      playing = true;
    },
    pause() {
      playing = false;
    },
    toggle() {
      playing = !playing;
      return playing;
    },
    isPlaying() {
      return playing;
    }
  };
}
