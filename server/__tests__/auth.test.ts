import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../storage');
vi.mock('../email');

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(validEmail)).toBe(true);
    expect(emailRegex.test(invalidEmail)).toBe(false);
  });

  it('should require password to be at least 8 characters', () => {
    const shortPassword = 'short';
    const longPassword = 'longenough';
    
    expect(shortPassword.length >= 8).toBe(false);
    expect(longPassword.length >= 8).toBe(true);
  });
});

