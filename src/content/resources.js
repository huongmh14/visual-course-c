  const item = (kind, url, title, vi, en) => ({ kind, url, title, note: [vi, en] });
  const read = (...args) => item("reading", ...args);
  const csv = (file, ...args) => item("csv", "datasets/" + file, ...args);
  const beej = "https://beej.us/guide/bgc/html/split/";
  const draft = "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf";
  const wg14 = (section, vi, en) => read(draft, "WG14 — C11 draft, " + section, vi, en);
  const labRepo = "https://github.com/huongmh14/Embedded-C/tree/main/";
  const lab = (folder, title, vi, en) => read(labRepo + folder, title, vi, en);

  export const COURSE_RESOURCES = {
    "intro-how-to-learn": [
      read(beej + "index.html", "Beej’s Guide to C — Introduction", "Đọc phần mở đầu để nắm cách biên dịch và phong cách học thực hành trên terminal.", "Read the introduction to understand compiling and practicing on the command line."),
      read("https://www.st.com/resource/en/datasheet/stm32f103c8.pdf", "STM32F103C8 Datasheet (Overview)", "Lướt qua mục Memory Mapping và Electrical Characteristics để thấy code C gắn với phần cứng thật thế nào.", "Skim Memory Mapping and Electrical Characteristics to connect C code with physical hardware.")
    ],
    "c-types-io": [
      read(beej + "variables-and-statements.html", "Beej’s Guide to C — Variables and Statements", "Đọc các mục về kiểu biến, phép tính số học và toán tử sizeof.", "Read the sections on variable types, arithmetic, and sizeof."),
      read(beej + "functions.html", "Beej’s Guide to C — Functions", "Đọc phần truyền giá trị và khai báo hàm trước khi viết hàm đổi nhiệt độ.", "Read about passing by value and function prototypes before writing the temperature function."),
      read("https://cs50.harvard.edu/x/weeks/1/", "Harvard CS50x — Week 1: C", "Ôn kiểu dữ liệu, printf và cách biên dịch chương trình C đầu tiên.", "Review data types, printf, and how to compile your first C program.")
    ],
    "c-control-flow": [
      read(beej + "variables-and-statements.html", "Beej’s Guide to C — Variables and Statements", "Đọc mục 3.3 về if, switch và điều kiện dừng của từng vòng lặp.", "Read §3.3 on if, switch, and when each loop terminates."),
      read("https://cs50.harvard.edu/x/weeks/1/", "Harvard CS50x — Week 1: C", "Luyện thêm điều kiện và vòng lặp với các bài thực hành của tuần 1.", "Practice conditionals and loops with the Week 1 exercises."),
      csv("fsm.csv", ["Mẫu cảm biến cho máy trạng thái", "Samples for the state machine"], "Bắt đầu ở WAIT, đi qua cột sample theo thứ tự và đối chiếu expected_state sau mỗi lần gọi next_state.", "Start in WAIT, process the sample column in order, and check expected_state after each next_state call.")
    ],
    "b01-memory-types": [
      wg14("§6.3.1 and §7.20", "Đối chiếu quy tắc nâng kiểu số nguyên, ép kiểu và các kiểu uint8_t, uint16_t.", "Look up integer promotions, conversions, and types such as uint8_t and uint16_t."),
      read(beej + "file-inputoutput.html", "Beej’s Guide to C — File Input/Output", "Đọc mục 9.6.1 để hiểu vì sao việc ghi thẳng số nguyên hoặc struct ra file có thể phụ thuộc vào máy.", "Read §9.6.1 to see how writing an integer or struct directly to a file can depend on the machine.")
    ],
    "b02-bitwise": [
      wg14("§6.3.1.1, §6.5.3.3, §6.5.7 & §6.5.10–14", "Đối chiếu nâng kiểu số nguyên (integer promotions), phép ~, giới hạn dịch bit hợp lệ và ưu tiên toán tử bitwise/logic.", "Look up integer promotions, bitwise NOT (~), valid shift ranges, and bitwise/logical operator precedence."),
      read("https://www.st.com/resource/en/application_note/an4899-generalpurpose-io-gpio-configuration-for-stm32-mcus-stmicroelectronics.pdf", "ST — GPIO Configuration (AN4899)", "Đọc cấu hình thanh ghi MODER (2 bit/pin) và cơ chế ghi nguyên tử BSRR trên STM32.", "Read about 2-bit MODER fields and atomic BSRR set/reset writes on STM32."),
      read("https://arm-software.github.io/CMSIS_5/Core/html/group__peripheral__gr.html", "ARM CMSIS — Peripheral Access (_Pos / _Msk)", "Xem quy ước đặt tên _Pos / _Msk và cách ánh xạ khối thanh ghi ngoại vi qua struct.", "Review CMSIS _Pos / _Msk naming conventions and struct-based peripheral register maps.")
    ],
    "b03-pointers-mmio": [
      read(beej + "arrays.html", "Beej’s Guide to C — Arrays", "Đọc mục 6.6.2 và thử truyền mảng cùng độ dài vào một hàm C.", "Read §6.6.2 and pass an array and its length into a C function."),
      read(beej + "file-inputoutput.html", "Beej’s Guide to C — File Input/Output", "Đọc mục 9.3.1 để xử lý từng dòng dữ liệu trên PC mà không phải nạp cả file vào RAM.", "Read §9.3.1 to process records one line at a time without loading the whole file into RAM."),
      item("real", "https://archive.ics.uci.edu/dataset/360/air+quality", "UCI — Air Quality", "Dữ liệu trung bình theo giờ từ 5 cảm biến hóa học. Lấy 100 dòng, lọc giá trị thiếu -200 ở cột PT08.S1(CO) rồi tính min/max. UCI ghi bộ dữ liệu dành cho nghiên cứu.", "Hourly averages from five chemical sensors. Take 100 rows, skip missing -200 values in PT08.S1(CO), and compute min/max. UCI lists the dataset for research use.")
    ],
    "b04-struct-union": [
      read(beej + "structs.html", "Beej’s Guide to C — Structs", "Đọc về cách truyền struct bằng giá trị hoặc bằng con trỏ và toán tử ->.", "Read about passing a struct by value or by pointer and using the -> operator."),
      wg14("§6.7.2.1", "Đọc quy tắc bố trí thành viên của struct và union rồi đối chiếu với kết quả sizeof và offsetof của bạn.", "Read the layout rules for struct and union members, then compare with your sizeof and offsetof results.")
    ],
    "b05-volatile-storage": [
      wg14("§6.2.4 and §6.7.3", "Đọc về thời gian lưu trữ của biến và các bộ định tính kiểu như volatile.", "Read about object storage duration and type qualifiers such as volatile."),
      read("https://gcc.gnu.org/onlinedocs/gcc/Volatiles.html", "GCC — When Is a Volatile Object Accessed?", "Đọc cảnh báo về thứ tự truy cập bộ nhớ khi biến volatile đi cùng biến thông thường.", "Read the warning about memory access ordering when volatile and ordinary objects are used together.")
    ],
    "e-led-ohm": [
      read("https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits", "OpenStax — Ohm’s Law and Simple Circuits", "Ôn V = IR và dùng điện áp còn lại trên điện trở sau khi trừ sụt áp LED.", "Review V = IR and use the voltage remaining across the resistor after the LED’s forward drop."),
      item("real", "https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption", "UCI — Household Electric Power Consumption", "Dữ liệu điện áp (V) và dòng điện (A) theo phút. Đọc 1.000 dòng đầu, bỏ ô trống và thống kê min/max của từng cột.", "Minute-averaged voltage (V) and current (A). Read the first 1,000 rows, skip missing entries, and compute each column’s min/max.")
    ],
    "e-gpio-button": [
      read("https://www.st.com/resource/en/application_note/an4899-generalpurpose-io-gpio-configuration-for-stm32-mcus-stmicroelectronics.pdf", "ST — GPIO Configuration (AN4899)", "Đọc về các kiểu input và điện trở pull-up/pull-down.", "Read about input modes and pull-up/pull-down resistors."),
      read("https://eng.utah.edu/~cs5780/debouncing.pdf", "Jack Ganssle — A Guide to Debouncing (PDF)", "Xem dạng sóng đo trên công tắc cơ và lý do cần lọc nhiều mẫu liên tiếp.", "Look at measured mechanical switch waveforms and why consecutive samples are useful."),
      csv("debounce.csv", ["Chuỗi nút nhấn active-low", "Active-low button samples"], "Lấy mẫu mỗi 5 ms, chấp nhận sau 3 mẫu liên tiếp giống nhau. Đối chiếu hai sự kiện nhấn ở 25 ms và 60 ms.", "Sample every 5 ms and accept a state after three equal samples. Check for press events at 25 ms and 60 ms.")
    ],
    "e-divider-adc": [
      read("https://wiki.st.com/stm32mcu/wiki/Getting_started_with_ADC", "ST — Getting Started with ADC", "Đọc về độ phân giải, điện áp tham chiếu và thời gian lấy mẫu.", "Read about resolution, reference voltage, and sampling time."),
      csv("adc.csv", ["Mã ADC 12-bit kèm điện áp kỳ vọng", "12-bit ADC codes with expected voltages"], "Dùng hàm adc_mv của bài với Vref = 3.300 mV. Đối chiếu expected_mv cho mỗi mã từ 0 đến 4095.", "Use the lesson’s adc_mv function with a 3,300 mV reference. Check expected_mv for codes between 0 and 4095.")
    ],
    "e-pwm": [
      read("https://developerhelp.microchip.com/xwiki/bin/view/applications/power/leds/led-applications-with-pic-mcu/pwm-control/", "Microchip — LED PWM Control", "Xem duty cycle ảnh hưởng đến độ sáng LED và cách chọn tần số PWM.", "See how duty cycle affects LED brightness and how PWM frequency is chosen."),
      csv("pwm.csv", ["Mẫu ADC và số tick PWM", "ADC samples and PWM ticks"], "Giả lập 1.000 tick mỗi chu kỳ. Đếm số tick ở HIGH và so với expected_high_ticks khi bật hoặc tắt PWM.", "Simulate 1,000 ticks per period. Count HIGH ticks and compare with expected_high_ticks when PWM is enabled or disabled.")
    ],
    "c-operators-conversions": [
      lab("03-operators-conversions", "Embedded-C · 03-operators-conversions", "Làm trọn bộ đề 100 điểm về nâng kiểu, trộn có/không dấu, chia làm tròn và bộ đếm quay vòng.", "Complete the 100-point module on promotions, signed/unsigned mixing, rounded division, and timer rollover."),
      wg14("§6.3.1.8 & §6.5.7", "Tra cứu quy tắc Usual Arithmetic Conversions và hành vi không xác định khi dịch bit.", "Look up Usual Arithmetic Conversions and shift undefined-behavior rules.")
    ],
    "c-modular-makefile": [
      lab("06-functions", "Embedded-C · 06–10 & P2 Sensor Lib", "Thực hành tách hàm thuần (06), header nhiều tệp (07), mảng & chuỗi UART (08–09), Makefile -MMD -MP (10) và P2.", "Practice pure functions (06), multi-file headers (07), sample arrays/UART strings (08–09), Makefile -MMD -MP (10), and P2."),
      read("https://www.gnu.org/software/make/manual/html_node/Automatic-Prerequisites.html", "GNU Make — Automatic Prerequisites (-MMD -MP)", "Tìm hiểu cơ chế GCC tự sinh tệp .d giúp Make phát hiện mọi thay đổi trong tệp header.", "See how GCC generates .d dependency files so Make rebuilds on every header change.")
    ],
    "c-callbacks-fsm": [
      lab("11-pointers", "Embedded-C · 11–14 & P3 Door Lock FSM", "Luyện tập con trỏ MMIO (11), Callback & Dispatch Table (12), Struct CMSIS (13), Enum/Union/FSM (14) và dự án khóa cửa P3.", "Practice MMIO pointers (11), callbacks & dispatch tables (12), CMSIS structs (13), enums/unions/FSM (14), and the P3 door-lock project."),
      read("https://arm-software.github.io/CMSIS_5/Core/html/group__peripheral__gr.html", "ARM CMSIS — Peripheral Access Structs", "Xem cách struct thanh ghi ánh xạ thẳng lên địa chỉ ngoại vi phần cứng thật.", "Inspect how peripheral register structs map directly onto real MCU memory-mapped hardware.")
    ],
    "c-ringbuf-pool-misra": [
      lab("18-linked-list-ring-buffer", "Embedded-C · 15–20 & P4 Data Logger", "Hoàn thành bài 15–20 (volatile, Static Pool, CSV HIL, Ring Buffer, MISRA C Automotive) và tổng kết P4 Data Logger.", "Complete lessons 15–20 (volatile, static pools, CSV HIL, ring buffers, MISRA C) and the P4 Data Logger capstone."),
      read("https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html", "GCC — Strict Conversion & Type Warnings", "Tham khảo ý nghĩa -Wconversion, -Wsign-conversion, -Wcast-qual và -Wstrict-prototypes trong bộ cờ bán-MISRA.", "Review -Wconversion, -Wsign-conversion, -Wcast-qual, and -Wstrict-prototypes used in defensive builds.")
    ],
    "e-power-rails-dmm": [
      lab("electric-basic/01-dc-ohm-power-dmm", "Embedded-C · E01 Nguồn, Cầu phân áp & DMM", "Làm 50 điểm code C tính nhiệt LDO/Buck, sụt áp cầu phân áp có tải và 30 điểm thực hành đo nguội/nóng DMM.", "Complete 50 pts of C power/divider modeling plus the 30-pt cold and hot DMM multimeter lab."),
      read("https://www.allaboutcircuits.com/textbook/direct-current/", "All About Circuits — DC Voltage, Ohm & Dividers", "Ôn định luật Ohm, công suất P = VI và cầu phân áp qua mô phỏng mạch DC.", "Review Ohm's law, P = VI dissipation, and DC voltage-divider circuits.")
    ],
    "e-components-mosfet": [
      lab("electric-basic/02-passive-active-components", "Embedded-C · E02 Decoupling, MOSFET & Flyback", "Làm bài tập chọn R_DS(on) logic-level N-MOSFET, trở cực B BJT, Optocoupler PC817 và lắp/mô phỏng tải 12V.", "Practice logic-level N-MOSFET sizing, BJT saturation, PC817 optocouplers, and 12V low-side switching lab."),
      read("https://www.ti.com/lit/an/slva157/slva157.pdf", "TI — Decoupling Capacitors for Microcontrollers", "Xem lý do tụ gốm 100 nF phải đặt sát cặp chân nguồn VDD–VSS của vi điều khiển.", "Learn why 100 nF ceramic decoupling capacitors must sit right next to MCU VDD–VSS pins.")
    ],
    "e-opamp-rc": [
      lab("electric-basic/04-analog-adc-pwm-opamp", "Embedded-C · E03–E04 Logic, Op-Amp & Lọc RC", "Làm bài tính ngưỡng logic, bộ tính PSC/ARR/CCR cho PWM, khuếch đại Op-Amp và mạch lọc RC biến PWM thành DC.", "Solve logic-margin checks, PWM timer math, op-amp rail scaling, and the PWM-to-DC RC low-pass filter lab."),
      read("https://www.electronics-tutorials.ws/filter/filter_2.html", "Electronics Tutorials — Passive RC Low-Pass Filter", "Ôn tần số cắt fc = 1/(2πRC) và thời gian đáp ứng bậc thang 5τ.", "Review RC cutoff frequency fc = 1/(2πRC) and 5τ step response.")
    ],
    "e-serial-datasheet": [
      lab("electric-basic/05-serial-buses-electrical", "Embedded-C · E05–E06 & Lab P1 Board Bring-Up", "Làm bài kiểm tra sườn lên I2C, bộ giải mã UART/SPI, ngân sách dòng Datasheet (E06) và lộ trình thực hành 4 chặng Lab P1.", "Complete I2C rise-time checks, UART/SPI frame decoders, datasheet current budgeting (E06), and the 4-stage Lab P1."),
      lab("electric-basic/p1-board-bringup-lab", "Embedded-C · Lộ trình Lab 4 chặng lên STM32", "Thực hành từ Breadboard/Falstad đến Wokwi/STM32 Logic Analyzer và lập trình thanh ghi trực tiếp từ Reference Manual.", "Follow the 4-stage bring-up from breadboard/Falstad to Logic Analyzer captures and bare-metal registers.")
    ]
  };
