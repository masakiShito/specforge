import { describe, expect, it } from 'vitest';

import { validateAttributes, validateEntities, validateRelationships } from './er-spec-tables';
import type { TableValidationContext } from '../types';

const ctx: TableValidationContext = {
  documentId: 'er-doc',
  sectionId: 'er-section',
  sectionTitle: 'ER',
  fieldId: 'er-field',
  fieldLabel: 'ER Table',
  tableKey: 'entities',
};

describe('er spec table validators', () => {
  it('validates entity uniqueness and physical name format', () => {
    const issues = validateEntities(
      [
        { entityName: 'User', physicalName: 'users' },
        { entityName: 'User', physicalName: '123-users' },
      ],
      [
        { key: 'entityName', label: 'Entity Name', required: true },
        { key: 'physicalName', label: 'Physical Name', required: true },
      ],
      ctx
    );

    expect(issues.some((issue) => issue.id.endsWith(':entityName:duplicate'))).toBe(true);
    expect(
      issues.some((issue) => issue.columnKey === 'physicalName' && issue.severity === 'warning')
    ).toBe(true);
  });

  it('warns when an entity has no primary key attribute', () => {
    const issues = validateAttributes(
      [{ entityName: 'User', physicalName: 'name', isPrimaryKey: false }],
      [
        { key: 'entityName', label: 'Entity Name', required: true },
        { key: 'physicalName', label: 'Physical Name', required: true },
      ],
      ctx
    );

    expect(issues.some((issue) => issue.columnKey === 'isPrimaryKey')).toBe(true);
  });

  it('reports self-referential relationships as info', () => {
    const issues = validateRelationships(
      [{ relationName: 'parent', parentEntity: 'User', childEntity: 'User' }],
      [
        { key: 'relationName', label: 'Relation Name', required: true },
        { key: 'parentEntity', label: 'Parent', required: true },
        { key: 'childEntity', label: 'Child', required: true },
      ],
      ctx
    );

    expect(
      issues.some((issue) => issue.columnKey === 'childEntity' && issue.severity === 'info')
    ).toBe(true);
  });
});
