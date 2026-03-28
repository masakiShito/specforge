import type { Field } from "@specforge/document-schema";

import type { TableRowValue } from "../../document-editor/create-document-state";
import type { DesignValidationIssue, TableValidationContext } from "../types";
import {
  findDuplicateKeys,
  findEmptyRows,
  findMissingRequiredCells,
} from "./common";

/**
 * Request Parameters table – design quality rules.
 */
export function validateRequestParameters(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, "parameterKey", "パラメータキー", ctx));

  return issues;
}

/**
 * Response Parameters table – design quality rules.
 */
export function validateResponseParameters(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, "parameterKey", "パラメータキー", ctx));

  return issues;
}

/**
 * Error Responses table – design quality rules.
 */
export function validateErrorResponses(
  rows: TableRowValue[],
  columns: Field[],
  ctx: TableValidationContext
): DesignValidationIssue[] {
  const issues: DesignValidationIssue[] = [];

  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, "errorCode", "エラーコード", ctx));

  return issues;
}
