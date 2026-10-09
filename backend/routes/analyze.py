"""
/api/analyze — Upload circuit screenshot for full analysis.
"""
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

try:
    from backend.services.circuit_analyzer import CircuitAnalyzer
    from backend.models.schemas import AnalyzeResponse, AnalyzeRequest
except ModuleNotFoundError:
    from services.circuit_analyzer import CircuitAnalyzer
    from models.schemas import AnalyzeResponse, AnalyzeRequest

router = APIRouter()

# Allowed image types and max size (10 MB)
ALLOWED_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"}
MAX_SIZE_BYTES = 10 * 1024 * 1024


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_circuit(
    image: UploadFile = File(..., description="Circuit screenshot"),
    expected_behaviour: str = Form(..., description="What the circuit should do"),
    arduino_code: Optional[str] = Form(None, description="Arduino sketch code"),
    observed_behaviour: Optional[str] = Form(None, description="What actually happens"),
):
    """
    Analyze a circuit screenshot with Gemma 4.
    Returns detected components, sanity check results, and ranked diagnosis.
    """
    # ── Validate upload ──
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{image.content_type}'. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    contents = await image.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(contents) / 1024 / 1024:.1f} MB). Maximum: 10 MB.",
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    # ── Encode and analyze ──
    image_base64 = base64.b64encode(contents).decode("utf-8")

    request = AnalyzeRequest(
        image_base64=image_base64,
        expected_behaviour=expected_behaviour,
        arduino_code=arduino_code,
        observed_behaviour=observed_behaviour,
    )

    analyzer = CircuitAnalyzer()

    try:
        result = await analyzer.analyze(request)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error communicating with Gemma 4: {str(e)}",
        )

    return result
