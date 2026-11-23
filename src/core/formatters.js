/**
 * Formatting, sanitization, syntax highlighting, and translation helpers.
 */

export function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatInlineMd(str) {
  return escHtml(str)
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function highlightC(code) {
  const tokens = [];
  let out = escHtml(code);
  // Extract comments first so keywords inside comments are not tokenized
  out = out.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (match) => {
    const id = `@@CMT${tokens.length}@@`;
    tokens.push(`<span class="tok-cmt">${match}</span>`);
    return id;
  });
  out = out.replace(
    /\b(int|void|const|static|volatile|while|for|if|else|return|struct|union|enum|typedef|#include|#define)\b/g,
    '<span class="tok-kw">$1</span>'
  );
  out = out.replace(
    /\b(uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|bool)\b/g,
    '<span class="tok-type">$1</span>'
  );
  out = out.replace(/\b(0x[0-9A-Fa-f_]+|0b[01_]+|\d+[uU]?)\b/g, '<span class="tok-num">$1</span>');
  tokens.forEach((html, i) => {
    out = out.replace(`@@CMT${i}@@`, html);
  });
  return out;
}

export function createTranslator(getLang) {
  return (vi, en) => (getLang() === "en" ? en : vi);
}

export function lessonLabel(lesson, t) {
  return `${t("Bài", "Lesson")} ${lesson.number}: ${lesson.title}`;
}
