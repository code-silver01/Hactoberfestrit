import { useState } from "react";
import type { DiagnosisIssue, SimplifyResponse } from "../types/circuit";
import { simplifyIssue } from "../services/api";
import { CodeDiff } from "./CodeDiff";

interface Props {
  issue: DiagnosisIssue;
  isHighlighted?: boolean;
}

export function DiagnosisCard({ issue, isHighlighted = false }: Props) {
  const [showSimple, setShowSimple] = useState(false);
  const [simpleData, setSimpleData] = useState<SimplifyResponse | null>(null);
  const [loadingSimple, setLoadingSimple] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSimplify = async () => {
    if (simpleData) {
      setShowSimple(!showSimple);
      return;
    }

    setLoadingSimple(true);
    try {
      const result = await simplifyIssue(issue);
      setSimpleData(result);
      setShowSimple(true);
    } catch {
      // Use the model's inline simple explanation if API fails
      if (issue.simple_explanation) {
        setSimpleData({
          simple_explanation: issue.simple_explanation,
          analogy: "",
        });
        setShowSimple(true);
      }
    } finally {
      setLoadingSimple(false);
    }
  };

  const confidenceColor = {
    confirmed: "var(--accent-danger)",
    likely: "var(--accent-warning)",
    possible: "var(--accent-possible)",
  }[issue.confidence];

  return (
    <div
      className={`card diagnosis-card ${issue.confidence}`}
      id={`diagnosis-card-${issue.issue_id}`}
      style={isHighlighted ? { boxShadow: `0 0 24px ${confidenceColor}30` } : {}}
    >
      {/* Header */}
      <div className="flex items-center gap-md mb-md">
        <div className={`diagnosis-number ${issue.confidence}`}>
          {issue.issue_id}
        </div>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-sm">
            <h3 style={{ fontSize: "0.938rem" }}>{issue.problem}</h3>
          </div>
        </div>
        <span className={`badge badge-${issue.confidence}`}>
          {issue.confidence}
        </span>
      </div>

      {/* Evidence */}
      <div className="mb-md">
        <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Evidence
        </div>
        <p className="text-sm">{issue.evidence}</p>
      </div>

      {/* Fix */}
      <div className="mb-md">
        <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Fix
        </div>
        <p className="text-sm" style={{ color: "var(--accent-success)" }}>
          {issue.fix}
        </p>
      </div>

      {/* Expandable details */}
      <button
        className="btn btn-ghost btn-sm w-full"
        onClick={() => setExpanded(!expanded)}
        id={`expand-details-${issue.issue_id}`}
      >
        {expanded ? "▲ Less detail" : "▼ More detail"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-md mt-md" style={{ animation: "fade-in 0.3s ease-out" }}>
          {/* Rewiring steps */}
          {issue.rewiring_steps.length > 0 && (
            <div>
              <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🔧 Rewiring Steps
              </div>
              <ul className="rewiring-list">
                {issue.rewiring_steps.map((step, i) => (
                  <li key={i} className="rewiring-step">
                    <span className="rewiring-step-number">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Code diff */}
          {issue.code_diff && (
            <div>
              <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                💻 Code Fix
              </div>
              <CodeDiff diff={issue.code_diff} />
            </div>
          )}

          {/* Verification */}
          {issue.verify && (
            <div className="verify-box">
              <div className="verify-label">✓ How to verify</div>
              <div className="verify-text">
                <strong>Do:</strong> {issue.verify.action}
                <br />
                <strong>Expect:</strong> {issue.verify.expected_result}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simplify toggle */}
      <div className="flex items-center justify-between mt-md">
        <div
          className="toggle-container"
          onClick={handleSimplify}
          id={`simplify-toggle-${issue.issue_id}`}
        >
          <div className={`toggle-switch ${showSimple ? "active" : ""}`} />
          <span className="toggle-label">
            {loadingSimple ? "Loading…" : "Explain it like I'm new"}
          </span>
        </div>
      </div>

      {showSimple && simpleData && (
        <div className="simple-box">
          <div className="simple-text">{simpleData.simple_explanation}</div>
          {simpleData.analogy && (
            <div className="simple-analogy">{simpleData.analogy}</div>
          )}
        </div>
      )}
    </div>
  );
}
