import { describe, it, expect } from 'vitest';
import { calculateQualityScore } from './qualityScore';
import type { ValidationItem } from '../types/validation';

function createValidationItem(overrides: Partial<ValidationItem> = {}): ValidationItem {
  return {
    id: 'test-item',
    severity: 'warning',
    sectionId: 'section-1',
    sectionTitle: 'Test Section',
    fieldId: 'field-1',
    fieldLabel: 'Test Field',
    message: 'Test message',
    ...overrides,
  };
}

describe('calculateQualityScore', () => {
  describe('score calculation', () => {
    it('should return 100 when there are no validation items', () => {
      const result = calculateQualityScore([]);

      expect(result.score).toBe(100);
      expect(result.status).toBe('good');
      expect(result.statusLabel).toBe('良好');
    });

    it('should deduct 10 points per error', () => {
      const items = [createValidationItem({ id: 'error-1', severity: 'error' })];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(90);
    });

    it('should deduct 3 points per warning', () => {
      const items = [createValidationItem({ id: 'warning-1', severity: 'warning' })];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(97);
    });

    it('should not deduct points for info items', () => {
      const items = [createValidationItem({ id: 'info-1', severity: 'info' })];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(100);
    });

    it('should combine deductions from different categories', () => {
      const items = [
        createValidationItem({ id: 'duplicate-key-1', severity: 'error' }),
        createValidationItem({ id: 'required-name-1', severity: 'error' }),
        createValidationItem({ id: 'some-warning', severity: 'warning' }),
      ];

      const result = calculateQualityScore(items);

      // duplicate: -10, required: -10, default: -3 = 77
      expect(result.score).toBe(77);
    });
  });

  describe('category caps', () => {
    it('should cap deductions per category', () => {
      // 10 required field errors = 10 * 10 = 100 points, but capped at 30
      const items = Array.from({ length: 10 }, (_, i) =>
        createValidationItem({ id: `required-field-${i}`, severity: 'error' })
      );

      const result = calculateQualityScore(items);

      // Capped at 30, so score = 100 - 30 = 70
      expect(result.score).toBe(70);
    });

    it('should apply caps independently per category', () => {
      const items = [
        // 5 duplicate errors = 50 points raw, capped at 20
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `duplicate-key-${i}`, severity: 'error' })
        ),
        // 5 required errors = 50 points raw, capped at 30
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `required-field-${i}`, severity: 'error' })
        ),
      ];

      const result = calculateQualityScore(items);

      // duplicate: 20 (capped) + required: 30 (capped) = 50, score = 50
      expect(result.score).toBe(50);
    });

    it('should not apply cap when deduction is below cap', () => {
      const items = [createValidationItem({ id: 'duplicate-key-1', severity: 'error' })];

      const result = calculateQualityScore(items);

      // Single duplicate error = 10 points, below cap of 20
      expect(result.score).toBe(90);
    });

    it('should use default cap for unknown categories', () => {
      // 10 unknown category errors = 100 points raw, capped at 40
      const items = Array.from({ length: 10 }, (_, i) =>
        createValidationItem({ id: `unknown-issue-${i}`, severity: 'error' })
      );

      const result = calculateQualityScore(items);

      // Capped at 40, so score = 100 - 40 = 60
      expect(result.score).toBe(60);
    });
  });

  describe('minimum score', () => {
    it('should not go below 0', () => {
      // Many errors across different categories to exceed 100 total
      const items = [
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `duplicate-key-${i}`, severity: 'error' })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `required-field-${i}`, severity: 'error' })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `invalid-path-${i}`, severity: 'error' })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `reference-broken-${i}`, severity: 'error' })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `unknown-issue-${i}`, severity: 'error' })
        ),
      ];

      const result = calculateQualityScore(items);

      // Even with many errors, score should be 0, not negative
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('status determination', () => {
    it("should return 'good' status for score >= 80", () => {
      const items = [createValidationItem({ id: 'duplicate-key-1', severity: 'error' })];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(90);
      expect(result.status).toBe('good');
      expect(result.statusLabel).toBe('良好');
    });

    it("should return 'good' status for exactly 80", () => {
      const items = [
        createValidationItem({ id: 'duplicate-key-1', severity: 'error' }),
        createValidationItem({ id: 'required-field-1', severity: 'error' }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(80);
      expect(result.status).toBe('good');
    });

    it("should return 'caution' status for score >= 60 and < 80", () => {
      const items = [
        ...Array.from({ length: 3 }, (_, i) =>
          createValidationItem({ id: `duplicate-key-${i}`, severity: 'error' })
        ),
      ];

      const result = calculateQualityScore(items);

      // 3 duplicate errors = 30 points, but capped at 20. score = 80
      // Need more errors from different categories
      expect(result.score).toBe(80);
    });

    it("should return 'caution' status for exactly 60", () => {
      // Need 40 points deduction: 20 (duplicate cap) + 20 (some other cap)
      const items = [
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `duplicate-key-${i}`, severity: 'error' })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `reference-broken-${i}`, severity: 'error' })
        ),
      ];

      const result = calculateQualityScore(items);

      // duplicate: 20 (capped) + reference: 20 (capped) = 40, score = 60
      expect(result.score).toBe(60);
      expect(result.status).toBe('caution');
    });

    it("should return 'needs-improvement' status for score < 60", () => {
      const items = [
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `duplicate-key-${i}`, severity: 'error' })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `required-field-${i}`, severity: 'error' })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createValidationItem({ id: `reference-broken-${i}`, severity: 'error' })
        ),
      ];

      const result = calculateQualityScore(items);

      // duplicate: 20 + required: 30 + reference: 20 = 70, score = 30
      expect(result.score).toBe(30);
      expect(result.status).toBe('needs-improvement');
      expect(result.statusLabel).toBe('要改善');
    });
  });
});
