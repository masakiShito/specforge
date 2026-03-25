import type { Section } from "@specforge/document-schema";

import type { FieldValue } from "../lib/document-editor/create-document-state";

export type SectionStatus = "not-started" | "in-progress" | "needs-fix" | "complete";

export interface SectionStatusInfo {
  status: SectionStatus;
  statusLabel: string;
  color: string;
  backgroundColor: string;
}

const STATUS_MAP: Record<SectionStatus, Omit<SectionStatusInfo, "status">> = {
  "not-started": {
    statusLabel: "未着手",
    color: "#94A3B8",
    backgroundColor: "#F1F5F9",
  },
  "in-progress": {
    statusLabel: "入力中",
    color: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  "needs-fix": {
    statusLabel: "要修正",
    color: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  complete: {
    statusLabel: "完了",
    color: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
};

export function getSectionStatus(
  section: Section,
  fieldValues: Record<string, FieldValue>,
  missingRequiredCount: number
): SectionStatusInfo {
  const status = determineSectionStatus(section, fieldValues, missingRequiredCount);
  return { status, ...STATUS_MAP[status] };
}

function determineSectionStatus(
  section: Section,
  fieldValues: Record<string, FieldValue>,
  missingRequiredCount: number
): SectionStatus {
  // Error exists → needs fix
  if (missingRequiredCount > 0) {
    return "needs-fix";
  }

  const hasAnyInput = section.fields.some((field) => {
    const value = fieldValues[field.id];
    return value !== undefined && value !== null && value !== "";
  });

  if (!hasAnyInput) {
    return "not-started";
  }

  // All required fields filled + has input → complete
  const allRequiredFilled = section.fields
    .filter((f) => f.required)
    .every((f) => {
      const v = fieldValues[f.id];
      return v !== undefined && v !== null && v !== "";
    });

  if (allRequiredFilled) {
    return "complete";
  }

  return "in-progress";
}
