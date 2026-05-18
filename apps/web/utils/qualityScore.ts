import type { ValidationItem } from "../types/validation";
import {
  QUALITY_SCORE_PENALTIES,
  QUALITY_SCORE_THRESHOLDS,
  QUALITY_STATUS_LABELS,
} from "../constants/validation";

export interface QualityScoreResult {
  score: number;
  status: "good" | "caution" | "needs-improvement";
  statusLabel: string;
}

/**
 * Calculate quality score based on validation items.
 *
 * Score starts at 100 and is reduced based on issue severity:
 * - Error: -20 points
 * - Warning: -5 points
 * - Info: 0 points
 *
 * Score cannot go below 0.
 */
export function calculateQualityScore(items: ValidationItem[]): QualityScoreResult {
  let deduction = 0;

  for (const item of items) {
    deduction += QUALITY_SCORE_PENALTIES[item.severity];
  }

  const score = Math.max(0, 100 - deduction);

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
