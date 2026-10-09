"""
Circuit analysis orchestrator.
Coordinates the full pipeline: image analysis → sanity checks → diagnosis.
Manages session state for follow-up chat.
"""
import json
import uuid
import base64
from io import BytesIO
from PIL import Image

try:
    from backend.services.gemma_client import GemmaClient
    from backend.services.sanity_checker import run_all_checks
    from backend.services.prompts import (
        CIRCUIT_ANALYSIS_SYSTEM,
        CIRCUIT_ANALYSIS_PROMPT,
        DIAGNOSIS_SYSTEM,
        DIAGNOSIS_PROMPT,
        CLARIFICATION_PROMPT,
        SIMPLIFY_PROMPT,
        CHAT_SYSTEM,
        CHAT_PROMPT,
    )
    from backend.models.schemas import (
        AnalyzeRequest,
        AnalyzeResponse,
        CircuitJSON,
        DiagnosisIssue,
        SanityCheckResult,
        ChatRequest,
        ChatResponse,
        SimplifyRequest,
        SimplifyResponse,
    )
except ModuleNotFoundError:
    from services.gemma_client import GemmaClient
    from services.sanity_checker import run_all_checks
    from services.prompts import (
        CIRCUIT_ANALYSIS_SYSTEM,
        CIRCUIT_ANALYSIS_PROMPT,
        DIAGNOSIS_SYSTEM,
        DIAGNOSIS_PROMPT,
        CLARIFICATION_PROMPT,
        SIMPLIFY_PROMPT,
        CHAT_SYSTEM,
        CHAT_PROMPT,
    )
    from models.schemas import (
        AnalyzeRequest,
        AnalyzeResponse,
        CircuitJSON,
        DiagnosisIssue,
        SanityCheckResult,
        ChatRequest,
        ChatResponse,
        SimplifyRequest,
        SimplifyResponse,
    )


# In-memory session store for follow-up chat context
_sessions: dict[str, dict] = {}


class CircuitAnalyzer:
    """Orchestrates the full circuit analysis pipeline."""

    def __init__(self):
        self.client = GemmaClient()

    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        """
        Full analysis pipeline:
        1. Send screenshot to Gemma 4 for component detection
        2. Run Python sanity checks on detected circuit
        3. Send circuit + sanity results + code to Gemma 4 for diagnosis
        4. Store session for follow-up chat
        """
        # Get image dimensions for overlay scaling
        img_width, img_height = self._get_image_dimensions(request.image_base64)

        # ── Step 1: Circuit extraction via Gemma 4 vision ──
        code_section = ""
        if request.arduino_code:
            code_section = f"Arduino code:\n```cpp\n{request.arduino_code}\n```"

        observed_section = ""
        if request.observed_behaviour:
            observed_section = f"Observed (actual) behaviour: {request.observed_behaviour}"

        analysis_prompt = CIRCUIT_ANALYSIS_PROMPT.format(
            expected_behaviour=request.expected_behaviour,
            code_section=code_section,
            observed_section=observed_section,
        )

        raw_analysis = await self.client.analyze_image(
            image_base64=request.image_base64,
            prompt=analysis_prompt,
            system_prompt=CIRCUIT_ANALYSIS_SYSTEM,
        )

        # Parse circuit JSON
        try:
            circuit_data = self.client.parse_json_response(raw_analysis)
            circuit = CircuitJSON(**circuit_data)
        except (ValueError, Exception) as e:
            # If parsing fails, the image might be unclear — ask for clarification
            clarification = await self._ask_clarification(raw_analysis)
            return AnalyzeResponse(
                circuit=CircuitJSON(),
                clarification_needed=clarification,
                image_width=img_width,
                image_height=img_height,
            )

        # Check if model flagged too many unclear areas
        if (
            circuit.overall_confidence.value == "possible"
            and len(circuit.unclear_areas) > 2
        ):
            clarification = await self._ask_clarification(
                json.dumps(circuit_data, indent=2)
            )
            return AnalyzeResponse(
                circuit=circuit,
                clarification_needed=clarification,
                image_width=img_width,
                image_height=img_height,
            )

        # ── Step 2: Run Python sanity checks ──
        sanity_results = run_all_checks(circuit, request.arduino_code)

        # ── Step 3: Diagnosis via Gemma 4 reasoning ──
        diagnosis = await self._diagnose(
            circuit, sanity_results, request, code_section, observed_section
        )

        # ── Step 4: Store session for follow-up ──
        session_id = str(uuid.uuid4())
        _sessions[session_id] = {
            "circuit": circuit.model_dump(),
            "diagnosis": [d.model_dump() for d in diagnosis],
            "request": request.model_dump(),
            "image_base64": request.image_base64,
        }

        return AnalyzeResponse(
            circuit=circuit,
            sanity_checks=sanity_results,
            diagnosis=diagnosis,
            summary=self._build_summary(diagnosis, sanity_results),
            image_width=img_width,
            image_height=img_height,
            session_id=session_id,
        )

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """Handle follow-up chat with circuit context."""
        session = _sessions.get(request.session_id)
        if not session:
            return ChatResponse(
                reply="Session not found. Please re-upload your circuit to start a new analysis.",
                session_id=request.session_id,
            )

        circuit_context = json.dumps(session["circuit"], indent=2)
        diagnosis_context = json.dumps(session["diagnosis"], indent=2)

        system = CHAT_SYSTEM.format(
            circuit_context=circuit_context,
            diagnosis_context=diagnosis_context,
        )

        messages = [{"role": m.role, "content": m.content} for m in request.history]
        messages.append({"role": "user", "content": request.message})

        reply = await self.client.chat(messages=messages, system_prompt=system)

        return ChatResponse(reply=reply, session_id=request.session_id)

    async def simplify(self, request: SimplifyRequest) -> SimplifyResponse:
        """Re-explain an issue in simpler terms with an analogy."""
        prompt = SIMPLIFY_PROMPT.format(
            problem=request.issue.problem,
            evidence=request.issue.evidence,
            fix=request.issue.fix,
        )

        raw = await self.client.chat(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )

        try:
            data = self.client.parse_json_response(raw)
            return SimplifyResponse(**data)
        except (ValueError, Exception):
            return SimplifyResponse(
                simple_explanation=raw.strip(),
                analogy="",
            )

    async def _diagnose(
        self,
        circuit: CircuitJSON,
        sanity_results: list[SanityCheckResult],
        request: AnalyzeRequest,
        code_section: str,
        observed_section: str,
    ) -> list[DiagnosisIssue]:
        """Run Gemma 4 diagnosis with thinking/reasoning mode."""
        sanity_text = "\n".join(
            f"- {'✅' if r.passed else '❌'} [{r.check_name}] {r.message}"
            for r in sanity_results
        )

        diagnosis_prompt = DIAGNOSIS_PROMPT.format(
            circuit_json=json.dumps(circuit.model_dump(), indent=2),
            expected_behaviour=request.expected_behaviour,
            code_section=code_section if request.arduino_code else "No code provided.",
            observed_section=observed_section if request.observed_behaviour else "No observed behaviour reported.",
            sanity_results=sanity_text or "No sanity checks ran.",
        )

        raw_diagnosis = await self.client.chat(
            messages=[{"role": "user", "content": diagnosis_prompt}],
            system_prompt=DIAGNOSIS_SYSTEM,
            temperature=0.1,  # Low temp for precise reasoning
        )

        try:
            issues_data = self.client.parse_json_response(raw_diagnosis)
            if isinstance(issues_data, list):
                return [DiagnosisIssue(**item) for item in issues_data]
            return []
        except (ValueError, Exception):
            # Return a single issue noting the parsing failure
            return [DiagnosisIssue(
                issue_id=0,
                problem="Analysis completed but diagnosis formatting was unexpected",
                evidence=raw_diagnosis[:500],
                fix="Please review the raw analysis output",
                confidence="possible",
            )]

    async def _ask_clarification(self, partial_analysis: str) -> str:
        """Ask one targeted clarification question instead of guessing."""
        prompt = CLARIFICATION_PROMPT.format(partial_analysis=partial_analysis[:2000])
        return await self.client.chat(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

    def _get_image_dimensions(self, image_base64: str) -> tuple[int, int]:
        """Get width and height from base64 image."""
        try:
            image_data = base64.b64decode(image_base64)
            img = Image.open(BytesIO(image_data))
            return img.size  # (width, height)
        except Exception:
            return (800, 600)  # Default fallback

    def _build_summary(
        self,
        diagnosis: list[DiagnosisIssue],
        sanity_checks: list[SanityCheckResult],
    ) -> str:
        """Build a human-readable summary of findings."""
        if not diagnosis:
            failed_checks = [c for c in sanity_checks if not c.passed]
            if failed_checks:
                return f"No critical issues found, but {len(failed_checks)} sanity check(s) flagged potential concerns."
            return "Circuit looks good! No issues detected based on the screenshot and provided information."

        confirmed = [d for d in diagnosis if d.confidence.value == "confirmed"]
        likely = [d for d in diagnosis if d.confidence.value == "likely"]
        possible = [d for d in diagnosis if d.confidence.value == "possible"]

        parts = []
        if confirmed:
            parts.append(f"{len(confirmed)} confirmed issue(s)")
        if likely:
            parts.append(f"{len(likely)} likely issue(s)")
        if possible:
            parts.append(f"{len(possible)} possible issue(s)")

        return f"Found {', '.join(parts)}. Review the diagnosis cards below for details and fixes."


def get_session(session_id: str) -> dict | None:
    """Retrieve a session for the chat endpoint."""
    return _sessions.get(session_id)
