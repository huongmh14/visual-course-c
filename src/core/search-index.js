import { lessonLabel } from "./formatters.js";

/**
 * Cached inverted/flat search index per course object for fast Ctrl+K lookup.
 */
export function createSearchIndex() {
  const cache = new WeakMap();

  function buildIndex(lang, course) {
    const t = (vi, en) => (lang === "en" ? en : vi);
    const entries = [];

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        entries.push({
          kind: "lesson",
          title: lessonLabel(lesson, t),
          sub: `${mod.title} • ${lesson.locked ? t("Sắp thiết kế", "Planned") : t("Sẵn sàng", "Available")}`,
          haystack: [lesson.title, lesson.subtitle, ...(lesson.topics || [])]
            .join("\n")
            .toLowerCase(),
          mod,
          lesson
        });

        if (!lesson.locked && Array.isArray(lesson.steps)) {
          lesson.steps.forEach((step, idx) => {
            const openText = (step.openQuestions || []).map((q) => q.prompt).join("\n");
            entries.push({
              kind: "step",
              title: `${t("Bước", "Step")} ${idx + 1}: ${step.title}`,
              sub: `${lessonLabel(lesson, t)} [${step.badge}]`,
              haystack: [step.title, step.body, step.code, openText].join("\n").toLowerCase(),
              mod,
              lesson,
              stepIndex: idx
            });
          });
        }
      }
    }

    return entries;
  }

  function getEntries(lang, course) {
    let entries = cache.get(course);
    if (!entries) {
      entries = buildIndex(lang, course);
      cache.set(course, entries);
    }
    return entries;
  }

  return {
    search(lang, course, query, limit = 15) {
      const entries = getEntries(lang, course);
      const q = String(query || "").trim().toLowerCase();
      if (!q) {
        return entries.filter((entry) => entry.kind === "lesson").slice(0, limit);
      }
      const hits = [];
      for (const entry of entries) {
        if (entry.haystack.includes(q)) {
          hits.push(entry);
          if (hits.length >= limit) break;
        }
      }
      return hits;
    }
  };
}
