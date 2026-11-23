export const EN_MEMORY = {
  "b01-memory-types": {
    title: "MCU Memory & Data Types",
    subtitle: "See how C variables are stored in Flash or SRAM, why fixed-width types such as uint8_t matter, and how wraparound, two’s complement, little-endian byte order, and hardware registers work.",
    youllLearn: [
      "Distinguish three STM32 address regions: Flash, SRAM, and peripheral registers",
      "Avoid int size pitfalls with fixed-width types from <stdint.h> (uint8_t through uint32_t)",
      "Read a linker map to locate constants and variables",
      "Understand integer wraparound and two’s complement in the ALU",
      "Recognize little-endian byte order in RAM and when sending UART or CAN frames"
    ],
    steps: [
      {
        title: "From C on a PC to an STM32 chip",
        body: "A PC operating system can give a program gigabytes of virtual memory. On a microcontroller such as the STM32F103, bare-metal code runs directly on the chip with 64 KB of Flash for instructions and 20 KB of SRAM for working data. The AHB and APB buses connect the CPU to the Flash, SRAM, and peripheral address regions.",
        code: `// STM32F103C8T6: 64 KB Flash | 20 KB SRAM
int main(void) {
    // Check the linker map to see how much SRAM the data uses.
    while (1) {
        // The superloop runs indefinitely.
    }
}`,
        callout: { text: "The microcontroller uses a flat 32-bit address space (0x0000_0000 to 0xFFFF_FFFF). Flash begins at 0x0800_0000, SRAM at 0x2000_0000, and peripherals at 0x4000_0000." },
        diff: ["Flash (0x0800_0000): 64 KB for code and constants", "SRAM (0x2000_0000): 20 KB for variables and the stack", "Bus matrix: connects the Cortex-M CPU to memory and peripherals"],
        kpis: [{}, {}, { label: "Architecture" }, { label: "Operating system", sub: "No OS" }],
        legend: ["Instruction fetch", "Data read/write", "Peripheral signals"]
      },
      {
        title: "The int size trap: 16 or 32 bits?",
        body: "The range of int depends on the compiler and target. With avr-gcc on AVR, int is 16 bits and has a maximum of 32,767. With Arm GCC on STM32, int is 32 bits. Assigning 40000 to a 16-bit int exceeds its range. C17 makes this conversion to a signed type implementation-defined.",
        code: `// WARNING: int width depends on the compiler and target.
int adc_mv = 40000;

// Arm GCC on STM32: adc_mv = 40000
// avr-gcc with 16-bit int: a typical result is -25536`,
        callout: { text: "Check INT_MIN and INT_MAX in <limits.h>. When a register or protocol specifies a particular width, use the matching type from <stdint.h> and serialize each byte in the order the protocol requires." },
        diff: ["8-bit AVR target: sizeof(int) = 2 bytes (-32768..32767)", "40000 exceeds the 16-bit int range. The example result on avr-gcc is -25536.", "32-bit STM32 target: sizeof(int) = 4 bytes"],
        kpis: [
          { label: "Original value" },
          { label: "avr-gcc with 16-bit int", sub: "Conversion result" },
          { label: "STM32 (4 bytes)", sub: "Value preserved" },
          { label: "Portability", value: "LOW", sub: "Depends on the MCU" }
        ],
        legend: ["Valid value", "Overflow or sign error"]
      },
      {
        title: "Use fixed-width types from <stdint.h>",
        body: "The standard header <stdint.h> defines exact-width types such as uint8_t (1 byte, 0 to 255), uint16_t (2 bytes, 0 to 65,535), and uint32_t (4 bytes), plus their signed counterparts int8_t, int16_t, and int32_t. These types give you consistent integer widths across targets that provide them and help you use SRAM efficiently.",
        code: `#include <stdint.h>

uint8_t  led_bright = 250;     // 1 byte (0 .. 255)
int16_t  temp_x10   = -125;    // 2 bytes (-12.5 °C)
uint32_t baudrate   = 115200U; // 4 bytes (0 .. 4.29 billion)
// The three objects total 7 bytes, compared with 12 bytes for three 32-bit ints.`,
        callout: { text: "In embedded projects and interviews, including STM32 and automotive work, use <stdint.h> when you need to control the exact width of an integer." },
        diff: ["#include <stdint.h>", "uint8_t  (1B) @ 0x2000_0000", "int16_t  (2B) @ 0x2000_0002", "42% less storage for the objects than with three 32-bit ints"],
        kpis: [{}, {}, {}, { label: "Object sizes", sub: "Down from 12 bytes" }]
      },
      {
        title: "Where variables live: Flash (.rodata) and SRAM (.data / .bss)",
        body: "In a typical STM32 memory layout, startup code copies the initial .data values from Flash to SRAM and zero-fills .bss before main(). The const qualifier restricts writes to the object. The compiler and linker script determine where a lookup table is placed.",
        code: `#include <stdint.h>

// Two file-scope declarations. The remaining elements are zero-initialized.
uint8_t font_ram[256] = { 0x3E, 0x51, 0x49 };
const uint8_t font_rom[256] = { 0x3E, 0x51, 0x49 };

uint32_t rx_count; // C guarantees a value of zero before program startup.`,
        callout: { text: "Use const for a read-only lookup table. Check the linker map to confirm the build kept the table and see whether it lives in Flash or SRAM." },
        diff: ["Flash .text + .rodata: stores machine code and const font_rom[256]", "SRAM .data: startup copies the initial values of nonzero-initialized variables", "SRAM .bss: startup zero-fills this section before main()", "Placing the 256-byte table in Flash saves 256 bytes of SRAM in this example."],
        kpis: [
          { sub: "Retained without power" },
          { sub: "Copied at startup" },
          { sub: "Zero-filled at startup" },
          { label: "SRAM saved", sub: "When the table is in Flash" }
        ],
        legend: ["Startup copy (Flash → SRAM)", "Read directly from Flash", "Zero-fill .bss"]
      },
      {
        title: "Why does uint8_t wrap to 0 after 255?",
        body: "With `uint8_t tick = 255;`, the increment follows the integer promotion rules. The calculation takes place in `int` and produces 256. Storing the result back in `uint8_t` reduces it modulo 256, so `tick` becomes 0. The diagram shows the bits of 256 before conversion.",
        code: `uint8_t tick = 255; // 0xFF
tick++;             // Addition in int: 255 + 1 = 256
// Store in uint8_t: 256 % 256 = 0

// Infinite loop trap:
// for (uint8_t i = 0; i <= 255; i++) { ... } // i is always <= 255!`,
        callout: { text: "In `for (uint8_t i = 0; i <= 255; i++)`, every possible value of i meets the condition. The loop runs indefinitely unless the body exits. Use `unsigned int` for the counter to iterate from 0 through 255." },
        diff: ["Promote tick from uint8_t to int before adding", "The sum in int is 256 (0x100)", "Convert back to uint8_t modulo 256 to get 0"],
        kpis: [{ label: "Before tick++" }, { label: "Sum in int" }, { label: "Stored in uint8_t" }, { label: "Behavior" }],
        legend: ["Bits that fit (8 bits)", "Bit 8 of the sum, beyond the uint8_t range"]
      },
      {
        title: "Negative numbers in hardware: two’s complement",
        body: "The `int8_t` type uses **two’s complement**. To find the bit pattern for −5, invert the eight bits of 5 and add 1 to get 0xFB. The highest bit has a weight of −128, and the other bits have positive weights. The diagram illustrates 8-bit binary addition. In the C expression `a + b`, both operands are promoted to `int` before addition.",
        code: `int8_t a = 10;   // 0b0000_1010 (0x0A)
int8_t b = -5;   // Invert the bits of 5 (1111_1010) and add 1: 0b1111_1011 (0xFB)

// Check the bit weights: -128 + 64 + 32 + 16 + 8 + 0 + 2 + 1 = -5
int8_t sum = a + b;
// Addition in int: 10 + (-5) = 5, which fits in int8_t.`,
        callout: { text: "The range of `int8_t` is `-128 .. +127`. Zero leaves room for one more negative value than positive values. For the 8-bit pattern of a negative x, calculate `256 - |x|`." },
        diff: ["Sign bit (MSB, bit 7): weight −2⁷ = −128", "The bit pattern 0xFB represents 251 in uint8_t and −5 in int8_t", "In 8 bits, the ALU computes 0x0A + 0xFB = 0x05 using addition"],
        kpis: [{}, {}, { sub: "Negative sign-bit weight" }, { label: "Sum a + b" }],
        legend: ["Sign bit (MSB)", "Bits with positive weights"]
      },
      {
        title: "Byte order in RAM: little-endian on STM32",
        body: "On STM32, each SRAM address corresponds to one 8-bit byte. STM32 uses **little-endian** order, so for `uint32_t magic = 0x12345678;`, the least significant byte (0x78) sits at the variable’s lowest address. The diagram uses 0x20000000 as the example address.",
        code: `uint32_t magic = 0x12345678; // Assume address 0x20000000.
const unsigned char *p = (const unsigned char *)&magic;

// Inspect each byte in SRAM:
// p[0] @ 0x2000_0000 == 0x78  (least significant byte)
// p[1] @ 0x2000_0001 == 0x56
// p[2] @ 0x2000_0002 == 0x34
// p[3] @ 0x2000_0003 == 0x12  (most significant byte)`,
        callout: { text: "In the debugger, inspect individual bytes in ascending address order to see how they’re stored in RAM. In a 32-bit word view, the debugger may combine them into the value 0x12345678." },
        diff: ["0x2000_0000 ← 0x78 (least significant byte)", "0x2000_0001 ← 0x56", "0x2000_0002 ← 0x34", "0x2000_0003 ← 0x12 (most significant byte)"],
        kpis: [
          { label: "32-bit value", sub: "In the CPU register" },
          { label: "Byte order", sub: "STM32 default" },
          { label: "At 0x2000_0000", sub: "Least significant byte" },
          { label: "At 0x2000_0003", sub: "Most significant byte" }
        ],
        legend: ["Least significant byte (0x78)", "Middle bytes (0x56, 0x34)", "Most significant byte (0x12)"]
      },
      {
        title: "Byte order mismatch over UART or CAN",
        body: "Suppose a sensor gives you `uint16_t mv = 1000` (`0x03E8`) and you cast its address to send its two bytes over UART or CAN. The little-endian STM32 sends `0xE8` first, then `0x03`. A receiver expecting big-endian network byte order decodes the bytes as `0xE803 = 59,395 mV`, about 59 times the actual value.",
        code: `uint16_t mv = 1000; // 0x03E8 -> RAM: [0xE8, 0x03]

// BUG: Send the raw bytes from RAM. The UART sends 0xE8, then 0x03.
// uart_send_bytes((uint8_t*)&mv, 2); // The receiver reads 0xE803 = 59395!

// FIX: Split the bytes with shifts so the MCU's byte order is irrelevant.
uint8_t tx_buf[2];
tx_buf[0] = (mv >> 8) & 0xFF; // 0x03 (high byte first, big-endian)
tx_buf[1] =  mv       & 0xFF; // 0xE8 (low byte second)`,
        callout: { text: "Protocols such as Modbus and TCP/IP use big-endian order for multibyte fields. Automotive CAN frames follow the byte order defined for each signal. Encode each field in the required byte order before transmitting a multibyte struct." },
        diff: ["Send raw RAM bytes [E8, 03] → receiver reads 0xE803 (59,395 mV)", "Extract the high byte with (mv >> 8) & 0xFF → wire order [03, E8]", "The receiver recovers the correct value: 1,000 mV"],
        kpis: [
          { label: "Actual reading" },
          { label: "Raw UART bytes", sub: "Little-endian memory order" },
          { label: "Incorrect reading", sub: "0xE803 (about 59× too high)" },
          { label: "Explicit byte order", sub: "Independent of MCU byte order" }
        ],
        legend: ["Raw bytes in the wrong order", "Correct big-endian frame"]
      },
      {
        title: "Memory maps and peripheral registers (memory-mapped I/O)",
        body: "On the STM32F103, GPIOA_ODR is at address 0x4001080C. When the GPIOA clock is enabled, PA5 is configured as a push-pull output, and an active-high LED is wired with a resistor, setting bit 5 in ODR drives PA5 high. The diagram assumes bit 5 starts at 0.",
        code: `#include <stdint.h>

// Port A output data register address (STM32F103 reference manual)
#define GPIOA_ODR_ADDR  (0x4001080CU)
#define GPIOA_ODR       (*(volatile uint32_t *)GPIOA_ODR_ADDR)

void turn_on_led_pa5(void) {
    // Assumes the GPIOA clock is enabled and PA5 is a push-pull output.
    GPIOA_ODR |= (1U << 5);
}`,
        callout: { text: "Reading or writing a register address accesses hardware as specified in the MCU documentation. The |= operator performs a read-modify-write. The STM32F103 also has BSRR, which sets or clears GPIO bits with one write." },
        diff: ["The address decoder identifies the peripheral region (0x4001_080C)", "Bit 5 of GPIOA_ODR: 0 → 1", "Physical pin PA5: 0 V → 3.3 V (LED lights up)"],
        kpis: [
          { label: "Register address" },
          { label: "Bit mask" },
          { label: "PA5 pin voltage", sub: "Logic high" },
          { label: "LED state", value: "ON" }
        ],
        legend: ["APB2 bus write", "Current through the PA5 LED"]
      },
      {
        title: "Memory recap and quick quiz",
        body: "Review three things before the lab: where the linker script places a lookup table, which byte sits at the lowest address on a little-endian machine, and the range of an integer type.",
        code: `// Choose types with the range and width you need.
// Read the linker map to locate the lookup table.
// Encode each byte in the order specified by the protocol.
// Look up register addresses and access rules in the MCU documentation.`,
        callout: { label: "UP NEXT", text: "In the lab, practice writing bytes in a specific order and see what happens when a uint8_t calculation crosses 255." },
        diff: ["Check the range before converting to another type.", "Verify assumptions with the linker map and by inspecting individual bytes."],
        kpis: [
          { sub: "Memory map covered" },
          { label: "Data types", sub: "Fixed-width types" },
          { label: "ARM byte order", sub: "Least significant byte at the lowest address" },
          { label: "Up next", value: "Lab", sub: "Inspect bytes on a PC" }
        ],
        legend: ["Concepts covered"],
        quiz: [
          {
            prompt: "Question 1: If the linker script puts .rodata in Flash and a file-scope const lookup table goes into .rodata, where does the table reside?",
            options: ["A. SRAM (.data)", "B. Flash (.rodata)", "C. SRAM (.bss)", "D. Peripheral registers"],
            explain: "The linker script places the table in Flash for this build. Check its address in the linker map."
          },
          {
            prompt: "Question 2: On a little-endian ARM Cortex-M, `uint32_t x = 0xAABBCCDD;` is stored at 0x2000_0000. What is the byte at 0x2000_0000?",
            explain: "Little-endian order stores the least significant byte (0xDD) at the lowest address (0x2000_0000)."
          },
          {
            prompt: "Question 3: What is the result of `uint8_t a = 250; a += 10;`?",
            explain: "The addition produces 260 in int. Storing it in uint8_t reduces it modulo 256, giving 4."
          }
        ]
      },
      {
        title: "Lab · split bytes before sending",
        body: "Write a function that stores a uint16_t value in a two-byte array with the low byte first. Then add 10 to a uint8_t starting at 250 and explain why the result is 4.",
        codeLang: "C · exercise signature",
        nodes: [["Value", "0x1234"], ["bytes[0]", "0x34"], ["bytes[1]", "0x12"]],
        callout: { label: "REMEMBER", text: "Use shifts and casts to write bytes in the order required by the protocol." },
        diff: ["0x0000 → 00 00.", "0x1234 → 34 12.", "0xFFFF → FF FF."]
      }
    ]
  }
};
