/**
 * General Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { cn, safeParseInt } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (classNames merger)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
    });

    it('should handle undefined and null', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('safeParseInt', () => {
    it('should parse valid integers', () => {
      expect(safeParseInt('42')).toBe(42);
      expect(safeParseInt('0')).toBe(0);
      expect(safeParseInt('-10')).toBe(-10);
    });

    it('should return default for invalid input', () => {
      expect(safeParseInt('abc', 10)).toBe(10);
      expect(safeParseInt('', 5)).toBe(5);
      expect(safeParseInt(null, 0)).toBe(0);
      expect(safeParseInt(undefined, 100)).toBe(100);
    });

    it('should respect min and max bounds', () => {
      expect(safeParseInt('5', 0, 1, 10)).toBe(5);
      expect(safeParseInt('0', 5, 1, 10)).toBe(1); // Below min, return min
      expect(safeParseInt('100', 5, 1, 10)).toBe(10); // Above max, return max
    });
  });
});
