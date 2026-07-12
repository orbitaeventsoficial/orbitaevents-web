/**
 * Sanitization Utilities Tests
 * Security-critical: ensures XSS prevention works
 */

import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeEmail, truncate } from '@/lib/utils/sanitize';

describe('Sanitization Utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('"Hello" & \'World\'')).toBe('&quot;Hello&quot; &amp; &#039;World&#039;');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle null input', () => {
      expect(escapeHtml(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(escapeHtml(undefined)).toBe('');
    });

    it('should handle text without special chars', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should prevent XSS injection vectors', () => {
      const xssVectors = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
      ];

      xssVectors.forEach((vector) => {
        const escaped = escapeHtml(vector);
        expect(escaped).not.toContain('<img');
        expect(escaped).not.toContain('<svg');
        expect(escaped).not.toContain('<iframe');
      });
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize valid emails', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(sanitizeEmail('user.name@domain.co.uk')).toBe('user.name@domain.co.uk');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('should lowercase emails', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
    });

    it('should handle input without validation', () => {
      // Note: sanitizeEmail only trims and lowercases, doesn't validate
      expect(sanitizeEmail('not-an-email')).toBe('not-an-email');
      expect(sanitizeEmail('missing@')).toBe('missing@');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      // 20 - 3 (suffix length) = 17 chars + "..."
      expect(truncate(longText, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      expect(truncate('Short', 100)).toBe('Short');
    });

    it('should use custom suffix', () => {
      expect(truncate('Hello World', 6, '…')).toBe('Hello…');
    });

    it('should handle edge cases', () => {
      expect(truncate('', 10)).toBe('');
      expect(truncate('Hi', 2)).toBe('Hi');
    });
  });
});
