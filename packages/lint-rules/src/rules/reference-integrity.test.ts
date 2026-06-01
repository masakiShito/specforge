import { describe, expect, it } from 'vitest';

import { validateReferenceIntegrity } from './reference-integrity';

describe('validateReferenceIntegrity', () => {
  it('validates web editor project references after migration', () => {
    const state = {
      document: {
        id: 'screen',
        kind: 'screen-spec',
        title: 'Screen',
        sections: [
          {
            id: 'api-section',
            key: 'api-connections',
            title: 'API Connections',
            fields: [
              {
                id: 'api-field',
                key: 'api-connections',
                label: 'API Connections',
                valueType: 'table',
                table: {
                  columns: [
                    { key: 'apiRef', label: 'API Reference', required: true },
                    { key: 'timing', label: 'Timing', required: true },
                  ],
                },
              },
            ],
          },
        ],
      },
      fieldValues: {
        'api-field': [
          {
            apiRef: { refId: 'other', kind: 'document', documentId: 'other' },
            timing: 'on load',
          },
        ],
      },
    };
    const project = {
      documents: [
        state.document,
        { id: 'other', kind: 'screen-spec', title: 'Other Screen', sections: [] },
      ],
    };

    const issues = validateReferenceIntegrity(state, project);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: 'error',
      columnKey: 'apiRef',
      reason: expect.stringContaining('Other Screen'),
    });
  });

  it('keeps legacy document map reference validation working', () => {
    const issues = validateReferenceIntegrity(
      'doc',
      'section',
      'field',
      [
        {
          ref: {
            type: 'reference',
            referenceType: 'screen-field',
            targetDocumentId: 'missing',
            targetKey: 'field',
            displayValue: 'Missing',
          },
        },
      ],
      {}
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      documentId: 'doc',
      sectionId: 'section',
      fieldId: 'field',
      severity: 'error',
    });
  });
});
