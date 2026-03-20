const { parseDurationToDays, isRefillEligible, REFILL_ELIGIBILITY_THRESHOLD } = require('../../utils/refillEligibility');

describe('parseDurationToDays', () => {
  test('returns null for null/undefined', () => {
    expect(parseDurationToDays(null)).toBeNull();
    expect(parseDurationToDays(undefined)).toBeNull();
    expect(parseDurationToDays('')).toBeNull();
  });

  test('returns null for "ongoing"', () => {
    expect(parseDurationToDays('ongoing')).toBeNull();
    expect(parseDurationToDays('Ongoing')).toBeNull();
    expect(parseDurationToDays('ONGOING')).toBeNull();
  });

  test('parses days', () => {
    expect(parseDurationToDays('7 days')).toBe(7);
    expect(parseDurationToDays('1 day')).toBe(1);
    expect(parseDurationToDays('30 days')).toBe(30);
  });

  test('parses weeks', () => {
    expect(parseDurationToDays('2 weeks')).toBe(14);
    expect(parseDurationToDays('1 week')).toBe(7);
    expect(parseDurationToDays('4 weeks')).toBe(28);
  });

  test('parses months', () => {
    expect(parseDurationToDays('1 month')).toBe(30);
    expect(parseDurationToDays('3 months')).toBe(90);
    expect(parseDurationToDays('6 months')).toBe(180);
  });

  test('parses years', () => {
    expect(parseDurationToDays('1 year')).toBe(365);
    expect(parseDurationToDays('2 years')).toBe(730);
  });

  test('returns null for unrecognized format', () => {
    expect(parseDurationToDays('two weeks')).toBeNull();
    expect(parseDurationToDays('forever')).toBeNull();
    expect(parseDurationToDays('14')).toBeNull();
  });

  test('handles extra whitespace', () => {
    expect(parseDurationToDays('  7 days  ')).toBe(7);
  });
});

describe('isRefillEligible', () => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  test('returns true when duration is null (ongoing)', () => {
    expect(isRefillEligible(new Date().toISOString(), null)).toBe(true);
  });

  test('returns true when duration is "ongoing"', () => {
    expect(isRefillEligible(new Date().toISOString(), 'ongoing')).toBe(true);
  });

  test('returns false for a prescription created just now with 30-day duration', () => {
    const createdAt = new Date().toISOString();
    expect(isRefillEligible(createdAt, '30 days')).toBe(false);
  });

  test('returns true when past the 2/3 threshold', () => {
    const days = 30;
    const threshold = days * REFILL_ELIGIBILITY_THRESHOLD;
    const createdAt = new Date(Date.now() - (threshold + 1) * MS_PER_DAY).toISOString();
    expect(isRefillEligible(createdAt, '30 days')).toBe(true);
  });

  test('returns false just before the 2/3 threshold', () => {
    const days = 30;
    const threshold = days * REFILL_ELIGIBILITY_THRESHOLD;
    // Just before threshold (subtract 1 hour to avoid edge cases)
    const createdAt = new Date(Date.now() - (threshold - 0.1) * MS_PER_DAY).toISOString();
    expect(isRefillEligible(createdAt, '30 days')).toBe(false);
  });

  test('threshold is 2/3', () => {
    expect(REFILL_ELIGIBILITY_THRESHOLD).toBeCloseTo(2 / 3);
  });

  test('returns true for very old prescriptions', () => {
    const oldDate = new Date('2020-01-01').toISOString();
    expect(isRefillEligible(oldDate, '7 days')).toBe(true);
  });

  test('works with week duration', () => {
    const days = 7; // 1 week
    const threshold = days * REFILL_ELIGIBILITY_THRESHOLD;
    const createdAt = new Date(Date.now() - (threshold + 1) * MS_PER_DAY).toISOString();
    expect(isRefillEligible(createdAt, '1 week')).toBe(true);
  });
});
