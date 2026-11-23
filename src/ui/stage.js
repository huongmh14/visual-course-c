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
