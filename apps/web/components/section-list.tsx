import type { Section } from "@specforge/document-schema";

interface SectionListProps {
  sections: Section[];
  selectedSectionId: string;
  missingRequiredBySection: Record<string, number>;
  onSelectSection: (sectionId: string) => void;
}

export function SectionList({
  sections,
  selectedSectionId,
  missingRequiredBySection,
  onSelectSection
}: SectionListProps) {
  return (
    <nav aria-label="セクション一覧">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "6px" }}>
        {sections.map((section) => {
          const isSelected = section.id === selectedSectionId;
          const missingCount = missingRequiredBySection[section.id] ?? 0;

          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onSelectSection(section.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: isSelected ? "2px solid #3B82F6" : "1px solid #E2E8F0",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0F172A" }}>{section.title}</span>
                  {missingCount > 0 && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: "#FFFFFF",
                        backgroundColor: "#EF4444",
                        borderRadius: "9999px",
                        padding: "1px 7px",
                        lineHeight: "1.4"
                      }}
                    >
                      {missingCount}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
