import { EN_C } from "./en-c.js";
import { EN_MEMORY } from "./en-memory.js";
import { EN_ELECTRONICS } from "./en-electronics.js";

export const COURSE_EN = {
  ...EN_C,
  ...EN_MEMORY,
  ...EN_ELECTRONICS
};

const MODULE_TITLES_EN = {
  "mod-01": "01. Embedded C",
  "mod-electronics": "02. Electronics for Embedded Systems",
  "mod-03": "04. Embedded Systems & RTOS"
};

const LEVELS_EN = {
  "Cơ bản": "Basic",
  "Nền tảng": "Foundations",
  "Trung bình": "Intermediate",
  "Nâng cao": "Advanced",
  "Dự án": "Project"
};

const CALLOUT_LABELS_EN = {
  "CẦN NHỚ": "KEY IDEA",
  "LƯU Ý": "WATCH OUT",
  "KIẾN THỨC": "CONCEPT",
  "THỰC HÀNH": "LAB",
  "TÓM TẮT": "RECAP"
};

const PREVIEWS_EN = [
  ["Cortex-M Architecture & Assembly", "Explore CPU registers, the instruction cycle, and machine code generated from C.", ["R0–R12, SP, LR, PC", "LDR / STR / MOV / B", "Function call stack frames", "Disassembling C"]],
  ["Clock Tree & GPIO Programming", "Enable GPIO clocks and configure input and output electrical modes.", ["RCC_APB2ENR", "Push-pull vs. open-drain", "Floating input and pull-up", "Button debouncing"]],
  ["Interrupts, NVIC & SysTick", "Compare polling and interrupts and use interrupt priorities and periodic ticks.", ["Vector table", "EXTI and NVIC priority", "Saving context on the stack", "Non-blocking SysTick delays"]],
  ["Timer (Prescaler / ARR)", "Use counters for precise timing, input capture, and output compare.", ["F_update = F_clk / ((PSC+1)*(ARR+1))", "Up/down counter", "Timer interrupts", "Pulse-width measurement"]],
  ["Pulse-Width Modulation", "Compare a counter with CCR to control LED brightness and motor speed.", ["Duty cycle and frequency", "CCR vs. ARR", "RC low-pass filter", "Servo and DC motor control"]],
  ["UART / I2C / SPI & DMA", "Compare three serial buses and use DMA to transfer data to memory.", ["UART baud rate and ring buffer", "I2C start, ACK, and pull-up", "Four-wire SPI and CPOL/CPHA", "Peripheral-to-memory DMA"]],
  ["CAN, RTC & Watchdog", "Explore CAN arbitration, real-time clocks, and watchdog recovery.", ["CAN frame and bit arbitration", "CAN filter", "IWDG / WWDG", "Sleep and stop modes"]],
  ["FreeRTOS: Task, Queue & Mutex", "Explore real-time scheduling, task states, queues, and priority inversion.", ["Context switches", "Producer-consumer queue", "Mutex vs. semaphore", "Priority inversion"]],
  ["Bare-metal GCC, Makefile & Linker", "Build with arm-none-eabi-gcc, place sections with a linker script, and enter main from startup code.", ["Compiler → assembler → linker", "MEMORY and SECTIONS (.ld)", "Makefile dependency graph", "Programming with OpenOCD / ST-Link"]],
  ["Flash Layout & Bootloader", "Place the bootloader and application in Flash and hand off execution using the application's vector table.", ["Bootloader memory map", "SCB->VTOR relocation", "Application MSP and reset handler", "Firmware CRC validation"]],
  ["STM32 + LoRa Module Project", "Design a sensor node and gateway that use the SX1278 over SPI.", ["SX1278 SPI control", "Spreading factor and bandwidth", "Frame encoding and checksum", "Node power savings"]]
];

export function buildEnglishCourse(viCourse) {
  let previewIndex = 0;
  return {
    ...viCourse,
    modules: viCourse.modules.map((mod) => ({
      ...mod,
      title: MODULE_TITLES_EN[mod.id] || mod.title,
      lessons: mod.lessons.map((lesson) => {
        const meta = {
          ...lesson,
          duration: lesson.duration.replace(" phút", " min"),
          level: LEVELS_EN[lesson.level] || lesson.level
        };
        if (lesson.locked) {
          const [title, subtitle, topics] = PREVIEWS_EN[previewIndex++];
          return { ...meta, title, subtitle, topics };
        }
        const translated = COURSE_EN[lesson.id];
        const { steps, ...labels } = translated;
        return {
          ...meta,
          youllLearn: lesson.youllLearn.map((goal, i) =>
            goal === lesson.steps[i]?.title ? steps[i].title : goal
          ),
          ...labels,
          steps: lesson.steps.map((step, i) => {
            const { callout, diff, nodes, quiz, openQuestions, kpis, legend, ...text } = steps[i];
            return {
              ...step,
              ...text,
              callout: {
                ...step.callout,
                label: CALLOUT_LABELS_EN[step.callout.label] || step.callout.label,
                ...callout
              },
              diff: step.diff.map((item, j) => ({ ...item, text: diff[j] })),
              scene: nodes ? { ...step.scene, nodes } : step.scene,
              quiz: step.quiz?.map((question, j) => ({ ...question, ...quiz[j] })),
              openQuestions: step.openQuestions?.map((q, j) => ({ ...q, ...openQuestions?.[j] })),
              kpis: step.kpis.map((item, j) => ({ ...item, ...kpis?.[j] })),
              legend: step.legend.map((item, j) => ({
                ...item,
                label: legend?.[j] ?? item.label
              }))
            };
          })
        };
      })
    }))
  };
}

export function createDomLocalizer(doc = typeof document !== "undefined" ? document : null) {
  if (!doc) {
    return { apply() {} };
  }

  const fields = ["text", "aria-label", "title", "placeholder"];
  const staticLabels = fields.flatMap((field) => {
    const key = field === "text" ? "data-en" : "data-en-" + field;
    return Array.from(doc.querySelectorAll("[" + key + "]"), (node) => ({
      node,
      field,
      vi: field === "text" ? node.textContent : node.getAttribute(field),
      en: node.getAttribute(key)
    }));
  });
  const initialTitle = doc.title;

  return {
    apply(lang) {
      doc.documentElement.lang = lang;
      doc.title = lang === "en" ? "Designed to Embed — Embedded C and Electronics" : initialTitle;
      for (const label of staticLabels) {
        if (label.field === "text") label.node.textContent = label[lang];
        else label.node.setAttribute(label.field, label[lang]);
      }
    }
  };
}
