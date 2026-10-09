import { useCallback, useRef, useState, useEffect } from "react";
import type { UploadFormData } from "../types/circuit";
import { SAMPLE_CIRCUITS, dataUriToFile, type SampleCircuit } from "../services/sampleCircuits";

interface Props {
  onSubmit: (data: UploadFormData) => void;
  isLoading: boolean;
  initialSample?: SampleCircuit | null;
}

export function ImageUploader({ onSubmit, isLoading, initialSample }: Props) {
  const [form, setForm] = useState<UploadFormData>({
    image: null,
    imagePreview: null,
    expectedBehaviour: "",
    arduinoCode: "",
    observedBehaviour: "",
  });
  const [dragging, setDragging] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSample) {
      loadSample(initialSample);
    }
  }, [initialSample]);

  const handleFile = useCallback((file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      alert("Please upload a PNG, JPEG, WebP, or SVG image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm((prev) => ({
        ...prev,
        image: file,
        imagePreview: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: null, imagePreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadSample = async (sample: SampleCircuit) => {
    try {
      const file = await dataUriToFile(sample.svgDataUri, `${sample.id}.svg`);
      setForm({
        image: file,
        imagePreview: sample.svgDataUri,
        expectedBehaviour: sample.expectedBehaviour,
        arduinoCode: sample.arduinoCode,
        observedBehaviour: sample.observedBehaviour,
      });
      setShowOptional(true);
    } catch (err) {
      console.error("Failed to load sample circuit", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image || !form.expectedBehaviour.trim()) return;
    onSubmit(form);
  };

  const canSubmit = form.image && form.expectedBehaviour.trim() && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-xl">
      {/* Sample Presets */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            ⚡ Quick-Test Samples
          </span>
          <span className="text-xs text-muted">Click to pre-fill simulated circuit</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
          {SAMPLE_CIRCUITS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className="btn btn-secondary"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "10px 14px",
                textAlign: "left",
                gap: "4px",
                fontSize: "0.813rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                background: "rgba(30, 41, 59, 0.4)",
              }}
              onClick={() => loadSample(sample)}
              id={`load-${sample.id}`}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{sample.title}</span>
                <span className="badge badge-warning" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>{sample.badge}</span>
              </div>
              <span className="text-xs text-muted" style={{ fontSize: "0.75rem", lineHeight: 1.3 }}>
                {sample.expectedBehaviour.slice(0, 65)}…
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone ${dragging ? "dragging" : ""} ${form.imagePreview ? "has-image" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !form.imagePreview && fileInputRef.current?.click()}
        id="circuit-upload-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileInput}
          style={{ display: "none" }}
          id="circuit-image-input"
        />

        {form.imagePreview ? (
          <div className="upload-preview">
            <img src={form.imagePreview} alt="Circuit screenshot preview" />
            <button
              type="button"
              className="upload-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              title="Remove image"
              id="remove-image-btn"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <div className="upload-icon">📸</div>
            <div className="upload-text">
              Drop your circuit screenshot here, or click to browse
            </div>
            <div className="upload-hint">
              PNG, JPEG, or WebP · Max 10 MB · From Wokwi, Tinkercad, or any
              simulator
            </div>
          </>
        )}
      </div>

      {/* Expected behaviour (required) */}
      <div className="input-group">
        <label className="input-label" htmlFor="expected-behaviour">
          Expected Behaviour *
        </label>
        <textarea
          id="expected-behaviour"
          className="textarea"
          placeholder='e.g., "LED should light up when the button is pressed" or "Servo should sweep back and forth"'
          value={form.expectedBehaviour}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, expectedBehaviour: e.target.value }))
          }
          rows={3}
        />
        <span className="input-hint">
          Describe what your circuit is supposed to do
        </span>
      </div>

      {/* Optional fields toggle */}
      <button
        type="button"
        className="btn btn-ghost w-full"
        onClick={() => setShowOptional(!showOptional)}
        id="toggle-optional-fields"
      >
        {showOptional ? "▲ Hide" : "▼ Show"} optional fields (code &amp; observed
        behaviour)
      </button>

      {showOptional && (
        <div className="flex flex-col gap-lg" style={{ animation: "fade-in 0.3s ease-out" }}>
          {/* Arduino code */}
          <div className="input-group">
            <label className="input-label" htmlFor="arduino-code">
              Arduino Code (optional)
            </label>
            <textarea
              id="arduino-code"
              className="textarea textarea-code"
              placeholder="Paste your Arduino sketch here..."
              value={form.arduinoCode}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, arduinoCode: e.target.value }))
              }
              rows={8}
              spellCheck={false}
            />
            <span className="input-hint">
              Helps detect pin mismatches between code and wiring
            </span>
          </div>

          {/* Observed behaviour */}
          <div className="input-group">
            <label className="input-label" htmlFor="observed-behaviour">
              Observed Behaviour (optional)
            </label>
            <textarea
              id="observed-behaviour"
              className="textarea"
              placeholder='e.g., "Nothing happens" or "LED stays on all the time regardless of the button"'
              value={form.observedBehaviour}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  observedBehaviour: e.target.value,
                }))
              }
              rows={2}
            />
            <span className="input-hint">
              What actually happens when you run the circuit?
            </span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary btn-lg w-full"
        disabled={!canSubmit}
        id="analyze-btn"
      >
        {isLoading ? (
          <>
            <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            Analyzing with Gemma 4…
          </>
        ) : (
          <>⚡ Analyze Circuit</>
        )}
      </button>
    </form>
  );
}
