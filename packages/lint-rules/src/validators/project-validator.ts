import type {
  DesignValidationIssue,
  ValidationResult,
  TableRowValue,
} from "../types";
import {
  validateDocument,
  validateDocuments,
  type ValidatableDocument,
} from "./document-validator";
import {
  validateProjectReferences,
  type DocumentMap,
} from "../rules/reference-integrity";

/**
 * Project structure for validation
 */
export interface ValidatableProject {
  id: string;
  title: string;
  documents: ValidatableDocument[];
}

/**
 * Validate an entire project including cross-document references
 */
export function validateProject(
  project: ValidatableProject
): ValidationResult {
  const issues: DesignValidationIssue[] = [];

  // Validate each document individually
  const documentsResult = validateDocuments(project.documents);
  issues.push(...documentsResult.issues);

  // Build document map for reference validation
  const documentMap = buildDocumentMap(project.documents);

  // Validate cross-document references
  const referenceIssues = validateProjectReferences(documentMap);
  issues.push(...referenceIssues);

  // Check for orphaned documents (documents not referenced by others)
  // This is informational only
  const orphanedIssues = findOrphanedDocuments(project.documents, documentMap);
  issues.push(...orphanedIssues);

  return createValidationResult(issues);
}

/**
 * Build a document map for reference validation
 */
function buildDocumentMap(documents: ValidatableDocument[]): DocumentMap {
  const map: DocumentMap = {};

  documents.forEach((doc) => {
    const sections: DocumentMap[string]["sections"] = {};

    doc.sections.forEach((section) => {
      const fields: DocumentMap[string]["sections"][string]["fields"] = {};

      section.fields.forEach((field) => {
        fields[field.key] = {
          type: field.type,
          rows:
            field.type === "table" && Array.isArray(field.value)
              ? (field.value as Record<string, TableRowValue>[])
              : undefined,
        };
      });

      sections[section.key] = { fields };
    });

    map[doc.id] = {
      id: doc.id,
      kind: doc.kind,
      title: doc.title,
      sections,
    };
  });

  return map;
}

/**
 * Find documents that are not referenced by any other document
 */
function findOrphanedDocuments(
  documents: ValidatableDocument[],
  documentMap: DocumentMap
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const referencedIds = new Set<string>();

  // Collect all referenced document IDs
  Object.values(documentMap).forEach((doc) => {
    Object.values(doc.sections).forEach((section) => {
      Object.values(section.fields).forEach((field) => {
        if (field.rows) {
          field.rows.forEach((row) => {
            Object.values(row).forEach((cellValue) => {
              collectReferencedIds(cellValue, referencedIds);
            });
          });
        }
      });
    });
  });

  // Check which documents are not referenced
  documents.forEach((doc) => {
    if (!referencedIds.has(doc.id) && documents.length > 1) {
      // Skip the first document as it's often the main entry point
      if (doc !== documents[0]) {
        issues.push({
          id: `orphaned-document-${doc.id}`,
          severity: "info",
          message: `ドキュメント「${doc.title}」は他のドキュメントから参照されていません`,
          documentId: doc.id,
        });
      }
    }
  });

  return issues;
}

/**
 * Collect referenced document IDs from a cell value
 */
function collectReferencedIds(
  value: TableRowValue,
  referencedIds: Set<string>
): void {
  if (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "reference"
  ) {
    const ref = value as { targetDocumentId: string };
    referencedIds.add(ref.targetDocumentId);
  }

  if (Array.isArray(value)) {
    value.forEach((v) => collectReferencedIds(v, referencedIds));
  }
}

/**
 * Create a validation result from issues
 */
function createValidationResult(
  issues: DesignValidationIssue[]
): ValidationResult {
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    issues,
    isValid: errorCount === 0,
    errorCount,
    warningCount,
    infoCount,
  };
}

/**
 * Calculate project quality score based on validation results
 */
export function calculateProjectQualityScore(
  result: ValidationResult,
  penalties: { error: number; warning: number; info: number } = {
    error: 20,
    warning: 5,
    info: 0,
  }
): number {
  const totalPenalty =
    result.errorCount * penalties.error +
    result.warningCount * penalties.warning +
    result.infoCount * penalties.info;

  return Math.max(0, 100 - totalPenalty);
}

/**
 * Get quality status based on score
 */
export function getQualityStatus(
  score: number,
  thresholds: { good: number; caution: number } = { good: 90, caution: 70 }
): "good" | "caution" | "poor" {
  if (score >= thresholds.good) return "good";
  if (score >= thresholds.caution) return "caution";
  return "poor";
}
