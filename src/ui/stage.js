import { escHtml, lessonLabel } from "../core/formatters.js";

/**
 * Stateless renderers for the center stage (header, KPI strip, legend, timeline, upcoming overlay).
 */

export function renderStageHeader(dom, { mod, lesson, stepsCount, t }) {
  dom.breadcrumb.textContent = mod.title;
  dom.lessonTitle.textContent = lessonLabel(lesson, t);
  dom.lessonSubtitle.textContent = lesson.subtitle;
  dom.pillDuration.textContent = lesson.duration;
  dom.pillLevel.textContent = lesson.level;
  dom.pillSteps.textContent = `${stepsCount} ${t("bước", "steps")}`;
}

export function renderKpis(kpiStripEl, kpis) {
  kpiStripEl.classList.toggle("hidden", kpis.length === 0);
  kpiStripEl.innerHTML = kpis
    .map(
      (k) => `
      <div class="kpi-card ${k.tone ? "tone-" + k.tone : ""}">
        <div class="kpi-label">${escHtml(k.label)}</div>
        <div class="kpi-value">${escHtml(k.value)}</div>
        <div class="kpi-sub">${escHtml(k.sub)}</div>
      </div>`
    )
    .join("");
}

export function renderLegend(legendEl, legend) {
  legendEl.innerHTML = legend
    .map(
      (leg) => `
      <span class="legend-item">
        <span class="legend-dot" style="background:${leg.color}"></span>
        <span>${escHtml(leg.label)}</span>
      </span>`
    )
    .join("");
}

export function renderTimeline(dom, { lesson, activeStepIndex, visitedSteps, t, onSelectStep }) {
  const total = lesson.steps.length;
  const visited = new Set(visitedSteps[lesson.id] || []);
  dom.timelineCounter.textContent = `${t("Bước", "Step")} ${activeStepIndex + 1} / ${total}`;
  dom.timelineTrack.innerHTML = "";

  lesson.steps.forEach((step, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "timeline-node-wrap";

    const btn = document.createElement("button");
    const isAct = idx === activeStepIndex;
    const isVis = visited.has(idx);
    btn.className = `timeline-node${isAct ? " active" : isVis ? " visited" : ""}`;
    btn.textContent = String(idx + 1);
    btn.title = `${idx + 1}. ${step.title}`;
    btn.setAttribute("aria-label", btn.title);
    if (isAct) btn.setAttribute("aria-current", "step");
    btn.addEventListener("click", () => {
      onSelectStep(idx);
      const current = dom.timelineTrack.querySelector('[aria-current="step"]');
      if (current) current.focus();
    });
    wrap.appendChild(btn);

    if (idx < total - 1) {
      const line = document.createElement("div");
      line.className = `timeline-line${idx < activeStepIndex ? " filled" : ""}`;
      wrap.appendChild(line);
    }

    dom.timelineTrack.appendChild(wrap);
  });
}

export function showUpcomingOverlay(dom, { lesson, t }) {
  dom.upcomingOverlay.dataset.lessonId = lesson.id;
  dom.upcomingTitle.textContent = lessonLabel(lesson, t);
  dom.upcomingDesc.textContent = lesson.subtitle;
  dom.upcomingTopics.innerHTML = (lesson.topics || [])
    .map((topic) => `<span class="upcoming-topic-chip">${escHtml(topic)}</span>`)
    .join("");
  dom.upcomingOverlay.classList.remove("hidden");
}

const ARCHIFY_DIAGRAMS = {
  "c-control-flow": { file: "diagrams/c-fsm-lifecycle.html", vi: "Vòng đời FSM", en: "FSM Lifecycle" },
  "c-callbacks-fsm": { file: "diagrams/c-fsm-lifecycle.html", vi: "Vòng đời FSM", en: "FSM Lifecycle" },
  "c-modular-makefile": { file: "diagrams/c-firmware-pipeline.html", vi: "Luồng Firmware", en: "Firmware Pipeline" },
  "b05-volatile-storage": { file: "diagrams/c-firmware-pipeline.html", vi: "Luồng Firmware", en: "Firmware Pipeline" },
  "c-ringbuf-pool-misra": { file: "diagrams/c-firmware-pipeline.html", vi: "Luồng Firmware", en: "Firmware Pipeline" }
};

export function getArchifyDiagram(lessonId) {
  if (lessonId && lessonId.startsWith("e-")) {
    return {
      file: "diagrams/electronics-bench-architecture.html",
      vi: "Kiến trúc Điện tử Nhúng",
      en: "Electronics Bench Map"
    };
  }
  return (
    ARCHIFY_DIAGRAMS[lessonId] || {
      file: "diagrams/c-mcu-architecture.html",
      vi: "Kiến trúc STM32 & Bộ nhớ",
      en: "STM32 Memory & MMIO Map"
    }
  );
}

export function syncArchifyStage(dom, { lessonId, theme, mode, t }) {
  const isArchify = mode === "archify";
  const spec = getArchifyDiagram(lessonId);
  const embedSrc = `${spec.file}?embed=1&theme=${theme === "dark" ? "dark" : "light"}`;

  dom.btnViewStep.classList.toggle("active", !isArchify);
  dom.btnViewArchify.classList.toggle("active", isArchify);
  dom.btnArchifyExt.classList.toggle("hidden", !isArchify);
  dom.btnArchifyExt.href = `${spec.file}?theme=${theme === "dark" ? "dark" : "light"}`;

  dom.svgViewport.classList.toggle("hidden", isArchify);
  dom.archifyViewport.classList.toggle("hidden", !isArchify);
  dom.kpiStrip.classList.toggle("hidden", isArchify || dom.kpiStrip.children.length === 0);
  dom.packetLegend.classList.toggle("hidden", isArchify);
  dom.btnReplay.classList.toggle("hidden", isArchify);
  dom.btnPlayPause.classList.toggle("hidden", isArchify);

  if (isArchify) {
    if (dom.archifyFrame.dataset.loadedSrc !== embedSrc) {
      dom.archifyFrame.src = embedSrc;
      dom.archifyFrame.dataset.loadedSrc = embedSrc;
    }
    dom.archifyFrame.title = t(spec.vi, spec.en);
  }
}
