# ⚡ CircuitSense

> **Snap your circuit. Gemma 4 finds the bug.**

CircuitSense is an intelligent debugging assistant designed specifically for beginners working with simulated Arduino circuits (Wokwi, Tinkercad, physical breadboards). Powered by **Google's Gemma 4 multimodal model**, it reads circuit screenshots, extracts component and wiring topologies, cross-references hardware with Arduino firmware, and delivers structured, ranked diagnoses with visual overlays and code diffs.

---

## 🚀 Key Features

- **📸 Vision-Powered Circuit Extraction**:
  - Detects microcontrollers (Arduino Uno, Nano, ESP32), breadboards, LEDs, resistors, pushbuttons, sensors, and ICs.
  - Pin-by-pin connectivity extraction with per-item confidence scoring (`confirmed`, `likely`, `unclear`).
  - Strict no-hallucination constraint: parts not clearly visible are flagged for clarification rather than guessed.

- **⚡ Rule-Based Sanity Check Engine**:
  - Instant pre-flight checks: floating pins, missing current-limiting resistors, VCC/GND short circuits, inverted polarity on LEDs/diodes.

- **🧠 Gemma 4 Reasoning & Diagnosis**:
  - Cross-checks wiring against Arduino sketches and stated expected behavior.
  - Generates ranked issues (Critical, Warning, Optimization).
  - Code diff viewer (`+` additions / `-` removals) for firmware fixes.
  - Step-by-step rewiring instructions.

- **📡 Interactive X-Ray Overlay**:
  - Bounding boxes mapped to detected problem areas directly on your circuit screenshot.
  - Color-coded severity indicators.

- **💡 "Explain Simply" Mode (ELI5)**:
  - Beginners can toggle an everyday analogy for any diagnosis (e.g., comparing resistors to water valves or pull-up resistors to spring-loaded gates).

- **💬 Stateful Contextual Follow-up Chat**:
  - Ask follow-up questions ("Can I use a 10k resistor instead?", "Why pin 13?") without re-uploading your image or code.

---

## 🛠 Tech Stack

- **Backend**:
  - **FastAPI** (Python 3.10+)
  - **Pydantic v2** for strict schema validation
  - **Pillow** for image dimension processing
  - **HTTPX** for asynchronous streaming API calls to Gemma 4
  - **Gemma 4** (`google/gemma-4-12b-it` via OpenRouter or native endpoint)

- **Frontend**:
  - **React 18** with **TypeScript**
  - **Vite** bundler
  - **Lucide Icons**
  - Custom dark-mode glassmorphic theme designed for electronics prototyping

---

## 📁 Repository Structure

```
hecktober/
├── backend/
│   ├── main.py                  # FastAPI server entry point & CORS
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment variables template
│   ├── routes/
│   │   ├── analyze.py           # POST /api/analyze (Image + Code)
│   │   └── chat.py              # POST /api/chat & POST /api/simplify
│   ├── services/
│   │   ├── circuit_analyzer.py  # Pipeline orchestrator & session store
│   │   ├── gemma_client.py      # Gemma 4 multimodal inference client
│   │   ├── sanity_checker.py    # Python circuit rule engine
│   │   └── prompts.py           # Structured Gemma 4 prompts
│   └── models/
│       └── schemas.py           # Pydantic data schemas
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # App workflow state manager
│   │   ├── pages/               # Upload, Analysis, and Diagnosis screens
│   │   ├── components/          # XRayOverlay, DiagnosisCard, CodeDiff, ChatPanel
│   │   ├── services/api.ts      # API client
│   │   └── types/circuit.ts     # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **OpenRouter API Key** (or compatible OpenAI-compatible endpoint with `google/gemma-4-12b-it`)

---

### 2. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your credentials:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   GEMMA_MODEL=google/gemma-4-12b-it
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   API Docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Frontend Setup

1. In a separate terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🧪 Usage Flow

1. **Upload**:
   - Take a screenshot of your simulated circuit in Wokwi or Tinkercad.
   - Describe expected behaviour: e.g., *"Pressing the push button should turn on the red LED"*.
   - Optionally paste your `.ino` Arduino code and observed behaviour (*"LED is always off"*).
2. **Inspect**:
   - View detected components with confidence badges.
   - Explore the interactive **X-Ray Overlay** highlighting problematic components directly on the image.
3. **Debug & Fix**:
   - Review ranked issues from most critical to minor warnings.
   - Click **Show Code Diff** or **Show Wiring Steps**.
   - Click **Explain Simply (ELI5)** to view intuitive real-world analogies.
4. **Iterate**:
   - Ask questions in the real-time sidebar chat; all circuit topology and code context are automatically remembered.
