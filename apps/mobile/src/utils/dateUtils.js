// utils/dateUtils.js
import moment from 'moment';
import { memoize } from 'lodash';

// Comprehensive date/time utility system for Habit Tracker
// Optimized for calendar widget (e.g., "Wed 9", "Thu 10") and streak calculations
// Supports timezone consistency, localization, and performance
// Usage: import { getCurrentWeek, calculateStreak } from './dateUtils';

/**
 * Returns current week as array of formatted dates (e.g., ["Wed 9", "Thu 10", "Fri 11"])
 * @param {Date} [date=new Date()] - Reference date
 * @returns {string[]} - Array of formatted week days
 */
export const getCurrentWeek = memoize((date = new Date()) => {
  const start = moment(date).startOf('week');
  return Array.from({ length: 7 }, (_, i) => 
    moment(start).add(i, 'days').format('ddd D')
  );
});

/**
 * Returns array of dates between start and end
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Date[]}
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  let current = moment(startDate);
  while (current.isSameOrBefore(endDate)) {
    dates.push(current.toDate());
    current = current.add(1, 'day');
  }
  return dates;
};

/**
 * Formats date for display (e.g., "Wed 9")
 * @param {Date} date
 * @param {string} [format='ddd D']
 * @returns {string}
 */
export const formatDisplayDate = (date, format = 'ddd D') => moment(date).format(format);

/**
 * Checks if date is today
 * @param {Date} date
 * @returns {boolean}
 */
export const isToday = (date) => moment(date).isSame(moment(), 'day');

/**
 * Checks if two dates are the same day
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => moment(date1).isSame(date2, 'day');

/**
 * Adds days to date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export const addDays = (date, days) => moment(date).add(days, 'days').toDate();

/**
 * Subtracts days from date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export const subtractDays = (date, days) => moment(date).subtract(days, 'days').toDate();

/**
 * Calculates current streak count from completion dates
 * @param {string[]} completionDates - ISO date strings
 * @param {Date} [currentDate=new Date()]
 * @returns {number}
 */
export const calculateStreak = (completionDates, currentDate = new Date()) => {
  const sortedDates = completionDates.map(d => moment(d)).sort((a, b) => b - a);
  let streak = 0;
  let current = moment(currentDate).startOf('day');
  
  for (const date of sortedDates) {
    if (isSameDay(date, current)) {
      streak++;
      current = current.subtract(1, 'day');
    } else if (date.isBefore(current, 'day')) {
      break;
    }
  }
  return streak;
};

/**
 * Returns gradient color based on streak count
 * @param {number} streakCount
 * @returns {string}
 */
export const getStreakColor = (streakCount) => {
  if (streakCount >= 30) return '#FF3B30'; // Red for long streaks
  if (streakCount >= 10) return '#FF7A00';
  return '#FF9500'; // Orange default
};

// Additional date utilities (getStreakStartDate, getLongestStreak, etc.) implemented similarly