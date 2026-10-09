import { useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { UploadPage } from "./pages/UploadPage";
import { AnalysisPage } from "./pages/AnalysisPage";
import { DiagnosisPage } from "./pages/DiagnosisPage";
import { analyzeCircuit } from "./services/api";
import type { AppScreen, UploadFormData, AnalyzeResponse } from "./types/circuit";
import type { SampleCircuit } from "./services/sampleCircuits";
import "./index.css";

function App() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [highlightedIssue, setHighlightedIssue] = useState<number | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleCircuit | null>(null);

  const handleUploadSubmit = async (data: UploadFormData) => {
    if (!data.image) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeCircuit(
        data.image,
        data.expectedBehaviour,
        data.arduinoCode || undefined,
        data.observedBehaviour || undefined
      );

      setResult(response);
      setImageSrc(data.imagePreview || "");

      // Use the server-provided session ID for follow-up chat
      setSessionId(response.session_id);

      // If clarification needed, stay on upload with a message
      if (response.clarification_needed) {
        setError(
          `🔍 Gemma 4 needs clarification: ${response.clarification_needed}`
        );
        setIsLoading(false);
        return;
      }

      setScreen("analysis");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueClick = (issueId: number) => {
    setHighlightedIssue(issueId);
    setScreen("diagnosis");
    // Scroll to the card after render
    setTimeout(() => {
      document
        .getElementById(`diagnosis-card-${issueId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleStartOver = () => {
    setScreen("upload");
    setResult(null);
    setImageSrc("");
    setSessionId("");
    setError(null);
    setHighlightedIssue(null);
    setSelectedSample(null);
  };

  const handleSelectSampleFromLanding = (sample: SampleCircuit) => {
    setSelectedSample(sample);
    setScreen("upload");
  };

  const stepIndex = screen === "landing" ? -1 : { upload: 0, analysis: 1, diagnosis: 2 }[screen];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div
          className="app-logo"
          style={{ cursor: "pointer" }}
          onClick={() => setScreen("landing")}
          title="Return to Home"
        >
          <div className="app-logo-icon">⚡</div>
          <div>
            <div className="app-logo-text">CircuitSense</div>
            <div className="app-logo-subtitle">Powered by Gemma 4</div>
          </div>
        </div>

        {screen === "landing" ? (
          <div className="flex items-center gap-md">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSelectedSample(null);
                setScreen("upload");
              }}
              id="header-launch-debugger-btn"
            >
              Launch Debugger →
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-md">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setScreen("landing")}
              id="back-to-home-btn"
            >
              ← Home
            </button>

            {/* Stepper */}
            <nav className="stepper" aria-label="Progress">
              {["Upload", "Analysis", "Diagnosis"].map((label, i) => (
                <div key={label} className="flex items-center gap-sm">
                  {i > 0 && (
                    <div
                      className={`stepper-line ${i <= stepIndex ? "completed" : ""}`}
                    />
                  )}
                  <button
                    className={`stepper-step ${
                      i === stepIndex
                        ? "active"
                        : i < stepIndex
                          ? "completed"
                          : ""
                    }`}
                    onClick={() => {
                      if (i === 0) setScreen("upload");
                      else if (i === 1 && result) setScreen("analysis");
                      else if (i === 2 && result) setScreen("diagnosis");
                    }}
                    disabled={i > 0 && !result}
                    id={`step-${label.toLowerCase()}`}
                  >
                    {i < stepIndex ? "✓" : i + 1}. {label}
                  </button>
                </div>
              ))}
            </nav>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleStartOver}
              id="start-over-btn"
              title="Reset and analyze a new circuit"
            >
              ↺ New circuit
            </button>
          </div>
        )}
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner" style={{ marginBottom: "var(--space-lg)" }}>
          <span>⚠️</span>
          <span>{error}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setError(null)}
            style={{ marginLeft: "auto" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">
            Gemma 4 is analyzing your circuit
            <span className="loading-dots" />
          </div>
          <p
            className="text-xs text-muted mt-md"
            style={{ maxWidth: 300, textAlign: "center" }}
          >
            Reading components, tracing wires, checking pin connections,
            cross-referencing code, and diagnosing issues.
          </p>
        </div>
      )}

      {/* Pages */}
      <main>
        {screen === "landing" && (
          <LandingPage
            onStartDebug={() => {
              setSelectedSample(null);
              setScreen("upload");
            }}
            onSelectSample={handleSelectSampleFromLanding}
          />
        )}

        {screen === "upload" && (
          <UploadPage
            onSubmit={handleUploadSubmit}
            isLoading={isLoading}
            initialSample={selectedSample}
          />
        )}

        {screen === "analysis" && result && (
          <AnalysisPage
            result={result}
            imageSrc={imageSrc}
            onContinue={() => setScreen("diagnosis")}
            onIssueClick={handleIssueClick}
          />
        )}

        {screen === "diagnosis" && result && (
          <DiagnosisPage
            result={result}
            sessionId={sessionId}
            highlightedIssue={highlightedIssue}
          />
        )}
      </main>
    </div>
  );
}

export default App;
