/**
 * Performance Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle, preloadImage, isSlowConnection } from '@/lib/performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should call function after wait time', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('first');
      vi.advanceTimersByTime(250);

      debouncedFn('second');
      vi.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledWith('second');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should call function immediately on first call', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 1000);

      throttledFn('test');
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should ignore subsequent calls within limit', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 1000);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');
    });

    it('should allow call after limit expires', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 1000);

      throttledFn('first');
      vi.advanceTimersByTime(1000);
      throttledFn('second');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('preloadImage', () => {
    it('should resolve when image loads', async () => {
      const mockImage = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      const promise = preloadImage('/test.jpg');

      // Simulate image load
      setTimeout(() => mockImage.onload?.(), 0);

      await expect(promise).resolves.toBeUndefined();
      expect(mockImage.src).toBe('/test.jpg');
    });

    it('should reject when image fails to load', async () => {
      const mockImage = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      vi.stubGlobal('Image', vi.fn(() => mockImage));

      const promise = preloadImage('/invalid.jpg');

      // Simulate image error
      setTimeout(() => mockImage.onerror?.(new Error('Failed')), 0);

      await expect(promise).rejects.toThrow();
    });
  });

  describe('isSlowConnection', () => {
    it('should return false when connection API not available', () => {
      expect(isSlowConnection()).toBe(false);
    });

    it('should detect slow 2g connection', () => {
      const mockNavigator = {
        connection: {
          effectiveType: '2g',
          saveData: false,
        },
      };

      vi.stubGlobal('navigator', mockNavigator);
      expect(isSlowConnection()).toBe(true);
    });

    it('should detect saveData mode', () => {
      const mockNavigator = {
        connection: {
          effectiveType: '4g',
          saveData: true,
        },
      };

      vi.stubGlobal('navigator', mockNavigator);
      expect(isSlowConnection()).toBe(true);
    });

    it('should return false for fast connection', () => {
      const mockNavigator = {
        connection: {
          effectiveType: '4g',
          saveData: false,
        },
      };

      vi.stubGlobal('navigator', mockNavigator);
      expect(isSlowConnection()).toBe(false);
    });
  });
});
