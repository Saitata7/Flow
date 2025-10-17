// services/optimizedStatsService.js
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_CACHE_KEY = 'optimized_stats_cache';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Optimized Stats Service - Single source of truth for all statistics
 * 
 * This service provides a unified, optimized approach to calculating statistics
 * with proper caching, error handling, and data consistency.
 */
class OptimizedStatsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

  /**
   * Get comprehensive stats with intelligent caching
   * @param {Array} flows - Array of flow objects
   * @param {Object} options - Calculation options
   * @returns {Promise<Object>} Comprehensive stats object
   */
  async getStats(flows, options = {}) {
    const {
      timeframe = 'all',
      includeArchived = false,
      includeDeleted = false,
      forceRefresh = false
    } = options;

    // Create cache key
    const cacheKey = this.createCacheKey(flows, options);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      console.log('📊 OptimizedStats: Using cached stats');
      return this.cache.get(cacheKey);
    }

    console.log('📊 OptimizedStats: Calculating fresh stats...');
    
    try {
      // Filter flows based on options
      const filteredFlows = this.filterFlows(flows, { includeArchived, includeDeleted });
      
      if (filteredFlows.length === 0) {
        return this.getDefaultStats();
      }

      // Calculate all stats in one pass for efficiency
      const stats = this.calculateAllStats(filteredFlows, options);
      
      // Cache the results
      this.cache.set(cacheKey, stats);
      this.cacheTimestamps.set(cacheKey, Date.now());
      
      // Persist to AsyncStorage
      await this.persistCache();
      
      console.log('📊 OptimizedStats: Stats calculated and cached successfully');
      return stats;
      
    } catch (error) {
      console.error('📊 OptimizedStats: Error calculating stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Calculate all statistics in one efficient pass
   * @param {Array} flows - Filtered flows
   * @param {Object} options - Options
   * @returns {Object} Complete stats object
   */
  calculateAllStats(flows, options) {
    const { timeframe = 'all', currentMonth } = options;
    
    // Get date range
    const { startDate, endDate } = this.getDateRange(timeframe, currentMonth);
    
    // Initialize counters
    let totalFlows = flows.length;
    let totalCompleted = 0;
    let totalScheduled = 0;
    let totalPoints = 0;
    let totalStreakDays = 0;
    
    const flowSummaries = [];
    const dailyData = [];
    const heatMapData = [];
    
    // Process each flow
    flows.forEach(flow => {
      const flowStats = this.calculateFlowStats(flow, startDate, endDate);
      
      // Aggregate totals
      totalCompleted += flowStats.completed;
      totalScheduled += flowStats.scheduled;
      totalPoints += flowStats.points;
      totalStreakDays += flowStats.currentStreak;
      
      // Add to summaries
      flowSummaries.push({
        flowId: flow.id,
        flowTitle: flow.title,
        flowType: flow.trackingType || 'Binary',
        completed: flowStats.completed,
        partial: flowStats.partial,
        failed: flowStats.failed,
        skipped: flowStats.skipped,
        inactive: flowStats.inactive,
        currentStreak: flowStats.currentStreak,
        longestStreak: flowStats.longestStreak,
        completionRate: flowStats.completionRate,
        scheduledDays: flowStats.scheduled,
        points: flowStats.points,
        lastActivity: flowStats.lastActivity
      });
      
      // Add to daily data
      dailyData.push(...flowStats.dailyData);
      
      // Add to heat map data
      heatMapData.push(...flowStats.heatMapData);
    });

    // Calculate overall metrics
    const averageCompletionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
    const averageStreak = totalFlows > 0 ? Math.round(totalStreakDays / totalFlows) : 0;
    
    // Calculate success metrics
    const successMetrics = this.calculateSuccessMetrics(flowSummaries);
    
    // Calculate weekly trends
    const weeklyTrends = this.calculateWeeklyTrends(dailyData, startDate, endDate);
    
    // Calculate achievements
    const achievements = this.calculateAchievements(flowSummaries);
    
    // Process heat map data
    const processedHeatMap = this.processHeatMapData(heatMapData, currentMonth);

    return {
      overall: {
        totalFlows,
        totalCompleted,
        totalScheduled,
        totalPoints,
        averageCompletionRate,
        averageStreak,
        dailyData: this.aggregateDailyData(dailyData),
        successMetrics
      },
      flowSummaries,
      weeklyTrends,
      achievements,
      heatMapData: processedHeatMap,
      timeframe,
      calculatedAt: moment().toISOString(),
      cacheKey: this.createCacheKey(flows, options)
    };
  }

  /**
   * Calculate statistics for a single flow
   * @param {Object} flow - Flow object
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Object} Flow statistics
   */
  calculateFlowStats(flow, startDate, endDate) {
    const status = flow.status || {};
    const statusEntries = Object.entries(status);
    
    // Filter entries within date range
    const filteredEntries = statusEntries.filter(([date]) => {
      const entryDate = moment(date);
      return entryDate.isBetween(startDate, endDate, 'day', '[]');
    });

    // Count different status types
    let completed = 0;
    let partial = 0;
    let failed = 0;
    let skipped = 0;
    let inactive = 0;
    let points = 0;

    const dailyData = [];
    const heatMapData = [];
    let lastActivity = null;

    filteredEntries.forEach(([date, entry]) => {
      const entryDate = moment(date);
      
      // Count by symbol
      switch (entry.symbol) {
        case '+':
          completed++;
          points += 10; // Base points for completion
          break;
        case '~':
          partial++;
          points += 5; // Partial points
          break;
        case '-':
          failed++;
          break;
        case 'o':
          skipped++;
          break;
        default:
          inactive++;
      }

      // Track last activity
      if (entry.symbol && entry.symbol !== 'o') {
        lastActivity = entryDate;
      }

      // Add to daily data
      dailyData.push({
        date: date,
        flowId: flow.id,
        flowTitle: flow.title,
        symbol: entry.symbol,
        points: entry.symbol === '+' ? 10 : entry.symbol === '~' ? 5 : 0,
        emotion: entry.emotion,
        note: entry.note
      });

      // Add to heat map data
      heatMapData.push({
        date: date,
        count: entry.symbol === '+' ? 1 : 0,
        level: entry.symbol === '+' ? 4 : entry.symbol === '~' ? 2 : 1
      });
    });

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(filteredEntries);

    // Calculate completion rate
    const scheduled = filteredEntries.length;
    const completionRate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    return {
      completed,
      partial,
      failed,
      skipped,
      inactive,
      scheduled,
      completionRate,
      currentStreak,
      longestStreak,
      points,
      lastActivity,
      dailyData,
      heatMapData
    };
  }

  /**
   * Calculate streaks for a flow
   * @param {Array} entries - Status entries
   * @returns {Object} Streak data
   */
  calculateStreaks(entries) {
    if (entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort by date (newest first)
    const sortedEntries = entries.sort(([a], [b]) => new Date(b) - new Date(a));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (const [date, entry] of sortedEntries) {
      if (entry.symbol === '+') {
        tempStreak++;
        if (currentStreak === 0) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  /**
   * Calculate success metrics
   * @param {Array} flowSummaries - Flow summary data
   * @returns {Object} Success metrics
   */
  calculateSuccessMetrics(flowSummaries) {
    const totalSuccessfulDays = flowSummaries.reduce((sum, flow) => sum + flow.completed, 0);
    const totalFailedDays = flowSummaries.reduce((sum, flow) => sum + flow.failed, 0);
    const totalScheduledDays = flowSummaries.reduce((sum, flow) => sum + flow.scheduledDays, 0);
    
    const successRate = totalScheduledDays > 0 ? Math.round((totalSuccessfulDays / totalScheduledDays) * 100) : 0;
    const failureRate = totalScheduledDays > 0 ? Math.round((totalFailedDays / totalScheduledDays) * 100) : 0;
    
    return {
      totalSuccessfulDays,
      totalFailedDays,
      totalScheduledDays,
      successRate,
      failureRate,
      pureCompletionRate: successRate,
      partialSuccessRate: 0, // Can be calculated if needed
      skipRate: 0 // Can be calculated if needed
    };
  }

  /**
   * Calculate weekly trends
   * @param {Array} dailyData - Daily data
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Array} Weekly trends
   */
  calculateWeeklyTrends(dailyData, startDate, endDate) {
    const weeklyData = {};
    
    // Group by week
    dailyData.forEach(entry => {
      const weekStart = moment(entry.date).startOf('week');
      const weekKey = weekStart.format('YYYY-MM-DD');
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          completed: 0,
          total: 0,
          points: 0
        };
      }
      
      weeklyData[weekKey].total++;
      weeklyData[weekKey].points += entry.points;
      
      if (entry.symbol === '+') {
        weeklyData[weekKey].completed++;
      }
    });

    return Object.values(weeklyData).map(week => ({
      ...week,
      completionRate: week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0
    }));
  }

  /**
   * Calculate achievements
   * @param {Array} flowSummaries - Flow summary data
   * @returns {Array} Achievements
   */
  calculateAchievements(flowSummaries) {
    const achievements = [];
    
    // Streak achievements
    const maxStreak = Math.max(...flowSummaries.map(f => f.longestStreak));
    if (maxStreak >= 7) achievements.push({ type: 'streak', value: maxStreak, description: `${maxStreak} day streak!` });
    
    // Completion achievements
    const avgCompletion = flowSummaries.reduce((sum, f) => sum + f.completionRate, 0) / flowSummaries.length;
    if (avgCompletion >= 80) achievements.push({ type: 'completion', value: avgCompletion, description: `${Math.round(avgCompletion)}% completion rate!` });
    
    return achievements;
  }

  /**
   * Process heat map data
   * @param {Array} heatMapData - Raw heat map data
   * @param {moment} currentMonth - Current month
   * @returns {Object} Processed heat map data
   */
  processHeatMapData(heatMapData, currentMonth) {
    const contributionData = [];
    const dateCounts = {};
    
    // Count activities per date
    heatMapData.forEach(entry => {
      if (!dateCounts[entry.date]) {
        dateCounts[entry.date] = 0;
      }
      dateCounts[entry.date] += entry.count;
    });
    
    // Convert to contribution data format
    Object.entries(dateCounts).forEach(([date, count]) => {
      contributionData.push({
        date,
        count,
        level: Math.min(4, Math.max(1, Math.ceil(count / 2)))
      });
    });
    
    const maxCount = Math.max(...Object.values(dateCounts), 0);
    
    return {
      contributionData,
      maxCount
    };
  }

  /**
   * Aggregate daily data
   * @param {Array} dailyData - Daily data
   * @returns {Array} Aggregated daily data
   */
  aggregateDailyData(dailyData) {
    const aggregated = {};
    
    dailyData.forEach(entry => {
      if (!aggregated[entry.date]) {
        aggregated[entry.date] = {
          date: entry.date,
          completed: 0,
          total: 0,
          points: 0
        };
      }
      
      aggregated[entry.date].total++;
      aggregated[entry.date].points += entry.points;
      
      if (entry.symbol === '+') {
        aggregated[entry.date].completed++;
      }
    });
    
    return Object.values(aggregated).map(day => ({
      ...day,
      completionRate: day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0
    }));
  }

  /**
   * Filter flows based on options
   * @param {Array} flows - All flows
   * @param {Object} options - Filter options
   * @returns {Array} Filtered flows
   */
  filterFlows(flows, options) {
    return flows.filter(flow => {
      if (!options.includeArchived && flow.archived) return false;
      if (!options.includeDeleted && flow.deletedAt) return false;
      return true;
    });
  }

  /**
   * Get date range for timeframe
   * @param {string} timeframe - Timeframe
   * @param {moment} currentMonth - Current month
   * @returns {Object} Date range
   */
  getDateRange(timeframe, currentMonth) {
    const now = moment();
    
    switch (timeframe) {
      case 'weekly':
        return {
          startDate: now.clone().subtract(1, 'week'),
          endDate: now
        };
      case 'monthly':
        return {
          startDate: now.clone().subtract(1, 'month'),
          endDate: now
        };
      case 'yearly':
        return {
          startDate: now.clone().subtract(1, 'year'),
          endDate: now
        };
      case 'all':
      default:
        return {
          startDate: moment('2020-01-01'), // Far back date
          endDate: now
        };
    }
  }

  /**
   * Create cache key
   * @param {Array} flows - Flows array
   * @param {Object} options - Options
   * @returns {string} Cache key
   */
  createCacheKey(flows, options) {
    const flowsHash = flows.map(f => `${f.id}-${f.updatedAt || f.createdAt}`).join('|');
    const optionsHash = JSON.stringify(options);
    return `stats_${flowsHash}_${optionsHash}`;
  }

  /**
   * Check if cache is valid
   * @param {string} cacheKey - Cache key
   * @returns {boolean} Is valid
   */
  isCacheValid(cacheKey) {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    
    return (Date.now() - timestamp) < CACHE_EXPIRY_MS;
  }

  /**
   * Get default stats
   * @returns {Object} Default stats
   */
  getDefaultStats() {
    return {
      overall: {
        totalFlows: 0,
        totalCompleted: 0,
        totalScheduled: 0,
        totalPoints: 0,
        averageCompletionRate: 0,
        averageStreak: 0,
        dailyData: [],
        successMetrics: {
          totalSuccessfulDays: 0,
          totalFailedDays: 0,
          totalScheduledDays: 0,
          successRate: 0,
          failureRate: 0,
          pureCompletionRate: 0,
          partialSuccessRate: 0,
          skipRate: 0
        }
      },
      flowSummaries: [],
      weeklyTrends: [],
      achievements: [],
      heatMapData: { contributionData: [], maxCount: 0 },
      timeframe: 'all',
      calculatedAt: moment().toISOString()
    };
  }

  /**
   * Persist cache to AsyncStorage
   */
  async persistCache() {
    try {
      const cacheData = {
        cache: Array.from(this.cache.entries()),
        timestamps: Array.from(this.cacheTimestamps.entries())
      };
      await AsyncStorage.setItem(STATS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('📊 OptimizedStats: Error persisting cache:', error);
    }
  }

  /**
   * Load cache from AsyncStorage
   */
  async loadCache() {
    try {
      const cacheData = await AsyncStorage.getItem(STATS_CACHE_KEY);
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(parsed.cache);
        this.cacheTimestamps = new Map(parsed.timestamps);
      }
    } catch (error) {
      console.error('📊 OptimizedStats: Error loading cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    await AsyncStorage.removeItem(STATS_CACHE_KEY);
    console.log('📊 OptimizedStats: Cache cleared');
  }
}

// Export singleton instance
export default new OptimizedStatsService();
