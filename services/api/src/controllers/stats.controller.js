const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { StatsModel, FlowModel, FlowEntryModel, UserProfileModel } = require('../db/models');

// Business logic: Calculate user streak statistics
const calculateUserStreaks = async userId => {
  try {
    // Get all user's flows
    const flows = await FlowModel.findByUserId(userId);

    let totalCurrentStreak = 0;
    let longestStreak = 0;
    let totalCompletedEntries = 0;
    let totalEntries = 0;

    for (const flow of flows) {
      // Get all entries for this flow
      const entries = await FlowEntryModel.findByFlowId(flow.id);

      if (entries.length === 0) continue;

      // Calculate streaks for this flow
      const flowStats = calculateFlowStreaks(entries);

      totalCurrentStreak += flowStats.currentStreak;
      longestStreak = Math.max(longestStreak, flowStats.longestStreak);
      totalCompletedEntries += flowStats.completedEntries;
      totalEntries += entries.length;
    }

    return {
      currentStreak: totalCurrentStreak,
      longestStreak,
      totalCompletedEntries,
      totalEntries,
      completionRate: totalEntries > 0 ? (totalCompletedEntries / totalEntries) * 100 : 0,
    };
  } catch (error) {
    console.error('Error calculating user streaks:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedEntries: 0,
      totalEntries: 0,
      completionRate: 0,
    };
  }
};

// Business logic: Calculate streaks for a single flow
const calculateFlowStreaks = entries => {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completedEntries: 0 };
  }

  // Sort entries by date (newest first)
  const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let completedEntries = 0;

  const today = new Date().toISOString().split('T')[0];
  const expectedDate = new Date(today);

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);

    if (entry.symbol === '+') {
      completedEntries++;

      // Check if this entry continues the streak
      if (entryDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        tempStreak++;
        currentStreak = Math.max(currentStreak, tempStreak);
      } else {
        tempStreak = 1;
        currentStreak = Math.max(currentStreak, tempStreak);
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      // Streak broken
      tempStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    completedEntries,
  };
};

// Get user statistics
const getUserStats = async (request, reply) => {
  const { userId } = request.params;
  const { user } = request;

  try {
    // Check if user can access these stats
    if (userId !== user.id && user.role !== 'admin') {
      // Check if the target user's profile is public
      const targetProfile = await UserProfileModel.findByUserId(userId);
      if (!targetProfile || !targetProfile.visibility?.stats) {
        throw new ForbiddenError('Access denied to user statistics');
      }
    }

    // Get basic stats from database
    const basicStats = await StatsModel.getUserStats(userId);

    // Calculate streak statistics
    const streakStats = await calculateUserStreaks(userId);

    // Get user profile for additional info
    const profile = await UserProfileModel.findByUserId(userId);

    const stats = {
      ...basicStats,
      ...streakStats,
      joinDate: profile?.created_at || null,
      username: profile?.username || null,
      displayName: profile?.display_name || null,
    };

    // Cache stats in Redis
    if (request.server.redis) {
      await request.server.redis.set(`stats:${userId}`, stats, 3600); // 1 hour TTL
    }

    return reply.send({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, userId }, 'Failed to get user stats');
    throw new NotFoundError('Failed to retrieve user statistics');
  }
};

// Get leaderboard
const getLeaderboard = async (request, reply) => {
  const { type = 'streak', timeframe = 'month', limit = 50 } = request.query;

  try {
    // Try Redis cache first
    const cacheKey = `leaderboard:${type}:${timeframe}`;
    let leaderboard = null;

    if (request.server.redis) {
      leaderboard = await request.server.redis.get(cacheKey);
    }

    // Fallback to database
    if (!leaderboard) {
      leaderboard = await StatsModel.getLeaderboard({ type, timeframe, limit });

      // Cache the result
      if (leaderboard && request.server.redis) {
        await request.server.redis.set(cacheKey, leaderboard, 86400); // 24 hours TTL
      }
    }

    return reply.send({
      success: true,
      data: leaderboard,
      meta: {
        type,
        timeframe,
        limit: parseInt(limit),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error({ error: error.message, type, timeframe }, 'Failed to get leaderboard');
    throw new NotFoundError('Failed to retrieve leaderboard');
  }
};

// Get flow statistics
const getFlowStats = async (request, reply) => {
  const { flowId } = request.params;
  const { user } = request;

  try {
    // Check if flow exists and user has access
    const flow = await FlowModel.findByIdWithStatus(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
      throw new ForbiddenError('Access denied to this flow');
    }

    // Calculate statistics from flow status (mobile app compatible)
    const status = flow.status || {};
    console.log('Stats calculation - flow status:', JSON.stringify(status, null, 2));
    const entries = Object.entries(status).map(([date, entryData]) => ({
      date,
      symbol: entryData.symbol,
      mood_score: entryData.moodScore || entryData.mood_score,
      emotion: entryData.emotion,
      note: entryData.note,
      quantitative: entryData.quantitative,
      timebased: entryData.timebased,
    }));
    console.log('Stats calculation - entries:', entries.length, entries);

    // Calculate basic statistics
    const totalEntries = entries.length;
    const completedEntries = entries.filter(entry => entry.symbol === '+').length;
    const partialEntries = entries.filter(entry => entry.symbol === '*').length;
    const missedEntries = entries.filter(entry => entry.symbol === '-').length;
    const skippedEntries = entries.filter(entry => entry.symbol === '/').length;

    // Calculate streaks
    const currentStreak = calculateCurrentStreak(entries);
    const longestStreak = calculateLongestStreak(entries);

    // Calculate average mood score
    const moodEntries = entries.filter(entry => entry.mood_score);
    const averageMoodScore =
      moodEntries.length > 0
        ? moodEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / moodEntries.length
        : null;

    // Calculate completion rate
    const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;

    // Calculate points (simplified scoring system)
    const totalPoints = (completedEntries * 10) + (partialEntries * 5);

    // Calculate time-based stats if applicable
    let timeBasedStats = null;
    if (flow.tracking_type === 'Time-based') {
      const timeBasedEntries = entries.filter(entry => entry.timebased);
      const totalDuration = timeBasedEntries.reduce((sum, entry) => {
        return sum + (entry.timebased?.totalDuration || 0);
      }, 0);
      
      timeBasedStats = {
        totalDuration,
        averageDuration: timeBasedEntries.length > 0 ? totalDuration / timeBasedEntries.length : 0,
        totalSessions: timeBasedEntries.length,
        totalPauses: timeBasedEntries.reduce((sum, entry) => {
          return sum + (entry.timebased?.pausesCount || 0);
        }, 0)
      };
    }

    // Calculate quantitative stats if applicable
    let quantitativeStats = null;
    if (flow.tracking_type === 'Quantitative') {
      const quantitativeEntries = entries.filter(entry => entry.quantitative);
      const totalCount = quantitativeEntries.reduce((sum, entry) => {
        return sum + (entry.quantitative?.count || 0);
      }, 0);
      
      quantitativeStats = {
        totalCount,
        averageCount: quantitativeEntries.length > 0 ? totalCount / quantitativeEntries.length : 0,
        totalSessions: quantitativeEntries.length,
        goal: flow.goal || 1,
        unitText: flow.unit_text || ''
      };
    }

    // Return data structure matching frontend expectations
    const flowStats = {
      // Basic stats
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak,
      longestStreak,
      totalCompleted: completedEntries,
      totalScheduled: totalEntries,
      totalPoints,
      
      // Additional stats for compatibility
      totalEntries,
      completedEntries,
      partialEntries,
      missedEntries,
      skippedEntries,
      averageMoodScore: averageMoodScore ? Math.round(averageMoodScore * 100) / 100 : null,
      
      // Flow-specific stats
      timeBasedStats,
      quantitativeStats,
      
      // Flow metadata
      flowId: flow.id,
      flowTitle: flow.title,
      flowType: flow.tracking_type,
      createdAt: flow.created_at,
      updatedAt: flow.updated_at
    };

    // Cache stats in Redis
    if (request.server.redis) {
      await request.server.redis.set(`flow:${flowId}:stats`, flowStats, 1800); // 30 minutes TTL
    }

    return reply.send({
      success: true,
      data: flowStats,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId }, 'Failed to get flow stats');
    throw new NotFoundError('Failed to retrieve flow statistics');
  }
};

// Get trends data
const getTrends = async (request, reply) => {
  const { flowId, startDate, endDate } = request.query;
  const { user } = request;

  try {
    let flows = [];

    if (flowId) {
      // Get stats for specific flow
      const flow = await FlowModel.findById(flowId);
      if (!flow) {
        throw new NotFoundError('Flow');
      }

      if (flow.owner_id !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
        throw new ForbiddenError('Access denied to this flow');
      }

      flows = [flow];
    } else {
      // Get stats for all user's flows
      flows = await FlowModel.findByUserId(user.id);
    }

    const trends = [];

    for (const flow of flows) {
      const entries = await FlowEntryModel.findByFlowId(flow.id, {
        startDate,
        endDate,
      });

      // Group entries by date
      const entriesByDate = {};
      entries.forEach(entry => {
        const date = entry.date;
        if (!entriesByDate[date]) {
          entriesByDate[date] = [];
        }
        entriesByDate[date].push(entry);
      });

      // Calculate daily stats
      const dailyStats = Object.entries(entriesByDate).map(([date, dayEntries]) => {
        const completed = dayEntries.filter(entry => entry.symbol === '+').length;
        const total = dayEntries.length;
        const averageMood =
          dayEntries
            .filter(entry => entry.mood_score)
            .reduce((sum, entry) => sum + entry.mood_score, 0) /
            dayEntries.filter(entry => entry.mood_score).length || null;

        return {
          date,
          completed,
          total,
          completionRate: total > 0 ? (completed / total) * 100 : 0,
          averageMood: averageMood ? Math.round(averageMood * 100) / 100 : null,
        };
      });

      trends.push({
        flowId: flow.id,
        flowTitle: flow.title,
        flowType: flow.tracking_type,
        dailyStats: dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date)),
      });
    }

    return reply.send({
      success: true,
      data: trends,
      meta: {
        startDate,
        endDate,
        flowCount: trends.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get trends');
    throw new NotFoundError('Failed to retrieve trends data');
  }
};

// Get global statistics (admin only)
const getGlobalStats = async (request, reply) => {
  const { user } = request;

  try {
    // Check admin permissions
    if (user.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    // Try Redis cache first
    const cacheKey = 'global:stats';
    let globalStats = null;

    if (request.server.redis) {
      globalStats = await request.server.redis.get(cacheKey);
    }

    // Fallback to database calculation
    if (!globalStats) {
      // This would require additional database queries to calculate
      // For now, return placeholder data
      globalStats = {
        totalUsers: 0,
        totalFlows: 0,
        totalEntries: 0,
        activeUsers: 0,
        averageCompletionRate: 0,
        topFlows: [],
        recentActivity: [],
      };

      // Cache the result
      if (request.server.redis) {
        await request.server.redis.set(cacheKey, globalStats, 3600); // 1 hour TTL
      }
    }

    return reply.send({
      success: true,
      data: globalStats,
      meta: {
        generatedAt: new Date().toISOString(),
        cached: !!globalStats,
      },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message }, 'Failed to get global stats');
    throw new NotFoundError('Failed to retrieve global statistics');
  }
};

// Get flow scoreboard data (for OptimizedActivityContext)
const getFlowScoreboard = async (request, reply) => {
  const { flowId } = request.params;
  const { timeframe = 'weekly' } = request.query;
  const { user } = request;

  try {
    // Get flow stats using existing function
    const flowStats = await getFlowStatsData(flowId, user);
    
    // Return data in the format expected by frontend
    const scoreboardData = {
      completionRate: flowStats.completionRate,
      currentStreak: flowStats.currentStreak,
      longestStreak: flowStats.longestStreak,
      totalCompleted: flowStats.totalCompleted,
      totalScheduled: flowStats.totalScheduled,
      totalPoints: flowStats.totalPoints,
      timeBasedStats: flowStats.timeBasedStats,
      quantitativeStats: flowStats.quantitativeStats,
    };

    return reply.send({
      success: true,
      data: scoreboardData,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId }, 'Failed to get flow scoreboard');
    throw new NotFoundError('Failed to retrieve flow scoreboard');
  }
};

// Get flow activity stats (for OptimizedActivityContext)
const getFlowActivityStats = async (request, reply) => {
  const { flowId } = request.params;
  const { timeframe = 'weekly' } = request.query;
  const { user } = request;

  try {
    // Get flow stats using existing function
    const flowStats = await getFlowStatsData(flowId, user);
    
    // Return data in the format expected by frontend
    const activityStats = {
      total: flowStats.totalScheduled,
      byStatus: {
        Completed: flowStats.totalCompleted,
        Partial: flowStats.partialEntries,
        Missed: flowStats.missedEntries,
        Inactive: 0, // Not tracked in current system
        Skipped: flowStats.skippedEntries,
      },
      timeBased: flowStats.timeBasedStats,
      quantitative: flowStats.quantitativeStats,
    };

    return reply.send({
      success: true,
      data: activityStats,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId }, 'Failed to get flow activity stats');
    throw new NotFoundError('Failed to retrieve flow activity stats');
  }
};

// Get flow emotional activity (for OptimizedActivityContext)
const getFlowEmotionalActivity = async (request, reply) => {
  const { flowId } = request.params;
  const { timeframe = 'weekly' } = request.query;
  const { user } = request;

  try {
    // Get flow and calculate emotional data
    const flow = await FlowModel.findByIdWithStatus(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
      throw new ForbiddenError('Access denied to this flow');
    }

    const status = flow.status || {};
    const entries = Object.entries(status).map(([date, entryData]) => ({
      date,
      emotion: entryData.emotion,
      mood_score: entryData.moodScore || entryData.mood_score,
    }));

    // Calculate emotion distribution
    const emotionDistribution = {};
    let totalMoodScore = 0;
    let moodEntries = 0;

    entries.forEach(entry => {
      if (entry.emotion) {
        emotionDistribution[entry.emotion] = (emotionDistribution[entry.emotion] || 0) + 1;
      }
      if (entry.mood_score) {
        totalMoodScore += entry.mood_score;
        moodEntries++;
      }
    });

    const emotionalData = {
      emotionDistribution,
      averageMoodScore: moodEntries > 0 ? Math.round((totalMoodScore / moodEntries) * 100) / 100 : 0,
      totalEntries: entries.length,
    };

    return reply.send({
      success: true,
      data: emotionalData,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId }, 'Failed to get flow emotional activity');
    throw new NotFoundError('Failed to retrieve flow emotional activity');
  }
};

// Helper function to get flow stats data (extracted from getFlowStats)
const getFlowStatsData = async (flowId, user) => {
  const flow = await FlowModel.findByIdWithStatus(flowId);
  if (!flow) {
    throw new NotFoundError('Flow');
  }

  if (flow.owner_id !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
    throw new ForbiddenError('Access denied to this flow');
  }

  // Calculate statistics from flow status
  const status = flow.status || {};
  const entries = Object.entries(status).map(([date, entryData]) => ({
    date,
    symbol: entryData.symbol,
    mood_score: entryData.moodScore || entryData.mood_score,
    emotion: entryData.emotion,
    note: entryData.note,
    quantitative: entryData.quantitative,
    timebased: entryData.timebased,
  }));

  // Calculate basic statistics
  const totalEntries = entries.length;
  const completedEntries = entries.filter(entry => entry.symbol === '+').length;
  const partialEntries = entries.filter(entry => entry.symbol === '*').length;
  const missedEntries = entries.filter(entry => entry.symbol === '-').length;
  const skippedEntries = entries.filter(entry => entry.symbol === '/').length;

  // Calculate streaks
  const currentStreak = calculateCurrentStreak(entries);
  const longestStreak = calculateLongestStreak(entries);

  // Calculate completion rate
  const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;

  // Calculate points
  const totalPoints = (completedEntries * 10) + (partialEntries * 5);

  // Calculate time-based stats if applicable
  let timeBasedStats = null;
  if (flow.tracking_type === 'Time-based') {
    const timeBasedEntries = entries.filter(entry => entry.timebased);
    const totalDuration = timeBasedEntries.reduce((sum, entry) => {
      return sum + (entry.timebased?.totalDuration || 0);
    }, 0);
    
    timeBasedStats = {
      totalDuration,
      averageDuration: timeBasedEntries.length > 0 ? totalDuration / timeBasedEntries.length : 0,
      totalSessions: timeBasedEntries.length,
      totalPauses: timeBasedEntries.reduce((sum, entry) => {
        return sum + (entry.timebased?.pausesCount || 0);
      }, 0)
    };
  }

  // Calculate quantitative stats if applicable
  let quantitativeStats = null;
  if (flow.tracking_type === 'Quantitative') {
    const quantitativeEntries = entries.filter(entry => entry.quantitative);
    const totalCount = quantitativeEntries.reduce((sum, entry) => {
      return sum + (entry.quantitative?.count || 0);
    }, 0);
    
    quantitativeStats = {
      totalCount,
      averageCount: quantitativeEntries.length > 0 ? totalCount / quantitativeEntries.length : 0,
      totalSessions: quantitativeEntries.length,
      goal: flow.goal || 1,
      unitText: flow.unit_text || ''
    };
  }

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    currentStreak,
    longestStreak,
    totalCompleted: completedEntries,
    totalScheduled: totalEntries,
    totalPoints,
    partialEntries,
    missedEntries,
    skippedEntries,
    timeBasedStats,
    quantitativeStats,
  };
};

// Helper functions for streak calculations
const calculateCurrentStreak = entries => {
  if (entries.length === 0) return 0;

  // Sort entries by date (newest first)
  const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  let streak = 0;
  let currentDate = new Date();

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    const dayDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === streak && entry.symbol === '+') {
      streak++;
      currentDate = entryDate;
    } else {
      break;
    }
  }

  return streak;
};

const calculateLongestStreak = entries => {
  if (entries.length === 0) return 0;

  // Sort entries by date (oldest first)
  const sortedEntries = entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate = null;

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);

    if (entry.symbol === '+') {
      if (lastDate === null || Math.floor((entryDate - lastDate) / (1000 * 60 * 60 * 24)) === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
      lastDate = entryDate;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 0;
      lastDate = null;
    }
  }

  return Math.max(longestStreak, currentStreak);
};

module.exports = {
  getUserStats,
  getLeaderboard,
  getFlowStats,
  getFlowScoreboard,
  getFlowActivityStats,
  getFlowEmotionalActivity,
  getTrends,
  getGlobalStats,
};
