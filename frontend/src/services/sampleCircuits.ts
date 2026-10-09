/**
 * Sample circuit presets for instant 1-click testing and evaluation.
 */

export interface SampleCircuit {
  id: string;
  title: string;
  badge: string;
  expectedBehaviour: string;
  arduinoCode: string;
  observedBehaviour: string;
  svgDataUri: string;
}

// Crisp, stylized SVG diagram mimicking a Wokwi Arduino breadboard simulator screenshot
const SAMPLE_CIRCUIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="arduino" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#006677"/>
      <stop offset="100%" stop-color="#008899"/>
    </linearGradient>
    <linearGradient id="breadboard" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1000" height="700" fill="url(#bg)"/>
  <rect x="20" y="20" width="960" height="660" rx="12" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="50" y="55" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="20" font-weight="700">Wokwi Simulator — Arduino Uno Rev 3</text>
  <text x="50" y="80" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">Simulation state: STOPPED (Debug capture)</text>

  <!-- Arduino Uno Board -->
  <g filter="url(#shadow)">
    <rect x="60" y="140" width="360" height="500" rx="14" fill="url(#arduino)"/>
    <!-- Arduino USB & Power Jack -->
    <rect x="80" y="110" width="70" height="40" rx="4" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
    <rect x="320" y="110" width="50" height="45" rx="3" fill="#1e293b" stroke="#000" stroke-width="2"/>
    <!-- Main ATmega328P Chip -->
    <rect x="140" y="320" width="180" height="70" rx="4" fill="#0f172a"/>
    <text x="170" y="360" fill="#cbd5e1" font-family="monospace" font-size="14" font-weight="600">ATmega328P-PU</text>
    <!-- Reset Button -->
    <circle cx="95" cy="180" r="14" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/>
    <!-- Digital Pin Headers -->
    <rect x="390" y="170" width="20" height="230" fill="#0f172a" rx="2"/>
    <text x="320" y="210" fill="#e2e8f0" font-family="monospace" font-size="12">D13 [SCK]</text>
    <text x="345" y="350" fill="#e2e8f0" font-family="monospace" font-size="12">D2 [INT0]</text>
    <!-- Power Pin Headers -->
    <rect x="70" y="440" width="20" height="180" fill="#0f172a" rx="2"/>
    <text x="100" y="475" fill="#e2e8f0" font-family="monospace" font-size="12">5V Power</text>
    <text x="100" y="515" fill="#e2e8f0" font-family="monospace" font-size="12">GND Rail</text>
  </g>

  <!-- Half-size Breadboard -->
  <g filter="url(#shadow)">
    <rect x="490" y="140" width="450" height="500" rx="8" fill="url(#breadboard)"/>
    <!-- Power rails (+ / -) -->
    <line x1="510" y1="160" x2="510" y2="620" stroke="#ef4444" stroke-width="3"/>
    <line x1="525" y1="160" x2="525" y2="620" stroke="#3b82f6" stroke-width="3"/>
    <line x1="905" y1="160" x2="905" y2="620" stroke="#ef4444" stroke-width="3"/>
    <line x1="920" y1="160" x2="920" y2="620" stroke="#3b82f6" stroke-width="3"/>
    <!-- Center divider -->
    <line x1="715" y1="160" x2="715" y2="620" stroke="#cbd5e1" stroke-width="8"/>
    <text x="640" y="130" fill="#94a3b8" font-family="sans-serif" font-size="14" font-weight="600">BREADBOARD (400 TIE-POINTS)</text>
  </g>

  <!-- Red LED (Missing Resistor!) -->
  <g filter="url(#shadow)">
    <!-- Cathode (-) lead to GND rail -->
    <path d="M 590 380 Q 550 430 525 450" fill="none" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
    <!-- Anode (+) lead from D13 wire -->
    <path d="M 610 380 Q 640 430 640 460" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <!-- LED Bulb -->
    <ellipse cx="600" cy="340" rx="28" ry="32" fill="#ef4444" opacity="0.9"/>
    <ellipse cx="594" cy="330" rx="8" ry="12" fill="#fca5a5" opacity="0.8"/>
    <text x="560" y="295" fill="#f87171" font-family="system-ui, sans-serif" font-size="13" font-weight="700">RED LED (NO RESISTOR)</text>
  </g>

  <!-- Push Button -->
  <g filter="url(#shadow)">
    <rect x="580" y="520" width="60" height="60" rx="6" fill="#1e293b"/>
    <circle cx="610" cy="550" r="18" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
    <text x="555" y="605" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Push Button (Tactile)</text>
  </g>

  <!-- Wires -->
  <!-- D13 to LED Anode Row (Orange) -->
  <path d="M 400 205 Q 480 180 640 460" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
  <!-- Arduino GND to Breadboard GND Rail (Black) -->
  <path d="M 80 515 Q 260 670 525 580" fill="none" stroke="#020617" stroke-width="5" stroke-linecap="round"/>
  <!-- Pin 2 to Button Terminal 1 (Green) -->
  <path d="M 400 345 Q 490 380 580 540" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
  <!-- Button Terminal 2 to GND (Black) -->
  <path d="M 640 560 Q 660 590 525 600" fill="none" stroke="#020617" stroke-width="4" stroke-linecap="round"/>
</svg>`;

export const SAMPLE_CIRCUITS: SampleCircuit[] = [
  {
    id: "sample-led-no-resistor",
    title: "LED Without Current Resistor",
    badge: "Overcurrent Bug",
    expectedBehaviour: "When the push button is pressed, the red LED connected to Pin 13 should turn on safely.",
    arduinoCode: `// Arduino Uno Pushbutton & LED Sketch
const int buttonPin = 2;
const int ledPin = 13;

void setup() {
  pinMode(buttonPin, INPUT); // Warning: Floating input
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(buttonPin);
  if (buttonState == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`,
    observedBehaviour: "The LED flashed once very brightly and then went completely dark. The button also triggers randomly when I move my hand near the breadboard.",
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(SAMPLE_CIRCUIT_SVG)}`,
  },
  {
    id: "sample-floating-pin",
    title: "Floating Button Input (No Pullup)",
    badge: "Antenna Bug",
    expectedBehaviour: "The LED should illuminate only while the button on Pin 2 is actively held down, and turn off immediately when released.",
    arduinoCode: `const int buttonPin = 2;
const int ledPin = 13;

void setup() {
  pinMode(buttonPin, INPUT); // Bug: Needs INPUT_PULLUP
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (digitalRead(buttonPin) == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`,
    observedBehaviour: "The LED jitters and flashes on and off on its own even when nobody is pressing the push button.",
    svgDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(SAMPLE_CIRCUIT_SVG)}`,
  },
];

/**
 * Converts an SVG data URI into a standard browser File object for uploading.
 */
export async function dataUriToFile(dataUri: string, filename: string): Promise<File> {
  const res = await fetch(dataUri);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/svg+xml" });
}
