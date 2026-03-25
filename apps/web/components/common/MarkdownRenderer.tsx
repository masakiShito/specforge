import type { CSSProperties } from "react";
import Markdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

const containerStyle: CSSProperties = {
  fontSize: "0.825rem",
  lineHeight: "1.7",
  color: "#0F172A",
  wordBreak: "break-word",
};

const headingStyles: Record<string, CSSProperties> = {
  h1: { margin: "0 0 12px", fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", borderBottom: "1px solid #E2E8F0", paddingBottom: "8px" },
  h2: { margin: "20px 0 8px", fontSize: "1.05rem", fontWeight: 600, color: "#0F172A" },
  h3: { margin: "16px 0 6px", fontSize: "0.925rem", fontWeight: 600, color: "#1E293B" },
};

const codeBlockStyle: CSSProperties = {
  display: "block",
  margin: "8px 0",
  padding: "10px 12px",
  backgroundColor: "#1E293B",
  color: "#E2E8F0",
  fontSize: "0.75rem",
  lineHeight: "1.5",
  borderRadius: "6px",
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};

const inlineCodeStyle: CSSProperties = {
  backgroundColor: "#F1F5F9",
  color: "#0F172A",
  padding: "1px 5px",
  borderRadius: "3px",
  fontSize: "0.8em",
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div style={containerStyle}>
      <Markdown
        components={{
          h1: ({ children }) => <h1 style={headingStyles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 style={headingStyles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 style={headingStyles.h3}>{children}</h3>,
          p: ({ children }) => <p style={{ margin: "6px 0" }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: "6px 0", paddingLeft: "20px" }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: "6px 0", paddingLeft: "20px" }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: "3px 0" }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return <code style={codeBlockStyle}>{children}</code>;
            }
            return <code style={inlineCodeStyle}>{children}</code>;
          },
          pre: ({ children }) => <pre style={{ margin: 0 }}>{children}</pre>,
          hr: () => <hr style={{ border: "none", borderTop: "1px solid #E2E8F0", margin: "16px 0" }} />,
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: "8px 0",
                paddingLeft: "12px",
                borderLeft: "3px solid #3B82F6",
                color: "#64748B",
              }}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
