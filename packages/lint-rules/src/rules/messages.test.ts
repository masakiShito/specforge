import { describe, expect, it } from 'vitest';

import { isMessagesTable, validateMessages } from './messages';
import type { TableValidationContext } from '../types';

const ctx: TableValidationContext = {
  documentId: 'doc',
  sectionId: 'section-messages',
  sectionTitle: 'Messages',
  fieldId: 'field-messages',
  fieldLabel: 'Messages',
  tableKey: 'messages',
};

const columns = [
  { key: 'messageId', label: 'メッセージID', required: true },
  { key: 'messageType', label: '種別', required: true },
  { key: 'messageText', label: '文言', required: true },
  { key: 'condition', label: '表示条件' },
];

describe('validateMessages', () => {
  it('returns migrated message rule issues', () => {
    const issues = validateMessages(
      [
        { messageId: 'M001', messageType: 'confirm', messageText: '保存します', condition: '' },
        { messageId: 'M001', messageType: 'error', messageText: 'Error 1', condition: '' },
        { messageId: 'M002', messageType: 'error', messageText: 'Error 2', condition: '' },
        { messageId: 'M003', messageType: 'error', messageText: 'Error 3', condition: '' },
      ],
      columns,
      ctx
    );

    expect(issues.some((issue) => issue.id.endsWith(':messageId:duplicate'))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(':confirm-text-mismatch'))).toBe(true);
    expect(issues.some((issue) => issue.id.endsWith(':error-msgs-no-condition'))).toBe(true);
  });
});

describe('isMessagesTable', () => {
  it('recognizes the web table key', () => {
    expect(isMessagesTable('messages')).toBe(true);
    expect(isMessagesTable('events')).toBe(false);
  });
});
