import { XRayOverlay } from "../components/XRayOverlay";
import type { AnalyzeResponse, DetectedComponent } from "../types/circuit";

interface Props {
  result: AnalyzeResponse;
  imageSrc: string;
  onContinue: () => void;
  onIssueClick: (id: number) => void;
}

export function AnalysisPage({ result, imageSrc, onContinue, onIssueClick }: Props) {
  const { circuit, sanity_checks, diagnosis } = result;

  return (
    <div className="flex flex-col gap-xl">
      {/* Annotated Image */}
      <div className="section">
        <div className="section-title">📡 X-Ray View</div>
        <XRayOverlay
          imageSrc={imageSrc}
          imageWidth={result.image_width}
          imageHeight={result.image_height}
          issues={diagnosis}
          onIssueClick={onIssueClick}
        />
      </div>

      <div className="analysis-layout">
        {/* Detected Components */}
        <div className="section">
          <div className="section-title">🔍 Detected Components</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="components-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Connections</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {circuit.components.map((comp: DetectedComponent, i: number) => (
                    <tr key={i}>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {comp.name}
                      </td>
                      <td>
                        <code style={{ fontSize: "0.75rem" }}>{comp.type}</code>
                      </td>
                      <td>{comp.value || "—"}</td>
                      <td style={{ maxWidth: 300 }}>
                        {comp.connections.length > 0
                          ? comp.connections.join(", ")
                          : "—"}
                      </td>
                      <td>
                        <span className={`badge badge-${comp.confidence}`}>
                          {comp.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {circuit.components.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                        No components detected
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pin connections */}
          {Object.keys(circuit.pin_connections).length > 0 && (
            <div className="mt-lg">
              <div className="section-title" style={{ fontSize: "0.813rem" }}>📌 Pin Map</div>
              <div className="card">
                <div className="flex flex-col gap-xs">
                  {Object.entries(circuit.pin_connections).map(([pin, conns]) => (
                    <div key={pin} className="flex gap-md items-center text-sm">
                      <code style={{ minWidth: 50, color: "var(--accent-primary)" }}>
                        {pin}
                      </code>
                      <span className="text-secondary">→</span>
                      <span className="text-secondary">{conns.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Unclear areas */}
          {circuit.unclear_areas.length > 0 && (
            <div className="mt-lg">
              <div className="section-title" style={{ fontSize: "0.813rem" }}>⚠️ Unclear Areas</div>
              <div className="card">
                {circuit.unclear_areas.map((area, i) => (
                  <p key={i} className="text-sm" style={{ color: "var(--accent-warning)" }}>
                    • {area}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sanity Checks */}
        <div className="section">
          <div className="section-title">🧪 Sanity Checks</div>
          <div className="card">
            <div className="flex flex-col gap-sm">
              {sanity_checks.map((check, i) => (
                <div key={i} className="sanity-item">
                  <span className="sanity-icon">
                    {check.passed ? "✅" : check.severity === "error" ? "❌" : "⚠️"}
                  </span>
                  <div>
                    <span className="sanity-message">{check.message}</span>
                    <div className="mt-sm">
                      <span
                        className={`badge badge-${check.passed ? "pass" : check.severity}`}
                      >
                        {check.check_name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {sanity_checks.length === 0 && (
                <p className="text-sm text-muted">
                  No sanity checks ran (provide code for pin-level checks).
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-lg">
            <div className="card" style={{
              background: diagnosis.length > 0
                ? "rgba(248, 113, 113, 0.06)"
                : "rgba(52, 211, 153, 0.06)",
              borderColor: diagnosis.length > 0
                ? "rgba(248, 113, 113, 0.2)"
                : "rgba(52, 211, 153, 0.2)",
            }}>
              <p className="text-sm" style={{
                color: diagnosis.length > 0 ? "var(--accent-danger)" : "var(--accent-success)",
                fontWeight: 500,
              }}>
                {result.summary || `Found ${diagnosis.length} issue(s).`}
              </p>
            </div>
          </div>

          {/* Continue button */}
          {diagnosis.length > 0 && (
            <button
              className="btn btn-primary btn-lg w-full mt-lg"
              onClick={onContinue}
              id="continue-to-diagnosis"
            >
              View Diagnosis &amp; Fixes →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
