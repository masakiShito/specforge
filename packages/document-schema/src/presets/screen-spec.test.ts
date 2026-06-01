import { describe, it, expect } from 'vitest';
import { screenSpecPreset } from './screen-spec';

describe('screenSpecPreset', () => {
  it('should have correct document kind', () => {
    expect(screenSpecPreset.kind).toBe('screen-spec');
  });

  it('should have required sections', () => {
    const sectionKeys = screenSpecPreset.sections.map((s) => s.key);
    expect(sectionKeys).toContain('overview');
    expect(sectionKeys).toContain('usage-scenario');
    expect(sectionKeys).toContain('screen-fields');
    expect(sectionKeys).toContain('events');
    expect(sectionKeys).toContain('messages');
    expect(sectionKeys).toContain('api-connections');
  });

  it('should have unique section IDs', () => {
    const sectionIds = screenSpecPreset.sections.map((s) => s.id);
    const uniqueIds = new Set(sectionIds);
    expect(uniqueIds.size).toBe(sectionIds.length);
  });

  it('should have unique field IDs across all sections', () => {
    const allFieldIds: string[] = [];
    for (const section of screenSpecPreset.sections) {
      for (const field of section.fields) {
        allFieldIds.push(field.id);
      }
    }
    const uniqueIds = new Set(allFieldIds);
    expect(uniqueIds.size).toBe(allFieldIds.length);
  });

  describe('screen-fields section', () => {
    it('should have table field with correct columns', () => {
      const screenFieldsSection = screenSpecPreset.sections.find((s) => s.key === 'screen-fields');
      expect(screenFieldsSection).toBeDefined();

      const tableField = screenFieldsSection?.fields.find((f) => f.valueType === 'table');
      expect(tableField).toBeDefined();
      expect(tableField?.table).toBeDefined();

      const columnKeys = tableField?.table?.columns.map((c) => c.key);
      expect(columnKeys).toContain('name');
      expect(columnKeys).toContain('fieldKey');
      expect(columnKeys).toContain('inputType');
      expect(columnKeys).toContain('required');
    });

    it('should have inputType enum with valid options', () => {
      const screenFieldsSection = screenSpecPreset.sections.find((s) => s.key === 'screen-fields');
      const tableField = screenFieldsSection?.fields.find((f) => f.valueType === 'table');
      const inputTypeColumn = tableField?.table?.columns.find((c) => c.key === 'inputType');

      expect(inputTypeColumn?.valueType).toBe('enum');
      expect(inputTypeColumn?.options).toBeDefined();
      expect(inputTypeColumn?.options?.length).toBeGreaterThan(0);

      const optionValues = inputTypeColumn?.options?.map((o) => o.value);
      expect(optionValues).toContain('text');
      expect(optionValues).toContain('textarea');
      expect(optionValues).toContain('select');
    });
  });

  describe('api-connections section', () => {
    it('should have reference field for API documents', () => {
      const apiConnectionsSection = screenSpecPreset.sections.find(
        (s) => s.key === 'api-connections'
      );
      expect(apiConnectionsSection).toBeDefined();

      const tableField = apiConnectionsSection?.fields.find((f) => f.valueType === 'table');
      const apiRefColumn = tableField?.table?.columns.find((c) => c.key === 'apiRef');

      expect(apiRefColumn?.valueType).toBe('reference');
      expect(apiRefColumn?.reference?.kind).toBe('document');
      expect(apiRefColumn?.reference?.constraint?.documentKinds).toContain('api-spec');
    });
  });
});
