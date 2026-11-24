export function createBaseCourse() {
  return {
  modules: [
    {
      id: "mod-01",
      title: "01. C Nhúng Cốt Lõi",
      color: "#84be88",
      lessons: [
        {
          id: "b01-memory-types",
          number: "01",
          title: "Bộ nhớ MCU & Kiểu dữ liệu",
          duration: "15 phút",
          level: "Cơ bản",
          subtitle:
            "Hiểu cách biến C nằm trong Flash/SRAM, tại sao phải dùng uint8_t, tràn số, bù 2, Little-Endian và thanh ghi phần cứng.",
          locked: false,
          youllLearn: [
            "Phân biệt 3 vùng nhớ trên STM32: Flash, SRAM và Thanh ghi Ngoại vi",
            "Tránh bẫy kích thước kiểu int bằng chuẩn <stdint.h> (uint8_t..uint32_t)",
            "Đọc linker map để biết hằng số và biến nằm ở đâu",
            "Hiểu cơ chế tràn số (wrap-around) và số âm mã bù 2 trong ALU",
            "Nắm thứ tự byte Little-Endian khi đọc RAM hoặc gửi khung UART/CAN"
          ],
          steps: [
            {
              id: "s1",
              badge: "SETUP",
              title: "Từ code C trên PC xuống con chip STM32",
              body:
                "Trên PC, hệ điều hành cấp cho bạn hàng GB RAM ảo. Trên vi điều khiển (như STM32F103), không có Windows/Linux: code chạy trực tiếp trên silicon với 64 KB Flash (lưu mã lệnh) và chỉ 20 KB SRAM (lưu biến tạm). Mọi thao tác đều đi qua Bus AHB/APB nối CPU với 3 vùng địa chỉ: Flash, SRAM và Ngoại vi.",
              codeLang: "main.c (STM32 Bare-metal)",
              code: `// STM32F103C8T6: 64 KB Flash | 20 KB SRAM
int main(void) {
    // Xem linker map để kiểm tra dung lượng SRAM dùng cho dữ liệu.
    while (1) {
        // Vòng lặp siêu tốc độ (Super-loop) chạy vĩnh viễn
    }
}`,
              callout: {
                type: "key-idea",
                label: "CẦN NHỚ",
                text: "Vi điều khiển dùng kiến trúc không gian địa chỉ phẳng 32-bit (0x0000_0000 → 0xFFFF_FFFF): Flash bắt đầu từ 0x0800_0000, SRAM từ 0x2000_0000, Ngoại vi từ 0x4000_0000."
              },
              diff: [
                { op: "+", text: "Flash (0x0800_0000): 64 KB lưu code & hằng số" },
                { op: "+", text: "SRAM (0x2000_0000): 20 KB lưu biến & Stack" },
                { op: "+", text: "Bus Matrix: nối CPU Cortex-M tới bộ nhớ & ngoại vi" }
              ],
              kpis: [
                { label: "Flash (ROM)", value: "64 KB", sub: "0x0800_0000", tone: "lavender" },
                { label: "SRAM", value: "20 KB", sub: "0x2000_0000", tone: "sage" },
                { label: "Kiến trúc", value: "32-bit", sub: "ARM Cortex-M", tone: "" },
                { label: "Hệ điều hành", value: "Bare-metal", sub: "Không có OS", tone: "amber" }
              ],
              legend: [
                { label: "Nạp lệnh (Instruction)", color: "#d9c8f0" },
                { label: "Đọc/ghi dữ liệu (Data)", color: "#84be88" },
                { label: "Tín hiệu ngoại vi", color: "#f5d88b" }
              ],
              learnUnlock: [0],
              scene: { type: "mcu_overview" }
            },
            {
              id: "s2",
              badge: "PROBLEM",
              title: "Bẫy kiểu int: 16-bit hay 32-bit?",
              body:
                "Miền giá trị của int tùy trình biên dịch. Trên AVR với avr-gcc, int có 16 bit, tối đa 32.767. Trên STM32 với Arm GCC, int có 32 bit. Khi gán 40000 cho int 16 bit, giá trị vượt miền int. Theo C17, phép chuyển sang kiểu có dấu trong trường hợp này phụ thuộc vào triển khai.",
              codeLang: "bug_int_size.c",
              code: `// NGUY HIỂM: Kích thước phụ thuộc trình biên dịch!
int adc_mv = 40000;

// Arm GCC trên STM32: adc_mv = 40000
// avr-gcc với int 16 bit: kết quả thường thấy là -25536`,
              callout: {
                type: "watch-out",
                label: "LƯU Ý",
                text: "Kiểm tra INT_MIN và INT_MAX trong <limits.h>. Khi thanh ghi hoặc giao thức quy định độ rộng cụ thể, dùng kiểu phù hợp trong <stdint.h> và tuần tự hóa từng byte theo giao thức."
              },
              diff: [
                { op: "~", text: "Target AVR 8-bit: sizeof(int) = 2 bytes (-32768..32767)" },
                { op: "-", text: "40000 vượt miền int 16 bit. Kết quả minh họa trên avr-gcc là -25536." },
                { op: "+", text: "Target STM32 32-bit: sizeof(int) = 4 bytes" }
              ],
              kpis: [
                { label: "Giá trị gốc", value: "40,000", sub: "0x9C40 (16-bit)", tone: "" },
                { label: "avr-gcc với int 16 bit", value: "-25,536", sub: "Kết quả chuyển kiểu", tone: "rose" },
                { label: "Trên STM32 (4B)", value: "40,000", sub: "Chạy đúng", tone: "sage" },
                { label: "Tính khả chuyển", value: "THẤP", sub: "Phụ thuộc MCU", tone: "rose" }
              ],
              legend: [
                { label: "Dữ liệu hợp lệ", color: "#84be88" },
                { label: "Tràn bit / Sai dấu", color: "#e57373" }
              ],
              learnUnlock: [],
              scene: { type: "int_trap" }
            },
            {
              id: "s3",
              badge: "TECHNIQUE",
              title: "Chuẩn hóa kích thước bằng <stdint.h>",
              body:
                "Thư viện chuẩn <stdint.h> định nghĩa các kiểu cố định độ rộng bit: uint8_t (1 byte, 0..255), uint16_t (2 byte, 0..65,535), uint32_t (4 byte) và bản có dấu int8_t, int16_t, int32_t. Nhờ vậy code chạy giống hệt nhau trên mọi chip, đồng thời tiết kiệm tối đa từng byte SRAM.",
              codeLang: "stdint_demo.c",
              code: `#include <stdint.h>

uint8_t  led_bright = 250;     // 1 byte (0 .. 255)
int16_t  temp_x10   = -125;    // 2 byte (-12.5 °C)
uint32_t baudrate   = 115200U; // 4 byte (0 .. 4.29 tỷ)
// Tổng SRAM chỉ tốn: 1 + 2 + 4 = 7 bytes (thay vì 12 bytes dùng int)`,
              callout: {
                type: "key-idea",
                label: "CẦN NHỚ",
                text: "Trong phỏng vấn và dự án thực tế (Rikkei / Automotive / STM32), dùng <stdint.h> là chuẩn mực bắt buộc để kiểm soát chính xác từng bit bộ nhớ."
              },
              diff: [
                { op: "+", text: "#include <stdint.h>" },
                { op: "+", text: "uint8_t  (1B) @ 0x2000_0000" },
                { op: "+", text: "int16_t  (2B) @ 0x2000_0002" },
                { op: "~", text: "Tiết kiệm 42% SRAM so với khai báo 3 biến int" }
              ],
              kpis: [
                { label: "uint8_t", value: "1 Byte", sub: "0 .. 255", tone: "sage" },
                { label: "uint16_t", value: "2 Bytes", sub: "0 .. 65,535", tone: "amber" },
                { label: "uint32_t", value: "4 Bytes", sub: "0 .. 4.29×10⁹", tone: "lavender" },
                { label: "SRAM tiêu tốn", value: "7 Bytes", sub: "Giảm từ 12 Bytes", tone: "sage" }
              ],
              legend: [
                { label: "1-byte (uint8_t)", color: "#84be88" },
                { label: "2-byte (int16_t)", color: "#f5d88b" },
                { label: "4-byte (uint32_t)", color: "#d9c8f0" }
              ],
              learnUnlock: [1],
              scene: { type: "stdint_sram" }
            },
            {
              id: "s4",
              badge: "TECHNIQUE",
              title: "Biến nằm ở đâu? Flash (.rodata) vs. SRAM (.data / .bss)",
              body:
                "Trong bố trí STM32 thường gặp, startup chép giá trị ban đầu của .data từ Flash sang SRAM và đưa .bss về 0 trước main(). const hạn chế cách chương trình ghi vào đối tượng. Vị trí cụ thể của bảng tra do trình biên dịch và linker script quyết định.",
              codeLang: "memory_sections.c",
              code: `#include <stdint.h>

// Hai khai báo ở phạm vi tệp. Các phần tử còn lại bằng 0.
uint8_t font_ram[256] = { 0x3E, 0x51, 0x49 };
const uint8_t font_rom[256] = { 0x3E, 0x51, 0x49 };

uint32_t rx_count; // C bảo đảm giá trị 0 trước khi chương trình bắt đầu.`,
              callout: {
                type: "good-to-know",
                label: "KIẾN THỨC HAY",
                text: "Đặt const cho bảng tra chỉ đọc. Kiểm tra linker map để xác nhận bảng được giữ trong bản build và nằm ở Flash hay SRAM."
              },
              diff: [
                { op: "+", text: "Flash .text + .rodata: Lưu mã máy & const font_rom[256]" },
                { op: "+", text: "SRAM .data: Startup copy biến có giá trị đầu != 0" },
                { op: "+", text: "SRAM .bss: Startup xóa về 0 trước khi chạy main()" },
                { op: "-", text: "Bảng 256 byte ở Flash tránh dùng 256 byte SRAM trong bố trí minh họa." }
              ],
              kpis: [
                { label: ".text / .rodata", value: "Flash", sub: "Giữ khi mất điện", tone: "lavender" },
                { label: ".data", value: "Flash → SRAM", sub: "Copy khi khởi động", tone: "amber" },
                { label: ".bss", value: "SRAM = 0", sub: "Zero-init khi boot", tone: "sage" },
                { label: "SRAM tiết kiệm", value: "256 B", sub: "Khi bảng ở Flash", tone: "sage" }
              ],
              legend: [
                { label: "Startup copy (Flash → SRAM)", color: "#f5d88b" },
                { label: "Đọc trực tiếp từ Flash", color: "#d9c8f0" },
                { label: "Zero-fill .bss", color: "#84be88" }
              ],
              learnUnlock: [2],
              scene: { type: "flash_vs_sram" }
            },
            {
              id: "s5",
              badge: "PROBLEM",
              title: "Vì sao uint8_t quay về 0 sau 255?",
              body:
                "Với `uint8_t tick = 255;`, phép tăng dùng quy tắc nâng kiểu số nguyên (integer promotions). Cộng trong kiểu `int` cho 256. Khi lưu lại vào `uint8_t`, chuẩn C lấy giá trị theo modulo 256, nên `tick` trở về 0. Sơ đồ cho thấy các bit của 256 trước khi chuyển kiểu.",
              codeLang: "overflow_wrap.c",
              code: `uint8_t tick = 255; // 0xFF
tick++;             // Cộng trong int: 255 + 1 = 256
// Lưu vào uint8_t: 256 % 256 = 0

// Bẫy vòng lặp vô tận (Infinite loop):
// for (uint8_t i = 0; i <= 255; i++) { ... } // i luôn <= 255!`,
              callout: {
                type: "watch-out",
                label: "LƯU Ý",
                text: "Trong vòng lặp `for (uint8_t i = 0; i <= 255; i++)`, mọi giá trị của i đều thỏa điều kiện. Nếu thân vòng lặp không có lối thoát thì nó chạy mãi. Dùng `unsigned int` cho biến đếm nếu cần duyệt đủ 0 đến 255."
              },
              diff: [
                { op: "~", text: "Nâng tick từ uint8_t lên int trước khi cộng" },
                { op: "+", text: "Tổng trong int là 256 (0x100)" },
                { op: "-", text: "Chuyển về uint8_t theo modulo 256, còn 0" }
              ],
              kpis: [
                { label: "Trước tick++", value: "255", sub: "0b1111_1111 (0xFF)", tone: "amber" },
                { label: "Tổng trong int", value: "256", sub: "1_0000_0000", tone: "rose" },
                { label: "Lưu vào uint8_t", value: "0", sub: "0b0000_0000 (0x00)", tone: "rose" },
                { label: "Hành vi", value: "Wrap-around", sub: "Modulo 256", tone: "lavender" }
              ],
              legend: [
                { label: "Bit hợp lệ (8-bit)", color: "#84be88" },
                { label: "Bit 8 của tổng, ngoài miền uint8_t", color: "#e57373" }
              ],
              learnUnlock: [3],
              scene: { type: "overflow_alu" }
            },
            {
              id: "s6",
              badge: "TECHNIQUE",
              title: "Số âm trong phần cứng: Mã bù 2 (Two's Complement)",
              body:
                "Kiểu `int8_t` dùng biểu diễn **mã bù 2**. Để tìm mẫu bit của −5, đảo 8 bit của 5 rồi cộng 1, thu được 0xFB. Bit cao nhất mang trọng số −128, các bit còn lại mang trọng số dương. Sơ đồ minh họa phép cộng nhị phân 8 bit. Trong biểu thức C `a + b`, cả hai toán hạng được nâng lên `int` trước khi cộng.",
              codeLang: "twos_complement.c",
              code: `int8_t a = 10;   // 0b0000_1010 (0x0A)
int8_t b = -5;   // Đảo bit 5 (1111_1010) + 1 = 0b1111_1011 (0xFB)

// Kiểm tra ngược: -128 + 64 + 32 + 16 + 8 + 0 + 2 + 1 = -5
int8_t sum = a + b;
// Cộng trong int: 10 + (-5) = 5; lưu lại được vào int8_t`,
              callout: {
                type: "key-idea",
                label: "CẦN NHỚ",
                text: "Miền giá trị của `int8_t` là `-128 .. +127` (lệch về âm 1 số vì số 0 chiếm một tổ hợp dương). Muốn tính nhanh số âm: lấy `256 - |x|` (với 8-bit)."
              },
              diff: [
                { op: "+", text: "Bit dấu (MSB = bit 7): trọng số -2⁷ = -128" },
                { op: "~", text: "-5 ở dạng uint8_t là 251 (0xFB), ở int8_t là -5" },
                { op: "+", text: "ALU cộng 0x0A + 0xFB = 0x05 (không cần mạch trừ riêng)" }
              ],
              kpis: [
                { label: "int8_t a", value: "+10", sub: "0000_1010 (0x0A)", tone: "sage" },
                { label: "int8_t b", value: "-5", sub: "1111_1011 (0xFB)", tone: "amber" },
                { label: "MSB (Bit 7)", value: "-128", sub: "Bit dấu âm", tone: "lavender" },
                { label: "Tổng a + b", value: "+5", sub: "0000_0101 (0x05)", tone: "sage" }
              ],
              legend: [
                { label: "Bit dấu (Sign bit MSB)", color: "#d9c8f0" },
                { label: "Các bit trọng số dương", color: "#84be88" }
              ],
              learnUnlock: [3],
              scene: { type: "twos_complement" }
            },
            {
              id: "s7",
              badge: "TECHNIQUE",
              title: "Thứ tự byte trong RAM: Little-endian trên STM32",
              body:
                "Trên STM32, mỗi địa chỉ SRAM ứng với một byte 8 bit. STM32 dùng **little-endian**, nên `uint32_t magic = 0x12345678;` có byte trọng số thấp nhất (0x78) ở địa chỉ thấp nhất của biến. Sơ đồ lấy 0x20000000 làm địa chỉ ví dụ.",
              codeLang: "little_endian.c",
              code: `uint32_t magic = 0x12345678; // Giả sử địa chỉ 0x20000000
const unsigned char *p = (const unsigned char *)&magic;

// Xem từng ô nhớ trong SRAM:
// p[0] @ 0x2000_0000 == 0x78  (byte thấp)
// p[1] @ 0x2000_0001 == 0x56
// p[2] @ 0x2000_0002 == 0x34
// p[3] @ 0x2000_0003 == 0x12  (byte cao)`,
              callout: {
                type: "good-to-know",
                label: "KIẾN THỨC HAY",
                text: "Khi debug, xem từng byte theo địa chỉ tăng dần để thấy thứ tự trong RAM. Khi hiển thị theo từ 32 bit, trình debug có thể ghép chúng thành giá trị 0x12345678."
              },
              diff: [
                { op: "+", text: "0x2000_0000 ← 0x78 (byte thấp)" },
                { op: "+", text: "0x2000_0001 ← 0x56" },
                { op: "+", text: "0x2000_0002 ← 0x34" },
                { op: "+", text: "0x2000_0003 ← 0x12 (byte cao)" }
              ],
              kpis: [
                { label: "Giá trị 32-bit", value: "0x12345678", sub: "Trong thanh ghi CPU", tone: "lavender" },
                { label: "Kiểu xếp Byte", value: "Little-Endian", sub: "Mặc định STM32", tone: "sage" },
                { label: "Tại 0x2000_0000", value: "0x78", sub: "Byte trọng số thấp", tone: "amber" },
                { label: "Tại 0x2000_0003", value: "0x12", sub: "Byte trọng số cao", tone: "" }
              ],
              legend: [
                { label: "Byte thấp (0x78)", color: "#84be88" },
                { label: "Byte giữa (0x56, 0x34)", color: "#f5d88b" },
                { label: "Byte cao (0x12)", color: "#d9c8f0" }
              ],
              learnUnlock: [4],
              scene: { type: "little_endian" }
            },
            {
              id: "s8",
              badge: "PROBLEM",
              title: "Lệch khung truyền đa byte qua UART / CAN",
              body:
                "Bạn đọc cảm biến được `uint16_t mv = 1000` (`0x03E8`) rồi ép con trỏ gửi 2 byte thô qua UART/CAN. Do STM32 là Little-Endian, trên dây truyền byte `0xE8` đi trước, `0x03` đi sau. Thiết bị nhận dùng chuẩn Network (Big-Endian) ghép lại thành `0xE803 = 59,395 mV` — báo sai gấp 59 lần!",
              codeLang: "uart_endian_bug.c",
              code: `uint16_t mv = 1000; // 0x03E8 -> RAM: [0xE8, 0x03]

// LỖI: Gửi thô từ RAM -> dây UART nhận: 0xE8 rồi 0x03
// uart_send_bytes((uint8_t*)&mv, 2); // Bên nhận đọc ra 0xE803 = 59395!

// CÁCH ĐÚNG: Tự tách byte bằng dịch bit (Độc lập Endianness!)
uint8_t tx_buf[2];
tx_buf[0] = (mv >> 8) & 0xFF; // 0x03 (Byte cao đi trước - Big Endian)
tx_buf[1] =  mv       & 0xFF; // 0xE8 (Byte thấp đi sau)`,
              callout: {
                type: "watch-out",
                label: "LƯU Ý",
                text: "Các giao thức công nghiệp (Modbus, TCP/IP, nhiều frame CAN ô tô) thường dùng Big-Endian. Không bao giờ truyền trực tiếp byte thô của struct đa byte mà không chuẩn hóa Endian!"
              },
              diff: [
                { op: "-", text: "Gửi thô RAM [E8, 03] → Bên nhận đọc 0xE803 (59,395 mV)" },
                { op: "+", text: "Tách bit (mv >> 8) & 0xFF → Chuỗi chuẩn [03, E8]" },
                { op: "~", text: "Giá trị nhận khôi phục đúng: 1,000 mV" }
              ],
              kpis: [
                { label: "Dữ liệu thật", value: "1,000 mV", sub: "0x03E8", tone: "sage" },
                { label: "Dây UART (Thô)", value: "E8 → 03", sub: "Little-Endian leak", tone: "rose" },
                { label: "Bên nhận đọc (Lỗi)", value: "59,395 mV", sub: "0xE803 (Sai 59×!)", tone: "rose" },
                { label: "Chuẩn hóa dịch bit", value: "03 → E8", sub: "An toàn mọi MCU", tone: "sage" }
              ],
              legend: [
                { label: "Byte gửi thô bị đảo", color: "#e57373" },
                { label: "Khung Big-Endian chuẩn", color: "#84be88" }
              ],
              learnUnlock: [4],
              scene: { type: "endian_wire" }
            },
            {
              id: "s9",
              badge: "TECHNIQUE",
              title: "Bản đồ Bộ nhớ & Thanh ghi Ngoại vi (Memory-Mapped I/O)",
              body:
                "Trên STM32F103, GPIOA_ODR ở địa chỉ 0x4001080C. Nếu đã cấp clock cho GPIOA, cấu hình PA5 là đầu ra push-pull và đấu LED active-high với điện trở, đặt bit 5 của ODR đưa PA5 lên mức cao. Sơ đồ giả định trước đó bit 5 bằng 0.",
              codeLang: "gpio_register_mmio.c",
              code: `#include <stdint.h>

// Địa chỉ thanh ghi xuất dữ liệu Port A (STM32F103 Reference Manual)
#define GPIOA_ODR_ADDR  (0x4001080CU)
#define GPIOA_ODR       (*(volatile uint32_t *)GPIOA_ODR_ADDR)

void turn_on_led_pa5(void) {
    // Giả sử GPIOA đã có clock và PA5 đã ở chế độ output push-pull.
    GPIOA_ODR |= (1U << 5);
}`,
              callout: {
                type: "key-idea",
                label: "CẦN NHỚ",
                text: "Đọc hoặc ghi địa chỉ thanh ghi truy cập phần cứng theo tài liệu MCU. Phép |= là đọc–sửa–ghi. STM32F103 có BSRR để đặt hoặc xóa bit GPIO bằng một lần ghi."
              },
              diff: [
                { op: "+", text: "Address Decoder nhận diện vùng Peripheral (0x4001_080C)" },
                { op: "~", text: "Bit 5 của GPIOA_ODR: 0 → 1" },
                { op: "+", text: "Chân vật lý PA5: 0V → 3.3V (Đèn LED sáng!)" }
              ],
              kpis: [
                { label: "Địa chỉ Thanh ghi", value: "0x4001_080C", sub: "GPIOA_ODR", tone: "lavender" },
                { label: "Giá trị ghi", value: "0x0020", sub: "Bit 5 = 1 (1 << 5)", tone: "amber" },
                { label: "Điện áp chân PA5", value: "3.3 V", sub: "Mức Logic HIGH", tone: "sage" },
                { label: "Trạng thái LED", value: "BẬT SÁNG", sub: "Hardware I/O", tone: "sage" }
              ],
              legend: [
                { label: "Lệnh ghi Bus APB2", color: "#d9c8f0" },
                { label: "Dòng điện kích LED PA5", color: "#84be88" }
              ],
              learnUnlock: [0],
              scene: { type: "mmio_led" }
            },
            {
              id: "s10",
              badge: "RECAP",
              title: "Tổng kết bộ nhớ và kiểm tra nhanh",
              body:
                "Kiểm tra lại ba điểm trước khi làm bài thực hành: vị trí của bảng tra trong linker script, byte ở địa chỉ thấp trên máy little-endian và miền giá trị của kiểu số nguyên.",
              codeLang: "embedded_c_checklist.h",
              code: `// Chọn kiểu theo miền giá trị và độ rộng cần dùng.
// Đọc linker map để xác định vị trí của bảng tra.
// Mã hóa từng byte theo quy ước của giao thức.
// Tra địa chỉ và quy tắc truy cập thanh ghi trong tài liệu MCU.`,
              callout: {
                type: "good-to-know",
                label: "TIẾP THEO",
                text: "Sang bước thực hành để in thứ tự byte và quan sát uint8_t quay vòng khi chuyển giá trị 256."
              },
              diff: [
                { op: "+", text: "Đọc miền giá trị trước khi chuyển kiểu." },
                { op: "+", text: "Dùng linker map và phép đọc theo từng byte để kiểm tra giả định." }
              ],
              kpis: [
                { label: "Flash / SRAM", value: "64K / 20K", sub: "Đã nắm bản đồ", tone: "sage" },
                { label: "Kiểu dữ liệu", value: "<stdint.h>", sub: "Chuẩn cố định bit", tone: "sage" },
                { label: "Endian ARM", value: "Little", sub: "LSB ở địa chỉ thấp", tone: "lavender" },
                { label: "Bước tiếp theo", value: "Thực hành", sub: "Quan sát byte trên PC", tone: "sage" }
              ],
              legend: [
                { label: "Luồng kiến thức hoàn chỉnh", color: "#84be88" }
              ],
              learnUnlock: [0, 1, 2, 3, 4],
              scene: { type: "recap_map" },
              quiz: [
                {
                  prompt: "Câu 1: Nếu linker script đặt .rodata trong Flash, bảng tra const ở phạm vi tệp được xếp vào .rodata thì nằm ở đâu?",
                  options: [
                    "A. SRAM (.data)",
                    "B. Flash (.rodata)",
                    "C. SRAM (.bss)",
                    "D. Thanh ghi ngoại vi"
                  ],
                  correctIndex: 1,
                  explain: "Bảng nằm trong Flash theo linker script của bản build. Có thể kiểm tra địa chỉ của bảng trong linker map."
                },
                {
                  prompt: "Câu 2: Trên ARM Cortex-M (Little-Endian), `uint32_t x = 0xAABBCCDD;` đặt tại 0x2000_0000. Giá trị byte tại 0x2000_0000 là gì?",
                  options: [
                    "A. 0xAA",
                    "B. 0xBB",
                    "C. 0xDD",
                    "D. 0xCC"
                  ],
                  correctIndex: 2,
                  explain: "Chính xác! Little-Endian lưu Byte có trọng số nhỏ nhất (LSB = 0xDD) tại địa chỉ nhỏ nhất (0x2000_0000)."
                },
                {
                  prompt: "Câu 3: `uint8_t a = 250; a += 10;` cho kết quả bao nhiêu?",
                  options: [
                    "A. 260",
                    "B. 4",
                    "C. 255",
                    "D. -6"
                  ],
                  correctIndex: 1,
                  explain: "Chính xác! Phép cộng cho 260 trong int. Khi lưu vào uint8_t, kết quả là 260 % 256 = 4."
                }
              ]
            }
          ]
        },
        {
          id: "b02-bitwise",
          number: "02",
          title: "Phép toán Bitwise & Bit Mask",
          duration: "15 phút",
          level: "Cơ bản",
          subtitle: "Đọc, bật, tắt, đảo bit trên thanh ghi mà không làm hỏng các bit lân cận (AND, OR, XOR, NOT, Shift).",
          locked: true,
          topics: ["& | ^ ~ << >>", "Set bit: REG |= (1U << n)", "Clear bit: REG &= ~(1U << n)", "Toggle & Read-Modify-Write"]
        },
        {
          id: "b03-pointers-mmio",
          number: "03",
          title: "Con trỏ & Thanh ghi phần cứng",
          duration: "20 phút",
          level: "Trung bình",
          subtitle: "Giải phẫu địa chỉ, con trỏ hàm callback (ISR/Driver), mảng con trỏ và ánh xạ thanh ghi.",
          locked: true,
          topics: ["Toán tử & và *", "Pointer arithmetic", "Function pointer & Callback", "Ép kiểu địa chỉ thanh ghi"]
        },
        {
          id: "b04-struct-union",
          number: "04",
          title: "Struct, Union & Bit-field",
          duration: "18 phút",
          level: "Trung bình",
          subtitle: "Memory Alignment/Padding, đóng gói gói tin UART/CAN và gom nhóm thanh ghi STM32 kiểu CMSIS.",
          locked: true,
          topics: ["Struct padding & __packed", "Union tách byte/float", "Bit-field trên thanh ghi", "GPIO_TypeDef mô phỏng CMSIS"]
        },
        {
          id: "b05-volatile-storage",
          number: "05",
          title: "Phân vùng bộ nhớ & volatile",
          duration: "18 phút",
          level: "Trung bình",
          subtitle: "Tại sao compiler -O2 tối ưu hóa làm treo vòng lặp đọc phần cứng nếu thiếu `volatile`? Stack vs Heap.",
          locked: true,
          topics: ["Stack vs Heap overflow", "static nội/ngoại bộ", "Compiler optimization vs volatile", "Race condition với ISR"]
        }
      ]
    },
    {
      id: "mod-02",
      title: "02. STM32 & ARM Cortex-M",
      color: "#f5d88b",
      lessons: [
        {
          id: "b06-cortex-m-asm",
          number: "06",
          title: "Kiến trúc Cortex-M & Assembly",
          duration: "20 phút",
          level: "Trung bình",
          subtitle: "Tập thanh ghi R0–R15 (SP, LR, PC), xPSR, chu trình Fetch-Decode-Execute và phân tích mã máy từ C.",
          locked: true,
          topics: ["R0-R12, SP, LR, PC", "LDR / STR / MOV / B", "Stack Frame khi gọi hàm", "Dịch ngược C sang Assembly"]
        },
        {
          id: "b07-clock-gpio",
          number: "07",
          title: "Clock Tree & Lập trình GPIO",
          duration: "18 phút",
          level: "Cơ bản",
          subtitle: "Cấp xung clock RCC qua bus AHB/APB2, cấu hình Input Pull-up/down, Output Push-Pull/Open-Drain & chống dội phím.",
          locked: true,
          topics: ["RCC_APB2ENR", "Push-Pull vs Open-Drain", "Input Floating / Pull-up", "Debounce nút nhấn"]
        },
        {
          id: "b08-interrupt-nvic",
          number: "08",
          title: "Ngắt (Interrupt), NVIC & SysTick",
          duration: "22 phút",
          level: "Trung bình",
          subtitle: "Polling vs Interrupt, Vector Table, mức ưu tiên Preempt/Subpriority trong NVIC và SysTick 1ms.",
          locked: true,
          topics: ["Vector Table", "EXTI & NVIC Priority", "Context Saving trên Stack", "SysTick Non-blocking Delay"]
        },
        {
          id: "b09-timer",
          number: "09",
          title: "Timer (Prescaler / ARR)",
          duration: "18 phút",
          level: "Trung bình",
          subtitle: "Cách bộ đếm PSC, CNT và ARR tạo xung thời gian chính xác micro-giây và Input Capture / Output Compare.",
          locked: true,
          topics: ["F_update = F_clk / ((PSC+1)*(ARR+1))", "Up/Down Counter", "Timer Interrupt", "Đo độ rộng xung"]
        },
        {
          id: "b10-pwm",
          number: "10",
          title: "Điều chế độ rộng xung PWM",
          duration: "15 phút",
          level: "Cơ bản",
          subtitle: "So sánh CNT với CCR để tạo Duty Cycle 0..100% điều chỉnh độ sáng LED và tốc độ động cơ.",
          locked: true,
          topics: ["Duty Cycle & Frequency", "CCR vs ARR", "Lọc thông thấp RC", "Điều khiển Servo / DC Motor"]
        },
        {
          id: "b11-uart-i2c-spi-dma",
          number: "11",
          title: "UART / I2C / SPI & DMA",
          duration: "25 phút",
          level: "Nâng cao",
          subtitle: "So sánh trực quan dạng sóng 3 chuẩn giao tiếp và cơ chế DMA bơm dữ liệu thẳng vào RAM không tốn CPU.",
          locked: true,
          topics: ["UART Baudrate & Ring Buffer", "I2C Start/ACK/Pull-up", "SPI CPOL/CPHA 4-dây", "DMA Peripheral-to-Memory"]
        },
        {
          id: "b12-can-watchdog",
          number: "12",
          title: "Mạng CAN, RTC & Watchdog",
          duration: "20 phút",
          level: "Nâng cao",
          subtitle: "Truyền thông vi sai CAN trong ô tô (Arbitration ID), đồng hồ thời gian thực RTC & chống treo IWDG.",
          locked: true,
          topics: ["CAN Frame & Bit Arbitration", "CAN Filter", "IWDG / WWDG", "Sleep / Stop Low-Power"]
        }
      ]
    },
    {
      id: "mod-03",
      title: "03. Hệ thống nhúng & RTOS",
      color: "#d9c8f0",
      lessons: [
        {
          id: "b13-freertos",
          number: "13",
          title: "FreeRTOS: Task, Queue & Mutex",
          duration: "25 phút",
          level: "Nâng cao",
          subtitle: "Lập lịch đa nhiệm thời gian thực, trạng thái Task (Ready/Running/Blocked), Queue và bẫy Priority Inversion.",
          locked: true,
          topics: ["Context Switch", "Queue Producer-Consumer", "Mutex vs Semaphore", "Priority Inversion"]
        },
        {
          id: "b14-makefile-linker",
          number: "14",
          title: "Bare-metal GCC, Makefile & Linker",
          duration: "22 phút",
          level: "Nâng cao",
          subtitle: "Thoát khỏi IDE: cách arm-none-eabi-gcc biên dịch, Linker Script (.ld) chia Flash/RAM và Startup.s gọi main().",
          locked: true,
          topics: ["Compiler -> Assembler -> Linker", "MEMORY & SECTIONS (.ld)", "Makefile dependency graph", "Flash qua OpenOCD/ST-Link"]
        },
        {
          id: "b15-bootloader",
          number: "15",
          title: "Phân vùng Flash & Bootloader",
          duration: "22 phút",
          level: "Nâng cao",
          subtitle: "Chia Flash thành Bootloader + Application, dời bảng Vector Ngắt (VTOR) và nhảy sang Firmware mới.",
          locked: true,
          topics: ["Bootloader Memory Map", "SCB->VTOR relocation", "Jump to Application (MSP + ResetHandler)", "Kiểm tra CRC Firmware"]
        },
        {
          id: "b16-lora-project",
          number: "16",
          title: "Dự án STM32 + Module LoRa",
          duration: "20 phút",
          level: "Dự án",
          subtitle: "Thiết kế kiến trúc Node cảm biến & Gateway giao tiếp SX1278 qua SPI, đóng gói frame và truyền tầm xa.",
          locked: true,
          topics: ["SX1278 SPI Control", "Spreading Factor & Bandwidth", "Đóng gói Frame + Checksum", "Tiết kiệm năng lượng Node"]
        }
      ]
    }
  ]
  };
}
