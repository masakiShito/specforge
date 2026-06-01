import type {
  DesignValidationIssue,
  LegacyReferenceValue,
  TableRowCellValue,
  TableRowValue,
} from '../types';
import { isReferenceValue } from '../types';
import { createIssue, getCellReferenceDocumentId, getCellString, isRowEmpty } from './common';

const API_ACTION_KEYWORDS = ['api', 'API', '通信', '呼出', 'リクエスト', 'fetch', '送信', '取得'];

interface ProjectDocument {
  id: string;
  kind: string;
  title: string;
  sections: {
    id: string;
    key: string;
    title: string;
    fields: {
      id: string;
      key: string;
      label: string;
      valueType: string;
      table?: { columns: { key: string; label: string; required?: boolean }[] };
    }[];
  }[];
}

export interface Project {
  documents: ProjectDocument[];
}

export interface DocumentEditorState {
  document: ProjectDocument;
  fieldValues: Record<string, TableRowCellValue | TableRowValue[]>;
}

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
            rows?: TableRowValue[];
          };
        };
      };
    };
  };
}

export function validateReferenceIntegrity(
  state: DocumentEditorState,
  project: Project
): DesignValidationIssue[];
export function validateReferenceIntegrity(
  documentId: string,
  sectionKey: string,
  fieldKey: string,
  rows: TableRowValue[],
  documentMap: DocumentMap
): DesignValidationIssue[];
export function validateReferenceIntegrity(
  stateOrDocumentId: DocumentEditorState | string,
  projectOrSectionKey: Project | string,
  fieldKey?: string,
  rows?: TableRowValue[],
  documentMap?: DocumentMap
): DesignValidationIssue[] {
  if (typeof stateOrDocumentId !== 'string') {
    return validateEditorReferenceIntegrity(stateOrDocumentId, projectOrSectionKey as Project);
  }

  const issues: DesignValidationIssue[] = [];
  const documentId = stateOrDocumentId;
  const sectionKey = projectOrSectionKey as string;
  const map = documentMap ?? {};

  (rows ?? []).forEach((row, rowIndex) => {
    Object.entries(row).forEach(([cellKey, cellValue]) => {
      extractReferences(cellValue).forEach((ref) => {
        const validationResult = validateReference(ref, map);
        if (!validationResult.valid) {
          issues.push(
            createIssue(
              `invalid-reference-${documentId}-${sectionKey}-${fieldKey ?? ''}-${rowIndex}-${cellKey}`,
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

function validateEditorReferenceIntegrity(
  state: DocumentEditorState,
  project: Project
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];
  const documentById = new Map(project.documents.map((doc) => [doc.id, doc]));

  if (state.document.kind !== 'screen-spec') return [];

  const screenFieldKeys = new Set<string>();
  const eventNames = new Set<string>();

  const screenFieldsTable = state.document.sections
    .find((section) => section.key === 'screen-fields')
    ?.fields.find((field) => field.key === 'screen-fields');
  const screenFieldRows =
    screenFieldsTable && Array.isArray(state.fieldValues[screenFieldsTable.id])
      ? (state.fieldValues[screenFieldsTable.id] as TableRowValue[])
      : [];
  screenFieldRows.forEach((row) => {
    const fieldKeyValue = getCellString(row, 'fieldKey');
    if (fieldKeyValue) screenFieldKeys.add(fieldKeyValue);
  });

  for (const section of state.document.sections) {
    if (section.key !== 'api-connections') continue;

    for (const field of section.fields) {
      if (field.valueType !== 'table' || !field.table) continue;
      const rowsValue = Array.isArray(state.fieldValues[field.id])
        ? (state.fieldValues[field.id] as TableRowValue[])
        : [];

      rowsValue.forEach((row, rowIndex) => {
        if (isRowEmpty(row, field.table!.columns)) return;

        const targetDocId = getCellReferenceDocumentId(row, 'apiRef');

        if (targetDocId) {
          const targetDoc = documentById.get(targetDocId);
          if (!targetDoc) {
            issues.push({
              id: `${section.id}:${field.id}:row${rowIndex}:ref-not-found`,
              documentId: state.document.id,
              severity: 'error',
              sectionId: section.id,
              sectionTitle: section.title,
              fieldId: field.id,
              fieldLabel: field.label,
              rowIndex,
              columnKey: 'apiRef',
              message: `行 ${rowIndex + 1}: 参照先のAPI仕様書が見つかりません`,
              reason: '参照先のドキュメントがProject内に存在しません。削除された可能性があります。',
              fix: '「API参照」から有効なAPI仕様書を再選択してください。',
            });
          } else if (targetDoc.kind !== 'api-spec') {
            issues.push({
              id: `${section.id}:${field.id}:row${rowIndex}:ref-wrong-kind`,
              documentId: state.document.id,
              severity: 'error',
              sectionId: section.id,
              sectionTitle: section.title,
              fieldId: field.id,
              fieldLabel: field.label,
              rowIndex,
              columnKey: 'apiRef',
              message: `行 ${rowIndex + 1}: 参照先がAPI仕様書ではありません`,
              reason: `参照先「${targetDoc.title}」は ${targetDoc.kind} であり、api-spec ではありません。`,
              fix: '「API参照」からAPI仕様書のみを選択してください。',
            });
          }
        }
      });
    }
  }

  for (const section of state.document.sections) {
    if (section.key !== 'events') continue;

    for (const field of section.fields) {
      if (field.valueType !== 'table' || !field.table) continue;
      const rowsValue = Array.isArray(state.fieldValues[field.id])
        ? (state.fieldValues[field.id] as TableRowValue[])
        : [];
      const apiConnectionsField = state.document.sections
        .find((s) => s.key === 'api-connections')
        ?.fields.find((f) => f.key === 'api-connections');
      const apiConnectionRows =
        apiConnectionsField && Array.isArray(state.fieldValues[apiConnectionsField.id])
          ? (state.fieldValues[apiConnectionsField.id] as TableRowValue[])
          : [];
      const hasAnyApiRef = apiConnectionRows.some(
        (row) => getCellReferenceDocumentId(row, 'apiRef') !== ''
      );

      rowsValue.forEach((row, rowIndex) => {
        if (isRowEmpty(row, field.table!.columns)) return;
        const actionType = getCellString(row, 'actionType');
        const eventName = getCellString(row, 'eventName');
        const target = getCellString(row, 'target');
        if (eventName) eventNames.add(eventName);
        const isApiAction = API_ACTION_KEYWORDS.some((keyword) =>
          actionType.toLowerCase().includes(keyword.toLowerCase())
        );

        if (target && !isApiAction && !screenFieldKeys.has(target)) {
          issues.push({
            id: `${section.id}:${field.id}:row${rowIndex}:event-target-field-not-found`,
            documentId: state.document.id,
            severity: 'warning',
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            rowIndex,
            columnKey: 'target',
            message: `行 ${rowIndex + 1}: event の対象 field が見つかりません`,
            reason: `対象「${target}」に一致する screen field key が定義されていません。`,
            fix: 'Screen Fields の項目キーを確認するか、Events の対象を修正してください。',
          });
        }

        if (
          isApiAction &&
          !hasAnyApiRef &&
          project.documents.some((document) => document.kind === 'api-spec')
        ) {
          issues.push({
            id: `${section.id}:${field.id}:row${rowIndex}:api-action-no-ref`,
            documentId: state.document.id,
            severity: 'warning',
            sectionId: section.id,
            sectionTitle: section.title,
            fieldId: field.id,
            fieldLabel: field.label,
            rowIndex,
            columnKey: 'actionType',
            message: `行 ${rowIndex + 1}: API呼出の処理ですが、API Connectionsに参照が設定されていません`,
            reason:
              'API呼出系のイベントがあるのに、API Connectionsでapi-specへの参照が未設定です。',
            fix: 'API Connectionsセクションで対応するapi-specを「API参照」列から選択してください。',
          });
        }
      });
    }
  }

  for (const section of state.document.sections) {
    if (section.key !== 'messages') continue;
    for (const field of section.fields) {
      if (field.valueType !== 'table' || !field.table) continue;
      const rowsValue = Array.isArray(state.fieldValues[field.id])
        ? (state.fieldValues[field.id] as TableRowValue[])
        : [];
      rowsValue.forEach((row, rowIndex) => {
        const condition = getCellString(row, 'condition');
        if (!condition.startsWith('event:')) return;
        const eventName = condition.slice(6).trim();
        if (!eventName || eventNames.has(eventName)) return;
        issues.push({
          id: `${section.id}:${field.id}:row${rowIndex}:message-event-not-found`,
          documentId: state.document.id,
          severity: 'warning',
          sectionId: section.id,
          sectionTitle: section.title,
          fieldId: field.id,
          fieldLabel: field.label,
          rowIndex,
          columnKey: 'condition',
          message: `行 ${rowIndex + 1}: message が参照する event が存在しません`,
          reason: `condition で参照された event「${eventName}」が Events セクションに未定義です。`,
          fix: 'Events に対象 event を追加するか、condition の event 名を修正してください。',
        });
      });
    }
  }

  return issues;
}

export function extractReferences(
  value: TableRowCellValue | TableRowValue
): LegacyReferenceValue[] {
  if (isReferenceValue(value) && 'type' in value) {
    return [value];
  }
  return [];
}

export function validateReference(
  ref: LegacyReferenceValue,
  documentMap: DocumentMap
): {
  valid: boolean;
  severity: 'error' | 'warning';
  message: string;
} {
  const targetDocumentId = ref.targetDocumentId ?? '';
  const targetDoc = documentMap[targetDocumentId];
  if (!targetDoc) {
    return {
      valid: false,
      severity: 'error',
      message: `参照先ドキュメント「${targetDocumentId}」が見つかりません（参照: ${ref.displayValue ?? ''}）`,
    };
  }

  return {
    valid: true,
    severity: 'warning',
    message: '',
  };
}

export function validateProjectReferences(documentMap: DocumentMap): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  Object.entries(documentMap).forEach(([documentId, doc]) => {
    Object.entries(doc.sections).forEach(([sectionKey, section]) => {
      Object.entries(section.fields).forEach(([fieldKey, field]) => {
        if (field.type === 'table' && field.rows) {
          issues.push(
            ...validateReferenceIntegrity(documentId, sectionKey, fieldKey, field.rows, documentMap)
          );
        }
      });
    });
  });

  return issues;
}
