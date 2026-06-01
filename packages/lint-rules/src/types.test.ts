import { describe, it, expect } from 'vitest';
import { isReferenceValue, type ReferenceValue } from './types';

describe('isReferenceValue', () => {
  it('should return true for valid reference value', () => {
    const ref: ReferenceValue = {
      type: 'reference',
      referenceType: 'screen-field',
      targetDocumentId: 'doc-1',
      targetKey: 'field-1',
      displayValue: 'User Name',
    };

    expect(isReferenceValue(ref)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isReferenceValue(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isReferenceValue(undefined)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(isReferenceValue('string')).toBe(false);
    expect(isReferenceValue(123)).toBe(false);
    expect(isReferenceValue(true)).toBe(false);
  });

  it('should return false for object without type property', () => {
    expect(
      isReferenceValue({
        referenceType: 'screen-field',
        targetDocumentId: 'doc-1',
        targetKey: 'field-1',
        displayValue: 'User Name',
      })
    ).toBe(false);
  });

  it('should return false for object with wrong type value', () => {
    expect(
      isReferenceValue({
        type: 'not-reference',
        referenceType: 'screen-field',
        targetDocumentId: 'doc-1',
        targetKey: 'field-1',
        displayValue: 'User Name',
      })
    ).toBe(false);
  });

  it('should return false for object missing required properties', () => {
    expect(
      isReferenceValue({
        type: 'reference',
        referenceType: 'screen-field',
        // missing targetDocumentId, targetKey, displayValue
      })
    ).toBe(false);
  });

  it('should return false for object with non-string required properties', () => {
    expect(
      isReferenceValue({
        type: 'reference',
        referenceType: 123,
        targetDocumentId: 'doc-1',
        targetKey: 'field-1',
        displayValue: 'User Name',
      })
    ).toBe(false);
  });
});
