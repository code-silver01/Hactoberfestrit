import { useState } from "react";
import { DiagnosisCard } from "../components/DiagnosisCard";
import { ChatPanel } from "../components/ChatPanel";
import type { AnalyzeResponse } from "../types/circuit";

interface Props {
  result: AnalyzeResponse;
  sessionId: string;
  highlightedIssue: number | null;
}

export function DiagnosisPage({ result, sessionId, highlightedIssue }: Props) {
  const { diagnosis } = result;
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? diagnosis
      : diagnosis.filter((d) => d.confidence === filter);

  const counts = {
    all: diagnosis.length,
    confirmed: diagnosis.filter((d) => d.confidence === "confirmed").length,
    likely: diagnosis.filter((d) => d.confidence === "likely").length,
    possible: diagnosis.filter((d) => d.confidence === "possible").length,
  };

  return (
    <div className="flex flex-col gap-xl">
      <div>
        <h2 style={{ marginBottom: "var(--space-xs)" }}>Diagnosis &amp; Learn</h2>
        <p className="text-sm text-secondary">
          {result.summary}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
        {(
          [
            ["all", "All"],
            ["confirmed", "Confirmed"],
            ["likely", "Likely"],
            ["possible", "Possible"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            className={`btn btn-sm ${filter === key ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(key)}
            id={`filter-${key}`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="diagnosis-layout">
        {/* Issue cards */}
        <div className="flex flex-col gap-md">
          {filtered.length > 0 ? (
            filtered.map((issue) => (
              <DiagnosisCard
                key={issue.issue_id}
                issue={issue}
                isHighlighted={highlightedIssue === issue.issue_id}
              />
            ))
          ) : (
            <div className="card text-center" style={{ padding: "var(--space-2xl)" }}>
              <p className="text-sm text-muted">
                {diagnosis.length === 0
                  ? "🎉 No issues found! Your circuit looks correct."
                  : `No ${filter} issues found.`}
              </p>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div>
          <div className="section-title">💬 Ask the Circuit</div>
          <ChatPanel sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
