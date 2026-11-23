export const EN_ELECTRONICS = {
  "e-led-ohm": {
    title: "Voltage, current & LEDs",
    subtitle: "Use Ohm’s law to choose a current-limiting resistor and check a 3.3 V DC LED circuit.",
    steps: [
      {
        title: "Measure voltage between two points",
        body: "Use GND as the 0 V reference. Voltage is the potential difference between two points. Current can flow through the LED when the circuit is closed and the LED is forward-biased.",
        codeLang: "Wiring diagram",
        code: "+3.3 V ── 330 Ω ── LED anode | cathode ── GND",
        nodes: [["+3.3 V", "DC supply"], ["330 Ω + LED", "in series"], ["GND", "return to supply"]],
        callout: { text: "Set the multimeter to DC voltage and place the probes across the component you want to measure." },
        diff: ["Disconnect power before changing the wiring. Use a low-voltage DC supply for the circuit labs."]
      },
      {
        title: "Calculate current through the resistor",
        body: "Assume the red LED has a forward voltage (Vf) of about 2.0 V at the current in this example. The remaining 3.3 − 2.0 = 1.3 V drops across the resistor. With 330 Ω, the current is about 3.9 mA.",
        codeLang: "Calculation",
        code: "V_R = V_supply − V_f\nI = V_R / R = 1.3 V / 330 Ω ≈ 3.9 mA",
        nodes: [["Supply", "3.3 V"], ["LED", "≈ 2.0 V"], ["Resistor", "1.3 V → 3.9 mA"]],
        callout: { text: "Vf and the GPIO pin voltage vary with current. When driving the LED from a GPIO pin, check the DC electrical specifications for the pin and its pin group." },
        diff: ["With Vf held constant, 220 Ω gives about 5.9 mA and 470 Ω gives about 2.8 mA."]
      },
      {
        title: "Lab · Measure voltage drop and calculate current",
        body: "Predict VR first. Then use a circuit simulator or wire a red LED and a 330 Ω resistor to a 3.3 V supply. Measure voltage across the resistor and calculate current from your reading.",
        codeLang: "Results worksheet",
        code: "Predicted VR ≈ 1.3 V\nMeasured VR = ____ V\nCalculated I = measured VR / 330 Ω",
        nodes: [["Predict", "VR ≈ 1.3 V"], ["Measure VR", "across the resistor"], ["Calculate I", "I = VR / R"]],
        callout: { text: "Record both Vf and VR and check that the voltage drops around the loop add up to approximately the supply voltage." },
        diff: ["Compare your current with the predicted 3.9 mA. Use the actual Vf, supply voltage, and resistor tolerance to explain any difference."],
        quiz: [{
          prompt: "With the same supply and LED, what usually happens to the current if you increase the series resistor from 330 Ω to 470 Ω?",
          options: ["It increases", "It decreases", "It stays the same"],
          explain: "A larger resistance reduces the current through the series circuit."
        }]
      }
    ]
  },
  "e-gpio-button": {
    title: "GPIO, pull-ups & buttons",
    subtitle: "Turn the voltage on a GPIO pin into a reliable button-press event.",
    steps: [
      {
        title: "A pull-up holds the pin at a known level",
        body: "Connect the input pin to 3.3 V through a 10 kΩ resistor. The button connects the pin to GND. Releasing the button lets the pin go high, and pressing it pulls the pin low.",
        codeLang: "Active-low button wiring",
        code: "3.3 V ── 10 kΩ ──●── button ── GND\n                 └── GPIO input",
        nodes: [["Button released", "pull-up holds it high"], ["GPIO", "reads HIGH"], ["Firmware", "pressed = false"]],
        callout: { text: "A floating input has an unreliable logic level. The MCU datasheet defines the LOW and HIGH thresholds." },
        diff: ["Press → LOW. Release → HIGH.", "While pressed, the resistor current is about 3.3 V / 10 kΩ = 0.33 mA."]
      },
      {
        title: "Debounce with consecutive samples",
        body: "Mechanical contacts can change level several times in a few milliseconds. Take one sample every 5 ms and accept a new state after three consecutive samples agree.",
        codeLang: "Active-low sample sequence",
        code: "Time (ms)  0  5  10  15  20  25\nGPIO       1  0   1   0   0   0",
        nodes: [["5–10 ms", "0 then 1 → bounce"], ["15–25 ms", "0, 0, 0"], ["25 ms", "emit press event"]],
        callout: { text: "Reset the count when the sample changes. Emit a press event only when the debounced state changes from released to pressed." },
        diff: ["If GPIO stays at 0 after 25 ms, the filter emits one press event in total."]
      },
      {
        title: "Lab · Toggle the LED once per press",
        body: "Write a debouncer in C on your PC. Start in the released state and feed the filter the raw GPIO samples. Toggle the LED once for each debounced press.",
        codeLang: "C · test data",
        code: "unsigned raw[] = {1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0};",
        nodes: [["GPIO samples", "0 = pressed"], ["Debouncer", "3 matching samples"], ["LED", "toggles twice"]],
        callout: { text: "On a board, use a common GND, configure the pin as an input, and measure the voltage with the button pressed and released before testing the software." },
        diff: ["The supplied sequence yields two press events at indices 5 and 12.", "A sequence of all 1s or the sequence 1,0,1,0,1 yields no press events."],
        quiz: [{
          prompt: "In a pull-up circuit, what does GPIO read when you press the button and connect the pin to GND?",
          options: ["HIGH", "LOW", "Always undefined"],
          explain: "The closed button connects the input pin to GND, so it reads LOW."
        }]
      }
    ]
  },
  "e-divider-adc": {
    title: "Voltage dividers, ADCs & voltage measurement",
    subtitle: "Calculate the voltage at an ADC pin and convert its digital code to a voltage estimate.",
    steps: [
      {
        title: "Two resistors form a midpoint",
        body: "With 10 kΩ on the supply side and 10 kΩ on the GND side, the midpoint voltage is about half of Vin if the load draws little current. Use Vin between 0 and 3.3 V in this simulation.",
        codeLang: "Voltage divider diagram",
        code: "Vin ── 10 kΩ ──●── 10 kΩ ── GND\n               └── ADC",
        nodes: [["Vin", "3.30 V"], ["Two resistors", "1/2 ratio"], ["ADC", "Vout ≈ 1.65 V"]],
        callout: { text: "When connecting a real ADC, check its input range and source impedance requirements in the datasheet. Two 10 kΩ resistors give a Thévenin resistance of 5 kΩ." },
        diff: ["Vin = 0 V → Vout = 0 V.", "Vin = 2.0 V → Vout ≈ 1.0 V."]
      },
      {
        title: "An ADC converts voltage to an integer code",
        body: "A 12-bit ADC has 4096 codes from 0 to 4095. With Vref = 3.3 V, a code near 2048 corresponds to about 1.65 V. This example maps the two endpoints to estimate voltage in millivolts.",
        codeLang: "C · estimate mV at the ADC pin",
        code: "uint32_t adc_mv(uint16_t code) {\n    return ((uint32_t)code * 3300u + 2047u) / 4095u;\n}",
        nodes: [["Analog input", "≈ 1.65 V"], ["12-bit ADC", "≈ 2048"], ["Firmware", "≈ 1650 mV"]],
        callout: { text: "The highest code is 4095. The ideal quantization step is Vref / 4096. On a real board, the result also depends on the actual Vref, ADC error, and sampling time." },
        diff: ["The input code must be in the range 0..4095.", "The formula maps 2048 to 1650 mV."]
      },
      {
        title: "Lab · Compare calculations with measurements",
        body: "Write adc_mv in C and check three inputs. If you have a board, build a divider from a 3.3 V supply and measure the midpoint with a multimeter. Compare the reading with the voltage calculated from the ADC code.",
        codeLang: "Test data",
        code: "code =    0 →    0 mV\ncode = 2048 → 1650 mV\ncode = 4095 → 3300 mV",
        nodes: [["Test inputs", "0, 2048, 4095"], ["Convert", "code → mV"], ["Compare", "multimeter if available"]],
        callout: { text: "Record that the comparison is for Vout at the ADC pin. To estimate Vin for a 1/2 divider, multiply the calculated Vout by 2." },
        diff: ["Check that the result increases with the code.", "If you build the circuit, compare the readings and give one reason for any difference."],
        quiz: [{
          prompt: "If a 1/2 divider gives Vout = 1.65 V, what is the approximate value of Vin?",
          options: ["0.825 V", "1.65 V", "3.30 V"],
          explain: "Vout is half of Vin when the two resistors are equal and the load draws little current."
        }]
      }
    ]
  },
  "e-pwm": {
    title: "PWM, frequency & LED control",
    subtitle: "Read a PWM waveform and simulate LED brightness control with an ADC and a button.",
    steps: [
      {
        title: "A period has an on time and an off time",
        body: "PWM changes how long the signal stays high in each period. With a period of 1 ms and a high time of 0.25 ms, the frequency is 1 kHz and the duty cycle is 25%. The high level remains close to 3.3 V in this example.",
        codeLang: "25% duty cycle waveform",
        code: "    ┌──┐       ┌──┐\n────┘  └───────┘  └───────\n    ←  1 ms   →",
        nodes: [["High", "250 µs"], ["Low", "750 µs"], ["Period", "1 ms / 1 kHz"]],
        callout: { text: "PWM can adjust the brightness of an LED with a series resistor. Perceived brightness may vary nonlinearly with duty cycle." },
        diff: ["At 0% duty cycle, the signal stays low. At 100%, it stays high."]
      },
      {
        title: "Convert an ADC value to high ticks",
        body: "Simulate a timer that counts from 0 to 999. If the output is high when counter < on_ticks, setting on_ticks to 250 gives a 25% duty cycle. A value of 1000 keeps the output high for the whole simulated period.",
        codeLang: "C · simulated PWM",
        code: "uint32_t on_ticks(uint16_t adc) {\n    return ((uint32_t)adc * 1000u + 2047u) / 4095u;\n}",
        nodes: [["ADC", "2048 / 4095"], ["High time", "500 / 1000 ticks"], ["Duty cycle", "50%"]],
        callout: { text: "For a hardware timer, check the MCU documentation for the compare mode and how it handles 0% and 100% duty cycles." },
        diff: ["ADC 0 → 0 ticks, 2048 → 500 ticks, 4095 → 1000 ticks."]
      },
      {
        title: "Lab · Brightness control with an on/off button",
        body: "On your PC, sample and debounce an active-low button, store the on/off state, and convert the ADC value to a PWM duty cycle. Count the high ticks in one simulated period to check the result.",
        codeLang: "C · output condition per tick",
        code: "bool high = enabled && counter < on_ticks(adc);",
        nodes: [["Button + ADC", "digital samples"], ["C logic", "debounce, state, duty"], ["LED", "high ticks / 1000"]],
        callout: { text: "Initialize enabled = false. On a board, use a series resistor with the LED and measure the waveform if you have the equipment." },
        diff: ["ADC 2048, output off → 0 high ticks.", "Debounced press, ADC 2048 → 500 high ticks.", "Holding the button keeps 500 high ticks. Pressing again returns to 0."],
        quiz: [{
          prompt: "The period is 1 ms and the signal stays high for 0.75 ms. What is the duty cycle?",
          options: ["25%", "75%", "100%"],
          explain: "Duty cycle = high time / period = 0.75 / 1 = 75%."
        }]
      }
    ]
  }
};
