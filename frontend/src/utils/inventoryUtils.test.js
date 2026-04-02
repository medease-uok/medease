import { parseLocalDate, getExpiryStatus } from './inventoryUtils';

describe('inventoryUtils', () => {
  describe('parseLocalDate', () => {
    it('should correctly parse a date string', () => {
      const dateStr = "2025-01-15";
      const date = parseLocalDate(dateStr);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // 0-indexed month
      expect(date.getDate()).toBe(15);
    });

    it('should ignore time components', () => {
      const dateStr = "2025-01-15T12:00:00Z";
      const date = parseLocalDate(dateStr);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });
  });

  describe('getExpiryStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns normal if no expiryDate', () => {
      expect(getExpiryStatus(null)).toEqual({ status: 'normal', daysRemaining: null });
    });

    it('returns danger when past expiry', () => {
      expect(getExpiryStatus('2025-01-14')).toEqual({ status: 'danger', daysRemaining: -1 });
    });

    it('returns critical when expires today', () => {
      expect(getExpiryStatus('2025-01-15')).toEqual({ status: 'critical', daysRemaining: 0 });
    });

    it('returns warning when expiring soon within threshold', () => {
      expect(getExpiryStatus('2025-01-25')).toEqual({ status: 'warning', daysRemaining: 10 });
      expect(getExpiryStatus('2025-02-14')).toEqual({ status: 'warning', daysRemaining: 30 });
    });

    it('returns normal when well in the future', () => {
      expect(getExpiryStatus('2025-02-15')).toEqual({ status: 'normal', daysRemaining: 31 });
    });
  });
});
