import type { ValidationItem } from "../types/validation";

export interface QualityScoreResult {
  score: number;
  status: "good" | "caution" | "needs-improvement";
  statusLabel: string;
}

const PENALTY = {
  error: 20,
  warning: 5,
  info: 0,
} as const;

export function calculateQualityScore(items: ValidationItem[]): QualityScoreResult {
  let deduction = 0;

  for (const item of items) {
    deduction += PENALTY[item.severity];
  }

  const score = Math.max(0, 100 - deduction);

  let status: QualityScoreResult["status"];
  let statusLabel: string;

  if (score >= 90) {
    status = "good";
    statusLabel = "良好";
  } else if (score >= 70) {
    status = "caution";
    statusLabel = "注意";
  } else {
    status = "needs-improvement";
    statusLabel = "要改善";
  }

  return { score, status, statusLabel };
}
