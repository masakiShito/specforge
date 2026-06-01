import { describe, it, expect } from 'vitest';
import { importProjectFromJson, importDocumentFromJson, validateImportData } from './json-import';

describe('importProjectFromJson', () => {
  const validProjectExport = {
    version: '1.0.0',
    exportedAt: '2024-01-01T00:00:00.000Z',
    project: {
      id: 'project-1',
      key: 'test-project',
      title: 'Test Project',
      required: true,
      documents: [
        {
          id: 'doc-1',
          key: 'screen-spec-1',
          title: 'Login Screen',
          kind: 'screen-spec',
          version: '1.0.0',
          required: true,
          sections: [
            {
              id: 'section-1',
              key: 'overview',
              title: 'Overview',
              required: true,
              fields: [
                {
                  id: 'field-1',
                  key: 'purpose',
                  label: 'Purpose',
                  required: true,
                  valueType: 'textarea',
                },
              ],
            },
          ],
        },
      ],
    },
    documentStates: [
      {
        document: {
          id: 'doc-1',
          key: 'screen-spec-1',
          title: 'Login Screen',
          kind: 'screen-spec',
          version: '1.0.0',
          required: true,
          sections: [
            {
              id: 'section-1',
              key: 'overview',
              title: 'Overview',
              required: true,
              fields: [
                {
                  id: 'field-1',
                  key: 'purpose',
                  label: 'Purpose',
                  required: true,
                  valueType: 'textarea',
                },
              ],
            },
          ],
        },
        fieldValues: {
          'field-1': 'Test purpose',
        },
      },
    ],
  };

  it('should import valid project JSON', () => {
    const result = importProjectFromJson(JSON.stringify(validProjectExport));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.title).toBe('Test Project');
      expect(result.data.documentStates.length).toBe(1);
    }
  });

  it('should regenerate IDs on import', () => {
    const result = importProjectFromJson(JSON.stringify(validProjectExport));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.id).not.toBe('project-1');
      expect(result.data.project.documents[0].id).not.toBe('doc-1');
    }
  });

  it('should preserve field values with new IDs', () => {
    const result = importProjectFromJson(JSON.stringify(validProjectExport));

    expect(result.success).toBe(true);
    if (result.success) {
      const fieldValues = result.data.documentStates[0].fieldValues;
      const values = Object.values(fieldValues);
      expect(values).toContain('Test purpose');
    }
  });

  it('should reject invalid JSON', () => {
    const result = importProjectFromJson('not valid json');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Failed to parse JSON');
    }
  });

  it('should reject missing version', () => {
    const invalidExport = { ...validProjectExport, version: undefined };
    const result = importProjectFromJson(JSON.stringify(invalidExport));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details).toContain('Missing or invalid version');
    }
  });

  it('should reject unsupported version', () => {
    const invalidExport = { ...validProjectExport, version: '99.0.0' };
    const result = importProjectFromJson(JSON.stringify(invalidExport));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details?.some((d) => d.includes('Unsupported version'))).toBe(true);
    }
  });

  it('should reject missing project data', () => {
    const invalidExport = { ...validProjectExport, project: undefined };
    const result = importProjectFromJson(JSON.stringify(invalidExport));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details).toContain('Missing project data');
    }
  });

  it('should reject missing documentStates', () => {
    const invalidExport = { ...validProjectExport, documentStates: undefined };
    const result = importProjectFromJson(JSON.stringify(invalidExport));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details).toContain('Missing or invalid documentStates array');
    }
  });
});

describe('importDocumentFromJson', () => {
  const validDocumentExport = {
    version: '1.0.0',
    exportedAt: '2024-01-01T00:00:00.000Z',
    document: {
      id: 'doc-1',
      key: 'screen-spec-1',
      title: 'Login Screen',
      kind: 'screen-spec',
      version: '1.0.0',
      required: true,
      sections: [
        {
          id: 'section-1',
          key: 'overview',
          title: 'Overview',
          required: true,
          fields: [
            {
              id: 'field-1',
              key: 'purpose',
              label: 'Purpose',
              required: true,
              valueType: 'textarea',
            },
          ],
        },
      ],
    },
    fieldValues: {
      'field-1': 'Test purpose',
    },
  };

  it('should import valid document JSON', () => {
    const result = importDocumentFromJson(JSON.stringify(validDocumentExport));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.document.title).toBe('Login Screen');
    }
  });

  it('should regenerate IDs on import', () => {
    const result = importDocumentFromJson(JSON.stringify(validDocumentExport));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.document.id).not.toBe('doc-1');
      expect(result.data.document.sections[0].id).not.toBe('section-1');
    }
  });

  it('should preserve field values with new IDs', () => {
    const result = importDocumentFromJson(JSON.stringify(validDocumentExport));

    expect(result.success).toBe(true);
    if (result.success) {
      const values = Object.values(result.data.fieldValues);
      expect(values).toContain('Test purpose');
    }
  });

  it('should handle document with table fields', () => {
    const exportWithTable = {
      ...validDocumentExport,
      document: {
        ...validDocumentExport.document,
        sections: [
          {
            id: 'section-1',
            key: 'elements',
            title: 'Elements',
            required: true,
            fields: [
              {
                id: 'field-1',
                key: 'elements',
                label: 'Elements',
                required: true,
                valueType: 'table',
                table: {
                  id: 'table-1',
                  columns: [
                    { id: 'col-1', key: 'name', label: 'Name', required: true, valueType: 'text' },
                  ],
                },
              },
            ],
          },
        ],
      },
      fieldValues: {
        'field-1': [{ name: 'Button' }],
      },
    };

    const result = importDocumentFromJson(JSON.stringify(exportWithTable));

    expect(result.success).toBe(true);
    if (result.success) {
      const values = Object.values(result.data.fieldValues);
      expect(values.length).toBeGreaterThan(0);
    }
  });

  it('should reject invalid JSON', () => {
    const result = importDocumentFromJson('invalid json');

    expect(result.success).toBe(false);
  });

  it('should reject missing document', () => {
    const invalidExport = { version: '1.0.0' };
    const result = importDocumentFromJson(JSON.stringify(invalidExport));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details).toContain('Missing document data');
    }
  });
});

describe('validateImportData', () => {
  it('should validate project export data', () => {
    const data = {
      version: '1.0.0',
      project: {
        id: '1',
        key: 'test',
        title: 'Test',
        required: true,
        documents: [],
      },
      documentStates: [],
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(true);
  });

  it('should validate document export data', () => {
    const data = {
      version: '1.0.0',
      document: {
        id: '1',
        key: 'test',
        title: 'Test',
        kind: 'screen-spec',
        version: '1.0.0',
        required: true,
        sections: [],
      },
      fieldValues: {},
    };

    const result = validateImportData(data);
    expect(result.valid).toBe(true);
  });

  it('should reject non-object data', () => {
    const result = validateImportData('string');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Data must be an object');
  });

  it('should reject null data', () => {
    const result = validateImportData(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Data must be an object');
  });

  it('should reject data without project or document', () => {
    const result = validateImportData({ version: '1.0.0' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Data must contain either 'project' or 'document'");
  });

  it('should reject invalid version', () => {
    const result = validateImportData({ version: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid version');
  });
});
