import { describe, expect, it } from 'vitest';

import { validateExceptions, validateRules, validateValidations } from './business-rule-tables';
import type { TableValidationContext } from '../types';

const ctx: TableValidationContext = {
  documentId: 'business-doc',
  sectionId: 'business-section',
  sectionTitle: 'Business Rules',
  fieldId: 'business-field',
  fieldLabel: 'Business Table',
  tableKey: 'rules',
};

describe('business rule table validators', () => {
  it('validates rule uniqueness and condition/action consistency', () => {
    const issues = validateRules(
      [
        { ruleId: 'R001', condition: 'logged in', action: '' },
        { ruleId: 'R001', condition: '', action: 'show screen' },
      ],
      [{ key: 'ruleId', label: 'Rule ID', required: true }],
      ctx
    );

    expect(issues.some((issue) => issue.id.endsWith(':ruleId:duplicate'))).toBe(true);
    expect(
      issues.some((issue) => issue.columnKey === 'action' && issue.severity === 'warning')
    ).toBe(true);
    expect(
      issues.some((issue) => issue.columnKey === 'condition' && issue.severity === 'warning')
    ).toBe(true);
  });

  it('warns when exceptions omit related rule IDs', () => {
    const issues = validateExceptions(
      [{ exceptionId: 'E001', relatedRuleId: '' }],
      [{ key: 'exceptionId', label: 'Exception ID', required: true }],
      ctx
    );

    expect(issues.some((issue) => issue.columnKey === 'relatedRuleId')).toBe(true);
  });

  it('recommends validation error messages', () => {
    const issues = validateValidations(
      [{ validationId: 'V001', errorMessage: '' }],
      [{ key: 'validationId', label: 'Validation ID', required: true }],
      ctx
    );

    expect(
      issues.some((issue) => issue.columnKey === 'errorMessage' && issue.severity === 'info')
    ).toBe(true);
  });
});
