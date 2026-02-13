/**
 * API Module Tests
 */

import { APIError, queryKeys } from '@/lib/queries';

describe('Query Keys', () => {
  it('has correct applications key', () => {
    expect(queryKeys.applications).toEqual(['applications']);
  });

  it('generates application key with id', () => {
    expect(queryKeys.application(1)).toEqual(['applications', 1]);
    expect(queryKeys.application(42)).toEqual(['applications', 42]);
  });

  it('has correct stats key', () => {
    expect(queryKeys.applicationStats).toEqual(['applications', 'stats']);
  });

  it('has correct resumes key', () => {
    expect(queryKeys.resumes).toEqual(['resumes']);
  });

  it('has correct templates key', () => {
    expect(queryKeys.templates).toEqual(['templates']);
  });

  it('generates template key with id', () => {
    expect(queryKeys.template(5)).toEqual(['templates', 5]);
  });

  it('has correct warming keys', () => {
    expect(queryKeys.warmingConfig).toEqual(['warming', 'config']);
    expect(queryKeys.warmingProgress).toEqual(['warming', 'progress']);
    expect(queryKeys.warmingPresets).toEqual(['warming', 'presets']);
  });

  it('has correct rate limit keys', () => {
    expect(queryKeys.rateLimitConfig).toEqual(['rate-limits', 'config']);
    expect(queryKeys.rateLimitUsage).toEqual(['rate-limits', 'usage']);
  });

  it('has correct notification keys', () => {
    expect(queryKeys.notifications).toEqual(['notifications']);
    expect(queryKeys.unreadCount).toEqual(['notifications', 'unread']);
  });
});

describe('Query Key Structure', () => {
  it('all keys are arrays', () => {
    Object.values(queryKeys).forEach((key) => {
      if (typeof key === 'function') {
        // Test with a sample value
        expect(Array.isArray(key(1))).toBe(true);
      } else {
        expect(Array.isArray(key)).toBe(true);
      }
    });
  });

  it('nested keys start with parent key', () => {
    expect(queryKeys.application(1)[0]).toBe('applications');
    expect(queryKeys.applicationHistory(1)[0]).toBe('applications');
    expect(queryKeys.applicationNotes(1)[0]).toBe('applications');
  });
});
