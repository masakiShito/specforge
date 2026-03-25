import type { Document } from "@specforge/document-schema";

const KIND_LABELS: Record<string, string> = {
  "screen-spec": "画面",
  "api-spec": "API",
  "er-spec": "ER",
  "business-rule": "業務",
};

interface DocumentListProps {
  documents: Document[];
  selectedDocumentId: string;
  onSelectDocument: (documentId: string) => void;
}

export function DocumentList({ documents, selectedDocumentId, onSelectDocument }: DocumentListProps) {
  return (
    <nav aria-label="ドキュメント一覧">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "4px" }}>
        {documents.map((doc) => {
          const isSelected = doc.id === selectedDocumentId;
          const kindLabel = KIND_LABELS[doc.kind] ?? doc.kind;

          return (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onSelectDocument(doc.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: isSelected ? "2px solid #3B82F6" : "1px solid transparent",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  backgroundColor: isSelected ? "#EFF6FF" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: isSelected ? "#3B82F6" : "#94A3B8",
                    backgroundColor: isSelected ? "#DBEAFE" : "#F1F5F9",
                    borderRadius: "3px",
                    padding: "1px 5px",
                    lineHeight: "1.6",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {kindLabel}
                </span>
                <span
                  style={{
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: "0.8rem",
                    color: isSelected ? "#1E40AF" : "#334155",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
