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
    <nav aria-label="section-list">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "8px" }}>
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
                  border: isSelected ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 600 }}>{section.title}</span>
                  <span style={{ color: missingCount > 0 ? "#B91C1C" : "#166534", fontSize: "0.85rem" }}>
                    未入力: {missingCount}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "0.82rem" }}>key: {section.key}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
