import { describe, it, expect } from "vitest";
import { calculateQualityScore } from "./qualityScore";
import type { ValidationItem } from "../types/validation";

function createValidationItem(
  overrides: Partial<ValidationItem> = {}
): ValidationItem {
  return {
    id: "test-item",
    severity: "warning",
    sectionId: "section-1",
    sectionTitle: "Test Section",
    fieldId: "field-1",
    fieldLabel: "Test Field",
    message: "Test message",
    ...overrides,
  };
}

describe("calculateQualityScore", () => {
  describe("score calculation", () => {
    it("should return 100 when there are no validation items", () => {
      const result = calculateQualityScore([]);

      expect(result.score).toBe(100);
      expect(result.status).toBe("good");
      expect(result.statusLabel).toBe("良好");
    });

    it("should deduct 20 points per error", () => {
      const items = [
        createValidationItem({ id: "error-1", severity: "error" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(80);
    });

    it("should deduct 5 points per warning", () => {
      const items = [
        createValidationItem({ id: "warning-1", severity: "warning" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(95);
    });

    it("should not deduct points for info items", () => {
      const items = [createValidationItem({ id: "info-1", severity: "info" })];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(100);
    });

    it("should combine deductions correctly", () => {
      const items = [
        createValidationItem({ id: "error-1", severity: "error" }),
        createValidationItem({ id: "warning-1", severity: "warning" }),
        createValidationItem({ id: "info-1", severity: "info" }),
      ];

      const result = calculateQualityScore(items);

      // 100 - 20 (error) - 5 (warning) - 0 (info) = 75
      expect(result.score).toBe(75);
    });

    it("should not go below 0", () => {
      const items = [
        createValidationItem({ id: "error-1", severity: "error" }),
        createValidationItem({ id: "error-2", severity: "error" }),
        createValidationItem({ id: "error-3", severity: "error" }),
        createValidationItem({ id: "error-4", severity: "error" }),
        createValidationItem({ id: "error-5", severity: "error" }),
        createValidationItem({ id: "error-6", severity: "error" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(0);
    });
  });

  describe("status determination", () => {
    it("should return 'good' status for score >= 90", () => {
      const items = [
        createValidationItem({ id: "warning-1", severity: "warning" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(95);
      expect(result.status).toBe("good");
      expect(result.statusLabel).toBe("良好");
    });

    it("should return 'good' status for exactly 90", () => {
      const items = [
        createValidationItem({ id: "warning-1", severity: "warning" }),
        createValidationItem({ id: "warning-2", severity: "warning" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(90);
      expect(result.status).toBe("good");
    });

    it("should return 'caution' status for score >= 70 and < 90", () => {
      const items = [
        createValidationItem({ id: "error-1", severity: "error" }),
        createValidationItem({ id: "warning-1", severity: "warning" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(75);
      expect(result.status).toBe("caution");
      expect(result.statusLabel).toBe("注意");
    });

    it("should return 'caution' status for exactly 70", () => {
      const items = [
        createValidationItem({ id: "error-1", severity: "error" }),
        createValidationItem({ id: "warning-1", severity: "warning" }),
        createValidationItem({ id: "warning-2", severity: "warning" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(70);
      expect(result.status).toBe("caution");
    });

    it("should return 'needs-improvement' status for score < 70", () => {
      const items = [
        createValidationItem({ id: "error-1", severity: "error" }),
        createValidationItem({ id: "error-2", severity: "error" }),
      ];

      const result = calculateQualityScore(items);

      expect(result.score).toBe(60);
      expect(result.status).toBe("needs-improvement");
      expect(result.statusLabel).toBe("要改善");
    });
  });
});
