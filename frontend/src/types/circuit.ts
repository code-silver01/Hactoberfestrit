// ── CircuitSense TypeScript Type Definitions ──────────────────────────────

export type Confidence = "confirmed" | "likely" | "possible";

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  label: string;
}

export interface DetectedComponent {
  name: string;
  type: string;
  pins: string[];
  connections: string[];
  value: string | null;
  confidence: Confidence;
  bounding_box: BoundingBox | null;
  notes: string;
}

export interface PowerGround {
  vcc_connections: string[];
  gnd_connections: string[];
  voltage: string;
  notes: string;
}

export interface CircuitJSON {
  components: DetectedComponent[];
  power_ground: PowerGround | null;
  pin_connections: Record<string, string[]>;
  unclear_areas: string[];
  overall_confidence: Confidence;
}

export interface VerificationStep {
  action: string;
  expected_result: string;
}

export interface DiagnosisIssue {
  issue_id: number;
  problem: string;
  evidence: string;
  fix: string;
  fix_type: string;
  confidence: Confidence;
  verify?: VerificationStep | null;
  rewiring_steps: string[];
  code_diff: string | null;
  simple_explanation: string | null;
  bounding_box: BoundingBox | null;
}

export interface SanityCheckResult {
  check_name: string;
  passed: boolean;
  message: string;
  severity: string;
}

export interface AnalyzeResponse {
  circuit: CircuitJSON;
  sanity_checks: SanityCheckResult[];
  diagnosis: DiagnosisIssue[];
  summary: string;
  image_width: number;
  image_height: number;
  session_id: string;
  clarification_needed: string | null;
  reasoning_trace: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
}

export interface SimplifyResponse {
  simple_explanation: string;
  analogy: string;
}

// ── App State ─────────────────────────────────────────────────────────────

export type AppScreen = "landing" | "upload" | "analysis" | "diagnosis";

export interface UploadFormData {
  image: File | null;
  imagePreview: string | null;
  expectedBehaviour: string;
  arduinoCode: string;
  observedBehaviour: string;
}
