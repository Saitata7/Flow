// controllers/activities.controller.js
// Activity stats and analytics controller
// Handles activity cache, stats calculations, and analytics data

const { FlowModel } = require('../db/models');
const { ConflictError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const moment = require('moment');

/**
 * Calculate flow statistics from flow data
 */
const calculateFlowStats = (flow, options = {}) => {
  const { timeframe = 'all', includeEmotions = true, includeNotes = true } = options;

  if (!flow.status || typeof flow.status !== 'object') {
    return getDefaultStats();
  }

  const now = moment();
  let startDate, endDate;

  // Determine date range based on timeframe
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
    default:
      startDate = moment(flow.startDate || flow.createdAt);
      endDate = now;
      break;
  }

  const entries = Object.entries(flow.status);
  let completed = 0,
    partial = 0,
    failed = 0,
    skipped = 0,
    inactive = 0;
  let totalPoints = 0,
    emotionBonus = 0,
    notesCount = 0,
    cheatEntriesCount = 0;
  let currentStreak = 0,
    longestStreak = 0,
    scheduledDays = 0;
  const timeBasedStats = { totalDuration: 0, averageDuration: 0, totalPauses: 0 };
  const quantitativeStats = { totalCount: 0, averageCount: 0, unitText: '' };

  // Process each entry
  for (const [date, entry] of entries) {
    const entryDate = moment(date);

    // Skip entries outside timeframe
    if (entryDate.isBefore(startDate) || entryDate.isAfter(endDate)) {
      continue;
    }

    // Check if flow is scheduled for this date
    const isScheduled = isFlowScheduledForDate(flow, entryDate);
    if (!isScheduled) continue;

    scheduledDays++;

    // Count status types
    switch (entry.symbol) {
      case '+':
        completed++;
        totalPoints += 10; // Base points for completion
        break;
      case '*':
        partial++;
        totalPoints += 5; // Partial points
        break;
      case '-':
        failed++;
        break;
      case '/':
        skipped++;
        break;
      default:
        inactive++;
        break;
    }

    // Add emotion bonus
    if (entry.emotion && includeEmotions) {
      const emotionScore = getEmotionScore(entry.emotion);
      emotionBonus += emotionScore;
      totalPoints += emotionScore;
    }

    // Count notes
    if (entry.note && includeNotes) {
      notesCount++;
      totalPoints += 2; // Bonus for notes
    }

    // Count cheat entries
    if (entry.cheatMode) {
      cheatEntriesCount++;
    }

    // Process time-based stats
    if (entry.timebased && flow.trackingType === 'Time-based') {
      const duration = entry.timebased.totalDuration || 0;
      timeBasedStats.totalDuration += duration;
      timeBasedStats.totalPauses += entry.timebased.pausesCount || 0;
    }

    // Process quantitative stats
    if (entry.quantitative && flow.trackingType === 'Quantitative') {
      const count = entry.quantitative.count || 0;
      quantitativeStats.totalCount += count;
      quantitativeStats.unitText = entry.quantitative.unitText || '';
    }
  }

  // Calculate averages
  if (scheduledDays > 0) {
    timeBasedStats.averageDuration = timeBasedStats.totalDuration / scheduledDays;
    quantitativeStats.averageCount = quantitativeStats.totalCount / scheduledDays;
  }

  // Calculate streaks
  const streaks = calculateStreaks(flow, startDate, endDate);
  currentStreak = streaks.current;
  longestStreak = streaks.longest;

  // Calculate completion rate
  const completionRate = scheduledDays > 0 ? ((completed + partial) / scheduledDays) * 100 : 0;

  // Add streak bonus
  const streakBonus = currentStreak * 2;
  totalPoints += streakBonus;

  return {
    completed,
    partial,
    failed,
    skipped,
    inactive,
    scheduledDays,
    currentStreak,
    longestStreak,
    completionRate,
    finalScore: totalPoints,
    emotionBonus,
    notesCount,
    cheatEntriesCount,
    streakBonus,
    timeBasedStats,
    quantitativeStats,
    timeframe,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    calculatedAt: moment().toISOString(),
  };
};

/**
 * Calculate emotion score based on emotion type
 */
const getEmotionScore = emotion => {
  const emotionScores = {
    'Big smile': 5,
    'Slightly smiling': 3,
    Neutral: 1,
    'Slightly worried': -1,
    Sad: -3,
  };
  return emotionScores[emotion] || 0;
};

/**
 * Calculate streaks for a flow
 */
const calculateStreaks = (flow, startDate, endDate) => {
  const entries = Object.entries(flow.status || {});
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort entries by date
  const sortedEntries = entries
    .filter(([date]) => {
      const entryDate = moment(date);
      return entryDate.isBetween(startDate, endDate, null, '[]');
    })
    .sort(([a], [b]) => moment(a).diff(moment(b)));

  // Calculate streaks
  for (const [date, entry] of sortedEntries) {
    const isScheduled = isFlowScheduledForDate(flow, moment(date));
    if (!isScheduled) continue;

    const isCompleted = entry.symbol === '+';

    if (isCompleted) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak is the streak ending today
  currentStreak = tempStreak;

  return { current: currentStreak, longest: longestStreak };
};

/**
 * Check if flow is scheduled for a specific date
 */
const isFlowScheduledForDate = (flow, date) => {
  const frequency = flow.frequency || 'Daily';

  if (frequency === 'Daily') {
    return (
      flow.everyDay ||
      (flow.daysOfWeek &&
        flow.daysOfWeek.length > 0 &&
        flow.daysOfWeek.includes(date.format('ddd')))
    );
  } else if (frequency === 'Monthly') {
    return flow.selectedMonthDays && flow.selectedMonthDays.includes(date.date().toString());
  }

  return true;
};

/**
 * Calculate emotion distribution
 */
const calculateEmotionDistribution = flow => {
  const emotionCounts = {
    'Big smile': 0,
    'Slightly smiling': 0,
    Neutral: 0,
    'Slightly worried': 0,
    Sad: 0,
  };

  if (flow.status && typeof flow.status === 'object') {
    Object.values(flow.status).forEach(entry => {
      if (entry.emotion && emotionCounts.hasOwnProperty(entry.emotion)) {
        emotionCounts[entry.emotion]++;
      }
    });
  }

  const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);

  return {
    totalEmotions,
    byEmotion: emotionCounts,
    distribution: Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count,
      percentage: totalEmotions > 0 ? (count / totalEmotions) * 100 : 0,
    })),
  };
};

/**
 * Get comprehensive activity statistics
 */
const getAllStats = async (request, reply) => {
  const { user } = request;
  const { timeframe = 'all', includeArchived = false, includeDeleted = false } = request.query;

  try {
    console.log('Getting all activity stats for user:', user.id);

    // Get user's flows
    const flows = await FlowModel.findByUserIdWithStatus(user.id, {
      archived: includeArchived === 'true',
    });

    if (flows.length === 0) {
      return reply.send({
        success: true,
        data: getDefaultStats(timeframe),
      });
    }

    // Calculate stats for each flow
    const flowSummaries = [];
    let totalCompleted = 0,
      totalPartial = 0,
      totalFailed = 0,
      totalSkipped = 0,
      totalInactive = 0;
    let totalPoints = 0,
      totalEmotionBonus = 0,
      totalNotesCount = 0,
      totalCheatEntries = 0;
    let totalScheduledDays = 0,
      longestStreak = 0;

    for (const flow of flows) {
      const stats = calculateFlowStats(flow, { timeframe });

      // Aggregate totals
      totalCompleted += stats.completed;
      totalPartial += stats.partial;
      totalFailed += stats.failed;
      totalSkipped += stats.skipped;
      totalInactive += stats.inactive;
      totalPoints += stats.finalScore;
      totalEmotionBonus += stats.emotionBonus;
      totalNotesCount += stats.notesCount;
      totalCheatEntries += stats.cheatEntriesCount;
      totalScheduledDays += stats.scheduledDays;
      longestStreak = Math.max(longestStreak, stats.longestStreak);

      // Add flow summary
      flowSummaries.push({
        flowId: flow.id,
        flowTitle: flow.title,
        flowType: flow.tracking_type,
        completed: stats.completed,
        partial: stats.partial,
        failed: stats.failed,
        skipped: stats.skipped,
        inactive: stats.inactive,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        completionRate: stats.completionRate,
        scheduledDays: stats.scheduledDays,
        points: stats.finalScore,
      });
    }

    // Calculate success metrics
    const totalSuccessfulDays = totalCompleted + totalPartial;
    const totalFailedDays = totalFailed + totalSkipped;
    const successRate =
      totalScheduledDays > 0 ? (totalSuccessfulDays / totalScheduledDays) * 100 : 0;
    const pureCompletionRate =
      totalScheduledDays > 0 ? (totalCompleted / totalScheduledDays) * 100 : 0;
    const partialSuccessRate =
      totalScheduledDays > 0 ? (totalPartial / totalScheduledDays) * 100 : 0;
    const failureRate = totalScheduledDays > 0 ? (totalFailed / totalScheduledDays) * 100 : 0;
    const skipRate = totalScheduledDays > 0 ? (totalSkipped / totalScheduledDays) * 100 : 0;

    // Generate weekly trends
    const weeklyTrends = generateWeeklyTrends(flows);

    // Generate achievements
    const achievements = generateAchievements(
      totalCompleted,
      longestStreak,
      successRate,
      flows.length
    );

    // Generate heat map data
    const heatMapData = generateHeatMapData(flows);

    const result = {
      totalFlows: flows.length,
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
        skipRate,
      },
      heatMapData,
      weeklyTrends,
      achievements,
      flowSummaries,
      calculatedAt: moment().toISOString(),
      timeframe,
    };

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getAllStats:', error);
    request.log.error(
      { error: error.message, userId: user.id },
      'Failed to get all activity stats'
    );
    throw new ConflictError('Failed to retrieve activity statistics');
  }
};

/**
 * Get scoreboard for specific flow
 */
const getScoreboard = async (request, reply) => {
  const { flowId } = request.params;
  const { user } = request;

  try {
    console.log('Getting scoreboard for flow:', flowId);

    const flow = await FlowModel.findByIdWithStatus(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id) {
      throw new ForbiddenError('You can only view scoreboard for your own flows');
    }

    const stats = calculateFlowStats(flow, { timeframe: 'all' });

    const scoreboard = {
      completed: stats.completed,
      partial: stats.partial,
      failed: stats.failed,
      skipped: stats.skipped,
      inactive: stats.inactive,
      streak: stats.currentStreak,
      streakBonus: stats.streakBonus,
      emotionBonus: stats.emotionBonus,
      notesCount: stats.notesCount,
      completionRate: stats.completionRate,
      finalScore: stats.finalScore,
      timeBasedStats: stats.timeBasedStats,
      quantitativeStats: stats.quantitativeStats,
    };

    return reply.send({
      success: true,
      data: scoreboard,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error in getScoreboard:', error);
    request.log.error({ error: error.message, flowId }, 'Failed to get scoreboard');
    throw new ConflictError('Failed to retrieve scoreboard');
  }
};

/**
 * Get activity stats for specific flow
 */
const getActivityStats = async (request, reply) => {
  const { flowId } = request.params;
  const { user } = request;

  try {
    console.log('Getting activity stats for flow:', flowId);

    const flow = await FlowModel.findByIdWithStatus(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id) {
      throw new ForbiddenError('You can only view activity stats for your own flows');
    }

    const stats = calculateFlowStats(flow, { timeframe: 'all' });

    const activityStats = {
      total: stats.scheduledDays,
      byStatus: {
        Completed: stats.completed,
        Partial: stats.partial,
        Missed: stats.failed,
        Inactive: stats.inactive,
        Skipped: stats.skipped,
      },
      timeBased: stats.timeBasedStats,
      quantitative: stats.quantitativeStats,
    };

    return reply.send({
      success: true,
      data: activityStats,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error in getActivityStats:', error);
    request.log.error({ error: error.message, flowId }, 'Failed to get activity stats');
    throw new ConflictError('Failed to retrieve activity statistics');
  }
};

/**
 * Get emotional activity data
 */
const getEmotionalActivity = async (request, reply) => {
  const { flowId } = request.params;
  const { user } = request;

  try {
    console.log('Getting emotional activity for flow:', flowId);

    const flow = await FlowModel.findByIdWithStatus(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id) {
      throw new ForbiddenError('You can only view emotional activity for your own flows');
    }

    const emotionData = calculateEmotionDistribution(flow);

    return reply.send({
      success: true,
      data: emotionData,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error in getEmotionalActivity:', error);
    request.log.error({ error: error.message, flowId }, 'Failed to get emotional activity');
    throw new ConflictError('Failed to retrieve emotional activity');
  }
};

/**
 * Get flow summary
 */
const getFlowSummary = async (request, reply) => {
  const { flowId } = request.params;
  const { user } = request;

  try {
    console.log('Getting flow summary for flow:', flowId);

    const flow = await FlowModel.findByIdWithStatus(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id) {
      throw new ForbiddenError('You can only view flow summary for your own flows');
    }

    const stats = calculateFlowStats(flow, { timeframe: 'all' });

    const flowSummary = {
      flowId: flow.id,
      flowTitle: flow.title,
      flowType: flow.tracking_type,
      completed: stats.completed,
      partial: stats.partial,
      failed: stats.failed,
      skipped: stats.skipped,
      inactive: stats.inactive,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      completionRate: stats.completionRate,
      scheduledDays: stats.scheduledDays,
      points: stats.finalScore,
    };

    return reply.send({
      success: true,
      data: flowSummary,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error in getFlowSummary:', error);
    request.log.error({ error: error.message, flowId }, 'Failed to get flow summary');
    throw new ConflictError('Failed to retrieve flow summary');
  }
};

/**
 * Update activity cache
 */
const updateActivityCache = async (request, reply) => {
  const { flowId } = request.params;
  const { dayKey, entry } = request.body;
  const { user } = request;

  try {
    console.log('Updating activity cache for flow:', flowId, 'day:', dayKey);

    const flow = await FlowModel.findByIdWithStatus(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id) {
      throw new ForbiddenError('You can only update activity cache for your own flows');
    }

    // Update the flow's status with the new entry
    const updatedFlow = await FlowModel.updateStatus(flowId, dayKey, entry);

    return reply.send({
      success: true,
      data: updatedFlow,
      message: 'Activity cache updated successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    console.error('Error in updateActivityCache:', error);
    request.log.error({ error: error.message, flowId, dayKey }, 'Failed to update activity cache');
    throw new ConflictError('Failed to update activity cache');
  }
};

/**
 * Sync activity cache with backend
 */
const syncActivityCache = async (request, reply) => {
  const { user } = request;
  const { activityCache, metadata, lastSync, version } = request.body;

  try {
    console.log('Syncing activity cache for user:', user.id);

    // Store activity cache in user settings
    await FlowModel.updateUserSettings(user.id, {
      activityCache: {
        activityCache,
        metadata,
        lastSync,
        version,
      },
    });

    return reply.send({
      success: true,
      data: { lastSync: moment().toISOString() },
      message: 'Activity cache synced successfully',
    });
  } catch (error) {
    console.error('Error in syncActivityCache:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to sync activity cache');
    throw new ConflictError('Failed to sync activity cache');
  }
};

/**
 * Get cache status
 */
const getCacheStatus = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Getting cache status for user:', user.id);

    // Get user settings to check cache status
    const userSettings = await FlowModel.getUserSettings(user.id);
    const activityCache = userSettings?.activityCache || {};

    const cacheStatus = {
      isInitialized: true,
      totalFlows: Object.keys(activityCache.activityCache || {}).length,
      totalEntries: Object.values(activityCache.activityCache || {}).reduce(
        (sum, flowCache) =>
          sum + (flowCache.dailyEntries ? Object.keys(flowCache.dailyEntries).length : 0),
        0
      ),
      lastFullRebuild: activityCache.metadata?.lastFullRebuild,
      version: activityCache.version || '1.0.0',
      cacheSize: JSON.stringify(activityCache.activityCache || {}).length,
      lastSync: activityCache.lastSync,
    };

    return reply.send({
      success: true,
      data: cacheStatus,
    });
  } catch (error) {
    console.error('Error in getCacheStatus:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get cache status');
    throw new ConflictError('Failed to retrieve cache status');
  }
};

/**
 * Clear activity cache
 */
const clearActivityCache = async (request, reply) => {
  const { user } = request;

  try {
    console.log('Clearing activity cache for user:', user.id);

    // Clear activity cache from user settings
    await FlowModel.updateUserSettings(user.id, {
      activityCache: null,
    });

    return reply.send({
      success: true,
      message: 'Activity cache cleared successfully',
    });
  } catch (error) {
    console.error('Error in clearActivityCache:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to clear activity cache');
    throw new ConflictError('Failed to clear activity cache');
  }
};

// Helper functions
const generateWeeklyTrends = flows => {
  const trends = [];
  const now = moment();

  for (let i = 6; i >= 0; i--) {
    const date = now.clone().subtract(i, 'days');
    const dayKey = date.format('YYYY-MM-DD');

    let dayCompleted = 0,
      dayScheduled = 0;

    for (const flow of flows) {
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
      scheduled: dayScheduled,
    });
  }

  return trends;
};

const generateAchievements = (totalCompleted, longestStreak, successRate, totalFlows) => {
  const achievements = [];

  if (totalCompleted >= 1) {
    achievements.push({
      title: 'Getting Started',
      description: 'Completed your first activity',
      icon: '🎯',
      color: '#4CAF50',
      progress: totalCompleted,
      target: 1,
    });
  }
  if (totalCompleted >= 5) {
    achievements.push({
      title: 'Building Momentum',
      description: 'Completed 5+ activities',
      icon: '⚡',
      color: '#2196F3',
      progress: totalCompleted,
      target: 5,
    });
  }
  if (totalCompleted >= 10) {
    achievements.push({
      title: 'Consistent Performer',
      description: 'Completed 10+ activities',
      icon: '🌟',
      color: '#FF9800',
      progress: totalCompleted,
      target: 10,
    });
  }
  if (longestStreak >= 3) {
    achievements.push({
      title: 'Streak Starter',
      description: '3+ day streak',
      icon: '🔥',
      color: '#FF6B35',
      progress: longestStreak,
      target: 3,
    });
  }
  if (longestStreak >= 7) {
    achievements.push({
      title: 'Week Warrior',
      description: '7+ day streak',
      icon: '💪',
      color: '#9C27B0',
      progress: longestStreak,
      target: 7,
    });
  }
  if (successRate >= 50) {
    achievements.push({
      title: 'Halfway There',
      description: '50%+ success rate',
      icon: '📈',
      color: '#00BCD4',
      progress: Math.round(successRate),
      target: 50,
    });
  }
  if (totalCompleted >= 100) {
    achievements.push({
      title: 'Century Club',
      description: 'Completed 100+ activities',
      icon: '🏆',
      color: '#FFD700',
      progress: totalCompleted,
      target: 100,
    });
  }
  if (longestStreak >= 30) {
    achievements.push({
      title: 'Month Master',
      description: '30+ day streak',
      icon: '🔥',
      color: '#FF6B35',
      progress: longestStreak,
      target: 30,
    });
  }
  if (successRate >= 80) {
    achievements.push({
      title: 'Consistency King',
      description: '80%+ success rate',
      icon: '👑',
      color: '#4CAF50',
      progress: Math.round(successRate),
      target: 80,
    });
  }

  return achievements;
};

const generateHeatMapData = flows => {
  const heatMapData = {};
  const currentMonth = moment().startOf('month');
  const startOfMonth = currentMonth.clone().startOf('month');
  const endOfMonth = currentMonth.clone().endOf('month');

  for (let date = startOfMonth.clone(); date.isSameOrBefore(endOfMonth); date.add(1, 'day')) {
    const dayKey = date.format('YYYY-MM-DD');
    let count = 0;

    for (const flow of flows) {
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
};

const getDefaultStats = (timeframe = 'all') => ({
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
    skipRate: 0,
  },
  heatMapData: {},
  weeklyTrends: [],
  achievements: [],
  flowSummaries: [],
  calculatedAt: moment().toISOString(),
  timeframe,
});

module.exports = {
  getAllStats,
  getScoreboard,
  getActivityStats,
  getEmotionalActivity,
  getFlowSummary,
  updateActivityCache,
  syncActivityCache,
  getCacheStatus,
  clearActivityCache,
};
