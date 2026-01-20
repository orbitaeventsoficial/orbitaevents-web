/**
 * Authentication Utilities Tests
 * Security-critical: ensures auth protection works correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('Auth Utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('ADMIN_USER', 'testadmin');
    vi.stubEnv('ADMIN_PASS', 'testpassword123');
    vi.stubEnv('ADMIN_KEY', 'test-api-key-123');
    vi.stubEnv('CSRF_SECRET', 'test-csrf-secret-at-least-32-characters-long');
  });

  describe('verifyBasicAuth', () => {
    it('should authenticate valid Basic auth credentials', async () => {
      const { verifyBasicAuth } = await import('@/lib/auth');

      const credentials = Buffer.from('testadmin:testpassword123').toString('base64');
      const mockRequest = {
        headers: {
          get: (name: string) =>
            name === 'authorization' ? `Basic ${credentials}` : null,
        },
      } as unknown as NextRequest;

      const result = verifyBasicAuth(mockRequest);
      expect(result.authenticated).toBe(true);
      expect(result.user).toBe('testadmin');
      expect(result.method).toBe('basic');
    });

    it('should reject invalid credentials', async () => {
      const { verifyBasicAuth } = await import('@/lib/auth');

      const credentials = Buffer.from('wronguser:wrongpass').toString('base64');
      const mockRequest = {
        headers: {
          get: (name: string) =>
            name === 'authorization' ? `Basic ${credentials}` : null,
        },
      } as unknown as NextRequest;

      const result = verifyBasicAuth(mockRequest);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should reject missing authorization header', async () => {
      const { verifyBasicAuth } = await import('@/lib/auth');

      const mockRequest = {
        headers: {
          get: () => null,
        },
      } as unknown as NextRequest;

      const result = verifyBasicAuth(mockRequest);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('No authorization header');
    });
  });

  describe('verifyBearerAuth', () => {
    it('should authenticate valid Bearer token', async () => {
      const { verifyBearerAuth } = await import('@/lib/auth');

      const mockRequest = {
        headers: {
          get: (name: string) =>
            name === 'authorization' ? 'Bearer test-api-key-123' : null,
        },
      } as unknown as NextRequest;

      const result = verifyBearerAuth(mockRequest);
      expect(result.authenticated).toBe(true);
      expect(result.method).toBe('bearer');
    });

    it('should reject invalid Bearer token', async () => {
      const { verifyBearerAuth } = await import('@/lib/auth');

      const mockRequest = {
        headers: {
          get: (name: string) =>
            name === 'authorization' ? 'Bearer wrong-token' : null,
        },
      } as unknown as NextRequest;

      const result = verifyBearerAuth(mockRequest);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const { getClientIP } = await import('@/lib/auth');

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          },
        },
      } as unknown as NextRequest;

      expect(getClientIP(mockRequest)).toBe('192.168.1.1');
    });

    it('should fallback to x-real-ip', async () => {
      const { getClientIP } = await import('@/lib/auth');

      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '10.0.0.5';
            return null;
          },
        },
      } as unknown as NextRequest;

      expect(getClientIP(mockRequest)).toBe('10.0.0.5');
    });

    it('should return unknown when no IP found', async () => {
      const { getClientIP } = await import('@/lib/auth');

      const mockRequest = {
        headers: {
          get: () => null,
        },
      } as unknown as NextRequest;

      expect(getClientIP(mockRequest)).toBe('unknown');
    });
  });
});
