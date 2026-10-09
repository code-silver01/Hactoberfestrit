import { useRef, useState, useEffect, useCallback } from "react";
import type { DiagnosisIssue, BoundingBox } from "../types/circuit";

interface Props {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  issues: DiagnosisIssue[];
  onIssueClick?: (issueId: number) => void;
}

export function XRayOverlay({
  imageSrc,
  imageWidth,
  imageHeight,
  issues,
  onIssueClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });

  const aspectRatioStyle =
    imageWidth && imageHeight
      ? { aspectRatio: `${imageWidth} / ${imageHeight}` }
      : undefined;

  const updateScale = useCallback(() => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setScale({
      x: rect.width / 1000,
      y: rect.height / 1000,
    });
    setImgOffset({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
    });
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  const getMarkerStyle = (box: BoundingBox) => {
    return {
      left: `${imgOffset.x + box.xmin * scale.x}px`,
      top: `${imgOffset.y + box.ymin * scale.y}px`,
      width: `${(box.xmax - box.xmin) * scale.x}px`,
      height: `${(box.ymax - box.ymin) * scale.y}px`,
    };
  };

  const getConfidenceClass = (confidence: string) => {
    switch (confidence) {
      case "confirmed":
        return "error";
      case "likely":
        return "warning";
      default:
        return "info";
    }
  };

  const issuesWithBoxes = issues.filter((i) => i.bounding_box);

  return (
    <div className="xray-container" ref={containerRef} style={aspectRatioStyle}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Circuit screenshot with diagnostic overlay"
        className="xray-image"
        onLoad={updateScale}
      />

      {issuesWithBoxes.map((issue) => {
        const cls = getConfidenceClass(issue.confidence);
        return (
          <div
            key={issue.issue_id}
            className={`xray-marker ${cls}`}
            style={getMarkerStyle(issue.bounding_box!)}
            onClick={() => onIssueClick?.(issue.issue_id)}
            title={issue.problem}
          >
            <span className={`xray-label ${cls}`}>{issue.issue_id}</span>
          </div>
        );
      })}

      {issuesWithBoxes.length === 0 && issues.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            background: "rgba(0,0,0,0.7)",
            padding: "4px 12px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            color: "#94a3b8",
          }}
        >
          {issues.length} issue(s) found — see diagnosis cards
        </div>
      )}
    </div>
  );
}
