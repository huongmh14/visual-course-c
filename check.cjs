const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

(async () => {
  const { COURSES, COURSE_EN, COURSE_RESOURCES } = await import("./src/content/index.js");
  const { hasScene, listRegisteredScenes } = await import("./src/engine/index.js");
  const { createSearchIndex } = await import("./src/core/search-index.js");

  const { modules } = COURSES.vi;
  const lessons = modules.flatMap((module) => module.lessons);
  const ready = lessons.filter((lesson) => !lesson.locked);
  const english = COURSES.en.modules.flatMap((module) => module.lessons);

  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  assert.equal(ready.length, 12);
  assert.equal(
    ready.slice(0, 4).map(({ id }) => id).join(","),
    "intro-how-to-learn,c-types-io,c-control-flow,b01-memory-types"
  );
  assert.equal(english[1].youllLearn.join("\n"), english[1].steps.slice(0, -1).map(({ title }) => title).join("\n"));
  assert.equal(modules[0].lessons.filter((lesson) => !lesson.locked).length, 8);
  assert.equal(modules[1].lessons.filter((lesson) => !lesson.locked).length, 4);

  const introOpenCount = lessons[0].steps.reduce((acc, s) => acc + (s.openQuestions?.length || 0), 0);
  assert.ok(introOpenCount >= 5, "Lesson 00 should have open-ended project questions");

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
  assert.ok(searchIndex.search("en", COURSES.en, "little-endian").some((h) => h.lesson.id === "b01-memory-types"));

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

  console.log(
    `Verified ${ready.length} bilingual lessons, ${listRegisteredScenes().length} registered scenes, search index, resource coverage, and 4 CSV datasets.`
  );
})();
