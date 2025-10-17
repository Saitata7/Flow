// context/ActivityContext.js
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlowsContext } from './FlowContext';
import optimizedStatsService from '../services/optimizedStatsService';

// Storage keys
const ACTIVITY_CACHE_KEY = 'optimized_activity_cache';
const CACHE_METADATA_KEY = 'optimized_cache_metadata';

// Create context
export const ActivityContext = createContext();

// Default context value
const defaultContextValue = {
  getAllStats: () => Promise.resolve({}),
  forceRefreshAnalytics: () => Promise.resolve(),
  forceCompleteRefresh: () => Promise.resolve(),
  getCacheStatus: () => Promise.resolve({}),
  isLoading: false,
  isInitialized: false,
};

// Provider component
export const ActivityProvider = ({ children }) => {
  const { flows = [], updateFlowStatus } = useContext(FlowsContext) || {};
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Initialize the service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        await optimizedStatsService.loadCache();
        setIsInitialized(true);
        console.log('📊 ActivityContext: Service initialized successfully');
      } catch (error) {
        console.error('📊 ActivityContext: Initialization error:', error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Optimized stats calculation
  const getAllStats = useCallback(async (options = {}) => {
    try {
      console.log('📊 ActivityContext: getAllStats called with options:', options);
      
      const {
        includeArchived = false,
        includeDeleted = false,
        timeframe = 'all',
        currentMonth = moment().startOf('month'),
        forceRefresh = false
      } = options;

      console.log('📊 ActivityContext: Current flows count:', flows ? flows.length : 0);
      
      // Defensive check for flows
      if (!flows || !Array.isArray(flows)) {
        console.warn('📊 ActivityContext: flows is not an array:', flows);
        return optimizedStatsService.getDefaultStats();
      }

      // Use the optimized stats service
      const stats = await optimizedStatsService.getStats(flows, {
        timeframe,
        includeArchived,
        includeDeleted,
        currentMonth,
        forceRefresh
      });

      console.log('📊 ActivityContext: Stats calculated successfully:', {
        totalFlows: stats.overall.totalFlows,
        totalCompleted: stats.overall.totalCompleted,
        flowSummariesCount: stats.flowSummaries.length,
        calculatedAt: stats.calculatedAt
      });

      return stats;
      
    } catch (error) {
      console.error('📊 ActivityContext: Error in getAllStats:', error);
      return optimizedStatsService.getDefaultStats();
    }
  }, [flows]);

  // Force refresh analytics
  const forceRefreshAnalytics = useCallback(async () => {
    try {
      console.log('📊 ActivityContext: Force refresh analytics...');
      setIsLoading(true);
      
      // Clear cache and recalculate
      await optimizedStatsService.clearCache();
      
      // Recalculate stats with force refresh
      const stats = await getAllStats({ forceRefresh: true });
      
      setLastRefresh(moment().toISOString());
      console.log('📊 ActivityContext: Analytics refreshed successfully');
      
      return stats;
    } catch (error) {
      console.error('📊 ActivityContext: Error refreshing analytics:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getAllStats]);

  // Force complete refresh
  const forceCompleteRefresh = useCallback(async () => {
    try {
      console.log('📊 ActivityContext: Force complete refresh...');
      setIsLoading(true);
      
      // Clear all caches
      await optimizedStatsService.clearCache();
      await AsyncStorage.removeItem(ACTIVITY_CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      
      // Recalculate stats
      const stats = await getAllStats({ forceRefresh: true });
      
      setLastRefresh(moment().toISOString());
      console.log('📊 ActivityContext: Complete refresh successful');
      
      return stats;
    } catch (error) {
      console.error('📊 ActivityContext: Error in complete refresh:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getAllStats]);

  // Get cache status
  const getCacheStatus = useCallback(async () => {
    try {
      const cacheData = await AsyncStorage.getItem(ACTIVITY_CACHE_KEY);
      const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      
      return {
        hasCache: !!cacheData,
        cacheSize: cacheData ? cacheData.length : 0,
        metadata: metadata ? JSON.parse(metadata) : null,
        lastRefresh,
        isInitialized,
        isLoading
      };
    } catch (error) {
      console.error('📊 ActivityContext: Error getting cache status:', error);
      return {
        hasCache: false,
        cacheSize: 0,
        metadata: null,
        lastRefresh,
        isInitialized,
        isLoading
      };
    }
  }, [lastRefresh, isInitialized, isLoading]);

  // Get flow-specific scoreboard data
  const getFlowScoreboard = useCallback(async (flowId, timeframe = 'weekly') => {
    try {
      console.log('📊 ActivityContext: getFlowScoreboard called for flowId:', flowId);
      
      const flow = flows.find(f => f.id === flowId);
      if (!flow) {
        console.warn('📊 ActivityContext: Flow not found:', flowId);
        return {
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalCompleted: 0,
          totalScheduled: 0,
          totalPoints: 0,
          timeBasedStats: null,
          quantitativeStats: null
        };
      }

      // Get stats for this specific flow
      const stats = await optimizedStatsService.getStats([flow], {
        timeframe,
        includeArchived: false,
        includeDeleted: false,
        forceRefresh: false
      });

      const flowSummary = stats.flowSummaries?.[0];
      if (!flowSummary) {
        console.warn('📊 ActivityContext: No flow summary found for:', flowId);
        return {
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalCompleted: 0,
          totalScheduled: 0,
          totalPoints: 0,
          timeBasedStats: null,
          quantitativeStats: null
        };
      }

      return {
        completionRate: flowSummary.completionRate || 0,
        currentStreak: flowSummary.currentStreak || 0,
        longestStreak: flowSummary.longestStreak || 0,
        totalCompleted: flowSummary.completed || 0,
        totalScheduled: flowSummary.scheduledDays || 0,
        totalPoints: flowSummary.points || 0,
        timeBasedStats: flowSummary.timeBasedStats || null,
        quantitativeStats: flowSummary.quantitativeStats || null
      };
    } catch (error) {
      console.error('📊 ActivityContext: Error getting flow scoreboard:', error);
      return {
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalCompleted: 0,
        totalScheduled: 0,
        totalPoints: 0,
        timeBasedStats: null,
        quantitativeStats: null
      };
    }
  }, [flows]);

  // Get flow-specific activity stats
  const getFlowActivityStats = useCallback(async (flowId, timeframe = 'weekly') => {
    try {
      console.log('📊 ActivityContext: getFlowActivityStats called for flowId:', flowId);
      
      const flow = flows.find(f => f.id === flowId);
      if (!flow) {
        console.warn('📊 ActivityContext: Flow not found:', flowId);
        return {
          total: 0,
          byStatus: {
            Completed: 0,
            Partial: 0,
            Missed: 0,
            Inactive: 0,
            Skipped: 0
          },
          timeBased: null,
          quantitative: null
        };
      }

      // Get stats for this specific flow
      const stats = await optimizedStatsService.getStats([flow], {
        timeframe,
        includeArchived: false,
        includeDeleted: false,
        forceRefresh: false
      });

      const flowSummary = stats.flowSummaries?.[0];
      if (!flowSummary) {
        console.warn('📊 ActivityContext: No flow summary found for:', flowId);
        return {
          total: 0,
          byStatus: {
            Completed: 0,
            Partial: 0,
            Missed: 0,
            Inactive: 0,
            Skipped: 0
          },
          timeBased: null,
          quantitative: null
        };
      }

      return {
        total: flowSummary.scheduledDays || 0,
        byStatus: {
          Completed: flowSummary.completed || 0,
          Partial: flowSummary.partial || 0,
          Missed: flowSummary.failed || 0,
          Inactive: flowSummary.inactive || 0,
          Skipped: flowSummary.skipped || 0
        },
        timeBased: flowSummary.timeBasedStats || null,
        quantitative: flowSummary.quantitativeStats || null
      };
    } catch (error) {
      console.error('📊 ActivityContext: Error getting flow activity stats:', error);
      return {
        total: 0,
        byStatus: {
          Completed: 0,
          Partial: 0,
          Missed: 0,
          Inactive: 0,
          Skipped: 0
        },
        timeBased: null,
        quantitative: null
      };
    }
  }, [flows]);

  // Get flow-specific emotional activity
  const getFlowEmotionalActivity = useCallback(async (flowId, timeframe = 'weekly') => {
    try {
      console.log('📊 ActivityContext: getFlowEmotionalActivity called for flowId:', flowId);
      
      const flow = flows.find(f => f.id === flowId);
      if (!flow) {
        console.warn('📊 ActivityContext: Flow not found:', flowId);
        return {
          emotionDistribution: {},
          averageMoodScore: 0,
          totalEntries: 0
        };
      }

      // Calculate emotion distribution from flow status
      const emotionDistribution = {};
      let totalMoodScore = 0;
      let totalEntries = 0;

      if (flow.status) {
        Object.values(flow.status).forEach(status => {
          if (status.emotion) {
            emotionDistribution[status.emotion] = (emotionDistribution[status.emotion] || 0) + 1;
          }
          if (status.moodScore) {
            totalMoodScore += status.moodScore;
            totalEntries++;
          }
        });
      }

      return {
        emotionDistribution,
        averageMoodScore: totalEntries > 0 ? totalMoodScore / totalEntries : 0,
        totalEntries
      };
    } catch (error) {
      console.error('📊 ActivityContext: Error getting flow emotional activity:', error);
      return {
        emotionDistribution: {},
        averageMoodScore: 0,
        totalEntries: 0
      };
    }
  }, [flows]);

  // Context value
  const contextValue = useMemo(() => ({
    getAllStats,
    forceRefreshAnalytics,
    forceCompleteRefresh,
    getFlowScoreboard,
    getFlowActivityStats,
    getFlowEmotionalActivity,
    getCacheStatus,
    isLoading,
    isInitialized,
    lastRefresh
  }), [
    getAllStats,
    forceRefreshAnalytics,
    forceCompleteRefresh,
    getFlowScoreboard,
    getFlowActivityStats,
    getFlowEmotionalActivity,
    getCacheStatus,
    isLoading,
    isInitialized,
    lastRefresh
  ]);

  return (
    <ActivityContext.Provider value={contextValue}>
      {children}
    </ActivityContext.Provider>
  );
};

// Hook to use the context
export const useOptimizedActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    console.warn('useOptimizedActivity must be used within OptimizedActivityProvider');
    return defaultContextValue;
  }
  return context;
};

export default ActivityContext;
