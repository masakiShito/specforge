/**
 * Validation constants for SpecForge
 *
 * Centralized validation settings and scoring configuration.
 */

// ---------------------------------------------------------------------------
// Quality Score Configuration
// ---------------------------------------------------------------------------

/**
 * Penalty points deducted from quality score for each issue severity.
 */
export const QUALITY_SCORE_PENALTIES = {
  error: 20,
  warning: 5,
  info: 0,
} as const;

/**
 * Score thresholds for determining quality status.
 */
export const QUALITY_SCORE_THRESHOLDS = {
  good: 90,
  caution: 70,
} as const;

/**
 * Status labels for quality score display.
 */
export const QUALITY_STATUS_LABELS = {
  good: "良好",
  caution: "注意",
  "needs-improvement": "要改善",
} as const;

/**
 * Status colors for quality score display.
 */
export const QUALITY_STATUS_COLORS = {
  good: {
    color: "#22C55E",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  caution: {
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  "needs-improvement": {
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
} as const;

// ---------------------------------------------------------------------------
// Validation Rules Configuration
// ---------------------------------------------------------------------------

/**
 * Maximum length for visible condition text before showing info warning.
 */
export const MAX_VISIBLE_CONDITION_LENGTH = 120;

/**
 * Severity levels for validation issues.
 */
export const SEVERITY_LEVELS = {
  error: "error",
  warning: "warning",
  info: "info",
} as const;

export type SeverityLevel = keyof typeof SEVERITY_LEVELS;

// ---------------------------------------------------------------------------
// Reference Types Configuration
// ---------------------------------------------------------------------------

/**
 * Labels and colors for unconnected reference types.
 */
export const REFERENCE_TYPE_CONFIG = {
  "broken-ref": {
    label: "参照切れ",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  "orphan-api": {
    label: "未参照",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  "orphan-screen": {
    label: "未接続",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  "missing-event-target": {
    label: "対象不明",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  "missing-api-connection": {
    label: "API未接続",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
} as const;

export type ReferenceType = keyof typeof REFERENCE_TYPE_CONFIG;

// ---------------------------------------------------------------------------
// Document Kind Configuration
// ---------------------------------------------------------------------------

/**
 * Display configuration for document kinds.
 */
export const DOCUMENT_KIND_CONFIG = {
  "screen-spec": {
    label: "Screen",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  "api-spec": {
    label: "API",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  "er-spec": {
    label: "ER",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  "business-rule": {
    label: "Rule",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
} as const;

export type DocumentKindKey = keyof typeof DOCUMENT_KIND_CONFIG;
