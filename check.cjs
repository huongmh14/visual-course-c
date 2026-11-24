const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

function createStubSvgRoot() {
  const makeNode = (tag) => ({
    tag,
    attrs: {},
    textContent: "",
    children: [],
    classList: { add() {} },
    setAttribute(k, v) {
      this.attrs[k] = String(v);
    },
    getAttribute(k) {
      return this.attrs[k] ?? null;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    set innerHTML(_v) {
      this.children = [];
    }
  });
  globalThis.document = {
    createElementNS: (_ns, tag) => makeNode(tag)
  };
  return makeNode("svg");
}

function measureVisualUnits(text) {
  let units = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp > 0x2600 && (cp === 0x274c || cp === 0x2705 || cp >= 0x1f000)) {
      units += 2.0;
    } else {
      units += /[\u0100-\uFFFF]/.test(ch) ? 1.05 : 1.0;
    }
  }
  return units;
}

function measureTextSpan(tx) {
  const fs = parseFloat(tx.attrs["font-size"] || "11");
  const base0 = parseFloat(tx.attrs.y || "0");
  const spans = tx.children.filter((c) => c.tag === "tspan");
  const lines = spans.length ? spans.map((s) => s.textContent) : [tx.textContent];
  let curBase = base0;
  if (spans.length) {
    for (let i = 0; i < spans.length; i++) {
      if (i > 0) curBase += parseFloat(spans[i].attrs.dy || "0");
      else curBase += parseFloat(spans[0].attrs.dy || "0");
    }
  }
  return {
    fs,
    lines,
    top: base0 + (spans.length ? parseFloat(spans[0].attrs.dy || "0") : 0) - fs * 0.78,
    bottom: curBase + fs * 0.26
  };
}

(async () => {
  const svgStub = createStubSvgRoot();
  const { COURSES, COURSE_EN, COURSE_RESOURCES } = await import("./src/content/index.js");
  const { hasScene, listRegisteredScenes, renderScene } = await import("./src/engine/index.js");
  const { highlightC } = await import("./src/core/formatters.js");
  const { getArchifyDiagram } = await import("./src/ui/stage.js");
  const { createSearchIndex } = await import("./src/core/search-index.js");

  const highlighted = highlightC('#include <stdint.h>\ndouble f(bool ok) { printf("int: %d", ok); switch (ok) { case true: return 0; } }');
  assert.ok(highlighted.includes('<span class="tok-kw">#include</span>'), "highlightC should style #include");
  assert.ok(highlighted.includes('<span class="tok-type">double</span>'), "highlightC should style double");
  assert.ok(highlighted.includes('<span class="tok-kw">switch</span>'), "highlightC should style switch");
  assert.ok(highlighted.includes('<span class="tok-num">true</span>'), "highlightC should style true");
  assert.ok(!highlighted.includes('&quot;<span class="tok-kw">int</span>'), "highlightC must not tokenize keywords inside strings");

  const { modules } = COURSES.vi;
  const lessons = modules.flatMap((module) => module.lessons);
  const ready = lessons.filter((lesson) => !lesson.locked);
  const english = COURSES.en.modules.flatMap((module) => module.lessons);

  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  assert.equal(ready.length, 20);
  assert.equal(
    ready.slice(0, 5).map(({ id }) => id).join(","),
    "intro-how-to-learn,c-types-io,c-operators-conversions,c-control-flow,b01-memory-types"
  );
  assert.equal(english[1].youllLearn.join("\n"), english[1].steps.slice(0, -1).map(({ title }) => title).join("\n"));
  assert.equal(modules[0].lessons.filter((lesson) => !lesson.locked).length, 12);
  assert.equal(modules[1].lessons.filter((lesson) => !lesson.locked).length, 8);

  const introOpenCount = lessons[0].steps.reduce((acc, s) => acc + (s.openQuestions?.length || 0), 0);
  assert.ok(introOpenCount >= 5, "Lesson 00 should have open-ended project questions");

  const bitwise = ready.find(({ id }) => id === "b02-bitwise");
  assert.equal(bitwise.steps.length, 8, "b02-bitwise should have 8 steps");
  const bitwiseOpenCount = bitwise.steps.reduce((acc, s) => acc + (s.openQuestions?.length || 0), 0);
  assert.ok(bitwiseOpenCount >= 2, "b02-bitwise should have open-ended questions");

  for (const [index, lesson] of lessons.entries()) {
    assert.equal(Number(lesson.number), index);
    const translation = english[index];
    assert.equal(translation.id, lesson.id);
    assert.ok(translation.title && translation.subtitle);
    if (!lesson.locked) {
      assert.equal(COURSE_EN[lesson.id].steps.length, lesson.steps.length, lesson.id);
      for (const [i, step] of lesson.steps.entries()) {
        const translated = translation.steps[i];
        assert.equal(translated.id, step.id);
        assert.ok(translated.body && translated.callout.text);
        assert.equal(translated.scene.nodes?.length, step.scene.nodes?.length);
        assert.ok(hasScene(step.scene.type), `Missing registered scene: ${step.scene.type}`);
        assert.ok(translated.diff.every((item) => item.text));
        for (const [q, question] of (step.openQuestions ?? []).entries()) {
          assert.ok(translated.openQuestions?.[q]?.prompt && question.id, `${lesson.id}:${step.id}`);
        }
        for (const [q, question] of (step.quiz ?? []).entries()) {
          assert.equal(translated.quiz[q].correctIndex, question.correctIndex);
          assert.equal(translated.quiz[q].options.length, question.options.length);
        }
      }
      assert.ok(COURSE_RESOURCES[lesson.id].some((resource) => resource.kind === "reading"));
      assert.ok(COURSE_RESOURCES[lesson.id].every((resource) => resource.note.length === 2 && resource.note.every(Boolean)));
    }
  }

  for (const { id, steps } of ready) {
    assert.equal(new Set(steps.map((step) => step.id)).size, steps.length, id);
    const lab = steps.at(-1);
    assert.equal(lab.badge, "LAB", id);
    assert.ok(lab.code && lab.diff.length, id);
    const quiz = steps.flatMap((step) => step.quiz ?? []);
    assert.ok(quiz.length, id);
    for (const { options, correctIndex } of quiz) {
      assert.ok(Number.isInteger(correctIndex) && options[correctIndex], id);
    }
  }

  // Verify SearchIndex across both languages
  const searchIndex = createSearchIndex();
  assert.equal(searchIndex.search("vi", COURSES.vi, "", 50).length, lessons.length);
  assert.ok(searchIndex.search("vi", COURSES.vi, "uint8_t").some((h) => h.kind === "step"));
  assert.ok(searchIndex.search("vi", COURSES.vi, "MISRA").some((h) => h.lesson.id === "c-ringbuf-pool-misra"));
  assert.ok(searchIndex.search("vi", COURSES.vi, "MOSFET").some((h) => h.lesson.id === "e-components-mosfet"));
  assert.ok(searchIndex.search("en", COURSES.en, "little-endian").some((h) => h.lesson.id === "b01-memory-types"));
  assert.ok(searchIndex.search("en", COURSES.en, "Ring Buffer").some((h) => h.lesson.id === "c-ringbuf-pool-misra"));
  assert.ok(searchIndex.search("en", COURSES.en, "I2C").some((h) => h.lesson.id === "e-serial-datasheet"));

  function rows(file, header) {
    const [first, ...data] = readFileSync(join(__dirname, "datasets", file), "utf8").trim().split(/\r?\n/);
    assert.equal(first, header);
    return data.map((row) => {
      const fields = row.split(",");
      assert.equal(fields.length, header.split(",").length);
      return fields;
    });
  }

  let fsm = "WAIT";
  for (const [sample, expected] of rows("fsm.csv", "sample,expected_state")) {
    if (sample >= 700) fsm = "ALERT";
    else if (sample < 650) fsm = "WAIT";
    assert.equal(fsm, expected);
  }

  let stable = 1;
  let previous = 1;
  let count = 0;
  for (const [index, row] of rows("debounce.csv", "time_ms,gpio_level,expected_press_event").entries()) {
    const [time, level, press] = row.map(Number);
    assert.equal(time, index * 5);
    count = level === previous ? count + 1 : 1;
    previous = level;
    const pressed = count === 3 && stable !== level && level === 0;
    if (count === 3) stable = level;
    assert.equal(Number(pressed), press);
  }

  for (const [code, expected] of rows("adc.csv", "adc_code,expected_mv").map((row) => row.map(Number))) {
    assert.equal(Math.round(code * 3300 / 4095), expected);
  }
  for (const [code, enabled, expected] of rows("pwm.csv", "adc_code,enabled,expected_high_ticks").map((row) => row.map(Number))) {
    assert.equal(enabled * Math.round(code * 1000 / 4095), expected);
  }

  // Verify SVG geometry (0 text overflow, 0 out-of-bounds) across all 20 lessons x 2 languages
  const noopAnimator = { setTracks() {} };
  let renderedCount = 0;
  const geomIssues = [];
  for (const lang of ["vi", "en"]) {
    const langReady = COURSES[lang].modules.flatMap((m) => m.lessons).filter((l) => !l.locked);
    for (const lesson of langReady) {
      const archSpec = getArchifyDiagram(lesson.id);
      const archPath = join(__dirname, archSpec.file);
      assert.ok(existsSync(archPath), `Missing Archify diagram for ${lesson.id}: ${archSpec.file}`);
      for (const step of lesson.steps) {
        renderScene(svgStub, step.scene, noopAnimator, {
          t: (vi, en) => (lang === "en" ? en : vi),
          vertical: false
        });
        renderedCount++;
        const [, , vbW = 880, vbH = 430] = (svgStub.getAttribute("viewBox") || "0 0 880 430")
          .split(/\s+/)
          .map(Number);

        const collectDirectOrGroupTexts = (node) => {
          const direct = node.children.filter((c) => c.tag === "text");
          const groupTexts = node.children
            .filter((c) => c.tag === "g" && !c.children.some((gChild) => gChild.tag === "rect"))
            .flatMap((g) => g.children.filter((c) => c.tag === "text"));
          return [...direct, ...groupTexts];
        };

        const walk = (node, depth = 0) => {
          if (node.attrs.id === "scene-packets" || node.tag === "clipPath") return;
          const rects = node.children.filter((c) => c.tag === "rect");
          const directTexts = node.children.filter((c) => c.tag === "text");
          const cardTexts = rects.length >= 1 ? collectDirectOrGroupTexts(node) : [];

          // Check card/pill containers (<g> nodes with a background rect and own/clipped texts)
          if (depth >= 2 && rects.length >= 1 && cardTexts.length >= 1) {
            const box = rects.find((r) => r.attrs.stroke) || rects[rects.length - 1];
            const bw = parseFloat(box.attrs.width || "0");
            const bh = parseFloat(box.attrs.height || "0");
            const bx = parseFloat(box.attrs.x || "0");
            const by = parseFloat(box.attrs.y || "0");
            if (bx < -2 || bx + bw > vbW + 2 || by < -2 || by + bh > vbH + 2) {
              geomIssues.push(`${lang}:${lesson.id}:${step.id} [${step.scene.type}] box OOB (${bx},${by},${bw},${bh})`);
            }
            for (const tx of cardTexts) {
              const spanInfo = measureTextSpan(tx);
              for (const line of spanInfo.lines) {
                const est = measureVisualUnits(line) * spanInfo.fs * 0.61;
                if (bw > 40 && est > bw - 6) {
                  geomIssues.push(`${lang}:${lesson.id}:${step.id} [${step.scene.type}] text(${Math.round(est)}) > box(${bw}): "${line}"`);
                }
              }
              if (bh > 18 && (spanInfo.top < by - 1.5 || spanInfo.bottom > by + bh + 1.5)) {
                geomIssues.push(`${lang}:${lesson.id}:${step.id} [${step.scene.type}] text V-OOB [${Math.round(spanInfo.top)}..${Math.round(spanInfo.bottom)}] vs box [${by}..${by + bh}]`);
              }
            }
          }

          // Check global horizontal and vertical bounds for every text element
          for (const tx of directTexts) {
            const spanInfo = measureTextSpan(tx);
            const x = parseFloat(tx.attrs.x || "0");
            const anchor = tx.attrs["text-anchor"] || "start";
            for (const line of spanInfo.lines) {
              const w = measureVisualUnits(line) * spanInfo.fs * 0.61;
              const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
              const right = left + w;
              if (left < -4 || right > vbW + 4) {
                geomIssues.push(`${lang}:${lesson.id}:${step.id} [${step.scene.type}] text OOB [${Math.round(left)}..${Math.round(right)}]: "${line}"`);
              }
            }
            if (spanInfo.top < -2 || spanInfo.bottom > vbH + 2) {
              geomIssues.push(`${lang}:${lesson.id}:${step.id} [${step.scene.type}] text V-OOB [${Math.round(spanInfo.top)}..${Math.round(spanInfo.bottom)}] vs vbH=${vbH}`);
            }
          }
          node.children.forEach((c) => walk(c, depth + 1));
        };
        walk(svgStub, 0);
      }
    }
  }
  assert.equal(geomIssues.length, 0, `SVG geometry issues:\n${geomIssues.join("\n")}`);

  const archifyFiles = [
    "c-mcu-architecture.html",
    "c-firmware-pipeline.html",
    "c-fsm-lifecycle.html",
    "electronics-bench-architecture.html"
  ];
  for (const f of archifyFiles) {
    const html = readFileSync(join(__dirname, "diagrams", f), "utf8");
    assert.ok(html.includes("<svg") && html.includes("archify"), `Invalid Archify output: ${f}`);
  }

  console.log(
    `Verified ${ready.length} bilingual lessons, ${listRegisteredScenes().length} registered scenes (${renderedCount} rendered SVG checks clean), ${archifyFiles.length} Archify diagrams, search index, resource coverage, and 4 CSV datasets.`
  );
})();
