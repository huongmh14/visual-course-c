import { escHtml } from "../core/formatters.js";

/**
 * Stateless renderer for the left Course Tree and Progress breakdown drawer.
 */

export function renderProgress(
  { progressRatio, progressFill, progressBreakdown },
  { course, availableLessons, completedLessons }
) {
  const total = availableLessons.length;
  const done = availableLessons.filter((lesson) => completedLessons.includes(lesson.id)).length;
  progressRatio.textContent = `${done} / ${total}`;
  progressFill.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;

  progressBreakdown.innerHTML = course.modules
    .filter((m) => m.lessons.some((l) => !l.locked))
    .map((m) => {
      const ready = m.lessons.filter((l) => !l.locked);
      const count = ready.filter((l) => completedLessons.includes(l.id)).length;
      return `<div class="progress-row"><span>${escHtml(m.title)}</span><span>${count}/${ready.length}</span></div>`;
    })
    .join("");
}

export function renderCourseTree(
  dom,
  { course, activeLessonId, completedLessons, totalCount, t, onSelectLesson, onShowUpcoming }
) {
  dom.courseCount.textContent = `${totalCount} ${t("bài", "lessons")}`;
  dom.courseTree.innerHTML = "";

  course.modules.forEach((mod) => {
    const wrap = document.createElement("div");
    wrap.className = "module-group";

    const completedInMod = mod.lessons.filter((l) => completedLessons.includes(l.id)).length;
    const modBtn = document.createElement("button");
    modBtn.className = "module-btn";
    modBtn.innerHTML = `
      <span class="module-btn-left">
        <span class="folder-dot" style="background:${mod.color}"></span>
        <span class="module-title-text">${escHtml(mod.title)}</span>
      </span>
      <span class="module-count">${completedInMod}/${mod.lessons.length}</span>
    `;

    const list = document.createElement("ul");
    list.className = "module-lessons";

    modBtn.addEventListener("click", () => {
      list.classList.toggle("hidden");
    });

    mod.lessons.forEach((lesson) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      const isActive = lesson.id === activeLessonId && !lesson.locked;
      const isDone = completedLessons.includes(lesson.id);
      btn.className = `lesson-item-btn${isActive ? " active" : ""}${lesson.locked ? " locked" : ""}${isDone ? " done" : ""}`;
      btn.innerHTML = `
        <span class="lesson-item-left">
          <span class="lesson-status-icon">${isDone ? "✓" : lesson.locked ? "◦" : "▸"}</span>
          <span class="lesson-item-title">${lesson.number}. ${escHtml(lesson.title)}</span>
        </span>
        ${lesson.locked ? `<span class="lesson-tag">${t("Sắp có", "Soon")}</span>` : ""}
      `;
      if (isActive) btn.setAttribute("aria-current", "true");
      btn.addEventListener("click", () => {
        if (lesson.locked) {
          onShowUpcoming(mod, lesson);
        } else {
          onSelectLesson(lesson);
        }
      });
      li.appendChild(btn);
      list.appendChild(li);
    });

    wrap.appendChild(modBtn);
    wrap.appendChild(list);
    dom.courseTree.appendChild(wrap);
  });
}
