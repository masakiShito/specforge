import type {
  DesignValidationIssue,
  TableColumnDefinition,
  TableRowValue,
  TableValidationContext,
} from '../types';
import {
  findDuplicateKeys,
  findEmptyRows,
  findMissingRequiredCells,
  normalizeTableValidationArgs,
} from './common';

type Field = TableColumnDefinition;

/**
 * Request Parameters table – design quality rules.
 */
export function validateRequestParameters(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columnsArg?: Field[],
  ctxArg?: TableValidationContext
): DesignValidationIssue[] {
  const { rows, columns, ctx } = normalizeTableValidationArgs(rowsOrContext, columnsArg, ctxArg);
  const issues: DesignValidationIssue[] = [];

  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, 'parameterKey', 'パラメータキー', ctx));

  return issues;
}

/**
 * Response Parameters table – design quality rules.
 */
export function validateResponseParameters(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columnsArg?: Field[],
  ctxArg?: TableValidationContext
): DesignValidationIssue[] {
  const { rows, columns, ctx } = normalizeTableValidationArgs(rowsOrContext, columnsArg, ctxArg);
  const issues: DesignValidationIssue[] = [];

  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, 'parameterKey', 'パラメータキー', ctx));

  return issues;
}

/**
 * Error Responses table – design quality rules.
 */
export function validateErrorResponses(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columnsArg?: Field[],
  ctxArg?: TableValidationContext
): DesignValidationIssue[] {
  const { rows, columns, ctx } = normalizeTableValidationArgs(rowsOrContext, columnsArg, ctxArg);
  const issues: DesignValidationIssue[] = [];

  issues.push(...findEmptyRows(rows, columns, ctx));
  issues.push(...findMissingRequiredCells(rows, columns, ctx));
  issues.push(...findDuplicateKeys(rows, 'errorCode', 'エラーコード', ctx));

  return issues;
}

export const validateRequestParams = validateRequestParameters;
export const validateResponseSchema = validateResponseParameters;

export function isRequestParamsTable(fieldKey: string): boolean {
  return fieldKey === 'request-parameters' || fieldKey === 'requestParams';
}

export function isResponseSchemaTable(fieldKey: string): boolean {
  return fieldKey === 'response-parameters' || fieldKey === 'responseSchema';
}

export function isErrorResponsesTable(fieldKey: string): boolean {
  return fieldKey === 'error-responses' || fieldKey === 'errorResponses';
}
