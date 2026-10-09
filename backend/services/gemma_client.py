"""
Modular Gemma 4 inference client.
Supports OpenRouter, SiliconFlow, or any OpenAI-compatible endpoint.
Provider is configured via environment variables — never swapped silently.
"""
import os
import json
import httpx
from typing import Optional


class GemmaClient:
    """Client for Gemma 4 multimodal inference via OpenAI-compatible API."""

    def __init__(self):
        self.api_key = os.getenv("GEMMA_API_KEY") or os.getenv("OPENROUTER_API_KEY") or ""
        self.base_url = (
            os.getenv("GEMMA_BASE_URL")
            or os.getenv("OPENROUTER_BASE_URL")
            or "https://openrouter.ai/api/v1"
        )
        self.model = os.getenv("GEMMA_MODEL", "google/gemma-4-12b-it")
        self.max_tokens = int(os.getenv("GEMMA_MAX_TOKENS", "4096"))
        self.temperature = float(os.getenv("GEMMA_TEMPERATURE", "0.2"))

        self.is_demo = not bool(self.api_key)
        if self.is_demo:
            # Fallback to simulated demo mode so app is immediately testable without an API key
            print(
                "[CircuitSense] Note: No GEMMA_API_KEY / OPENROUTER_API_KEY found. "
                "Running in Demo Mode (simulated Gemma 4). Set GEMMA_API_KEY in backend/.env for live model inference."
            )

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://circuitsense.app",
            "X-Title": "CircuitSense",
        }

    async def analyze_image(
        self,
        image_base64: str,
        prompt: str,
        system_prompt: str = "",
        temperature: Optional[float] = None,
    ) -> str:
        """
        Send an image + text prompt to Gemma 4 for multimodal analysis.
        Returns the raw text response from the model.
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image_base64}",
                        "detail": "high",
                    },
                },
            ],
        })

        return await self._call(messages, temperature)

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str = "",
        temperature: Optional[float] = None,
    ) -> str:
        """
        Text-only chat completion (for diagnosis, follow-up, simplification).
        """
        full_messages = []
        if system_prompt:
            full_messages.append({"role": "system", "content": system_prompt})
        full_messages.extend(messages)

        return await self._call(full_messages, temperature)

    async def _call(
        self,
        messages: list[dict],
        temperature: Optional[float] = None,
    ) -> str:
        """Make the actual API call to the inference provider, or use demo fallback."""
        if self.is_demo:
            return self._demo_response(messages)

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": temperature if temperature is not None else self.temperature,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices", [])
        if not choices:
            raise ValueError("No response from Gemma 4 model")

        return choices[0]["message"]["content"]

    def _demo_response(self, messages: list[dict]) -> str:
        """Realistic simulated Gemma 4 response for local demo/testing."""
        full_text = ""
        for m in messages:
            content = m.get("content", "")
            if isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        full_text += part.get("text", "") + " "
            elif isinstance(content, str):
                full_text += content + " "

        lower_text = full_text.lower()

        # 1. Simplification / ELI5 endpoint
        if "re-explain this circuit issue for a complete beginner" in lower_text:
            return json.dumps({
                "simple_explanation": "Electric current flows through wires like water through a pipe. If you connect an LED directly to 5 volts without a resistor, it's like blasting a firehose into a fragile garden flower — the LED will instantly burn out from too much current.",
                "analogy": "A resistor is like a water valve or nozzle. It squeezes the flow down to a safe trickle so your LED glows brightly without getting destroyed."
            })

        # 2. Diagnosis Reasoning Output
        if "diagnose all issues" in lower_text or "given this circuit analysis" in lower_text:
            return json.dumps([
                {
                    "issue_id": 1,
                    "problem": "Missing current-limiting resistor on Red LED",
                    "evidence": "Red LED anode is directly connected to Arduino Pin 13, and cathode connects to GND. There is no series resistor (220Ω–330Ω) in the path. Pin 13 outputs 5V, but a red LED has a forward voltage of ~2.0V, resulting in dangerous overcurrent (>40mA) that can destroy both the LED and the ATmega328P output pin.",
                    "fix": "Place a 220Ω or 330Ω resistor in series between Arduino Pin 13 and the LED anode (longer leg).",
                    "fix_type": "rewiring",
                    "confidence": "confirmed",
                    "verify": {
                        "action": "Insert a 220Ω resistor on the breadboard between Pin 13 and LED anode, then power on the circuit",
                        "expected_result": "LED lights up safely at normal brightness without overheating or burning out"
                    },
                    "rewiring_steps": [
                        "Disconnect the jumper wire from Arduino Pin 13 to LED anode",
                        "Plug one leg of a 220Ω resistor into breadboard row connected to Arduino Pin 13",
                        "Plug the other leg of the resistor into the row with the LED anode (longer lead)",
                        "Keep the LED cathode (shorter lead) connected to Arduino GND"
                    ],
                    "code_diff": None,
                    "simple_explanation": "Think of electrical current like water pressure. Without a resistor acting like a valve to slow it down, too much water rushes into the LED and pops it.",
                    "bounding_box": {
                        "ymin": 280,
                        "xmin": 510,
                        "ymax": 440,
                        "xmax": 630,
                        "label": "Red LED (Missing Resistor)"
                    }
                },
                {
                    "issue_id": 2,
                    "problem": "Floating button input pin (Missing Pull-Up resistor)",
                    "evidence": "The push button connects Pin 2 to GND, but pinMode is set to standard INPUT without an internal or external pull-up resistor. When the button is not pressed, Pin 2 is floating (acting like an antenna) picking up electromagnetic noise and triggering random HIGH/LOW readings.",
                    "fix": "Change pinMode(buttonPin, INPUT) to pinMode(buttonPin, INPUT_PULLUP) in setup(), or wire an external 10kΩ pull-up resistor from Pin 2 to 5V.",
                    "fix_type": "code",
                    "confidence": "confirmed",
                    "verify": {
                        "action": "Change pinMode to INPUT_PULLUP in your sketch, re-upload, and open the Serial Monitor",
                        "expected_result": "digitalRead(2) reads steady HIGH when button is released, and LOW only when pressed"
                    },
                    "rewiring_steps": [
                        "Ensure button terminal 1 connects to Arduino Pin 2",
                        "Ensure button terminal 2 connects to Arduino GND"
                    ],
                    "code_diff": "```diff\n void setup() {\n-  pinMode(buttonPin, INPUT);\n+  pinMode(buttonPin, INPUT_PULLUP);\n   pinMode(ledPin, OUTPUT);\n }\n```",
                    "simple_explanation": "A floating pin is like a door that isn't latched — every gust of wind blows it back and forth. A pull-up resistor is like a gentle spring that holds the door shut until you push it.",
                    "bounding_box": {
                        "ymin": 520,
                        "xmin": 530,
                        "ymax": 670,
                        "xmax": 650,
                        "label": "Button (Floating Pin)"
                    }
                }
            ])

        # 3. Circuit Analysis Vision Extraction
        if "analyze this arduino circuit" in lower_text or "extract the circuit as json" in lower_text or "component detection" in lower_text:
            return json.dumps({
                "components": [
                    {
                        "name": "Arduino Uno R3",
                        "type": "microcontroller",
                        "pins": ["5V", "GND", "D2", "D13"],
                        "connections": ["Breadboard 5V/GND", "LED Anode", "Button Pin 2"],
                        "confidence": "confirmed",
                        "bounding_box": {"ymin": 150, "xmin": 50, "ymax": 750, "xmax": 420, "label": "Arduino Uno"},
                        "notes": "Main development board with USB power"
                    },
                    {
                        "name": "Red LED",
                        "type": "LED",
                        "pins": ["Anode (+)", "Cathode (-)"],
                        "connections": ["Arduino Pin 13", "GND"],
                        "value": "2.0V Forward",
                        "confidence": "confirmed",
                        "bounding_box": {"ymin": 280, "xmin": 510, "ymax": 440, "xmax": 630, "label": "Red LED"},
                        "notes": "Wired directly to Pin 13 without series resistor"
                    },
                    {
                        "name": "Push Button",
                        "type": "button",
                        "pins": ["Terminal 1", "Terminal 2"],
                        "connections": ["Arduino Pin 2", "GND"],
                        "confidence": "confirmed",
                        "bounding_box": {"ymin": 520, "xmin": 530, "ymax": 670, "xmax": 650, "label": "Pushbutton"},
                        "notes": "Tactile pushbutton connected to digital pin 2"
                    }
                ],
                "power_ground": {
                    "vcc_connections": ["Arduino 5V"],
                    "gnd_connections": ["Arduino GND", "LED Cathode", "Button Terminal 2"],
                    "voltage": "5V",
                    "notes": "5V DC power bus"
                },
                "pin_connections": {
                    "D13": ["Red LED Anode"],
                    "D2": ["Push Button Terminal 1"],
                    "GND": ["Red LED Cathode", "Push Button Terminal 2"]
                },
                "unclear_areas": [],
                "overall_confidence": "confirmed"
            })

        # 4. Contextual Follow-up Chat Response
        return (
            "Great question! In Arduino circuits, each I/O pin can safely deliver up to about 20–40mA. "
            "A typical red LED has a forward voltage drop of ~2.0V. Using Ohm's Law (V = I * R):\n\n"
            "$$R = \\frac{V_{supply} - V_{forward}}{I} = \\frac{5V - 2.0V}{0.015A} = 200\\Omega$$\n\n"
            "That's why a **220Ω or 330Ω** resistor is the standard choice. If you only have a 1kΩ or 10kΩ resistor on hand, "
            "a 1kΩ resistor will work fine (the LED will just be slightly dimmer), while a 10kΩ resistor is usually too large and might make the LED barely visible. "
            "Let me know if you want help checking your pin wiring or editing your sketch!"
        )

    def parse_json_response(self, raw: str) -> dict | list:
        """
        Extract JSON from model response, handling markdown fences
        and other common formatting quirks.
        """
        text = raw.strip()

        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first line (```json) and last line (```)
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()

        # Try parsing directly
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to find JSON object or array in the text
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            end = text.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except json.JSONDecodeError:
                    continue

        raise ValueError(f"Could not parse JSON from model response: {text[:200]}...")

    def get_provider_info(self) -> dict:
        """Return current provider configuration (for transparency)."""
        return {
            "model": self.model,
            "base_url": self.base_url,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }
