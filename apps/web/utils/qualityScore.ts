import type { ValidationItem } from "../types/validation";
import {
  QUALITY_SCORE_PENALTIES,
  QUALITY_SCORE_CATEGORY_CAPS,
  QUALITY_SCORE_THRESHOLDS,
  QUALITY_STATUS_LABELS,
} from "../constants/validation";

export interface QualityScoreResult {
  score: number;
  status: "good" | "caution" | "needs-improvement";
  statusLabel: string;
}

/**
 * Extract category from issue ID.
 * Issue IDs are formatted like "duplicate-fieldKey-0", "required-name-1", etc.
 */
function extractCategory(issueId: string): string {
  // Check for known category prefixes
  const knownPrefixes = Object.keys(QUALITY_SCORE_CATEGORY_CAPS).filter(
    (key) => key !== "default"
  );

  for (const prefix of knownPrefixes) {
    if (issueId.startsWith(prefix)) {
      return prefix;
    }
  }

  return "default";
}

/**
 * Calculate quality score based on validation items.
 *
 * Score starts at 100 and is reduced based on issue severity.
 * Deductions are capped per category to prevent score from dropping too quickly.
 *
 * Penalty per issue:
 * - Error: -10 points
 * - Warning: -3 points
 * - Info: 0 points
 *
 * Category caps prevent excessive deduction from a single type of issue.
 * Score cannot go below 0.
 */
export function calculateQualityScore(items: ValidationItem[]): QualityScoreResult {
  // Group items by category and calculate raw deductions
  const categoryDeductions = new Map<string, number>();

  for (const item of items) {
    const category = extractCategory(item.id);
    const penalty = QUALITY_SCORE_PENALTIES[item.severity];
    const currentDeduction = categoryDeductions.get(category) || 0;
    categoryDeductions.set(category, currentDeduction + penalty);
  }

  // Apply category caps and sum total deduction
  let totalDeduction = 0;
  for (const [category, rawDeduction] of categoryDeductions) {
    const cap =
      QUALITY_SCORE_CATEGORY_CAPS[
        category as keyof typeof QUALITY_SCORE_CATEGORY_CAPS
      ] || QUALITY_SCORE_CATEGORY_CAPS.default;
    const cappedDeduction = Math.min(rawDeduction, cap);
    totalDeduction += cappedDeduction;
  }

  const score = Math.max(0, 100 - totalDeduction);

  let status: QualityScoreResult["status"];
  let statusLabel: string;

  if (score >= QUALITY_SCORE_THRESHOLDS.good) {
    status = "good";
    statusLabel = QUALITY_STATUS_LABELS.good;
  } else if (score >= QUALITY_SCORE_THRESHOLDS.caution) {
    status = "caution";
    statusLabel = QUALITY_STATUS_LABELS.caution;
  } else {
    status = "needs-improvement";
    statusLabel = QUALITY_STATUS_LABELS["needs-improvement"];
  }

  return { score, status, statusLabel };
}
