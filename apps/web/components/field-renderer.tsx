import { forwardRef, type CSSProperties, type Ref } from "react";
import type { Field, Project } from "@specforge/document-schema";

import type { DocumentEditorState, FieldValue, TableRowValue } from "../lib/document-editor/create-document-state";
import { getCandidatesForReference } from "../lib/reference/helpers";
import { isReferenceValue, toReferenceValue } from "../lib/reference/model";
import { TableFieldEditor } from "./field/TableFieldEditor";

interface FieldRendererProps {
  field: Field;
  value: FieldValue;
  hasError?: boolean;
  cellErrors?: Set<string>;
  cellWarnings?: Set<string>;
  onValueChange: (fieldId: string, value: FieldValue) => void;
  project: Project;
  documentStates: Record<string, DocumentEditorState>;
  onNavigateToReference?: (documentId: string, sectionId?: string, fieldId?: string) => void;
}

function getInputStyle(hasError: boolean): CSSProperties {
  return { width: "100%", border: hasError ? "1.5px solid #EF4444" : "1px solid #E2E8F0", borderRadius: "6px", padding: "8px 10px", fontSize: "0.875rem", color: "#0F172A", backgroundColor: hasError ? "#FFFBFB" : "#FFFFFF", boxSizing: "border-box", outline: "none" };
}

export const FieldRenderer = forwardRef(function FieldRenderer(
  { field, value, hasError = false, cellErrors, cellWarnings, onValueChange, project, documentStates, onNavigateToReference }: FieldRendererProps,
  ref: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  const style = getInputStyle(hasError);

  if (field.valueType === "text") return <input ref={ref as Ref<HTMLInputElement>} style={style} type="text" placeholder={field.placeholder ?? "テキストを入力"} value={typeof value === "string" ? value : ""} onChange={(event) => onValueChange(field.id, event.target.value)} />;
  if (field.valueType === "textarea") return <textarea ref={ref as Ref<HTMLTextAreaElement>} style={{ ...style, minHeight: "100px", resize: "vertical" }} placeholder={field.placeholder ?? "テキストを入力"} value={typeof value === "string" ? value : ""} onChange={(event) => onValueChange(field.id, event.target.value)} />;
  if (field.valueType === "number") return <input ref={ref as Ref<HTMLInputElement>} style={style} type="number" value={typeof value === "number" ? value : ""} onChange={(event) => onValueChange(field.id, event.target.value === "" ? undefined : Number(event.target.value))} />;

  if (field.valueType === "reference" && field.reference) {
    const candidates = getCandidatesForReference(project, documentStates, field.reference);
    const current = isReferenceValue(value) ? value : undefined;

    return (
      <select
        ref={ref as Ref<HTMLSelectElement>}
        style={style}
        value={current?.refId ?? ""}
        onChange={(event) => {
          const selected = candidates.find((item) => item.id === event.target.value);
          onValueChange(field.id, selected ? toReferenceValue(selected) : undefined);
        }}
      >
        <option value="">選択してください</option>
        {candidates.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    );
  }

  if (field.valueType === "boolean") {
    const normalizedValue = typeof value === "boolean" ? String(value) : "";
    return <select ref={ref as Ref<HTMLSelectElement>} style={style} value={normalizedValue} onChange={(event) => onValueChange(field.id, event.target.value === "" ? undefined : event.target.value === "true")}><option value="">未選択</option><option value="true">はい</option><option value="false">いいえ</option></select>;
  }
  if (field.valueType === "enum") return <select ref={ref as Ref<HTMLSelectElement>} style={style} value={typeof value === "string" ? value : ""} onChange={(event) => onValueChange(field.id, event.target.value)}><option value="">選択してください</option>{field.options?.map((option) => <option key={option.id} value={option.value}>{option.label}</option>)}</select>;

  if (field.valueType === "table" && field.table) {
    const rows = Array.isArray(value) ? (value as TableRowValue[]) : [];
    return <TableFieldEditor field={field} table={field.table} rows={rows} hasError={hasError} cellErrors={cellErrors} cellWarnings={cellWarnings} onRowsChange={(newRows) => onValueChange(field.id, newRows)} project={project} documentStates={documentStates} onNavigateToReference={onNavigateToReference} />;
  }

  return <div style={{ border: "1px dashed #FCA5A5", borderRadius: "6px", padding: "10px 12px", color: "#EF4444", fontSize: "0.8rem", backgroundColor: "#FEF2F2" }}>不明なフィールド型です</div>;
});
