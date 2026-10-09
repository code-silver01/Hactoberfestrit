"""
Python rule engine for fast sanity checks on Arduino circuits.
These feed results to Gemma 4 as supporting evidence — they don't replace the model.

Scope (v1): Arduino Uno, LEDs, resistors, buttons, potentiometers, ultrasonic sensors.
"""
import re
try:
    from backend.models.schemas import SanityCheckResult, CircuitJSON
except ModuleNotFoundError:
    from models.schemas import SanityCheckResult, CircuitJSON


def run_all_checks(
    circuit: CircuitJSON,
    arduino_code: str | None = None,
) -> list[SanityCheckResult]:
    """Run all sanity checks and return results."""
    results = []
    results.extend(check_missing_resistor(circuit))
    results.extend(check_missing_ground(circuit))
    results.extend(check_power_issues(circuit))

    if arduino_code:
        results.extend(check_pin_mismatch(circuit, arduino_code))
        results.extend(check_pinmode(arduino_code))
        results.extend(check_serial_pin_conflict(circuit, arduino_code))

    return results


def check_missing_resistor(circuit: CircuitJSON) -> list[SanityCheckResult]:
    """Check if LEDs have current-limiting resistors."""
    results = []
    leds = [c for c in circuit.components if c.type.lower() == "led"]
    resistors = [c for c in circuit.components if c.type.lower() == "resistor"]

    for led in leds:
        # Check if any resistor is mentioned in the LED's connections
        has_resistor = False
        led_connections_text = " ".join(led.connections).lower()
        for resistor in resistors:
            if resistor.name.lower() in led_connections_text:
                has_resistor = True
                break
        # Also check if "resistor" is mentioned generically
        if "resistor" in led_connections_text or "ohm" in led_connections_text or "ω" in led_connections_text:
            has_resistor = True

        if not has_resistor and resistors:
            # There are resistors but none connected to this LED
            results.append(SanityCheckResult(
                check_name="missing_led_resistor",
                passed=False,
                message=f"{led.name} may not have a current-limiting resistor. "
                        f"Without one, the LED could burn out or draw too much current from the Arduino pin (max 20mA).",
                severity="error",
            ))
        elif not has_resistor and not resistors:
            results.append(SanityCheckResult(
                check_name="missing_led_resistor",
                passed=False,
                message=f"No resistors detected in the circuit, but {led.name} is present. "
                        f"LEDs need a current-limiting resistor (typically 220Ω–1kΩ for 5V).",
                severity="error",
            ))

    if leds and all(r.passed for r in results if r.check_name == "missing_led_resistor"):
        results.append(SanityCheckResult(
            check_name="missing_led_resistor",
            passed=True,
            message="All LEDs appear to have current-limiting resistors.",
            severity="info",
        ))

    return results


def check_missing_ground(circuit: CircuitJSON) -> list[SanityCheckResult]:
    """Check if the circuit has proper ground connections."""
    results = []

    if circuit.power_ground:
        if not circuit.power_ground.gnd_connections:
            results.append(SanityCheckResult(
                check_name="missing_ground",
                passed=False,
                message="No ground (GND) connections detected. The circuit needs a complete path back to ground to function.",
                severity="error",
            ))
        else:
            results.append(SanityCheckResult(
                check_name="missing_ground",
                passed=True,
                message=f"Ground connections detected: {', '.join(circuit.power_ground.gnd_connections[:5])}",
                severity="info",
            ))
    else:
        results.append(SanityCheckResult(
            check_name="missing_ground",
            passed=False,
            message="Could not determine power/ground rail connections from the circuit image.",
            severity="warning",
        ))

    return results


def check_power_issues(circuit: CircuitJSON) -> list[SanityCheckResult]:
    """Check for basic power supply issues."""
    results = []

    if circuit.power_ground:
        if not circuit.power_ground.vcc_connections:
            results.append(SanityCheckResult(
                check_name="power_supply",
                passed=False,
                message="No 5V/VCC connections detected. Components may not be receiving power.",
                severity="error",
            ))

    return results


def check_pin_mismatch(circuit: CircuitJSON, code: str) -> list[SanityCheckResult]:
    """Check if pins used in code match pins used in wiring."""
    results = []

    # Extract digital pin numbers from code
    code_pins = set()
    # Match patterns like: digitalWrite(13, ...), digitalRead(2), analogRead(A0), pinMode(7, ...)
    pin_patterns = [
        r'(?:digitalWrite|digitalRead|analogWrite|pinMode)\s*\(\s*(\d+)',
        r'(?:analogRead)\s*\(\s*(?:A)?(\d+)',
    ]
    for pattern in pin_patterns:
        matches = re.findall(pattern, code)
        for m in matches:
            code_pins.add(f"D{m}" if not m.startswith("A") else f"A{m}")

    # Also check for #define or const int pin assignments
    define_pattern = r'(?:#define|const\s+int)\s+\w+\s+(\d+)'
    for m in re.findall(define_pattern, code):
        code_pins.add(f"D{m}")

    # Get wiring pins from circuit
    wiring_pins = set()
    for pin_name in circuit.pin_connections.keys():
        # Normalize pin names
        normalized = pin_name.upper().replace("PIN", "").replace(" ", "").strip()
        if normalized.startswith("D") or normalized.startswith("A"):
            wiring_pins.add(normalized)
        elif normalized.isdigit():
            wiring_pins.add(f"D{normalized}")

    # Find mismatches
    code_only = code_pins - wiring_pins
    wiring_only = wiring_pins - code_pins

    if code_only:
        results.append(SanityCheckResult(
            check_name="pin_mismatch",
            passed=False,
            message=f"Pins used in code but not found in wiring: {', '.join(sorted(code_only))}. "
                    f"Check that the physical connections match the pin numbers in your sketch.",
            severity="error",
        ))

    if wiring_only:
        results.append(SanityCheckResult(
            check_name="pin_mismatch",
            passed=False,
            message=f"Pins wired but not referenced in code: {', '.join(sorted(wiring_only))}. "
                    f"These pins may need corresponding code (pinMode, read/write).",
            severity="warning",
        ))

    if not code_only and not wiring_only and (code_pins or wiring_pins):
        results.append(SanityCheckResult(
            check_name="pin_mismatch",
            passed=True,
            message="All pins in code match the physical wiring.",
            severity="info",
        ))

    return results


def check_pinmode(code: str) -> list[SanityCheckResult]:
    """Check if pins used for I/O have proper pinMode() calls in setup()."""
    results = []

    # Find pins used in digitalWrite/digitalRead
    io_pins = set()
    for m in re.findall(r'(?:digitalWrite|digitalRead)\s*\(\s*(\w+)', code):
        io_pins.add(m)

    # Find pins with pinMode set
    mode_pins = set()
    for m in re.findall(r'pinMode\s*\(\s*(\w+)', code):
        mode_pins.add(m)

    missing_mode = io_pins - mode_pins
    if missing_mode:
        results.append(SanityCheckResult(
            check_name="missing_pinmode",
            passed=False,
            message=f"Pins used for I/O without explicit pinMode(): {', '.join(sorted(missing_mode))}. "
                    f"While pins default to INPUT, it's best practice to set pinMode() explicitly in setup().",
            severity="warning",
        ))

    return results


def check_serial_pin_conflict(circuit: CircuitJSON, code: str) -> list[SanityCheckResult]:
    """Check if pins D0/D1 are used while Serial is active."""
    results = []

    uses_serial = "Serial.begin" in code
    if not uses_serial:
        return results

    # Check if D0 or D1 are used in wiring
    for pin_name in circuit.pin_connections.keys():
        normalized = pin_name.upper().replace("PIN", "").replace(" ", "").strip()
        if normalized in ("D0", "D1", "0", "1"):
            results.append(SanityCheckResult(
                check_name="serial_pin_conflict",
                passed=False,
                message=f"Pin {pin_name} is used in wiring, but Serial.begin() is called in code. "
                        f"Pins D0 (RX) and D1 (TX) are used by Serial communication — using them for "
                        f"other purposes will cause conflicts.",
                severity="error",
            ))

    return results
