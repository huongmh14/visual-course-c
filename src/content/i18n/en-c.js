export const EN_C = {
  "intro-how-to-learn": {
    title: "How to Learn with Projects & Open Questions",
    subtitle: "An anti-boredom 3-beat active learning loop and open-ended engineering questions grounded in real firmware bugs.",
    youllLearn: [
      "70-minute active loop: Predict 15s → Break code + assert → Answer open questions",
      "Case #1: Prevent integer overflow in a Battery Management System (BMS)",
      "Case #2: Debounce a mechanical button without blocking the CPU using delay()",
      "Case #3: Send multi-byte UART/CAN frames without endianness or padding bugs",
      "Plan your personal project direction across the 4 course stages"
    ],
    steps: [
      {
        title: "Learn Embedded C through real problems, not passive reading",
        body: "Reading slides passively gets boring fast. Each 70-minute session follows 3 beats: (1) Study the diagram and predict the outcome for 15 seconds before clicking `Next step →`; (2) In the `LAB` step, deliberately break types to observe bugs and verify fixes with `assert`; (3) Answer the open question in your own words.",
        codeLang: "Study loop · 70 minutes",
        callout: { text: "Memory sticks strongest when you commit to a prediction and get surprised by the diagram or compiler." },
        diff: [
          "Press Space to pause the diagram and inspect each signal packet.",
          "Always compile with -Wall -Wextra -Werror to catch subtle bugs early."
        ],
        kpis: [
          { label: "Beat 1", value: "20 min", sub: "Predict + Visuals" },
          { label: "Beat 2", value: "35 min", sub: "Break code + assert" },
          { label: "Beat 3", value: "15 min", sub: "Open Questions" }
        ],
        legend: ["Active prediction", "Assert verification", "Personal reflection"]
      },
      {
        title: "Case #1: EV Battery gauge drops 99% → 0%",
        body: "A Battery Management System (BMS) measures cell voltages `0..4200 mV` and charge/discharge currents `-5000..+5000 mA`. Choosing the wrong integer type (such as summing into a `uint8_t`) wraps past 255 back to 0 — reporting a false empty battery mid-ride.",
        codeLang: "C · range overflow trap",
        callout: { text: "Always size intermediate accumulators (sums and products) for their worst-case maximum, not just the final output." },
        diff: [
          "uint8_t total = 200 + 80 wraps modulo 256 to 24.",
          "Match <stdint.h> signedness and bit-width to the sensor's physical range."
        ],
        kpis: [
          { label: "Cell voltage", value: "0..4200 mV", sub: "Unsigned" },
          { label: "Pack current", value: "±5000 mA", sub: "Signed" },
          { label: "Wrong type risk", value: "Overflow", sub: "Wraps around 0" }
        ],
        legend: ["Overflow fault", "Safe range"],
        openQuestions: [
          {
            scenario: "REAL CASE #1 · EV BATTERY BMS",
            prompt: "1) Which `<stdint.h>` types would you pick for `cell_mv` (`0..4200 mV`) and `current_ma` (`-5000..+5000 mA`)? 2) If you sum 32 consecutive `cell_mv` samples to compute an average, can `uint16_t` hold the sum safely? Why or why not?",
            placeholder: "Write your type choices and max sum calculation (32 * 4200)...",
            hint: "Check: uint16_t max is 65,535. Compare 32 × 4,200 = 134,400 against 65,535!"
          }
        ]
      },
      {
        title: "Case #2: One button press triggers 3 times",
        body: "Mechanical switch contacts bounce electrically for 5–20 ms. Adding `delay_ms(50)` freezes the entire CPU for 50 ms — dropping UART bytes, starving motor control loops, and making the system feel sluggish.",
        codeLang: "C · blocking delay trap",
        callout: { text: "In real firmware (super-loop or RTOS), busy-wait delays break real-time responsiveness." },
        diff: [
          "delay_ms(50) blocks all other sensors in the main loop.",
          "Sample periodically (e.g. every 5 ms) and count consecutive stable readings."
        ],
        kpis: [
          { label: "Bounce window", value: "5–20 ms", sub: "Contact chatter" },
          { label: "delay_ms(50)", value: "Frozen CPU", sub: "Blocks everything" },
          { label: "3-sample filter", value: "Non-blocking", sub: "CPU stays free" }
        ],
        legend: ["Bouncy 0/1 signal", "Clean event"],
        openQuestions: [
          {
            scenario: "REAL CASE #2 · BUTTON DEBOUNCE",
            prompt: "Suppose your MCU must scan a button and read a gas sensor every 10 ms. What fails if you use `delay_ms(50)` for debouncing? Describe in plain words how to debounce WITHOUT stalling the CPU.",
            placeholder: "Explain the sensor latency issue and a non-blocking state/counter approach..."
          }
        ]
      },
      {
        title: "Case #3: 10.00 °C sensor reads 59,395 °C over UART",
        body: "STM32 stores `uint16_t temp_x100 = 1000` (`0x03E8`) in RAM in **little-endian** order (`0xE8` then `0x03`). Casting a struct pointer directly to `uint8_t*` and sending it to a **big-endian** receiver turns `0x03E8` into `0xE803 = 59,395`!",
        codeLang: "C · raw RAM transmit trap",
        callout: { text: "In-memory struct layout belongs to the compiler and CPU; wire framing must be explicitly encoded byte by byte." },
        diff: [
          "Sending raw &struct leaks padding bytes and reverses byte order.",
          "Explicit bit-shift encode/decode functions behave identically across architectures."
        ],
        kpis: [
          { label: "True value", value: "0x03E8", sub: "1,000 (10.00 °C)" },
          { label: "Raw UART wire", value: "E8 → 03", sub: "Endian leak" },
          { label: "Decoded error", value: "59,395", sub: "59× too high!" }
        ],
        legend: ["Raw RAM leak", "Encoded frame"],
        openQuestions: [
          {
            scenario: "REAL CASE #3 · UART FRAMING",
            prompt: "Why can sending a raw C `struct` directly over UART between an STM32 and a gateway produce garbage numbers even when both sides are written in C? Name at least two reasons.",
            placeholder: "Hint: think about struct padding and byte order (endianness)...",
            hint: "Two classic causes: (1) Compiler alignment padding inserts unspecified bytes; (2) Little-endian vs. big-endian mismatch."
          }
        ]
      },
      {
        title: "4-stage roadmap & your personal project goal",
        body: "Instead of isolated syntax drills, you progress through 4 connected stages: (1) Core Embedded C + PC CSV testing; (2) Electronics (Ohm's law, Pull-up, ADC, PWM); (3) STM32 Cortex-M registers & buses; (4) FreeRTOS, Makefiles & LoRa.",
        codeLang: "Practice path · PC → STM32",
        callout: { text: "Great firmware is verified on a PC against boundary CSV datasets before flashing real hardware." },
        diff: [
          "Direct bridge between PC C labs and STM32 peripheral registers.",
          "Every CSV dataset models realistic noise and edge cases."
        ],
        kpis: [
          { label: "Ready lessons", value: "12 lessons", sub: "Stages 1 & 2 complete" },
          { label: "Test datasets", value: "4 CSVs", sub: "fsm, debounce, adc, pwm" },
          { label: "Full roadmap", value: "23 lessons", sub: "Expanding step by step" }
        ],
        legend: ["Continuous progression"],
        openQuestions: [
          {
            scenario: "PERSONAL PROJECT DIRECTION",
            prompt: "Among the three real-world problems above (Battery BMS, Non-blocking real-time control, UART/CAN/LoRa framing), which excites you most and what mini-project would you love to build by the end of the course?",
            placeholder: "e.g., A battery monitor with OLED display, or a remote LoRa sensor node..."
          }
        ]
      },
      {
        title: "Lab · Kick off your Week 1 study rhythm",
        body: "Before jumping into Lesson 01, lock in your daily schedule in the open question below, click `Copy (.md)` to save your answers into `week01/notes.md` inside `embedded-journey`, and complete the quick check.",
        codeLang: "Terminal · Initialize week01 notes",
        callout: { text: "Three honest lines written in your own words beat ten pages of copied slides." },
        diff: [
          "Fill in your answers to the open questions in Steps 2–6.",
          "Click Copy (.md) to export your notes to Markdown."
        ],
        nodes: [
          ["Read & Predict", "Step diagrams"],
          ["Answer Open Qs", "Real firmware cases"],
          ["Export .md + Code", "embedded-journey/week01"]
        ],
        openQuestions: [
          {
            scenario: "WEEK 1 COMMITMENT",
            prompt: "What fixed daily slot will you reserve for this course (e.g., 20:00–21:10), and what is your 15-minute minimum fallback on exhausting school days so you never break the streak?",
            placeholder: "e.g., 20:00 nightly; on tough days do 1 visual lesson + 1 open question in 15 min..."
          }
        ],
        quiz: [
          {
            prompt: "When you hit a PROBLEM step (e.g., `uint8_t` wraparound or reversed UART bytes), which habit builds the strongest recall?",
            options: [
              "Click Next repeatedly to finish fast",
              "Pause 15 seconds to predict the bug before clicking Next, then test with assert",
              "Memorize slide definitions verbatim"
            ],
            explain: "Committing to a prediction and verifying it visually and with asserts drives far stronger active recall."
          }
        ]
      }
    ]
  },
  "c-types-io": {
    title: "Data types, variables, printf & scanf",
    subtitle: "Week 1, Day 3 · Choose types by range, read and print on a PC, and write calculation functions that can also use sensor data.",
    steps: [
      {
        title: "Choose a type by its range",
        body: "A variable has a type and a value. Its type determines the range of values it can hold and how C handles those values. A 12-bit ADC has 4096 codes from 0 to 4095, so uint16_t can hold one sample. Predict each type's size before running the program.",
        codeLang: "C · measure type sizes",
        nodes: [["12-bit ADC", "0…4095"], ["Storage type", "uint16_t"], ["Size", "sizeof raw"]],
        callout: { text: "The sizeof operator returns a size in C bytes as a size_t value. printf and scanf are standard library functions declared in <stdio.h>." },
        diff: ["Add measurements for uint8_t, uint16_t, and uint32_t.", "Compare the uint8_t limit with the largest ADC code. The value of sizeof(int) depends on the compilation target."]
      },
      {
        title: "Read and check before calculating",
        body: "On a PC, scanf reads from standard input. The %lf conversion requires the address of a double variable so it can store the result there. Use the variable only after scanf returns 1, indicating one successful assignment. printf uses %.2f to display a real number with two decimal places.",
        codeLang: "C · read, check, and print",
        nodes: [["Input", "25.5 or abc"], ["scanf", "1 or 0"], ["Output", "25.50 C or an error"]],
        callout: { text: "&celsius gives scanf the address to write to. In firmware, the data can come from a sensor reader. The calculation function takes that value as an argument." },
        diff: ["Enter 25.5 and then abc. Predict which branch runs in each case.", "End the input before entering a number. The program should take the error branch."]
      },
      {
        title: "Turn a requirement into a function",
        body: "The requirement is to accept °C and return °F. Write down the input, return type, and equation F = C × 9/5 + 32 before coding the function body. Trace 100 °C by hand. With (9 / 5), integer division gives 1 before multiplication, producing the incorrect result 132 °F.",
        codeLang: "C · convert temperatures",
        nodes: [["Input", "100 °C"], ["Calculate", "100 × 1.8 + 32"], ["Return value", "212 °F"]],
        callout: { text: "Keep scanf and printf in main. Call the same calculation function from a test or when you receive a sensor reading." },
        diff: ["0 °C → 32 °F, 100 °C → 212 °F, −40 °C → −40 °F.", "In main, print the result of celsius_to_fahrenheit(celsius)."]
      },
      {
        title: "Check the range of the sum",
        body: "Before writing the averaging function, list the inputs, output, and intermediate operations. Three uint16_t samples can add up to 196605, so the sum needs a wider type. Convert the first operand before addition so the expression has enough range even on a target with a 16-bit int.",
        codeLang: "C · sum using a wider type",
        nodes: [["Three samples", "1, 2, 2"], ["Sum", "5"], ["Floating-point division", "1.666…"]],
        callout: { text: "Assigning to double after integer division converts a result that has already lost its fraction. Divide by 3.0 to keep the fraction." },
        diff: ["For three samples of 65535, the sum is 196605 and the average is 65535.", "Apply the same calculation to three 12-bit ADC samples such as 0, 2048, and 4095."]
      },
      {
        title: "Lab · write and check three programs",
        body: "Write types.c to print type sizes, temperature.c to read and convert a temperature, and average.c to read three numbers and print their average. For each file, write down a typical case, a boundary case, and the expected output before running it. In average.c, write average3 for three real numbers, then try the average_adc3 variant with simulated readings.",
        codeLang: "C · exercise signatures",
        nodes: [["Predict", "type, range, and output"], ["Write", "read → calculate → print"], ["Check", "compare and commit"]],
        callout: { text: "Compile each file with -std=c17 -Wall -Wextra -Wpedantic. Commit once all three files pass their test cases and compile without warnings." },
        diff: ["types.c: print sizeof for int, uint8_t, uint16_t, and uint32_t. Explain which type can hold a 12-bit ADC sample.",
          "temperature.c: try 0, 100, −40, and abc. Each valid input prints the expected °F value, and abc reports an error.",
          "average.c: call scanf with three %lf conversions and check for a return value of 3. Try 1 2 2 → 1.67, -1 0 1 → 0.00, and 1 x 2 → error.",
          "Call average_adc3(65535, 65535, 65535) and check that it returns 65535."],
        quiz: [{
          prompt: "The integer sum is 5. Which expression keeps the fractional part of the average?",
          options: ["(double)(sum / 3)", "sum / 3.0", "sum / 3"],
          explain: "The 3.0 operand makes the division use floating-point arithmetic. Casting after integer division cannot recover the fraction."
        }]
      }
    ]
  },
  "c-control-flow": {
    title: "If, switch, loops & state machines",
    subtitle: "Trace conditions, indexes, and states step by step before moving the logic to a microcontroller.",
    steps: [
      {
        title: "Read conditions in evaluation order",
        body: "In C, zero is false and a nonzero value is true. With &&, C evaluates the right operand only when the left operand is true. Use this rule to check that the denominator is valid before calculating a percentage.",
        codeLang: "C · classify a sample",
        nodes: [["Sample", "740 / 1000"], ["Check", "limit ≠ 0"], ["Alert", "74% ≥ 70%"]],
        callout: { text: "When limit is zero, C skips the entire right operand. Cast before multiplying so the calculation uses a wide enough type." },
        diff: ["Set limit to 0 and predict high.", "Use <stdbool.h> and <stdint.h> for the types in this example."]
      },
      {
        title: "Process an array one sample at a time",
        body: "A for loop checks its condition before each iteration. With three elements, i < n allows indexes 0, 1, and 2. Each iteration can process one sample and then advance to the next.",
        codeLang: "C · count samples at or above a threshold",
        nodes: [["Index 0", "690 → skip"], ["Index 1", "700 → count"], ["Index 2", "740 → count"]],
        callout: { text: "Use sizeof to count elements wherever the array object itself is visible. Use size_t from <stddef.h>." },
        diff: ["The result is high_count = 2.", "With n = 0, the loop body runs zero times."]
      },
      {
        title: "While, do while, and bounded waits",
        body: "A while loop checks its condition before each iteration, so it can run zero times. A do while loop checks at the end, so it runs at least once. This example reads a flag and retries up to a total of four reads.",
        codeLang: "C · read a flag with a retry limit",
        code: "unsigned tries = 0;\nbool ready;\ndo {\n    ready = read_ready();\n    ++tries;\n} while (!ready && tries < 4);\n// If ready is false after the loop, the retry limit was reached.",
        nodes: [["First read", "tries = 1"], ["Check", "!ready && tries < 4"], ["Exit", "ready or out of tries"]],
        callout: { text: "A read limit lets the loop exit when hardware does not respond. In a superloop, read once per iteration and track elapsed time so other tasks can keep running." },
        diff: ["Simulate read_ready() returning true immediately → 1 read.", "Simulate read_ready() always returning false → exactly 4 reads."]
      },
      {
        title: "Use switch to choose behavior by state",
        body: "One call processes one event and returns the next state. The firmware loop can call the function for each sample. A return statement exits the function as soon as its branch is selected.",
        codeLang: "C · state transition",
        nodes: [["WAIT", "sample = 700"], ["Condition", "sample ≥ 700"], ["ALERT", "hold until sample < 650"]],
        callout: { text: "Thresholds of 700 and 650 create hysteresis, which keeps the state stable when samples fluctuate around 700." },
        diff: ["WAIT, 699 → WAIT", "WAIT, 700 → ALERT", "ALERT, 650 → ALERT", "ALERT, 649 → WAIT"]
      },
      {
        title: "Lab · review four C exercises and write an alert",
        body: "Rerun FizzBuzz, the prime check, the multiplication table, and the switch calculator in c-nhung/day-05-if-switch-loop. Then write next_state, use a for loop to pass each sample to it, and print the resulting state.",
        codeLang: "C · test data",
        code: "unsigned samples[] = {699, 700, 680, 650, 649};\n// Start in WAIT. Call next_state for each sample.",
        nodes: [["Sample sequence", "699, 700, 680…"], ["next_state", "one call per sample"], ["Result", "compare with expected states"]],
        callout: { text: "Run on a PC with GCC using -std=c17 -Wall -Wextra -Wpedantic. Use assert or compare the printed results." },
        diff: [
          "Expected sequence: WAIT, ALERT, ALERT, ALERT, WAIT.",
          "FizzBuzz: 15 → FizzBuzz. Prime check: 1 → false, 2 → true, 9 → false.",
          "Multiplication table: 9 × 9 = 81. Calculator: 6 / 2 = 3. Division by zero should report an error."
        ],
        quiz: [{
          prompt: "The current state is ALERT and the next sample is 670. What is the next state?",
          options: ["WAIT", "ALERT", "Error because 670 < 700"],
          explain: "In ALERT, only a sample below 650 switches the system back to WAIT."
        }]
      }
    ]
  },
  "b02-bitwise": {
    title: "Bitwise: from individual bits to embedded registers",
    subtitle:
      "Day 04 · Progress from bits 0..7, masks, flags, CMSIS multi-bit fields (_Pos/_Msk), and C17 traps to atomic BSRR writes and 12-bit ADC decoding.",
    youllLearn: [
      "Read bit positions 0..7, convert binary ↔ hex, and distinguish bit index from bit mask",
      "Evaluate and verify all six bitwise operators (& | ^ ~ << >>) by hand",
      "Perform Set, Clear (& ~mask), Toggle, and Test without disturbing other bits",
      "Check multiple flags (Any / All / None) and avoid the & vs == precedence trap",
      "Update multi-bit fields using CMSIS (_Pos / _Msk) conventions and assert invariants",
      "Avoid four C17 traps: integer promotion, shift UB, signedness, and printf formats",
      "Bridge RAM simulation to real MCUs: main/ISR races, atomic BSRR, and ADC decoding"
    ],
    steps: [
      {
        title: "One integer, many representations: bits 0..7, hex & masks",
        body:
          "In an 8-bit byte, **bit 0 is on the right** with weight 1, and bit `n` has weight `2^n`. Decimal `10`, binary `0000 1010`, and hex `0x0A` are **the same value**, not three different types. Each hex digit groups exactly 4 bits (`0xA = 1010`, `0xA5 = 1010 0101 = 165`). Always distinguish a **bit index** `3U` from a **bit mask** `1U << 3U` equal to `8U` (`0x08`).",
        codeLang: "C17 · unsigned literals & bit masks",
        callout: {
          text: "Follow the same four steps on every bitwise task: requirement → mask → expression → assert verification. Don’t memorize six isolated symbols."
        },
        diff: [
          "Add the U suffix (0x0AU, 1U) so literals are unsigned from the start.",
          "Avoid writing 010 for decimal ten — a leading 0 denotes octal (8) in C."
        ],
        kpis: [
          { label: "Bit 0 (LSB)", value: "Weight 1", sub: "Rightmost bit" },
          { label: "1 Hex digit", value: "4 bits", sub: "1 nibble (0..F)" },
          { label: "Bit 3 mask", value: "1U << 3U", sub: "= 8U (0x08), ≠ 3U" }
        ],
        legend: ["Bit index", "Bit mask", "4-bit nibble"]
      },
      {
        title: "Six bitwise & shift operators (& | ^ ~ << >>)",
        body:
          "Four operators — `&` (AND to filter), `|` (OR to set), `^` (XOR to toggle), and `~` (NOT to invert every bit) — operate independently per bit column. The shift operators `<<` and `>>` shift bits left or right and fill with `0` for unsigned operands (`6U << 2U = 24U`, `6U >> 2U = 1U`). Remember that `~a` inverts the **entire promoted `unsigned int` width** — narrow explicitly with `(uint8_t)~a` for an 8-bit result.",
        codeLang: "C17 · 02_bitwise_operators.c & 05_bitwise_self_check.c",
        callout: {
          text: "Right-shifting discards low bits permanently; shifting left again cannot recover them. The destination variable type does not make ~ or << run at 8-bit width."
        },
        diff: [
          "For a = 6U (0110) and b = 3U (0011): AND=2, OR=7, XOR=5.",
          "Do not assume ~6U equals 249 without narrowing — on 32-bit targets ~6U is 0xFFFFFFF9."
        ],
        kpis: [
          { label: "a & b / a | b", value: "2 / 7", sub: "a=6 (0110), b=3 (0011)" },
          { label: "a ^ b", value: "5", sub: "0101 (differ → 1)" },
          { label: "(uint8_t)~a", value: "249 (0xF9)", sub: "Narrowed to 8-bit" }
        ],
        legend: ["AND / keep bits", "Left shift <<", "Full-word NOT ~"]
      },
      {
        title: "Bit masks: Set, Clear (& ~mask), Toggle & Test",
        body:
          "From `03_clear_bit.c`: `data = 0x88` (`1000 1000`) has both bit 7 and bit 3 set. To **clear only bit 3** while preserving bit 7, invert the mask with `~mask` (`1111 0111 = 0xF7`) and AND: `data &= ~(1U << 3U)` → `0x80` (`128`). Writing `data & mask` by mistake extracts bit 3 (`0x08`) and wipes out bit 7! Remember three self-check properties: setting or clearing twice matches doing it once; toggling twice restores the original value.",
        codeLang: "C17 · 03_clear_bit.c & sequential updates",
        callout: {
          text: "Why do non-selected bits stay intact? Because x | 0 = x (Set), x & 1 = x (Clear via ~mask), and x ^ 0 = x (Toggle)."
        },
        diff: [
          "0x88 & ~(1U << 3U) = 0x80 (128): bit 7 is preserved and bit 3 is cleared.",
          "0x88 & (1U << 3U) = 0x08 (8): wrong operation because it destroys bit 7."
        ],
        kpis: [
          { label: "SET bit n", value: "reg |= mask", sub: "Target bit → 1" },
          { label: "CLEAR bit n", value: "reg &= ~mask", sub: "Target bit → 0" },
          { label: "TOGGLE bit n", value: "reg ^= mask", sub: "Flip 0 ↔ 1" }
        ],
        legend: ["Preserved bits", "Target bit to clear", "Active mask"],
        openQuestions: [
          {
            prompt: "Given data = 0x88 (1000 1000), why must clearing bit 3 use data &= ~(1U << 3U) instead of data &= (1U << 3U)? What happens if you clear bit 3 twice in a row?",
            hint: "Compare the bit table of 0x88 & 0xF7 against 0x88 & 0x08, and note the idempotence of clearing."
          }
        ]
      },
      {
        title: "Status flags, Any vs All & operator precedence trap",
        body:
          "One unsigned variable can pack independent flags (`READ = 1U << 0`, `WRITE = 1U << 1`, `EXEC = 1U << 2`, combined with `|`). When testing against `wanted = READ | WRITE`, distinguish **at least one flag** `(flags & wanted) != 0U` from **all flags** `(flags & wanted) == wanted`. Never test `(flags & wanted) == 1U` (fails when bit 1 is set → result is `2`), and always **parenthesize** `&` because `==` binds tighter than `&`!",
        codeLang: "C17 · 04_flags_and_permissions.md & precedence trap",
        callout: {
          text: "Unlike && and ||, bitwise & and | do NOT short-circuit. Also, when wanted == 0U, the ALL check is true while ANY is false — validate empty masks explicitly if required."
        },
        diff: [
          "Always compare (flags & mask) != 0U or == mask, never == 1U.",
          "Do not write flags == SENSOR_READY when unrelated flags (like BUTTON) may also be set."
        ],
        kpis: [
          { label: "ANY (≥ 1 flag)", value: "(f & m) != 0U", sub: "Non-zero passes" },
          { label: "ALL (every flag)", value: "(f & m) == m", sub: "Matches full mask" },
          { label: "C precedence", value: "== before &", sub: "Parentheses mandatory" }
        ],
        legend: ["ANY check", "ALL check", "Missing-parens bug"],
        quiz: [
          {
            prompt: "Given unsigned int flags = 0x02U and mask = 0x06U, what are the results of (flags & mask) != 0U and (flags & mask) == mask?",
            options: ["true and true", "true and false", "false and false"],
            explain: "0x02 & 0x06 = 0x02: non-zero so ANY is true, but 0x02 ≠ 0x06 so ALL is false."
          }
        ]
      },
      {
        title: "Multi-bit fields & CMSIS _Pos / _Msk conventions",
        body:
          "Configuration registers such as `GPIO->MODER` use a **2-bit field** per pin (`pin n` sits at `pos = 2 * n`, mask `UINT32_C(3) << pos`). Replacing an existing `11` field with `01` cannot be done with `|=` alone because OR never clears old `1` bits. Use the 3-step CMSIS pattern: (1) Clear old field `reg & ~Msk`, (2) Shift new value `val << Pos`, (3) OR them together. Avoid `struct` bit-fields for MMIO registers because bit ordering and bus access width are compiler-defined.",
        codeLang: "C17 · CMSIS _Pos / _Msk & assert invariant",
        callout: {
          text: "The most important test invariant for field updates is assert((after & ~mask) == (before & ~mask)) — proving 100% of bits outside the field remained untouched."
        },
        diff: [
          "Validate pin <= 15 and mode <= 3 before shifting; never silently truncate invalid inputs.",
          "Avoid struct { unsigned mode : 2; } for MMIO registers because bit layout depends on the compiler."
        ],
        kpis: [
          { label: "Pin n position", value: "pos = 2 * n", sub: "Pin 3 → bits [7:6]" },
          { label: "2-bit mask", value: "3U << pos", sub: "0x00C0 for pin 3" },
          { label: "Sample update", value: "0xFFFF → 0xFF7F", sub: "Readback = 1" }
        ],
        legend: ["Clear old field", "Merge new value", "Untouched bits"]
      },
      {
        title: "Four C17 traps: integer promotion, shift UB, signedness & printf",
        body:
          "On 32-bit GCC, `uint8_t mask = 0x0FU` is **promoted to `int`** before `~mask` runs, producing `-16` instead of `0xF0`! For C17 shifts: shifting by a negative count (`1U << -1`), shifting by `>= width` (`1U << 32U`), or left-shifting a negative value (`-1 << 1`) is **Undefined Behavior (UB)**; right-shifting a negative signed value (`-4 >> 1`) is *implementation-defined*. Also, `1U` is only guaranteed 16 bits wide — use `UINT32_C(1)` for 32-bit masks.",
        codeLang: "C17 · preventing promotion, UB & printf mismatches",
        callout: {
          text: "UB has no \"correct numeric answer\" — observing one result on your PC does not make it a rule. Always guard shifts with && (replacing && with & loses short-circuiting and triggers UB)."
        },
        diff: [
          "Use UINT32_C(1) << pos for 32-bit registers and PRIX32 from <inttypes.h> when printing.",
          "Avoid 1U << 32U, 1U << -1, and -1 << 1 (all are UB in C17)."
        ],
        kpis: [
          { label: "~mask8 (int)", value: "-16 (32-bit)", sub: "Cast uint8_t → 0xF0" },
          { label: "Shift guard", value: "n < width &&", sub: "Check before shift" },
          { label: "32-bit mask", value: "UINT32_C(1)", sub: "Portable across targets" }
        ],
        legend: ["Promotion / UB", "&& range guard", "Safe C17 pattern"],
        quiz: [
          {
            prompt: "In C17 on a 32-bit int/unsigned int target, which expression is Undefined Behavior (UB)?",
            options: ["1U << 31U", "1U << 32U", "(uint8_t)~(unsigned int)0x0FU"],
            explain: "Shifting by the width or more of the left operand (32 bits for unsigned int) is UB in C17. 1U << 31U is well-defined (0x80000000U)."
          }
        ]
      },
      {
        title: "From RAM to real MCUs: W1C, BSRR, ISR races & sensor decoding",
        body:
          "A single line `GPIOA->ODR |= mask` compiles into a multi-instruction **Read → Modify → Write** sequence. If an ISR fires between `main`’s read and write, the flag set by the ISR gets overwritten and lost — `volatile` does **not** make `|=` atomic! On STM32, use `BSRR` for single-write atomic set (`0..15`) and reset (`16..31`), and check the Reference Manual for **Write-1-to-Clear (W1C)** status bits. When decoding sensor frames (12-bit ADC or signed 11-bit LM75A temperature), combine bytes numerically via mask & shift so the code is endian-independent.",
        codeLang: "C17 · atomic BSRR, 12-bit ADC decode & portable sign-extend",
        callout: {
          text: "volatile only prevents the compiler from optimizing away reads/writes; it provides neither locking nor atomicity. On W1C registers, |= mask accidentally clears other active flags!"
        },
        diff: [
          "decode_adc(0xA3, 0x5C) strips status nibble 0xA → returns 0x035C = 860 on any CPU.",
          "Never reinterpret big-endian UART/I2C sensor bytes by casting raw memory pointers."
        ],
        kpis: [
          { label: "BSRR Set / Reset", value: "1<<n / 1<<(n+16)", sub: "Atomic single write" },
          { label: "12-bit ADC", value: "0xA3, 0x5C → 860", sub: "Strip status nibble" },
          { label: "11-bit sign-ext", value: "u - 2048", sub: "Portable C17 math" }
        ],
        legend: ["RMW / ISR hazard", "Atomic BSRR write", "Sensor frame decode"],
        openQuestions: [
          {
            prompt: "Someone claims: \"Because the register is volatile, reg |= mask is guaranteed atomic when main and an ISR both update it.\" Is this true or false? Explain how a flag can be lost and how STM32 BSRR solves it.",
            hint: "Break reg |= mask into Read → Modify → Write and interleave an ISR between Read and Write."
          }
        ]
      },
      {
        title: "Lab · assert self-checks, 4 core exercises & mini-projects",
        body:
          "Run `05_bitwise_self_check.c` on Ubuntu WSL with `-std=c17 -Wall -Wextra -Wpedantic -Werror` to confirm all fundamentals. Next, complete the **4 core C exercises (80 pts)** from `08_practice_exercises.md` in `submission.c` with `assert` checks: (1) `set/clear/toggle/test_bit` rejecting `bit >= 8`, (2) `should_sample(flags)` sensor gating, (3) `configure_mode(reg, pin, mode)` for 16 two-bit GPIO pins, and (4) 12-bit `decode_adc(high, low)`. Then level up to `09_embedded_mini_projects.md`: `struct` GPIO driver + BSRR, LM75A temperature sensor, shift-register button debounce, and UART CRC-8 framing.",
        codeLang: "C17 · assert test harness (08_practice_exercises.md)",
        callout: {
          text: "Keep assert active when compiling (never pass -DNDEBUG). Test boundary cases (bits 0, 7, 8, 32; pins 0, 15, 16; modes 0..4) and assert that bits outside the mask never change."
        },
        diff: [
          "Core 100-pt set: 10 theory questions (07_theory_questions.md) + 4 C exercises (08_practice_exercises.md).",
          "Advanced 100-pt set: 09_embedded_mini_projects.md (GPIO struct/BSRR, LM75A, shift-reg debounce, UART CRC-8)."
        ],
        kpis: [
          { label: "Theory", value: "10 Qs · 20 pts", sub: "07_theory_questions.md" },
          { label: "Core C Lab", value: "4 ex · 80 pts", sub: "08_practice_exercises.md" },
          { label: "Mini-projects", value: "4 ex · 100 pts", sub: "BSRR, LM75A, CRC-8" }
        ],
        legend: ["Spec & Mask", "C17 Expression", "assert Verification"],
        quiz: [
          {
            prompt: "Starting from reg = 0x24U, after reg |= (1U << 0U); reg &= ~(1U << 5U); reg ^= (1U << 2U); what is the final value of reg?",
            options: ["0x01U", "0x05U", "0x21U"],
            explain: "0x24 (0010 0100) → Set b0: 0x25 → Clear b5: 0x05 → Toggle b2: 0x01."
          },
          {
            prompt: "decode_adc(0xA3U, 0x5CU) strips the upper 4 status bits of high and combines the 12 data bits. What decimal value does it return?",
            options: ["860", "2620", "163"],
            explain: "(0xA3 & 0x0F) = 0x03; (0x03 << 8) | 0x5C = 0x035C = 3 × 256 + 92 = 860."
          }
        ]
      }
    ]
  },
  "b03-pointers-mmio": {
    title: "Functions, arrays & pointers",
    subtitle: "Track objects, addresses, and lengths as you pass a buffer to a C function.",
    steps: [
      {
        title: "Functions receive a copy of each argument",
        body: "C passes arguments by value. When the argument is &flag, the function receives a copy of the address. Writing through *dst changes the object that the pointer points to.",
        codeLang: "C · pass an address",
        code: "void enable(unsigned *dst) {\n    *dst |= 1u;\n}\n// In main:\n// unsigned flag = 0;\n// enable(&flag);",
        nodes: [["flag", "value is 0"], ["dst", "contains the address &flag"], ["*dst", "changes flag to 1"]],
        callout: { text: "Dereference only valid pointers to objects whose lifetime has begun and has yet to end. The enable function requires dst to point to a writable unsigned object." },
        diff: ["If enable takes an unsigned value and changes that parameter, the caller’s flag stays at 0."]
      },
      {
        title: "Array length is part of the function contract",
        body: "In a parameter declaration, C adjusts const uint16_t samples[] to a pointer type. The function needs n to know how many elements it can access. The const qualifier prevents writes through this pointer.",
        codeLang: "C · find the largest sample",
        nodes: [["Buffer", "{100, 740, 690}"], ["Pointer + n", "first address, n = 3"], ["peak", "740"]],
        callout: { text: "The caller must provide at least n valid elements. In this example, the function returns 0 when n is zero." },
        diff: ["Use <stdint.h> and <stddef.h>.", "peak(NULL, 0) returns 0 because the loop makes no memory reads."]
      },
      {
        title: "Lab · process an ADC buffer",
        body: "Write a function that counts samples at or above a threshold. Pass a pointer, a length, and the threshold. Use const for the input data, then test an empty buffer and part of a buffer.",
        codeLang: "C · lab function signature",
        nodes: [["Samples", "600, 700, 800"], ["Threshold", "700"], ["Result", "2 matching samples"]],
        callout: { text: "Pass samples + 1 with n = 1 to check that the function respects the range the caller supplies." },
        diff: ["{600, 700, 800}, n = 3, threshold = 700 → 2.", "Same array, n = 1 → 0.", "samples + 1, n = 1 → 1. NULL, n = 0 → 0."],
        quiz: [{
          prompt: "What does sizeof(samples) measure inside a function whose parameter is const uint16_t *samples?",
          options: ["Number of elements", "Size of the pointer", "Size of the entire array in bytes"],
          explain: "The samples parameter has pointer type. The caller passes n separately."
        }]
      }
    ]
  },
  "b04-struct-union": {
    title: "Structs, padding & packets",
    subtitle: "Group related data in RAM and specify the byte order for UART transmission.",
    steps: [
      {
        title: "A struct describes data inside a program",
        body: "The compiler may insert padding between or after members to meet alignment requirements. Use sizeof and offsetof to inspect the actual layout on the target you are compiling for.",
        codeLang: "C · inspect the layout",
        code: "struct Sample {\n    uint8_t kind;\n    uint16_t raw;\n};\n// Use <stddef.h> for offsetof.\n// Measure sizeof(struct Sample) and offsetof(struct Sample, raw).",
        nodes: [["kind", "1 byte"], ["Padding", "ABI determines size"], ["raw", "2 bytes"]],
        callout: { text: "Alignment rules depend on the target. Two members that total three bytes can produce a four-byte struct." },
        diff: ["Print sizeof and offsetof results with %zu.", "Union members share storage. A struct allocates space for each member."]
      },
      {
        title: "Write each byte in protocol order",
        body: "The sample protocol specifies three bytes in order. Write the kind first, then the high byte, and then the low byte. Shift right to extract the high byte, and cast to uint8_t to keep the low eight bits for the final byte.",
        codeLang: "C · encode a frame",
        nodes: [["kind", "0x01"], ["raw", "0x1234"], ["UART", "01 12 34"]],
        callout: { text: "The caller must provide space for at least three bytes. The function specifies the transmission order independently of target endianness and struct padding." },
        diff: ["raw = 0x00FF → 00 FF.", "raw = 0xFF00 → FF 00."]
      },
      {
        title: "Lab · receive a three-byte UART packet",
        body: "Write a decoder that takes const uint8_t *in and size_t n. Return false if n differs from 3 or either pointer is NULL. On success, combine the high and low bytes and store the result in a struct Sample.",
        codeLang: "C · lab function signature",
        code: "bool decode(const uint8_t *in, size_t n, struct Sample *out);\n// Hint: raw = (uint16_t)(((uint32_t)in[1] << 8) | in[2]);",
        nodes: [["Input packet", "01 12 34"], ["Length", "3 bytes"], ["Result", "kind=1, raw=0x1234"]],
        callout: { text: "Check n before reading in[1] and in[2]. Then try encoding a sample and decoding the resulting bytes." },
        diff: ["01 12 34 → true, kind = 1, raw = 0x1234.", "2-byte or 4-byte packet → false. Valid packet with a NULL pointer → false."],
        quiz: [{
          prompt: "Why can sending the struct Sample directly produce an invalid frame?",
          options: ["UART accepts only characters", "Padding and byte order can differ from the protocol", "uint16_t always takes four bytes"],
          explain: "The protocol defines where the bytes go and in what order. The ABI and compiler determine the struct layout."
        }]
      }
    ]
  },
  "b05-volatile-storage": {
    title: "Variable lifetime, volatile & superloops",
    subtitle: "Distinguish variable lifetime across calls, peripheral access, and nonblocking timing.",
    steps: [
      {
        title: "A local static variable keeps its value between calls",
        body: "Scope determines where you can use a name. Lifetime determines when the object exists. Here, ticks has function-local scope and exists throughout program execution.",
        codeLang: "C · count function calls",
        nodes: [["First call", "1"], ["Second call", "2"], ["Third call", "3"]],
        callout: { text: "The variable’s physical location depends on the tools and linker configuration. Check the linker map file to find the object." },
        diff: ["Replace static unsigned ticks; with unsigned ticks = 0; and every call returns 1."]
      },
      {
        title: "Volatile and peripheral registers",
        body: "Read the status register again on each iteration because hardware can change it. When the manufacturer qualifies the register type with volatile, the compiler must perform accesses according to the implementation’s volatile rules.",
        codeLang: "C · check the register once",
        nodes: [["Peripheral", "updates status"], ["CPU", "reads *status"], ["Firmware", "checks bit 0"]],
        callout: { text: "Use a separate synchronization mechanism when an operation needs atomicity. When moving to hardware, use the register definitions from the MCU header." },
        diff: ["Test the function on a PC with a volatile uint32_t object in RAM. On hardware, use the address specified by the MCU."]
      },
      {
        title: "Lab · toggle an LED on a tick without blocking",
        body: "Simulate a 32-bit tick counter that advances once per millisecond. Use modular subtraction to check whether 100 ms have elapsed since the last update, then toggle the LED and update last. Call the function once for each sample tick.",
        codeLang: "C · lab timing calculation",
        code: "uint32_t elapsed = (uint32_t)(now - last);\n// Update the LED when elapsed >= 100. Handle the button on the next iteration.",
        nodes: [["last", "UINT32_MAX − 49"], ["now", "50"], ["elapsed", "100 ms"]],
        callout: { text: "Modular subtraction gives the correct elapsed time if the actual interval is shorter than one full counter cycle." },
        diff: [
          "last=0: now=99 → hold, now=100 → toggle.",
          "last=UINT32_MAX−49: now=49 → hold, now=50 → toggle.",
          "After toggling at now=100, calling again with now=100 leaves the LED unchanged."
        ],
        quiz: [{
          prompt: "Does volatile make count++ atomic across two execution contexts?",
          options: ["Yes", "No"],
          explain: "count++ reads, calculates, and writes. Use a synchronization mechanism suited to the execution contexts."
        }]
      }
    ]
  }
};
