/**
 * Reactive state store with safe localStorage persistence.
 */

export const STORAGE_KEY = "designed_to_embed_state_v1";

function readStorage(key) {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(key, data) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function loadPersistedSnapshot(defaults, availableLessonIds, storageKey = STORAGE_KEY) {
  const saved = readStorage(storageKey);
  if (!saved) return { ...defaults };

  const next = { ...defaults };
  if (saved.theme === "dark" || saved.theme === "light") next.theme = saved.theme;
  if (saved.lang === "en" || saved.lang === "vi") next.lang = saved.lang;

  const candidateId = saved.activeLessonId || "b01-memory-types";
  if (availableLessonIds.includes(candidateId)) {
    next.activeLessonId = candidateId;
  }
  if (Number.isInteger(saved.activeStepIndex) && saved.activeStepIndex >= 0) {
    next.activeStepIndex = saved.activeStepIndex;
  }
  if (saved.visitedSteps && typeof saved.visitedSteps === "object") {
    next.visitedSteps = saved.visitedSteps;
  }
  if (Array.isArray(saved.completedLessons)) {
    next.completedLessons = saved.completedLessons;
  }
  if (saved.quizAnswers && typeof saved.quizAnswers === "object") {
    next.quizAnswers = saved.activeLessonId
      ? saved.quizAnswers
      : { "b01-memory-types:s10": saved.quizAnswers };
  }
  if (saved.openAnswers && typeof saved.openAnswers === "object") {
    next.openAnswers = saved.openAnswers;
  }
  return next;
}

export function createStore(initialState, storageKey = STORAGE_KEY) {
  let state = { ...initialState };
  const listeners = new Set();

  function persistSnapshot(s) {
    writeStorage(storageKey, {
      theme: s.theme,
      lang: s.lang,
      activeLessonId: s.activeLessonId,
      activeStepIndex: s.activeStepIndex,
      visitedSteps: s.visitedSteps,
      completedLessons: s.completedLessons,
      quizAnswers: s.quizAnswers,
      openAnswers: s.openAnswers
    });
  }

  return {
    getState() {
      return state;
    },
    setState(patchOrFn, { persist = true, notify = true } = {}) {
      const patch = typeof patchOrFn === "function" ? patchOrFn(state) : patchOrFn;
      if (!patch) return state;
      state = { ...state, ...patch };
      if (persist) persistSnapshot(state);
      if (notify) listeners.forEach((fn) => fn(state));
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
