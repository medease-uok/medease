const REFILL_ELIGIBILITY_THRESHOLD = 2 / 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDurationToDays(duration) {
  if (!duration) return null;
  const lower = duration.toLowerCase().trim();
  if (lower === 'ongoing') return null;

  const match = lower.match(/^(\d+)\s*(day|week|month|year)s?$/);
  if (!match) return null;

  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case 'day': return num;
    case 'week': return num * 7;
    case 'month': return num * 30;
    case 'year': return num * 365;
    default: return null;
  }
}

function isRefillEligible(createdAt, duration) {
  const days = parseDurationToDays(duration);
  if (days === null) return true;

  const prescribed = new Date(createdAt).getTime();
  const threshold = prescribed + days * REFILL_ELIGIBILITY_THRESHOLD * MS_PER_DAY;
  return Date.now() >= threshold;
}

module.exports = { parseDurationToDays, isRefillEligible, REFILL_ELIGIBILITY_THRESHOLD };
