"""
/api/chat — Follow-up chat and simplification endpoints.
Keeps circuit, code, and diagnosis in context. No re-uploading needed.
"""
from fastapi import APIRouter, HTTPException

try:
    from backend.services.circuit_analyzer import CircuitAnalyzer
    from backend.models.schemas import (
        ChatRequest,
        ChatResponse,
        SimplifyRequest,
        SimplifyResponse,
    )
except ModuleNotFoundError:
    from services.circuit_analyzer import CircuitAnalyzer
    from models.schemas import (
        ChatRequest,
        ChatResponse,
        SimplifyRequest,
        SimplifyResponse,
    )

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_followup(request: ChatRequest):
    """
    Follow-up chat with the circuit context.
    Requires a valid session_id from a previous /api/analyze call.
    """
    analyzer = CircuitAnalyzer()

    try:
        result = await analyzer.chat(request)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error communicating with Gemma 4: {str(e)}",
        )

    return result


@router.post("/simplify", response_model=SimplifyResponse)
async def simplify_issue(request: SimplifyRequest):
    """
    Re-explain a diagnosis issue in simpler terms with an everyday analogy.
    """
    analyzer = CircuitAnalyzer()

    try:
        result = await analyzer.simplify(request)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error generating simplified explanation: {str(e)}",
        )

    return result
