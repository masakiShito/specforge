import type { Project, Document, Field } from '@specforge/document-schema';
import type {
  DocumentEditorState,
  FieldValue,
  TableRowValue,
} from '../document-editor/create-document-state';

// Export result type
export interface ExportResult<T> {
  success: true;
  data: T;
}

export interface ExportError {
  success: false;
  error: string;
}

export type ExportResponse<T> = ExportResult<T> | ExportError;

// Import result type
export interface ImportResult<T> {
  success: true;
  data: T;
}

export interface ImportError {
  success: false;
  error: string;
  details?: string[];
}

export type ImportResponse<T> = ImportResult<T> | ImportError;

// Export format options
export type ExportFormat = 'json' | 'markdown' | 'csv';

// JSON export structure
export interface ProjectExportData {
  version: string;
  exportedAt: string;
  project: Project;
  documentStates: DocumentEditorState[];
}

export interface DocumentExportData {
  version: string;
  exportedAt: string;
  document: Document;
  fieldValues: Record<string, FieldValue>;
}

// CSV export options
export interface CsvExportOptions {
  delimiter?: string;
  includeHeader?: boolean;
}

// Table export data
export interface TableExportData {
  tableName: string;
  columns: { key: string; label: string }[];
  rows: TableRowValue[];
}

// Re-export types for convenience
export type { Project, Document, Field, DocumentEditorState, FieldValue, TableRowValue };
