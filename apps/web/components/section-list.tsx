import type { Section } from "@specforge/document-schema";

import type { FieldValue } from "../lib/document-editor/create-document-state";
import { getSectionStatus, type SectionStatusInfo } from "../utils/sectionStatus";

interface SectionIssueCounts {
  error: number;
  warning: number;
  info: number;
}

interface SectionListProps {
  sections: Section[];
  selectedSectionId: string;
  missingRequiredBySection: Record<string, number>;
  issueCountBySection?: Record<string, SectionIssueCounts>;
  fieldValues: Record<string, FieldValue>;
  onSelectSection: (sectionId: string) => void;
}

function StatusBadge({ info }: { info: SectionStatusInfo }) {
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 600,
        color: info.color,
        backgroundColor: info.backgroundColor,
        border: `1px solid ${info.color}20`,
        borderRadius: "4px",
        padding: "0 5px",
        lineHeight: "1.6",
        whiteSpace: "nowrap",
      }}
    >
      {info.statusLabel}
    </span>
  );
}

function IssueBadge({ count, color, bg }: { count: number; color: string; bg: string }) {
  if (count === 0) return null;
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 600,
        color,
        backgroundColor: bg,
        borderRadius: "9999px",
        padding: "0 6px",
        lineHeight: "1.5",
      }}
    >
      {count}
    </span>
  );
}

export function SectionList({
  sections,
  selectedSectionId,
  missingRequiredBySection,
  issueCountBySection,
  fieldValues,
  onSelectSection
}: SectionListProps) {
  return (
    <nav aria-label="セクション一覧">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "6px" }}>
        {sections.map((section) => {
          const isSelected = section.id === selectedSectionId;
          const missingCount = missingRequiredBySection[section.id] ?? 0;
          const issueCounts = issueCountBySection?.[section.id];
          const totalIssues = issueCounts
            ? issueCounts.error + issueCounts.warning + issueCounts.info
            : 0;
          // Use design quality error count for status determination when available
          const statusMissingCount = issueCounts
            ? missingCount + issueCounts.error
            : missingCount;
          const statusInfo = getSectionStatus(section, fieldValues, statusMissingCount);

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
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <StatusBadge info={statusInfo} />
                    {issueCounts && issueCounts.error > 0 && (
                      <IssueBadge count={issueCounts.error} color="#FFFFFF" bg="#EF4444" />
                    )}
                    {issueCounts && issueCounts.warning > 0 && (
                      <IssueBadge count={issueCounts.warning} color="#92400E" bg="#FDE68A" />
                    )}
                    {!issueCounts && missingCount > 0 && (
                      <IssueBadge count={missingCount} color="#FFFFFF" bg="#EF4444" />
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
