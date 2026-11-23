import { escHtml } from "../core/formatters.js";

/**
 * Ctrl+K Search Modal controller backed by SearchIndex.
 */

export function createSearchModal(
  { searchModal, searchInput, searchResults },
  { searchIndex, getCourseContext, onSelectHit }
) {
  function render(query) {
    const { lang, course, t } = getCourseContext();
    const hits = searchIndex.search(lang, course, query, 15);

    searchResults.innerHTML =
      hits
        .map(
          (h, i) => `
      <button class="search-hit" data-hit-idx="${i}">
        <div>
          <div class="search-hit-title">${escHtml(h.title)}</div>
          <div class="search-hit-sub">${escHtml(h.sub)}</div>
        </div>
        <span class="lesson-tag">${h.kind === "step" ? t("Bước", "Step") : t("Bài", "Lesson")}</span>
      </button>`
        )
        .join("") ||
      `<div style="padding:14px;color:var(--ink-muted)">${t("Không tìm thấy kết quả phù hợp.", "No matching results.")}</div>`;

    searchResults.querySelectorAll(".search-hit").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        close();
        onSelectHit(hits[idx]);
      });
    });
  }

  function open() {
    searchModal.classList.remove("hidden");
    searchInput.value = "";
    render("");
    setTimeout(() => searchInput.focus(), 20);
  }

  function close() {
    searchModal.classList.add("hidden");
  }

  function isOpen() {
    return !searchModal.classList.contains("hidden");
  }

  searchInput.addEventListener("input", (e) => render(e.target.value));

  return { open, close, isOpen, render };
}
