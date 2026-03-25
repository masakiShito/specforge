"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

interface FieldDescriptionProps {
  description?: string;
}

const TRUNCATE_THRESHOLD = 80;

const baseStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "0.75rem",
  lineHeight: "1.5",
  color: "#64748B",
};

export function FieldDescription({ description }: FieldDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!description) {
    return null;
  }

  const isLong = description.length > TRUNCATE_THRESHOLD;

  if (!isLong) {
    return <p style={baseStyle}>{description}</p>;
  }

  const truncated = description.slice(0, TRUNCATE_THRESHOLD) + "…";

  return (
    <div style={baseStyle}>
      <p style={{ margin: 0 }}>{expanded ? description : truncated}</p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          marginTop: "2px",
          fontSize: "0.7rem",
          color: "#3B82F6",
          cursor: "pointer",
        }}
      >
        {expanded ? "閉じる" : "詳細"}
      </button>
    </div>
  );
}
