import { describe, expect, it } from 'vitest';

import { isEventsTable, validateEvents } from './events';
import type { TableValidationContext } from '../types';

const ctx: TableValidationContext = {
  documentId: 'doc',
  sectionId: 'section-events',
  sectionTitle: 'Events',
  fieldId: 'field-events',
  fieldLabel: 'Events',
  tableKey: 'events',
};

const columns = [
  { key: 'eventName', label: 'イベント名', required: true },
  { key: 'triggerType', label: 'トリガー', required: true },
  { key: 'actionType', label: 'アクション', required: true },
  { key: 'target', label: '対象' },
];

describe('validateEvents', () => {
  it('returns migrated event rule issues', () => {
    const issues = validateEvents(
      [
        { eventName: 'load', triggerType: 'onLoad', actionType: 'API呼出', target: '' },
        { eventName: 'load', triggerType: 'onChange', actionType: '表示', target: '' },
      ],
      columns,
      ctx
    );

    expect(issues.some((issue) => issue.id.endsWith(':eventName:duplicate'))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(':api-no-target'))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(':onchange-no-target'))).toBe(true);
  });
});

describe('isEventsTable', () => {
  it('recognizes the web table key', () => {
    expect(isEventsTable('events')).toBe(true);
    expect(isEventsTable('messages')).toBe(false);
  });
});
