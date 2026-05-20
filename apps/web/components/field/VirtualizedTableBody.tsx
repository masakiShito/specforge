"use client";

import { type CSSProperties, memo, useCallback, useRef, useState } from "react";
import type { Field, Project } from "@specforge/document-schema";

import type { DocumentEditorState, TableRowValue } from "../../lib/document-editor/create-document-state";
import {
  useVirtualization,
  VIRTUALIZATION_THRESHOLD,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_TABLE_HEIGHT,
} from "../../hooks/useVirtualization";

interface VirtualizedTableBodyProps {
  columns: Field[];
  rows: TableRowValue[];
  fieldId: string;
  cellErrors?: Set<string>;
  cellWarnings?: Set<string>;
  onCellChange: (rowIndex: number, columnKey: string, value: TableRowValue[string]) => void;
  onDeleteRow: (rowIndex: number) => void;
  renderCell: (
    column: Field,
    value: TableRowValue[string],
    hasError: boolean,
    hasWarning: boolean,
    onChange: (value: TableRowValue[string]) => void
  ) => React.ReactNode;
  isRowEmpty: (row: TableRowValue, columns: Field[]) => boolean;
}

const tdStyle: CSSProperties = {
  padding: "4px 6px",
  borderBottom: "1px solid #F1F5F9",
  verticalAlign: "top",
};

const MemoizedRow = memo(function TableRow({
  row,
  rowIndex,
  columns,
  fieldId,
  cellErrors,
  cellWarnings,
  onCellChange,
  onDeleteRow,
  renderCell,
  isEmpty,
}: {
  row: TableRowValue;
  rowIndex: number;
  columns: Field[];
  fieldId: string;
  cellErrors?: Set<string>;
  cellWarnings?: Set<string>;
  onCellChange: (rowIndex: number, columnKey: string, value: TableRowValue[string]) => void;
  onDeleteRow: (rowIndex: number) => void;
  renderCell: (
    column: Field,
    value: TableRowValue[string],
    hasError: boolean,
    hasWarning: boolean,
    onChange: (value: TableRowValue[string]) => void
  ) => React.ReactNode;
  isEmpty: boolean;
}) {
  return (
    <tr style={{ backgroundColor: isEmpty ? "#FFFBEB" : undefined, height: DEFAULT_ROW_HEIGHT }}>
      {columns.map((col) => {
        const cellKey = `${fieldId}:row${rowIndex}:${col.key}`;
        const hasError = cellErrors?.has(cellKey) ?? false;
        const hasWarning = cellWarnings?.has(cellKey) ?? false;

        return (
          <td key={col.id} style={tdStyle}>
            {renderCell(col, row[col.key], hasError, hasWarning, (value) =>
              onCellChange(rowIndex, col.key, value)
            )}
          </td>
        );
      })}
      <td style={{ ...tdStyle, textAlign: "center" }}>
        <button
          type="button"
          style={{
            background: "none",
            border: "1px solid #E2E8F0",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "0.7rem",
            color: "#94A3B8",
            cursor: "pointer",
          }}
          onClick={() => onDeleteRow(rowIndex)}
        >
          削除
        </button>
      </td>
    </tr>
  );
});

/**
 * Virtualized table body for large tables
 * Only renders visible rows to improve performance
 */
export function VirtualizedTableBody({
  columns,
  rows,
  fieldId,
  cellErrors,
  cellWarnings,
  onCellChange,
  onDeleteRow,
  renderCell,
  isRowEmpty,
}: VirtualizedTableBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(DEFAULT_TABLE_HEIGHT);

  // Use virtualization only for large tables
  const shouldVirtualize = rows.length > VIRTUALIZATION_THRESHOLD;

  const { visibleItems, totalHeight, offsetTop, onScroll } = useVirtualization({
    itemCount: rows.length,
    itemHeight: DEFAULT_ROW_HEIGHT,
    overscan: 5,
    containerHeight,
  });

  // For small tables, render all rows directly
  if (!shouldVirtualize) {
    return (
      <tbody>
        {rows.map((row, rowIndex) => (
          <MemoizedRow
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            columns={columns}
            fieldId={fieldId}
            cellErrors={cellErrors}
            cellWarnings={cellWarnings}
            onCellChange={onCellChange}
            onDeleteRow={onDeleteRow}
            renderCell={renderCell}
            isEmpty={isRowEmpty(row, columns)}
          />
        ))}
      </tbody>
    );
  }

  // For large tables, use virtualization
  return (
    <tbody>
      {/* Spacer row for virtual scroll offset */}
      <tr style={{ height: offsetTop, padding: 0, border: 0 }}>
        <td colSpan={columns.length + 1} style={{ padding: 0, border: 0 }} />
      </tr>

      {/* Visible rows */}
      {visibleItems.map((rowIndex) => {
        const row = rows[rowIndex];
        if (!row) return null;

        return (
          <MemoizedRow
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            columns={columns}
            fieldId={fieldId}
            cellErrors={cellErrors}
            cellWarnings={cellWarnings}
            onCellChange={onCellChange}
            onDeleteRow={onDeleteRow}
            renderCell={renderCell}
            isEmpty={isRowEmpty(row, columns)}
          />
        );
      })}

      {/* Bottom spacer for remaining scroll space */}
      <tr
        style={{
          height: totalHeight - offsetTop - visibleItems.length * DEFAULT_ROW_HEIGHT,
          padding: 0,
          border: 0,
        }}
      >
        <td colSpan={columns.length + 1} style={{ padding: 0, border: 0 }} />
      </tr>
    </tbody>
  );
}

/**
 * Wrapper for the virtualized table with scroll container
 */
export function VirtualizedTableWrapper({
  children,
  rowCount,
  onScroll,
}: {
  children: React.ReactNode;
  rowCount: number;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
}) {
  const shouldVirtualize = rowCount > VIRTUALIZATION_THRESHOLD;

  if (!shouldVirtualize) {
    return <div style={{ overflowX: "auto" }}>{children}</div>;
  }

  return (
    <div
      style={{
        overflowY: "auto",
        overflowX: "auto",
        maxHeight: DEFAULT_TABLE_HEIGHT,
      }}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
}
