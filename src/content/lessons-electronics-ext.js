export function createElectronicsExtLessons() {
  return [
    {
      id: "e-power-rails-dmm",
      number: "12",
      title: "Nguồn 3.3V/5V, hạ áp & đo Đồng hồ vạn năng an toàn",
      duration: "50 phút",
      level: "Nền tảng",
      subtitle:
        "Tính nhiệt tỏa trên mạch hạ áp LDO vs Buck, tránh hỏng chân chip khi nối nhầm 5V→3.3V, tính sụt áp cầu phân áp có tải và dùng đồng hồ vạn năng (DMM) an toàn không nổ cầu chì.",
      locked: false,
      youllLearn: [
        "Tính lượng nhiệt tỏa của mạch hạ áp LDO P = (Vin - Vout) × I so với mạch Buck hiệu suất cao",
        "Ngăn hiện tượng cấp nguồn ngược 5V → 3.3V qua diode bảo vệ chân và tính sụt áp cầu phân áp có tải",
        "Đo áp DC, thông mạch, điện trở và dòng điện bằng đồng hồ vạn năng (DMM) đúng lỗ cắm, không chập mạch lỗ 10A"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Nhiệt hạ áp LDO vs Buck, bẫy 5V→3.3V & 3 cách đổi mức áp",
          body:
            "Mạch hạ áp tuyến tính LDO (`AMS1117-3.3`) đốt toàn bộ điện áp dư thành nhiệt: hạ `12 V → 3,3 V @ 300 mA` tỏa ra `(12000 − 3300) × 300 / 1000 = 2610 mW` (`2,61 W`) khiến IC nóng rực và ngắt nhiệt ngay; trong khi mạch chuyển mạch **Buck `90%`** chỉ rút `~92 mA` ở `12 V` và tỏa `110 mW` (mát hơn **23 lần**!). Ở chân GPIO `3,3 V` thường (không chịu `5 V`), đưa thẳng tín hiệu `5 V` làm **diode bảo vệ trên (`D_up`)** dẫn ở `> VDD + 0,3 V` bơm ngược áp lên đường `3,3 V`. Hãy dùng: (1) Cầu phân áp (1 chiều chậm), (2) `BSS138` (2 chiều cho I2C), hoặc (3) IC đệm `74LVC245` (SPI tốc độ cao).",
          codeLang: "C · tính nhiệt LDO/Buck & kiểm tra an toàn chân 3.3V",
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

/* Kiểm tra áp vào chân GPIO 3.3V (chống dẫn ngược lên đường nguồn) */
bool is_safe_3v3_input_mv(uint32_t v_in_mv, bool is_5v_tol, uint32_t vdd_mv) {
    if (vdd_mv < 2700U || vdd_mv > 3600U) return false; /* VDD tắt -> cấm cấp ngược */
    return is_5v_tol ? (v_in_mv <= 5500U) : (v_in_mv <= vdd_mv + 300U);
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Kiến trúc chuẩn thực tế: dùng Buck hạ 12V/24V → 5V lấy hiệu suất cao, rồi nối qua LDO sụt áp thấp 5V → 3.3V để lọc sạch nhiễu xung cho ADC và mạch thu phát!"
          },
          diff: [
            { op: "-", text: "LDO 12 V → 3,3 V @ 300 mA đốt 2,61 W làm chip vượt 150 °C; Buck 90% chỉ tỏa 110 mW." },
            { op: "+", text: "Chân thường chỉ chịu tối đa VDD + 300 mV; VDD = 0 V mà cắm tín hiệu 5 V gây cấp ngược nguy hiểm." }
          ],
          kpis: [
            { label: "LDO 12V→3.3V", value: "2610 mW", sub: "Sập nhiệt ở 300 mA", tone: "rose" },
            { label: "Buck 90%", value: "110 mW", sub: "I_in ≈ 92 mA @ 12V", tone: "sage" },
            { label: "Chân thường max", value: "VDD + 0.3V", sub: "Ngưỡng dẫn diode bảo vệ", tone: "amber" }
          ],
          legend: [
            { label: "LDO (nhiệt = ΔV × I)", color: "#e57373" },
            { label: "Buck (hiệu suất cao)", color: "#84be88" },
            { label: "Đổi mức 5V ↔ 3.3V", color: "#84b4df" }
          ],
          learnUnlock: [0],
          scene: { type: "power_ldo_vs_buck" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Cầu phân áp CÓ TẢI (R_load ∥ R2) & chọn tổng trở tối ưu",
          body:
            "Đo không tải bằng DMM (`R_load = 10 MΩ`), cầu `10 kΩ / 10 kΩ` chia `5 V` ra đẹp `2499 mV`. Nhưng nếu cắm tải `R_load = 10 kΩ` vào `Vout`, **`R_load` mắc song song với `R2`** khiến nhánh dưới tụt còn `10 kΩ ∥ 10 kΩ = 5 kΩ` và điện áp sụt mạnh xuống **`1667 mV`**! Vì thế tuyệt đối **không dùng cầu phân áp để cấp nguồn** cho module. Khi chọn điện trở cầu phân áp đo pin vào chân ADC, phải cân bằng hai đầu: trở quá nhỏ (`100 Ω`) gây hao pin, còn trở quá lớn (`1 MΩ`) khiến tụ lấy mẫu (~`5 pF`) bên trong ADC không nạp kịp.",
          codeLang: "C · tính cầu phân áp có tải không sai số làm tròn",
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
            text: "Với mạch đo điện áp pin vào ADC, chọn điện trở sao cho tổng trở tương đương R1 ∥ R2 ≤ 10–20 kΩ (ví dụ 30 kΩ / 10 kΩ hoặc 33 kΩ / 10 kΩ cho pin 12,6 V) và có tụ lọc 100 nF tại chân ADC nếu tín hiệu chậm."
          },
          diff: [
            { op: "-", text: "Cầu 10k/10k từ 5V sụt từ 2499 mV xuống 1667 mV ngay khi cắm tải chỉ ăn 0,17 mA (10 kΩ)." },
            { op: "+", text: "Quy đồng mẫu trong divider_loaded_mv chỉ dùng 1 phép chia uint64_t, giữ độ chính xác mV." }
          ],
          kpis: [
            { label: "Không tải (10MΩ)", value: "2499 mV", sub: "Gần lý tưởng 5V / 2", tone: "sky" },
            { label: "Tải R_load = 10k", value: "1667 mV", sub: "R2_eff tụt còn 5 kΩ", tone: "rose" },
            { label: "Trở tương đương", value: "≤ 10–20 kΩ", sub: "Đủ nạp tụ ADC ~5 pF", tone: "sage" }
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
          title: "Đo Đồng hồ vạn năng (DMM) an toàn & hiểm họa lỗ cắm 10A",
          body:
            "Quy tắc an toàn sống còn với DMM (que Đen luôn ở **`COM`** — luôn kiểm tra **núm vặn + lỗ cắm que Đỏ** trước khi chạm mạch!): (1) Đo **Áp DC (`V⎓`)**: que Đỏ ở **`V Ω mA`**, mạch **BẬT**, đặt **song song**; (2) Đo **Thông mạch (`Beep`)** & **Điện trở (`Ω`)**: que Đỏ ở **`V Ω mA`**, mạch **BẮT BUỘC TẮT HOÀN TOÀN**; (3) Đo **Dòng (`10A`/`mA`)**: que Đỏ sang lỗ **`10A`**, **CẮT ĐỨT DÂY** mắc **NỐI TIẾP**. **CẤM TUYỆT ĐỐI** đo dòng trực tiếp qua pin Li-ion hay hai cực nguồn! Lỗ `10A` nối tắt gần `0 Ω` xuống `COM` — chạm song song vào pin/nguồn sẽ **nổ cầu chì, tóe lửa hoặc cháy phồng pin**! Mẹo an toàn: giữ que ở `V Ω mA` đo `mV` qua điện trở shunt `0,1–1 Ω`.",
          codeLang: "Quy trình đo DMM an toàn",
          code: `// 3 lỗ DMM:  [ 10A ]        [ COM ]        [ V Ω mA ]
//            Đỏ: dòng lớn   Đen: chung     Đỏ: áp, trở, thông mạch
//
// 0. KIỂM TRA TRƯỚC KHI ĐO: Núm vặn + lỗ cắm que Đỏ khớp đúng đại lượng cần đo!
// 1. NGUỒI (Nguồn TẮT): đo Thông mạch 3V3 <-> GND (kêu bíp liên tục <30 Ω = CHẬP!)
// 2. NÓNG  (Nguồn BẬT): que Đỏ ở [V Ω mA], thang DC V -> đo song song VDD-GND
// 3. ĐO DÒNG AN TOÀN: gắn shunt 1 Ω nối tiếp -> đo V_shunt (mV) -> I(mA) = V_shunt(mV)/1`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "CẤM đo dòng trực tiếp hai đầu pin Li-ion hay nguồn cấp! Đo dòng xong phải RÚT que Đỏ khỏi lỗ 10A cắm trả ngay về V Ω mA. Lúc đo thông mạch tụ lớn có thể kêu 'bíp' 0.2s rồi im — chỉ là chập khi kêu kéo dài (< 30–50 Ω)."
          },
          diff: [
            { op: "+", text: "Luôn kiểm tra núm vặn + lỗ que Đỏ và đo thông mạch 3V3–GND khi TẮT NGUỒN trước khi cấp điện lần đầu." },
            { op: "-", text: "Chạm que lỗ 10A trực tiếp lên pin Li-ion hoặc hai cực nguồn gây đoản mạch nổ cầu chì / cháy pin." }
          ],
          kpis: [
            { label: "Đo DC V / Ω / Beep", value: "Lỗ V Ω mA", sub: "Ω & Beep: nguồn TẮT", tone: "sky" },
            { label: "Đo Dòng 10A", value: "Mắc NỐI TIẾP", sub: "Cấm chạm thẳng pin/nguồn!", tone: "rose" },
            { label: "Mẹo đo dòng", value: "Shunt 0.1–1 Ω", sub: "Đo mV ở lỗ V Ω mA", tone: "sage" }
          ],
          legend: [
            { label: "Đo Nguội (Tắt nguồn)", color: "#84b4df" },
            { label: "Đo Nóng (Bật nguồn)", color: "#e8ca78" },
            { label: "Hiểm họa ngắn mạch 10A", color: "#e57373" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["Nguội: Beep / Ω", "Que ở V Ω mA, tắt nguồn kiểm tra chập 3V3–GND"],
              ["Nóng: DC V (song song)", "Kiểm tra rail 5V / 3.3V / nút giữa phân áp"],
              ["Dòng: 10A nối tiếp / Shunt", "Trả que về V Ω mA ngay sau khi đo"]
            ]
          },
          openQuestions: [
            {
              id: "q-elec-ldo-dmm",
              scenario: "BÀI TOÁN MẠCH THẬT · CHIA ÁP & AN TOÀN DMM",
              prompt:
                "1) Một bạn dùng cầu phân áp `10 kΩ / 10 kΩ` chia nguồn `5 V` để nuôi cảm biến ăn dòng `10 mA` (tương đương tải `R_load ≈ 250 Ω` ở `2,5 V`) — điện áp cấp vào cảm biến thực tế sụt còn bao nhiêu và vì sao? 2) Bạn ấy vừa đo dòng bằng lỗ `10A` xong, quên rút que mà chạm thẳng hai que vào hai cực pin Li-ion hoặc `5 V` và `GND` của mạch: chuyện gì xảy ra tức thì?",
              placeholder: "Tính R2 || R_load (10k || 250 Ω) và giải thích cấu tạo nối tắt của lỗ 10A...",
              hint: "10 kΩ song song 250 Ω ≈ 244 Ω -> chia 5V với 10 kΩ chỉ còn ~120 mV! Còn lỗ 10A nối thông gần 0 Ω tới COM nên gây ngắn mạch nổ cầu chì/cháy pin."
            }
          ]
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Đo DMM Nguội/Nóng & tính toán nguồn bằng C",
          body:
            "Thực hành kết hợp tính toán C và đo thực tế DMM: (1) Viết `submission.c` hoàn chỉnh 3 hàm `uint64_t` (`divider_loaded_mv`, `led_e12_design`, `power_budget_check`) chạy sạch `gcc -Wall -Wextra -Werror -Wshadow -fsanitize=address,undefined` không dùng `float`; (2) Trên mạch thật (hoặc mô phỏng Falstad), tiến hành **Đo Nguội**: đo trị số thật điện trở E12, kiểm tra thông mạch không chập nguồn; sau đó **Đo Nóng**: đo `Vin`, `Vout` không tải và khi ghép thêm tải `R_load = 10 kΩ` để chứng minh sụt áp từ `~2,5 V` xuống `~1,67 V`.",
          codeLang: "C · assert kiểm chứng tính nguồn & cầu phân áp",
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
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Luôn lập bảng Tính tay ↔ Đo thực tế ↔ % sai lệch trong báo cáo. Sai số vài chục mV thường đến từ dung sai điện trở 5% và độ sụt nguồn USB/LDO thực tế."
          },
          diff: [
            { op: "+", text: "0 float/double trong code C; mọi phép tính công suất/áp vượt 32-bit đều dùng uint64_t." },
            { op: "+", text: "Thực hành đủ bước đo Nguội (thông mạch/điện trở) trước khi bước sang bước đo Nóng (đo áp)." }
          ],
          kpis: [
            { label: "Phần A (Code C)", value: "50 điểm", sub: "divider, LED E12, budget", tone: "sky" },
            { label: "Phần B (DMM)", value: "30 điểm", sub: "Đo Nguội & Nóng an toàn", tone: "amber" },
            { label: "Độ chính xác", value: "0 float", sub: "uint64_t làm tròn chuẩn", tone: "sage" }
          ],
          legend: [
            { label: "Tính số nguyên C", color: "#84b4df" },
            { label: "Lab DMM Nguội/Nóng", color: "#e8ca78" },
            { label: "Đối chiếu sai lệch", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["Hàm tính toán C", "Kiểm tra công thức LDO / Buck / cầu phân áp"],
              ["Đo Nguội DMM", "Đo R thật + Beep chống chập trước khi bật nguồn"],
              ["Đo Nóng DMM", "Đo sụt áp khi gắn tải & ghi bảng đối chiếu"]
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
                "Đo Continuity/Ω bắt buộc phải TẮT nguồn hoàn toàn và que Đỏ nằm ở lỗ V Ω mA. Dùng lỗ 10A đo song song sẽ làm nổ cầu chì/chập nguồn ngay lập tức."
            }
          ]
        }
      ]
    },
    {
      id: "e-components-mosfet",
      number: "13",
      title: "Tụ lọc 100nF, Diode bảo vệ, MOSFET & Cách ly quang",
      duration: "55 phút",
      level: "Nền tảng",
      subtitle:
        "Vì sao tụ 100 nF phải đặt sát chân chip, dập xung ngược cuộn relay bằng diode bảo vệ (Flyback), chọn MOSFET kích 3.3V vs BJT và cách ly quang Opto PC817.",
      locked: false,
      youllLearn: [
        "Phân biệt vai trò 3 loại tụ quanh vi điều khiển (tụ lọc nguồn 10–100 µF, tụ 100 nF sát VDD-VSS, tụ thạch anh 12–22 pF)",
        "Thiết kế mạch khóa đóng cắt dùng Logic-Level N-MOSFET (tránh bẫy V_GS(th)) hoặc BJT NPN bão hòa, luôn tra datasheet linh kiện thật",
        "Lắp Diode bảo vệ đúng chiều cho tải cuộn dây và tính điện trở Optocoupler PC817 theo datasheet CTR_min"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Tụ lọc 100nF sát VDD-VSS & Diode bảo vệ cuộn cảm (Flyback)",
          body:
            "Câu hỏi phỏng vấn kinh điển: \"Có tụ hóa `100 µF` ở nguồn rồi sao vẫn phải gắn tụ gốm `100 nF` sát từng cặp `VDD–VSS`?\" Vì tụ hóa lớn và đường đồng PCB phản ứng chậm với xung chuyển mạch tốc độ **vài phần tỷ giây (nanosecond)** bên trong nhân chip; chỉ tụ gốm **`100 nF`** đặt sát chân mới cấp điện tức thời ngăn sụt áp treo chip. Tụ thạch anh là **`12–22 pF`**. Với cuộn relay/motor, ngắt dòng đột ngột sinh xung cảm ứng **`V = −L · (dI/dt)`** vọt lên `+80..300 V` đánh thủng MOSFET — bắt buộc mắc **Diode bảo vệ (Flyback)** song song cuộn dây với **vạch trắng (Cathode) quay lên `+V_coil`** (nếu muốn thử ngắt cuộn dây **KHÔNG** có diode để xem xung vọt, **CHỈ được thử trên mô phỏng Falstad CircuitJS**, tuyệt đối không thử trên mạch thật!).",
          codeLang: "Sơ đồ tụ quanh chip & Diode bảo vệ cuộn Relay",
          code: `// 1) Tụ quanh vi điều khiển:
//   +3.3V ──┬──────────────┬────────────► VDD
//         [10..100uF]    [100nF X7R]      (100nF đặt SÁT CHÂN VDD-VSS nhất!)
//   GND   ──┴──────────────┴────────────► VSS
//
// 2) Diode bảo vệ (Flyback) quanh tải cuộn dây (relay / motor DC):
//   +12V ───┬───────┬─── (Đầu vạch trắng Cathode nối lên +12V!)
//        [Relay]   /▲\\  1N5819 / 1N4007
//           │       │
//           └───┬───┘──► Drain (N-MOSFET) hoặc Collector (BJT)`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Tuyệt đối KHÔNG hàn ngược vạch Cathode xuống cực Drain/Collector (sẽ đoản mạch +12V khi bật!). Thử ngắt tải KHÔNG có diode bảo vệ CHỈ được làm trên mô phỏng Falstad CircuitJS — KHÔNG BAO GIỜ thử trên phần cứng thật!"
          },
          diff: [
            { op: "+", text: "Gắn 1 tụ gốm 100 nF sát từng cặp VDD–VSS giúp khử sụt áp chuyển mạch nanosecond." },
            { op: "-", text: "Ngắt relay ngoài đời thật mà thiếu diode bảo vệ sẽ sinh xung +80..300 V đánh thủng MOSFET ngay lập tức." }
          ],
          kpis: [
            { label: "Tụ lọc sát chân", value: "100 nF gốm", sub: "Sát từng cặp VDD-VSS", tone: "sky" },
            { label: "Tụ nguồn / Thạch anh", value: "10–100µF / 12–22pF", sub: "Bể chứa / Dao động", tone: "amber" },
            { label: "Diode bảo vệ", value: "Cathode → +VCC", sub: "Chặn xung +80..300 V", tone: "rose" }
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
          title: "Chọn MOSFET kích 3.3V (R_DS(on) vs V_GS(th)) & BJT NPN bão hòa",
          body:
            "Chân GPIO STM32 chỉ chịu `≤ 20 mA`, nên để đóng tải lớn phải dùng khóa Low-Side. Nếu chọn **BJT NPN**, không dùng `h_FE = 150` mà phải ép hệ số bão hòa **`β_sat = 10`** (`R_B ≤ (V_GPIO − 0,7) × 10 / I_C`, ví dụ relay `70 mA` → `R_B ≤ 371 Ω` → chọn E12 **`330 Ω`**; tải `500 mA` quá sức GPIO). Với **N-MOSFET**, đừng nhìn `V_GS(th) = 2–4 V` của `IRF540N` — đó chỉ là ngưỡng mới hé mở `250 µA`! Phải chọn **Logic-Level MOSFET** (luôn kiểm tra đúng bảng `R_DS(on)` tại `V_GS = 3,3 V` trong datasheet con bạn mua như `AO3400` hay `IRLZ44N`: ví dụ `AO3400` đạt `32 mΩ @ 3,3 V` → `2 A` chỉ tỏa `128 mW`, thay vì `8000 mW` cháy khét!), và gắn đủ **2 điện trở Gate**: `R_G = 100 Ω` + `R_PD = 10 kΩ` (kéo Gate về `0 V` lúc chip vừa khởi động).",
          codeLang: "C · tổn hao MOSFET & kiểm tra cầu phân áp chân Gate",
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
            text: "R_G nối tiếp và R_PD kéo xuống đất tạo thành cầu phân áp tại chân Gate! Luôn giữ R_G nhỏ (47–220 Ω) và R_PD lớn hơn 50–100 lần (10 kΩ – 100 kΩ), đồng thời kiểm tra lại giá trị R_DS(on) / V_GS trong datasheet đúng mã MOSFET bạn dùng."
          },
          diff: [
            { op: "+", text: "Kiểm tra mục R_DS(on) trong datasheet phải ghi cụ thể tại V_GS = 2.5V hoặc 3.3V (Logic-Level)." },
            { op: "-", text: "Tính BJT theo h_FE = 150 hoặc quên R_PD = 10 kΩ khiến BJT nóng bỏng / MOSFET tự chạy lúc chip reset." }
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
              ["R_PD 10kΩ → GND", "Giữ MOSFET TẮT khi chip reset / thả nổi"],
              ["Logic-Level R_DS(on)", "P_cond = I² × R_DS(on) nhỏ, đóng mát tải vài Ampe"]
            ]
          },
          openQuestions: [
            {
              id: "q-elec-mosfet",
              scenario: "CHỌN TRANSISTOR ĐÓNG TẢI 12V / 2A",
              prompt:
                "1) Một sinh viên xem datasheet thấy `IRF540N` ghi `V_GS(th) = 2.0–4.0 V` liền nối thẳng vào GPIO STM32 `3.3 V` để đóng motor `12 V / 2 A`: tại sao MOSFET lại nóng rẫy và motor quay yếu? 2) Nếu bỏ quên điện trở kéo xuống `R_PD = 10 kΩ` ở chân Gate, điều nguy hiểm gì xảy ra trong 100 ms lúc STM32 vừa cấp điện hoặc đang nạp code?",
              placeholder: "Phân tích ý nghĩa thật của V_GS(th) (dòng 250 µA) và trạng thái thả nổi của chân chip lúc reset...",
              hint: "V_GS(th) chỉ là điểm mới hé mở 250 µA, không phải R_DS(on) định mức; khi reset chân GPIO ở trạng thái thả nổi nên tụ Gate giữ điện hoặc bắt nhiễu."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Cách ly quang Optocoupler (PC817) & Quy tắc giảm tải công suất 50%",
          body:
            "Khi đọc tín hiệu nút bấm/cảm biến `24 V` trong tủ điện công nghiệp hoặc điều khiển tải nhiễu nặng, **không được nối chung `GND_24V` với `GND_MCU`** — xung biến tần sẽ đánh thẳng vào vi điều khiển. **Optocoupler (`PC817`)** truyền tín hiệu bằng tia hồng ngoại bên trong vỏ kín (cách ly `3–5 kV`). Dòng LED đầu vào tối thiểu phụ thuộc **tỷ số truyền dòng CTR (`I_C / I_F`)** ghi trong datasheet linh kiện (ví dụ `PC817` thường lấy `CTR_min = 50%`, nhân thêm hệ số an toàn `2×` chống lão hóa LED/nhiệt độ). Đồng thời kiểm tra công suất điện trở (`≤ 50%` định mức): tỏa `76 mW` phải dùng cỡ `1206` (`250 mW`) hoặc `1/4 W`, không dùng `0603` (`100 mW`).",
          codeLang: "C · tính dòng LED Optocoupler theo CTR_min & giảm tải",
          code: `/* Làm tròn LÊN (ceiling) để đảm bảo đủ dòng kích phototransistor đầu ra */
uint32_t opto_input_current_ua(uint32_t ic_load_ua, uint32_t ctr_min_pct) {
    if (ic_load_ua == 0U || ctr_min_pct == 0U) return 0U;
    uint64_t num = (uint64_t)ic_load_ua * 100ULL;
    return (uint32_t)((num + ctr_min_pct - 1ULL) / ctr_min_pct);
}
/* Ví dụ: phía vi điều khiển kéo pull-up 4.7 kΩ ở 3.3V -> Ic ≈ 702 µA.
 * Tra datasheet PC817 được CTR_min = 50% -> If_min = 1404 µA (nhân an toàn 2x -> 3–5 mA).
 * Điện trở đầu 24V: P_R = I^2 * R -> giữ <= 50% công suất định mức vỏ SMD!
 */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Optocoupler chỉ cách ly được nếu hai miền nguồn và hai dây GND tách rời nhau hoàn toàn! Luôn tra đúng CTR_min theo phân hạng (rank A/B/C) trong datasheet của PC817 bạn mua."
          },
          diff: [
            { op: "+", text: "Tính dòng LED Opto dựa trên CTR_min trong datasheet (ví dụ 50%) chứ không dùng CTR điển hình, và chừa hệ số 2×." },
            { op: "+", text: "Tuân thủ quy tắc dùng ≤ 50% công suất định mức cho điện trở (0603 <= 50 mW, 0805 <= 62 mW, 1206 <= 125 mW)." }
          ],
          kpis: [
            { label: "Cách ly PC817", value: "3–5 kV", sub: "Tách hoàn toàn GND_24V", tone: "sky" },
            { label: "CTR_min", value: "50% (×2 an toàn)", sub: "I_F >= 2 × I_C / CTR", tone: "amber" },
            { label: "Công suất R", value: "≤ 50% P_rated", sub: "76 mW → chọn 1206", tone: "sage" }
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
              ["+24V + R_in (≤50% P)", "Tạo dòng I_F an toàn cho LED sơ cấp"],
              ["PC817 Optical Barrier", "Truyền ánh sáng hồng ngoại, cách ly GND"],
              ["Phototransistor → GPIO", "Pull-up 4.7 kΩ về 3.3V kích cạnh sạch"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Mạch đóng cắt N-MOSFET 12V + Diode bảo vệ",
          body:
            "Thực hành đóng cắt tải cảm an toàn: (1) Trong `submission.c` viết 3 hàm `npn_switch_design` (tìm E12 `<= R_B_max`), `mosfet_driver_budget` (`P_cond` + kiểm tra cầu `R_G/R_PD` theo đúng `R_DS(on)`/`V_GS` datasheet), và `opto_input_design` (tính theo `CTR_min` và kiểm tra công suất `≤ 50%`); (2) Lắp mạch Low-Side N-MOSFET (`AO3400` / `IRLZ44N` / `2N7000`) đóng tải `12 V` kích bởi `3,3 V` kèm `R_G = 100–220 Ω`, `R_PD = 10–100 kΩ` và Diode bảo vệ (`1N5819` / `1N4007`). **Quy tắc an toàn bắt buộc**: chỉ kiểm tra hiện tượng xung vọt khi **BỎ** diode bảo vệ trên **mô phỏng Falstad CircuitJS** — trên mạch thật **BẮT BUỘC phải gắn sẵn diode bảo vệ** trước khi cấp điện!",
          codeLang: "C · assert kiểm chứng BJT, MOSFET & Opto",
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
            type: "watch-out",
            label: "CẢNH BÁO AN TOÀN",
            text: "Thử ngắt tải cảm KHÔNG có diode bảo vệ CHỈ làm trong mô phỏng Falstad CircuitJS! Trên mạch thật luôn gắn sẵn diode bảo vệ (Cathode hướng về +12V) trước khi bật nguồn. Ngoài ra, BJT bão hòa chọn E12 <= R_B_max để đủ dòng I_B >= I_C / 10."
          },
          diff: [
            { op: "+", text: "Bật đủ 3 assert kiểm tra BJT chọn E12 nhỏ hơn R_B_max, tổn hao MOSFET mW và cầu phân áp Gate R_G/R_PD." },
            { op: "+", text: "Đo xung vọt khi bỏ diode chỉ trên mô phỏng Falstad; mạch thật luôn gắn diode bảo vệ đúng chiều." }
          ],
          kpis: [
            { label: "Phần A (Code C)", value: "50 điểm", sub: "BJT, MOSFET, Opto", tone: "sky" },
            { label: "Phần B (Mạch/Mô phỏng)", value: "30 điểm", sub: "Low-Side 12V + Flyback", tone: "amber" },
            { label: "Kiểm thử", value: "ASan + UBSan", sub: "0 cảnh báo -Werror", tone: "sage" }
          ],
          legend: [
            { label: "Kiểm tra thiết kế bằng C", color: "#84b4df" },
            { label: "Đo V_GS, V_DS, I_D", color: "#e8ca78" },
            { label: "Thử xung Flyback trên Falstad", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["Kiểm tra bằng C", "Tính thông số BJT / MOSFET / Opto theo datasheet"],
              ["Mạch thật (có Diode)", "Đo V_GS, V_DS lúc bật/tắt tải 12V an toàn"],
              ["Falstad CircuitJS", "Mô phỏng an toàn xung Drain có vs không có Diode"]
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
                "V_GS(th) chỉ là ngưỡng hé mở vài trăm µA. Chỉ khi datasheet ghi rõ R_DS(on) ở V_GS <= 3.3V (Logic-Level MOSFET như AO3400/IRLZ44N) mới kích thẳng từ GPIO 3.3V được."
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
      title: "Mức 0/1, Bộ khuếch đại (Op-Amp) & Lọc tụ-trở (RC)",
      duration: "60 phút",
      level: "Trung bình",
      subtitle:
        "Hiểu mức áp 0/1 khi ghép nối 3.3V–5V, mạch đếm xuất PWM bên trong chip, bộ khuếch đại Op-Amp kéo sát nguồn, lọc RC biến xung PWM thành áp phẳng và lọc mượt trong code.",
      locked: false,
      youllLearn: [
        "Kiểm tra khoảng an toàn chống nhiễu (NM_H / NM_L) khi nối chip 3.3V với 5V và hiểu cách Timer tạo PWM",
        "Dùng 3 mạch Op-Amp thông dụng (đệm, khuếch đại sát nguồn, so sánh chống rung) và lọc tụ-trở RC",
        "Viết bộ lọc mượt EMA y += (x - y) / k trong code, tránh kẹt phần dư và chống nhiễu khi đo ADC"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Mức 0/1, ghép nối 3.3V–5V & mạch số bên trong chip",
          body:
            "Để hai chip hiểu đúng mức `0` và `1` ngay cả khi có nhiễu, khoảng an toàn chống nhiễu (Noise Margin) cần đạt **`NM_H = V_OH(min) − V_IH(min) ≥ 200 mV`** và **`NM_L = V_IL(max) − V_OL(max) ≥ 200 mV`**. Nếu áp rơi vào vùng lưng chừng (`V_IL..V_IH`), cả hai khóa bên trong cổng vào cùng hé mở gây tốn dòng và đọc sai bit. Một chip `3,3 V` (`V_OH = 2900 mV`) nói tốt với `5 V TTL / 74HCT` (`V_IH = 2000 mV` → dư `+900 mV`) nhưng **LỖI với `5 V CMOS / 74HC`** (`V_IH = 3500 mV` → hụt `−600 mV`!). Phía dưới code C: mỗi bit trong thanh ghi xuất `GPIOx->ODR` là một **mạch nhớ 1-bit (D Flip-Flop)**, còn bộ định thời `TIMx` (`PSC`, `ARR`, `CCR`) là mạch đếm phần cứng tự xuất xung PWM không tốn CPU.",
          codeLang: "C · kiểm tra ghép nối mức 0/1 & Timer PWM (PSC/ARR/CCR)",
          code: `/* Kiểm tra khoảng an toàn mức 0/1 giữa bên phát (V_OH, V_OL) và bên thu (V_IH, V_IL) */
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
            text: "Mỗi phép gán bit (&, |, ^, ~) trong C đều bật/tắt các mạch nhớ phần cứng trong chip, còn PWM phần cứng chỉ là bộ đếm TIMx tự động so sánh CNT < CCR để xuất mức 1 hoặc 0!"
          },
          diff: [
            { op: "+", text: "Chip 3.3 V nói chuyện trực tiếp được với họ 74HCT (ngưỡng 2.0 V) nhưng cần mạch đổi mức cho họ 74HC (ngưỡng 3.5 V)." },
            { op: "+", text: "Dùng duty_permille (0..1000 phần nghìn) bằng số nguyên trong C thay cho float 0.0..1.0." }
          ],
          kpis: [
            { label: "3.3V → 5V TTL", value: "Dư +900 mV", sub: "V_IH = 2000 mV (Đạt)", tone: "sage" },
            { label: "3.3V → 5V CMOS", value: "Thiếu -600 mV", sub: "V_IH = 3500 mV (Lỗi!)", tone: "rose" },
            { label: "ODR / TIMx", value: "Mạch nhớ / Đếm", sub: "Phần cứng sau code C", tone: "sky" }
          ],
          legend: [
            { label: "Đủ khoảng an toàn", color: "#84be88" },
            { label: "Thiếu áp / Vùng lưng chừng", color: "#e57373" },
            { label: "Thanh ghi nhớ & Timer", color: "#84b4df" }
          ],
          learnUnlock: [0],
          scene: {
            type: "flow",
            nodes: [
              ["Bên phát V_OH / V_OL", "So với ngưỡng nhận bên thu V_IH / V_IL"],
              ["Dư >= 200 mV cả 2 mức", "Bắt lỗi 3.3V → 5V CMOS (-600 mV)"],
              ["ODR & Bộ đếm TIMx", "PSC, ARR, CCR xuất PWM không tốn CPU"]
            ]
          }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Bộ khuếch đại (Op-Amp) & Lọc tụ-trở (RC) làm mượt xung thành áp phẳng",
          body:
            "Ba mạch **Op-Amp** hay gặp nhất: (1) **Mạch đệm (`Av = 1`)**: không rút dòng từ cảm biến yếu mà vẫn nạp khỏe cho tụ ADC; (2) **Khuếch đại không đảo (`Av = 1 + Rf/Rg`)**: phóng đại áp điện trở đo dòng `0..200 mV` lên `0..3200 mV` (`Rg = 1 kΩ, Rf = 15 kΩ`) — với nguồn đơn `3,3 V` **phải chọn Op-Amp kéo sát nguồn (Rail-to-Rail như `MCP6001`)** vì `LM358` cũ chỉ kéo lên tối đa `~1,8 V`!; (3) **So sánh chống rung (`LM393`)**. Để biến xung vuông PWM thành điện áp DC phẳng, dùng **mạch lọc tụ-trở (RC)**: hằng số thời gian **`τ = R·C`** (`5τ` ổn định `99,3%`), tần số cắt **`fc = 159154943 / (R_Ω · C_nF)`**, chọn `fc ≤ f_PWM / 10`.",
          codeLang: "C · tính τ, tần số cắt fc & khuếch đại Op-Amp sát nguồn",
          code: `/* 1) Hằng số thời gian τ (µs) và tần số cắt fc (Hz) cho mạch lọc RC */
uint32_t rc_tau_us(uint32_t r_ohm, uint32_t c_nf) {
    return (uint32_t)(((uint64_t)r_ohm * c_nf + 500ULL) / 1000ULL);
}
uint32_t rc_cutoff_hz(uint32_t r_ohm, uint32_t c_nf) {
    uint64_t rc = (uint64_t)r_ohm * c_nf;
    return (rc == 0ULL) ? 0U : (uint32_t)((159154943ULL + rc / 2ULL) / rc);
}
/* 10 kΩ + 100 nF -> tau = 1000 µs (5*tau = 5 ms), fc = 159 Hz.
 * Với PWM 10 kHz (duty 50%) -> ra áp DC cực phẳng ~1650 mV! */

/* 2) Khuếch đại không đảo bị kẹp trần theo loại Op-Amp (Rail-to-Rail vs LM358) */
uint32_t opamp_noninv_mv(uint32_t vin_mv, uint32_t rg_ohm, uint32_t rf_ohm, uint32_t vout_max_mv) {
    uint64_t v = ((uint64_t)vin_mv * ((uint64_t)rg_ohm + rf_ohm) + rg_ohm / 2ULL) / rg_ohm;
    return (v > vout_max_mv) ? vout_max_mv : (uint32_t)v;
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "LM358 KHÔNG kéo sát được mức nguồn 3.3 V! Khi cấp nguồn đơn 3.3 V, ngõ ra LM358 bị kẹp trần ở khoảng 1.8 V — phải dùng Op-Amp Rail-to-Rail (như MCP6001) để đọc đủ thang 3.2 V của ADC."
          },
          diff: [
            { op: "+", text: "R = 10 kΩ, C = 100 nF cho fc = 159 Hz, làm mượt cực sạch xung PWM 10 kHz (159 Hz << 10 kHz / 10)." },
            { op: "-", text: "PWM 50 Hz đi qua cặp RC 159 Hz vẫn bị gợn mạnh; muốn phẳng phải hạ fc <= 2 Hz (phản hồi chậm 400 ms!)." }
          ],
          kpis: [
            { label: "10kΩ + 100nF", value: "τ=1ms / fc=159Hz", sub: "5τ = 5 ms (ổn định 99.3%)", tone: "sky" },
            { label: "Shunt 0.1Ω ×16", value: "0..3200 mV", sub: "Dùng hết 97% dải ADC", tone: "sage" },
            { label: "Op-Amp 3.3V", value: "Kéo sát nguồn (RRIO)", sub: "LM358 chỉ lên ~1.8 V", tone: "rose" }
          ],
          legend: [
            { label: "Op-Amp Đệm / Khuếch đại", color: "#84b4df" },
            { label: "Lọc RC (τ, fc)", color: "#84be88" },
            { label: "Giới hạn trần / Độ gợn", color: "#e57373" }
          ],
          learnUnlock: [1],
          scene: { type: "opamp_rc_filter" },
          openQuestions: [
            {
              id: "q-elec-opamp-rc",
              scenario: "THIẾT KẾ MẠCH 3.3V · OP-AMP & LỌC RC",
              prompt:
                "1) Bạn dùng `LM358` cấp nguồn đơn `3,3 V` cho mạch khuếch đại không đảo `Av = 16` (`Rg = 1 kΩ, Rf = 15 kΩ`) để đọc áp shunt `0..200 mV`: tại sao ADC chỉ đọc kịch kim khoảng `1,8 V` dù dòng thực đang ở mức `2 A` (`200 mV × 16 = 3,2 V`)? 2) Tại sao bộ lọc `10 kΩ + 100 nF` (`fc ≈ 159 Hz`) biến xung PWM `10 kHz` thành áp DC phẳng, nhưng lại nhảy gợn dữ dội khi PWM chỉ chạy `50 Hz`?",
              placeholder: "Giải thích trần áp ra của LM358 so với loại kéo sát nguồn và so sánh f_PWM với fc = 159 Hz...",
              hint: "LM358 chỉ đạt Vout_max ≈ VCC - 1.5 V ≈ 1.8 V; để lọc mượt PWM, tần số cắt fc phải nhỏ hơn f_PWM ít nhất 10 lần."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "Bộ lọc mượt tín hiệu trong code & chống nhiễu đo ADC",
          body:
            "Bộ lọc tụ-trở RC ngoài phần cứng khi viết thành code C chỉ tốn **1 dòng số nguyên**: **`y += (x - y) / k`** (bộ lọc mượt EMA). Đặt `k ≈ τ / T_sample`: sau `k` bước `y` đạt `~63,2%`, sau `3k` đạt `95%`, sau `5k` đạt `> 99%`! Coi chừng bẫy **kẹt phần dư chia nguyên**: khi `|x − y| < k`, phép chia nguyên cho `0` khiến `y` dừng non (ví dụ `x = 1000, k = 10` đứng ở `991` mãi không lên `1000`); hãy lưu biến tích lũy nhân sẵn `k` (`acc_scaled`) để bám khít `1000`. Ở phần cứng, luôn lọc riêng chân nguồn analog **`VDDA`** bằng `100 nF // 1–4.7 µF` + cuộn chặn nhiễu (`50 mV` nhiễu làm ADC nhảy **`62 nấc`**!) và tăng thời gian lấy mẫu `SMPR` khi trở kháng nguồn lớn.",
          codeLang: "C · bộ lọc mượt EMA & sửa lỗi kẹt phần dư chia nguyên",
          code: `/* 1) Bộ lọc mượt đơn giản: bị dừng non ở 991 do chia nguyên cắt phần dư */
int32_t ema_naive_step(int32_t y, int32_t x, int32_t k) {
    return y + (x - y) / k; /* x=1000, k=10 -> dừng ở 991! */
}

/* 2) Bộ lọc mượt chính xác dùng biến tích lũy nhân k (lưu state = y * k) */
int32_t ema_scaled_step(int32_t *acc_scaled, int32_t x, int32_t k) {
    int32_t y = (*acc_scaled + (k / 2)) / k;
    *acc_scaled = *acc_scaled - y + x;
    return (*acc_scaled + (k / 2)) / k; /* bám sát 1000 không bị hụt k-1! */
}`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "ADC 12-bit 3.3V có 1 nấc ≈ 806 µV. Chỉ cần 50 mV gợn xung trên đường VDDA hoặc trở kháng nguồn > 100 kΩ mà chưa tăng thời gian lấy mẫu (SMPR) là số đo ADC đã nhảy loạn dù code C đúng 100%!"
          },
          diff: [
            { op: "+", text: "k bước của bộ lọc y += (x - y) / k hoạt động giống hệt 1 hằng số thời gian τ của mạch RC." },
            { op: "-", text: "Chia nguyên trực tiếp (x - y) / k bị kẹt ở x - (k - 1); dùng biến tích lũy nhân k sẽ bám tới đúng x." }
          ],
          kpis: [
            { label: "1 nấc (12b/3.3V)", value: "806 µV", sub: "50 mV gợn = 62 nấc!", tone: "rose" },
            { label: "Lọc EMA 1τ / 5τ", value: "k bước / 5k bước", sub: "63.2% / >99% ổn định", tone: "sky" },
            { label: "Hết kẹt phần dư", value: "Scaled acc", sub: "Tránh dừng non ở 991", tone: "sage" }
          ],
          legend: [
            { label: "Lọc thường (kẹt dư)", color: "#e8ca78" },
            { label: "Lọc nhân k chính xác", color: "#84be88" },
            { label: "Lọc VDDA & tụ ADC", color: "#84b4df" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["VDDA + Tụ ADC (SMPR)", "Lọc 100nF//1µF + cuộn chặn nhiễu giảm nhảy số"],
              ["EMA y += (x - y) / k", "Bộ lọc RC viết bằng 1 dòng số nguyên"],
              ["Biến tích lũy nhân k", "Khử lỗi kẹt k - 1 do cắt phần dư chia nguyên"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Lọc xung PWM thành điện áp phẳng & khuếch đại tín hiệu",
          body:
            "Thực hành kết hợp tính toán C và mạch lọc RC/Op-Amp: (1) Viết các hàm C số nguyên `pwm_calc_timer_params(f_clk, target_hz, duty_permille, &out)` (chọn `psc` nhỏ nhất để `ARR` mịn nhất), `rc_cutoff_hz`, `opamp_noninv_mv`, `ema_step` chạy sạch ASan/UBSan; (2) Trên mạch thật hoặc Falstad, xuất xung PWM `10 kHz` (hoặc `1 kHz`) lần lượt ở `25%`, `50%`, `75%` đi qua bộ lọc `R = 10 kΩ, C = 100 nF` (hoặc `1 µF`) rồi đo điện áp DC phẳng sau tụ để đối chiếu với `3300 × duty / 1000` và độ gợn còn lại.",
          codeLang: "C · assert kiểm chứng Timer PWM, lọc RC & EMA",
          code: `/* Kiểm tra tính toán Timer PWM, RC và Op-Amp không dùng float */
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
            text: "Khi chọn PSC/ARR cho Timer PWM, luôn chọn PSC nhỏ nhất sao cho ARR <= 65535 để CCR chỉnh được độ rộng xung mịn nhất."
          },
          diff: [
            { op: "+", text: "Mọi phép tính tần số PWM, fc bộ lọc RC và độ lợi Op-Amp đều chạy bằng uint64_t không dùng float." },
            { op: "+", text: "Đối chiếu áp DC đo được sau lọc RC ở duty 25%, 50%, 75% với giá trị kỳ vọng 825, 1650, 2475 mV." }
          ],
          kpis: [
            { label: "Timer 72 MHz", value: "20 kHz → ARR=3599", sub: "PSC=0, CCR(50%)=1800", tone: "sky" },
            { label: "Lọc RC", value: "10kΩ + 100nF", sub: "fc = 159 Hz", tone: "amber" },
            { label: "Áp DC 50%", value: "≈ 1650 mV", sub: "PWM 3.3V thành DAC", tone: "sage" }
          ],
          legend: [
            { label: "Tính PSC / ARR / CCR", color: "#84b4df" },
            { label: "Lọc RC & Op-Amp", color: "#ad9cd8" },
            { label: "Đo DC & Độ gợn", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["Hàm kiểm chứng C", "Tính PSC/ARR, fc, Op-Amp, EMA không float"],
              ["Mạch PWM + Lọc RC", "Xuất PWM 10 kHz qua 10 kΩ / 100 nF"],
              ["Đo DMM / Scope", "Kiểm tra DC 825 / 1650 / 2475 mV và độ gợn"]
            ]
          },
          quiz: [
            {
              prompt:
                "Với mạch lọc thông thấp RC dùng `R = 10 kΩ` và `C = 100 nF`, hằng số thời gian `τ` và thời gian ổn định hoàn toàn (`5τ`, đạt ~99,3%) bằng bao nhiêu?",
              options: [
                "τ = 100 µs và 5τ = 500 µs",
                "τ = 1 ms (1000 µs) và 5τ = 5 ms",
                "τ = 10 ms và 5τ = 50 ms"
              ],
              correctIndex: 1,
              explain:
                "τ = R × C = 10,000 Ω × 100 nF = 1,000,000 ns = 1000 µs = 1 ms. Thời gian ổn định 5τ = 5 ms."
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
                "Phép chia nguyên cắt bỏ phần thập phân nên mọi sai lệch nhỏ hơn k đều cho thương bằng 0, làm giá trị đứng yên trước đích."
            }
          ]
        }
      ]
    },
    {
      id: "e-serial-datasheet",
      number: "15",
      title: "Chuẩn truyền UART/I2C/SPI/CAN, đọc Datasheet & máy phân tích logic",
      duration: "65 phút",
      level: "Trung bình",
      subtitle:
        "Cách hoạt động điện lý của UART/I2C/SPI/CAN, đọc thông số mạch trong 15 phút (dòng tối đa, chân chịu 5V, thời gian giữ tín hiệu), 6 bước kiểm tra nguội/nóng trước khi cấp nguồn & chạy mạch lần đầu.",
      locked: false,
      youllLearn: [
        "Hiểu bản chất điện và bẫy của UART (8N1, <=2%), I2C (kéo xuống, trở treo, 7b/8b), SPI (Mode 0..3) và CAN (120 Ω)",
        "Đọc nhanh thông số Datasheet trong 15 phút: tổng dòng tối đa, chân chịu 5V vs ADC, thời gian giữ tín hiệu & 5 khối sơ đồ mạch",
        "Dùng đúng DMM / USB Logic Analyzer (PulseView) / Oscilloscope và thực hiện 6 bước kiểm tra trước khi cấp nguồn cho mạch mới"
      ],
      steps: [
        {
          id: "s1",
          badge: "CONCEPT",
          title: "Cách 4 chuẩn dây truyền dữ liệu hoạt động: UART, I2C, SPI & CAN",
          body:
            "**UART (`TX↔RX` + chung `GND`)**: truyền `8N1` (**bit thấp trước**, 10 bit/byte), sai số tốc độ baud phải `≤ 2%` (`20‰`) để không đọc trượt bit. **I2C (`SDA/SCL`)**: chân chỉ kéo xuống mass (**Open-Drain**) nên **bắt buộc có trở kéo lên nguồn (`2,2–4,7 kΩ`)** — thiếu trở kéo lên cả 2 dây nằm bẹp ở `0 V`! Sườn lên cần đủ nhanh **`t_r ≈ 0,8473 · R_p · C_bus ≤ 300 ns`** ở `400 kHz`; nhớ dịch địa chỉ 7-bit `0x68` (`MPU6050`) sang byte 8-bit `0xD0` (Ghi) / `0xD1` (Đọc) và phát 9 xung `SCL` cứu treo bus. **SPI**: đẩy-kéo `10–50+ MHz` (**bit cao trước**), sai Mode `(CPOL, CPHA)` làm dữ liệu lệch 1 bit. **CAN/RS485**: cặp dây xoắn chống nhiễu + gắn **đúng 2 điện trở `120 Ω` ở 2 đầu mút** (`120 ∥ 120 = 60 Ω`).",
          codeLang: "C · kiểm tra sườn lên I2C tr (ns) & địa chỉ 7-bit/8-bit",
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
            text: "Tuyệt đối KHÔNG lắp điện trở 120 Ω ở mọi trạm trên đường CAN/RS485! Nếu lắp ở cả 6 trạm, tổng trở tụt còn 20 Ω gây quá dòng bộ phát và sập tín hiệu. Chỉ lắp đúng ở 2 ĐẦU MÚT."
          },
          diff: [
            { op: "+", text: "UART gửi bit 0 trước (LSB-first); I2C và SPI gửi bit 7 trước (MSB-first)." },
            { op: "-", text: "Nhầm địa chỉ 7-bit (0x68) với 8-bit đã dịch (0xD0) là lỗi phổ biến nhất gây NACK khi mới code I2C." }
          ],
          kpis: [
            { label: "UART sai số", value: "≤ 2% (20‰)", sub: "8N1 LSB-first + GND chung", tone: "sky" },
            { label: "I2C 400 kHz", value: "tr ≤ 300 ns", sub: "Rp 2.2k–4.7k, 0x68→0xD0", tone: "amber" },
            { label: "CAN / RS485", value: "2 × 120 Ω", sub: "Chỉ ở 2 đầu trục (60 Ω)", tone: "sage" }
          ],
          legend: [
            { label: "UART (LSB) / SPI (MSB)", color: "#84b4df" },
            { label: "I2C Kéo lên & ACK", color: "#e8ca78" },
            { label: "CAN/RS485 Cặp xoắn 120Ω", color: "#84be88" }
          ],
          learnUnlock: [0],
          scene: { type: "serial_buses_wave" }
        },
        {
          id: "s2",
          badge: "CONCEPT",
          title: "Đọc thông số mạch trong 15 phút: dòng tối đa, chân chịu 5V & thời gian giữ tín hiệu",
          body:
            "**Datasheet** (~150 trang) ghi giới hạn điện/chân/tốc độ, còn **Reference Manual** (~1500 trang) mới ghi từng thanh ghi! Trước khi vẽ hay hàn mạch, hãy tra đúng datasheet của con vi điều khiển bạn dùng ở 5 mục: (1) **Dòng tối đa toàn chip**: ngoài dòng từng chân `±25 mA`, nhớ xem **tổng dòng toàn chip `ΣI_VDD`** (ví dụ `120–150 mA` — cắm 10 LED × `15 mA` = `150 mA` + CPU sẽ quá tải sập nguồn dù mỗi chân dưới `25 mA`!); (2) **Áp nuôi `VDDA`** tối thiểu cho ADC và giới hạn **`R_AIN` / `C_ADC`** của chân đo analog; (3) **Chân chịu `5 V` (`FT`)**: chỉ chịu `5 V` khi làm chân số Digital, **MẤT khả năng chịu `5 V` nếu bật sang đo ADC**; (4) **Mức áp DC**; (5) **Thời gian chuẩn bị & giữ tín hiệu (`t_su`, `t_h`)**. Trên sơ đồ mạch STM32 kiểm đủ 5 khối: Nguồn+LDO, Tụ `100 nF` mỗi cặp `VDD-VSS`+`VDDA`, `NRST` (`100 nF`), Thạch anh+`BOOT0` (`10 kΩ → GND`), và cổng nạp `SWD` (**CẤM gắn tụ `100 nF` lên `SWDIO/SWCLK`**!).",
          codeLang: "C · kiểm tra giới hạn dòng toàn chip & tốc độ SPI theo Datasheet",
          code: `/* 1) Kiểm tra giới hạn dòng từng chân & tổng dòng toàn chip ΣI_VDD trong Datasheet */
bool mcu_check_pin_budget(uint32_t pin_ma, uint32_t num_active_pins,
                          uint32_t cpu_ma, uint32_t max_pin_ma,
                          uint32_t max_total_vdd_ma) {
    if (pin_ma > max_pin_ma) return false;
    return (pin_ma * num_active_pins + cpu_ma) <= max_total_vdd_ma;
}
/* 10 LED * 15 mA + 25 mA CPU = 175 mA > ΣI_VDD (120..150 mA) -> SẬP CHIP! */

/* 2) Kiểm tra timing SPI: nửa chu kỳ xung >= thời gian đáp ứng + lệch dây + giữ tín hiệu */
bool spi_calc_timing_ns(uint32_t f_sck_hz, uint32_t t_co_ns,
                        uint32_t t_skew_ns, uint32_t t_su_ns) {
    uint32_t t_half_ns = 500000000U / f_sck_hz;
    return t_half_ns >= (t_co_ns + t_skew_ns + t_su_ns);
}`,
          callout: {
            type: "watch-out",
            label: "LƯU Ý",
            text: "Luôn tra đúng giới hạn ΣI_VDD, R_AIN và C_ADC trong datasheet của chính mã MCU bạn đang dùng! Và tuyệt đối KHÔNG gắn tụ 100 nF chống dội lên chân nạp SWCLK/SWDIO — tụ sẽ làm méo xung MHz khiến ST-Link báo không thấy chip."
          },
          diff: [
            { op: "-", text: "Kéo 10 LED × 15 mA trực tiếp từ GPIO tuy dưới ±25 mA/chân nhưng vượt tổng dòng ΣI_VDD của chip." },
            { op: "+", text: "Chân FT chỉ chịu 5V ở chế độ Digital; khi chuyển sang đo ADC bắt buộc hạ áp về <= VDDA + 0.3V." }
          ],
          kpis: [
            { label: "Tổng chip ΣI_VDD", value: "120–150 mA", sub: "Tra đúng datasheet MCU", tone: "rose" },
            { label: "Chân FT ở ADC", value: "Mất chịu 5V!", sub: "Kẹp về VDDA + 0.3V", tone: "amber" },
            { label: "SWCLK / SWDIO", value: "0 tụ 100 nF", sub: "Giữ xung nạp MHz sạch", tone: "sage" }
          ],
          legend: [
            { label: "Giới hạn ΣI_VDD / FT", color: "#e57373" },
            { label: "Thời gian giữ t_su / t_h", color: "#e8ca78" },
            { label: "5 khối sơ đồ mạch chuẩn", color: "#84b4df" }
          ],
          learnUnlock: [1],
          scene: { type: "datasheet_pin_budget" },
          openQuestions: [
            {
              id: "q-elec-serial-ds",
              scenario: "DEBUG PHẦN CỨNG · DATASHEET & I2C",
              prompt:
                "1) Một board STM32 điều khiển 10 LED (mỗi LED ăn `15 mA`, nhỏ hơn giới hạn `±25 mA` mỗi chân), nhưng khi bật cả 10 LED cùng lúc thì chip reset liên tục và nóng cổng GPIO: thông số nào trong Datasheet đã bị vi phạm và sửa thế nào? 2) Nối module trần `MPU6050` vào `PB6/PB7` (`I2C1`), đồng hồ đo `SDA` và `SCL` đều nằm bẹp ở `0 V` gây `TIMEOUT`: nguyên nhân điện lý là gì?",
              placeholder: "Nêu thông số tổng dòng nguồn ΣI_VDD + cách lái ngoài, và vai trò điện trở kéo lên (Pull-up) của I2C...",
              hint: "1) So sánh 10 × 15 mA + CPU với ΣI_VDD trong datasheet; giải pháp dùng transistor/MOSFET lái ngoài. 2) I2C chỉ kéo xuống 0 V được chứ không tự đẩy lên 3.3 V nếu thiếu trở Pull-up."
            }
          ]
        },
        {
          id: "s3",
          badge: "CONCEPT",
          title: "6 bước kiểm tra nguội/nóng trước khi cấp nguồn & máy đo tín hiệu",
          body:
            "Mỗi máy đo giúp bạn thấy một kiểu lỗi: **Đồng hồ vạn năng (DMM)** đo áp tĩnh và dò chập, nhưng không thấy gói tin chạy nhanh; **USB Logic Analyzer `24 MHz` + `PulseView`** (đặt tốc độ lấy mẫu `≥ 4–10×` tốc độ bus) tự giải mã từng bit UART/I2C/SPI để bắt sai baudrate, `NACK` hay sai Mode SPI; **Oscilloscope** soi dáng sóng thật như độ dốc sườn lên `t_r` của I2C, gợn nguồn, nảy nút bấm và xung Flyback. Trước khi cấp điện cho mạch mới trên **Breadboard** (nhớ kiểm tra thanh nguồn 830 lỗ bị ngắt đôi ở giữa!) hay mạch vừa hàn, luôn làm đủ **6 bước kiểm tra nguội/nóng**.",
          codeLang: "6 bước kiểm tra nguội/nóng trước khi cấp nguồn",
          code: `// 6 bước kiểm tra trước khi cắm nguồn chính (tránh cháy chip):
// 1. Soi mắt (nguội): đúng chiều tụ hóa/diode/LED, chấm chân 1 IC, không cầu thiếc.
// 2. Đo chập nguội (DMM tắt nguồn): 3V3 <-> GND, 5V <-> GND (> 50 Ω, không bíp dài!).
// 3. Cách ly đường nguồn (nguội): không chập 5V <-> 3V3 hay SWDIO/SWCLK <-> GND.
// 4. Thử nguồn không tải (nóng): đo đầu ra LDO đúng 3300 mV ± 2% trước khi gắn chip.
// 5. Cấp điện 3 giây qua nguồn hạn dòng: sờ kiểm tra nhiệt LDO & vi điều khiển.
// 6. Kiểm tra khởi chạy: NRST ~3.3V, dòng nghỉ ~10..40 mA, ST-Link đọc được Chip ID.`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Trong phần mềm PulseView, muốn giải mã I2C 400 kHz hay SPI 2 MHz không bị sai bit, luôn chỉnh tốc độ lấy mẫu (Sample Rate) lên 8–24 MHz (gấp ít nhất 4–10 lần tần số xung clock)."
          },
          diff: [
            { op: "+", text: "Logic Analyzer bắt lỗi gói tin (NACK, sai Mode SPI, lệch baud); Scope soi sườn lên tr và nhiễu analog." },
            { op: "-", text: "80% lỗi cắm breadboard 830 lỗ do quên nối cầu thanh nguồn +/- bị ngắt đôi ở chính giữa." }
          ],
          kpis: [
            { label: "Logic Analyzer", value: "24 MHz (≥4–10×)", sub: "Giải mã UART/I2C/SPI", tone: "sky" },
            { label: "Oscilloscope", value: "Sóng thật V(t)", sub: "Soi tr, gợn nguồn, dội phím", tone: "amber" },
            { label: "Kiểm tra nguồn", value: "6 bước bắt buộc", sub: "Chặn cháy LDO/MCU", tone: "sage" }
          ],
          legend: [
            { label: "DMM + Kiểm tra 6 bước", color: "#84be88" },
            { label: "PulseView Giải mã bit", color: "#84b4df" },
            { label: "Scope Sóng thật V(t)", color: "#ad9cd8" }
          ],
          learnUnlock: [2],
          scene: {
            type: "flow",
            nodes: [
              ["6 bước kiểm tra nguội/nóng", "Soi mắt → Đo chập → Thử LDO → Hạn dòng 3s"],
              ["USB Logic Analyzer", "Mẫu ≥4–10× bus, giải mã UART/I2C/SPI trên PulseView"],
              ["Oscilloscope", "Đo sườn tr I2C, dội nút nhấn, xung Flyback"]
            ]
          }
        },
        {
          id: "s4",
          badge: "LAB",
          title: "Thực hành · Kiểm tra mạch mới chạy lần đầu",
          body:
            "Bài tổng hợp kiểm tra mạch mới chạy lần đầu qua 4 bước thực hành: (1) **Mạch rời**: dựng 4 mạch cơ bản (chia áp `12,6 V`, LED E12, nút nhấn kéo lên, Low-Side MOSFET + Diode bảo vệ) trên mạch thật hoặc Falstad sau khi làm đủ 6 bước kiểm tra nguội/nóng; (2) **Vòng lặp không chặn CPU**: bỏ `delay()`, nháy LED `500 ms`, chống dội nút, đọc ADC 12-bit bằng `uint64_t` không `float`, xuất PWM; (3) **Giao tiếp & Đo sóng**: gửi lệnh UART qua hàng đợi vòng tĩnh + đọc `WHO_AM_I` qua I2C/SPI + ghi lại sóng `.vcd`/`.sr` giải mã trên **PulseView**; (4) **Thanh ghi trực tiếp**: cấu hình `RCC`, `MODER`, `BSRR` qua `volatile uint32_t` không dùng HAL GPIO và kiểm thử bằng `test_reg_mock.c`.",
          codeLang: "C · điều khiển thanh ghi trực tiếp & test_reg_mock.c",
          code: `typedef struct {
    volatile uint32_t MODER;
    volatile uint32_t OTYPER;
    volatile uint32_t OSPEEDR;
    volatile uint32_t PUPDR;
    volatile uint32_t IDR;
    volatile uint32_t ODR;
    volatile uint32_t BSRR;
} bare_gpio_t;

/* Đọc-Sửa-Ghi đặt 1 chân thành Output (01), giữ nguyên 100% các chân hàng xóm */
void gpio_set_output(bare_gpio_t *gpio, uint8_t pin) {
    uint32_t shift = (uint32_t)pin * 2U;
    gpio->MODER = (gpio->MODER & ~(UINT32_C(3) << shift)) | (UINT32_C(1) << shift);
}
/* Bật/Tắt nhanh 1 chân: gpio->BSRR = UINT32_C(1) << pin; / << (pin + 16U); */`,
          callout: {
            type: "key-idea",
            label: "CẦN NHỚ",
            text: "Khi lập trình thanh ghi trực tiếp trên STM32, luôn bật clock ngoại vi trong RCC TRƯỚC khi chạm vào MODER/ODR! Trong test_reg_mock.c, kiểm chứng mọi bit ngoài chân mục tiêu vẫn giữ nguyên."
          },
          diff: [
            { op: "+", text: "0 float trong firmware đo mV / nhiệt độ / duty PWM; 0 delay() chặn vòng lặp chính." },
            { op: "+", text: "Lưu tệp sóng PulseView kèm bảng giải mã bit UART (LSB-first) và giao dịch I2C/SPI." }
          ],
          kpis: [
            { label: "Mạch & Vòng lặp", value: "50 điểm", sub: "Mạch rời + ADC/PWM 0 delay", tone: "sky" },
            { label: "UART + I2C + Sóng", value: "30 điểm", sub: "RingBuf CLI + PulseView", tone: "amber" },
            { label: "Thanh ghi trực tiếp", value: "20 điểm", sub: "RCC/MODER/BSRR + mock test", tone: "sage" }
          ],
          legend: [
            { label: "Mạch rời & ADC/PWM", color: "#84b4df" },
            { label: "PulseView Giải mã", color: "#e8ca78" },
            { label: "Thanh ghi trực tiếp", color: "#84be88" }
          ],
          learnUnlock: [],
          scene: {
            type: "flow",
            nodes: [
              ["Mạch rời & ADC/PWM", "4 mạch cơ bản + vòng lặp 0 float, 0 delay"],
              ["UART + I2C + PulseView", "Hàng đợi vòng + WHO_AM_I + bắt sóng"],
              ["Thanh ghi trực tiếp", "RCC + MODER/BSRR + test_reg_mock trên WSL"]
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
