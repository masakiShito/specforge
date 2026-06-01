import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, unwrap, unwrapOr, map, mapErr, andThen } from './result';

describe('Result utilities', () => {
  describe('ok', () => {
    it('should create a successful result', () => {
      const result = ok(42);

      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should work with complex values', () => {
      const value = { name: 'test', items: [1, 2, 3] };
      const result = ok(value);

      expect(result.ok).toBe(true);
      expect(result.value).toBe(value);
    });
  });

  describe('err', () => {
    it('should create a failed result', () => {
      const result = err('Something went wrong');

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    it('should work with error objects', () => {
      const error = { code: 'NOT_FOUND', message: 'Resource not found' };
      const result = err(error);

      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe('isOk', () => {
    it('should return true for Ok results', () => {
      expect(isOk(ok(42))).toBe(true);
    });

    it('should return false for Err results', () => {
      expect(isOk(err('error'))).toBe(false);
    });
  });

  describe('isErr', () => {
    it('should return true for Err results', () => {
      expect(isErr(err('error'))).toBe(true);
    });

    it('should return false for Ok results', () => {
      expect(isErr(ok(42))).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('should return value for Ok results', () => {
      expect(unwrap(ok(42))).toBe(42);
    });

    it('should throw for Err results', () => {
      expect(() => unwrap(err('error'))).toThrow();
    });
  });

  describe('unwrapOr', () => {
    it('should return value for Ok results', () => {
      expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('should return default value for Err results', () => {
      expect(unwrapOr(err('error'), 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('should transform Ok values', () => {
      const result = map(ok(5), (x) => x * 2);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(10);
      }
    });

    it('should pass through Err values', () => {
      const result = map(err('error'), (x: number) => x * 2);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('error');
      }
    });
  });

  describe('mapErr', () => {
    it('should pass through Ok values', () => {
      const result = mapErr(ok(42), (e: string) => `Wrapped: ${e}`);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should transform Err values', () => {
      const result = mapErr(err('error'), (e) => `Wrapped: ${e}`);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Wrapped: error');
      }
    });
  });

  describe('andThen', () => {
    it('should chain Ok results', () => {
      const result = andThen(ok(5), (x) => ok(x * 2));

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(10);
      }
    });

    it('should short-circuit on Err', () => {
      const result = andThen(err('error'), (x: number) => ok(x * 2));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('error');
      }
    });

    it('should propagate errors from chained function', () => {
      const result = andThen(ok(5), (x) => (x > 10 ? ok(x) : err('Too small')));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Too small');
      }
    });
  });
});
