import type {
  DesignValidationIssue,
  TableRowValue,
  ReferenceValue,
} from "../types";
import { isReferenceValue } from "../types";
import { createIssue, getDisplayValue } from "./common";

/**
 * Document map for reference validation
 */
export interface DocumentMap {
  [documentId: string]: {
    id: string;
    kind: string;
    title: string;
    sections: {
      [sectionKey: string]: {
        fields: {
          [fieldKey: string]: {
            type: string;
            rows?: Record<string, TableRowValue>[];
          };
        };
      };
    };
  };
}

/**
 * Validate reference integrity across documents
 */
export function validateReferenceIntegrity(
  documentId: string,
  sectionKey: string,
  fieldKey: string,
  rows: Record<string, TableRowValue>[],
  documentMap: DocumentMap
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  rows.forEach((row, rowIndex) => {
    Object.entries(row).forEach(([cellKey, cellValue]) => {
      const references = extractReferences(cellValue);

      references.forEach((ref) => {
        const validationResult = validateReference(ref, documentMap);
        if (!validationResult.valid) {
          issues.push(
            createIssue(
              `invalid-reference-${documentId}-${sectionKey}-${fieldKey}-${rowIndex}-${cellKey}`,
              validationResult.severity,
              validationResult.message,
              {
                documentId,
                sectionKey,
                fieldKey,
                rowIndex,
                cellKey,
              }
            )
          );
        }
      });
    });
  });

  return issues;
}

/**
 * Extract all references from a cell value
 */
export function extractReferences(value: TableRowValue): ReferenceValue[] {
  if (isReferenceValue(value)) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractReferences);
  }

  return [];
}

/**
 * Validate a single reference
 */
export function validateReference(
  ref: ReferenceValue,
  documentMap: DocumentMap
): {
  valid: boolean;
  severity: "error" | "warning";
  message: string;
} {
  // Check if target document exists
  const targetDoc = documentMap[ref.targetDocumentId];
  if (!targetDoc) {
    return {
      valid: false,
      severity: "error",
      message: `参照先ドキュメント「${ref.targetDocumentId}」が見つかりません（参照: ${ref.displayValue}）`,
    };
  }

  // Check if reference type matches document kind
  const expectedKinds = getReferenceExpectedKinds(ref.referenceType);
  if (expectedKinds.length > 0 && !expectedKinds.includes(targetDoc.kind)) {
    return {
      valid: false,
      severity: "warning",
      message: `参照タイプ「${ref.referenceType}」は「${expectedKinds.join(", ")}」タイプのドキュメントを期待していますが、「${targetDoc.kind}」が参照されています`,
    };
  }

  // Check if target key exists in the document
  const keyExists = checkTargetKeyExists(targetDoc, ref.targetKey);
  if (!keyExists) {
    return {
      valid: false,
      severity: "warning",
      message: `参照先キー「${ref.targetKey}」がドキュメント「${targetDoc.title}」内に見つかりません`,
    };
  }

  return {
    valid: true,
    severity: "warning",
    message: "",
  };
}

/**
 * Get expected document kinds for a reference type
 */
function getReferenceExpectedKinds(referenceType: string): string[] {
  const kindMap: Record<string, string[]> = {
    "screen-field": ["screen-spec"],
    "api-endpoint": ["api-spec"],
    "event": ["screen-spec"],
    "message": ["screen-spec"],
    "data-model": ["data-model", "entity-spec"],
    "table": ["database-spec", "data-model"],
  };

  return kindMap[referenceType] || [];
}

/**
 * Check if a target key exists in a document
 */
function checkTargetKeyExists(
  doc: DocumentMap[string],
  targetKey: string
): boolean {
  // Check in all sections and fields
  for (const section of Object.values(doc.sections)) {
    for (const field of Object.values(section.fields)) {
      if (field.type === "table" && field.rows) {
        // Check in table rows
        for (const row of field.rows) {
          const idValue = getDisplayValue(row.id);
          const keyValue = getDisplayValue(row.key);
          const nameValue = getDisplayValue(row.name);
          const pathValue = getDisplayValue(row.path);

          if (
            idValue === targetKey ||
            keyValue === targetKey ||
            nameValue === targetKey ||
            pathValue === targetKey
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Validate all references in a project
 */
export function validateProjectReferences(
  documentMap: DocumentMap
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  Object.entries(documentMap).forEach(([documentId, doc]) => {
    Object.entries(doc.sections).forEach(([sectionKey, section]) => {
      Object.entries(section.fields).forEach(([fieldKey, field]) => {
        if (field.type === "table" && field.rows) {
          issues.push(
            ...validateReferenceIntegrity(
              documentId,
              sectionKey,
              fieldKey,
              field.rows,
              documentMap
            )
          );
        }
      });
    });
  });

  return issues;
}
