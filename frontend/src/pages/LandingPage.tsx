import { useState } from "react";
import { SAMPLE_CIRCUITS, type SampleCircuit } from "../services/sampleCircuits";

interface Props {
  onStartDebug: () => void;
  onSelectSample: (sample: SampleCircuit) => void;
}

export function LandingPage({ onStartDebug, onSelectSample }: Props) {
  const [activeTab, setActiveTab] = useState<"circuit" | "xray" | "diagnosis">("xray");

  return (
    <div className="landing-container">
      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="landing-hero text-center">
        <div className="landing-pill animate-fade-in">
          <span className="landing-pill-icon">⚡</span>
          <span className="landing-pill-text">Google Gemma 4 Multimodal Vision &amp; Deep Reasoning</span>
        </div>

        <h1 className="landing-headline">
          Snap your circuit.
          <br />
          <span className="gradient-text">Gemma 4 finds the bug.</span>
        </h1>

        <p className="landing-subhead">
          The intelligent hardware debugger built specifically for beginners using <strong>Wokwi</strong>, <strong>Tinkercad</strong>, or physical breadboards.
          Detects invisible wiring flaws, floating inputs, missing resistors, and firmware mismatches in seconds.
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg pulse-glow"
            onClick={onStartDebug}
            id="landing-cta-btn"
          >
            ⚡ Launch Circuit Debugger →
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => onSelectSample(SAMPLE_CIRCUITS[0])}
            id="landing-try-sample-btn"
          >
            🔬 Test With Sample Circuit
          </button>
        </div>

        {/* Platform badges */}
        <div className="landing-platforms">
          <span className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Designed For Simulators &amp; Microcontrollers:
          </span>
          <div className="platform-badges">
            <span className="platform-tag">⚡ Wokwi</span>
            <span className="platform-tag">📐 Tinkercad Circuits</span>
            <span className="platform-tag">🔌 Arduino Uno R3 / R4</span>
            <span className="platform-tag">📟 Arduino Nano</span>
            <span className="platform-tag">📡 ESP32 / Breadboards</span>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE PREVIEW SHOWCASE ──────────────────────────────── */}
      <section className="landing-showcase card">
        <div className="showcase-header">
          <div className="flex items-center gap-sm">
            <div className="traffic-dot red" />
            <div className="traffic-dot yellow" />
            <div className="traffic-dot green" />
            <span className="showcase-title">CircuitSense Interactive Diagnostic Demo</span>
          </div>

          <div className="showcase-tabs">
            <button
              type="button"
              className={`showcase-tab ${activeTab === "circuit" ? "active" : ""}`}
              onClick={() => setActiveTab("circuit")}
            >
              📷 1. Raw Simulator
            </button>
            <button
              type="button"
              className={`showcase-tab ${activeTab === "xray" ? "active" : ""}`}
              onClick={() => setActiveTab("xray")}
            >
              📡 2. Gemma X-Ray
            </button>
            <button
              type="button"
              className={`showcase-tab ${activeTab === "diagnosis" ? "active" : ""}`}
              onClick={() => setActiveTab("diagnosis")}
            >
              📋 3. Ranked Fixes
            </button>
          </div>
        </div>

        <div className="showcase-body">
          {activeTab === "circuit" && (
            <div className="showcase-view-panel">
              <div className="showcase-img-box">
                <img
                  src={SAMPLE_CIRCUITS[0].svgDataUri}
                  alt="Wokwi circuit simulator preview"
                  className="showcase-img"
                />
              </div>
              <div className="showcase-side-info">
                <h4>User Input Context</h4>
                <p className="text-sm text-secondary">
                  <strong>Expected:</strong> "When push button is pressed, turn on red LED on Pin 13."
                </p>
                <p className="text-sm text-secondary">
                  <strong>Observed:</strong> "LED flashed once brightly and died. Button does not trigger."
                </p>
                <div className="code-badge-box">
                  <code>pinMode(2, INPUT); pinMode(13, OUTPUT);</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === "xray" && (
            <div className="showcase-view-panel">
              <div className="showcase-img-box" style={{ position: "relative" }}>
                <img
                  src={SAMPLE_CIRCUITS[0].svgDataUri}
                  alt="Circuit with X-ray vision overlay"
                  className="showcase-img"
                />
                {/* Visual marker overlays */}
                <div
                  className="demo-marker error"
                  style={{ top: "40%", left: "51%", width: "12%", height: "23%" }}
                  title="Issue #1: Missing Resistor"
                >
                  <span className="demo-marker-tag">1. Missing Resistor</span>
                </div>
                <div
                  className="demo-marker warning"
                  style={{ top: "74%", left: "53%", width: "12%", height: "21%" }}
                  title="Issue #2: Floating Input"
                >
                  <span className="demo-marker-tag">2. Floating Pin</span>
                </div>
              </div>
              <div className="showcase-side-info">
                <h4>🔍 Topology Extraction</h4>
                <ul className="topology-list">
                  <li><span className="badge badge-confirmed">Confirmed</span> Arduino Uno connected to Pin 13 &amp; Pin 2</li>
                  <li><span className="badge badge-confirmed">Confirmed</span> Red LED on Pin 13 with 0Ω series resistance</li>
                  <li><span className="badge badge-warning">Likely</span> Button wired without internal pullup resistor</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "diagnosis" && (
            <div className="showcase-view-panel">
              <div className="diagnosis-preview-cards">
                <div className="mini-diag-card critical">
                  <div className="flex items-center justify-between mb-xs">
                    <span className="badge badge-error">CRITICAL #1</span>
                    <span className="text-xs text-muted">Overcurrent Risk</span>
                  </div>
                  <h5>Missing current-limiting resistor on Red LED</h5>
                  <p className="text-xs text-secondary mb-sm">
                    Pin 13 delivers 5V directly to a 2.0V forward LED with no series resistor (&gt;40mA draw).
                  </p>
                  <div className="fix-tag">✓ Fix: Add 220Ω–330Ω resistor in series on breadboard</div>
                </div>

                <div className="mini-diag-card warning">
                  <div className="flex items-center justify-between mb-xs">
                    <span className="badge badge-warning">WARNING #2</span>
                    <span className="text-xs text-muted">Floating Input</span>
                  </div>
                  <h5>Floating Pushbutton Pin (Antenna Effect)</h5>
                  <p className="text-xs text-secondary mb-sm">
                    Button pin fluctuates between HIGH and LOW due to electrical noise.
                  </p>
                  <div className="fix-tag">✓ Fix: Change pinMode(2, INPUT_PULLUP) in setup()</div>
                </div>
              </div>

              <div className="showcase-side-info">
                <h4>💡 Explain Simply (ELI5)</h4>
                <div className="eli5-quote">
                  "A resistor is like a water valve. Without it, opening a 5V dam into a tiny LED hose bursts the balloon instantly."
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm mt-md w-full"
                  onClick={onStartDebug}
                >
                  Run on Your Own Circuit →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CORE FEATURES ─────────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="text-center mb-xl">
          <h2 className="section-title-lg">Everything you need to debug circuits like a pro</h2>
          <p className="text-secondary max-w-600 mx-auto">
            Not a generic conversational bot. CircuitSense is an end-to-end electrical debugging engine tailored for simulation learners.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Multimodal Vision Extraction</h3>
            <p>
              Gemma 4 reads simulator screenshots directly, identifying MCUs, breadboard ties, ICs, LEDs, and pushbuttons. If a wire is unclear, it flags it rather than hallucinating.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Deterministic Rule Engine</h3>
            <p>
              Pre-flight checks instantly detect floating pins, missing LED resistors, short circuits to GND, and incorrect component orientations before deep reasoning kicks in.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Firmware-Wiring Cross-Check</h3>
            <p>
              Cross-references your physical wiring against your C++ Arduino sketch (.ino). Catches subtle bugs where code addresses Pin 9 while wires are plugged into Pin 8.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📡</div>
            <h3>Interactive X-Ray Overlays</h3>
            <p>
              Troublesome parts and incorrect wire rows are highlighted with visual bounding boxes placed directly on your screenshot, showing you exactly where to look.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Explain Simply Mode (ELI5)</h3>
            <p>
              Beginners get intuitive real-world analogies (water pressure, spring gates, valves) for every issue, so you learn electrical principles without getting buried in math.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Contextual Follow-Up Chat</h3>
            <p>
              Ask follow-up questions ("Can I use a 10k resistor instead?", "Why did the LED burn out?") with complete hardware and code context preserved throughout your session.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="landing-steps">
        <div className="text-center mb-xl">
          <h2 className="section-title-lg">How CircuitSense Works</h2>
          <p className="text-secondary max-w-600 mx-auto">
            Three simple steps to go from a broken simulator sketch to a working prototype.
          </p>
        </div>

        <div className="steps-row">
          <div className="step-card">
            <div className="step-number">01</div>
            <h4>Snap &amp; Describe</h4>
            <p>
              Take a screenshot from Wokwi, Tinkercad, or your workbench. Describe what you expected to happen, and optionally paste your Arduino sketch.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h4>Gemma 4 Analysis</h4>
            <p>
              Gemma 4 extracts component connections, checks power and ground rails, runs automated safety rules, and reasons through potential circuit flaws.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h4>Fix &amp; Verify</h4>
            <p>
              Get ranked bug cards with step-by-step rewiring guides, code diffs (+/-), verification checklists, and real-time interactive follow-up chat.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM BANNER ─────────────────────────────────────────── */}
      <section className="landing-cta-banner card text-center">
        <h2>Stop guessing. Start understanding.</h2>
        <p className="text-secondary mb-lg max-w-500 mx-auto">
          Upload your Arduino circuit screenshot and let Gemma 4 pin down the exact wiring and code bugs in seconds.
        </p>
        <div className="flex justify-center gap-md">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onStartDebug}
          >
            ⚡ Start Debugging Free →
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="flex items-center justify-between flex-wrap gap-md">
          <div className="flex items-center gap-sm">
            <span className="app-logo-icon" style={{ width: 28, height: 28, fontSize: "1rem" }}>⚡</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>CircuitSense</span>
            <span className="text-xs text-muted">— Powered by Google Gemma 4</span>
          </div>
          <div className="text-xs text-muted">
            Designed for Arduino, Wokwi, and Tinkercad beginners.
          </div>
        </div>
      </footer>
    </div>
  );
}
