"""
Pydantic schemas for CircuitSense API request/response models.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────────

class Confidence(str, Enum):
    CONFIRMED = "confirmed"
    LIKELY = "likely"
    POSSIBLE = "possible"


# ── Circuit Analysis Models ───────────────────────────────────────────────────

class BoundingBox(BaseModel):
    """Normalized bounding box on 0–1000 scale [ymin, xmin, ymax, xmax]."""
    ymin: float = Field(..., ge=0, le=1000)
    xmin: float = Field(..., ge=0, le=1000)
    ymax: float = Field(..., ge=0, le=1000)
    xmax: float = Field(..., ge=0, le=1000)
    label: str = ""


class DetectedComponent(BaseModel):
    """A single component detected in the circuit screenshot."""
    name: str
    type: str  # e.g., "LED", "resistor", "button", "potentiometer", "ultrasonic"
    pins: list[str] = []
    connections: list[str] = []
    value: Optional[str] = None  # e.g., "220Ω", "10kΩ"
    confidence: Confidence = Confidence.LIKELY
    bounding_box: Optional[BoundingBox] = None
    notes: str = ""


class PowerGround(BaseModel):
    """Power and ground rail connections."""
    vcc_connections: list[str] = []
    gnd_connections: list[str] = []
    voltage: str = "5V"
    notes: str = ""


class CircuitJSON(BaseModel):
    """Structured representation of the detected circuit."""
    components: list[DetectedComponent] = []
    power_ground: Optional[PowerGround] = None
    pin_connections: dict[str, list[str]] = {}  # Arduino pin → connected components
    unclear_areas: list[str] = []
    overall_confidence: Confidence = Confidence.LIKELY


# ── Diagnosis Models ──────────────────────────────────────────────────────────

class VerificationStep(BaseModel):
    """A single step to verify the diagnosis."""
    action: str
    expected_result: str


class DiagnosisIssue(BaseModel):
    """A single diagnosed issue with the circuit."""
    issue_id: int
    problem: str
    evidence: str
    fix: str
    fix_type: str = "rewiring"  # "rewiring", "code", "component", "both"
    confidence: Confidence = Confidence.LIKELY
    verify: Optional[VerificationStep] = None
    rewiring_steps: list[str] = []
    code_diff: Optional[str] = None
    simple_explanation: Optional[str] = None
    bounding_box: Optional[BoundingBox] = None


class SanityCheckResult(BaseModel):
    """Result from the Python rule engine."""
    check_name: str
    passed: bool
    message: str
    severity: str = "warning"  # "error", "warning", "info"


# ── API Request/Response Models ───────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Request body for /api/analyze endpoint."""
    image_base64: str = Field(..., description="Base64-encoded circuit screenshot")
    expected_behaviour: str = Field(..., description="What the circuit should do")
    arduino_code: Optional[str] = Field(None, description="Arduino sketch code")
    observed_behaviour: Optional[str] = Field(None, description="What actually happens")


class AnalyzeResponse(BaseModel):
    """Response from /api/analyze endpoint."""
    circuit: CircuitJSON
    sanity_checks: list[SanityCheckResult] = []
    diagnosis: list[DiagnosisIssue] = []
    summary: str = ""
    image_width: int = 0
    image_height: int = 0
    session_id: str = ""
    clarification_needed: Optional[str] = None
    reasoning_trace: Optional[str] = None


class ChatMessage(BaseModel):
    """A single chat message."""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request body for /api/chat follow-up endpoint."""
    message: str
    session_id: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    """Response from /api/chat endpoint."""
    reply: str
    session_id: str


class SimplifyRequest(BaseModel):
    """Request to re-explain an issue in simpler terms."""
    issue: DiagnosisIssue
    context: str = ""


class SimplifyResponse(BaseModel):
    """Simplified explanation of an issue."""
    simple_explanation: str
    analogy: str
