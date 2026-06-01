import type {
  DesignValidationIssue,
  TableColumnDefinition,
  TableRowValue,
  TableValidationContext,
} from '../types';
import {
  validateUniqueness,
  validateRequiredColumns,
  createIssue,
  normalizeTableValidationArgs,
} from './common';

type Field = TableColumnDefinition;

/**
 * Validate entities table
 * - Entity name and physical name must be unique
 * - Required columns must be filled
 */
export function validateEntities(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columnsArg?: Field[],
  ctxArg?: TableValidationContext
): DesignValidationIssue[] {
  const { rows, columns, ctx } = normalizeTableValidationArgs(rowsOrContext, columnsArg, ctxArg);
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate unique entity names
  issues.push(...validateUniqueness(rows, 'entityName', 'エンティティ名', ctx));

  // Validate unique physical names
  issues.push(...validateUniqueness(rows, 'physicalName', '物理名', ctx));

  // Validate physical name format (alphanumeric and underscores only)
  rows.forEach((row, rowIndex) => {
    const physicalName = row.physicalName;
    if (
      typeof physicalName === 'string' &&
      physicalName &&
      !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(physicalName)
    ) {
      issues.push(
        createIssue({
          ...ctx,
          rowIndex,
          columnKey: 'physicalName',
          severity: 'warning',
          message:
            '物理名は英字・数字・アンダースコアのみで、英字またはアンダースコアで始めてください',
        })
      );
    }
  });

  return issues;
}

/**
 * Validate attributes table
 * - Required columns must be filled
 * - Physical name format validation
 * - At least one PK should be defined per entity
 */
export function validateAttributes(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columnsArg?: Field[],
  ctxArg?: TableValidationContext
): DesignValidationIssue[] {
  const { rows, columns, ctx } = normalizeTableValidationArgs(rowsOrContext, columnsArg, ctxArg);
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate physical name format
  rows.forEach((row, rowIndex) => {
    const physicalName = row.physicalName;
    if (
      typeof physicalName === 'string' &&
      physicalName &&
      !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(physicalName)
    ) {
      issues.push(
        createIssue({
          ...ctx,
          rowIndex,
          columnKey: 'physicalName',
          severity: 'warning',
          message:
            '物理名は英字・数字・アンダースコアのみで、英字またはアンダースコアで始めてください',
        })
      );
    }
  });

  // Check for entities without primary keys
  const entitiesWithPk = new Set<string>();
  const allEntities = new Set<string>();

  rows.forEach((row) => {
    const entityName = row.entityName;
    if (typeof entityName === 'string' && entityName) {
      allEntities.add(entityName);
      if (row.isPrimaryKey === true) {
        entitiesWithPk.add(entityName);
      }
    }
  });

  allEntities.forEach((entityName) => {
    if (!entitiesWithPk.has(entityName)) {
      const firstRowIndex = rows.findIndex((r) => r.entityName === entityName);
      if (firstRowIndex >= 0) {
        issues.push(
          createIssue({
            ...ctx,
            rowIndex: firstRowIndex,
            columnKey: 'isPrimaryKey',
            severity: 'warning',
            message: `エンティティ「${entityName}」に主キーが定義されていません`,
          })
        );
      }
    }
  });

  return issues;
}

/**
 * Validate relationships table
 * - Required columns must be filled
 * - Validate parent/child entity references
 */
export function validateRelationships(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columnsArg?: Field[],
  ctxArg?: TableValidationContext
): DesignValidationIssue[] {
  const { rows, columns, ctx } = normalizeTableValidationArgs(rowsOrContext, columnsArg, ctxArg);
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate unique relation names
  issues.push(...validateUniqueness(rows, 'relationName', 'リレーション名', ctx));

  // Check for self-referential relationships (not necessarily an error, but info)
  rows.forEach((row, rowIndex) => {
    const parent = row.parentEntity;
    const child = row.childEntity;
    if (parent && child && parent === child) {
      issues.push(
        createIssue({
          ...ctx,
          rowIndex,
          columnKey: 'childEntity',
          severity: 'info',
          message: '自己参照リレーションが定義されています',
        })
      );
    }
  });

  return issues;
}

/**
 * Validate indexes table
 * - Required columns must be filled
 * - Validate unique index names
 */
export function validateIndexes(
  rowsOrContext: TableRowValue[] | TableValidationContext,
  columnsArg?: Field[],
  ctxArg?: TableValidationContext
): DesignValidationIssue[] {
  const { rows, columns, ctx } = normalizeTableValidationArgs(rowsOrContext, columnsArg, ctxArg);
  const issues: DesignValidationIssue[] = [];

  // Validate required columns
  issues.push(...validateRequiredColumns(rows, columns, ctx));

  // Validate unique index names
  issues.push(...validateUniqueness(rows, 'indexName', 'インデックス名', ctx));

  return issues;
}
