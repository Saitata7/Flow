import { formatDisplayDate, getCurrentWeek, isToday, isSameDay, addDays, subtractDays, calculateStreak, getStreakColor, getDateRange } from '../../../src/utils/dateUtils';

describe('Date Utils', () => {
  beforeEach(() => {
    // Mock current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatDisplayDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDisplayDate(date)).toBe('Mon 15');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDisplayDate(date, 'MM/DD/YYYY')).toBe('01/15/2024');
    });
  });

  describe('getCurrentWeek', () => {
    it('should return current week', () => {
      const week = getCurrentWeek();
      expect(week).toHaveLength(7);
      expect(week[0]).toBe('Mon 15');
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

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15T10:30:00Z');
      const date2 = new Date('2024-01-15T14:30:00Z');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15T10:30:00Z');
      const date2 = new Date('2024-01-16T10:30:00Z');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = addDays(date, 1);
      expect(result.getDate()).toBe(16);
    });
  });

  describe('subtractDays', () => {
    it('should subtract days correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = subtractDays(date, 1);
      expect(result.getDate()).toBe(14);
    });
  });

  describe('calculateStreak', () => {
    it('should calculate streak correctly', () => {
      const completionDates = [
        new Date('2024-01-15'),
        new Date('2024-01-14'),
        new Date('2024-01-13')
      ];
      const streak = calculateStreak(completionDates);
      expect(streak).toBe(3);
    });
  });

  describe('getStreakColor', () => {
    it('should return correct color for streak', () => {
      expect(getStreakColor(0)).toBe('#FF6B6B');
      expect(getStreakColor(7)).toBe('#4ECDC4');
      expect(getStreakColor(30)).toBe('#45B7D1');
    });
  });

  describe('getDateRange', () => {
    it('should return date range between two dates', () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      const range = getDateRange(startDate, endDate);
      expect(range).toHaveLength(3);
      expect(range[0]).toEqual(startDate);
      expect(range[2]).toEqual(endDate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid dates', () => {
      expect(() => formatDisplayDate('invalid')).not.toThrow();
    });

    it('should handle null dates', () => {
      expect(() => formatDisplayDate(null)).not.toThrow();
    });

    it('should handle undefined dates', () => {
      expect(() => formatDisplayDate(undefined)).not.toThrow();
    });
  });
});

