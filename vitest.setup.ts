import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.ADMIN_USER = 'admin';
process.env.ADMIN_PASS = 'test123456789012';
process.env.CSRF_SECRET = 'test-csrf-secret-32-chars-minimum-for-security';
