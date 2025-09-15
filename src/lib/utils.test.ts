import { describe, it, expect } from 'vitest';
import { formatDateToDDMMYY, parseDateFromDDMMYY } from './utils';

describe('date utils', () => {
  it('formats ISO date to DD/MM/YY', () => {
    expect(formatDateToDDMMYY('2025-01-30')).toBe('30/01/25');
  });

  it('parses DD/MM/YY to ISO date', () => {
    expect(parseDateFromDDMMYY('30/01/25')).toBe('2025-01-30');
  });
});
