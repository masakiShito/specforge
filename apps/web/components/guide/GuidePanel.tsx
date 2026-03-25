import type { CSSProperties } from "react";
import { MarkdownRenderer } from "../common/MarkdownRenderer";

interface GuidePanelProps {
  content: string;
}

const containerStyle: CSSProperties = {
  maxHeight: "calc(100vh - 200px)",
  overflow: "auto",
  padding: "4px 0",
};

export function GuidePanel({ content }: GuidePanelProps) {
  if (!content) {
    return (
      <p style={{ margin: 0, color: "#94A3B8", fontSize: "0.8rem" }}>
        ガイドコンテンツがありません
      </p>
    );
  }

  return (
    <div style={containerStyle}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
