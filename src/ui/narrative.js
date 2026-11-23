import { escHtml, formatInlineMd, highlightC } from "../core/formatters.js";

/**
 * Stateless renderers for the right sidebar: narrative, quiz, checklist, and resources.
 */

export function renderOpenQuestions(
  containerEl,
  { step, lessonId, openAnswers, t, onChangeAnswer, onCopyMarkdown }
) {
  const questions = step.openQuestions || [];
  if (!questions.length) {
    containerEl.classList.add("hidden");
    containerEl.innerHTML = "";
    return;
  }

  containerEl.classList.remove("hidden");
  const header = `
    <div class="open-q-header">
      <span class="open-q-title">${t("CÂU HỎI MỞ (TỰ TRẢ LỜI)", "OPEN QUESTIONS (YOUR NOTES)")}</span>
    </div>`;

  const itemsHtml = questions
    .map((q) => {
      const key = `${lessonId}:${q.id}`;
      const val = openAnswers[key] || "";
      return `
      <div class="open-q-item">
        ${q.scenario ? `<span class="open-q-tag">${escHtml(q.scenario)}</span>` : ""}
        <div class="open-q-prompt">${formatInlineMd(q.prompt)}</div>
        <textarea
          class="open-q-input"
          data-open-key="${escHtml(key)}"
          placeholder="${escHtml(q.placeholder || t("Viết câu trả lời hoặc giả thuyết của bạn...", "Write your answer or hypothesis..."))}"
        >${escHtml(val)}</textarea>
        ${
          q.hint
            ? `<details class="open-q-hint"><summary>${t("Gợi ý tư duy kỹ sư", "Engineering hint")}</summary><p>${formatInlineMd(q.hint)}</p></details>`
            : ""
        }
      </div>`;
    })
    .join("");

  const footer = `
    <div class="open-q-footer">
      <span class="open-q-status">${t("Tự động lưu trên trình duyệt", "Auto-saved in browser")}</span>
      <button type="button" class="open-q-copy-btn">${t("Sao chép (.md)", "Copy (.md)")}</button>
    </div>`;

  containerEl.innerHTML = header + itemsHtml + footer;

  containerEl.querySelectorAll(".open-q-input").forEach((ta) => {
    ta.addEventListener("input", () => {
      onChangeAnswer(ta.dataset.openKey, ta.value);
    });
  });

  containerEl.querySelector(".open-q-copy-btn").addEventListener("click", onCopyMarkdown);
}

export function renderQuiz(quizBoxEl, { step, lessonId, quizAnswers, t, onSelectOption }) {
  if (!step.quiz || !step.quiz.length) {
    quizBoxEl.classList.add("hidden");
    quizBoxEl.innerHTML = "";
    return;
  }

  quizBoxEl.classList.remove("hidden");
  const key = `${lessonId}:${step.id}`;
  const answers = quizAnswers[key] || {};

  let html = `<div class="quiz-title">${t("KIỂM TRA NHANH", "QUICK CHECK")}</div>`;
  step.quiz.forEach((q, qi) => {
    const picked = answers[qi];
    html += `<div class="quiz-q">
      <div class="quiz-q-prompt">${formatInlineMd(q.prompt)}</div>
      <div class="quiz-options">
        ${q.options
          .map((opt, oi) => {
            let cls = "quiz-opt-btn";
            if (picked !== undefined) {
              if (oi === q.correctIndex) cls += " correct";
              else if (oi === picked) cls += " wrong";
            }
            return `<button class="${cls}" data-qi="${qi}" data-oi="${oi}">${escHtml(opt)}</button>`;
          })
          .join("")}
      </div>
      ${
        picked !== undefined
          ? `<div class="quiz-feedback">${
              picked === q.correctIndex
                ? "✓ "
                : t("✗ Thử lại hoặc xem giải thích: ", "✗ Try again or read the explanation: ")
            }${formatInlineMd(q.explain)}</div>`
          : ""
      }
    </div>`;
  });

  quizBoxEl.innerHTML = html;
  quizBoxEl.querySelectorAll(".quiz-opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qi = Number(btn.dataset.qi);
      const oi = Number(btn.dataset.oi);
      onSelectOption(key, qi, oi);
      const nextBtn = quizBoxEl.querySelector(`[data-qi="${qi}"][data-oi="${oi}"]`);
      if (nextBtn) nextBtn.focus();
    });
  });
}

export function renderNarrative(
  dom,
  { step, stepIndex, totalSteps, hasNextLesson, t }
) {
  dom.stepIndexLabel.textContent = `${t("BƯỚC", "STEP")} ${stepIndex + 1} / ${totalSteps}`;
  dom.stepCategoryBadge.textContent =
    { LAB: t("THỰC HÀNH", "LAB"), CONCEPT: t("KIẾN THỨC", "CONCEPT") }[step.badge] || step.badge;
  dom.stepCategoryBadge.className = `category-badge badge-${step.badge.toLowerCase()}`;
  dom.stepTitle.textContent = step.title;
  dom.stepBody.innerHTML = formatInlineMd(step.body);

  dom.codeLang.textContent = step.codeLang;
  dom.stepCode.innerHTML = highlightC(step.code);

  dom.calloutBox.className = `callout-box ${step.callout.type}`;
  dom.calloutLabel.textContent = step.callout.label;
  dom.calloutText.innerHTML = formatInlineMd(step.callout.text);

  dom.diffList.innerHTML = step.diff
    .map((d) => {
      const cls = d.op === "+" ? "diff-add" : d.op === "-" ? "diff-del" : "diff-mod";
      return `<li class="diff-item ${cls}"><span class="diff-op">${d.op}</span><span>${formatInlineMd(d.text)}</span></li>`;
    })
    .join("");

  dom.btnPrev.disabled = stepIndex === 0;
  const finalStep = stepIndex === totalSteps - 1;
  dom.btnNext.disabled = finalStep && !hasNextLesson;
  dom.btnNext.textContent = finalStep
    ? hasNextLesson
      ? t("Bài tiếp theo →", "Next lesson →")
      : t("Cuối lộ trình", "End of course")
    : t("Bước tiếp theo →", "Next step →");
}

export function renderLearnList(learnListEl, { lesson, visitedSteps }) {
  const visited = new Set(visitedSteps[lesson.id] || []);
  const unlocked = new Set();
  lesson.steps.forEach((step, idx) => {
    if (visited.has(idx)) {
      (step.learnUnlock || []).forEach((u) => unlocked.add(u));
    }
  });

  learnListEl.innerHTML = lesson.youllLearn
    .map((item, i) => {
      const checked = unlocked.has(i);
      return `
      <li class="learn-item${checked ? " checked" : ""}">
        <span class="learn-checkbox">${checked ? "✓" : ""}</span>
        <span>${escHtml(item)}</span>
      </li>`;
    })
    .join("");
}

export function renderResources(resourceListEl, { lessonId, lang, resources, t }) {
  const renderKey = `${lessonId}:${lang}`;
  if (resourceListEl.dataset.renderKey === renderKey) return;
  resourceListEl.dataset.renderKey = renderKey;

  const list = resources[lessonId] || [];
  const labels = {
    reading: t("Đọc thêm", "Further reading"),
    real: t("Dữ liệu đo thực tế", "Measured dataset"),
    csv: t("CSV mô phỏng", "Simulated CSV")
  };

  resourceListEl.innerHTML = list
    .map(
      ({ kind, url, title, note }) => `<li>
        <span class="resource-kind">${labels[kind]}</span>
        <a href="${escHtml(url)}" ${kind === "csv" ? "download" : 'target="_blank" rel="noopener" lang="en"'}>${escHtml(Array.isArray(title) ? t(...title) : title)}</a>
        <p>${escHtml(t(...note))}</p>
      </li>`
    )
    .join("");
}
