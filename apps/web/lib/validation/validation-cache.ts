import type { DocumentEditorState } from "../document-editor/create-document-state";

interface CacheEntry<T> {
  hash: string;
  result: T;
  timestamp: number;
}

/**
 * Simple hash function for creating cache keys
 * Uses a fast string hashing algorithm
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Create a hash for a document state
 * Used as cache key for validation results
 */
function hashDocumentState(state: DocumentEditorState): string {
  // Create a simplified representation for hashing
  const simplified = {
    docId: state.document.id,
    docVersion: state.document.version,
    fieldValues: state.fieldValues,
  };
  return hashString(JSON.stringify(simplified));
}

/**
 * Create a hash for multiple document states (project-level)
 */
function hashProjectStates(states: Record<string, DocumentEditorState>): string {
  const hashes = Object.entries(states)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, state]) => `${id}:${hashDocumentState(state)}`);
  return hashString(hashes.join("|"));
}

/**
 * LRU Cache implementation for validation results
 */
class ValidationCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly maxAge: number;

  constructor(maxSize = 50, maxAgeMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAgeMs;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.result;
  }

  set(key: string, result: T): void {
    // Remove oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      hash: key,
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Document-level validation cache (generic to avoid circular deps)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const documentValidationCache = new ValidationCache<any>(100);

// Project-level validation cache (generic to avoid circular deps)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const projectValidationCache = new ValidationCache<any>(20);

/**
 * Get cached document validation result or compute it
 */
export function getCachedDocumentValidation<T>(
  state: DocumentEditorState,
  compute: () => T
): T {
  const hash = hashDocumentState(state);
  const cached = documentValidationCache.get(hash) as T | undefined;

  if (cached) {
    return cached;
  }

  const result = compute();
  documentValidationCache.set(hash, result);
  return result;
}

/**
 * Get cached project validation result or compute it
 */
export function getCachedProjectValidation<T>(
  states: Record<string, DocumentEditorState>,
  compute: () => T
): T {
  const hash = hashProjectStates(states);
  const cached = projectValidationCache.get(hash) as T | undefined;

  if (cached) {
    return cached;
  }

  const result = compute();
  projectValidationCache.set(hash, result);
  return result;
}

/**
 * Clear all validation caches
 * Should be called when document schema changes
 */
export function clearValidationCaches(): void {
  documentValidationCache.clear();
  projectValidationCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getValidationCacheStats(): {
  documentCacheSize: number;
  projectCacheSize: number;
} {
  return {
    documentCacheSize: documentValidationCache.size,
    projectCacheSize: projectValidationCache.size,
  };
}
