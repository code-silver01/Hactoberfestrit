// ── CircuitSense API Service ──────────────────────────────────────────────

import type {
  AnalyzeResponse,
  ChatMessage,
  ChatResponse,
  DiagnosisIssue,
  SimplifyResponse,
} from "../types/circuit";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * Upload a circuit screenshot for full analysis.
 */
export async function analyzeCircuit(
  image: File,
  expectedBehaviour: string,
  arduinoCode?: string,
  observedBehaviour?: string
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("expected_behaviour", expectedBehaviour);
  if (arduinoCode) formData.append("arduino_code", arduinoCode);
  if (observedBehaviour) formData.append("observed_behaviour", observedBehaviour);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Analysis failed (${response.status})`);
  }

  return response.json();
}

/**
 * Send a follow-up chat message with circuit context.
 */
export async function chatFollowup(
  message: string,
  sessionId: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      history,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Chat failed (${response.status})`);
  }

  return response.json();
}

/**
 * Re-explain an issue in simpler terms.
 */
export async function simplifyIssue(
  issue: DiagnosisIssue,
  context: string = ""
): Promise<SimplifyResponse> {
  const response = await fetch(`${API_BASE}/simplify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issue, context }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `Simplification failed (${response.status})`);
  }

  return response.json();
}
