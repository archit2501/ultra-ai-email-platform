/**
 * Utility Functions Tests
 */

import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('base');
    expect(result).toContain('active');
  });

  it('handles undefined values', () => {
    const result = cn('class1', undefined, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('merges Tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles array of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });
});

describe('Class name merging edge cases', () => {
  it('should handle boolean false', () => {
    const result = cn('base', false && 'hidden');
    expect(result).toBe('base');
  });

  it('should handle null', () => {
    const result = cn('base', null);
    expect(result).toBe('base');
  });

  it('should handle mixed types', () => {
    const result = cn('text-sm', { 'font-bold': true, 'text-red-500': false });
    expect(result).toContain('text-sm');
    expect(result).toContain('font-bold');
    expect(result).not.toContain('text-red-500');
  });
});
