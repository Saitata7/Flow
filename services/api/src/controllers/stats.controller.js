const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { StatsModel, FlowModel, FlowEntryModel, UserProfileModel } = require('../db/models');

// Business logic: Calculate user streak statistics
const calculateUserStreaks = async (userId) => {
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
const calculateFlowStreaks = (entries) => {
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
  let expectedDate = new Date(today);
  
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    
    if (entry.symbol === '✓') {
      completedEntries++;
      
      // Check if this entry continues the streak
      if (entryDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0])) {
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
    const flow = await FlowModel.findById(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }
    
    if (flow.owner_id !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
      throw new ForbiddenError('Access denied to this flow');
    }
    
    // Get all entries for this flow
    const entries = await FlowEntryModel.findByFlowId(flowId);
    
    // Calculate statistics
    const stats = calculateFlowStreaks(entries);
    
    // Additional calculations
    const totalEntries = entries.length;
    const skippedEntries = entries.filter(entry => entry.symbol === '✗').length;
    const bonusEntries = entries.filter(entry => entry.symbol === '+').length;
    
    // Calculate average mood score
    const moodEntries = entries.filter(entry => entry.mood_score);
    const averageMoodScore = moodEntries.length > 0 
      ? moodEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / moodEntries.length
      : null;
    
    // Calculate completion rate
    const completionRate = totalEntries > 0 ? (stats.completedEntries / totalEntries) * 100 : 0;
    
    const flowStats = {
      ...stats,
      totalEntries,
      skippedEntries,
      bonusEntries,
      averageMoodScore: averageMoodScore ? Math.round(averageMoodScore * 100) / 100 : null,
      completionRate: Math.round(completionRate * 100) / 100,
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
        const completed = dayEntries.filter(entry => entry.symbol === '✓').length;
        const total = dayEntries.length;
        const averageMood = dayEntries
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

module.exports = {
  getUserStats,
  getLeaderboard,
  getFlowStats,
  getTrends,
  getGlobalStats,
};
