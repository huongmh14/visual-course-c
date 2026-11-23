  const item = (kind, url, title, vi, en) => ({ kind, url, title, note: [vi, en] });
  const read = (...args) => item("reading", ...args);
  const csv = (file, ...args) => item("csv", "datasets/" + file, ...args);
  const beej = "https://beej.us/guide/bgc/html/split/";
  const draft = "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf";
  const wg14 = (section, vi, en) => read(draft, "WG14 — C11 draft, " + section, vi, en);

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
      wg14("§6.5.7 and §6.5.10–12", "Kiểm tra số bit được phép dịch và cách &, ^, | xử lý toán hạng.", "Check the valid shift range and how &, ^, and | handle their operands."),
      read("https://www.st.com/resource/en/application_note/an4899-generalpurpose-io-gpio-configuration-for-stm32-mcus-stmicroelectronics.pdf", "ST — GPIO Configuration (AN4899)", "Đọc phần cấu hình GPIO để liên hệ mặt nạ bit với việc cấu hình một chân trên MCU.", "Read the GPIO configuration section to connect a bit mask with configuring a microcontroller pin.")
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
    ]
  };
