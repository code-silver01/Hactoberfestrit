import { ImageUploader } from "../components/ImageUploader";
import type { UploadFormData } from "../types/circuit";
import type { SampleCircuit } from "../services/sampleCircuits";

interface Props {
  onSubmit: (data: UploadFormData) => void;
  isLoading: boolean;
  initialSample?: SampleCircuit | null;
}

export function UploadPage({ onSubmit, isLoading, initialSample }: Props) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="text-center mb-md" style={{ marginBottom: "var(--space-2xl)" }}>
        <div className="badge badge-info mb-sm" style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
          <span>🛠️</span>
          <span>Interactive Circuit Debugger Workspace</span>
        </div>
        <h1 style={{ marginBottom: "var(--space-xs)" }}>
          Snap your circuit.
          <br />
          <span className="gradient-text">Gemma 4 finds the bug.</span>
        </h1>
        <p style={{ fontSize: "1.063rem", maxWidth: 520, margin: "0 auto" }}>
          Upload a screenshot from Wokwi, Tinkercad, or your workbench.
          Get an instant, evidence-backed diagnosis with visual X-Ray overlays.
        </p>
      </div>

      <div className="card" style={{ padding: "var(--space-xl)" }}>
        <ImageUploader onSubmit={onSubmit} isLoading={isLoading} initialSample={initialSample} />
      </div>

      {/* Scope note */}
      <div className="text-center mt-lg">
        <p className="text-xs text-muted" style={{ maxWidth: 400, margin: "0 auto" }}>
          v1 supports Arduino Uno circuits with LEDs, resistors, buttons,
          potentiometers, and ultrasonic sensors.
        </p>
      </div>
    </div>
  );
}
