import moment from 'moment';

/**
 * Stats Service - Analytics and Statistics Calculations
 * 
 * This service provides comprehensive analytics for flow tracking data,
 * following the established architecture patterns and data models.
 */

class StatsService {
  /**
   * Calculate comprehensive statistics for all flows
   * @param {Array} flows - Array of flow objects from FlowContext
   * @param {Object} options - Calculation options
   * @returns {Object} Comprehensive stats object
   */
  calculateOverallStats(flows, options = {}) {
    const {
      timeframe = 'weekly', // weekly, monthly, yearly
      includeArchived = false,
      includeDeleted = false
    } = options;

    // Filter flows based on options
    let filteredFlows = flows.filter(flow => {
      if (!includeDeleted && flow.deletedAt) return false;
      if (!includeArchived && flow.archived) return false;
      return true;
    });

    const startDate = this.getStartDateForTimeframe(timeframe);
    const endDate = moment();

    // Calculate overall metrics
    const overallStats = this.calculateOverallMetrics(filteredFlows, startDate, endDate);
    
    // Calculate flow-specific performance
    const flowPerformance = this.calculateFlowPerformance(filteredFlows, startDate, endDate);
    
    // Calculate weekly trends
    const weeklyTrends = this.calculateWeeklyTrends(filteredFlows, startDate, endDate);
    
    // Calculate achievements
    const achievements = this.calculateAchievements(filteredFlows, startDate, endDate);
    
    // Calculate heat map data
    const heatMapData = this.calculateHeatMapData(filteredFlows, options.currentMonth || moment().startOf('month'));

    return {
      overall: overallStats,
      flowPerformance,
      weeklyTrends,
      achievements,
      heatMapData,
      timeframe,
      calculatedAt: moment().toISOString()
    };
  }

  /**
   * Calculate statistics for a specific flow
   * @param {Object} flow - Flow object
   * @param {Object} options - Calculation options
   * @returns {Object} Flow-specific stats
   */
  calculateFlowStats(flow, options = {}) {
    const {
      timeframe = 'weekly',
      selectedPeriod = 'weekly',
      selectedYear = moment().year()
    } = options;

    const startDate = this.getStartDateForTimeframe(timeframe);
    const endDate = moment();

    // Calculate flow-specific metrics
    const metrics = this.calculateFlowMetrics(flow, startDate, endDate);
    
    // Calculate streaks
    const streaks = this.calculateStreaks(flow, startDate, endDate);
    
    // Calculate completion rates
    const completionRates = this.calculateCompletionRates(flow, startDate, endDate);
    
    // Calculate trends
    const trends = this.calculateFlowTrends(flow, startDate, endDate);

    return {
      flowId: flow.id,
      flowTitle: flow.title,
      trackingType: flow.trackingType,
      metrics,
      streaks,
      completionRates,
      trends,
      timeframe,
      calculatedAt: moment().toISOString()
    };
  }

  /**
   * Get start date based on timeframe
   * @param {string} timeframe - weekly, monthly, yearly
   * @returns {moment} Start date
   */
  getStartDateForTimeframe(timeframe) {
    switch (timeframe) {
      case 'weekly':
        return moment().subtract(7, 'days');
      case 'monthly':
        return moment().subtract(30, 'days');
      case 'yearly':
        return moment().subtract(1, 'year');
      default:
        return moment().subtract(7, 'days');
    }
  }

  /**
   * Calculate overall metrics across all flows
   * @param {Array} flows - Array of flows
   * @param {moment} startDate - Start date for calculation
   * @param {moment} endDate - End date for calculation
   * @returns {Object} Overall metrics
   */
  calculateOverallMetrics(flows, startDate, endDate) {
    let totalCompleted = 0;
    let totalScheduled = 0;
    let totalPoints = 0;
    let totalFlows = flows.length;
    let activeFlows = 0;

    const dailyData = [];
    const currentDate = startDate.clone();

    // Generate daily data
    while (currentDate.isSameOrBefore(endDate)) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      let dayCompleted = 0;
      let dayScheduled = 0;

      flows.forEach(flow => {
        const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
        
        if (isScheduled) {
          dayScheduled++;
          
          const status = flow.status?.[dayKey];
          if (status?.symbol === '+') {
            dayCompleted++;
          }
        }
      });
      
      // Add to totals after processing all flows for the day
      totalScheduled += dayScheduled;
      totalCompleted += dayCompleted;
      
      // Calculate points for completed flows
      flows.forEach(flow => {
        const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
        if (isScheduled) {
          const status = flow.status?.[dayKey];
          if (status?.symbol === '+') {
            totalPoints += this.calculatePointsForCompletion(flow, status);
          }
        }
      });

      dailyData.push({
        date: currentDate.format('YYYY-MM-DD'),
        displayDate: currentDate.format('MMM DD'),
        completed: dayCompleted,
        scheduled: dayScheduled,
        percentage: dayScheduled > 0 ? (dayCompleted / dayScheduled) * 100 : 0
      });

      currentDate.add(1, 'day');
    }

    // Calculate active flows (flows with at least one completion in timeframe)
    activeFlows = flows.filter(flow => {
      const currentDate = startDate.clone();
      while (currentDate.isSameOrBefore(endDate)) {
        const dayKey = currentDate.format('YYYY-MM-DD');
        const status = flow.status?.[dayKey];
        if (status?.symbol === '+') {
          return true;
        }
        currentDate.add(1, 'day');
      }
      return false;
    }).length;

    const successRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
    const avgDailyCompletion = dailyData.length > 0 
      ? dailyData.reduce((sum, day) => sum + day.percentage, 0) / dailyData.length 
      : 0;

    return {
      totalCompleted,
      totalScheduled,
      totalPoints,
      totalFlows,
      activeFlows,
      successRate,
      avgDailyCompletion,
      dailyData
    };
  }

  /**
   * Calculate performance metrics for each flow
   * @param {Array} flows - Array of flows
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Array} Flow performance array
   */
  calculateFlowPerformance(flows, startDate, endDate) {
    return flows.map(flow => {
      let completed = 0;
      let scheduled = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      const currentDate = startDate.clone();
      while (currentDate.isSameOrBefore(endDate)) {
        const dayKey = currentDate.format('YYYY-MM-DD');
        const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
        
        if (isScheduled) {
          scheduled++;
          const status = flow.status?.[dayKey];
          
          if (status?.symbol === '+') {
            completed++;
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }
        
        currentDate.add(1, 'day');
      }

      // Calculate current streak (from today backwards)
      currentStreak = this.calculateCurrentStreak(flow);

      const performance = scheduled > 0 ? (completed / scheduled) * 100 : 0;

      return {
        id: flow.id,
        name: flow.title,
        performance,
        completed,
        scheduled,
        currentStreak,
        bestStreak,
        type: flow.trackingType,
        goal: flow.goal,
        tags: flow.tags || []
      };
    });
  }

  /**
   * Calculate weekly trends data
   * @param {Array} flows - Array of flows
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Array} Weekly trends data
   */
  calculateWeeklyTrends(flows, startDate, endDate) {
    const weeklyData = [];
    const currentDate = startDate.clone();

    while (currentDate.isSameOrBefore(endDate)) {
      const weekStart = currentDate.clone().startOf('week');
      const weekEnd = currentDate.clone().endOf('week');
      
      let weekCompleted = 0;
      let weekScheduled = 0;

      const dayDate = weekStart.clone();
      while (dayDate.isSameOrBefore(weekEnd) && dayDate.isSameOrBefore(endDate)) {
        const dayKey = dayDate.format('YYYY-MM-DD');
        
        flows.forEach(flow => {
          const isScheduled = this.isFlowScheduledForDate(flow, dayDate);
          
          if (isScheduled) {
            weekScheduled++;
            const status = flow.status?.[dayKey];
            if (status?.symbol === '+') {
              weekCompleted++;
            }
          }
        });
        
        dayDate.add(1, 'day');
      }

      weeklyData.push({
        weekStart: weekStart.format('YYYY-MM-DD'),
        weekEnd: weekEnd.format('YYYY-MM-DD'),
        displayWeek: weekStart.format('MMM DD'),
        completed: weekCompleted,
        scheduled: weekScheduled,
        percentage: weekScheduled > 0 ? (weekCompleted / weekScheduled) * 100 : 0
      });

      currentDate.add(1, 'week');
    }

    return weeklyData;
  }

  /**
   * Calculate achievements based on flow data
   * @param {Array} flows - Array of flows
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Array} Achievements array
   */
  calculateAchievements(flows, startDate, endDate) {
    const achievements = [];

    // Calculate total completions across all flows
    let totalCompletions = 0;
    let bestStreak = 0;
    let currentStreak = 0;

    flows.forEach(flow => {
      const currentDate = startDate.clone();
      let tempStreak = 0;
      
      while (currentDate.isSameOrBefore(endDate)) {
        const dayKey = currentDate.format('YYYY-MM-DD');
        const status = flow.status?.[dayKey];
        
        if (status?.symbol === '+') {
          totalCompletions++;
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
        
        currentDate.add(1, 'day');
      }
    });

    // Century Club Achievement
    achievements.push({
      id: 'century-club',
      title: 'Century Club',
      description: 'Complete 100 flow entries',
      icon: '🏆',
      progress: totalCompletions,
      target: 100,
      completed: totalCompletions >= 100,
      color: '#4CAF50'
    });

    // Month Master Achievement
    achievements.push({
      id: 'month-master',
      title: 'Month Master',
      description: 'Achieve a 30-day streak',
      icon: '🔥',
      progress: bestStreak,
      target: 30,
      completed: bestStreak >= 30,
      color: '#FF9800'
    });

    // Consistency King Achievement
    const successRate = this.calculateOverallMetrics(flows, startDate, endDate).successRate;
    achievements.push({
      id: 'consistency-king',
      title: 'Consistency King',
      description: 'Maintain 80% success rate',
      icon: '👑',
      progress: parseFloat(successRate.toFixed(2)),
      target: 80,
      completed: successRate >= 80,
      color: '#2196F3'
    });

    // Flow Master Achievement
    achievements.push({
      id: 'flow-master',
      title: 'Flow Master',
      description: 'Track 5 different flows',
      icon: '⭐',
      progress: flows.length,
      target: 5,
      completed: flows.length >= 5,
      color: '#FF9500'
    });

    return achievements;
  }

  /**
   * Calculate heat map data for monthly view
   * @param {Array} flows - Array of flows
   * @param {moment} month - Month to calculate for
   * @returns {Object} Heat map data
   */
  calculateHeatMapData(flows, month) {
    const startOfMonth = month.clone().startOf('month');
    const endOfMonth = month.clone().endOf('month');
    const daysInMonth = endOfMonth.diff(startOfMonth, 'days') + 1;
    
    const contributionData = [];
    let maxCount = 0;

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = startOfMonth.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      let count = 0;
      
      flows.forEach(flow => {
        const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
        
        if (isScheduled) {
          const status = flow.status?.[dayKey];
          if (status?.symbol === '✅') count++;
        }
      });
      
      contributionData.push({ 
        date: dayKey, 
        count,
        day: currentDate.date(),
        dayOfWeek: currentDate.day(),
        isToday: currentDate.isSame(moment(), 'day'),
      });
      
      maxCount = Math.max(maxCount, count);
    }

    return { contributionData, maxCount };
  }

  /**
   * Check if a flow is scheduled for a specific date
   * @param {Object} flow - Flow object
   * @param {moment} date - Date to check
   * @returns {boolean} Whether flow is scheduled
   */
  isFlowScheduledForDate(flow, date) {
    if (flow.everyDay) return true;
    
    if (flow.daysOfWeek && flow.daysOfWeek.length > 0) {
      const dayOfWeek = date.format('ddd');
      return flow.daysOfWeek.includes(dayOfWeek);
    }
    
    if (flow.selectedMonthDays && flow.selectedMonthDays.length > 0) {
      const dayOfMonth = date.date().toString();
      return flow.selectedMonthDays.includes(dayOfMonth);
    }
    
    return false;
  }

  /**
   * Calculate points for a completion based on flow type
   * @param {Object} flow - Flow object
   * @param {Object} status - Status object
   * @returns {number} Points earned
   */
  calculatePointsForCompletion(flow, status) {
    // Base points for completion
    let points = 10;
    
    // Bonus points for quantitative flows
    if (flow.trackingType === 'Quantitative' && status.quantitative) {
      const goal = status.quantitative.goal || 1;
      const count = status.quantitative.count || 0;
      if (count > goal) {
        points += Math.floor((count - goal) / goal) * 5; // Bonus for exceeding goal
      }
    }
    
    // Bonus points for time-based flows
    if (flow.trackingType === 'Time-based' && status.timebased) {
      const goalSeconds = ((flow.hours || 0) * 3600) + ((flow.minutes || 0) * 60) + (flow.seconds || 0);
      const duration = status.timebased.totalDuration || 0;
      if (duration > goalSeconds) {
        points += Math.floor((duration - goalSeconds) / goalSeconds) * 3; // Bonus for exceeding time goal
      }
    }
    
    return points;
  }

  /**
   * Calculate current streak for a flow
   * @param {Object} flow - Flow object
   * @returns {number} Current streak in days
   */
  calculateCurrentStreak(flow) {
    let streak = 0;
    const today = moment();
    
    for (let i = 0; i < 365; i++) { // Check up to 1 year back
      const checkDate = today.clone().subtract(i, 'days');
      const dayKey = checkDate.format('YYYY-MM-DD');
      
      const isScheduled = this.isFlowScheduledForDate(flow, checkDate);
      if (isScheduled) {
        const status = flow.status?.[dayKey];
        if (status?.symbol === '+') {
          streak++;
        } else {
          break; // Streak broken
        }
      }
    }
    
    return streak;
  }

  /**
   * Calculate flow-specific metrics
   * @param {Object} flow - Flow object
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Object} Flow metrics
   */
  calculateFlowMetrics(flow, startDate, endDate) {
    let completed = 0;
    let scheduled = 0;
    let totalValue = 0;
    let totalTime = 0;

    const currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate)) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
      
      if (isScheduled) {
        scheduled++;
        const status = flow.status?.[dayKey];
        
        if (status?.symbol === '+') {
          completed++;
          
          // Add quantitative value
          if (flow.trackingType === 'Quantitative' && status.quantitative) {
            totalValue += status.quantitative.count || 0;
          }
          
          // Add time value
          if (flow.trackingType === 'Time-based' && status.timebased) {
            totalTime += status.timebased.totalDuration || 0;
          }
        }
      }
      
      currentDate.add(1, 'day');
    }

    return {
      completed,
      scheduled,
      totalValue,
      totalTime,
      completionRate: scheduled > 0 ? (completed / scheduled) * 100 : 0
    };
  }

  /**
   * Calculate streaks for a flow
   * @param {Object} flow - Flow object
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Object} Streak data
   */
  calculateStreaks(flow, startDate, endDate) {
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(endDate)) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
      
      if (isScheduled) {
        const status = flow.status?.[dayKey];
        
        if (status?.symbol === '+') {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      
      currentDate.add(1, 'day');
    }

    // Calculate current streak from today
    currentStreak = this.calculateCurrentStreak(flow);

    return {
      current: currentStreak,
      best: bestStreak
    };
  }

  /**
   * Calculate completion rates for different periods
   * @param {Object} flow - Flow object
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Object} Completion rates
   */
  calculateCompletionRates(flow, startDate, endDate) {
    const metrics = this.calculateFlowMetrics(flow, startDate, endDate);
    
    return {
      overall: metrics.completionRate,
      weekly: this.calculateWeeklyCompletionRate(flow, startDate, endDate),
      monthly: this.calculateMonthlyCompletionRate(flow, startDate, endDate)
    };
  }

  /**
   * Calculate weekly completion rate
   * @param {Object} flow - Flow object
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {number} Weekly completion rate
   */
  calculateWeeklyCompletionRate(flow, startDate, endDate) {
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    
    let completed = 0;
    let scheduled = 0;

    const currentDate = weekStart.clone();
    while (currentDate.isSameOrBefore(weekEnd)) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
      
      if (isScheduled) {
        scheduled++;
        const status = flow.status?.[dayKey];
        if (status?.symbol === '✅') completed++;
      }
      
      currentDate.add(1, 'day');
    }

    return scheduled > 0 ? (completed / scheduled) * 100 : 0;
  }

  /**
   * Calculate monthly completion rate
   * @param {Object} flow - Flow object
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {number} Monthly completion rate
   */
  calculateMonthlyCompletionRate(flow, startDate, endDate) {
    const monthStart = moment().startOf('month');
    const monthEnd = moment().endOf('month');
    
    let completed = 0;
    let scheduled = 0;

    const currentDate = monthStart.clone();
    while (currentDate.isSameOrBefore(monthEnd)) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
      
      if (isScheduled) {
        scheduled++;
        const status = flow.status?.[dayKey];
        if (status?.symbol === '✅') completed++;
      }
      
      currentDate.add(1, 'day');
    }

    return scheduled > 0 ? (completed / scheduled) * 100 : 0;
  }

  /**
   * Calculate trends for a flow
   * @param {Object} flow - Flow object
   * @param {moment} startDate - Start date
   * @param {moment} endDate - End date
   * @returns {Object} Trend data
   */
  calculateFlowTrends(flow, startDate, endDate) {
    const dailyData = [];
    const currentDate = startDate.clone();

    while (currentDate.isSameOrBefore(endDate)) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = this.isFlowScheduledForDate(flow, currentDate);
      
      if (isScheduled) {
        const status = flow.status?.[dayKey];
        const completed = status?.symbol === '✅' ? 1 : 0;
        
        dailyData.push({
          date: dayKey,
          displayDate: currentDate.format('MMM DD'),
          completed,
          value: this.extractValueFromStatus(flow, status)
        });
      }
      
      currentDate.add(1, 'day');
    }

    return {
      daily: dailyData,
      trend: this.calculateTrendDirection(dailyData)
    };
  }

  /**
   * Extract value from status based on flow type
   * @param {Object} flow - Flow object
   * @param {Object} status - Status object
   * @returns {number} Extracted value
   */
  extractValueFromStatus(flow, status) {
    if (!status) return 0;
    
    switch (flow.trackingType) {
      case 'Quantitative':
        return status.quantitative?.count || 0;
      case 'Time-based':
        return status.timebased?.totalDuration || 0;
      case 'Binary':
      default:
        return status.symbol === '+' ? 1 : 0;
    }
  }

  /**
   * Calculate trend direction
   * @param {Array} dailyData - Daily data array
   * @returns {string} Trend direction (up, down, stable)
   */
  calculateTrendDirection(dailyData) {
    if (dailyData.length < 2) return 'stable';
    
    const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
    const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, day) => sum + day.completed, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, day) => sum + day.completed, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  }
}

// Export singleton instance
export default new StatsService();
