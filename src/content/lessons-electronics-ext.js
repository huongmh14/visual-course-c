export function createElectronicsExtLessons() {
  return [
    {
      id: "e-power-rails-dmm",
      number: "12",
      title: "Nguồn 3.3V/5V, LDO vs Buck & Đồng hồ vạn năng DMM",
      duration: "50 phút",
      level: "Nền tảng",
      subtitle:
        "Bài 01 Điện tử · Tính nhiệt tỏa trên LDO vs Buck, tránh cháy chân qua diode ESD 5V→3.3V, tính cầu phân áp có tải và làm chủ đồng hồ DMM không chập mạch.",
      locked: false,
      youllLearn: [
        "Tính toán nhiệt tổn hao LDO P = (Vin - Vout) × I so với Buck hiệu suất cao và chọn cấp nguồn hợp lý",
        "Ngăn hiện tượng cấp nguồn ngược (back-powering) 5V → 3.3V và tính sụt áp cầu phân áp có tải",
        "Đo kiểm DC V, Thông mạch, Điện trở và Dòng điện bằng DMM an toàn không làm nổ cầu chì lỗ 10A"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Nhiệt LDO vs Buck, bẫy diode ESD 5V→3.3V & 3 cách dịch mức",
          body:
            "LDO tuyến tính (`AMS1117-3.3`) đốt toàn bộ điện áp chênh lệch thành nhiệt: hạ `12 V → 3,3 V @ 300 mA` tỏa ra `(12000 − 3300) × 300 / 1000 = 2610 mW` (`2,61 W`) khiến IC sập nhiệt ngay lập tức; trong khi **Buck `90%`** chỉ rút `~92 mA` ở `12 V` và tỏa `110 mW` (mát hơn **23 lần**!). Ở chân GPIO `3,3 V` thường (`!5V-tolerant`), đưa thẳng tín hiệu `5 V` làm **diode ESD trên (`D_up`)** dẫn ở `> VDD + 0,3 V` bơm ngược áp lên ray `3,3 V` (**back-powering**). Hãy dùng: (1) Cầu phân áp (1 chiều chậm), (2) `BSS138` Open-Drain (2 chiều cho I2C), hoặc (3) IC đệm `74LVC245` (SPI MHz).",
          codeLang: "C17 · tính nhiệt LDO/Buck & kiểm tra an toàn chân 3.3V",
          code: `#include <stdbool.h>
#include <stdint.h>

/* Nhiệt LDO (mW): P_heat = (Vin - Vout) * I_load + Vin * Iq */
uint32_t ldo_heat_mw(uint32_t vin_mv, uint32_t vout_mv,
                     uint32_t i_load_ma, uint32_t iq_ua) {
    if (vin_mv <= vout_mv) return 0U;
    uint64_t p_nw = (uint64_t)(vin_mv - vout_mv) * i_load_ma * 1000ULL
                  + (uint64_t)vin_mv * iq_ua;
    return (uint32_t)((p_nw + 500000ULL) / 1000000ULL);
}

/* Kiểm tra áp vào chân GPIO 3.3V (chống dẫn diode ESD D_up) */
bool is_safe_3v3_input_mv(uint32_t v_in_mv, bool is_5v_tol, uint32_t vdd_mv) {
    if (vdd_mv < 2700U || vdd_mv > 3600U) return false; /* VDD tắt -> cấm cấp ngược */
    return is_5v_tol ? (v_in_mv <= 5500U) : (v_in_mv <= vdd_mv + 300U);
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Kiến trúc chuẩn công nghiệp: dùng Buck hạ 12V/24V → 5V lấy hiệu suất cao, rồi nối qua LDO dropout thấp 5V → 3.3V để lọc sạch gợn xung cho ADC và RF!"
          },
          diff: [
            { op: "-", text: "LDO 12 V → 3,3 V @ 300 mA đốt 2,61 W làm chip vượt 150 °C; Buck 90% chỉ tỏa 110 mW." },
            { op: "+", text: "Chân thường (TT/TC) chỉ chịu tối đa VDD + 300 mV; VDD = 0 V mà cắm tín hiệu 5 V gây back-powering." }
          ],
          kpis: [
            { label: "LDO 12V→3.3V", value: "2610 mW", sub: "Sập nhiệt ở 300 mA", tone: "rose" },
            { label: "Buck 90%", value: "110 mW", sub: "I_in ≈ 92 mA @ 12V", tone: "sage" },
            { label: "Chân thường max", value: "VDD + 0.3V", sub: "Ngưỡng dẫn diode ESD", tone: "amber" }
          ],
          legend: [
            { label: "LDO (nhiệt = ΔV × I)", color: "#e57373" },
            { label: "Buck (hiệu suất cao)", color: "#84be88" },
            { label: "Dịch mức 5V ↔ 3.3V", color: "#84b4df" }
          ],
          learnUnlock: [0],
          scene: { type: "power_ldo_vs_buck" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Cầu phân áp CÓ TẢI (R_load ∥ R2) & chọn tổng trở tối ưu",
          body:
            "Đo không tải bằng DMM (`R_load = 10 MΩ`), cầu `10 kΩ / 10 kΩ` chia `5 V` ra đẹp `2499 mV`. Nhưng nếu cắm tải `R_load = 10 kΩ` vào `Vout`, **`R_load` mắc song song với `R2`** khiến nhánh dưới tụt còn `10 kΩ ∥ 10 kΩ = 5 kΩ` và điện áp sụt mạnh xuống **`1667 mV`**! Vì thế tuyệt đối **không dùng cầu phân áp để cấp nguồn** cho module. Khi chọn điện trở cầu phân áp đo pin vào chân ADC, phải cân bằng hai đầu: trở quá nhỏ (`100 Ω`) gây hao pin, còn trở quá lớn (`1 MΩ`) khiến tụ lấy mẫu S&H (~`5 pF`) bên trong ADC không nạp kịp.",
          codeLang: "C17 · divider_loaded_mv không sai số làm tròn kép",
          code: `/* Vout = Vin * (R2 * R_load) / (R1 * (R2 + R_load) + R2 * R_load)
 * Gộp 1 phép chia uint64_t duy nhất thay vì làm tròn R2_eff trước!
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
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Với mạch đo điện áp pin vào ADC, chọn tổng trở sao cho trở kháng Thévenin R1 ∥ R2 ≤ 10–20 kΩ (ví dụ 30 kΩ / 10 kΩ hoặc 33 kΩ / 10 kΩ cho pin 12,6 V) và có tụ lọc 100 nF tại chân ADC nếu tín hiệu chậm."
          },
          diff: [
            { op: "-", text: "Cầu 10k/10k từ 5V sụt từ 2499 mV xuống 1667 mV ngay khi cắm tải chỉ ăn 0,17 mA (10 kΩ)." },
            { op: "+", text: "Quy đồng mẫu trong divider_loaded_mv chỉ dùng 1 phép chia uint64_t, giữ độ chính xác mV." }
          ],
          kpis: [
            { label: "Không tải (10MΩ)", value: "2499 mV", sub: "Gần lý tưởng 5V / 2", tone: "sky" },
            { label: "Tải R_load = 10k", value: "1667 mV", sub: "R2_eff tụt còn 5 kΩ", tone: "rose" },
            { label: "Thévenin ADC", value: "≤ 10–20 kΩ", sub: "Đủ nạp tụ S&H ~5 pF", tone: "sage" }
          ],
          legend: [
            { label: "Nhánh trên R1", color: "#84b4df" },
            { label: "Song song R2 ∥ R_load", color: "#e57373" },
            { label: "Điểm đo ADC ổn định", color: "#84be88" }
          ],
          learnUnlock: [1],
          scene: {
            type: "flow",
            nodes: [
              ["Vin → R1", "Tổng trở lớn → ít hao pin, tổng trở nhỏ → khỏe"],
              ["R2 ∥ R_load", "Tải song song làm sụt R2_eff → sụt áp Vout"],
              ["divider_loaded_mv", "1 phép chia uint64_t khớp đúng số đo DMM"]
            ]
          }
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Làm chủ Đồng hồ vạn năng (DMM) & hiểm họa lỗ cắm 10A",
          body:
            "Quy tắc sống còn với DMM (que Đen luôn ở **`COM`**): (1) Đo **DC V (`V⎓`)**: que Đỏ ở **`V Ω mA`**, mạch **BẬT**, đặt **song song**; (2) Đo **Thông mạch (`Beep`)** & **Điện trở (`Ω`)**: que Đỏ ở **`V Ω mA`**, mạch **BẮT BUỘC TẮT HOÀN TOÀN** (đo `Ω` in-circuit bị các nhánh song song kéo nhỏ xuống); (3) Đo **Dòng (`10A`/`mA`)**: que Đỏ sang lỗ **`10A`**, **CẮT ĐỨT DÂY** mắc **NỐI TIẾP**. Lỗ `10A` nối tắt gần `0 Ω` qua shunt xuống `COM` — nếu quên chuyển que Đỏ về `V Ω mA` rồi chạm song song vào `VCC–GND` sẽ gây **ngắn mạch nổ cầu chì/cháy pin**! Mẹo an toàn: giữ que ở `V Ω mA` đo `mV` qua shunt `0,1 Ω` hoặc `1 Ω`.",
          codeLang: "Bảng quy trình đo DMM an toàn",
          code: `// 3 lỗ DMM:  [ 10A ]        [ COM ]        [ V Ω mA ]
//            Đỏ: dòng lớn   Đen: chung     Đỏ: áp, trở, thông mạch
//
// 1. COLD (Nguồn TẮT): đo Thông mạch 3V3 <-> GND (kêu bíp liên tục <30 Ω = CHẬP!)
// 2. HOT  (Nguồn BẬT): que Đỏ ở [V Ω mA], thang DC V -> đo song song VDD-GND
// 3. ĐO DÒNG AN TOÀN: gắn shunt 1 Ω nối tiếp -> đo V_shunt (mV) -> I(mA) = V_shunt(mV)/1`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Đo dòng xong phải RÚT que Đỏ khỏi lỗ 10A cắm trả ngay về lỗ V Ω mA! Khi đo thông mạch mạch có tụ lọc lớn, còi có thể kêu 'bíp' 0.2s lúc tụ nạp rồi im — chỉ là chập khi kêu kéo dài (< 30–50 Ω)."
          },
          diff: [
            { op: "+", text: "Luôn đo thông mạch 3V3–GND ở trạng thái TẮT NGUỒN (COLD) trước khi cấp điện lần đầu." },
            { op: "-", text: "Chạm que đo đang cắm lỗ 10A song song vào hai cực nguồn gây đoản mạch trực tiếp qua điện trở shunt mΩ." }
          ],
          kpis: [
            { label: "Đo DC V / Ω / Beep", value: "Lỗ V Ω mA", sub: "Ω & Beep: nguồn TẮT", tone: "sky" },
            { label: "Đo Dòng 10A", value: "Mắc NỐI TIẾP", sub: "Cấm chạm song song!", tone: "rose" },
            { label: "Mẹo đo dòng", value: "Shunt 0.1–1 Ω", sub: "Đo mV ở lỗ V Ω mA", tone: "sage" }
          ],
          legend: [
            { label: "Đo Nguội (COLD)", color: "#84b4df" },
            { label: "Đo Nóng (HOT)", color: "#e8ca78" },
            { label: "Hiểm họa ngắn mạch 10A", color: "#e57373" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["COLD: Beep / Ω", "Que ở V Ω mA, tắt nguồn kiểm tra chập 3V3–GND"],
              ["HOT: DC V (song song)", "Kiểm tra rail 5V / 3.3V / nút giữa phân áp"],
              ["Dòng: 10A nối tiếp / Shunt", "Trả que về V Ω mA ngay sau khi đo"]
            ]
          },
          openQuestions: [
            {
              id: "q-elec-ldo-dmm",
              scenario: "BÀI TOÁN MẠCH THẬT · CHIA ÁP & DMM",
              prompt:
                "1) Một bạn dùng cầu phân áp `10 kΩ / 10 kΩ` chia nguồn `5 V` để nuôi một cảm biến ăn dòng `10 mA` (tương đương tải `R_load ≈ 250 Ω` ở `2,5 V`) — điện áp cấp vào cảm biến thực tế sụt còn bao nhiêu và vì sao? 2) Bạn ấy vừa đo dòng bằng lỗ `10A` xong, quên rút que mà vặn núm sang DC V rồi chạm hai que vào `5 V` và `GND` của mạch: chuyện gì xảy ra tức thì?",
              placeholder: "Tính R2 || R_load (10k || 250 Ω) và giải thích cấu tạo nối tắt của lỗ 10A...",
              hint: "10 kΩ song song 250 Ω ≈ 244 Ω -> chia 5V với 10 kΩ chỉ còn ~120 mV! Còn lỗ 10A nối thông gần 0 Ω tới COM."
            }
          ]
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Đo DMM Nguội/Nóng & kiểm chứng C17 (electric-basic/01)",
          body:
            "Thực hiện bài `electric-basic/01-dc-ohm-power-dmm`: (1) Viết `submission.c` hoàn chỉnh 3 hàm `uint64_t` (`divider_loaded_mv`, `led_e12_design`, `power_budget_check`) chạy sạch `gcc -std=c17 -Wall -Wextra -Wpedantic -Werror -Wshadow -fsanitize=address,undefined` không dùng `float`; (2) Trên mạch thật (hoặc Falstad), tiến hành **Lab DMM Nguội**: đo trị số thật điện trở E12, kiểm tra thông mạch không chập nguồn; sau đó **Lab DMM Nóng**: đo `Vin`, `Vout` không tải và khi ghép thêm tải `R_load = 10 kΩ` để chứng minh sụt áp từ `~2,5 V` xuống `~1,67 V`.",
          codeLang: "C17 · assert kiểm chứng Bài 01 Điện tử",
          code: `/* gcc -std=c17 -Wall -Wextra -Wpedantic -Werror -Wshadow -fsanitize=address,undefined submission.c -o /tmp/eb_01 */
assert(ldo_heat_mw(12000U, 3300U, 300U, 0U) == 2610U);
assert(ldo_heat_mw(12000U, 3300U, 300U, 5000U) == 2670U);

uint32_t iin = 0U, pheat = 0U;
assert(buck_input_ma_and_heat_mw(12000U, 3300U, 300U, 90U, &iin, &pheat));
assert(iin == 92U && pheat == 110U);

assert(divider_loaded_mv(5000U, 10000U, 10000U, 10000000U) == 2499U);
assert(divider_loaded_mv(5000U, 10000U, 10000U, 10000U) == 1667U);
assert(divider_loaded_mv(12600U, 33000U, 10000U, 100000U) == 2721U);`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Luôn lập bảng Tính tay ↔ Đo thực tế ↔ % sai lệch trong answers.md. Sai số vài chục mV thường đến từ dung sai điện trở 5% và độ sụt nguồn USB/LDO thực tế."
          },
          diff: [
            { op: "+", text: "0 float/double trong code C; mọi phép tính công suất/áp vượt 32-bit đều dùng uint64_t." },
            { op: "+", text: "Thực hành đủ cả bước Nguội (COLD thông mạch/trở) trước khi bước sang bước Nóng (HOT đo áp)." }
          ],
          kpis: [
            { label: "Phần A (C17)", value: "50 điểm", sub: "divider, LED E12, budget", tone: "sky" },
            { label: "Phần B (DMM)", value: "30 điểm", sub: "COLD & HOT bring-up", tone: "amber" },
            { label: "Độ chính xác", value: "0 float", sub: "uint64_t làm tròn chuẩn", tone: "sage" }
          ],
          legend: [
            { label: "Tính C17 số nguyên", color: "#84b4df" },
            { label: "Lab DMM Nguội/Nóng", color: "#e8ca78" },
            { label: "Đối chiếu sai lệch", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["02_dc_power_self_check.c", "Kiểm tra công thức LDO / Buck / Loaded divider"],
              ["COLD DMM Check", "Đo R thật + Beep chống chập trước khi bật nguồn"],
              ["HOT DMM Measure", "Đo sụt áp khi gắn tải & đối chiếu bảng answers.md"]
            ]
          },
          quiz: [
            {
              prompt:
                "Cấp nguồn `12 V` xuống `3,3 V` cho tải `300 mA` (bỏ qua dòng tĩnh Iq). Công suất tỏa nhiệt trên LDO là bao nhiêu so với mạch Buck hiệu suất `90%`?",
              options: [
                "LDO tỏa 2610 mW; Buck tỏa 110 mW",
                "LDO tỏa 990 mW; Buck tỏa 990 mW",
                "LDO tỏa 110 mW; Buck tỏa 2610 mW"
              ],
              correctIndex: 0,
              explain:
                "LDO: (12 - 3.3) * 0.3 = 2.61 W (2610 mW). Buck: P_out = 3.3 * 0.3 = 990 mW, tổn hao = 990 * (10 / 90) = 110 mW."
            },
            {
              prompt:
                "Trước khi cắm điện vào mạch mới hàn xong, bạn cần kiểm tra chập đường `3.3V` và `GND` bằng cách nào?",
              options: [
                "Cắm que Đỏ ở lỗ 10A, bật nguồn mạch và đo song song 3.3V–GND",
                "Tắt hoàn toàn nguồn mạch, cắm que Đỏ vào lỗ V Ω mA, chọn thang Continuity/Ω và chạm 3.3V với GND",
                "Bật nguồn mạch rồi chọn thang Ω đo trực tiếp trên tụ nguồn"
              ],
              correctIndex: 1,
              explain:
                "Đo Continuity/Ω bắt buộc phải TẮT nguồn hoàn toàn (COLD) và que Đỏ nằm ở lỗ V Ω mA. Dùng lỗ 10A đo song song sẽ làm nổ cầu chì/chập nguồn ngay lập tức."
            }
          ]
        }
      ]
    },
    {
      id: "e-components-mosfet",
      number: "13",
      title: "Tụ 100nF Decoupling, Flyback Diode, MOSFET & Opto",
      duration: "55 phút",
      level: "Nền tảng",
      subtitle:
        "Bài 02 Điện tử · Tại sao tụ 100 nF phải đặt sát chân chip, dập xung ngược cuộn relay bằng Flyback Diode, chọn Logic-Level N-MOSFET vs BJT và cách ly Opto PC817.",
      locked: false,
      youllLearn: [
        "Phân biệt vai trò 3 loại tụ quanh MCU (Bulk 10–100 µF, Decoupling 100 nF sát VDD-VSS, Crystal 12–22 pF)",
        "Thiết kế mạch khóa Low-Side bằng Logic-Level N-MOSFET (tránh bẫy V_GS(th)) hoặc BJT NPN bão hòa (beta_sat = 10)",
        "Lắp Flyback Diode đúng chiều cho tải cảm và tính điện trở Optocoupler PC817 theo CTR_min"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Tụ 100nF Decoupling sát VDD-VSS & dập xung Flyback Diode",
          body:
            "Câu hỏi phỏng vấn kinh điển: *\"Có tụ hóa `100 µF` ở nguồn rồi sao vẫn phải gắn tụ gốm `100 nF` sát từng cặp `VDD–VSS`?\"* Vì tụ hóa lớn và đường đồng PCB có độ tự cảm ký sinh (ESL); khi nhân ARM chuyển mạch ở thang **vài nanosecond**, tụ hóa ở xa phản ứng không kịp, chỉ tụ gốm **`100 nF`** đặt sát chân mới cấp điện tích tức thời ngăn sụt áp treo chip. Còn tụ tải thạch anh là **`12–22 pF`** C0G. Với cuộn relay/motor, ngắt dòng đột ngột sinh xung cảm ứng **`V = −L · (dI/dt)`** vọt lên `+80..300 V` đánh thủng GPIO/MOSFET — bắt buộc mắc **Flyback Diode** song song cuộn dây với **vạch Cathode quay lên `+V_coil`**!",
          codeLang: "Sơ đồ tụ quanh MCU & Flyback Diode quanh cuộn Relay",
          code: `// 1) Tụ quanh MCU:
//   +3.3V ──┬──────────────┬────────────► VDD
//         [10..100uF]    [100nF X7R]      (100nF đặt SÁT CHÂN VDD-VSS nhất!)
//   GND   ──┴──────────────┴────────────► VSS
//
// 2) Flyback Diode quanh tải cảm (cuộn relay / motor DC):
//   +12V ───┬───────┬─── (Cathode có vạch trắng nối lên +12V!)
//        [Relay]   /▲\\  1N4007 / 1N4148
//           │       │
//           └───┬───┘──► Drain (N-MOSFET) hoặc Collector (BJT)`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Tuyệt đối KHÔNG hàn ngược vạch Cathode của Flyback diode xuống cực Drain/Collector! Nếu ngược, ngay khi MOSFET bật ON sẽ nối tắt nguồn +12V thẳng xuống GND qua diode làm cháy nổ linh kiện."
          },
          diff: [
            { op: "+", text: "Gắn 1 tụ gốm 100 nF (ESL thấp) sát từng cặp VDD–VSS giúp khử gai chuyển mạch nanosecond." },
            { op: "-", text: "Ngắt relay không có Flyback diode sinh xung −L·dI/dt đánh thủng bán dẫn ngay lần tắt đầu tiên." }
          ],
          kpis: [
            { label: "Decoupling", value: "100 nF gốm", sub: "Sát từng cặp VDD-VSS", tone: "sky" },
            { label: "Bulk / Crystal", value: "10–100µF / 12–22pF", sub: "Bể chứa / Dao động", tone: "amber" },
            { label: "Flyback Diode", value: "Cathode → +VCC", sub: "Chặn xung +80..300 V", tone: "rose" }
          ],
          legend: [
            { label: "Lọc cao tần 100 nF", color: "#84b4df" },
            { label: "Xung ngược −L dI/dt", color: "#e57373" },
            { label: "Vòng xả an toàn Flyback", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: { type: "mosfet_flyback_decap" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Logic-Level N-MOSFET (R_DS(on) @ 3.3V vs V_GS(th)) & BJT NPN bão hòa",
          body:
            "Chân GPIO STM32 chỉ chịu `≤ 20 mA`, nên để đóng tải lớn phải dùng khóa Low-Side. Nếu chọn **BJT NPN**, không dùng `h_FE = 150` mà phải ép hệ số bão hòa **`β_sat = 10`** (`R_B ≤ (V_GPIO − 0,7) × 10 / I_C`, ví dụ relay `70 mA` → `R_B ≤ 371 Ω` → chọn E12 **`330 Ω`**; tải `500 mA` quá sức GPIO). Với **N-MOSFET**, đừng nhìn `V_GS(th) = 2–4 V` của `IRF540N` — đó chỉ là ngưỡng mở hé `250 µA`! Phải chọn **Logic-Level MOSFET** (như `AO3400` cam kết **`R_DS(on) = 32 mΩ @ 3,3 V`** → `2 A` chỉ tỏa `128 mW`, thay vì `8000 mW` cháy khét!), và gắn đủ **2 điện trở Gate**: `R_G = 100 Ω` (hạn dòng nạp tụ Gate/dập dao động) + `R_PD = 10 kΩ` (giữ Gate ở `0 V` lúc MCU reset).",
          codeLang: "C17 · tổn hao MOSFET & kiểm tra cầu phân áp chân Gate",
          code: `/* P_cond (mW) = I_load^2 * R_DS(on) */
uint32_t mosfet_cond_loss_mw(uint32_t i_load_ma, uint32_t rds_on_mohm) {
    uint64_t p_nw = (uint64_t)i_load_ma * i_load_ma * rds_on_mohm;
    return (uint32_t)((p_nw + 500000ULL) / 1000000ULL);
}
/* AO3400 (32 mΩ @ 3.3V) @ 2 A  -> 128 mW (mát)
 * IRF540N thiếu áp (Rds ~ 2 Ω)  -> 8000 mW (cháy!)
 * Bẫy Gate: R_G = 100 Ω + R_PD = 10 kΩ -> V_GS = 3267 mV (ĐẠT).
 * Nhầm R_G = 10 kΩ + R_PD = 10 kΩ     -> V_GS = 1650 mV (CHIA ĐÔI ÁP, HỎNG!)
 */`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "R_G nối tiếp và R_PD kéo xuống đất tạo thành cầu phân áp tại chân Gate! Luôn giữ R_G nhỏ (47–220 Ω) và R_PD lớn hơn ít nhất 50–100 lần (10 kΩ – 100 kΩ) để không làm tụt V_GS."
          },
          diff: [
            { op: "+", text: "Kiểm tra mục R_DS(on) trong datasheet phải ghi cụ thể tại V_GS = 2.5V hoặc 3.3V (Logic-Level)." },
            { op: "-", text: "Tính BJT theo h_FE = 150 hoặc quên R_PD = 10 kΩ khiến BJT nóng bỏng / MOSFET tự chạy lúc MCU boot." }
          ],
          kpis: [
            { label: "AO3400 @ 2A", value: "128 mW", sub: "R_DS(on) = 32 mΩ @ 3.3V", tone: "sage" },
            { label: "Gate R_G + R_PD", value: "100 Ω + 10 kΩ", sub: "V_GS = 3267 mV", tone: "sky" },
            { label: "BJT bão hòa", value: "β_sat = 10", sub: "Chọn E12 <= R_B_max", tone: "amber" }
          ],
          legend: [
            { label: "MOSFET dẫn bão hòa", color: "#84be88" },
            { label: "Bẫy V_GS(th) / R_G lớn", color: "#e57373" },
            { label: "Điện trở Gate bắt buộc", color: "#84b4df" }
          ],
          learnUnlock: [1],
          scene: {
            type: "flow",
            nodes: [
              ["GPIO 3.3V → R_G 100Ω", "Chống dao động & giới hạn dòng nạp tụ Gate"],
              ["R_PD 10kΩ → GND", "Giữ MOSFET TẮT khi MCU reset / chân High-Z"],
              ["Logic-Level R_DS(on)", "P_cond = I² × R_DS(on) nhỏ, đóng mát tải vài Ampe"]
            ]
          },
          openQuestions: [
            {
              id: "q-elec-mosfet",
              scenario: "CHỌN TRANSISTOR ĐÓNG TẢI 12V / 2A",
              prompt:
                "1) Một sinh viên xem datasheet thấy `IRF540N` ghi `V_GS(th) = 2.0–4.0 V` liền nối thẳng vào GPIO STM32 `3.3 V` để đóng motor `12 V / 2 A`: tại sao MOSFET lại nóng rẫy và motor quay yếu? 2) Nếu bỏ quên điện trở kéo xuống `R_PD = 10 kΩ` ở chân Gate, điều nguy hiểm gì xảy ra trong 100 ms lúc STM32 vừa cấp điện hoặc đang nạp code?",
              placeholder: "Phân tích ý nghĩa thật của V_GS(th) (dòng 250 µA) và trạng thái High-Z của chân MCU lúc reset...",
              hint: "V_GS(th) chỉ là điểm mới hé mở 250 µA, không phải R_DS(on) định mức; khi reset chân GPIO ở trạng thái thả nổi (Input High-Z) nên tụ Gate giữ điện hoặc bắt nhiễu."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Cách ly quang Optocoupler (PC817) & Quy tắc giảm tải công suất 50%",
          body:
            "Khi đọc tín hiệu nút bấm/cảm biến `24 V` trong tủ điện công nghiệp hoặc điều khiển tải nhiễu nặng, **không được nối chung `GND_24V` với `GND_MCU`** — xung biến tần sẽ đánh thẳng vào MCU. **Optocoupler (`PC817`)** truyền tín hiệu bằng tia hồng ngoại bên trong vỏ kín (cách ly `3–5 kV`). Dòng LED đầu vào tối thiểu phụ thuộc **CTR (`Current Transfer Ratio = I_C / I_F`)**: với `PC817` lấy `CTR_min = 50%` và nhân thêm hệ số an toàn `2×` chống lão hóa LED/nhiệt độ. Đồng thời kiểm tra công suất điện trở (`50% derating`): tỏa `76 mW` phải dùng `1206` (`250 mW`) hoặc `1/4 W`, không dùng `0603` (`100 mW`).",
          codeLang: "C17 · tính dòng LED Optocoupler theo CTR_min & derating",
          code: `/* Làm tròn LÊN (ceiling) để đảm bảo đủ dòng bão hòa Phototransistor thứ cấp */
uint32_t opto_input_current_ua(uint32_t ic_load_ua, uint32_t ctr_min_pct) {
    if (ic_load_ua == 0U || ctr_min_pct == 0U) return 0U;
    uint64_t num = (uint64_t)ic_load_ua * 100ULL;
    return (uint32_t)((num + ctr_min_pct - 1ULL) / ctr_min_pct);
}
/* Ví dụ: phía MCU kéo pull-up 4.7 kΩ ở 3.3V -> Ic ≈ 702 µA.
 * Với CTR_min = 50% -> If_min = 1404 µA (nhân an toàn 2x -> thiết kế If ~ 3–5 mA).
 * Điện trở đầu 24V: P_R = I^2 * R -> giữ <= 50% công suất định mức vỏ SMD!
 */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Optocoupler chỉ phát huy tác dụng cách ly nếu hai miền nguồn và hai dây GND hoàn toàn tách rời (không nối chung GND_24V với GND_MCU)!"
          },
          diff: [
            { op: "+", text: "Tính dòng LED Opto dựa trên CTR_min (ví dụ 50%) chứ không dùng CTR điển hình, và chừa hệ số 2×." },
            { op: "+", text: "Tuân thủ 50% power derating cho điện trở (0603 <= 50 mW, 0805 <= 62 mW, 1206 <= 125 mW)." }
          ],
          kpis: [
            { label: "Cách ly PC817", value: "3–5 kV", sub: "Tách hoàn toàn GND_24V", tone: "sky" },
            { label: "CTR_min", value: "50% (×2 margin)", sub: "I_F >= 2 × I_C / CTR", tone: "amber" },
            { label: "Derating R", value: "≤ 50% P_rated", sub: "76 mW → chọn 1206", tone: "sage" }
          ],
          legend: [
            { label: "Miền 24V nhiễu (GND_24V)", color: "#e57373" },
            { label: "Hàng rào quang PC817", color: "#e8ca78" },
            { label: "Miền MCU 3.3V sạch", color: "#84be88" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["+24V + R_in (derating 50%)", "Tạo dòng I_F an toàn cho LED sơ cấp"],
              ["PC817 Optical Barrier", "Truyền ánh sáng hồng ngoại, cách ly GND"],
              ["Phototransistor → GPIO", "Pull-up 4.7 kΩ về 3.3V kích cạnh sạch"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Mạch N-MOSFET 12V + Flyback & C17 (electric-basic/02)",
          body:
            "Hoàn thành `electric-basic/02-passive-active-components`: (1) Trong `submission.c` viết 3 hàm `npn_switch_design` (tìm E12 `<= R_B_max`), `mosfet_driver_budget` (`P_cond` + kiểm tra cầu `R_G/R_PD`), và `opto_input_design` (kiểm tra derating `50%` vỏ điện trở); (2) Trên mạch thật hoặc **Falstad CircuitJS**, lắp mạch Low-Side N-MOSFET (`IRLZ44N` / `2N7000` / `AO3400`) đóng tải cảm `12 V` kích bởi `3,3 V` kèm `R_G = 100–220 Ω`, `R_PD = 10–100 kΩ` và Flyback diode, rồi quan sát đỉnh xung tại chân `Drain` khi tắt tải lúc **có** vs **bỏ tạm** Flyback diode.",
          codeLang: "C17 · assert kiểm chứng Bài 02 Điện tử",
          code: `/* 1) BJT NPN bão hòa (beta_sat = 10): relay 5V / 70mA -> R_B_max = 371 Ω -> E12 = 330 Ω */
assert(bjt_base_resistor_max_ohm(3300U, 700U, 70U, 10U) == 371U);

/* 2) Tổn hao MOSFET dẫn 2 A */
assert(mosfet_cond_loss_mw(2000U, 32U) == 128U);    /* AO3400 @ 3.3V */
assert(mosfet_cond_loss_mw(2000U, 2000U) == 8000U); /* IRF540N thiếu áp -> cháy */

/* 3) Mạch Gate chuẩn 100 Ω / 10 kΩ -> V_GS = 3267 mV >= 2500 mV */
uint32_t vgs = 0U;
assert(mosfet_gate_pulldown_check(3300U, 100U, 10000U, 2500U, &vgs) && vgs == 3267U);
assert(!mosfet_gate_pulldown_check(3300U, 10000U, 10000U, 2500U, &vgs)); /* 1650 mV */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Khác với LED (chọn E12 >= R_ideal để không quá dòng), thiết kế bão hòa BJT bắt buộc chọn điện trở E12 <= R_B_max để bảo đảm I_B >= I_C / 10!"
          },
          diff: [
            { op: "+", text: "Bật đủ 3 assert kiểm tra BJT floor E12, tổn hao MOSFET mW và cầu phân áp Gate R_G/R_PD." },
            { op: "+", text: "Ghi lại đỉnh xung Flyback đo được ở Drain trong answers.md trước và sau khi gắn diode." }
          ],
          kpis: [
            { label: "Phần A (C17)", value: "50 điểm", sub: "BJT, MOSFET, Opto", tone: "sky" },
            { label: "Phần B (Lab)", value: "30 điểm", sub: "Low-Side 12V + Flyback", tone: "amber" },
            { label: "Gói kiểm thử", value: "ASan + UBSan", sub: "0 cảnh báo -Werror", tone: "sage" }
          ],
          legend: [
            { label: "Kiểm tra thiết kế C17", color: "#84b4df" },
            { label: "Đo V_GS, V_DS, I_D", color: "#e8ca78" },
            { label: "So sánh xung Flyback", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["02_components_self_check.c", "Kiểm tra công thức BJT / MOSFET / Opto"],
              ["Falstad / Breadboard", "Đo V_GS, V_DS lúc ON và OFF tải 12V"],
              ["Flyback Scope Check", "So sánh xung Drain có và không có 1N4007"]
            ]
          },
          quiz: [
            {
              prompt:
                "Thông số nào trong datasheet chứng minh một con N-MOSFET có thể đóng mở hoàn toàn (trở kháng dẫn thấp) khi kích thẳng từ chân GPIO `3,3 V`?",
              options: [
                "V_GS(th) ghi tối đa 4.0 V",
                "Bảng đặc tính R_DS(on) được cam kết giá trị mΩ cụ thể tại V_GS = 2.5 V hoặc 3.3 V (Logic-Level)",
                "Điện áp cực đại V_DS = 100 V"
              ],
              correctIndex: 1,
              explain:
                "V_GS(th) chỉ là ngưỡng hé mở vài trăm µA. Chỉ khi datasheet ghi rõ R_DS(on) ở V_GS <= 3.3V (Logic-Level MOSFET như AO3400/IRLML2502) mới kích mát từ GPIO 3.3V được."
            },
            {
              prompt:
                "Khi mắc Flyback Diode bảo vệ cuộn dây relay `+12 V` điều khiển bởi Low-Side N-MOSFET (Drain nối đầu dưới cuộn dây), đầu có vạch trắng (Cathode) của diode phải nối về đâu?",
              options: [
                "Nối về phía cực Drain của N-MOSFET",
                "Nối nối tiếp vào chân Gate",
                "Nối lên nguồn +12 V (còn Anode nối vào cực Drain của N-MOSFET)"
              ],
              correctIndex: 2,
              explain:
                "Khi MOSFET bật ON, diode phân cực ngược nên không dẫn; khi MOSFET tắt OFF, cuộn dây đảo cực đẩy dòng quay vòng qua diode lên +12V, kẹp áp Drain chỉ ở ~12.7 V."
            }
          ]
        }
      ]
    },
    {
      id: "e-opamp-rc",
      number: "14",
      title: "Ngưỡng Logic, Op-Amp Đệm/Khuếch đại & Lọc RC",
      duration: "60 phút",
      level: "Trung bình",
      subtitle:
        "Bài 03–04 Điện tử · Ngưỡng V_IL/V_IH & bẫy 3.3V→5V CMOS, silicon sau ODR/TIMx, 3 mạch Op-Amp Rail-to-Rail, bộ lọc RC biến PWM thành DC và song sinh EMA.",
      locked: false,
      youllLearn: [
        "Tính biên độ nhiễu NM_H / NM_L và nối ghép logic 3.3V/5V tránh vùng cấm shoot-through",
        "Ứng dụng 3 mạch Op-Amp (Buffer, Non-Inverting RRIO, Schmitt Comparator) và thiết kế lọc RC bậc 1 (τ, fc)",
        "Cài đặt song sinh phần mềm EMA y += (x - y) / k và chống nhiễu ADC qua VDDA & Sampling Time"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Ngưỡng Logic (NM_H/NM_L), bẫy 3.3V→5V CMOS & Silicon sau ODR/TIMx",
          body:
            "Để hai chip giao tiếp tin cậy cần Biên độ nhiễu **`NM_H = V_OH(min) − V_IH(min) ≥ 200 mV`** và **`NM_L = V_IL(max) − V_OL(max) ≥ 200 mV`**. Vùng giữa `V_IL..V_IH` là **vùng cấm**: cả P-MOS và N-MOS cổng vào cùng mở tạo dòng rò shoot-through và lật bit loạn. Một MCU `3,3 V` (`V_OH = 2900 mV`) nói tốt với `5 V TTL / 74HCT` (`V_IH = 2000 mV` → `NM_H = +900 mV`) nhưng **LỖI với `5 V CMOS / 74HC`** (`V_IH = 3500 mV` → `NM_H = −600 mV`!). Dưới lớp C: mỗi bit trong `GPIOx->ODR` là một **D Flip-Flop** nhớ trạng thái, còn `TIMx` (`PSC`, `ARR`, `CCR`) là mạch đếm nhị phân phần cứng.",
          codeLang: "C17 · kiểm tra tương thích logic & Timer PWM (PSC/ARR/CCR)",
          code: `/* Biên độ nhiễu giữa Driver (V_OH, V_OL) và Receiver (V_IH, V_IL) */
bool logic_levels_compatible(int32_t voh_mv, int32_t vol_mv,
                             int32_t vih_mv, int32_t vil_mv,
                             int32_t min_margin_mv) {
    int32_t nm_h = voh_mv - vih_mv;
    int32_t nm_l = vil_mv - vol_mv;
    return (nm_h >= min_margin_mv) && (nm_l >= min_margin_mv);
}
/* 3.3V (2900/400) -> 5V TTL (2000/800)  : NM_H = +900 mV, NM_L = +400 mV (ĐẠT)
 * 3.3V (2900/400) -> 5V CMOS (3500/1500): NM_H = -600 mV (HỎNG!)
 *
 * Timer PWM: f_pwm = f_clk / ((PSC + 1) * (ARR + 1))
 *            CCR   = ((ARR + 1) * duty_permille) / 1000
 */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Mọi biểu thức bitwise (&, |, ^, ~) trong C đều điều khiển các cổng logic silicon thật, từng bit thanh ghi ODR nằm trên D Flip-Flop, và PWM phần cứng chỉ là bộ đếm TIMx so sánh CNT < CCR!"
          },
          diff: [
            { op: "+", text: "3.3 V MCU kết nối an toàn với họ 74HCT (TTL threshold 2.0 V) nhưng cần level-shifter cho họ 74HC (3.5 V)." },
            { op: "+", text: "Biểu diễn duty PWM bằng duty_permille (0..1000) trong C thay cho float 0.0..1.0." }
          ],
          kpis: [
            { label: "3.3V → 5V TTL", value: "NM_H = +900 mV", sub: "V_IH = 2000 mV (Đạt)", tone: "sage" },
            { label: "3.3V → 5V CMOS", value: "NM_H = -600 mV", sub: "V_IH = 3500 mV (Lỗi!)", tone: "rose" },
            { label: "ODR / TIMx", value: "D-FF / Counter", sub: "Silicon phía sau C", tone: "sky" }
          ],
          legend: [
            { label: "Đạt Noise Margin", color: "#84be88" },
            { label: "Âm Margin / Vùng cấm", color: "#e57373" },
            { label: "Thanh ghi D-FF & Timer", color: "#84b4df" }
          ],
          learnUnlock: [0],
          scene: {
            type: "flow",
            nodes: [
              ["Driver V_OH / V_OL", "So với Receiver V_IH / V_IL"],
              ["NM_H & NM_L >= 200 mV", "Bắt lỗi 3.3V → 5V CMOS (-600 mV)"],
              ["D-FF (ODR) & TIMx", "PSC, ARR, CCR xuất PWM không tốn CPU"]
            ]
          }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "3 mạch Op-Amp cho nhúng & Lọc thông thấp RC biến PWM thành DC",
          body:
            "Ba mạch Op-Amp cần thuộc lòng: (1) **Voltage Follower (Buffer, `Av = 1`)**: ngõ vào `GΩ` không rút dòng cảm biến, ngõ ra `< 1 Ω` nạp tụ S&H của ADC trong tích tắc; (2) **Non-Inverting (`Av = 1 + Rf/Rg`)**: khuếch đại điện áp shunt `0..200 mV` ×`16` lên `0..3200 mV` (`Rg = 1 kΩ, Rf = 15 kΩ`) — trên mạch `3,3 V` **bắt buộc dùng Op-Amp Rail-to-Rail (`MCP6001`)** vì `LM358` chỉ kéo lên tối đa `VCC − 1,5 V = 1,8 V`!; (3) **Schmitt Comparator (`LM393`)**: hồi tiếp dương chống rung quanh ngưỡng. Để biến xung PWM thành áp DC phẳng, dùng **lọc thông thấp RC bậc 1**: **`τ = R·C`** (`5τ` xác lập `99,3%`), **`fc = 159154943 / (R_Ω · C_nF)`**, chọn `fc ≤ f_PWM / 10`.",
          codeLang: "C17 · tính τ, tần số cắt fc & khuếch đại Op-Amp Rail-to-Rail",
          code: `/* 1) Hằng số thời gian τ (µs) và tần số cắt fc (Hz) cho mạch RC bậc 1 */
uint32_t rc_tau_us(uint32_t r_ohm, uint32_t c_nf) {
    return (uint32_t)(((uint64_t)r_ohm * c_nf + 500ULL) / 1000ULL);
}
uint32_t rc_cutoff_hz(uint32_t r_ohm, uint32_t c_nf) {
    uint64_t rc = (uint64_t)r_ohm * c_nf;
    return (rc == 0ULL) ? 0U : (uint32_t)((159154943ULL + rc / 2ULL) / rc);
}
/* 10 kΩ + 100 nF -> tau = 1000 µs (5*tau = 5 ms), fc = 159 Hz.
 * Với PWM 10 kHz (duty 50%) -> ra DC cực phẳng ~1650 mV! */

/* 2) Non-inverting Op-Amp kẹp giới hạn nguồn đơn (Rail-to-Rail vs LM358) */
uint32_t opamp_noninv_mv(uint32_t vin_mv, uint32_t rg_ohm, uint32_t rf_ohm, uint32_t vout_max_mv) {
    uint64_t v = ((uint64_t)vin_mv * ((uint64_t)rg_ohm + rf_ohm) + rg_ohm / 2ULL) / rg_ohm;
    return (v > vout_max_mv) ? vout_max_mv : (uint32_t)v;
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "LM358 KHÔNG phải Rail-to-Rail! Khi cấp nguồn đơn 3.3 V, LM358 bị kẹp trần ở khoảng 1.8 V — không thể dùng khuếch đại tín hiệu shunt lên thang 3.2 V của ADC STM32."
          },
          diff: [
            { op: "+", text: "R = 10 kΩ, C = 100 nF cho fc = 159 Hz, lọc cực sạch PWM 10 kHz (159 Hz << 10 kHz / 10)." },
            { op: "-", text: "PWM 50 Hz đi qua cặp RC 159 Hz gần như không bị lọc; phải hạ fc <= 2 Hz (chậm 400 ms!)." }
          ],
          kpis: [
            { label: "10kΩ + 100nF", value: "τ=1ms / fc=159Hz", sub: "5τ = 5 ms (99.3%)", tone: "sky" },
            { label: "Shunt 0.1Ω ×16", value: "0..3200 mV", sub: "Tận dụng 97% dải ADC", tone: "sage" },
            { label: "Op-Amp 3.3V", value: "RRIO (MCP6001)", sub: "LM358 chỉ lên ~1.8 V", tone: "rose" }
          ],
          legend: [
            { label: "Op-Amp Buffer / Gain", color: "#84b4df" },
            { label: "Lọc RC bậc 1 (τ, fc)", color: "#84be88" },
            { label: "Giới hạn Rail / Ripple", color: "#e57373" }
          ],
          learnUnlock: [1],
          scene: { type: "opamp_rc_filter" },
          openQuestions: [
            {
              id: "q-elec-opamp-rc",
              scenario: "THIẾT KẾ ANALOG 3.3V · OP-AMP & LỌC RC",
              prompt:
                "1) Bạn dùng `LM358` cấp nguồn đơn `3,3 V` cho mạch khuếch đại không đảo `Av = 16` (`Rg = 1 kΩ, Rf = 15 kΩ`) để đọc áp shunt `0..200 mV`: tại sao ADC chỉ đọc kịch kim khoảng `1,8 V` dù dòng thực đang ở mức `2 A` (`200 mV × 16 = 3,2 V`)? 2) Tại sao bộ lọc `10 kΩ + 100 nF` (`fc ≈ 159 Hz`) tạo áp DC phẳng khi PWM chạy `10 kHz`, nhưng lại nhảy gợn dữ dội khi PWM chạy `50 Hz`?",
              placeholder: "Giải thích trần áp ra của LM358 vs RRIO và tỷ số giữa f_PWM với tần số cắt fc = 159 Hz...",
              hint: "LM358 chỉ đạt Vout_max ≈ VCC - 1.5 V ≈ 1.8 V; để lọc mượt PWM, tần số cắt fc phải nhỏ hơn f_PWM ít nhất 10 lần."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Song sinh số EMA `y += (x - y) / k` & chống nhiễu ADC (`VDDA`, S&H)",
          body:
            "Phương trình vi phân bộ lọc RC bậc 1 dịch sang firmware chỉ tốn **1 dòng C số nguyên**: **`y += (x - y) / k`** (EMA — Exponential Moving Average). Đặt `k ≈ τ / T_sample`: sau `k` bước `y` đạt `~63,2%`, sau `3k` đạt `95%`, sau `5k` đạt `> 99%`! Chú ý bẫy **truncation deadband**: khi `|x − y| < k`, phép chia nguyên cho `0` khiến `y` dừng non (ví dụ `x = 1000, k = 10` dừng ở `991`); hãy lưu bộ tích lũy nhân sẵn `k` (`acc`) nếu cần bám khít `1000`. Ở phần cứng, luôn tách lọc chân **`VDDA`** bằng `100 nF // 1–4.7 µF` + ferrite bead (`50 mV` nhiễu nguồn gây nhảy **`62 LSB`**!) và tăng `SMPR` khi trở kháng nguồn lớn.",
          codeLang: "C17 · EMA số nguyên & khắc phục truncation deadband",
          code: `/* 1) EMA đơn giản: có truncation deadband khi |x - y| < k */
int32_t ema_naive_step(int32_t y, int32_t x, int32_t k) {
    return y + (x - y) / k; /* x=1000, k=10 -> dừng ở 991! */
}

/* 2) EMA chính xác dùng scaled accumulator (lưu state = y * k) */
int32_t ema_scaled_step(int32_t *acc_scaled, int32_t x, int32_t k) {
    int32_t y = (*acc_scaled + (k / 2)) / k;
    *acc_scaled = *acc_scaled - y + x;
    return (*acc_scaled + (k / 2)) / k; /* bám sát 1000 không bị hụt k-1! */
}`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "ADC 12-bit 3.3V có 1 LSB ≈ 806 µV. Chỉ cần 50 mV gợn xung trên đường VDDA hoặc trở kháng nguồn > 100 kΩ chưa tăng Sampling Time (SMPR) là số đọc ADC đã nhảy loạn dù code C đúng 100%!"
          },
          diff: [
            { op: "+", text: "k bước của EMA y += (x - y) / k tương ứng chính xác 1 hằng số thời gian τ của mạch RC." },
            { op: "-", text: "Chia nguyên trực tiếp (x - y) / k dừng lại ở x - (k - 1); dùng scaled accumulator sẽ bám tới đúng x." }
          ],
          kpis: [
            { label: "1 LSB (12b/3.3V)", value: "806 µV", sub: "50 mV gợn = 62 LSB!", tone: "rose" },
            { label: "EMA 1τ / 5τ", value: "k bước / 5k bước", sub: "63.2% / >99% xác lập", tone: "sky" },
            { label: "Deadband fix", value: "Scaled acc", sub: "Tránh dừng non ở 991", tone: "sage" }
          ],
          legend: [
            { label: "EMA naive (cắt dư)", color: "#e8ca78" },
            { label: "EMA scaled chính xác", color: "#84be88" },
            { label: "Lọc VDDA & tụ S&H", color: "#84b4df" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["VDDA + S&H (SMPR)", "Lọc 100nF//1µF + ferrite bead giảm nhiễu LSB"],
              ["EMA y += (x - y) / k", "Song sinh số của bộ lọc thông thấp RC bậc 1"],
              ["Scaled accumulator", "Khử sai số k - 1 do cắt phần dư phép chia nguyên"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · PWM-to-DC RC Filter & Op-Amp Scaling (electric-basic/03 & 04)",
          body:
            "Hoàn thiện bài `electric-basic/03-digital-logic-gpio` & `04-analog-adc-pwm-opamp`: (1) Viết các hàm C17 số nguyên `pwm_calc_timer_params(f_clk, target_hz, duty_permille, &out)` (chọn `psc` nhỏ nhất để tối đa độ phân giải `ARR`), `rc_cutoff_hz`, `opamp_noninv_mv`, `ema_step` chạy sạch ASan/UBSan; (2) Trong Lab phần cứng/Falstad, xuất xung PWM `10 kHz` (hoặc `1 kHz`) lần lượt ở `25%`, `50%`, `75%` đi qua bộ lọc `R = 10 kΩ, C = 100 nF` (hoặc `1 µF`) rồi đo điện áp DC phẳng sau tụ để đối chiếu với `3300 × duty / 1000` và biên độ ripple còn lại.",
          codeLang: "C17 · assert kiểm chứng Timer PWM, RC & EMA",
          code: `/* 04_practice_and_lab.md — kiểm tra không float */
pwm_params_t p;
assert(pwm_calc_timer_params(72000000U, 20000U, 500U, &p));
assert(p.psc == 0U && p.arr == 3599U && p.ccr == 1800U && p.actual_hz == 20000U);

assert(pwm_avg_mv(3300U, 500U) == 1650U);
assert(rc_tau_us(10000U, 100U) == 1000U);
assert(rc_cutoff_hz(10000U, 100U) == 159U);
assert(opamp_noninv_mv(200U, 1000U, 15000U, 3300U) == 3200U);
assert(opamp_noninv_mv(200U, 1000U, 15000U, 1800U) == 1800U); /* kẹp trần LM358 */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Khi chọn PSC/ARR cho Timer PWM, luôn chọn PSC nhỏ nhất sao cho ARR <= 65535 để CCR có độ phân giải mịn nhất có thể."
          },
          diff: [
            { op: "+", text: "Mọi phép tính tần số PWM, fc bộ lọc RC và độ lợi Op-Amp đều chạy bằng uint64_t không dùng float." },
            { op: "+", text: "Đối chiếu V_DC đo được sau lọc RC ở duty 25%, 50%, 75% với giá trị kỳ vọng 825, 1650, 2475 mV." }
          ],
          kpis: [
            { label: "Timer 72 MHz", value: "20 kHz → ARR=3599", sub: "PSC=0, CCR(50%)=1800", tone: "sky" },
            { label: "RC Low-Pass", value: "10kΩ + 100nF", sub: "fc = 159 Hz", tone: "amber" },
            { label: "Mức DC 50%", value: "≈ 1650 mV", sub: "PWM 3.3V thành DAC", tone: "sage" }
          ],
          legend: [
            { label: "Tính PSC / ARR / CCR", color: "#84b4df" },
            { label: "Lọc RC & Op-Amp", color: "#ad9cd8" },
            { label: "Đo DC & Ripple", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["02_analog_pwm_rc_self_check.c", "Kiểm chứng PSC/ARR, fc, Op-Amp, EMA"],
              ["Lab PWM + RC", "Xuất PWM 10 kHz qua 10 kΩ / 100 nF"],
              ["Đo DMM / Scope", "Kiểm tra DC 825 / 1650 / 2475 mV và độ gợn"]
            ]
          },
          quiz: [
            {
              prompt:
                "Với mạch lọc thông thấp RC dùng `R = 10 kΩ` và `C = 100 nF`, hằng số thời gian `τ` và thời gian xác lập hoàn toàn (`5τ`, đạt ~99,3%) bằng bao nhiêu?",
              options: [
                "τ = 100 µs và 5τ = 500 µs",
                "τ = 1 ms (1000 µs) và 5τ = 5 ms",
                "τ = 10 ms và 5τ = 50 ms"
              ],
              correctIndex: 1,
              explain:
                "τ = R × C = 10,000 Ω × 100 nF = 1,000,000 ns = 1000 µs = 1 ms. Thời gian xác lập 5τ = 5 ms."
            },
            {
              prompt:
                "Khi dùng bộ lọc số nguyên `y += (x - y) / k` với `k = 10` và đầu vào bước nhảy `x = 1000` (khởi đầu `y = 0`), vì sao `y` dừng lại ở `991` mà không chạm `1000`?",
              options: [
                "Vì biến y bị tràn số",
                "Vì khi |x - y| < 10 (từ y = 991 trở đi), phép chia nguyên (1000 - 991) / 10 = 9 / 10 bị cắt phần dư thành 0",
                "Vì hệ số làm mượt k = 10 quá nhỏ"
              ],
              correctIndex: 1,
              explain:
                "Phép chia nguyên làm tròn về 0 nên mọi bước sai lệch nhỏ hơn k đều cho thương bằng 0 (truncation deadband)."
            }
          ]
        }
      ]
    },
    {
      id: "e-serial-datasheet",
      number: "15",
      title: "Điện lý UART/I2C/SPI/CAN, Datasheet & Logic Analyzer",
      duration: "65 phút",
      level: "Trung bình",
      subtitle:
        "Bài 05–06 & P1 · Vật lý đường truyền UART/I2C/SPI/CAN, đọc Datasheet 15 phút (ΣI_VDD, FT/TT, t_su/t_h), 5 khối Schematic, Smoke Test 6 bước & Board Bring-Up P1.",
      locked: false,
      youllLearn: [
        "Giải thích bản chất điện và bẫy của UART (8N1, <=2%), I2C (Open-Drain, tr, 7b/8b), SPI (Mode 0..3) và CAN (120 Ω)",
        "Đọc nhanh 5 bảng Datasheet (ΣI_VDD, FT vs TT/ADC, t_su/t_h) và nhận diện 5 khối Schematic STM32",
        "Dùng đúng DMM / USB Logic Analyzer (PulseView) / Oscilloscope và thực hiện Smoke Test 6 bước trong Lab Bring-Up P1"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Điện lý 4 chuẩn truyền thông: UART, I2C, SPI & CAN/RS485",
          body:
            "**UART (`TX↔RX` + chung `GND`)**: truyền bất đồng bộ `8N1` (**LSB-first**, 10 bit-time/byte), sai số baud phải `≤ 2%` (`20‰`) để không trượt khỏi tâm bit thứ 10. **I2C (`SDA/SCL`)**: tầng ra **Open-Drain** nên **bắt buộc có trở Pull-up ngoài (`2,2–4,7 kΩ`)** — thiếu pull-up cả bus sập về `0 V`! Sườn lên phải đạt **`t_r ≈ 0,8473 · R_p · C_bus ≤ 300 ns`** ở `400 kHz`; chú ý bẫy địa chỉ 7-bit `0x68` (`MPU6050`) sang byte 8-bit `0xD0` (`W`) / `0xD1` (`R`), kiểm tra `ACK/NACK` và 9 xung `SCL` cứu treo bus. **SPI**: Push-Pull `10–50+ MHz` (**MSB-first**), sai Mode `(CPOL, CPHA)` làm dữ liệu dịch 1 bit. **CAN/RS485**: cặp dây xoắn **vi sai** khử nhiễu đồng pha + gắn **đúng 2 điện trở `120 Ω` ở 2 đầu mút** (`120 ∥ 120 = 60 Ω`).",
          codeLang: "C17 · kiểm tra I2C tr (ns), sai số baud & địa chỉ 7-bit/8-bit",
          code: `/* 1) Thời gian tăng I2C (ns): tr ≈ 0.8473 * Rp * C_bus */
uint32_t i2c_rise_time_ns(uint32_t rp_ohm, uint32_t c_bus_pf) {
    uint64_t num = 8473ULL * rp_ohm * c_bus_pf + 5000000ULL;
    return (uint32_t)(num / 10000000ULL);
}
/* Rp = 4.7 kΩ, C_bus = 100 pF -> 398 ns (đạt 100 kHz <= 1000ns, HỎNG 400 kHz <= 300ns!)
 * Hạ Rp = 2.2 kΩ             -> 186 ns (ĐẠT 400 kHz!) */

/* 2) Chuyển địa chỉ I2C 7-bit sang byte đầu tiên 8-bit trên dây */
uint8_t i2c_addr8(uint8_t addr7, bool is_read) {
    return (uint8_t)((addr7 << 1U) | (is_read ? 1U : 0U)); /* 0x68 + W -> 0xD0 */
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Tuyệt đối KHÔNG lắp điện trở 120 Ω ở mọi node trên bus CAN/RS485! Nếu lắp cho 6 node, tổng trở song song sụt còn 120/6 = 20 Ω gây quá dòng bộ phát và sập bus. Chỉ lắp ở ĐÚNG 2 ĐẦU TRỤC CHÍNH."
          },
          diff: [
            { op: "+", text: "UART gửi LSB-first (bit 0 trước); I2C và SPI gửi MSB-first (bit 7 trước)." },
            { op: "-", text: "Nhầm địa chỉ 7-bit (0x68) với 8-bit đã dịch (0xD0) là nguyên nhân #1 gây NACK khi mới lập trình I2C." }
          ],
          kpis: [
            { label: "UART Baud err", value: "≤ 2% (20‰)", sub: "8N1 LSB-first + GND chung", tone: "sky" },
            { label: "I2C Fast 400k", value: "tr ≤ 300 ns", sub: "Rp 2.2k–4.7k, 0x68→0xD0", tone: "amber" },
            { label: "CAN / RS485", value: "2 × 120 Ω", sub: "Ở 2 đầu bus (tải 60 Ω)", tone: "sage" }
          ],
          legend: [
            { label: "UART (LSB) / SPI (MSB)", color: "#84b4df" },
            { label: "I2C Open-Drain & ACK", color: "#e8ca78" },
            { label: "CAN/RS485 Vi sai 120Ω", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: { type: "serial_buses_wave" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Đọc Datasheet 15 phút (ΣI_VDD, FT vs TT, t_su/t_h) & 5 khối Schematic",
          body:
            "**Datasheet** (~150 trang) chứa thông số điện/chân/timing, đừng nhầm với **Reference Manual** (~1500 trang) chứa địa chỉ thanh ghi! Đọc 5 bảng Datasheet trước khi thiết kế: (1) **Absolute Max**: ngoài dòng từng chân `±25 mA`, chú ý **tổng dòng toàn chip `ΣI_VDD ≤ 120–150 mA`** (cắm 10 LED × `15 mA` = `150 mA` + CPU sẽ sập brownout/hỏng cổng dù mỗi chân dưới `25 mA`!); (2) **Operating Conditions**: `VDDA` tối thiểu cho ADC; (3) **`FT` vs `TT/TC` & `AF`**: chân `FT` chịu `5 V` khi là Digital nhưng **MẤT khả năng chịu `5 V` nếu bật sang Analog (`ADC`)**; (4) **DC Characteristics**; (5) **Timing (`t_su`, `t_h`)**. Trên Schematic STM32 luôn soi đủ **5 khối**: Nguồn+LDO, MCU+`100 nF` mỗi cặp `VDD-VSS`+`VDDA`, `NRST` (`100 nF`), Thạch anh+`BOOT0` (`10 kΩ → GND`), và `SWD` (**CẤM gắn tụ `100 nF` lên `SWDIO/SWCLK`**!).",
          codeLang: "C17 · kiểm tra giới hạn chân & timing Datasheet (02_datasheet_limits)",
          code: `/* 1) Kiểm tra ngân sách dòng chân & tổng ΣI_VDD trong Datasheet */
bool mcu_check_pin_budget(uint32_t pin_ma, uint32_t num_active_pins,
                          uint32_t cpu_ma, uint32_t max_pin_ma,
                          uint32_t max_total_vdd_ma) {
    if (pin_ma > max_pin_ma) return false;
    return (pin_ma * num_active_pins + cpu_ma) <= max_total_vdd_ma;
}
/* 10 LED * 15 mA + 25 mA CPU = 175 mA > ΣI_VDD (120..150 mA) -> SẬP CHIP! */

/* 2) Kiểm tra timing SPI: nửa chu kỳ T_half >= t_co + t_skew + t_su */
bool spi_calc_timing_ns(uint32_t f_sck_hz, uint32_t t_co_ns,
                        uint32_t t_skew_ns, uint32_t t_su_ns) {
    uint32_t t_half_ns = 500000000U / f_sck_hz;
    return t_half_ns >= (t_co_ns + t_skew_ns + t_su_ns);
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Tuyệt đối KHÔNG sao chép mạch chống dội tụ 100 nF gắn vào chân SWCLK hay SWDIO! Tụ 100 nF làm méo sạch xung nạp MHz khiến ST-Link báo 'No target connected'."
          },
          diff: [
            { op: "-", text: "Kéo 10 LED × 15 mA trực tiếp từ GPIO tuy dưới ±25 mA/chân nhưng làm quá tải ΣI_VDD (120–150 mA)." },
            { op: "+", text: "Kiểm tra cột I/O structure: chân FT chỉ chịu 5V ở chế độ Digital; khi bật ADC phải hạ về <= VDDA + 0.3V." }
          ],
          kpis: [
            { label: "Tổng chip ΣI_VDD", value: "120–150 mA", sub: "Giới hạn dây vàng bond-wire", tone: "rose" },
            { label: "Chân FT ở ADC", value: "Mất chịu 5V!", sub: "Kẹp lại về VDDA + 0.3V", tone: "amber" },
            { label: "SWCLK / SWDIO", value: "0 tụ 100 nF", sub: "Để nguyên xung MHz sạch", tone: "sage" }
          ],
          legend: [
            { label: "Giới hạn ΣI_VDD / FT", color: "#e57373" },
            { label: "Timing t_su / t_h", color: "#e8ca78" },
            { label: "5 khối Schematic chuẩn", color: "#84b4df" }
          ],
          learnUnlock: [1],
          scene: { type: "datasheet_pin_budget" },
          openQuestions: [
            {
              id: "q-elec-serial-ds",
              scenario: "DEBUG PHẦN CỨNG · DATASHEET & I2C",
              prompt:
                "1) Một board STM32 điều khiển 10 LED (mỗi LED ăn `15 mA`, nhỏ hơn giới hạn `±25 mA` mỗi chân), nhưng khi bật cả 10 LED cùng lúc thì chip reset liên tục và nóng cổng GPIO: thông số nào trong Datasheet đã bị vi phạm và sửa thế nào? 2) Nối module trần `MPU6050` vào `PB6/PB7` (`I2C1`), DMM đo `SDA` và `SCL` đều nằm bẹp ở `0 V` gây `TIMEOUT`: nguyên nhân điện lý là gì?",
              placeholder: "Nêu tên thông số tổng dòng nguồn ΣI_VDD + cách lái ngoài, và vai trò điện trở Pull-up của I2C Open-Drain...",
              hint: "1) So sánh 10 × 15 mA + CPU với ΣI_VDD (120–150 mA); giải pháp dùng transistor/MOSFET hoặc driver. 2) I2C Open-Drain chỉ kéo xuống 0 V được chứ không tự đẩy lên 3.3 V nếu thiếu Pull-up."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "DMM vs Logic Analyzer (PulseView) vs Oscilloscope & Smoke Test 6 bước",
          body:
            "Mỗi dụng cụ nhìn một thế giới: **DMM** đo áp DC tĩnh và dò chập `Ω`, nhưng mù trước gói tin; **USB Logic Analyzer `24 MHz` + `PulseView`** (đặt Sample Rate `≥ 4–10×` tốc độ bus) giải mã từng bit UART/I2C/SPI để bắt sai baudrate, `NACK`, sai `CPOL/CPHA`; **Oscilloscope** soi dáng sóng analog thật như sườn `t_r` I2C, gợn nguồn, thời gian nảy phím và xung Flyback. Trước khi cấp điện cho mạch mới trên **Breadboard** (cẩn thận thanh nguồn 830 lỗ bị ngắt ở giữa và 5 lỗ cùng cột nối tắt!) hay mạch vừa hàn **3 giây**, bắt buộc chạy **Smoke Test 6 bước**.",
          codeLang: "Quy trình Smoke Test 6 bước trước khi cấp điện",
          code: `// Smoke Test 6 bước (BẮT BUỘC trước khi cắm USB/nguồn chính):
// 1. Soi mắt: cực tính tụ hóa/diode/LED, chấm chân 1 IC, cầu thiếc.
// 2. Đo chập (COLD DMM): 3V3 <-> GND, 5V <-> GND (> 50 Ω, không bíp kéo dài!).
// 3. Cách ly liên nguồn: không đoản mạch 5V <-> 3V3 hay SWDIO/SWCLK <-> GND.
// 4. Thử nguồn không tải MCU: kiểm tra đầu ra LDO đúng 3300 mV ± 2%.
// 5. Cấp điện 3 giây qua hub/nguồn hạn dòng: sờ kiểm tra nhiệt LDO & MCU.
// 6. Kiểm tra khởi chạy: NRST ~3.3V, dòng tĩnh ~10..40 mA, ST-Link đọc được Chip ID.`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Trong PulseView, muốn giải mã I2C 400 kHz hay SPI 2 MHz không bị răng cưa sai bit, luôn chỉnh Sample Rate lên 8–24 MHz (tối thiểu gấp 4–10 lần tần số xung clock của bus)."
          },
          diff: [
            { op: "+", text: "Logic Analyzer bắt lỗi giao thức (NACK, sai Mode SPI, lệch baud); Scope soi độ dốc tr và gợn analog." },
            { op: "-", text: "80% lỗi breadboard 830 lỗ do quên nối cầu giữa thanh nguồn +/- bị ngắt đôi ở chính giữa." }
          ],
          kpis: [
            { label: "Logic Analyzer", value: "24 MHz (≥4–10×)", sub: "Giải mã UART/I2C/SPI", tone: "sky" },
            { label: "Oscilloscope", value: "Analog V(t)", sub: "Soi tr, ripple, bounce", tone: "amber" },
            { label: "Smoke Test", value: "6 bước bắt buộc", sub: "Chặn cháy LDO/MCU", tone: "sage" }
          ],
          legend: [
            { label: "DMM + Smoke Test", color: "#84be88" },
            { label: "PulseView Protocol", color: "#84b4df" },
            { label: "Scope Analog V(t)", color: "#ad9cd8" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["Smoke Test 6 bước", "Soi mắt → Đo chập COLD → Thử LDO → Hạn dòng 3s"],
              ["USB Logic Analyzer", "Mẫu ≥4–10× bus, giải mã UART/I2C/SPI trong PulseView"],
              ["Oscilloscope", "Đo sườn tr I2C, bounce nút nhấn, xung Flyback"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Board Bring-Up Lab 4 chặng P1 & Thanh ghi Bare-Metal",
          body:
            "Hoàn thiện đồ án tốt nghiệp Điện cơ bản `electric-basic/p1-board-bringup-lab`: (1) **Chặng 1 (20đ)**: Dựng 4 mạch rời (chia áp `12,6 V`, LED E12, nút pull-up, Low-Side MOSFET + Flyback) trên mạch thật hoặc Falstad; (2) **Chặng 2 (30đ)**: Firmware không dùng `delay()` chặn CPU — Heartbeat LED `500 ms`, nút nhấn chống dội, đọc ADC 12-bit bằng `uint64_t` 0 `float`, ánh xạ PWM; (3) **Chặng 3 (30đ)**: UART CLI qua Ring Buffer tĩnh + đọc `WHO_AM_I` I2C/SPI + lưu sóng `.vcd`/`.sr` giải mã trên **PulseView**; (4) **Chặng 4 (20đ)**: Điều khiển trực tiếp thanh ghi `volatile uint32_t` (`RCC`, `MODER` RMW, `BSRR`) không dùng HAL GPIO + kiểm chứng `test_reg_mock.c` trên WSL!",
          codeLang: "C17 · bare-metal struct & test_reg_mock.c (P1 Chặng 4)",
          code: `typedef struct {
    volatile uint32_t MODER;
    volatile uint32_t OTYPER;
    volatile uint32_t OSPEEDR;
    volatile uint32_t PUPDR;
    volatile uint32_t IDR;
    volatile uint32_t ODR;
    volatile uint32_t BSRR;
} bare_gpio_t;

/* RMW cấu hình chân pin thành Output (01) giữ nguyên 100% các chân khác */
void gpio_set_output(bare_gpio_t *gpio, uint8_t pin) {
    uint32_t shift = (uint32_t)pin * 2U;
    gpio->MODER = (gpio->MODER & ~(UINT32_C(3) << shift)) | (UINT32_C(1) << shift);
}
/* Set/Reset nguyên tử: gpio->BSRR = UINT32_C(1) << pin; / << (pin + 16U); */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Với bare-metal STM32, luôn bật clock ngoại vi trong RCC TRƯỚC khi chạm vào MODER/ODR! Trong test_reg_mock.c, kiểm chứng bit hàng xóm bằng assert giữ nguyên mặt nạ ngoài chân mục tiêu."
          },
          diff: [
            { op: "+", text: "0 float trong firmware đo mV / nhiệt độ / duty PWM; 0 delay() chặn superloop." },
            { op: "+", text: "Chặng 3 có tệp sóng PulseView kèm bảng giải mã bit UART (LSB-first) và giao dịch I2C/SPI." }
          ],
          kpis: [
            { label: "Chặng 1 & 2", value: "50 điểm", sub: "Mạch rời + Superloop ADC/PWM", tone: "sky" },
            { label: "Chặng 3", value: "30 điểm", sub: "RingBuf CLI + I2C + PulseView", tone: "amber" },
            { label: "Chặng 4", value: "20 điểm", sub: "Bare-metal RMW + test_reg_mock", tone: "sage" }
          ],
          legend: [
            { label: "Chặng 1–2: Điện & ADC/PWM", color: "#84b4df" },
            { label: "Chặng 3: PulseView Decode", color: "#e8ca78" },
            { label: "Chặng 4: Bare-Metal Regs", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["Chặng 1–2 (Mạch & ADC/PWM)", "4 mạch rời + superloop 0 float, 0 delay"],
              ["Chặng 3 (UART + I2C + Logic)", "RingBuf CLI + WHO_AM_I + sóng PulseView"],
              ["Chặng 4 (Bare-Metal RMW)", "RCC + MODER/BSRR + test_reg_mock trên WSL"]
            ]
          },
          quiz: [
            {
              prompt:
                "Datasheet cảm biến `MPU6050` ghi địa chỉ I2C 7-bit là `0x68` (khi `AD0 = 0`). Byte đầu tiên được truyền thực tế trên đường dây SDA cho thao tác **Ghi (Write)** là giá trị nào?",
              options: ["0x68", "0xD0", "0xD1"],
              correctIndex: 1,
              explain:
                "Byte địa chỉ I2C 8-bit gồm 7 bit địa chỉ nằm ở [7:1] và bit R/W nằm ở [0] (0 = Write). Do đó (0x68 << 1) | 0 = 0xD0 (còn Read là 0xD1)."
            },
            {
              prompt:
                "Trên bus **CAN** hoặc **RS485** gồm 4 node nối theo trục chính dùng cáp xoắn đôi (`Z0 = 120 Ω`), cần lắp điện trở kết thúc `120 Ω` ở những vị trí nào?",
              options: [
                "Lắp 120 Ω ở tất cả 4 node để chống nhiễu đồng đều",
                "Chỉ lắp đúng 2 điện trở 120 Ω ở hai đầu mút ngoài cùng của trục chính (tải song song = 60 Ω)",
                "Chỉ lắp 1 điện trở 120 Ω ở giữa bus"
              ],
              correctIndex: 1,
              explain:
                "Đường truyền cần khớp trở kháng đặc tính 120 Ω ở đúng hai đầu mút (120 || 120 = 60 Ω). Lắp ở mọi node làm tụt trở kháng tương đương xuống quá thấp và gây quá dòng."
            }
          ]
        }
      ]
    }
  ];
}
