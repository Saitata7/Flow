import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlowsContext } from './FlowContext';
import { calculateFlowStats, calculateEmotionDistribution, calculateEntryPoints } from '../services/scoringService';
import apiService from '../services/apiService';
import syncService from '../services/syncService';
import settingsService from '../services/settingsService';
import activityCacheService from '../services/activityCacheService';

// Storage keys for activity cache
const ACTIVITY_CACHE_KEY = 'activity_cache';
const CACHE_METADATA_KEY = 'cache_metadata';

// Helper function to get new entries since a given date
const getNewEntriesSince = (flow, lastUpdate) => {
  if (!flow.status || typeof flow.status !== 'object') {
    return [];
  }
  
  const newEntries = [];
  for (const [date, entryData] of Object.entries(flow.status)) {
    const entryDate = moment(date);
    if (entryDate.isAfter(lastUpdate)) {
      newEntries.push({
        date,
        ...entryData
      });
    }
  }
  
  return newEntries;
};

export const ActivityContext = createContext({
  getAllStats: () => ({}),
  getScoreboard: () => ({}),
  getActivityStats: () => ({}),
  getEmotionalActivity: () => ({}),
  getFlowSummary: () => ({}),
  updateActivityCache: () => {},
  syncActivityCacheWithBackend: () => {},
  clearActivityCache: () => {},
  getCacheStatus: () => ({}),
});

export const ActivityProvider = ({ children }) => {
  const { flows = [], updateFlowStatus } = useContext(FlowsContext) || {};
  const [activityCache, setActivityCache] = useState({});
  const [cacheMetadata, setCacheMetadata] = useState({
    lastFullRebuild: null,
    version: '1.0.0',
    totalEntries: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('ActivityProvider: Received flows:', flows.length, 'flows');

  // Initialize cache on mount
  useEffect(() => {
    initializeCache();
  }, []);

  // Update cache when flows change
  useEffect(() => {
    if (isInitialized && flows.length > 0) {
      checkAndUpdateCache();
    }
  }, [flows, isInitialized]);

  /**
   * Initialize activity cache from storage
   */
  const initializeCache = useCallback(async () => {
    try {
      console.log('🔄 Initializing activity cache...');
      
      const [cachedData, metadata] = await Promise.all([
        AsyncStorage.getItem(ACTIVITY_CACHE_KEY),
        AsyncStorage.getItem(CACHE_METADATA_KEY),
      ]);

      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        setActivityCache(parsedCache);
        console.log('📱 Loaded activity cache:', Object.keys(parsedCache).length, 'flows');
      }

      if (metadata) {
        const parsedMetadata = JSON.parse(metadata);
        setCacheMetadata(parsedMetadata);
        console.log('📱 Loaded cache metadata:', parsedMetadata);
      }

      setIsInitialized(true);
      console.log('✅ Activity cache initialized');
    } catch (error) {
      console.error('❌ Failed to initialize activity cache:', error);
      setIsInitialized(true);
    }
  }, []);

  /**
   * Save cache to storage
   */
  const saveCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(activityCache)),
        AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(cacheMetadata)),
      ]);
      console.log('💾 Activity cache saved');
    } catch (error) {
      console.error('❌ Failed to save activity cache:', error);
    }
  }, [activityCache, cacheMetadata]);

  /**
   * Check if cache needs updates and update if necessary
   */
  const checkAndUpdateCache = useCallback(async () => {
    const now = moment();
    const needsUpdate = flows.some(flow => {
      const flowCache = activityCache[flow.id];
      if (!flowCache) return true;

      // Check if cache is older than 24 hours
      const lastUpdated = moment(flowCache.lastUpdated);
      return now.diff(lastUpdated, 'hours') > 24;
    });

    if (needsUpdate) {
      console.log('🔄 Cache needs update, triggering incremental update...');
      await performIncrementalUpdate();
    }
  }, [flows, activityCache]);

  /**
   * Perform incremental cache update
   */
  const performIncrementalUpdate = useCallback(async () => {
    try {
      console.log('🔄 Performing incremental cache update...');
      
      const updatedCache = { ...activityCache };
      let hasUpdates = false;

      for (const flow of flows) {
        // Skip flows with invalid IDs
        if (!flow || !flow.id) {
          console.warn('Skipping flow with invalid ID:', flow);
          continue;
        }
        
        const flowCache = updatedCache[flow.id] || {};
        const lastUpdate = flowCache.lastUpdated ? moment(flowCache.lastUpdated) : moment(flow.startDate);
        
        // Only update if there are new entries since last update
        const newEntries = getNewEntriesSince(flow, lastUpdate);
        
        if (newEntries.length > 0) {
          console.log(`📊 Updating cache for flow ${flow.title}: ${newEntries.length} new entries`);
          
          // Update cache for this flow
          updatedCache[flow.id] = await updateFlowCache(flow, flowCache, newEntries);
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        setActivityCache(updatedCache);
        setCacheMetadata(prev => ({
          ...prev,
          lastFullRebuild: moment().toISOString(),
          totalEntries: Object.values(updatedCache).reduce((sum, flowCache) => 
            sum + (flowCache.dailyEntries ? Object.keys(flowCache.dailyEntries).length : 0), 0
          ),
        }));
        
        await saveCache();
        console.log('✅ Incremental cache update completed');
      }
    } catch (error) {
      console.error('❌ Incremental cache update failed:', error);
    }
  }, [flows, activityCache, saveCache]);

  /**
   * Calculate delta updates for specific flows
   * Only recalculates what has changed since last update
   */
  const calculateDeltaUpdates = useCallback(async (flowIds, newEntries) => {
    try {
      console.log(`🔄 Calculating delta updates for ${flowIds.length} flows...`);
      
      const deltaUpdates = {};
      
      for (const flowId of flowIds) {
        const flow = flows.find(f => f.id === flowId);
        if (!flow) continue;
        
        const flowCache = activityCache[flowId] || {};
        const flowNewEntries = newEntries.filter(entry => entry.flowId === flowId);
        
        if (flowNewEntries.length === 0) continue;
        
        // Calculate only the changed timeframes
        const changedTimeframes = getChangedTimeframes(flowNewEntries, flowCache);
        
        deltaUpdates[flowId] = {
          newEntries: flowNewEntries,
          changedTimeframes,
          lastUpdated: moment().toISOString(),
        };
      }
      
      return deltaUpdates;
    } catch (error) {
      console.error('❌ Error calculating delta updates:', error);
      return {};
    }
  }, [flows, activityCache]);

  /**
   * Get timeframes that need recalculation based on new entries
   */
  const getChangedTimeframes = useCallback((newEntries, flowCache) => {
    const timeframes = ['weekly', 'monthly', 'yearly', 'all'];
    const changedTimeframes = [];
    
    for (const timeframe of timeframes) {
      const lastUpdate = flowCache[timeframe]?.lastUpdated ? moment(flowCache[timeframe].lastUpdated) : null;
      
      // Check if any new entry affects this timeframe
      const hasRelevantEntries = newEntries.some(entry => {
        const entryDate = moment(entry.date);
        return isDateInTimeframe(entryDate, timeframe);
      });
      
      if (hasRelevantEntries) {
        changedTimeframes.push(timeframe);
      }
    }
    
    return changedTimeframes;
  }, []);

  /**
   * Check if a date falls within a specific timeframe
   */
  const isDateInTimeframe = useCallback((date, timeframe) => {
    const now = moment();
    
    switch (timeframe) {
      case 'weekly':
        return date.isAfter(now.clone().subtract(7, 'days'));
      case 'monthly':
        return date.isAfter(now.clone().subtract(30, 'days'));
      case 'yearly':
        return date.isAfter(now.clone().subtract(365, 'days'));
      case 'all':
        return true;
      default:
        return false;
    }
  }, []);

  /**
   * Update cache for a specific flow
   */
  const updateFlowCache = useCallback(async (flow, existingCache, newEntries) => {
    const now = moment().toISOString();
    const updatedCache = {
      ...existingCache,
      lastUpdated: now,
      version: '1.0.0',
    };

    // Initialize cache structure if not exists
    if (!updatedCache.dailyEntries) {
      updatedCache.dailyEntries = {};
    }

    // Update daily entries
    for (const { dayKey, entry } of newEntries) {
      updatedCache.dailyEntries[dayKey] = {
        stats: calculateEntryPoints(entry, flow),
        lastUpdated: now,
      };
    }

    // Recalculate aggregates for affected timeframes
    const timeframes = ['weekly', 'monthly', 'yearly', 'all'];
    
    for (const timeframe of timeframes) {
      updatedCache[timeframe] = await calculateAggregateStats(flow, timeframe, updatedCache.dailyEntries);
    }

    return updatedCache;
  }, []);

  /**
   * Calculate aggregate stats for a timeframe
   */
  const calculateAggregateStats = useCallback(async (flow, timeframe, dailyEntries) => {
    const now = moment();
    let startDate, endDate;

    switch (timeframe) {
      case 'weekly':
        startDate = now.clone().subtract(7, 'days');
        endDate = now;
        break;
      case 'monthly':
        startDate = now.clone().subtract(30, 'days');
        endDate = now;
        break;
      case 'yearly':
        startDate = now.clone().subtract(365, 'days');
        endDate = now;
        break;
      case 'all':
        startDate = moment(flow.startDate);
        endDate = now;
        break;
      default:
        startDate = moment(flow.startDate);
        endDate = now;
    }

    // Use scoring service to calculate stats
    const stats = calculateFlowStats(flow, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeEmotions: true,
      includeNotes: true,
    });

    return {
      stats,
      lastUpdated: moment().toISOString(),
      version: '1.0.0',
      timeframe,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, []);

  /**
   * Update activity cache when a flow entry is modified
   */
  const updateActivityCache = useCallback(async (flowId, dayKey, newEntry) => {
    try {
      console.log(`🔄 Updating activity cache for flow ${flowId}, day ${dayKey}`);
      
      const flow = flows.find(f => f.id === flowId);
      if (!flow) {
        console.warn('Flow not found for cache update:', flowId);
        return;
      }

      const updatedCache = { ...activityCache };
      
      // Initialize flow cache if not exists
      if (!updatedCache[flowId]) {
        updatedCache[flowId] = {
          dailyEntries: {},
          lastUpdated: moment().toISOString(),
          version: '1.0.0',
        };
      }

      // Update daily entry
      updatedCache[flowId].dailyEntries[dayKey] = {
        stats: calculateEntryPoints(newEntry, flow),
        lastUpdated: moment().toISOString(),
      };

      // Recalculate aggregates for all timeframes
      const timeframes = ['weekly', 'monthly', 'yearly', 'all'];
      for (const timeframe of timeframes) {
        updatedCache[flowId][timeframe] = await calculateAggregateStats(
          flow, 
          timeframe, 
          updatedCache[flowId].dailyEntries
        );
      }

      updatedCache[flowId].lastUpdated = moment().toISOString();
      
      setActivityCache(updatedCache);
      await saveCache();
      
      console.log(`✅ Activity cache updated for flow ${flowId}, day ${dayKey}`);
    } catch (error) {
      console.error('❌ Failed to update activity cache:', error);
    }
  }, [flows, activityCache, saveCache, calculateAggregateStats]);

  /**
   * Get cached stats or calculate if not available
   */
  const getCachedStats = useCallback(async (flowId, timeframe = 'all') => {
    const flowCache = activityCache[flowId];
    
    if (flowCache && flowCache[timeframe]) {
      const cachedStats = flowCache[timeframe];
      const lastUpdated = moment(cachedStats.lastUpdated);
      
      // Return cached stats if less than 24 hours old
      if (moment().diff(lastUpdated, 'hours') < 24) {
        console.log(`📊 Using cached stats for flow ${flowId}, timeframe ${timeframe}`);
        return cachedStats.stats;
      }
    }

    // Calculate fresh stats if cache is missing or stale
    console.log(`🔄 Calculating fresh stats for flow ${flowId}, timeframe ${timeframe}`);
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return null;

    const stats = calculateFlowStats(flow, { timeframe });
    
    // Update cache with fresh stats
    await updateActivityCache(flowId, 'fresh_calculation', { symbol: '+', timestamp: moment().toISOString() });
    
    return stats;
  }, [flows, activityCache, updateActivityCache]);

  /**
   * Sync activity cache with backend
   */
  const syncActivityCacheWithBackend = useCallback(async () => {
    try {
      console.log('🔄 Triggering activity cache sync...');
      await activityCacheService.syncWithBackend();
      
      // Reload cache after sync
      await initializeCache();
      console.log('✅ Activity cache sync completed');
    } catch (error) {
      console.error('❌ Activity cache sync failed:', error);
    }
  }, [initializeCache]);

  /**
   * Clear activity cache
   */
  const clearActivityCache = useCallback(async () => {
    try {
      console.log('🔄 Clearing activity cache...');
      
      // Clear all caches
      await AsyncStorage.removeItem(ACTIVITY_CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      
      // Reset cache state
      setActivityCache({});
      setCacheMetadata({
        lastFullRebuild: null,
        version: '1.0.0',
        totalEntries: 0,
      });
      
      console.log('✅ Activity cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear activity cache:', error);
    }
  }, []);

  /**
   * Force refresh analytics by clearing cache and recalculating
   */
  const forceRefreshAnalytics = useCallback(async () => {
    try {
      console.log('🔄 Force refreshing analytics...');
      
      // Clear all caches
      await AsyncStorage.removeItem(ACTIVITY_CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      
      // Reset cache state
      setActivityCache({});
      setCacheMetadata({
        lastFullRebuild: null,
        version: '1.0.0',
        totalEntries: 0,
      });
      
      // Reinitialize cache with fresh data
      await initializeCache();
      
      console.log('✅ Analytics force refresh completed');
    } catch (error) {
      console.error('❌ Force refresh analytics failed:', error);
    }
  }, [initializeCache]);

  /**
   * Get cache status information
   */
  const getCacheStatus = useCallback(async () => {
    const totalFlows = Object.keys(activityCache).length;
    const totalEntries = Object.values(activityCache).reduce((sum, flowCache) => 
      sum + (flowCache.dailyEntries ? Object.keys(flowCache.dailyEntries).length : 0), 0
    );

    const backgroundServiceStatus = activityCacheService.getSyncStatus();
    const cacheStats = await activityCacheService.getCacheStats();

    return {
      isInitialized,
      totalFlows,
      totalEntries,
      lastFullRebuild: cacheMetadata.lastFullRebuild,
      version: cacheMetadata.version,
      cacheSize: JSON.stringify(activityCache).length,
      backgroundService: backgroundServiceStatus,
      cacheStats,
    };
  }, [activityCache, cacheMetadata, isInitialized]);

  // Optimized getAllStats with cache-first approach
  const getAllStats = useCallback(async (options = {}) => {
    const {
      includeArchived = false,
      includeDeleted = false,
      timeframe = 'all',
      currentMonth = moment().startOf('month')
    } = options;

    // Filter flows based on options
    const filteredFlows = flows.filter(flow => {
      if (!includeArchived && flow.archived) return false;
      if (!includeDeleted && flow.deletedAt) return false;
      return true;
    });

    if (filteredFlows.length === 0) {
      return getDefaultStats(timeframe, options);
    }

    // Use cached stats for each flow
    const flowSummaries = [];
    let totalCompleted = 0, totalPartial = 0, totalFailed = 0, totalSkipped = 0, totalInactive = 0;
    let totalPoints = 0, totalEmotionBonus = 0, totalNotesCount = 0, totalCheatEntries = 0;
    let totalScheduledDays = 0, longestStreak = 0;

    for (const flow of filteredFlows) {
      // Skip flows with invalid IDs
      if (!flow || !flow.id) {
        console.warn('Skipping flow with invalid ID in getAllStats:', flow);
        continue;
      }
      
      const stats = await getCachedStats(flow.id, timeframe);
      if (stats) {
        // Aggregate totals
        totalCompleted += stats.completed || 0;
        totalPartial += stats.partial || 0;
        totalFailed += stats.failed || 0;
        totalSkipped += stats.skipped || 0;
        totalInactive += stats.inactive || 0;
        totalPoints += stats.finalScore || 0;
        totalEmotionBonus += stats.emotionBonus || 0;
        totalNotesCount += stats.notesCount || 0;
        totalCheatEntries += stats.cheatEntriesCount || 0;
        totalScheduledDays += stats.scheduledDays || 0;
        longestStreak = Math.max(longestStreak, stats.longestStreak || 0);

        // Add flow summary
        const flowSummary = {
          flowId: flow.id,
          flowTitle: flow.title,
          flowType: flow.trackingType || 'Binary',
          completed: stats.completed || 0,
          partial: stats.partial || 0,
          failed: stats.failed || 0,
          skipped: stats.skipped || 0,
          inactive: stats.inactive || 0,
          currentStreak: stats.currentStreak || 0,
          longestStreak: stats.longestStreak || 0,
          completionRate: stats.completionRate || 0,
          scheduledDays: stats.scheduledDays || 0,
          points: stats.finalScore || 0
        };
        
        console.log('ActivityContext: Flow summary for', flow.title, ':', {
          flowId: flowSummary.flowId,
          completionRate: flowSummary.completionRate,
          completed: flowSummary.completed,
          scheduled: flowSummary.scheduledDays,
          rawStats: stats
        });
        
        flowSummaries.push(flowSummary);
      }
    }

    // Calculate success metrics
    const totalSuccessfulDays = totalCompleted + totalPartial;
    const totalFailedDays = totalFailed + totalSkipped;
    const successRate = totalScheduledDays > 0 ? (totalSuccessfulDays / totalScheduledDays) * 100 : 0;
    const pureCompletionRate = totalScheduledDays > 0 ? (totalCompleted / totalScheduledDays) * 100 : 0;
    const partialSuccessRate = totalScheduledDays > 0 ? (totalPartial / totalScheduledDays) * 100 : 0;
    const failureRate = totalScheduledDays > 0 ? (totalFailed / totalScheduledDays) * 100 : 0;
    const skipRate = totalScheduledDays > 0 ? (totalSkipped / totalScheduledDays) * 100 : 0;

    // Generate weekly trends (cached)
    const weeklyTrends = await generateWeeklyTrends(filteredFlows);

    // Generate achievements
    const achievements = generateAchievements(totalCompleted, longestStreak, successRate, filteredFlows.length);

    // Generate heat map data
    const heatMapData = await generateHeatMapData(filteredFlows, currentMonth);

    return {
      totalFlows: filteredFlows.length,
      totalCompleted,
      totalPartial,
      totalFailed,
      totalSkipped,
      totalInactive,
      totalPoints,
      totalEmotionBonus,
      totalNotesCount,
      totalCheatEntries,
      totalScheduledDays,
      longestStreak,
      averageCompletionRate: successRate,
      pureCompletionRate,
      successMetrics: {
        totalSuccessfulDays,
        totalFailedDays,
        successRate,
        pureCompletionRate,
        partialSuccessRate,
        failureRate,
        skipRate
      },
      heatMapData,
      weeklyTrends,
      achievements,
      flowSummaries,
      calculatedAt: moment().toISOString(),
      timeframe,
      options,
      cacheStatus: getCacheStatus(),
    };
  }, [flows, getCachedStats, getCacheStatus]);

  // Helper functions for generating cached data
  const generateWeeklyTrends = useCallback(async (filteredFlows) => {
    const trends = [];
    const now = moment();

    for (let i = 6; i >= 0; i--) {
      const date = now.clone().subtract(i, 'days');
      const dayKey = date.format('YYYY-MM-DD');
      
      let dayCompleted = 0, dayScheduled = 0;
      
      for (const flow of filteredFlows) {
        // Skip flows with invalid IDs
        if (!flow || !flow.id) {
          console.warn('Skipping flow with invalid ID in generateWeeklyTrends:', flow);
          continue;
        }
        
        const isScheduled = isFlowScheduledForDate(flow, date);
        
        if (isScheduled) {
          dayScheduled++;
          const dayStat = flow.status?.[dayKey];
          if (dayStat && dayStat.symbol === '+') {
            dayCompleted++;
          }
        }
      }

      const percentage = dayScheduled > 0 ? (dayCompleted / dayScheduled) * 100 : 0;
      trends.push({
        date: dayKey,
        displayDate: date.format('MMM D'),
        percentage: percentage,
        completed: dayCompleted,
        scheduled: dayScheduled
      });
    }

    return trends;
  }, []);

  const generateAchievements = useCallback((totalCompleted, longestStreak, successRate, totalFlows) => {
    const achievements = [];

    if (totalCompleted >= 1) {
      achievements.push({
        title: 'Getting Started',
        description: 'Completed your first activity',
        icon: '🎯',
        color: '#4CAF50',
        progress: totalCompleted,
        target: 1
      });
    }
    if (totalCompleted >= 5) {
      achievements.push({
        title: 'Building Momentum',
        description: 'Completed 5+ activities',
        icon: '⚡',
        color: '#2196F3',
        progress: totalCompleted,
        target: 5
      });
    }
    if (totalCompleted >= 10) {
      achievements.push({
        title: 'Consistent Performer',
        description: 'Completed 10+ activities',
        icon: '🌟',
        color: '#FF9800',
        progress: totalCompleted,
        target: 10
      });
    }
    if (longestStreak >= 3) {
      achievements.push({
        title: 'Streak Starter',
        description: '3+ day streak',
        icon: '🔥',
        color: '#FF6B35',
        progress: longestStreak,
        target: 3
      });
    }
    if (longestStreak >= 7) {
      achievements.push({
        title: 'Week Warrior',
        description: '7+ day streak',
        icon: '💪',
        color: '#9C27B0',
        progress: longestStreak,
        target: 7
      });
    }
    if (successRate >= 50) {
      achievements.push({
        title: 'Halfway There',
        description: '50%+ success rate',
        icon: '📈',
        color: '#00BCD4',
        progress: Math.round(successRate),
        target: 50
      });
    }
    if (totalCompleted >= 100) {
      achievements.push({
        title: 'Century Club',
        description: 'Completed 100+ activities',
        icon: '🏆',
        color: '#FFD700',
        progress: totalCompleted,
        target: 100
      });
    }
    if (longestStreak >= 30) {
      achievements.push({
        title: 'Month Master',
        description: '30+ day streak',
        icon: '🔥',
        color: '#FF6B35',
        progress: longestStreak,
        target: 30
      });
    }
    if (successRate >= 80) {
      achievements.push({
        title: 'Consistency King',
        description: '80%+ success rate',
        icon: '👑',
        color: '#4CAF50',
        progress: Math.round(successRate),
        target: 80
      });
    }

    return achievements;
  }, []);

  const generateHeatMapData = useCallback(async (filteredFlows, currentMonth) => {
    const heatMapData = {};
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    
    for (let date = startOfMonth.clone(); date.isSameOrBefore(endOfMonth); date.add(1, 'day')) {
      const dayKey = date.format('YYYY-MM-DD');
      let count = 0;
      
      for (const flow of filteredFlows) {
        const isScheduled = isFlowScheduledForDate(flow, date);
        
        if (isScheduled) {
          const dayStat = flow.status?.[dayKey];
          if (dayStat && dayStat.symbol === '+') {
            count++;
          }
        }
      }

      heatMapData[dayKey] = count;
    }

    return heatMapData;
  }, []);

  // Helper function to check if flow is scheduled for a date
  const isFlowScheduledForDate = useCallback((flow, date) => {
    const frequency = flow.frequency || 'Daily';
    
    if (frequency === 'Daily') {
      return flow.everyDay || 
             (flow.daysOfWeek && flow.daysOfWeek.length > 0 && flow.daysOfWeek.includes(date.format('ddd')));
    } else if (frequency === 'Monthly') {
      return flow.selectedMonthDays && 
             flow.selectedMonthDays.includes(date.date().toString());
    }
    
    return true;
  }, []);

  // Default return values
  const getDefaultStats = (timeframe, options) => ({
    totalFlows: 0,
    totalCompleted: 0,
    totalPartial: 0,
    totalFailed: 0,
    totalSkipped: 0,
    totalInactive: 0,
    totalPoints: 0,
    totalEmotionBonus: 0,
    totalNotesCount: 0,
    totalCheatEntries: 0,
    totalScheduledDays: 0,
    longestStreak: 0,
    averageCompletionRate: 0,
    pureCompletionRate: 0,
    successMetrics: {
      totalSuccessfulDays: 0,
      totalFailedDays: 0,
      successRate: 0,
      pureCompletionRate: 0,
      partialSuccessRate: 0,
      failureRate: 0,
      skipRate: 0
    },
    heatMapData: {},
    weeklyTrends: [],
    achievements: [],
    flowSummaries: [],
    calculatedAt: moment().toISOString(),
    timeframe,
    options
  });

  const getDefaultScoreboard = () => ({
    completed: 0,
    partial: 0,
    failed: 0,
    skipped: 0,
    inactive: 0,
    streakBonus: 0,
    emotionBonus: 0,
    notesCount: 0,
    completionRate: 0,
    finalScore: 0,
    timeBasedStats: { totalDuration: 0, averageDuration: 0, totalPauses: 0 },
    quantitativeStats: { totalCount: 0, averageCount: 0, unitText: '' },
  });

  const getDefaultActivityStats = () => ({
    total: 0,
    byStatus: { Completed: 0, Partial: 0, Missed: 0, Inactive: 0, Skipped: 0 },
    timeBased: { totalDuration: 0, totalPauses: 0 },
    quantitative: { totalCount: 0, unitText: '' }
  });

  const getDefaultEmotionalActivity = () => ({
    totalEmotions: 0,
    byEmotion: { Sad: 0, 'Slightly worried': 0, Neutral: 0, 'Slightly smiling': 0, 'Big smile': 0 }
  });

  const getDefaultFlowSummary = () => ({
    flowId: null,
    flowTitle: 'Flow Not Found',
    flowType: 'Unknown',
    completed: 0,
    partial: 0,
    failed: 0,
    skipped: 0,
    inactive: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    scheduledDays: 0,
    points: 0
  });

  // Optimized getScoreboard with cache-first approach
  const getScoreboard = useCallback(async (flowId) => {
    console.log('ActivityContext: getScoreboard called with flowId:', flowId);
    
    const flow = flows.find((f) => f.id === flowId || f.id === String(flowId) || f.id === Number(flowId));
    if (!flow) {
      console.warn('Flow not found:', flowId);
      return getDefaultScoreboard();
    }

    // Use cached stats
    const stats = await getCachedStats(flowId, 'all');
    if (!stats) {
      return getDefaultScoreboard();
    }

    return {
      completed: stats.completed || 0,
      partial: stats.partial || 0,
      failed: stats.failed || 0,
      skipped: stats.skipped || 0,
      inactive: stats.inactive || 0,
      streak: stats.currentStreak || 0,
      streakBonus: stats.streakBonus || 0,
      emotionBonus: stats.emotionBonus || 0,
      notesCount: stats.notesCount || 0,
      completionRate: stats.completionRate || 0,
      finalScore: stats.finalScore || 0,
      timeBasedStats: stats.timeBasedStats || { totalDuration: 0, averageDuration: 0, totalPauses: 0 },
      quantitativeStats: stats.quantitativeStats || { totalCount: 0, averageCount: 0, unitText: '' },
    };
  }, [flows, getCachedStats]);

  // Optimized getActivityStats with cache-first approach
  const getActivityStats = useCallback(async (flowId) => {
    console.log('ActivityContext: getActivityStats called with flowId:', flowId);
    
    const flow = flows.find((h) => h.id === flowId || h.id === String(flowId) || h.id === Number(flowId));
    if (!flow) {
      console.warn('Flow not found for activity stats:', flowId);
      return getDefaultActivityStats();
    }

    // Use cached stats
    const stats = await getCachedStats(flowId, 'all');
    if (!stats) {
      return getDefaultActivityStats();
    }

    return {
      total: stats.scheduledDays || 0,
      byStatus: {
        Completed: stats.completed || 0,
        Partial: stats.partial || 0,
        Missed: stats.failed || 0,
        Inactive: stats.inactive || 0,
        Skipped: stats.skipped || 0,
      },
      timeBased: stats.timeBasedStats || { totalDuration: 0, totalPauses: 0 },
      quantitative: stats.quantitativeStats || { totalCount: 0, unitText: '' },
    };
  }, [flows, getCachedStats]);

  // Optimized getEmotionalActivity with cache-first approach
  const getEmotionalActivity = useCallback(async (flowId) => {
    console.log('ActivityContext: getEmotionalActivity called with flowId:', flowId);
    
    const flow = flows.find((h) => h.id === flowId || h.id === String(flowId) || h.id === Number(flowId));
    if (!flow) {
      console.warn('Flow not found for emotional activity:', flowId);
      return getDefaultEmotionalActivity();
    }

    // Use cached emotion distribution
    const emotionData = calculateEmotionDistribution(flow);
    return emotionData;
  }, [flows]);

  // Optimized getFlowSummary with cache-first approach
  const getFlowSummary = useCallback(async (flowId) => {
    const flow = flows.find((f) => f.id === flowId) || {};
    if (!flow.id) {
      return getDefaultFlowSummary();
    }

    const scoreboardData = await getScoreboard(flowId);
    
    return {
      flowId: flow.id,
      flowTitle: flow.title,
      flowType: flow.trackingType || 'Binary',
      completed: scoreboardData.completed || 0,
      partial: scoreboardData.partial || 0,
      failed: scoreboardData.failed || 0,
      skipped: scoreboardData.skipped || 0,
      inactive: scoreboardData.inactive || 0,
      currentStreak: scoreboardData.streak || 0,
      longestStreak: 0, // Would need to calculate from cache
      completionRate: scoreboardData.completionRate || 0,
      scheduledDays: 0, // Would need to calculate from cache
      points: scoreboardData.finalScore || 0
    };
  }, [flows, getScoreboard]);

  const value = useMemo(
    () => ({
      getAllStats,
      getScoreboard,
      getActivityStats,
      getEmotionalActivity,
      getFlowSummary,
      updateActivityCache,
      syncActivityCacheWithBackend,
      clearActivityCache,
      forceRefreshAnalytics,
      getCacheStatus,
    }),
    [
      getAllStats,
      getScoreboard,
      getActivityStats,
      getEmotionalActivity,
      getFlowSummary,
      updateActivityCache,
      syncActivityCacheWithBackend,
      clearActivityCache,
      forceRefreshAnalytics,
      getCacheStatus,
    ]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};