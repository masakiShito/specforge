import { describe, it, expect } from 'vitest';
import { importTableFromCsv } from './csv-import';
import type { Field } from '@specforge/document-schema';

describe('importTableFromCsv', () => {
  const mockColumns: Field[] = [
    { id: 'col-1', key: 'name', label: '名前', required: true, valueType: 'text' },
    { id: 'col-2', key: 'type', label: 'タイプ', required: true, valueType: 'text' },
    { id: 'col-3', key: 'required', label: '必須', required: false, valueType: 'boolean' },
  ];

  it('should import valid CSV with header', () => {
    const csv = `名前,タイプ,必須
user_id,string,true
email,string,false`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
      expect(result.data[0].name).toBe('user_id');
      expect(result.data[0].type).toBe('string');
      expect(result.data[0].required).toBe(true);
    }
  });

  it('should match columns by key', () => {
    const csv = `name,type,required
user_id,string,true`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('user_id');
    }
  });

  it('should auto-detect semicolon delimiter', () => {
    const csv = `名前;タイプ;必須
user_id;string;true`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('user_id');
    }
  });

  it('should auto-detect tab delimiter', () => {
    const csv = `名前\tタイプ\t必須
user_id\tstring\ttrue`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('user_id');
    }
  });

  it('should handle quoted cells with delimiters', () => {
    const csv = `名前,タイプ,必須
"field,with,comma",string,true`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('field,with,comma');
    }
  });

  it('should handle quoted cells with escaped quotes', () => {
    const csv = `名前,タイプ,必須
"field""with""quotes",string,true`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('field"with"quotes');
    }
  });

  it('should handle quoted cells with newlines', () => {
    const csv = `名前,タイプ,必須
"field
with
newlines",string,true`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('field\nwith\nnewlines');
    }
  });

  it('should parse boolean values correctly', () => {
    const csv = `名前,タイプ,必須
test1,string,true
test2,string,yes
test3,string,1
test4,string,○
test5,string,false
test6,string,no
test7,string,0`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].required).toBe(true);
      expect(result.data[1].required).toBe(true);
      expect(result.data[2].required).toBe(true);
      expect(result.data[3].required).toBe(true);
      expect(result.data[4].required).toBe(false);
      expect(result.data[5].required).toBe(false);
      expect(result.data[6].required).toBe(false);
    }
  });

  it('should parse number values correctly', () => {
    const columnsWithNumber: Field[] = [
      { id: 'col-1', key: 'name', label: '名前', required: true, valueType: 'text' },
      { id: 'col-2', key: 'count', label: 'カウント', required: true, valueType: 'number' },
    ];

    const csv = `名前,カウント
test,42`;

    const result = importTableFromCsv(csv, columnsWithNumber);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].count).toBe(42);
    }
  });

  it('should parse enum values by value', () => {
    const columnsWithEnum: Field[] = [
      {
        id: 'col-1',
        key: 'status',
        label: 'ステータス',
        required: true,
        valueType: 'enum',
        options: [
          { value: 'active', label: '有効' },
          { value: 'inactive', label: '無効' },
        ],
      },
    ];

    const csv = `ステータス
active`;

    const result = importTableFromCsv(csv, columnsWithEnum);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].status).toBe('active');
    }
  });

  it('should parse enum values by label', () => {
    const columnsWithEnum: Field[] = [
      {
        id: 'col-1',
        key: 'status',
        label: 'ステータス',
        required: true,
        valueType: 'enum',
        options: [
          { value: 'active', label: '有効' },
          { value: 'inactive', label: '無効' },
        ],
      },
    ];

    const csv = `ステータス
有効`;

    const result = importTableFromCsv(csv, columnsWithEnum);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].status).toBe('active');
    }
  });

  it('should handle empty CSV', () => {
    const result = importTableFromCsv('', mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it('should handle CSV without data rows', () => {
    const csv = `名前,タイプ,必須`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(0);
    }
  });

  it('should skip empty lines', () => {
    const csv = `名前,タイプ,必須

user_id,string,true

email,string,false
`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
    }
  });

  it('should handle CSV without header when specified', () => {
    const csv = `user_id,string,true
email,string,false`;

    const result = importTableFromCsv(csv, mockColumns, { hasHeader: false });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
      expect(result.data[0].name).toBe('user_id');
    }
  });

  it('should handle Windows line endings (CRLF)', () => {
    const csv = '名前,タイプ,必須\r\nuser_id,string,true\r\nemail,string,false';

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
    }
  });

  it('should handle old Mac line endings (CR)', () => {
    const csv = '名前,タイプ,必須\ruser_id,string,true\remail,string,false';

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(2);
    }
  });

  it('should handle missing columns gracefully', () => {
    const csv = `名前
user_id`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('user_id');
      expect(result.data[0].type).toBeUndefined();
    }
  });

  it('should handle column order mismatch', () => {
    const csv = `タイプ,必須,名前
string,true,user_id`;

    const result = importTableFromCsv(csv, mockColumns);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].name).toBe('user_id');
      expect(result.data[0].type).toBe('string');
      expect(result.data[0].required).toBe(true);
    }
  });
});
