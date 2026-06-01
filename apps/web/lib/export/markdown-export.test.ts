import { describe, it, expect } from 'vitest';
import { exportDocumentToMarkdown, generateMarkdownFilename } from './markdown-export';
import type { Document } from '@specforge/document-schema';

describe('exportDocumentToMarkdown', () => {
  const mockDocument: Document = {
    id: 'doc-1',
    key: 'screen-spec-1',
    title: 'ログイン画面',
    kind: 'screen-spec',
    version: '1.0.0',
    required: true,
    tags: ['認証', '画面'],
    sections: [
      {
        id: 'section-1',
        key: 'overview',
        title: '概要',
        description: '画面の概要説明',
        required: true,
        fields: [
          {
            id: 'field-1',
            key: 'purpose',
            label: '目的',
            required: true,
            valueType: 'textarea',
          },
        ],
      },
      {
        id: 'section-2',
        key: 'ui-elements',
        title: 'UI要素',
        required: true,
        fields: [
          {
            id: 'field-2',
            key: 'elements',
            label: '要素一覧',
            required: true,
            valueType: 'table',
            table: {
              id: 'table-1',
              columns: [
                { id: 'col-1', key: 'name', label: '要素名', required: true, valueType: 'text' },
                { id: 'col-2', key: 'type', label: '種別', required: true, valueType: 'text' },
                {
                  id: 'col-3',
                  key: 'required',
                  label: '必須',
                  required: false,
                  valueType: 'boolean',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const mockFieldValues = {
    'field-1': 'ユーザー認証を行うための画面',
    'field-2': [
      { name: 'ユーザー名', type: 'テキストフィールド', required: true },
      { name: 'パスワード', type: 'パスワードフィールド', required: true },
      { name: 'ログインボタン', type: 'ボタン', required: false },
    ],
  };

  it('should export document to valid Markdown', () => {
    const result = exportDocumentToMarkdown(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('# ログイン画面');
      expect(result.data).toContain('**種別**: 画面設計書');
      expect(result.data).toContain('**バージョン**: 1.0.0');
    }
  });

  it('should include tags in output', () => {
    const result = exportDocumentToMarkdown(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('**タグ**: 認証, 画面');
    }
  });

  it('should render sections with titles', () => {
    const result = exportDocumentToMarkdown(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('## 概要');
      expect(result.data).toContain('## UI要素');
    }
  });

  it('should include section descriptions', () => {
    const result = exportDocumentToMarkdown(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('*画面の概要説明*');
    }
  });

  it('should render field values', () => {
    const result = exportDocumentToMarkdown(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('ユーザー認証を行うための画面');
    }
  });

  it('should render table as Markdown table', () => {
    const result = exportDocumentToMarkdown(mockDocument, mockFieldValues);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('| 要素名 | 種別 | 必須 |');
      expect(result.data).toContain('| --- | --- | --- |');
      expect(result.data).toContain('| ユーザー名 | テキストフィールド | ○ |');
    }
  });

  it('should show placeholder for empty field values', () => {
    const result = exportDocumentToMarkdown(mockDocument, {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('*(未入力)*');
    }
  });

  it('should show placeholder for empty table', () => {
    const result = exportDocumentToMarkdown(mockDocument, { 'field-2': [] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('*(データなし)*');
    }
  });

  it('should handle boolean values', () => {
    const documentWithBoolean: Document = {
      id: 'doc-2',
      key: 'test',
      title: 'Test',
      kind: 'screen-spec',
      version: '1.0.0',
      required: true,
      sections: [
        {
          id: 'section-1',
          key: 'test',
          title: 'Test',
          required: true,
          fields: [
            { id: 'field-1', key: 'active', label: '有効', required: false, valueType: 'boolean' },
          ],
        },
      ],
    };

    const result = exportDocumentToMarkdown(documentWithBoolean, { 'field-1': true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('はい');
    }
  });

  it('should handle enum values with labels', () => {
    const documentWithEnum: Document = {
      id: 'doc-3',
      key: 'test',
      title: 'Test',
      kind: 'screen-spec',
      version: '1.0.0',
      required: true,
      sections: [
        {
          id: 'section-1',
          key: 'test',
          title: 'Test',
          required: true,
          fields: [
            {
              id: 'field-1',
              key: 'status',
              label: 'ステータス',
              required: false,
              valueType: 'enum',
              options: [
                { value: 'active', label: '有効' },
                { value: 'inactive', label: '無効' },
              ],
            },
          ],
        },
      ],
    };

    const result = exportDocumentToMarkdown(documentWithEnum, { 'field-1': 'active' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('有効');
    }
  });

  it('should handle document without tags', () => {
    const documentWithoutTags: Document = {
      ...mockDocument,
      tags: undefined,
    };

    const result = exportDocumentToMarkdown(documentWithoutTags, mockFieldValues);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toContain('**タグ**:');
    }
  });
});

describe('generateMarkdownFilename', () => {
  it('should generate filename with sanitized title', () => {
    const document: Document = {
      id: '1',
      key: 'test',
      title: 'Test Document',
      kind: 'screen-spec',
      version: '1.0.0',
      required: true,
      sections: [],
    };

    const filename = generateMarkdownFilename(document);

    expect(filename).toMatch(/^Test_Document_\d{4}-\d{2}-\d{2}\.md$/);
  });

  it('should sanitize Japanese characters in title', () => {
    const document: Document = {
      id: '1',
      key: 'test',
      title: 'ログイン画面',
      kind: 'screen-spec',
      version: '1.0.0',
      required: true,
      sections: [],
    };

    const filename = generateMarkdownFilename(document);

    expect(filename).not.toContain('ログイン');
    expect(filename).toMatch(/\.md$/);
  });

  it('should sanitize special characters', () => {
    const document: Document = {
      id: '1',
      key: 'test',
      title: 'Test/Document:With*Special?Chars',
      kind: 'screen-spec',
      version: '1.0.0',
      required: true,
      sections: [],
    };

    const filename = generateMarkdownFilename(document);

    expect(filename).not.toContain('/');
    expect(filename).not.toContain(':');
    expect(filename).not.toContain('*');
    expect(filename).not.toContain('?');
  });
});
