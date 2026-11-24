export function createIntroLesson() {
  return {
    id: "intro-how-to-learn",
    number: "00",
    title: "Cách học với dự án & Câu hỏi mở",
    duration: "25 phút",
    level: "Nền tảng",
    subtitle:
      "Phương pháp học C Nhúng không nhàm chán theo vòng lặp 3 nhịp và bộ câu hỏi mở từ các bài toán thực tế.",
    locked: false,
    youllLearn: [
      "Vòng lặp học 70 phút: Đoán 15s → Phá code + assert → Tự trả lời câu hỏi mở",
      "Bài toán #1: Tránh lỗi tràn số trên hệ thống quản lý pin (BMS)",
      "Bài toán #2: Xử lý nút nhấn bị dội mà không dùng delay() chặn CPU",
      "Bài toán #3: Gửi gói tin đa byte qua UART/CAN không bị lệch Endian",
      "Định hướng sản phẩm cá nhân qua 4 chặng của lộ trình dự án"
    ],
    steps: [
      {
        id: "s1",
        badge: "SETUP",
        title: "Học C Nhúng qua bài toán thật, đừng đọc vẹt",
        body:
          "Đọc slide hay gõ theo code mẫu rất dễ chán và nhanh quên. Trong khóa học này, mỗi buổi 70 phút chia làm 3 nhịp: (1) Nhìn sơ đồ đoán kết quả trong 15 giây trước khi bấm `Bước tiếp →`; (2) Ở bước `LAB`, cố tình thay đổi kiểu dữ liệu để thấy lỗi thật rồi dùng `assert` kiểm chứng; (3) Tự viết câu trả lời cho câu hỏi mở bằng ngôn ngữ của chính bạn.",
        codeLang: "Nhịp học mẫu · 70 phút",
        code: `// 20': Đoán kết quả từ sơ đồ + bấm Space/R soi từng byte
// 35': Mở terminal biên dịch bằng:
//      gcc -Wall -Wextra -Werror main.c -o app && ./app
// 15': Trả lời Câu hỏi mở & ghi lại 1 bug vừa tự bắt được`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Não nhớ lâu nhất khi bạn tự đưa ra dự đoán rồi bị sơ đồ hoặc trình biên dịch \"bẻ lái\" ở bước lỗi."
        },
        diff: [
          { op: "+", text: "Bật phím Space để dừng sơ đồ lại soi từng luồng tín hiệu." },
          { op: "+", text: "Luôn biên dịch với cờ -Wall -Wextra -Werror để bắt lỗi sớm." }
        ],
        kpis: [
          { label: "Nhịp 1", value: "20 phút", sub: "Đoán + Soi Visual", tone: "sky" },
          { label: "Nhịp 2", value: "35 phút", sub: "Phá code + assert", tone: "amber" },
          { label: "Nhịp 3", value: "15 phút", sub: "Trả lời câu hỏi mở", tone: "sage" }
        ],
        legend: [
          { label: "Dự đoán chủ động", color: "#84b4df" },
          { label: "Kiểm thử assert", color: "#f5d88b" },
          { label: "Tự đúc kết", color: "#84be88" }
        ],
        learnUnlock: [0],
        scene: { type: "intro_loop" }
      },
      {
        id: "s2",
        badge: "PROBLEM",
        title: "Bài toán #1: Đồng hồ pin xe điện tụt ảo 99% → 0%",
        body:
          "Một bo mạch đo pin (BMS) đọc điện áp từng cell `0..4200 mV` và dòng sạc/xả `-5000..+5000 mA`. Nếu lập trình viên chọn sai kiểu số nguyên (ví dụ dùng `uint8_t` cho biến tổng hoặc ép kiểu ẩu), giá trị vượt 255 sẽ quay vòng về 0 — khiến đồng hồ báo hết pin giả dù pin vẫn đầy!",
        codeLang: "C · bẫy tràn miền giá trị",
        code: `uint8_t total = 200;
total += 80;       // 280 % 256 = 24 -> tụt đột ngột!
// Khi cộng 4 mẫu ADC 12-bit (max 4095 * 4 = 16380):
// Phải chọn kiểu chứa đủ tổng trước khi chia lấy trung bình.`,
        callout: {
          type: "watch-out",
          label: "LƯU Ý",
          text: "Luôn kiểm tra giá trị cực đại của phép tính trung gian (tổng, tích), không chỉ nhìn miền giá trị của kết quả cuối."
        },
        diff: [
          { op: "-", text: "uint8_t tổng = 200 + 80 → trả về 24 (sai do modulo 256)." },
          { op: "+", text: "Dùng <stdint.h> khớp chặt dấu và miền vật lý của cảm biến." }
        ],
        kpis: [
          { label: "Điện áp cell", value: "0..4200 mV", sub: "Không âm", tone: "sky" },
          { label: "Dòng sạc/xả", value: "±5000 mA", sub: "Có dấu âm/dương", tone: "amber" },
          { label: "Rủi ro sai kiểu", value: "Tràn số", sub: "Quay vòng về 0", tone: "rose" }
        ],
        legend: [
          { label: "Lỗi tràn kiểu", color: "#e57373" },
          { label: "Đủ miền giá trị", color: "#84be88" }
        ],
        learnUnlock: [1],
        scene: { type: "intro_case_bms" },
        openQuestions: [
          {
            id: "q-bms",
            scenario: "BÀI TOÁN THỰC TẾ #1 · BMS PIN",
            prompt:
              "1) Với `cell_mv` (`0..4200 mV`) và `current_ma` (`-5000..+5000 mA`), bạn chọn kiểu `<stdint.h>` nào? 2) Nếu cộng dồn 32 mẫu `cell_mv` liên tiếp để tính trung bình, dùng `uint16_t` để cộng dồn có bị tràn không? Tại sao?",
            placeholder: "Gõ phân tích kiểu dữ liệu và phép tính max 32 * 4200 của bạn...",
            hint: "Kiểm tra: uint16_t tối đa là 65,535. Thử tính 32 × 4,200 = 134,400 so với 65,535!"
          }
        ]
      },
      {
        id: "s3",
        badge: "PROBLEM",
        title: "Bài toán #2: Bấm nút 1 lần nhưng thiết bị nhảy 3 lần",
        body:
          "Tiếp điểm cơ học bên trong nút nhấn không đóng mở dứt khoát mà rung lên xuống trong 5–20 ms (dội phím). Nếu viết `delay_ms(50)` để chờ hết rung, toàn bộ CPU bị đóng băng suốt 50 ms — làm lỡ gói UART, chậm PID động cơ và treo giao diện.",
        codeLang: "C · bẫy delay chặn CPU",
        code: `// CÁCH DỞ: Chặn toàn bộ vi điều khiển trong 50 ms
if (read_button() == 0) {
    delay_ms(50);          // CPU đứng im, bỏ lỡ mọi cảm biến khác!
    if (read_button() == 0) toggle_led();
}`,
        callout: {
          type: "watch-out",
          label: "LƯU Ý",
          text: "Trong firmware thực tế (super-loop hoặc RTOS), mọi hàm delay bận (`busy-wait`) đều là kẻ thù của tính thời gian thực."
        },
        diff: [
          { op: "-", text: "delay_ms(50) khiến vòng lặp chính không đọc được cảm biến khác." },
          { op: "+", text: "Lấy mẫu định kỳ (vd: mỗi 5 ms) và đếm số lần ổn định liên tiếp." }
        ],
        kpis: [
          { label: "Thời gian dội", value: "5–20 ms", sub: "Nhiễu tiếp điểm cơ", tone: "rose" },
          { label: "delay_ms(50)", value: "Đóng băng", sub: "Chặn toàn CPU", tone: "rose" },
          { label: "Lọc 3 mẫu", value: "Non-blocking", sub: "Không dừng CPU", tone: "sage" }
        ],
        legend: [
          { label: "Tín hiệu rung 0/1", color: "#e57373" },
          { label: "Sự kiện sạch", color: "#84be88" }
        ],
        learnUnlock: [2],
        scene: { type: "intro_case_debounce" },
        openQuestions: [
          {
            id: "q-debounce",
            scenario: "BÀI TOÁN THỰC TẾ #2 · CHỐNG DỘI NÚT",
            prompt:
              "Giả sử vi điều khiển vừa đọc nút nhấn, vừa quét cảm biến khí ga mỗi 10 ms. Chuyện gì xảy ra nếu bạn dùng `delay_ms(50)` trong hàm chống dội nút? Hãy mô tả bằng lời ý tưởng chống dội KHÔNG làm đứng CPU.",
            placeholder: "Viết suy nghĩ của bạn về độ trễ cảm biến và cách lưu trạng thái theo thời gian..."
          }
        ]
      },
      {
        id: "s4",
        badge: "PROBLEM",
        title: "Bài toán #3: Gửi nhiệt độ 10.00 °C nhưng màn hình hiện 59.395 °C",
        body:
          "STM32 lưu biến `uint16_t temp_x100 = 1000` (`0x03E8`) trong RAM theo thứ tự **Little-Endian** (`0xE8` trước, `0x03` sau). Nếu bạn ép thẳng con trỏ thành `uint8_t*` để bắn qua UART/CAN mà bên nhận lại ghép theo **Big-Endian**, con số biến thành `0xE803 = 59,395`!",
        codeLang: "C · bẫy gửi trực tiếp vùng nhớ RAM",
        code: `struct Telemetry { uint8_t id; uint16_t temp_x100; };
// LỖI 1: Compiler có thể chèn 1 byte padding giữa id và temp_x100!
// LỖI 2: Thứ tự byte của temp_x100 phụ thuộc vào Endianness của chip.
// ĐÚNG: Luôn tự đóng gói từng byte bằng dịch bit (>> 8) & 0xFF.`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Bố cục `struct` trong RAM thuộc quyền của compiler và CPU; còn khung truyền trên dây UART/CAN phải do giao thức tự định nghĩa rõ từng byte."
        },
        diff: [
          { op: "-", text: "Gửi thẳng &struct làm rò rỉ padding và đảo ngược thứ tự byte." },
          { op: "+", text: "Hàm encode/decode dịch bit chạy đúng trên mọi kiến trúc chip." }
        ],
        kpis: [
          { label: "Giá trị gốc", value: "0x03E8", sub: "1,000 (10.00 °C)", tone: "sage" },
          { label: "Dây UART (Thô)", value: "E8 → 03", sub: "Lệch Endian", tone: "rose" },
          { label: "Đọc sai thành", value: "59,395", sub: "Sai gấp 59 lần!", tone: "rose" }
        ],
        legend: [
          { label: "Gửi thô RAM (lỗi)", color: "#e57373" },
          { label: "Đóng gói chuẩn", color: "#84be88" }
        ],
        learnUnlock: [3],
        scene: { type: "intro_case_uart" },
        openQuestions: [
          {
            id: "q-uart",
            scenario: "BÀI TOÁN THỰC TẾ #3 · KHUNG TRUYỀN",
            prompt:
              "Vì sao gửi nguyên một `struct` C trực tiếp qua UART giữa STM32 và một server/gateway có thể cho ra số sai hoàn toàn dù cả hai bên đều viết bằng C? Hãy nêu ít nhất 2 nguyên nhân.",
            placeholder: "Gợi ý: Nghĩ về Padding trong struct và thứ tự byte (Endianness)...",
            hint: "Hai nguyên nhân kinh điển: (1) Compiler alignment padding chèn byte rác; (2) Khác biệt Little-Endian vs Big-Endian."
          }
        ]
      },
      {
        id: "s5",
        badge: "TECHNIQUE",
        title: "Bản đồ 4 chặng & Thiết kế dự án cá nhân của bạn",
        body:
          "Bạn sẽ không học rời rạc từng lệnh C, mà đi qua 4 chặng nối tiếp nhau: (1) C Nhúng cốt lõi & CSV test trên PC; (2) Điện tử cơ bản (Ohm, Pull-up, ADC, PWM); (3) Vi điều khiển STM32 Cortex-M; (4) FreeRTOS, Makefile & LoRa. Mỗi bài học đều gắn với một bài toán phần cứng có thật.",
        codeLang: "Lộ trình thực hành · PC → STM32",
        code: `// Chặng 1 (Bài 00–11): C chuẩn C17 + bitwise + Makefile + FSM
// Chặng 2 (Bài 12–19): Điện tử cơ bản (Ohm, MOSFET, Op-Amp, UART/I2C/SPI)
// Chặng 3 (Bài 20–26): Thanh ghi STM32, Ngắt NVIC, Timer, CAN
// Chặng 4 (Bài 27–30): FreeRTOS, Bare-metal Linker, Bootloader, LoRa`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Code nhúng tốt được kiểm chứng trên PC bằng dữ liệu biên (datasets/*.csv) trước khi nạp xuống mạch thật."
        },
        diff: [
          { op: "+", text: "Liên kết chặt chẽ giữa lý thuyết C trên PC và thanh ghi STM32." },
          { op: "+", text: "Mọi bộ dữ liệu CSV đều mô phỏng nhiễu và biên như mạch thật." }
        ],
        kpis: [
          { label: "Sẵn sàng học", value: "20 bài", sub: "12 C + 8 Điện tử", tone: "sage" },
          { label: "Bộ dữ liệu", value: "4 CSV", sub: "fsm, debounce, adc, pwm", tone: "amber" },
          { label: "Lộ trình đầy đủ", value: "31 bài", sub: "Mở rộng từng bước", tone: "lavender" }
        ],
        legend: [
          { label: "Lộ trình nâng cấp liên tục", color: "#84be88" }
        ],
        learnUnlock: [4],
        scene: { type: "intro_roadmap" },
        openQuestions: [
          {
            id: "q-roadmap",
            scenario: "ĐỊNH HƯỚNG DỰ ÁN CÁ NHÂN",
            prompt:
              "Trong 3 nhóm bài toán thực tế vừa xem (BMS đo pin, Nút bấm/Điều khiển thời gian thực, Giao thức UART/CAN/LoRa), bạn tò mò nhất bài toán nào và muốn tự làm mini-project gì vào cuối khóa?",
            placeholder: "Ví dụ: Mình muốn tự làm bộ đo pin + màn hình OLED, hoặc node cảm biến LoRa..."
          }
        ]
      },
      {
        id: "s6",
        badge: "LAB",
        title: "Thực hành · Khởi động nhịp học Tuần 1 của riêng bạn",
        body:
          "Trước khi bước vào Bài 01, hãy chốt mục tiêu cho buổi học đầu tiên của bạn bằng câu hỏi mở bên dưới, bấm `Sao chép (.md)` để lưu vào file `week01/notes.md` trong repo `embedded-journey` của bạn, và trả lời nhanh 1 câu kiểm tra tư duy.",
        codeLang: "Terminal · Khởi tạo repo week01",
        code: `mkdir -p embedded-journey/week01 && cd embedded-journey
# Tạo file ghi chú cho câu hỏi mở bạn vừa trả lời:
cat > week01/notes.md << 'EOF'
# Ghi chú Bài 00 — Cách học & Câu hỏi mở
EOF`,
        callout: {
          type: "key-idea",
          label: "CẦN NHỚ",
          text: "Một ghi chú ngắn 3 dòng viết bằng ngôn ngữ của bạn giá trị hơn 10 trang chép lại slide."
        },
        diff: [
          { op: "+", text: "Gõ câu trả lời cho các câu hỏi mở ở Bước 2–6." },
          { op: "+", text: "Nhấn nút Sao chép (.md) để xuất toàn bộ ghi chú sang Markdown." }
        ],
        kpis: [
          { label: "Bước 1", value: "Đoán 15s", sub: "Trước khi mở lời giải", tone: "sky" },
          { label: "Bước 2", value: "notes.md", sub: "Xuất câu hỏi mở (.md)", tone: "amber" },
          { label: "Bước 3", value: "gcc -Werror", sub: "Biên dịch sạch C17", tone: "sage" }
        ],
        legend: [
          { label: "Dự đoán chủ động", color: "#84b4df" },
          { label: "Ghi chú Markdown", color: "#f5d88b" },
          { label: "Kiểm thử C17", color: "#84be88" }
        ],
        learnUnlock: [],
        scene: { type: "intro_week1_lab" },
        openQuestions: [
          {
            id: "q-commitment",
            scenario: "CAM KẾT NHỊP HỌC · TUẦN 1",
            prompt:
              "Khung giờ cố định mỗi ngày bạn dành cho khóa học này là lúc nào (vd: 20:00–21:10), và nếu một ngày học trên trường quá mệt, phương án tối thiểu (15–20 phút) bạn chọn để không đứt chuỗi là gì?",
            placeholder: "Ví dụ: 20:00 mỗi tối. Ngày mệt quá sẽ xem 1 bài visual + trả lời câu hỏi mở trong 15 phút..."
          }
        ],
        quiz: [
          {
            prompt:
              "Khi gặp một bước PROBLEM trong khóa học (vd: biến `uint8_t` bị tràn hoặc khung truyền UART bị đảo byte), thói quen nào giúp bạn nhớ sâu nhất?",
            options: [
              "Bấm Next liên tục cho nhanh hết bài",
              "Dừng 15 giây tự đoán lỗi trước khi bấm Next, rồi sửa code và chạy assert kiểm chứng",
              "Chỉ đọc thuộc lòng định nghĩa trong slide"
            ],
            correctIndex: 1,
            explain:
              "Tự dự đoán trước rồi kiểm chứng lại bằng sơ đồ và assert kích hoạt trí nhớ chủ động mạnh hơn nhiều so với đọc thụ động."
          }
        ]
      }
    ]
  };
}
