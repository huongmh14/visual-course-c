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
  const tagFor = (index) =>
    `@@TOK${String(index).replace(/\d/g, (d) => "ABCDEFGHIJ"[d])}@@`;
  let out = escHtml(code);
  // Extract comments and string/char literals first so keywords inside them are never tokenized
  out = out.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|&quot;(?:\\.|(?!&quot;)[^\n])*?&quot;|'(?:\\.|[^'\n])*?')/g,
    (match) => {
      const id = tagFor(tokens.length);
      const html = match.startsWith("/") ? `<span class="tok-cmt">${match}</span>` : match;
      tokens.push({ id, html });
      return id;
    }
  );
  out = out.replace(
    /(^|[^\w])(#(?:include|define|ifdef|ifndef|endif|pragma))\b/g,
    '$1<span class="tok-kw">$2</span>'
  );
  out = out.replace(
    /\b(int|void|const|static|volatile|while|for|do|if|else|switch|case|default|break|continue|return|sizeof|struct|union|enum|typedef)\b/g,
    '<span class="tok-kw">$1</span>'
  );
  out = out.replace(
    /\b(uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t|size_t|uintptr_t|ptrdiff_t|bool|double|float|char|unsigned|signed|FILE)\b/g,
    '<span class="tok-type">$1</span>'
  );
  out = out.replace(
    /\b(0x[0-9A-Fa-f_]+|0b[01_]+|\d+[uU]?|true|false|NULL)\b/g,
    '<span class="tok-num">$1</span>'
  );
  for (const { id, html } of tokens) {
    out = out.replace(id, html);
  }
  return out;
}

export function createTranslator(getLang) {
  return (vi, en) => (getLang() === "en" ? en : vi);
}

export function lessonLabel(lesson, t) {
  return `${t("Bài", "Lesson")} ${lesson.number}: ${lesson.title}`;
}
