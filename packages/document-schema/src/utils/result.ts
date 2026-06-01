/**
 * Result type for functional error handling.
 *
 * Provides a type-safe way to handle operations that may fail,
 * without relying on exceptions for control flow.
 */

/**
 * Represents a successful result containing a value.
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/**
 * Represents a failed result containing an error.
 */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * A Result is either Ok (success) or Err (failure).
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Create a successful result.
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Create a failed result.
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Check if a result is Ok.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/**
 * Check if a result is Err.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/**
 * Unwrap a result, throwing if it's an error.
 * Use only when you're certain the result is Ok.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Attempted to unwrap an Err: ${String(result.error)}`);
}

/**
 * Unwrap a result with a default value for errors.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

/**
 * Map over a successful result.
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/**
 * Map over a failed result's error.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

/**
 * Chain operations on results (flatMap).
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}
