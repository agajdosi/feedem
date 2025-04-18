import { describe, it, expect } from 'vitest';
import { getLimit, getAvgEngagement } from './utils';

describe('getLimit', () => {
  it('should return 0 for 0 tasks', () => {
    expect(getLimit(0)).toBe(0);
  });

  it('should return approximately 100 for 20 tasks', () => {
    const result = getLimit(20);
    expect(result).toBeGreaterThan(99);
    expect(result).toBeLessThan(101);
  });

  it('should approach 200 as tasks increase', () => {
    const result = getLimit(1000);
    expect(result).toBeGreaterThan(195);
    expect(result).toBeLessThan(200);
  });

  it('should increase monotonically with more tasks', () => {
    const result1 = getLimit(10);
    const result2 = getLimit(20);
    const result3 = getLimit(30);
    expect(result1).toBeLessThan(result2);
    expect(result2).toBeLessThan(result3);
  });
});

describe('getAvgEngagement', () => {
  it('should return 200 when there are no views', () => {
    expect(getAvgEngagement(0, 10, 5)).toBe(200);
  });

  it('should return 0 when there are views but no engagement', () => {
    expect(getAvgEngagement(100, 0, 0)).toBe(0);
  });

  it('should calculate correct average engagement with both comments and reactions', () => {
    // 100 * (10 + 20) / 100 = 30
    expect(getAvgEngagement(100, 10, 20)).toBe(30);
  });

  it('should handle only comments', () => {
    // 100 * (15 + 0) / 50 = 30
    expect(getAvgEngagement(50, 15, 0)).toBe(30);
  });

  it('should handle only reactions', () => {
    // 100 * (0 + 25) / 50 = 50
    expect(getAvgEngagement(50, 0, 25)).toBe(50);
  });

  it('should handle decimal results', () => {
    // 100 * (3 + 2) / 4 = 125
    expect(getAvgEngagement(4, 3, 2)).toBe(125);
  });
}); 