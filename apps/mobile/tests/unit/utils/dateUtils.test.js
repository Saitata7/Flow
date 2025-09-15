import { formatDate, getToday, getYesterday, getTomorrow, isToday, isYesterday, isTomorrow, formatTime, getDateRange } from '../../../src/utils/dateUtils';

describe('Date Utils', () => {
  beforeEach(() => {
    // Mock current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/15/2024');
    });
  });

  describe('getToday', () => {
    it('should return today\'s date', () => {
      const today = getToday();
      expect(today).toBe('2024-01-15');
    });
  });

  describe('getYesterday', () => {
    it('should return yesterday\'s date', () => {
      const yesterday = getYesterday();
      expect(yesterday).toBe('2024-01-14');
    });
  });

  describe('getTomorrow', () => {
    it('should return tomorrow\'s date', () => {
      const tomorrow = getTomorrow();
      expect(tomorrow).toBe('2024-01-16');
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s date', () => {
      const today = new Date('2024-01-15T10:30:00Z');
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday\'s date', () => {
      const yesterday = new Date('2024-01-14T10:30:00Z');
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow\'s date', () => {
      const tomorrow = new Date('2024-01-16T10:30:00Z');
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday\'s date', () => {
      const yesterday = new Date('2024-01-14T10:30:00Z');
      expect(isYesterday(yesterday)).toBe(true);
    });

    it('should return false for today\'s date', () => {
      const today = new Date('2024-01-15T10:30:00Z');
      expect(isYesterday(today)).toBe(false);
    });
  });

  describe('isTomorrow', () => {
    it('should return true for tomorrow\'s date', () => {
      const tomorrow = new Date('2024-01-16T10:30:00Z');
      expect(isTomorrow(tomorrow)).toBe(true);
    });

    it('should return false for today\'s date', () => {
      const today = new Date('2024-01-15T10:30:00Z');
      expect(isTomorrow(today)).toBe(false);
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      expect(formatTime(date)).toBe('2:30 PM');
    });

    it('should format time with 24-hour format', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      expect(formatTime(date, '24')).toBe('14:30');
    });
  });

  describe('getDateRange', () => {
    it('should return date range for last 7 days', () => {
      const range = getDateRange(7);
      expect(range).toHaveLength(7);
      expect(range[0]).toBe('2024-01-09');
      expect(range[6]).toBe('2024-01-15');
    });

    it('should return date range for last 30 days', () => {
      const range = getDateRange(30);
      expect(range).toHaveLength(30);
      expect(range[0]).toBe('2023-12-17');
      expect(range[29]).toBe('2024-01-15');
    });

    it('should return date range for last 365 days', () => {
      const range = getDateRange(365);
      expect(range).toHaveLength(365);
      expect(range[0]).toBe('2023-01-16');
      expect(range[364]).toBe('2024-01-15');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid dates', () => {
      expect(() => formatDate('invalid')).not.toThrow();
    });

    it('should handle null dates', () => {
      expect(() => formatDate(null)).not.toThrow();
    });

    it('should handle undefined dates', () => {
      expect(() => formatDate(undefined)).not.toThrow();
    });
  });
});
