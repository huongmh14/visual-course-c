import { createBaseCourse } from "./curriculum-base.js";
import { applyFoundationCurriculum } from "./curriculum-review.js";
import { COURSE_RESOURCES } from "./resources.js";
import { COURSE_EN, buildEnglishCourse, createDomLocalizer } from "./i18n/index.js";

const viCourse = applyFoundationCurriculum(createBaseCourse());
const enCourse = buildEnglishCourse(viCourse);

export const COURSES = {
  vi: viCourse,
  en: enCourse
};

export { COURSE_EN, COURSE_RESOURCES, createDomLocalizer };

export function getCourse(lang = "vi") {
  return COURSES[lang] || COURSES.vi;
}

export function getReadyLessons(course) {
  return course.modules.flatMap((mod) => mod.lessons).filter((lesson) => !lesson.locked);
}

export function getLessonById(course, lessonId) {
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.id === lessonId) return { mod, lesson };
    }
  }
  return { mod: course.modules[0], lesson: course.modules[0].lessons[0] };
}

export function totalLessonsCount(course) {
  return course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
}
