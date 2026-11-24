import { createTranslator } from "./core/formatters.js";
import { createStore, loadPersistedSnapshot } from "./core/store.js";
import { createSearchIndex } from "./core/search-index.js";
import {
  COURSE_RESOURCES,
  createDomLocalizer,
  getCourse,
  getReadyLessons,
  getLessonById,
  totalLessonsCount
} from "./content/index.js";
import { createAnimator, renderScene } from "./engine/index.js";
import { createToaster } from "./ui/toast.js";
import { renderCourseTree, renderProgress } from "./ui/sidebar.js";
import {
  renderStageHeader,
  renderKpis,
  renderLegend,
  renderTimeline,
  showUpcomingOverlay,
  syncArchifyStage
} from "./ui/stage.js";
import {
  renderNarrative,
  renderOpenQuestions,
  renderQuiz,
  renderLearnList,
  renderResources
} from "./ui/narrative.js";
import { createSearchModal } from "./ui/search-modal.js";

const el = {
  html: document.documentElement,
  sidebarLeft: document.getElementById("sidebar-left"),
  sidebarBackdrop: document.getElementById("sidebar-backdrop"),
  courseTree: document.getElementById("course-tree"),
  courseCount: document.getElementById("course-lesson-count"),
  progressPanel: document.getElementById("progress-panel"),
  btnProgressToggle: document.getElementById("btn-progress-toggle"),
  progressRatio: document.getElementById("progress-ratio"),
  progressFill: document.getElementById("progress-bar-fill"),
  progressBreakdown: document.getElementById("progress-breakdown"),
  breadcrumb: document.getElementById("lesson-breadcrumb"),
  lessonTitle: document.getElementById("lesson-title"),
  lessonSubtitle: document.getElementById("lesson-subtitle"),
  pillDuration: document.getElementById("pill-duration"),
  pillLevel: document.getElementById("pill-level"),
  pillSteps: document.getElementById("pill-steps"),
  diagramStage: document.getElementById("diagram-stage"),
  kpiStrip: document.getElementById("kpi-strip"),
  svgViewport: document.getElementById("svg-viewport"),
  isoSvg: document.getElementById("iso-svg"),
  archifyViewport: document.getElementById("archify-viewport"),
  archifyFrame: document.getElementById("archify-frame"),
  btnViewStep: document.getElementById("btn-view-step"),
  btnViewArchify: document.getElementById("btn-view-archify"),
  btnArchifyExt: document.getElementById("btn-archify-ext"),
  packetLegend: document.getElementById("packet-legend"),
  upcomingOverlay: document.getElementById("upcoming-overlay"),
  upcomingTitle: document.getElementById("upcoming-title"),
  upcomingDesc: document.getElementById("upcoming-desc"),
  upcomingTopics: document.getElementById("upcoming-topics"),
  btnBackToReady: document.getElementById("btn-back-to-ready"),
  timelineCounter: document.getElementById("timeline-counter"),
  timelineTrack: document.getElementById("timeline-track"),
  stepIndexLabel: document.getElementById("step-index-label"),
  stepCategoryBadge: document.getElementById("step-category-badge"),
  stepTitle: document.getElementById("step-title"),
  stepBody: document.getElementById("step-body"),
  codeLang: document.getElementById("code-lang"),
  stepCode: document.getElementById("step-code"),
  btnCopyCode: document.getElementById("btn-copy-code"),
  calloutBox: document.getElementById("callout-box"),
  calloutLabel: document.getElementById("callout-label"),
  calloutText: document.getElementById("callout-text"),
  diffList: document.getElementById("diff-list"),
  openQBox: document.getElementById("open-q-box"),
  quizBox: document.getElementById("quiz-box"),
  btnPrev: document.getElementById("btn-prev-step"),
  btnNext: document.getElementById("btn-next-step"),
  learnList: document.getElementById("learn-list"),
  btnTheme: document.getElementById("btn-theme"),
  btnReplay: document.getElementById("btn-replay"),
  btnPlayPause: document.getElementById("btn-playpause"),
  btnFullscreen: document.getElementById("btn-fullscreen"),
  btnToggleSidebar: document.getElementById("btn-toggle-sidebar"),
  btnCloseSidebar: document.getElementById("btn-close-sidebar"),
  btnSearch: document.getElementById("btn-search"),
  btnCloseSearch: document.getElementById("btn-close-search"),
  searchModal: document.getElementById("search-modal"),
  searchInput: document.getElementById("search-input"),
  searchResults: document.getElementById("search-results"),
  toastContainer: document.getElementById("toast-container"),
  languageSelect: document.getElementById("course-lang"),
  resourcesPanel: document.getElementById("lesson-resources"),
  resourceList: document.getElementById("resource-list"),
  resourceJump: document.getElementById("resource-jump"),
  practiceBtn: document.querySelector('[data-mode="practice"]')
};

const defaultCourse = getCourse("vi");
const initialReadyIds = getReadyLessons(defaultCourse).map((l) => l.id);
const initialSnapshot = loadPersistedSnapshot(
  {
    theme: "light",
    lang: "vi",
    activeLessonId: initialReadyIds[0],
    activeStepIndex: 0,
    visitedSteps: {},
    completedLessons: [],
    quizAnswers: {},
    openAnswers: {},
    progressExpanded: false
  },
  initialReadyIds
);

const store = createStore(initialSnapshot);
const domLocalizer = createDomLocalizer(document);
const searchIndex = createSearchIndex();
const toaster = createToaster(el.toastContainer);
const animator = createAnimator({
  initialPlaying: !matchMedia("(prefers-reduced-motion: reduce)").matches
});
const narrowDiagram = matchMedia("(max-width: 640px)");
const t = createTranslator(() => store.getState().lang);
let stageMode = "step";

function computeVisitUpdate(state, lesson, stepIndex) {
  const visited = new Set(state.visitedSteps[lesson.id] || []);
  visited.add(stepIndex);
  const visitedSteps = { ...state.visitedSteps, [lesson.id]: Array.from(visited) };
  let completedLessons = state.completedLessons;
  let justCompleted = false;

  if (visited.size === lesson.steps.length && !completedLessons.includes(lesson.id)) {
    completedLessons = [...completedLessons, lesson.id];
    justCompleted = true;
  }
  return { visitedSteps, completedLessons, justCompleted };
}

function navigateTo(lessonId, stepIndex = 0) {
  const s = store.getState();
  const course = getCourse(s.lang);
  const { lesson } = getLessonById(course, lessonId);
  const clampedIdx = Math.max(0, Math.min(stepIndex, lesson.steps.length - 1));
  const { visitedSteps, completedLessons, justCompleted } = computeVisitUpdate(s, lesson, clampedIdx);

  animator.resetTick();
  store.setState({
    activeLessonId: lesson.id,
    activeStepIndex: clampedIdx,
    visitedSteps,
    completedLessons
  });

  if (justCompleted) {
    toaster.show(
      t(
        `Đã xem hết các bước của bài ${lesson.number}.`,
        `You viewed all steps in lesson ${lesson.number}.`
      )
    );
  }
}

function openMobileSidebar() {
  el.sidebarLeft.classList.add("open");
  el.sidebarBackdrop.classList.remove("hidden");
}

function closeMobileSidebar() {
  el.sidebarLeft.classList.remove("open");
  el.sidebarBackdrop.classList.add("hidden");
}

function syncPlayPauseIcon() {
  const playing = animator.isPlaying();
  el.btnPlayPause.querySelector(".icon-pause").classList.toggle("hidden", !playing);
  el.btnPlayPause.querySelector(".icon-play").classList.toggle("hidden", playing);
}

function syncLanguageDom(lang) {
  el.languageSelect.value = lang;
  domLocalizer.apply(lang);
  if (!el.upcomingOverlay.classList.contains("hidden")) {
    const course = getCourse(lang);
    const { lesson } = getLessonById(course, el.upcomingOverlay.dataset.lessonId);
    showUpcomingOverlay(el, { lesson, t });
  }
}

function render(state) {
  el.html.setAttribute("data-theme", state.theme);
  const course = getCourse(state.lang);
  const availableLessons = getReadyLessons(course);
  const { mod, lesson } = getLessonById(course, state.activeLessonId);
  const stepIndex = Math.max(0, Math.min(state.activeStepIndex, lesson.steps.length - 1));
  const step = lesson.steps[stepIndex];
  const hasNextLesson = availableLessons.indexOf(lesson) < availableLessons.length - 1;

  renderStageHeader(el, { mod, lesson, stepsCount: lesson.steps.length, t });
  renderKpis(el.kpiStrip, step.kpis);
  renderLegend(el.packetLegend, step.legend);

  renderNarrative(el, {
    step,
    stepIndex,
    totalSteps: lesson.steps.length,
    hasNextLesson,
    t
  });

  renderOpenQuestions(el.openQBox, {
    step,
    lessonId: lesson.id,
    openAnswers: state.openAnswers,
    t,
    onChangeAnswer(answerKey, value) {
      const prev = store.getState().openAnswers;
      store.setState(
        { openAnswers: { ...prev, [answerKey]: value } },
        { persist: true, notify: false }
      );
    },
    async onCopyMarkdown() {
      const answers = store.getState().openAnswers;
      const lines = [`# ${t("Bài", "Lesson")} ${lesson.number}: ${lesson.title}`, ""];
      lesson.steps.forEach((s) => {
        (s.openQuestions || []).forEach((q) => {
          const ans = (answers[`${lesson.id}:${q.id}`] || "").trim() || t("(Chưa trả lời)", "(Unanswered)");
          lines.push(`## ${q.scenario || s.title}`);
          lines.push(`**${t("Câu hỏi", "Question")}:** ${q.prompt}`);
          lines.push(`**${t("Trả lời", "Answer")}:** ${ans}`, "");
        });
      });
      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        toaster.show(t("Đã sao chép toàn bộ câu trả lời (.md)!", "Copied all open answers (.md)!"));
      } catch {
        toaster.show(t("Không thể tự sao chép; hãy chọn chữ và nhấn Ctrl+C.", "Copy failed; select text and press Ctrl+C."));
      }
    }
  });

  renderQuiz(el.quizBox, {
    step,
    lessonId: lesson.id,
    quizAnswers: state.quizAnswers,
    t,
    onSelectOption(quizKey, qIndex, optIndex) {
      const prev = store.getState().quizAnswers;
      const nextGroup = { ...(prev[quizKey] || {}), [qIndex]: optIndex };
      store.setState({ quizAnswers: { ...prev, [quizKey]: nextGroup } });
    }
  });

  renderTimeline(el, {
    lesson,
    activeStepIndex: stepIndex,
    visitedSteps: state.visitedSteps,
    t,
    onSelectStep(idx) {
      navigateTo(lesson.id, idx);
    }
  });

  renderLearnList(el.learnList, {
    lesson,
    visitedSteps: state.visitedSteps
  });

  renderResources(el.resourceList, {
    lessonId: lesson.id,
    lang: state.lang,
    resources: COURSE_RESOURCES,
    t
  });

  renderCourseTree(el, {
    course,
    activeLessonId: lesson.id,
    completedLessons: state.completedLessons,
    totalCount: totalLessonsCount(course),
    t,
    onSelectLesson(selected) {
      closeMobileSidebar();
      el.upcomingOverlay.classList.add("hidden");
      if (store.getState().activeLessonId === selected.id) return;
      navigateTo(selected.id, 0);
    },
    onShowUpcoming(_m, upcoming) {
      closeMobileSidebar();
      showUpcomingOverlay(el, { lesson: upcoming, t });
    }
  });

  renderProgress(el, {
    course,
    availableLessons,
    completedLessons: state.completedLessons
  });

  renderScene(el.isoSvg, step.scene, animator, {
    t,
    vertical: step.scene.type === "flow" && narrowDiagram.matches
  });

  syncArchifyStage(el, {
    lessonId: lesson.id,
    theme: state.theme,
    mode: stageMode,
    t
  });
}

const searchModal = createSearchModal(el, {
  searchIndex,
  getCourseContext() {
    const s = store.getState();
    return { lang: s.lang, course: getCourse(s.lang), t };
  },
  onSelectHit(hit) {
    if (hit.kind === "step") {
      el.upcomingOverlay.classList.add("hidden");
      navigateTo(hit.lesson.id, hit.stepIndex);
    } else if (hit.lesson.locked) {
      showUpcomingOverlay(el, { lesson: hit.lesson, t });
    } else {
      el.upcomingOverlay.classList.add("hidden");
      navigateTo(hit.lesson.id, 0);
    }
  }
});

function bindEvents() {
  el.btnPrev.addEventListener("click", () => {
    const s = store.getState();
    if (s.activeStepIndex > 0) navigateTo(s.activeLessonId, s.activeStepIndex - 1);
  });

  el.btnNext.addEventListener("click", () => {
    const s = store.getState();
    const course = getCourse(s.lang);
    const availableLessons = getReadyLessons(course);
    const { lesson } = getLessonById(course, s.activeLessonId);
    if (s.activeStepIndex < lesson.steps.length - 1) {
      navigateTo(lesson.id, s.activeStepIndex + 1);
    } else {
      const nextLesson = availableLessons[availableLessons.indexOf(lesson) + 1];
      if (nextLesson) navigateTo(nextLesson.id, 0);
    }
  });

  el.btnTheme.addEventListener("click", () => {
    const nextTheme = store.getState().theme === "light" ? "dark" : "light";
    store.setState({ theme: nextTheme });
  });

  el.btnProgressToggle.addEventListener("click", () => {
    const next = !store.getState().progressExpanded;
    el.progressPanel.classList.toggle("expanded", next);
    el.btnProgressToggle.setAttribute("aria-expanded", String(next));
    store.setState({ progressExpanded: next }, { persist: false, notify: false });
  });

  el.btnReplay.addEventListener("click", () => {
    animator.replay();
    syncPlayPauseIcon();
  });

  el.btnPlayPause.addEventListener("click", () => {
    animator.toggle();
    syncPlayPauseIcon();
  });

  el.btnFullscreen.addEventListener("click", () => {
    el.diagramStage.classList.toggle("fullscreen");
  });

  el.btnViewStep.addEventListener("click", () => {
    stageMode = "step";
    render(store.getState());
  });

  el.btnViewArchify.addEventListener("click", () => {
    stageMode = "archify";
    render(store.getState());
  });

  el.btnCopyCode.addEventListener("click", async () => {
    const s = store.getState();
    const { lesson } = getLessonById(getCourse(s.lang), s.activeLessonId);
    const code = lesson.steps[s.activeStepIndex].code;
    try {
      await navigator.clipboard.writeText(code);
      toaster.show(t("Đã sao chép nội dung.", "Copied to clipboard."));
    } catch {
      toaster.show(
        t(
          "Hãy bôi đen nội dung rồi nhấn Ctrl+C để sao chép.",
          "Select the text and press Ctrl+C to copy."
        )
      );
    }
  });

  el.btnBackToReady.addEventListener("click", () => {
    el.upcomingOverlay.classList.add("hidden");
  });

  el.btnToggleSidebar.addEventListener("click", openMobileSidebar);
  el.btnCloseSidebar.addEventListener("click", closeMobileSidebar);
  el.sidebarBackdrop.addEventListener("click", closeMobileSidebar);

  el.btnSearch.addEventListener("click", searchModal.open);
  el.btnCloseSearch.addEventListener("click", searchModal.close);
  el.searchModal.addEventListener("click", (e) => {
    if (e.target === el.searchModal) searchModal.close();
  });

  el.languageSelect.addEventListener("change", () => {
    const lang = el.languageSelect.value;
    syncLanguageDom(lang);
    store.setState({ lang });
  });

  el.resourceJump.addEventListener("click", (e) => {
    e.preventDefault();
    el.resourcesPanel.open = true;
    el.resourcesPanel.querySelector("summary").focus({ preventScroll: true });
    el.resourcesPanel.scrollIntoView({ block: "start" });
  });

  el.practiceBtn.addEventListener("click", () => {
    el.upcomingOverlay.classList.add("hidden");
    const s = store.getState();
    const { lesson } = getLessonById(getCourse(s.lang), s.activeLessonId);
    navigateTo(lesson.id, lesson.steps.length - 1);
  });

  narrowDiagram.addEventListener("change", () => {
    const s = store.getState();
    const { lesson } = getLessonById(getCourse(s.lang), s.activeLessonId);
    const step = lesson.steps[s.activeStepIndex];
    renderScene(el.isoSvg, step.scene, animator, {
      t,
      vertical: step.scene.type === "flow" && narrowDiagram.matches
    });
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      searchModal.open();
      return;
    }
    if (searchModal.isOpen()) {
      if (e.key === "Escape") searchModal.close();
      return;
    }
    if (e.target.closest("input, textarea, select")) return;

    const s = store.getState();
    const { lesson } = getLessonById(getCourse(s.lang), s.activeLessonId);
    if (e.key === "ArrowRight" && s.activeStepIndex < lesson.steps.length - 1) {
      navigateTo(lesson.id, s.activeStepIndex + 1);
    } else if (e.key === "ArrowLeft" && s.activeStepIndex > 0) {
      navigateTo(lesson.id, s.activeStepIndex - 1);
    } else if (e.code === "Space") {
      if (e.target.closest("button, a, summary")) return;
      e.preventDefault();
      animator.toggle();
      syncPlayPauseIcon();
    } else if (e.key.toLowerCase() === "r") {
      animator.replay();
      syncPlayPauseIcon();
    } else if (e.key.toLowerCase() === "f") {
      el.diagramStage.classList.toggle("fullscreen");
    } else if (e.key === "Escape") {
      el.diagramStage.classList.remove("fullscreen");
    }
  });

  syncPlayPauseIcon();
}

// ================= BOOT =================
store.subscribe(render);
syncLanguageDom(store.getState().lang);
bindEvents();
navigateTo(store.getState().activeLessonId, store.getState().activeStepIndex);
animator.start();
