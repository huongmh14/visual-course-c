export const EN_PHASE_A_EXT = {
  "c-operators-conversions": {
    title: "Operators, Type Conversions & Signed/Unsigned Traps",
    subtitle:
      "Understand automatic type widening, avoid the -1 < 1U comparison trap, prevent 16-bit ADC multiply wraparound, handle timer rollover, and clamp arithmetic safely.",
    youllLearn: [
      "Predict exact expression types and values when C widens narrow integers before calculating",
      "Avoid unpredictable bugs in INT32_MIN / -1, double edits (i = i++), and 16-bit MCU ADC multiply wraparound",
      "Write wraparound-safe (now - start) >= timeout checks across 16-bit and 32-bit hardware timers"
    ],
    steps: [
      {
        title: "Auto Type Widening, -1 < 1U Trap & Nearest Rounding",
        body:
          "Every C expression carries both a **value** and a **type**. Before `+ - * /` run, types narrower than `int` (`uint8_t`, `int8_t`, `uint16_t`) are **automatically widened to `int`** (when `int` fits all values). When mixing signed `int` with `unsigned int` (e.g., `-1 < 1U`), C silently turns `-1` into `UINT_MAX` (`4294967295U`), making the comparison **FALSE (`0`)**! Integer `/` truncates toward `0`, so nearest half-away-from-zero rounding (`div_round`, e.g., `7 / 2 → 4`, `-7 / 2 → -4`) must inspect quotient `q = a / b`, remainder `r = a % b`, and sign without adding `b / 2` directly to `a` (which overflows near `INT32_MAX`).",
        codeLang: "C · auto widening, -1 < 1U trap & div_round",
        code: `#include <limits.h>
#include <stdint.h>

/* 1) Auto widening: uint8_t + uint8_t executes as int */
uint8_t u1 = 200U, u2 = 100U;
int sum = u1 + u2;            /* 300 in int (not 44!), only casting (uint8_t) wraps to 44 */

/* 2) -1 < 1U trap: negative int is converted to huge unsigned int */
int x = -1;
unsigned int len = 1U;
/* (x < len) evaluates to 0 because (unsigned int)(-1) == UINT_MAX! */
int safe_cmp = (x < 0) || ((unsigned int)x < len); /* guard negative side first */

/* 3) Round half-away-from-zero without overflowing INT32_MAX */
int32_t div_round(int32_t a, int32_t b) {
    if (b == 0) return 0;
    if (a == INT32_MIN && b == -1) return INT32_MAX; /* prevent signed overflow */
    int32_t q = a / b;
    int32_t r = a % b;
    int32_t abs_r = (r < 0) ? -r : r; /* safe since b != -1 */
    int32_t abs_b_half = ((b < 0) ? -(b / 2) : (b / 2));
    /* Compare |r| against |b|/2 without doubling |r| */
    int32_t add_one = (b % 2 == 0) ? (abs_r >= abs_b_half) : (abs_r > abs_b_half);
    if (add_one) {
        int same_sign = ((a < 0) == (b < 0));
        q += same_sign ? 1 : -1;
    }
    return q;
}`,
        callout: {
          text: "Never silence -Wsign-compare with blind casts! Always ask whether negative values are valid here: if yes, check x < 0 first; if not, switch the variable type to unsigned."
        },
        diff: [
          "u1 = 200U, u2 = 100U → u1 + u2 computes 300 in int; casting to (uint8_t) narrows it to 44.",
          "-1 < 1U becomes 4294967295U < 1U (false) — and -1L < 1U even flips behavior between 64-bit Linux and 32-bit STM32."
        ],
        kpis: [
          { label: "uint8_t + uint8_t", value: "Widened to int", sub: "200 + 100 = 300" },
          { label: "-1 < 1U", value: "0 (FALSE)", sub: "-1 → UINT_MAX" },
          { label: "div_round(-7, 2)", value: "-4", sub: "Half away from zero" }
        ],
        legend: ["Widened to int", "Signed → unsigned cast", "Overflow-safe rounding"]
      },
      {
        title: "Signed Division Overflow, Double Edits & 16-bit ADC Math",
        body:
          "In 32-bit two’s complement, `INT32_MIN` is `-2^31` while `INT32_MAX` is `2^31 - 1`. Thus `INT32_MIN / -1` equals `+2^31`, which **overflows `int32_t` and triggers unpredictable compiler behavior** — typically crashing with `SIGFPE` on x86! Likewise, `i = i++` or `a[i] = i++` modifies the same variable twice in one expression and is completely unpredictable. When scaling 12-bit ADC readings (`raw * 3300U / 4095U`), `4095 * 3300 = 13,513,500` runs fine on 32-bit STM32 `int`, but on a 16-bit MCU (AVR/MSP430 where `unsigned int` holds `0..65535`), casting `(uint32_t)` *after* multiplying `(uint32_t)(raw * 3300U)` causes **16-bit unsigned wraparound yielding a wrong number** (`13,513,500 mod 65,536 = 13,084`)!",
        codeLang: "C · guarding signed division & widening before multiply",
        code: `#include <limits.h>
#include <stdbool.h>
#include <stdint.h>

/* 1) Safe integer division for all int32_t pairs */
bool safe_div(int32_t a, int32_t b, int32_t *out) {
    if (out == NULL || b == 0 || (a == INT32_MIN && b == -1)) {
        return false;
    }
    *out = a / b;
    return true;
}

/* 2) Avoid unpredictable bugs: modify a variable at most once per statement */
/* BAD: int k = i++ + ++i; */
/* GOOD: split updates into separate sequenced statements */

/* 3) 12-bit ADC (0..4095) -> mV (0..3300) portable across 16-bit & 32-bit MCUs */
uint16_t adc_to_mv(uint16_t raw) {
    /* Widen first operand to uint32_t BEFORE multiplying to avoid 16-bit wraparound */
    uint32_t mv = ((uint32_t)raw * 3300U + 2047U) / 4095U;
    return (uint16_t)mv;
}`,
        callout: {
          text: "Golden cast rule: cast one operand to a wider type BEFORE an arithmetic operation to expand the intermediate range; cast AFTER an operation only to intentionally narrow the result."
        },
        diff: [
          "((uint32_t)raw * 3300U + 2047U) / 4095U produces 13,513,500 identically on both 16-bit AVR and 32-bit STM32.",
          "(uint32_t)(raw * 3300U) on a 16-bit int MCU wraps modulo 65,536 to 13,084 — silent wrong math!"
        ],
        kpis: [
          { label: "INT32_MIN / -1", value: "Signed overflow", sub: "Guard before division" },
          { label: "4095 × 3300", value: "13,513,500", sub: "Wraps 16-bit (65,535)" },
          { label: "Widen before *", value: "(uint32_t)raw * 3300U", sub: "Portable across MCUs" }
        ],
        legend: ["Widening cast", "32-bit intermediate", "Boundary guard"],
        nodes: [
          ["raw (uint16_t)", "Max 4095U"],
          ["(uint32_t)raw * 3300U", "Widen to 32-bit before multiply → 13,513,500"],
          ["(+ 2047U) / 4095U", "Nearest rounding → 3300 mV safely"]
        ],
        openQuestions: [
          {
            scenario: "ENGINEERING QUESTION · 16-BIT VS 32-BIT MCU",
            prompt:
              "On 64-bit Ubuntu and STM32 (32-bit `int`), `(uint32_t)(raw * 3300U)` and `(uint32_t)raw * 3300U` yield the same answer for `raw = 4095`. Why does the first expression silently wrap to a wrong value on an AVR MCU with 16-bit `int`, and why is `INT32_MIN / -1` unpredictable behavior even though the divisor is non-zero?",
            placeholder: "Analyze the intermediate product type on 16-bit unsigned int and the two's complement range of INT32_MIN...",
            hint: "Check the type of raw * 3300U when unsigned int is 16-bit (0..65535), and compare |-2147483648| against INT32_MAX = +2147483647."
          }
        ]
      },
      {
        title: "Timer Wraparound Elapsed Time: (uint32_t)(now - start) >= timeout",
        body:
          "A hardware 1 ms tick counter wraps back to `0` past `UINT16_MAX` (`65,535`) or `UINT32_MAX` (`49.7` days). The naive check `now >= start + timeout` **breaks near rollover** because `start + timeout` wraps before `now` does. Unsigned subtraction `now - start` computes modulo `2^N` and always gives exact elapsed ticks (`now = 5, start = 0xFFFFFFF0 → 21`). For **16-bit timers (`uint16_t`)**, omitting the `(uint16_t)` cast widens both operands to `int`, turning `5 - 65520` into `-65515 < 20`!",
        codeLang: "C · 16-bit & 32-bit wraparound timeouts",
        code: `#include <stdbool.h>
#include <stdint.h>

/* Correct for any timer width when real wait < 2^N ticks */
bool timeout_elapsed32(uint32_t now, uint32_t start, uint32_t timeout) {
    return (uint32_t)(now - start) >= timeout;
}

bool timeout_elapsed16(uint16_t now, uint16_t start, uint16_t timeout) {
    /* Without (uint16_t): int(5) - int(0xFFF0) = -65515 -> wrong! */
    return (uint16_t)(now - start) >= timeout;
}

/* Rollover boundary check:
 * start = 0xFFF0U, now = 5U -> 21 ticks elapsed (0xFFF0..0xFFFF = 16, 0..5 = 5)
 * (uint16_t)(5U - 0xFFF0U) == 21U >= 20U -> true!
 */`,
        callout: {
          text: "Always write (uint16_t)(now - start) >= timeout or (uint32_t)(now - start) >= timeout. Modulo subtraction gives exact elapsed ticks as long as the real delay is less than one full counter period."
        },
        diff: [
          "now = 5U, start = 0xFFF0U → (uint16_t)(now - start) = 21U, returning true for timeout = 20U.",
          "now >= start + timeout with start = 0xFFF0U, timeout = 20U wraps start + timeout to 4 → wrong when now = 0xFFF5U!"
        ],
        kpis: [
          { label: "32-bit Timer", value: "49.7 days", sub: "1 tick = 1 ms" },
          { label: "5 - 0xFFF0 (int)", value: "-65,515", sub: "Broken by auto widening" },
          { label: "(uint16_t)(5 - 0xFFF0)", value: "21 ticks", sub: "Exact modulo 65,536" }
        ],
        legend: ["Counter wrap past 0", "Negative widening bug", "Exact modulo delta"]
      },
      {
        title: "Lab · Rounding Division, Wraparound Timer & Clamped Math",
        body:
          "Complete the practice exercises in `submission.c` on Ubuntu WSL with `-Wall -Wextra -Werror -fsanitize=undefined` (and inspect `-Wconversion` warnings): (1) `div_round(a, b)` for all sign pairs + `INT32_MIN`, (2) `timeout_elapsed16/32` across wraparound, (3) `adc_to_temp_x10(raw)` for TMP36 (`500 mV + 10 mV/°C`) returning `INT16_MIN` when `raw > 4095U`, and (4) clamping arithmetic `sat_add_u8`, `sat_add_i16`, and `brightness_step(level, delta)` clamped to `[0..255]` with zero overflow bugs.",
        codeLang: "C · submission.c & boundary asserts",
        code: `/* Compile:
 * gcc -Wall -Wextra -Werror -fsanitize=undefined submission.c -o /tmp/operators_lab
 */
assert(div_round(7, 2) == 4);
assert(div_round(-7, 2) == -4);
assert(div_round(INT32_MIN, -1) == INT32_MAX);
assert(div_round(9, 0) == 0);

assert(timeout_elapsed16(5U, 0xFFF0U, 20U) == true);
assert(timeout_elapsed16(5U, 0xFFF0U, 22U) == false);
assert(timeout_elapsed32(5U, 0xFFFFFFF0U, 20U) == true);

assert(adc_to_temp_x10(931U) == 250);      /* 750 mV -> 25.0 C */
assert(adc_to_temp_x10(4096U) == INT16_MIN);

assert(sat_add_u8(200U, 100U) == 255U);
assert(sat_add_i16(-30000, -10000) == -32768);
assert(brightness_step(250U, 10) == 255U);
assert(brightness_step(5U, -10) == 0U);`,
        callout: {
          text: "While sat_add_i16(a, b) can widen to int32_t and clamp, implementing sat_add_i32(int32_t a, int32_t b) requires checking overflow conditions BEFORE adding because signed overflow causes unpredictable behavior."
        },
        diff: [
          "Enable -fsanitize=undefined to immediately catch any runtime signed overflow or division by zero.",
          "Use INT16_MIN as the error sentinel in adc_to_temp_x10 instead of -1 (since -1 represents valid -0.1 °C)."
        ],
        kpis: [
          { label: "Theory", value: "10 Qs · 20 pts", sub: "Widening & overflow checks" },
          { label: "4 practice funcs", value: "80 pts", sub: "div, timeout, ADC, sat" },
          { label: "Sanitizer", value: "UBSan clean", sub: "-fsanitize=undefined" }
        ],
        legend: ["Inputs & boundaries", "Safe verification", "Passing asserts"],
        nodes: [
          ["6-step analysis", "List worst-case min/max intermediate values"],
          ["Safe C code", "div_round + timeout + adc_temp + sat_add"],
          ["UBSan + assert", "Pass all edge cases INT32_MIN / 0xFFF0"]
        ],
        quiz: [
          {
            prompt:
              "With `uint16_t now = 5U, start = 0xFFF0U, timeout = 20U` on a 32-bit PC, why does `if (now - start >= timeout)` NOT run while `if ((uint16_t)(now - start) >= timeout)` succeeds?",
            options: [
              "Because uint16_t widens to int so 5 - 65520 = -65515 < 20; casting (uint16_t) brings the difference modulo 65536 to 21",
              "Because subtracting two uint16_t values always clamps to 0",
              "Because literal 20U has type unsigned long"
            ],
            explain:
              "Under automatic type widening, both uint16_t operands widen to 32-bit int before subtraction, yielding -65515. Casting (uint16_t) recovers the exact modulo 2^16 difference of 21."
          },
          {
            prompt:
              "On an AVR MCU with 16-bit `int` and `uint16_t raw = 4095U`, which expression computes `raw * 3300U` WITHOUT 16-bit wraparound?",
            options: [
              "(uint32_t)(raw * 3300U)",
              "(uint32_t)raw * 3300U",
              "(uint16_t)raw * 3300"
            ],
            explain:
              "You must widen one operand to uint32_t BEFORE multiplying; casting after (raw * 3300U) means the multiplication already wrapped around 16-bit unsigned int."
          }
        ]
      }
    ]
  },
  "c-modular-makefile": {
    title: "Independent Functions, Multi-file Headers, UART Strings & Makefile",
    subtitle:
      "Write stateless independent functions, split .h/.c files cleanly, filter sensor noise, parse UART strings safely, and automate builds with Makefile.",
    youllLearn: [
      "Design independent functions (no hidden state) and bool fn(..., T *out) contracts decoupled from printf",
      "Organize multi-file .h/.c modules (include guards, extern, static inline) and automate rebuilds with Makefile",
      "Build sensor filters (Median-3, Moving Avg-4) and overflow-safe UART/NMEA string parsers"
    ],
    steps: [
      {
        title: "Independent Functions (No Hidden State), Anti-Jitter & Multi-Return",
        body:
          "Storing alarm state in a hidden `static` variable inside a function prevents reusing it across **two separate sensors** and complicates unit testing. Instead, write an **independent function** `alarm_update(bool current, int16_t temp_c)` that takes the previous state explicitly and returns the next state (anti-jitter hysteresis: `>= 60 °C` turns ON, `<= 55 °C` turns OFF, deadband keeps `current`). Whenever a function can fail (divide by zero, `NULL`, out-of-range), return **`bool`** (or status `enum`), write output via `*out`, and **leave `*out` untouched** on error.",
        codeLang: "C · independent function, hysteresis & out-pointer",
        code: `#include <limits.h>
#include <stdbool.h>
#include <stdint.h>

/* Independent hysteresis step: no hidden static state, reusable across all channels */
bool alarm_update(bool current, int16_t temp_c) {
    if (temp_c >= 60) {
        return true;
    }
    if (temp_c <= 55) {
        return false;
    }
    return current;
}

/* Status bool return + explicit output pointer */
bool safe_div_i32(int32_t a, int32_t b, int32_t *out_q) {
    if (out_q == NULL || b == 0 || (a == INT32_MIN && b == -1)) {
        return false; /* leave *out_q untouched on error */
    }
    *out_q = a / b;
    return true;
}`,
        callout: {
          text: "Separate domain logic from printf/scanf: independent functions compile and pass identical assert tests on both your PC and STM32."
        },
        diff: [
          "Passing current explicitly lets one alarm_update() drive arbitrarily many independent sensors.",
          "Avoid burying static bool alarm inside helper functions when multiple channels share the code."
        ],
        kpis: [
          { label: "Independent fn", value: "0 hidden state", sub: "Deterministic I/O" },
          { label: "Anti-jitter band", value: "55..60 °C", sub: "Prevents relay chatter" },
          { label: "Multi-return", value: "bool + *out", sub: "Preserves *out on fail" }
        ],
        legend: ["Explicit inputs", "NULL / range guards", "Safe *out update"],
        nodes: [
          ["(current, temp_c)", "Explicit state parameter, no hidden variable"],
          ["Guard NULL / range", "Return false and keep *out intact"],
          ["Predictable output", "Simple assert coverage for every transition"]
        ]
      },
      {
        title: "Splitting .h/.c Files, Macros vs Inline Functions & Makefile Builds",
        body:
          "Header `.h` files hold **declarations (`extern` / prototypes), types, and `static inline` helpers** — never variable definitions or non-inline functions, which trigger **`multiple definition`** linker errors when two `.c` files include the header. Wrap macro arguments in parentheses `((x) * (x))` and multi-statement macros in `do { ... } while (0)`, or better yet prefer **`static inline`** for type safety and single argument evaluation. In `Makefile`, generate `.d` dependency files with `-include $(DEPS)` so changing a `.h` file automatically rebuilds dependent `.o` targets, and declare `.PHONY` for `all`, `test`, `size`, and `clean`.",
        codeLang: "Header .h + Makefile auto-dependency tracking",
        code: `/* --- sensor_filter.h --- */
#ifndef SENSOR_FILTER_H
#define SENSOR_FILTER_H
#include <stdint.h>

static inline int32_t sf_max_i32(int32_t a, int32_t b) {
    return (a > b) ? a : b; /* safe even with sf_max_i32(x++, y) */
}
uint16_t sf_median3_u16(uint16_t a, uint16_t b, uint16_t c);
#endif

/* --- Makefile --- */
// CFLAGS  := -Wall -Wextra -Werror -Wshadow -Isrc
// DEPS    := $(OBJS:.o=.d)
// .PHONY: all test size clean
// -include $(DEPS) /* pair with compiler flags that emit .d files for .h tracking */`,
        callout: {
          text: "Never define global variables or non-inline functions in a .h file. Without generated .d files and -include $(DEPS), editing a constant in a header leaves stale .o files un-rebuilt!"
        },
        diff: [
          "static inline enforces C type checks and evaluates each argument once, replacing simple function-like macros.",
          "Putting int g_count = 0; inside a .h file causes linker multiple definition errors across translation units."
        ],
        kpis: [
          { label: "Include guard", value: "#ifndef _H", sub: "Prevents double inclusion" },
          { label: "Multi-stmt macro", value: "do{...}while(0)", sub: "Safe inside if/else" },
          { label: "Auto-deps", value: ".d files + DEPS", sub: "Tracks .h modifications" }
        ],
        legend: ["Compile .c → .o + .d", "Track .h dependencies", "Link executable binary"],
        openQuestions: [
          {
            scenario: "LIBRARY DESIGN · MULTI-FILE FILTER",
            prompt:
              "1) In `sf_pipeline_filter(raw_in, clean_out, scratch, len)`, why does the API force callers to pass a `scratch[]` buffer instead of hiding a `static uint16_t scratch[256]` array inside the function or calling `malloc`? 2) Without `.d` header dependency tracking (`-include $(DEPS)`) in your `Makefile`, what silent bug happens after editing `#define SENSOR_VREF_MV` in a `.h` file?",
            placeholder: "Discuss fixed-RAM/reentrancy of caller-supplied scratch[] and stale .o rebuilds...",
            hint: "Think about buffer-size limits, reentrancy, zero-heap determinism on MCUs, and how make only checks .c timestamps without .d dependency files."
          }
        ]
      },
      {
        title: "Passing Arrays with Length, Sensor Noise Filtering & Safe UART Parsing",
        body:
          "Passing an array `f(const uint16_t buf[], size_t len)` collapses `buf` to a pointer, so `sizeof(buf)` returns pointer size (4 or 8 bytes), never element count — only apply `ARRAY_LEN(arr)` in the array’s declaring scope! For noisy sensors, **Median-3** strips single-sample spikes before **Moving Avg-4** smooths the curve. For UART/CLI strings, **ban `atoi`, `strcpy`, `strtok`**: implement `parse_u16` with per-digit overflow guard `(65535U - d) / 10U`, check `snprintf` truncation `(size_t)n >= buf_size`, and verify NMEA `$payload*CS\\r\\n` via XOR checksum.",
        codeLang: "C · spike filtering + parse_u16 & NMEA XOR checksum",
        code: `/* 1) Median of 3 samples (removes impulse spikes without blurring edges) */
uint16_t sf_median3_u16(uint16_t a, uint16_t b, uint16_t c) {
    if (a > b) { uint16_t t = a; a = b; b = t; }
    if (b > c) { uint16_t t = b; b = c; c = t; }
    if (a > b) { uint16_t t = a; a = b; b = t; }
    return b;
}

/* 2) Strict unsigned parser replacing atoi: rejects non-digits and u16 overflow */
bool parse_u16(const char *s, uint16_t *out) {
    if (s == NULL || out == NULL || s[0] == '\\0') return false;
    uint32_t acc = 0U;
    for (size_t i = 0U; s[i] != '\\0'; i++) {
        if (s[i] < '0' || s[i] > '9') return false;
        uint32_t d = (uint32_t)(s[i] - '0');
        if (acc > (65535U - d) / 10U) return false; /* guard before multiplying by 10 */
        acc = acc * 10U + d;
    }
    *out = (uint16_t)acc;
    return true;
}`,
        callout: {
          text: "atoi(\"abc\") silently returns 0 and overflow in atoi causes unpredictable bugs! Likewise, snprintf returns what WOULD have been written — always check n < 0 || (size_t)n >= buf_size to catch truncation."
        },
        diff: [
          "Median-3 preserves step edges while completely erasing isolated impulse noise spikes.",
          "strtok mutates the input string with '\\0' and relies on hidden static global state."
        ],
        kpis: [
          { label: "Array param", value: "Ptr + len", sub: "sizeof returns 4/8 bytes" },
          { label: "2-stage filter", value: "Med-3 → Avg-4", sub: "De-spike then smooth" },
          { label: "NMEA XOR", value: "$payload*CS", sub: "Byte-wise XOR checksum" }
        ],
        legend: ["Median-3 spike removal", "Moving Avg-4 smoothing", "Overflow-safe parsing"],
        nodes: [
          ["raw_in[] + len", "Explicit length, reject NULL and in == out"],
          ["Median-3 → Avg-4", "Eliminate impulse spikes before averaging 4 samples"],
          ["parse_u16 / snprintf", "Reject garbage, guard 65535, detect truncation"]
        ]
      },
      {
        title: "Lab · Multi-File Sensor Filter Library & Self-Tests",
        body:
          "Build a multi-file sensor filter library combining `sensor_filter.h/.c` (Median-3, Moving Avg-4, Hysteresis, 2-stage pipeline taking `scratch[]` with aliasing checks), `cli.h/.c` (encapsulating `th = 3000, hys = 200` via `static`, handling `SET TH`, `SET HYS`, `GET`, `RESET` with `cli_status_t`), `main.c`, and `test_filter.c`. Build with `Makefile` (tracking `.h` changes, `DEBUG=1`), run `make`, `make test`, and inspect `.text/.data/.bss` via `make size`, plus write clear API docs in `README.md`.",
        codeLang: "Makefile & assert · multi-file library self-tests",
        code: `/* Run inside the lab folder on Ubuntu WSL:
 * make clean && make && make test && make size
 */
uint16_t raw[] = {1000U, 1020U, 9900U, 1010U, 1005U}; /* 9900 spike removed by Median-3 */
uint16_t scratch[5] = {0}, clean[5] = {0};
assert(sf_pipeline_filter(raw, clean, scratch, 5U) == true);
assert(sf_pipeline_filter(raw, clean, clean, 5U) == false); /* reject aliased buffers */

assert(cli_exec("SET TH 200", resp, sizeof resp) == CLI_ERR_RANGE); /* <= default hys 200 */
assert(cli_exec("SET TH 3500", resp, sizeof resp) == CLI_OK);
assert(cli_exec("GET", resp, sizeof resp) == CLI_OK);`,
        callout: {
          text: "Clean API rule: another engineer should be able to read only README.md and the .h headers and use the entire library correctly without opening any .c file."
        },
        diff: [
          "make test must compile and pass with 0 warnings under -Wall -Wextra -Werror -Wshadow.",
          "make size reports exact .text (Flash), .data, and .bss (SRAM) section sizes."
        ],
        kpis: [
          { label: "Filter module", value: "25 pts", sub: "Med-3 + Avg-4 + Hys" },
          { label: "CLI parser", value: "25 pts", sub: "No strtok / atoi" },
          { label: "Makefile & API", value: "50 pts", sub: "Auto rebuild + README" }
        ],
        legend: ["Public .h headers", "Encapsulated static .c", "make test & size"],
        nodes: [
          ["sensor_filter + cli", "Clean .h/.c split, static config inside cli.c"],
          ["Makefile auto-deps", "Auto-rebuild on .h changes, DEBUG=1 toggle"],
          ["make test && make size", "Full assert coverage & Flash/SRAM breakdown"]
        ],
        quiz: [
          {
            prompt:
              "Which declaration placed inside a `.h` file causes a linker `multiple definition` error when included by two `.c` files?",
            options: [
              "extern uint32_t g_tick;",
              "static inline uint32_t clamp_u32(uint32_t x) { return x; }",
              "uint32_t g_tick = 0U;"
            ],
            explain:
              "uint32_t g_tick = 0U; is a variable definition emitting a strong symbol in every translation unit that includes the header. Declare extern in .h and define once in a .c file."
          },
          {
            prompt:
              "After `int n = snprintf(buf, sizeof(buf), \"%s\", src);`, which condition proves `src` was truncated?",
            options: [
              "n == 0",
              "n < 0 || (size_t)n >= sizeof(buf)",
              "n == (int)(sizeof(buf) - 1)"
            ],
            explain:
              "snprintf returns the number of characters it wanted to write (excluding '\\0'). Whenever n >= sizeof(buf), output was truncated."
          }
        ]
      }
    ]
  },
  "c-callbacks-fsm": {
    title: "Callbacks, Command Dispatch Tables & State Machines",
    subtitle:
      "Read the 3 const pointer forms, pass typedef callbacks with void *user_ctx, build command dispatch tables, catch missing enum states with -Wswitch, and pack tagged data.",
    youllLearn: [
      "Distinguish all 3 const positions (IDR vs ODR), walk buffers via p < end, and pass void *user_ctx in callbacks",
      "Implement Flash-resident Dispatch Tables and -Wswitch enum state machines without hiding missing states under default:",
      "Pack compact event queues with Tagged Unions and read float bytes safely using memcpy"
    ],
    steps: [
      {
        title: "3 Ways to Use const on Registers & Callbacks with Context",
        body:
          "Read C pointer declarations **right-to-left around `*`**: `const volatile uint32_t *idr` points to hardware-updated **read-only** memory (`GPIOx->IDR` — readable, write-protected by the compiler); `volatile uint32_t *const odr` has a **constant address** (pinned to `0x4001080C`) pointing to a writable register. When designing callback APIs with function-pointer `typedef`s, always include a **`void *user_ctx`** parameter so multiple instances (e.g., two sensors or buttons) carry their own context without resorting to globals.",
        codeLang: "C · 3 const positions & user_ctx callback",
        code: `#include <stddef.h>
#include <stdint.h>

/* 1) Read right-to-left: */
const volatile uint32_t *p_idr = NULL; /* *p_idr is read-only, pointer can move */
volatile uint32_t *const p_odr = (volatile uint32_t *)0x4001080CU; /* fixed address */

/* 2) Callback typedef + caller context pointer */
typedef void (*sample_cb_t)(uint16_t sample, void *user_ctx);

typedef struct {
    uint16_t threshold;
    size_t count;
} threshold_ctx_t;

void for_each_sample(const uint16_t *buf, size_t len,
                     sample_cb_t cb, void *user_ctx) {
    if (buf == NULL || len == 0U || cb == NULL) return;
    const uint16_t *end = buf + len; /* one-past-end for comparison only */
    for (const uint16_t *p = buf; p < end; p++) {
        cb(*p, user_ctx);
    }
}`,
        callout: {
          text: "Never return the address of a stack local variable (dangling pointer), and always validate NULL before dereferencing a pointer or invoking a callback pointer cb(x, ctx)!"
        },
        diff: [
          "typedef void (*sample_cb_t)(uint16_t, void *) keeps registration signatures readable and uniform.",
          "Omitting void *user_ctx forces global state and breaks multi-instance drivers."
        ],
        kpis: [
          { label: "const T *p", value: "Read-only *p", sub: "Models hardware IDR" },
          { label: "T *const p", value: "Pinned address", sub: "Fixed ODR pointer" },
          { label: "void *user_ctx", value: "0 globals", sub: "Multi-instance / reentrant" }
        ],
        legend: ["const / NULL guards", "p < end traversal", "Callback + user_ctx"],
        nodes: [
          ["const / NULL guard", "Block null pointers & protect read-only registers"],
          ["for (p = buf; p < end; p++)", "Pointer stepping by sizeof(*p)"],
          ["cb(*p, user_ctx)", "Deliver samples without global state"]
        ]
      },
      {
        title: "Command Dispatch Tables, Enums & State Machines",
        body:
          "Replace sprawling `if (strcmp(...)) ... else if ...` chains with a **`static const` Dispatch Table** (`{name, handler}`) stored in Flash (`.rodata`) — adding a command takes one table row. For `enum` state machines, define a trailing sentinel like `STATE_COUNT`, validate external values before switching, and **omit `default:`** under `-Wswitch` so the compiler flags any new state you forget to handle! Centralizing transitions in a `door_fsm_step` function keeps every state rule traceable.",
        codeLang: "C · Dispatch Table & Enum -Wswitch State Machine",
        code: `typedef enum {
    STATE_LOCKED = 0,
    STATE_ENTERING,
    STATE_UNLOCKED,
    STATE_LOCKOUT,
    STATE_COUNT
} door_state_t;

const char *door_state_name(door_state_t s) {
    switch (s) { /* Omit default: so -Wswitch catches missing enum cases! */
    case STATE_LOCKED:   return "LOCKED";
    case STATE_ENTERING: return "ENTERING";
    case STATE_UNLOCKED: return "UNLOCKED";
    case STATE_LOCKOUT:  return "LOCKOUT";
    case STATE_COUNT:    break;
    }
    return "INVALID"; /* safe fallback for out-of-range values */
}

/* Command Dispatch Table residing in .rodata (Flash) */
typedef bool (*cmd_fn_t)(const char *arg, void *ctx);
typedef struct { const char *name; cmd_fn_t fn; } cmd_entry_t;
static const cmd_entry_t k_cmds[] = {
    { "SET", handle_set }, { "GET", handle_get }, { "RESET", handle_reset }
};`,
        callout: {
          text: "Putting default: inside an enum switch silences -Wswitch warnings when a new state is added later. List every enumerator explicitly and validate range before switching."
        },
        diff: [
          "static const dispatch tables sit in Flash (.rodata), consuming zero SRAM.",
          "Omitting default: with -Wswitch + _COUNT turns the compiler into an automated state-completeness checker."
        ],
        kpis: [
          { label: "Dispatch Table", value: "static const", sub: "Lookup table in Flash" },
          { label: "Enum safety", value: "-Wswitch", sub: "Flags missing cases" },
          { label: "4 FSM states", value: "LOCKED..LOCKOUT", sub: "Explicit transitions" }
        ],
        legend: ["Dispatch / Input Event", "Guard / -Wswitch check", "Next FSM State"],
        openQuestions: [
          {
            scenario: "FIRMWARE ARCHITECTURE · DISPATCH & STATE MACHINE",
            prompt:
              "1) Why do we intentionally **omit `default:`** inside `switch (state)` functions like `door_state_name` while enabling `-Wswitch`? 2) When sharing a single callback signature `typedef void (*btn_cb_t)(uint8_t event, void *ctx)` between POWER and MODE buttons, what problem does `void *ctx` solve compared to global variables?",
            placeholder: "Explain -Wswitch completeness checking and per-instance context via user_ctx...",
            hint: "Imagine adding STATE_MAINTENANCE to the enum three months later, and imagine two buttons calling the same callback handler."
          }
        ]
      },
      {
        title: "Reading Float Bytes with memcpy & Tagged Data Containers",
        body:
          "Inspecting raw bytes of a `float` via pointer casting `*(uint32_t *)&f` is **breaking C's pointer type rules (use memcpy safely instead)** — the optimizer can miscompile it under `-O2`! The standard, zero-overhead way is **`memcpy(&bits, &val, sizeof(bits))`**. To store mixed events inside a fixed-size static array or Ring Buffer, wrap a label `enum type` together with a `union` payload into a **Tagged Union** (`door_event_t`), and always validate `evt->type` before reading any union member.",
        codeLang: "C · memcpy bit-read & Tagged Union",
        code: `#include <stdint.h>
#include <string.h>

/* 1) Safe bit read (GCC -O2 compiles to a single register move) */
uint32_t float_to_u32_bits(float val) {
    uint32_t bits = 0U;
    memcpy(&bits, &val, sizeof(bits));
    return bits;
}

/* 2) Tagged Union for door events (compact fixed size) */
typedef enum {
    EVT_DIGIT = 0, EVT_SUBMIT, EVT_CLEAR,
    EVT_TICK_1S, EVT_DOOR_OPENED, EVT_DOOR_CLOSED, EVT_COUNT
} door_evt_type_t;

typedef struct {
    door_evt_type_t type;
    union {
        char digit; /* Valid only when type == EVT_DIGIT ('0'..'9') */
    } data;
} door_event_t;`,
        callout: {
          text: "Never read a union field when the tag `type` specifies a different variant! Always validate both evt->type and payload bounds (such as '0'..'9') before reading evt->data.digit."
        },
        diff: [
          "memcpy(&bits, &val, sizeof(bits)) is 100% standard-compliant under -O2/-O3 optimization.",
          "*(uint32_t *)&val breaks C pointer type rules and can be miscompiled under optimization."
        ],
        kpis: [
          { label: "Bit read", value: "memcpy()", sub: "Safe under -O2/-O3" },
          { label: "Tagged Union", value: "tag + union", sub: "Compact queue elements" },
          { label: "Tag check", value: "evt->type", sub: "Check before union read" }
        ],
        legend: ["Discriminant tag", "Shared union payload", "Safe variant read"],
        nodes: [
          ["door_event_t.type", "Selects active union payload variant"],
          ["Validate payload", "Verify '0'..'9' when EVT_DIGIT"],
          ["memcpy() bit-read", "Safe byte copy without pointer punning"]
        ]
      },
      {
        title: "Lab · Automatic Door-Lock State Machine Controller",
        body:
          "Build a smart door-lock controller with `door_fsm.h`, `door_fsm.c`, `test_door_fsm.c`, `Makefile`, and `DESIGN.md` (including a **Mermaid `stateDiagram-v2`** mapping every transition arrow 1-to-1 to `assert` tests). Verify every edge rule: empty `EVT_SUBMIT` stays locked without incrementing `wrong_attempts`, 3 wrong PINs enter `STATE_LOCKOUT`, 10s inactivity in `STATE_ENTERING` cancels entry, >4 digits sets `input_overflow`, and opening the door while `STATE_LOCKED` latches `alarm_active = true` until a valid unlock.",
        codeLang: "C · contract & traceability asserts",
        code: `door_ctx_t ctx;
assert(door_fsm_init(&ctx, "1234") == true);
assert(ctx.state == STATE_LOCKED);

/* 1) Forced door open while locked -> alarm stays latched even after door closes */
door_event_t open_ev = { .type = EVT_DOOR_OPENED };
door_event_t close_ev = { .type = EVT_DOOR_CLOSED };
assert(door_fsm_step(&ctx, &open_ev) && ctx.alarm_active == true);
assert(door_fsm_step(&ctx, &close_ev) && ctx.alarm_active == true);

/* 2) Non-digit payload -> returns false without corrupting ctx */
door_event_t bad_digit = { .type = EVT_DIGIT, .data.digit = 'A' };
assert(door_fsm_step(&ctx, &bad_digit) == false);
assert(ctx.state == STATE_LOCKED && ctx.alarm_active == true);`,
        callout: {
          text: "Keep zero global variables in door_fsm.c: store all state inside door_ctx_t so test_door_fsm.c can run independent scenarios cleanly."
        },
        diff: [
          "Verify 100% transition arrow coverage matching the Mermaid stateDiagram-v2 diagram in DESIGN.md.",
          "Compile cleanly under -Wall -Wextra -Werror -Wshadow with UBSan/ASan."
        ],
        kpis: [
          { label: "FSM context", value: "door_ctx_t", sub: "Zero global state" },
          { label: "Transition coverage", value: "100% arrows", sub: "Mermaid ↔ assert table" },
          { label: "Edge guards", value: "Overflow & Lockout", sub: "3 failures / 10s idle" }
        ],
        legend: ["Init & contract", "FSM transition rules", "Traceability asserts"],
        nodes: [
          ["Mermaid stateDiagram-v2", "Document all 4 states & edge triggers"],
          ["door_fsm.h / .c", "Context struct + -Wswitch + tagged union"],
          ["test_door_fsm.c", "Assert every arrow & invalid NULL/digit calls"]
        ],
        quiz: [
          {
            prompt:
              "Which pointer declaration correctly models a hardware-updated read-only input register such as `GPIOA->IDR`?",
            options: [
              "const volatile uint32_t *p_idr",
              "uint32_t *const p_idr",
              "volatile uint32_t *p_idr"
            ],
            explain:
              "volatile prevents caching hardware reads, while const prohibits firmware writes through *p_idr."
          },
          {
            prompt:
              "Why is `memcpy(&u32, &f32, sizeof u32)` preferred over `*(uint32_t *)&f32` when reading the raw bit representation of a `float` in C?",
            options: [
              "Because memcpy() automatically swaps Big-Endian to Little-Endian",
              "Because casting incompatible pointers breaks C's pointer type rules (use memcpy safely instead, and -O2 optimizes it to one instruction)",
              "Because sizeof(float) is always 8 bytes"
            ],
            explain:
              "Dereferencing a uint32_t* pointing at a float object breaks C's pointer type rules (use memcpy safely instead). memcpy() is the portable standard idiom."
          }
        ]
      }
    ]
  },
  "c-ringbuf-pool-misra": {
    title: "Ring Buffer, Fixed Memory Pool & Safe C Rules (MISRA)",
    subtitle:
      "Constant-time power-of-2 Ring Buffers, deterministic static memory pools replacing malloc, coherent 64-bit reads across interrupts, CSV testing with Valgrind, and MISRA safe C rules.",
    youllLearn: [
      "Implement power-of-2 static Ring Buffers (& (CAP-1)) with separate head/tail and Static Memory Pools without malloc",
      "Avoid torn reads via read_u64_coherent, replay CSV tests, and verify 0 leaks with Valgrind",
      "Apply MISRA safe C compiler flags and defensive bounds checks for CAN decoding and interlocks"
    ],
    steps: [
      {
        title: "Constant-Time Ring Buffer & Static Pool Replacing malloc",
        body:
          "In 24/7 embedded firmware, `malloc`/`free` risk **heap fragmentation** and unpredictable delays. A **Static Ring Buffer** with power-of-2 capacity (checked at compile time by `_Static_assert((CAP & (CAP - 1U)) == 0U)`) wraps `head`/`tail` via bitwise `& (CAP - 1U)` instead of slow `%` division: in a single-producer/single-consumer (SPSC) setup, `UART_ISR` updates only `head` while `main` updates only `tail` (reserving 1 empty slot or using atomic indices — avoiding a shared `count++` race!). For fixed-size packets, a **Static Memory Pool** of `max_align_t`-aligned blocks gives constant-time allocation and **zero fragmentation**.",
        codeLang: "C · SPSC Ring Buffer (separate head/tail) & Static Pool",
        code: `#define DEMO_RB_CAP 8U
_Static_assert((DEMO_RB_CAP > 0U) && ((DEMO_RB_CAP & (DEMO_RB_CAP - 1U)) == 0U),
               "Capacity must be a power of 2");

typedef struct {
    uint8_t buf[DEMO_RB_CAP];
    volatile uint8_t head; /* Only producer (ISR) writes head */
    volatile uint8_t tail; /* Only consumer (main) writes tail */
} demo_rb8_t;

bool demo_rb_push(demo_rb8_t *rb, uint8_t byte) {
    if (rb == NULL) return false;
    uint8_t next = (uint8_t)((rb->head + 1U) & (DEMO_RB_CAP - 1U)); /* constant time, no % */
    if (next == rb->tail) return false; /* full (1 empty slot avoids shared count++) */
    rb->buf[rb->head] = byte;
    rb->head = next;
    return true;
}

/* Static Memory Pool (max_align_t aligned, zero malloc/free) */
typedef union { max_align_t align; uint8_t bytes[32]; } pool_block_t;`,
        callout: {
          text: "Avoid a shared count++ between ISR (producer) and main (consumer)! An SPSC ring buffer gives head exclusively to the ISR and tail exclusively to main (or uses atomic indices) so neither side corrupts a shared counter."
        },
        diff: [
          "& (CAP - 1U) compiles to a single AND instruction, far faster than % on Cortex-M0/M3.",
          "Calling malloc/free in ISRs or real-time loops risks heap fragmentation and HardFaults."
        ],
        kpis: [
          { label: "Index wrap", value: "& (CAP - 1U)", sub: "_Static_assert 2^k" },
          { label: "Timing", value: "Constant time", sub: "Separate head/tail, no %" },
          { label: "Heap fragmentation", value: "0 bytes", sub: "Replaces malloc/free" }
        ],
        legend: ["ISR Producer (head)", "Main Consumer (tail)", "Static Pool Block"]
      },
      {
        title: "Coherent 64-Bit Reads Across Interrupts & CSV File Testing",
        body:
          "On a 32-bit MCU, reading a 64-bit hardware counter split across `hi` and `lo` registers can suffer a **torn read** if an interrupt rolls `lo` over (`0xFFFFFFFF → 0`) between reads — `volatile` does **not** make two separate reads atomic! Use **`read_u64_coherent` (`hi1`, `lo`, `hi2`)** or a brief critical section. On your host PC, run **CSV file testing** (`fgets` + strict `parse_u32_span` checking `errno` and `endptr`), diff against `expected_report.csv`, and run `valgrind --leak-check=full --show-leak-kinds=all --error-exitcode=1` (never combined with `-fsanitize=address`!).",
        codeLang: "C · read_u64_coherent & Valgrind leak check",
        code: `/* Coherent 64-bit register read across main and ISR on 32-bit MCUs */
bool read_u64_coherent(const volatile uint32_t *hi_reg,
                       const volatile uint32_t *lo_reg,
                       uint32_t max_retries, uint64_t *out_val) {
    if (!hi_reg || !lo_reg || !max_retries || !out_val) return false;
    for (uint32_t i = 0U; i < max_retries; i++) {
        uint32_t hi1 = *hi_reg;
        uint32_t lo  = *lo_reg;
        uint32_t hi2 = *hi_reg;
        if (hi1 == hi2) { /* no rollover occurred while reading lo */
            *out_val = ((uint64_t)hi1 << 32) | (uint64_t)lo;
            return true;
        }
    }
    return false;
}
/* Valgrind command (build WITHOUT -fsanitize=address):
 * valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes --error-exitcode=1 /tmp/app
 */`,
        callout: {
          text: "Never run Valgrind on a binary compiled with -fsanitize=address! ASan reserves huge shadow memory regions that prevent Valgrind from running."
        },
        diff: [
          "Reading hi1 → lo → hi2 and retrying when hi1 != hi2 ensures coherent 64-bit snapshots without long interrupt locks.",
          "parse_u32_span uses strtoul plus explicit endptr checks and rejects leading +/- signs."
        ],
        kpis: [
          { label: "Torn-read fix", value: "hi1 == hi2", sub: "Lock-free double read" },
          { label: "CSV Parser", value: "fgets + span", sub: "Rejects +/- & garbage" },
          { label: "Valgrind gate", value: "--error-exitcode=1", sub: "0 leaks, 0 bad R/W" }
        ],
        legend: ["Double-read hi1/lo/hi2", "CSV File Replay", "0-Leak Valgrind"],
        nodes: [
          ["read_u64_coherent", "Read hi1, lo, hi2; retry if rollover intervenes"],
          ["CSV File Replay", "fgets + parse_u32_span compared against expected CSV"],
          ["Valgrind clean", "Verify 0 leaks / invalid reads (separate non-ASan build)"]
        ],
        openQuestions: [
          {
            scenario: "ISR SYNCHRONIZATION & RING BUFFER",
            prompt:
              "1) If a naive ring buffer shares `count` between `UART_ISR` (`rb->count++`) and `main` (`rb->count--`), why can they still corrupt `count` even if `count` is declared `volatile`? How does an SPSC (Single-Producer Single-Consumer) design splitting `head`/`tail` fix this? 2) Why must `read_u64_coherent` read `hi` twice?",
            placeholder: "Explain the Read-Modify-Write race on count and the rollover hazard between hi1 and lo...",
            hint: "count++ is Read-Modify-Write so an ISR can preempt it; SPSC avoids shared count by making ISR own head and main own tail. For u64, trace when lo wraps past 0xFFFFFFFF."
          }
        ]
      },
      {
        title: "Safe C Coding Rules (MISRA): Strict Warnings & Bounds Guards",
        body:
          "Safety-critical code (**MISRA C**) rejects physically impossible inputs and bans implicit conversions. Turn on **`-Wconversion -Wsign-conversion -Wcast-qual -Wstrict-prototypes`**, test macros with `#if defined(...)` (`-Wundef`), guard bit shifts (`bit_pos < 32U`) inside `static inline` helpers, initialize fail-safe outputs (`*out = 0U`) before every error check, and validate CAN DLC, CRC, rolling counter, fault markers (`0xFFFFU`), and brake/standstill interlocks before shifting gears.",
        codeLang: "C · MISRA safe C defensive patterns",
        code: `/* 1) Safe macro check (-Wundef) & range-guarded unsigned shift */
#if !defined(ECU_ENABLE_TRACE)
#define ECU_ENABLE_TRACE 0
#endif

static inline uint32_t ecu_bit_u32(uint8_t bit_pos) {
    if (bit_pos >= 32U) return 0U;
    return 1U << (unsigned int)bit_pos;
}

/* 2) Set fail-safe output before any error exit */
ecu_status_t ecu_pedal_to_permille(uint16_t raw_adc, uint16_t *out_permille) {
    if (out_permille == NULL) return ECU_ERR_NULL;
    *out_permille = 0U; /* fail-safe default regardless of exit path */
    if (raw_adc > 4095U) return ECU_ERR_ARG;
    if (raw_adc <= 199U) return ECU_ERR_SENSOR_SHORT_GND;
    if (raw_adc >= 3901U) return ECU_ERR_SENSOR_SHORT_VCC;
    /* ... linear mapping between deadband and full-scale ... */
    return ECU_OK;
}`,
        callout: {
          text: "MISRA defensive triad: (1) eliminate implicit narrowing/sign conversions, (2) pre-set fail-safe output defaults before error checks, (3) separate hardware faults (short-to-GND/VCC) from valid sensor values."
        },
        diff: [
          "-Wconversion -Wsign-conversion immediately surfaces hidden int ↔ unsigned narrowing conversions.",
          "Latch GEAR_FAULT and enforce (brake_pressed && speed <= 2.0 km/h) before gear transitions."
        ],
        kpis: [
          { label: "MISRA-like flags", value: "-Wconversion", sub: "+ sign-conv, cast-qual" },
          { label: "Fail-safe init", value: "*out = 0U", sub: "Set before error returns" },
          { label: "ADC diagnostics", value: "<200 / >3900", sub: "Detect GND/VCC shorts" }
        ],
        legend: ["Strict warning flags", "Range & fault guards", "Fail-safe interlocks"],
        nodes: [
          ["-Wconversion -Wcast-qual", "Block implicit narrowing/const-stripping at build time"],
          ["Fail-safe *out = 0U", "Never leak garbage output on sensor faults"],
          ["CAN + Interlock", "Verify DLC/CRC/Counter/Range before actuating"]
        ]
      },
      {
        title: "Lab · Safe Data Logger Without malloc",
        body:
          "Build a safe fixed-RAM data logger: connect `raw_log.csv` → static `ring_buffer` (power-of-2 `RB_CAP`, batch-processed so arbitrarily long files run in **constant RAM**) → `divider_adc` (single `uint64_t` division scaling `30 kΩ / 10 kΩ` up to `13200 mV`) → 2-stage `Median-3` + `Moving Avg-4` → `monitor_fsm` with hysteresis → `report.csv` regression-checked against `expected_report.csv`. Enforce **0 `malloc/free`**, **0 `float/double`**, clean ASan/UBSan, Valgrind (`make valgrind`), and MISRA-style strict warning flags.",
        codeLang: "C · Safe Data Logger pipeline (0 malloc, 0 float)",
        code: `/* Convert 30k / 10k divider ADC code via a SINGLE uint64_t division */
bool adc12_divider_to_vin_mv(uint16_t raw, uint32_t vref_mv,
                             uint32_t r1_ohm, uint32_t r2_ohm,
                             uint32_t *out_vin_mv) {
    if (out_vin_mv == NULL || raw > 4095U || r2_ohm == 0U) return false;
    uint64_t num = (uint64_t)raw * (uint64_t)vref_mv * ((uint64_t)r1_ohm + r2_ohm);
    uint64_t den = 4095ULL * (uint64_t)r2_ohm;
    *out_vin_mv = (uint32_t)((num + (den / 2ULL)) / den);
    return true;
}
/* raw = 4095, vref = 3300, r1 = 30000, r2 = 10000 -> out_vin_mv = 13200 mV */`,
        callout: {
          text: "Combining numerator and denominator into one uint64_t division eliminates double-rounding error. Pair Valgrind 0-leak verification with expected_report.csv diffing for automated regression testing."
        },
        diff: [
          "The entire signal-processing pipeline uses constant RAM via static ring_buffer and stack filter_ctx_t.",
          "Both make test (ASan/UBSan) and make valgrind (non-ASan build) must pass with 0 errors and 0 leaks."
        ],
        kpis: [
          { label: "Heap / Float", value: "0 / 0", sub: "100% static constant RAM" },
          { label: "3S Pack Range", value: "0..13,200 mV", sub: "Single uint64_t division" },
          { label: "Regression", value: "CSV + Valgrind", sub: "Exact expected match" }
        ],
        legend: ["CSV Batch → RingBuf", "Divider + Filter + FSM", "Regression & Valgrind"],
        nodes: [
          ["raw_log.csv → ring_buffer", "Stream in fixed batches using constant static RAM"],
          ["divider_adc → Med3 → Avg4", "Single uint64_t division, zero float"],
          ["monitor_fsm → report.csv", "Diff regression & Valgrind 0-leak gate"]
        ],
        quiz: [
          {
            prompt:
              "Why does `ring_buffer` assert `_Static_assert((RB_CAP & (RB_CAP - 1U)) == 0U)` before wrapping indices with `(idx + 1U) & (RB_CAP - 1U)`?",
            options: [
              "To turn ring_buffer into heap-allocated storage",
              "Because bitwise masking `& (CAP - 1U)` wraps cleanly from `CAP - 1` back to `0` only when `CAP` is a power of 2",
              "To force every element to be 8 bytes wide"
            ],
            explain:
              "If CAP = 10, CAP - 1 = 9 (0b1001) skips indices and corrupts buffer positions. Only powers of 2 yield an all-ones bitmask CAP - 1."
          },
          {
            prompt:
              "What happens if you run `valgrind` directly on an executable built with `-fsanitize=address`?",
            options: [
              "Valgrind conflicts with ASan's huge shadow memory reservations and fails to start cleanly",
              "Valgrind automatically disables ASan and runs twice as fast",
              "Standard output is suppressed"
            ],
            explain:
              "AddressSanitizer and Valgrind both manage shadow memory exclusively and cannot be combined; always use a dedicated build without -fsanitize=address for Valgrind."
          }
        ]
      }
    ]
  },
  "e-power-rails-dmm": {
    title: "3.3V/5V Power Rails, Regulators & Safe Multimeter Use",
    subtitle:
      "Compute LDO vs Buck thermal loss, prevent 5V→3.3V ESD diode back-powering, analyze loaded resistor dividers, and safely operate a multimeter without shorting the 10A jack.",
    youllLearn: [
      "Calculate LDO thermal dissipation P = (Vin - Vout) × I vs high-efficiency Buck converters",
      "Prevent 5V → 3.3V ESD back-powering and compute voltage sag on loaded resistor dividers",
      "Measure DC V, Continuity, Resistance, and Current safely without shorting the 10A jack across a battery or rail"
    ],
    steps: [
      {
        title: "LDO vs Buck Heat, 5V→3.3V ESD Diode Hazard & 3 Level-Shifters",
        body:
          "A linear LDO (`AMS1117-3.3`) burns excess voltage drop as heat: stepping `12 V → 3.3 V @ 300 mA` dissipates `(12000 − 3300) × 300 / 1000 = 2610 mW` (`2.61 W`), triggering instant thermal shutdown; a **90% Buck** draws only `~92 mA` at `12 V` and sheds just `110 mW` (**23× cooler**!). Driving a non-`5V-tolerant` `3.3 V` GPIO directly from `5 V` forward-biases the **upper protection diode (`D_up`)** above `VDD + 0.3 V`, injecting current onto the `3.3 V` rail (**back-powering**). Use: (1) a resistor divider (1-way slow), (2) `BSS138` open-drain (bidirectional I2C), or (3) `74LVC245` buffer (fast SPI).",
        codeLang: "C · LDO/Buck thermal math & 3.3V pin safety check",
        code: `#include <stdbool.h>
#include <stdint.h>

/* LDO thermal dissipation (mW): P_heat = (Vin - Vout) * I_load + Vin * Iq */
uint32_t ldo_heat_mw(uint32_t vin_mv, uint32_t vout_mv,
                     uint32_t i_load_ma, uint32_t iq_ua) {
    if (vin_mv <= vout_mv) return 0U;
    uint64_t p_nw = (uint64_t)(vin_mv - vout_mv) * i_load_ma * 1000ULL
                  + (uint64_t)vin_mv * iq_ua;
    return (uint32_t)((p_nw + 500000ULL) / 1000000ULL);
}

/* Verify safe input voltage on a 3.3V GPIO (prevent D_up ESD conduction) */
bool is_safe_3v3_input_mv(uint32_t v_in_mv, bool is_5v_tol, uint32_t vdd_mv) {
    if (vdd_mv < 2700U || vdd_mv > 3600U) return false; /* VDD off -> reject back-power */
    return is_5v_tol ? (v_in_mv <= 5500U) : (v_in_mv <= vdd_mv + 300U);
}`,
        callout: {
          text: "Industrial best practice: step 12V/24V → 5V efficiently with a Buck converter, then clean the rail with a low-dropout LDO 5V → 3.3V for low-noise ADC and RF stages!"
        },
        diff: [
          "LDO 12 V → 3.3 V @ 300 mA dissipates 2.61 W (>150 °C die); a 90% Buck sheds only 110 mW.",
          "Standard pins allow at most VDD + 300 mV; driving 5 V when VDD = 0 V back-powers the 3.3V rail."
        ],
        kpis: [
          { label: "LDO 12V→3.3V", value: "2610 mW", sub: "Thermal shutdown at 300 mA" },
          { label: "90% Buck", value: "110 mW", sub: "I_in ≈ 92 mA @ 12V" },
          { label: "Standard pin max", value: "VDD + 0.3V", sub: "Protection diode limit" }
        ],
        legend: ["LDO (heat = ΔV × I)", "Buck (high efficiency)", "5V ↔ 3.3V Level Shifting"]
      },
      {
        title: "Loaded Voltage Divider Sag (R_load ∥ R2) & Total Resistance Sizing",
        body:
          "Unloaded under a DMM (`R_load = 10 MΩ`), a `10 kΩ / 10 kΩ` divider outputs `2499 mV` from `5 V`. Attach a `10 kΩ` load to `Vout` and **`R_load` sits in parallel with `R2`**, collapsing the lower leg to `10 kΩ ∥ 10 kΩ = 5 kΩ` and dragging `Vout` down to **`1667 mV`**! Never power modules with a resistor divider. When sizing an ADC sense divider, balance battery drain (too small like `100 Ω` wastes current) against ADC Sample-and-Hold (`~5 pF`) settling errors (too large like `1 MΩ`).",
        codeLang: "C · divider_loaded_mv without intermediate rounding error",
        code: `/* Vout = Vin * (R2 * R_load) / (R1 * (R2 + R_load) + R2 * R_load)
 * Single uint64_t division avoids double rounding of R2_eff!
 */
uint32_t divider_loaded_mv(uint32_t vin_mv, uint32_t r1_ohm,
                           uint32_t r2_ohm, uint32_t r_load_ohm) {
    if (vin_mv == 0U || r2_ohm == 0U || r_load_ohm == 0U) return 0U;
    if (r1_ohm == 0U) return vin_mv;
    uint64_t r2_load = (uint64_t)r2_ohm * r_load_ohm;
    uint64_t r2_plus_load = (uint64_t)r2_ohm + r_load_ohm;
    uint64_t num = (uint64_t)vin_mv * r2_load;
    uint64_t den = ((uint64_t)r1_ohm * r2_plus_load) + r2_load;
    return (uint32_t)((num + (den / 2ULL)) / den);
}
/* divider_loaded_mv(5000, 10000, 10000, 10000) == 1667 mV! */`,
        callout: {
          text: "For battery voltage sensing into an ADC pin, pick divider resistors with equivalent resistance R1 ∥ R2 ≤ 10–20 kΩ (e.g., 30 kΩ / 10 kΩ or 33 kΩ / 10 kΩ for 12.6 V) and pair with a 100 nF cap for slow signals."
        },
        diff: [
          "A 10k/10k 5V divider drops from 2499 mV to 1667 mV under even a tiny 0.17 mA (10 kΩ) load.",
          "Combining the algebra into one uint64_t division preserves millivolt accuracy."
        ],
        kpis: [
          { label: "Unloaded (10MΩ)", value: "2499 mV", sub: "Near ideal 5V / 2" },
          { label: "Loaded R_load = 10k", value: "1667 mV", sub: "R2_eff drops to 5 kΩ" },
          { label: "ADC source R", value: "≤ 10–20 kΩ", sub: "Charges ~5 pF S&H cap" }
        ],
        legend: ["Upper leg R1", "Parallel R2 ∥ R_load", "Stable ADC node"],
        nodes: [
          ["Vin → R1", "High R saves battery; low R drives harder"],
          ["R2 ∥ R_load", "Parallel load pulls R2_eff down → Vout sags"],
          ["divider_loaded_mv", "Single uint64_t division matches DMM reading"]
        ]
      },
      {
        title: "Safe Multimeter (DMM) Use & the 10A Jack Short-Circuit Hazard",
        body:
          "Critical DMM safety rules (black lead always in **`COM`** — always verify **dial mode + red probe socket** before touching probes!): (1) **DC Voltage (`V⎓`)**: red lead in **`V Ω mA`**, circuit **ON (HOT)**, probes in **parallel**; (2) **Continuity (`Beep`)** & **Resistance (`Ω`)**: red lead in **`V Ω mA`**, power **COMPLETELY OFF (COLD)**; (3) **Current (`10A`/`mA`)**: move red lead to **`10A`**, **break the wire** and wire in **SERIES**. **NEVER** measure current directly across a Li-ion battery or power supply! Because `10A` connects straight to `COM` through a milliohm shunt, probing across a battery or `VCC–GND` creates a **dead short that blows the 10A fuse, sparks, or damages the battery**! Safer tip: keep leads in `V Ω mA` and measure `mV` across a `0.1–1 Ω` series shunt.",
        codeLang: "Safe DMM measurement checklist",
        code: `// 3 DMM jacks: [ 10A ]          [ COM ]        [ V Ω mA ]
//              Red: high I      Black: common  Red: V, Ω, continuity
//
// 0. VERIFY FIRST: Match dial setting AND red probe socket before probing!
// 1. COLD (Power OFF): Continuity 3V3 <-> GND (steady beep < 30 Ω = SHORT!)
// 2. HOT  (Power ON):  Red in [V Ω mA], DC V -> probe parallel across VDD-GND
// 3. SAFE CURRENT:     Place 1 Ω shunt in series -> measure V_shunt (mV) -> I(mA) = mV/1`,
        callout: {
          text: "NEVER probe directly across a Li-ion battery or power supply in 10A mode! Always match dial + red jack first, and move the red probe back to V Ω mA immediately after measuring current."
        },
        diff: [
          "Always verify dial + red socket and run a COLD continuity check between 3V3 and GND before powering a new board.",
          "Touching probes plugged into 10A directly across a Li-ion battery or power rails causes a dead short, blown fuse, or fire hazard."
        ],
        kpis: [
          { label: "DC V / Ω / Beep", value: "V Ω mA jack", sub: "Ω & Beep: power OFF" },
          { label: "10A Current", value: "Wire in SERIES", sub: "Never across battery/rail!" },
          { label: "Shunt trick", value: "0.1–1 Ω resistor", sub: "Read mV in V Ω mA jack" }
        ],
        legend: ["Cold checks (Power OFF)", "Hot checks (Power ON)", "10A dead-short hazard"],
        nodes: [
          ["COLD: Beep / Ω", "Probe in V Ω mA, verify no 3V3–GND short"],
          ["HOT: DC V (parallel)", "Check 5V / 3.3V rails & divider midpoint"],
          ["Current: 10A series / Shunt", "Return red probe to V Ω mA immediately"]
        ],
        openQuestions: [
          {
            scenario: "REAL BENCH TROUBLESHOOTING · DIVIDERS & DMM SAFETY",
            prompt:
              "1) Someone uses a `10 kΩ / 10 kΩ` resistor divider on `5 V` to power a sensor drawing `10 mA` (`R_load ≈ 250 Ω` at `2.5 V`) — roughly what voltage reaches the sensor and why? 2) After measuring current in the `10A` jack, they forget to move the red lead back and probe directly across a Li-ion battery or `5 V` to `GND`: what happens immediately?",
            placeholder: "Compute R2 || R_load (10k || 250 Ω) and explain the 10A internal shunt short-circuit hazard...",
            hint: "10 kΩ in parallel with 250 Ω is ~244 Ω -> dividing 5V with 10 kΩ yields only ~120 mV! And the 10A jack is nearly a 0 Ω wire to COM, blowing the fuse or shorting the battery."
          }
        ]
      },
      {
        title: "Lab · Cold/Hot DMM Bring-Up & Integer Power Math",
        body:
          "Practice both C integer power math and safe DMM probing: (1) Implement `divider_loaded_mv`, `led_e12_design`, and `power_budget_check` in `submission.c` using `uint64_t` integer math (no `float`), compiling cleanly under `-Wall -Wextra -Werror -Wshadow -fsanitize=address,undefined`; (2) On hardware or Falstad, execute **Cold DMM Checks** (measure actual E12 resistor tolerances and verify zero short circuits) followed by **Hot DMM Checks** (measure `Vin`, unloaded `Vout`, and sag when attaching a `10 kΩ` load dropping `~2.5 V` to `~1.67 V`).",
        codeLang: "C · power & loaded divider verification asserts",
        code: `/* gcc -Wall -Wextra -Werror -Wshadow -fsanitize=address,undefined submission.c -o /tmp/power_lab */
assert(ldo_heat_mw(12000U, 3300U, 300U, 0U) == 2610U);
assert(ldo_heat_mw(12000U, 3300U, 300U, 5000U) == 2670U);

uint32_t iin = 0U, pheat = 0U;
assert(buck_input_ma_and_heat_mw(12000U, 3300U, 300U, 90U, &iin, &pheat));
assert(iin == 92U && pheat == 110U);

assert(divider_loaded_mv(5000U, 10000U, 10000U, 10000000U) == 2499U);
assert(divider_loaded_mv(5000U, 10000U, 10000U, 10000U) == 1667U);
assert(divider_loaded_mv(12600U, 33000U, 10000U, 100000U) == 2721U);`,
        callout: {
          text: "Record Predicted vs Measured vs % Error in your lab notes. Small millivolt offsets typically reflect 5% resistor tolerances and actual USB/LDO rail sag."
        },
        diff: [
          "Zero float/double in C code; keep all intermediate power and voltage products in uint64_t.",
          "Always complete Cold continuity/resistance checks before applying power for Hot voltage readings."
        ],
        kpis: [
          { label: "Part A (C Code)", value: "50 pts", sub: "divider, LED E12, budget" },
          { label: "Part B (DMM)", value: "30 pts", sub: "COLD & HOT bring-up" },
          { label: "Precision", value: "0 float", sub: "Rounded uint64_t math" }
        ],
        legend: ["Integer C math", "Cold/Hot DMM Lab", "Error comparison"],
        nodes: [
          ["C verification", "Verify LDO / Buck / Loaded divider math"],
          ["COLD DMM Check", "Measure real Ω + Continuity before power-on"],
          ["HOT DMM Measure", "Measure loaded sag & log comparison table"]
        ],
        quiz: [
          {
            prompt:
              "Stepping `12 V` down to `3.3 V` at `300 mA` load (neglecting `Iq`), how much heat does an LDO dissipate compared to a `90%` Buck converter?",
            options: [
              "LDO dissipates 2610 mW; Buck dissipates 110 mW",
              "LDO dissipates 990 mW; Buck dissipates 990 mW",
              "LDO dissipates 110 mW; Buck dissipates 2610 mW"
            ],
            explain:
              "LDO: (12 - 3.3) * 0.3 = 2.61 W (2610 mW). Buck: P_out = 3.3 * 0.3 = 990 mW, heat loss = 990 * (10 / 90) = 110 mW."
          },
          {
            prompt:
              "Before plugging power into a freshly soldered PCB, how should you check for a `3.3V–GND` short with a DMM?",
            options: [
              "Plug red probe into 10A, power the board on, and probe 3.3V–GND in parallel",
              "Keep power OFF, plug red probe into V Ω mA, select Continuity/Ω, and touch 3.3V and GND",
              "Power the board on and switch to Ω across the supply capacitor"
            ],
            explain:
              "Continuity and resistance checks require power OFF (COLD) with the red lead in V Ω mA. Probing power rails with the 10A jack creates an immediate short."
          }
        ]
      }
    ]
  },
  "e-components-mosfet": {
    title: "100nF Decoupling, Flyback Diodes, MOSFETs & Optocouplers",
    subtitle:
      "Place 100 nF decaps right at VDD–VSS, clamp relay kickback with Flyback diodes (test without diode ONLY in Falstad!), check exact MOSFET/Opto datasheet limits, and isolate 24V rails.",
    youllLearn: [
      "Place the 3 MCU capacitor families properly (bulk 10–100 µF, 100 nF decoupling at VDD-VSS, 12–22 pF crystal)",
      "Size Logic-Level N-MOSFET switches (check R_DS(on) @ V_GS in your part's datasheet) and saturated NPN BJTs (beta_sat = 10)",
      "Orient Flyback diodes for inductive loads and compute Optocoupler PC817 input current from datasheet CTR_min"
    ],
    steps: [
      {
        title: "100nF Decoupling at VDD–VSS & Relay Flyback Diodes",
        body:
          "Classic interview question: \"If the board already has a `100 µF` electrolytic capacitor at the regulator, why add `100 nF` ceramics next to every `VDD–VSS` pair?\" Large electrolytics and PCB traces respond too slowly to **nanosecond switching currents (`dI/dt`)** inside an ARM/ESP32 core; a local **`100 nF`** X7R cap supplies charge immediately and prevents brownouts. Crystal oscillators need **`12–22 pF`** C0G load caps. When switching a relay/motor coil, interrupting current triggers **`V = −L · (dI/dt)`** (`+80..300 V` kickback) — always clamp it with a **Flyback Diode** whose **Cathode band faces `+V_coil`** (testing turn-off without the Flyback diode must **ONLY** be done in **Falstad CircuitJS simulation**, NEVER on real hardware!).",
        codeLang: "MCU capacitor placement & Relay Flyback Diode",
        code: `// 1) MCU power & crystal caps:
//   +3.3V ──┬──────────────┬────────────► VDD
//         [10..100uF]    [100nF X7R]      (place 100nF RIGHT NEXT TO VDD-VSS!)
//   GND   ──┴──────────────┴────────────► VSS
//
// 2) Flyback Diode across an inductive load (relay coil / DC motor):
//   +12V ───┬───────┬─── (Cathode band connects to +12V!)
//        [Relay]   /▲\\  1N5819 / 1N4007
//           │       │
//           └───┬───┘──► N-MOSFET Drain or BJT Collector`,
        callout: {
          text: "Never install a Flyback diode backwards (dead-shorts +12V when ON!). And testing inductive turn-off WITHOUT the Flyback diode must ONLY be done in Falstad CircuitJS simulation — NEVER on real hardware!"
        },
        diff: [
          "Placing one low-ESL 100 nF ceramic cap right at every VDD–VSS pair suppresses nanosecond voltage droops.",
          "Switching off a real relay coil without a Flyback diode spikes Drain/GPIO voltage and destroys transistors immediately."
        ],
        kpis: [
          { label: "Decoupling", value: "100 nF ceramic", sub: "Right at every VDD-VSS" },
          { label: "Bulk / Crystal", value: "10–100µF / 12–22pF", sub: "Reservoir / Pierce osc" },
          { label: "Flyback Diode", value: "Cathode → +VCC", sub: "Clamps +80..300 V spike" }
        ],
        legend: ["100 nF HF decoupling", "Kickback −L dI/dt spike", "Safe Flyback clamp"]
      },
      {
        title: "Logic-Level N-MOSFET (R_DS(on) @ 3.3V vs V_GS(th)) & Saturated NPN BJT",
        body:
          "MCU GPIOs handle `≤ 20 mA`, so heavier loads require a Low-Side switch. For **NPN BJTs**, ignore `h_FE = 150` and force saturation at **`β_sat = 10`** (`R_B ≤ (V_GPIO − 0.7) × 10 / I_C`, e.g., `70 mA` relay → `R_B ≤ 371 Ω` → pick E12 **`330 Ω`**; `500 mA` exceeds GPIO limits). For **N-MOSFETs**, don't fall for `IRF540N`’s `V_GS(th) = 2–4 V` — that only conducts `250 µA`! Pick a **Logic-Level MOSFET** and always check the exact **`R_DS(on)` at `V_GS = 3.3 V`** in your part's datasheet (`AO3400`, `IRLZ44N`: e.g., `AO3400` gives `32 mΩ @ 3.3 V` → `2 A` dissipates `128 mW` instead of `8000 mW` smoke!) with **two Gate resistors**: `R_G = 100 Ω` + `R_PD = 10 kΩ` (keeps Gate at `0 V` during MCU reset).",
        codeLang: "C · MOSFET conduction loss & Gate divider check",
        code: `/* P_cond (mW) = I_load^2 * R_DS(on) */
uint32_t mosfet_cond_loss_mw(uint32_t i_load_ma, uint32_t rds_on_mohm) {
    uint64_t p_nw = (uint64_t)i_load_ma * i_load_ma * rds_on_mohm;
    return (uint32_t)((p_nw + 500000ULL) / 1000000ULL);
}
/* AO3400 (32 mΩ @ 3.3V) @ 2 A  -> 128 mW (cool)
 * Under-driven IRF540N (~2 Ω)  -> 8000 mW (burns up!)
 * Gate check: R_G = 100 Ω + R_PD = 10 kΩ -> V_GS = 3267 mV >= 2500 mV (PASS)
 * Trap:       R_G = 10 kΩ + R_PD = 10 kΩ -> V_GS = 1650 mV (HALVED, FAILS!)
 */`,
        callout: {
          text: "Series R_G and pull-down R_PD form a voltage divider on the Gate! Keep R_G small (47–220 Ω) and R_PD at least 50–100× larger (10 kΩ – 100 kΩ), and always verify exact R_DS(on) and V_GS ratings in your actual MOSFET's datasheet."
        },
        diff: [
          "Verify datasheet R_DS(on) is explicitly guaranteed at V_GS = 2.5 V or 3.3 V (Logic-Level).",
          "Designing BJTs with h_FE = 150 or omitting Gate R_PD = 10 kΩ overheats transistors or glitches motors at boot."
        ],
        kpis: [
          { label: "AO3400 @ 2A", value: "128 mW", sub: "R_DS(on) = 32 mΩ @ 3.3V" },
          { label: "Gate R_G + R_PD", value: "100 Ω + 10 kΩ", sub: "V_GS = 3267 mV" },
          { label: "BJT saturation", value: "β_sat = 10", sub: "Pick E12 <= R_B_max" }
        ],
        legend: ["Fully enhanced MOSFET", "V_GS(th) / R_G divider trap", "Required Gate resistors"],
        nodes: [
          ["GPIO 3.3V → R_G 100Ω", "Limits Gate cap inrush & damps ringing"],
          ["R_PD 10kΩ → GND", "Forces MOSFET OFF while MCU resets / High-Z"],
          ["Logic-Level R_DS(on)", "Low P_cond = I² × R_DS(on) switches amps coolly"]
        ],
        openQuestions: [
          {
            scenario: "CHOOSING A 12V / 2A LOAD SWITCH",
            prompt:
              "1) Seeing `V_GS(th) = 2.0–4.0 V` on an `IRF540N` datasheet, a student connects it directly to an STM32 `3.3 V` GPIO to switch a `12 V / 2 A` motor: why does the MOSFET overheat while the motor runs weak? 2) If you omit the `10 kΩ` `R_PD` pull-down resistor on the Gate, what dangerous behavior can occur during the first 100 ms of power-up or flashing?",
            placeholder: "Explain what V_GS(th) actually measures (250 µA threshold) and floating GPIO High-Z at reset...",
            hint: "V_GS(th) is only barely conducting 250 µA, nowhere near rated R_DS(on); during MCU reset the GPIO is High-Z so stray charge turns the Gate partially ON."
          }
        ]
      },
      {
        title: "Optocoupler Isolation (PC817) & 50% Resistor Power Derating",
        body:
          "When sensing noisy `24 V` industrial switches or controlling isolated AC loads, **never share `GND_24V` with `GND_MCU`** — inverter spikes will crash or damage the MCU. A **`PC817` Optocoupler** crosses a `3–5 kV` optical barrier using infrared light. Size input LED current using the exact **`CTR_min` (`I_C / I_F`)** from your part's datasheet (`50%` typical minimum for `PC817`, multiplied by a `2×` safety margin for LED aging and temperature). Always check **50% resistor power derating**: dissipating `76 mW` requires a `1206` (`250 mW`) or `1/4 W` package, never `0603` (`100 mW`).",
        codeLang: "C · sizing Optocoupler LED current from CTR_min & derating",
        code: `/* Ceiling division guarantees enough input current to saturate secondary phototransistor */
uint32_t opto_input_current_ua(uint32_t ic_load_ua, uint32_t ctr_min_pct) {
    if (ic_load_ua == 0U || ctr_min_pct == 0U) return 0U;
    uint64_t num = (uint64_t)ic_load_ua * 100ULL;
    return (uint32_t)((num + ctr_min_pct - 1ULL) / ctr_min_pct);
}
/* Example: MCU side has 4.7 kΩ pull-up to 3.3V -> Ic ≈ 702 µA.
 * Check your PC817 datasheet CTR_min (e.g. 50%) -> If_min = 1404 µA (2x margin -> 3–5 mA).
 * 24V input resistor: keep P_R <= 50% of SMD package rating!
 */`,
        callout: {
          text: "An optocoupler provides zero isolation if the noisy 24V ground and MCU ground are tied together! Always verify the exact CTR_min rank in your PC817 datasheet."
        },
        diff: [
          "Size optocoupler LED drive from datasheet CTR_min (e.g., 50%), not typical CTR, and add a 2× aging factor.",
          "Enforce 50% power derating on current-limiting resistors (0603 <= 50 mW, 0805 <= 62 mW, 1206 <= 125 mW)."
        ],
        kpis: [
          { label: "PC817 isolation", value: "3–5 kV", sub: "Separate GND_24V & GND_MCU" },
          { label: "CTR_min", value: "50% (2× margin)", sub: "I_F >= 2 × I_C / CTR" },
          { label: "Resistor derating", value: "≤ 50% P_rated", sub: "76 mW → pick 1206" }
        ],
        legend: ["Noisy 24V domain", "PC817 optical barrier", "Clean 3.3V MCU side"],
        nodes: [
          ["+24V + R_in (50% derate)", "Sets safe LED forward current I_F"],
          ["PC817 Optical Barrier", "Couples IR light while isolating grounds"],
          ["Phototransistor → GPIO", "4.7 kΩ pull-up to 3.3V outputs clean logic"]
        ]
      },
      {
        title: "Lab · 3.3V-Driven 12V Low-Side N-MOSFET + Flyback Diode",
        body:
          "Practice inductive load switching safely: (1) Implement `npn_switch_design` (floor E12 `<= R_B_max`), `mosfet_driver_budget` (`P_cond` + Gate `R_G/R_PD` verified against your part's `R_DS(on)`/`V_GS` datasheet), and `opto_input_design` (`CTR_min` + `50%` resistor derating) in `submission.c`; (2) Build a `3.3 V`-driven `12 V` Low-Side N-MOSFET (`AO3400` / `IRLZ44N` / `2N7000`) switch with `R_G = 100–220 Ω`, `R_PD = 10–100 kΩ`, and Flyback diode (`1N5819` / `1N4007`). **SAFETY RULE**: observing the turn-off spike **WITHOUT** the Flyback diode must **ONLY** be done in **Falstad CircuitJS simulation**, NEVER on real hardware!",
        codeLang: "C · BJT, MOSFET & Opto verification asserts",
        code: `/* 1) Saturated NPN BJT (beta_sat = 10): 5V/70mA relay -> R_B_max = 371 Ω -> E12 = 330 Ω */
assert(bjt_base_resistor_max_ohm(3300U, 700U, 70U, 10U) == 371U);

/* 2) MOSFET conduction loss at 2 A */
assert(mosfet_cond_loss_mw(2000U, 32U) == 128U);    /* AO3400 @ 3.3V */
assert(mosfet_cond_loss_mw(2000U, 2000U) == 8000U); /* under-driven IRF540N */

/* 3) Gate divider 100 Ω / 10 kΩ -> V_GS = 3267 mV >= 2500 mV */
uint32_t vgs = 0U;
assert(mosfet_gate_pulldown_check(3300U, 100U, 10000U, 2500U, &vgs) && vgs == 3267U);
assert(!mosfet_gate_pulldown_check(3300U, 10000U, 10000U, 2500U, &vgs)); /* 1650 mV */`,
        callout: {
          text: "SAFETY: Test inductive turn-off WITHOUT the Flyback diode ONLY in Falstad CircuitJS simulation — NEVER on real hardware! Also remember BJT saturation rounds DOWN to E12 <= R_B_max."
        },
        diff: [
          "Verify BJT E12 floor selection, MOSFET conduction loss mW, and Gate R_G/R_PD checks with asserts.",
          "Compare turn-off spikes without a Flyback diode in Falstad simulation only; keep the diode soldered on real hardware."
        ],
        kpis: [
          { label: "Part A (C Code)", value: "50 pts", sub: "BJT, MOSFET, Opto" },
          { label: "Part B (Lab/Sim)", value: "30 pts", sub: "Low-Side 12V + Flyback" },
          { label: "Test suite", value: "ASan + UBSan", sub: "0 warnings under -Werror" }
        ],
        legend: ["C design checks", "Measure V_GS, V_DS, I_D", "Falstad Flyback spike sim"],
        nodes: [
          ["C design checks", "Verify BJT / MOSFET / Opto datasheet formulas"],
          ["Hardware (with Diode)", "Measure V_GS, V_DS ON & OFF safely at 12V"],
          ["Falstad CircuitJS", "Safely simulate Drain spike with vs without diode"]
        ],
        quiz: [
          {
            prompt:
              "Which datasheet specification guarantees an N-MOSFET turns fully ON with low resistance directly from a `3.3 V` GPIO pin?",
            options: [
              "Maximum V_GS(th) listed as 4.0 V",
              "R_DS(on) explicitly specified in mΩ at V_GS = 2.5 V or 3.3 V (Logic-Level MOSFET)",
              "Breakdown rating V_DS = 100 V"
            ],
            explain:
              "V_GS(th) only marks ~250 µA turn-on onset. You must verify R_DS(on) is characterized at V_GS <= 3.3 V (Logic-Level parts like AO3400 or IRLZ44N)."
          },
          {
            prompt:
              "Across a `+12 V` relay coil switched by a Low-Side N-MOSFET (Drain wired to the bottom of the coil), where must the Flyback diode’s striped **Cathode** connect?",
            options: [
              "To the N-MOSFET Drain terminal",
              "In series with the MOSFET Gate",
              "To the +12 V supply rail (with Anode connected to the N-MOSFET Drain)"
            ],
            explain:
              "While the MOSFET is ON the diode stays reverse-biased; when the MOSFET switches OFF, inductive current circulates up through the diode into +12V, clamping Drain near 12.7 V."
          }
        ]
      }
    ]
  },
  "e-opamp-rc": {
    title: "Logic 0/1 Levels, Op-Amp Amplifiers & RC Filters",
    subtitle:
      "Check 3.3V–5V logic safety margins, see how hardware timers make PWM, use Rail-to-Rail Op-Amps and RC filters to smooth PWM into DC, and smooth ADC signals in code.",
    youllLearn: [
      "Check noise safety margins (NM_H / NM_L) when connecting 3.3V and 5V chips and understand hardware PWM counters",
      "Apply 3 common Op-Amp circuits (Buffer, Rail-to-Rail Amplifier, Comparator) and 1st-order RC filters",
      "Write integer signal smoothing (EMA) y += (x - y) / k, fix rounding stalls, and reduce ADC noise"
    ],
    steps: [
      {
        title: "Logic 0/1 Levels, 3.3V–5V Interfacing & Hardware Timers",
        body:
          "Reliable 0/1 signaling requires a noise safety margin of **`NM_H = V_OH(min) − V_IH(min) ≥ 200 mV`** and **`NM_L = V_IL(max) − V_OL(max) ≥ 200 mV`**. Signals stuck in the middle band (`V_IL..V_IH`) turn both input transistors partly ON, wasting current and reading erratic bits. A `3.3 V` MCU (`V_OH = 2900 mV`) drives `5 V TTL / 74HCT` cleanly (`V_IH = 2000 mV` → `+900 mV` margin), but **FAILS on `5 V CMOS / 74HC`** (`V_IH = 3500 mV` → `−600 mV`!). Under the hood: each bit of `GPIOx->ODR` is a **1-bit hardware memory latch (D Flip-Flop)**, and `TIMx` (`PSC`, `ARR`, `CCR`) is a hardware counter generating PWM without CPU overhead.",
        codeLang: "C · 0/1 compatibility check & Timer PWM (PSC/ARR/CCR)",
        code: `/* Noise Margin check between Driver (V_OH, V_OL) and Receiver (V_IH, V_IL) */
bool logic_levels_compatible(int32_t voh_mv, int32_t vol_mv,
                             int32_t vih_mv, int32_t vil_mv,
                             int32_t min_margin_mv) {
    int32_t nm_h = voh_mv - vih_mv;
    int32_t nm_l = vil_mv - vol_mv;
    return (nm_h >= min_margin_mv) && (nm_l >= min_margin_mv);
}
/* 3.3V (2900/400) -> 5V TTL (2000/800)  : NM_H = +900 mV, NM_L = +400 mV (PASS)
 * 3.3V (2900/400) -> 5V CMOS (3500/1500): NM_H = -600 mV (FAIL!)
 *
 * Timer PWM: f_pwm = f_clk / ((PSC + 1) * (ARR + 1))
 *            CCR   = ((ARR + 1) * duty_permille) / 1000
 */`,
        callout: {
          text: "Every C bitwise operation (&, |, ^, ~) flips real hardware latches inside the chip, and hardware PWM is simply a TIMx counter comparing CNT < CCR to toggle the pin automatically!"
        },
        diff: [
          "3.3 V MCUs interface directly with 74HCT inputs (TTL 2.0 V threshold) but require level-shifters for 74HC CMOS (3.5 V).",
          "Represent PWM duty in C using integer duty_permille (0..1000) instead of floating-point 0.0..1.0."
        ],
        kpis: [
          { label: "3.3V → 5V TTL", value: "+900 mV margin", sub: "V_IH = 2000 mV (Pass)" },
          { label: "3.3V → 5V CMOS", value: "-600 mV gap", sub: "V_IH = 3500 mV (Fail!)" },
          { label: "ODR / TIMx", value: "Latch / Counter", sub: "Hardware behind C" }
        ],
        legend: ["Safe Margin", "Negative Margin / Gap", "Latch & Timer registers"],
        nodes: [
          ["Driver V_OH / V_OL", "Compare against Receiver V_IH / V_IL"],
          ["Margin >= 200 mV", "Catch 3.3V → 5V CMOS (-600 mV) failure"],
          ["ODR & TIMx Counter", "PSC, ARR, CCR generate jitter-free PWM"]
        ]
      },
      {
        title: "Op-Amp Circuits & RC Low-Pass Filters Smoothing PWM to DC",
        body:
          "Master 3 **Op-Amp** topologies: (1) **Buffer (`Av = 1`)**: draws zero sensor current while quickly charging the ADC sampling cap; (2) **Non-Inverting Amplifier (`Av = 1 + Rf/Rg`)**: boosts a `0..200 mV` shunt signal ×`16` to `0..3200 mV` (`Rg = 1 kΩ, Rf = 15 kΩ`) — on single `3.3 V` supplies **pick a Rail-to-Rail Op-Amp (`MCP6001`)** that swings all the way to the supply rails, because `LM358` stalls near `~1.8 V`!; (3) **Comparator (`LM393`)**: clean threshold switching. To smooth PWM pulses into steady DC, use an **RC Low-Pass filter**: **`τ = R·C`** (`5τ` = `99.3%` settled), **`fc = 159154943 / (R_Ω · C_nF)`**, keeping `fc ≤ f_PWM / 10`.",
        codeLang: "C · τ, cutoff fc & Rail-to-Rail Op-Amp gain",
        code: `/* 1) Time constant τ (µs) and -3dB cutoff fc (Hz) for 1st-order RC filter */
uint32_t rc_tau_us(uint32_t r_ohm, uint32_t c_nf) {
    return (uint32_t)(((uint64_t)r_ohm * c_nf + 500ULL) / 1000ULL);
}
uint32_t rc_cutoff_hz(uint32_t r_ohm, uint32_t c_nf) {
    uint64_t rc = (uint64_t)r_ohm * c_nf;
    return (rc == 0ULL) ? 0U : (uint32_t)((159154943ULL + rc / 2ULL) / rc);
}
/* 10 kΩ + 100 nF -> tau = 1000 µs (5*tau = 5 ms), fc = 159 Hz.
 * On 10 kHz PWM (50% duty) -> smooth ~1650 mV DC! */

/* 2) Single-supply Non-Inverting Op-Amp clamped at output ceiling (RRIO vs LM358) */
uint32_t opamp_noninv_mv(uint32_t vin_mv, uint32_t rg_ohm, uint32_t rf_ohm, uint32_t vout_max_mv) {
    uint64_t v = ((uint64_t)vin_mv * ((uint64_t)rg_ohm + rf_ohm) + rg_ohm / 2ULL) / rg_ohm;
    return (v > vout_max_mv) ? vout_max_mv : (uint32_t)v;
}`,
        callout: {
          text: "LM358 CANNOT swing all the way to 3.3 V! Powered from a single 3.3 V rail, its output stalls around 1.8 V — use a Rail-to-Rail Op-Amp (like MCP6001) to reach the full 3.2 V ADC span."
        },
        diff: [
          "R = 10 kΩ, C = 100 nF gives fc = 159 Hz, filtering 10 kHz PWM cleanly (159 Hz << 10 kHz / 10).",
          "50 Hz PWM passes almost unfiltered through a 159 Hz RC stage; filtering 50 Hz needs fc <= 2 Hz (~400 ms lag!)."
        ],
        kpis: [
          { label: "10kΩ + 100nF", value: "τ=1ms / fc=159Hz", sub: "5τ = 5 ms (99.3%)" },
          { label: "0.1Ω Shunt ×16", value: "0..3200 mV", sub: "Uses 97% of ADC range" },
          { label: "3.3V Op-Amp", value: "Rail-to-Rail (MCP6001)", sub: "LM358 clips near ~1.8 V" }
        ],
        legend: ["Op-Amp Buffer / Gain", "RC Filter (τ, fc)", "Rail Limit / Ripple"],
        openQuestions: [
          {
            scenario: "3.3V ANALOG DESIGN · OP-AMP & RC FILTER",
            prompt:
              "1) You power an `LM358` from a single `3.3 V` supply in a `16×` non-inverting amplifier (`Rg = 1 kΩ, Rf = 15 kΩ`) sensing a `0..200 mV` shunt: why does the ADC stall near `1.8 V` at `2 A` instead of reading `3.2 V`? 2) Why does `R = 10 kΩ, C = 100 nF` (`fc ≈ 159 Hz`) produce clean DC from `10 kHz` PWM yet heavy ripple from `50 Hz` PWM?",
            placeholder: "Explain LM358 headroom limit vs Rail-to-Rail and compare f_PWM to fc = 159 Hz...",
            hint: "LM358 clips around VCC - 1.5 V ≈ 1.8 V; effective PWM filtering requires fc <= f_PWM / 10."
          }
        ]
      },
      {
        title: "Signal Smoothing in Code (EMA) & Reducing ADC Noise",
        body:
          "The software equivalent of an RC filter is **1 line of integer C**: **`y += (x - y) / k`** (Exponential Moving Average — EMA). Setting `k ≈ τ / T_sample` reaches `~63.2%` in `k` steps, `95%` in `3k`, and `> 99%` in `5k`! Watch out for the **integer rounding stall**: once `|x − y| < k`, integer division yields `0` and gets stuck short (e.g., `x = 1000, k = 10` stalls at `991`); keep a scaled accumulator (`y * k`) to reach `1000` cleanly. On hardware, filter **`VDDA`** with `100 nF // 1–4.7 µF` + a ferrite bead (`50 mV` supply ripple adds **`62 steps`** of ADC noise!) and increase `SMPR` sampling time for high-resistance sources.",
        codeLang: "C · integer EMA smoothing & fixing rounding stall",
        code: `/* 1) Simple EMA: stalls at 991 because integer division drops remainders */
int32_t ema_naive_step(int32_t y, int32_t x, int32_t k) {
    return y + (x - y) / k; /* x=1000, k=10 -> stops at 991! */
}

/* 2) Precision EMA using a scaled accumulator (stores state = y * k) */
int32_t ema_scaled_step(int32_t *acc_scaled, int32_t x, int32_t k) {
    int32_t y = (*acc_scaled + (k / 2)) / k;
    *acc_scaled = *acc_scaled - y + x;
    return (*acc_scaled + (k / 2)) / k; /* converges all the way to 1000! */
}`,
        callout: {
          text: "On a 12-bit 3.3V ADC, 1 step ≈ 806 µV. Even 50 mV of ripple on VDDA or a >100 kΩ source with short Sampling Time (SMPR) makes readings jitter wildly despite bug-free C code!"
        },
        diff: [
          "k steps of integer EMA y += (x - y) / k match one RC time constant τ.",
          "Direct (x - y) / k stalls near x - (k - 1); a scaled accumulator eliminates the stall."
        ],
        kpis: [
          { label: "1 step (12b/3.3V)", value: "806 µV", sub: "50 mV ripple = 62 steps!" },
          { label: "EMA 1τ / 5τ", value: "k steps / 5k steps", sub: "63.2% / >99% settled" },
          { label: "Stall fix", value: "Scaled acc", sub: "Prevents stall at 991" }
        ],
        legend: ["Simple EMA (stalls)", "Scaled accurate EMA", "VDDA & ADC filtering"],
        nodes: [
          ["VDDA + ADC Cap (SMPR)", "100nF//1µF + ferrite bead cuts step noise"],
          ["EMA y += (x - y) / k", "1-line software twin of an RC Low-Pass filter"],
          ["Scaled accumulator", "Removes k - 1 integer remainder stall"]
        ]
      },
      {
        title: "Lab · Smoothing PWM to DC with RC Filters & Op-Amp Gain",
        body:
          "Practice integer PWM/RC/Op-Amp math alongside hardware or Falstad measurements: (1) Write integer C functions `pwm_calc_timer_params(f_clk, target_hz, duty_permille, &out)` (minimize `psc` to maximize `ARR` resolution), `rc_cutoff_hz`, `opamp_noninv_mv`, and `ema_step` cleanly under ASan/UBSan; (2) On hardware or Falstad, output `10 kHz` (or `1 kHz`) PWM at `25%`, `50%`, `75%` duty through `R = 10 kΩ, C = 100 nF` (or `1 µF`) and measure the filtered DC voltage & ripple against `3300 × duty / 1000`.",
        codeLang: "C · Timer PWM, RC & EMA verification asserts",
        code: `/* Integer math checks (zero floating-point) */
pwm_params_t p;
assert(pwm_calc_timer_params(72000000U, 20000U, 500U, &p));
assert(p.psc == 0U && p.arr == 3599U && p.ccr == 1800U && p.actual_hz == 20000U);

assert(pwm_avg_mv(3300U, 500U) == 1650U);
assert(rc_tau_us(10000U, 100U) == 1000U);
assert(rc_cutoff_hz(10000U, 100U) == 159U);
assert(opamp_noninv_mv(200U, 1000U, 15000U, 3300U) == 3200U);
assert(opamp_noninv_mv(200U, 1000U, 15000U, 1800U) == 1800U); /* LM358 ceiling clip */`,
        callout: {
          text: "When sizing PSC and ARR for hardware PWM, pick the smallest PSC that keeps ARR <= 65535 so CCR achieves the finest duty-cycle resolution."
        },
        diff: [
          "All PWM timing, RC cutoff fc, and Op-Amp gain calculations run in uint64_t with zero float.",
          "Compare RC-filtered DC readings at 25%, 50%, 75% duty against expected 825, 1650, and 2475 mV."
        ],
        kpis: [
          { label: "72 MHz Timer", value: "20 kHz → ARR=3599", sub: "PSC=0, CCR(50%)=1800" },
          { label: "RC Low-Pass", value: "10kΩ + 100nF", sub: "fc = 159 Hz" },
          { label: "50% DC level", value: "≈ 1650 mV", sub: "3.3V PWM DAC" }
        ],
        legend: ["PSC / ARR / CCR math", "RC & Op-Amp checks", "DC & ripple bench test"],
        nodes: [
          ["C formula checks", "Verify PSC/ARR, fc, Op-Amp, EMA without float"],
          ["PWM + RC Lab", "Filter 10 kHz PWM via 10 kΩ / 100 nF"],
          ["DMM / Scope Check", "Verify 825 / 1650 / 2475 mV DC & ripple"]
        ],
        quiz: [
          {
            prompt:
              "For a 1st-order RC low-pass filter using `R = 10 kΩ` and `C = 100 nF`, what are the time constant `τ` and full settling time (`5τ`, ~99.3%)?",
            options: [
              "τ = 100 µs and 5τ = 500 µs",
              "τ = 1 ms (1000 µs) and 5τ = 5 ms",
              "τ = 10 ms and 5τ = 50 ms"
            ],
            explain:
              "τ = R × C = 10,000 Ω × 100 nF = 1,000,000 ns = 1000 µs = 1 ms, giving a 5τ settling time of 5 ms."
          },
          {
            prompt:
              "With the integer EMA filter `y += (x - y) / k` (`k = 10`, step target `x = 1000`, initial `y = 0`), why does `y` stall at `991` instead of reaching `1000`?",
            options: [
              "Because variable y overflows",
              "Because once |x - y| < 10 (at y = 991), integer division (1000 - 991) / 10 = 9 / 10 truncates to 0",
              "Because smoothing factor k = 10 is too small"
            ],
            explain:
              "Truncating integer division yields 0 whenever the error |x - y| drops below k, causing the value to stall short of the target."
          }
        ]
      }
    ]
  },
  "e-serial-datasheet": {
    title: "UART/I2C/SPI/CAN Signals, Datasheets & Logic Analyzers",
    subtitle:
      "Electrical behavior of UART/I2C/SPI/CAN, 15-min datasheet checks (max current, 5V-tolerant pins, signal timing), 6-step pre-power smoke test & first board bring-up.",
    youllLearn: [
      "Explain electrical rules and traps of UART (8N1, <=2%), I2C (Open-Drain, pull-ups, 7b/8b), SPI (Mode 0..3) & CAN (120 Ω)",
      "Check the 5 key datasheet limits in 15 min (ΣI_VDD, R_AIN/C_ADC, 5V-tolerant pins vs ADC, timing) & 5 schematic blocks",
      "Pair DMM, USB Logic Analyzer (PulseView), and Scope with a 6-step Smoke Test for first board bring-up"
    ],
    steps: [
      {
        title: "How 4 Serial Buses Work Electrically: UART, I2C, SPI & CAN",
        body:
          "**UART (`TX↔RX` + shared `GND`)**: asynchronous `8N1` (**LSB-first**, 10 bit-times/byte), requiring baud error `≤ 2%` (`20‰`) so sampling stays inside the 10th bit. **I2C (`SDA/SCL`)**: **Open-Drain** outputs only pull low and **require external pull-ups (`2.2–4.7 kΩ`)** — missing pull-ups pin both lines to `0 V`! Fast Mode (`400 kHz`) demands **`t_r ≈ 0.8473 · R_p · C_bus ≤ 300 ns`**; distinguish 7-bit `0x68` (`MPU6050`) from 8-bit `0xD0` (`W`) / `0xD1` (`R`), handle `ACK/NACK`, and toggle 9 `SCL` pulses to free hung slaves. **SPI**: `10–50+ MHz` Push-Pull (**MSB-first**), where wrong `(CPOL, CPHA)` shifts bits by 1. **CAN/RS485**: twisted differential pair cancels noise + **exactly two `120 Ω` bus-end terminators** (`120 ∥ 120 = 60 Ω`).",
        codeLang: "C · I2C rise time tr (ns) & 7-bit/8-bit address",
        code: `/* 1) I2C rise time (ns): tr ≈ 0.8473 * Rp * C_bus */
uint32_t i2c_rise_time_ns(uint32_t rp_ohm, uint32_t c_bus_pf) {
    uint64_t num = 8473ULL * rp_ohm * c_bus_pf + 5000000ULL;
    return (uint32_t)(num / 10000000ULL);
}
/* Rp = 4.7 kΩ, C_bus = 100 pF -> 398 ns (ok 100 kHz <= 1000ns, FAILS 400 kHz <= 300ns!)
 * Drop Rp = 2.2 kΩ            -> 186 ns (PASSES 400 kHz!) */

/* 2) Convert 7-bit I2C slave address to first 8-bit wire byte */
uint8_t i2c_addr8(uint8_t addr7, bool is_read) {
    return (uint8_t)((addr7 << 1U) | (is_read ? 1U : 0U)); /* 0x68 + W -> 0xD0 */
}`,
        callout: {
          text: "Never install 120 Ω termination resistors at every node on a CAN/RS485 bus! Six nodes with 120 Ω in parallel drop bus load to 20 Ω, overloading transceivers and collapsing the signal. Terminate ONLY the two far ends."
        },
        diff: [
          "UART transmits LSB-first (bit 0 first); I2C and SPI transmit MSB-first (bit 7 first).",
          "Confusing 7-bit address (0x68) with shifted 8-bit byte (0xD0) is the #1 cause of unexpected I2C NACKs."
        ],
        kpis: [
          { label: "UART Baud err", value: "≤ 2% (20‰)", sub: "8N1 LSB-first + common GND" },
          { label: "I2C Fast 400k", value: "tr ≤ 300 ns", sub: "Rp 2.2k–4.7k, 0x68→0xD0" },
          { label: "CAN / RS485", value: "2 × 120 Ω", sub: "Only at trunk ends (60 Ω)" }
        ],
        legend: ["UART (LSB) / SPI (MSB)", "I2C Open-Drain & ACK", "CAN/RS485 120Ω Differential"]
      },
      {
        title: "15-Min Datasheet Check: Max Current, 5V-Tolerant Pins & Signal Timing",
        body:
          "Use the **Datasheet** (~150 pages) for electrical/pinout/timing limits, and the **Reference Manual** (~1500 pages) for register details! Always check your specific MCU datasheet in 5 spots: (1) **Max total chip current (`ΣI_VDD`)**: besides per-pin `±25 mA`, respect **total chip current** (e.g., `120–150 mA` — driving 10 LEDs × `15 mA` = `150 mA` + CPU causes brownouts even when each pin is `< 25 mA`!); (2) **Analog `VDDA`, `R_AIN` & `C_ADC`** limits for accurate ADC sampling; (3) **`FT` (5V-tolerant) vs standard pins**: `FT` pins tolerate `5 V` in Digital mode ONLY — they **LOSE `5 V` tolerance in Analog (`ADC`) mode**!; (4) **DC levels**; (5) **Setup/hold timing (`t_su`, `t_h`)**. Check 5 STM32 schematic blocks: Power+LDO, `100 nF` per `VDD-VSS`+`VDDA`, `NRST` (`100 nF`), Crystal+`BOOT0` (`10 kΩ → GND`), and `SWD` (**NEVER put `100 nF` on `SWDIO/SWCLK`**!).",
        codeLang: "C · Datasheet current budget & SPI timing checks",
        code: `/* 1) Enforce per-pin limit AND total bond-wire ΣI_VDD budget from Datasheet */
bool mcu_check_pin_budget(uint32_t pin_ma, uint32_t num_active_pins,
                          uint32_t cpu_ma, uint32_t max_pin_ma,
                          uint32_t max_total_vdd_ma) {
    if (pin_ma > max_pin_ma) return false;
    return (pin_ma * num_active_pins + cpu_ma) <= max_total_vdd_ma;
}
/* 10 LEDs * 15 mA + 25 mA CPU = 175 mA > ΣI_VDD (120..150 mA) -> BROWNOUT/DAMAGE! */

/* 2) Check SPI half-period margin: T_half >= t_co + t_skew + t_su */
bool spi_calc_timing_ns(uint32_t f_sck_hz, uint32_t t_co_ns,
                        uint32_t t_skew_ns, uint32_t t_su_ns) {
    uint32_t t_half_ns = 500000000U / f_sck_hz;
    return t_half_ns >= (t_co_ns + t_skew_ns + t_su_ns);
}`,
        callout: {
          text: "Always look up the exact ΣI_VDD, R_AIN, and C_ADC limits in your specific MCU's datasheet! And NEVER put a 100 nF debounce capacitor on SWCLK or SWDIO — it ruins MHz programming edges."
        },
        diff: [
          "Sourcing 10 LEDs × 15 mA from GPIO stays under ±25 mA/pin yet violates the chip's total ΣI_VDD limit.",
          "Inspect I/O structure: FT pins only accept 5 V digitally; once configured for ADC, clamp input <= VDDA + 0.3 V."
        ],
        kpis: [
          { label: "Chip ΣI_VDD", value: "120–150 mA", sub: "Check your MCU datasheet" },
          { label: "FT pin in ADC", value: "Loses 5V tol!", sub: "Drops to VDDA + 0.3V" },
          { label: "SWCLK / SWDIO", value: "Zero 100 nF", sub: "Keep MHz edges crisp" }
        ],
        legend: ["ΣI_VDD / FT limits", "Timing t_su / t_h", "5 Schematic blocks"],
        openQuestions: [
          {
            scenario: "HARDWARE DEBUG · DATASHEET & I2C",
            prompt:
              "1) An STM32 board drives 10 LEDs (`15 mA` each, safely below the `±25 mA` per-pin limit), yet turning all 10 ON simultaneously causes repeated brownout resets and port heating: which Datasheet rating was exceeded and how do you fix the hardware? 2) Wiring a bare `MPU6050` breakout to `PB6/PB7` (`I2C1`) yields `TIMEOUT`, and a DMM reads `0 V` on both `SDA` and `SCL`: what electrical component is missing?",
            placeholder: "Name ΣI_VDD + external transistor/MOSFET drive, and explain I2C Open-Drain pull-up resistors...",
            hint: "1) Compare 10 × 15 mA + CPU against ΣI_VDD in the datasheet; fix with external BJT/MOSFET drivers. 2) Open-Drain only pulls low and cannot float to 3.3 V without external pull-ups."
          }
        ]
      },
      {
        title: "6-Step Pre-Power Smoke Test & Logic Analyzer / Oscilloscope",
        body:
          "Pick the right tool: a **DMM** verifies static DC rails and shorts but misses fast serial frames; a **`24 MHz` USB Logic Analyzer + `PulseView`** (sampling at `≥ 4–10×` bus frequency) decodes UART/I2C/SPI frames to catch bad baud rates, `NACK`s, or `CPOL/CPHA` mismatches; an **Oscilloscope** reveals true analog `V(t)` behavior — I2C rise time `t_r`, regulator ripple, switch bounce, and Flyback spikes. Before powering breadboards (watch out for split center power rails and 5-hole short strips!) or freshly soldered boards, run the **6-Step Cold/Hot Smoke Test**.",
        codeLang: "Mandatory 6-Step Smoke Test before power-on",
        code: `// 6-Step Smoke Test (MANDATORY before plugging full USB/bench supply):
// 1. Visual check (cold): polarized caps/diodes/LEDs, pin-1 dot, solder bridges.
// 2. COLD continuity: 3V3 <-> GND, 5V <-> GND (> 50 Ω, no steady beep!).
// 3. Inter-rail isolation: no short between 5V <-> 3V3 or SWDIO/SWCLK <-> GND.
// 4. Unloaded power check (hot): verify LDO output reads 3300 mV ± 2%.
// 5. Controlled 3s power-up: current-limited supply; touch-check LDO/MCU heat.
// 6. Basic bring-up: NRST ~3.3V, idle current ~10..40 mA, ST-Link reads Chip ID.`,
        callout: {
          text: "In PulseView, to decode 400 kHz I2C or 2 MHz SPI without aliasing glitches, set Sample Rate to 8–24 MHz (at least 4× to 10× the bus clock)."
        },
        diff: [
          "Logic Analyzer diagnoses protocol errors (NACK, wrong SPI Mode, baud drift); Scope diagnoses rise time tr and analog noise.",
          "80% of 830-tie breadboard mistakes come from split +/- power rails down the middle or shorting across a 5-hole column."
        ],
        kpis: [
          { label: "Logic Analyzer", value: "24 MHz (≥4–10×)", sub: "Decodes UART/I2C/SPI" },
          { label: "Oscilloscope", value: "Analog V(t)", sub: "Sees tr, ripple, bounce" },
          { label: "Smoke Test", value: "6 steps", sub: "Saves LDOs & MCUs" }
        ],
        legend: ["DMM + Smoke Test", "PulseView Protocol", "Scope Analog V(t)"],
        nodes: [
          ["6-Step Smoke Test", "Visual → Cold short check → LDO → 3s touch test"],
          ["USB Logic Analyzer", "Sample ≥4–10× bus, decode UART/I2C/SPI in PulseView"],
          ["Oscilloscope", "Inspect I2C tr, switch bounce & Flyback spikes"]
        ]
      },
      {
        title: "Lab · First Board Bring-Up & Direct Register Control",
        body:
          "Put everything together to bring up a board from scratch in 4 stages: (1) **Discrete Circuits**: build 4 basic circuits (`12.6 V` divider, E12 LED, pull-up button, Low-Side MOSFET + Flyback) on bench or Falstad after the 6-step smoke test; (2) **Non-Blocking Loop**: zero `delay()` — `500 ms` heartbeat LED, debounced button, `uint64_t` 12-bit ADC mV scaling (zero `float`), and PWM control; (3) **Buses & Capture**: Static Ring-Buffer UART CLI + I2C/SPI `WHO_AM_I` verified with `.vcd`/`.sr` captures in **PulseView**; (4) **Direct Registers**: control `RCC`, `MODER` RMW, and `BSRR` via `volatile uint32_t` with zero HAL GPIO + `test_reg_mock.c`!",
        codeLang: "C · direct register struct & test_reg_mock.c",
        code: `typedef struct {
    volatile uint32_t MODER;
    volatile uint32_t OTYPER;
    volatile uint32_t OSPEEDR;
    volatile uint32_t PUPDR;
    volatile uint32_t IDR;
    volatile uint32_t ODR;
    volatile uint32_t BSRR;
} bare_gpio_t;

/* RMW pin to Output (01) preserving 100% of neighboring pin bits */
void gpio_set_output(bare_gpio_t *gpio, uint8_t pin) {
    uint32_t shift = (uint32_t)pin * 2U;
    gpio->MODER = (gpio->MODER & ~(UINT32_C(3) << shift)) | (UINT32_C(1) << shift);
}
/* Atomic set/reset: gpio->BSRR = UINT32_C(1) << pin; / << (pin + 16U); */`,
        callout: {
          text: "When writing direct STM32 register code, always enable the peripheral clock in RCC BEFORE touching MODER/ODR! In test_reg_mock.c, assert that every bit outside your pin mask stays untouched."
        },
        diff: [
          "Zero float in firmware scaling mV, centi-degrees, or PWM duty; zero blocking delay() calls in superloop.",
          "Save real PulseView waveform captures plus a decoded UART LSB-first byte and full I2C/SPI transaction."
        ],
        kpis: [
          { label: "Circuits & Loop", value: "50 pts", sub: "Discrete + Non-blocking ADC/PWM" },
          { label: "UART + I2C + Logic", value: "30 pts", sub: "RingBuf CLI + PulseView" },
          { label: "Direct Registers", value: "20 pts", sub: "RCC/MODER/BSRR + mock test" }
        ],
        legend: ["Circuits & ADC/PWM", "PulseView Decode", "Direct Registers"],
        nodes: [
          ["Circuits & ADC/PWM", "4 discrete circuits + 0-float, 0-delay superloop"],
          ["UART + I2C + PulseView", "RingBuf CLI + WHO_AM_I + waveform capture"],
          ["Direct Registers", "RCC + MODER/BSRR + test_reg_mock on WSL"]
        ],
        quiz: [
          {
            prompt:
              "An `MPU6050` datasheet lists its 7-bit I2C address as `0x68` (`AD0 = 0`). What is the actual first 8-bit byte transmitted on `SDA` for a **Write** operation?",
            options: ["0x68", "0xD0", "0xD1"],
            explain:
              "An 8-bit I2C address byte places the 7-bit address in bits [7:1] and the R/W bit in [0] (0 = Write). Thus (0x68 << 1) | 0 = 0xD0 (while Read is 0xD1)."
          },
          {
            prompt:
              "On a 4-node **CAN** or **RS485** trunk built with `Z0 = 120 Ω` twisted-pair cable, where should `120 Ω` termination resistors be installed?",
            options: [
              "Install 120 Ω at all 4 nodes for symmetrical noise rejection",
              "Install exactly two 120 Ω resistors at the two extreme physical ends of the trunk (parallel load = 60 Ω)",
              "Install a single 120 Ω resistor at the middle node only"
            ],
            explain:
              "A transmission line must be terminated in its 120 Ω characteristic impedance at both ends only (120 || 120 = 60 Ω). Terminating every node drops impedance too low and overloads drivers."
          }
        ]
      }
    ]
  }
};
