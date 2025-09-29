import React, { createContext, useContext, useMemo } from 'react';
import moment from 'moment';
import { FlowsContext } from './FlowContext';

export const ActivityContext = createContext({
  getAllStats: () => ({}),
  getScoreboard: () => ({}),
  getActivityStats: () => ({}),
  getEmotionalActivity: () => ({}),
  getFlowSummary: () => ({}),
});

export const ActivityProvider = ({ children }) => {
  const { flows = [] } = useContext(FlowsContext) || {};
  
  console.log('ActivityProvider: Received flows:', flows.length, 'flows');
  console.log('ActivityProvider: Flow IDs:', flows.map(f => f.id));

  const getAllStats = (options = {}) => {
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
      return {
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
      };
    }

    // Calculate date range based on timeframe
    let startDate, endDate;
    const now = moment();
    
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
      default: // 'all'
        startDate = moment.min(filteredFlows.map(f => moment(f.startDate || f.createdAt)));
        endDate = now;
        break;
    }

    // Initialize aggregated stats
    let totalCompleted = 0, totalPartial = 0, totalFailed = 0, totalSkipped = 0, totalInactive = 0;
    let totalPoints = 0, totalEmotionBonus = 0, totalNotesCount = 0, totalCheatEntries = 0;
    let totalScheduledDays = 0, longestStreak = 0;
    const flowSummaries = [];
    const weeklyTrends = [];
    const achievements = [];

    // Process each flow
    filteredFlows.forEach(flow => {
      const flowStartDate = moment(flow.startDate || flow.createdAt);
      if (!flowStartDate.isValid()) return;

      const flowEndDate = moment.min([endDate, now]);
      const diffDays = flowEndDate.diff(flowStartDate, 'days') + 1;

      let flowCompleted = 0, flowPartial = 0, flowFailed = 0, flowSkipped = 0, flowInactive = 0;
      let flowScheduledDays = 0, flowCurrentStreak = 0, flowLongestStreak = 0;
      let flowPoints = 0, flowEmotionBonus = 0, flowNotesCount = 0, flowCheatEntries = 0;

      // Calculate flow stats
      for (let i = 0; i < diffDays; i++) {
        const currentDate = flowStartDate.clone().add(i, 'days');
        
        // Skip if outside timeframe
        if (currentDate.isBefore(startDate) || currentDate.isAfter(endDate)) continue;

        const dayKey = currentDate.format('YYYY-MM-DD');
        const isScheduled = flow.repeatType === 'day' 
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.repeatType === 'month' && flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString())
          || true;

        if (isScheduled) {
          flowScheduledDays++;
          const dayStat = flow.status?.[dayKey];
          
          if (!dayStat) {
            flowInactive++;
            flowCurrentStreak = 0;
            continue;
          }

          const { symbol, emotion, note, quantitative, timebased, editedInCheatMode } = dayStat;
          
          // Determine completion status
          let isCompleted = false, isPartial = false;
          
          if (flow.trackingType === 'Quantitative') {
            const count = quantitative?.count || 0;
            const goal = quantitative?.goal || flow.goal || 1;
            if (count >= goal) {
              isCompleted = true;
            } else if (count >= goal * 0.5) {
              isPartial = true;
            }
          } else if (flow.trackingType === 'Time-based') {
            const duration = timebased?.totalDuration || 0;
            const goalSeconds = ((timebased?.hours || flow.hours || 0) * 3600) +
                              ((timebased?.minutes || flow.minutes || 0) * 60) +
                              (timebased?.seconds || flow.seconds || 0);
            if (duration >= goalSeconds) {
              isCompleted = true;
            } else if (duration >= goalSeconds * 0.5) {
              isPartial = true;
            }
          } else {
            // Binary flow
            isCompleted = symbol === '+' || symbol === '✅';
            isPartial = symbol === '~' || symbol === '*';
          }

          if (isCompleted) {
            flowCompleted++;
            flowCurrentStreak++;
            flowLongestStreak = Math.max(flowLongestStreak, flowCurrentStreak);
            flowPoints += 10;
          } else if (isPartial) {
            flowPartial++;
            flowCurrentStreak = 0;
            flowPoints += 5;
          } else {
            if (symbol === '❌' || symbol === '-') {
              flowFailed++;
            } else if (symbol === '⏭️' || symbol === '/') {
              flowSkipped++;
            } else {
              flowInactive++;
            }
            flowCurrentStreak = 0;
          }

          // Emotion bonus
          if (emotion) {
            const emotionLower = emotion.toLowerCase();
            if (['happy', 'proud', 'motivated', 'excited', 'calm'].includes(emotionLower)) {
              flowEmotionBonus += 2;
            } else if (['sad', 'tired', 'angry'].includes(emotionLower)) {
              flowEmotionBonus += 1;
            }
          }

          // Notes bonus
          if (note && note.trim().length > 0) {
            flowNotesCount++;
            flowPoints += 1;
          }

          // Cheat mode tracking
          if (editedInCheatMode) {
            flowCheatEntries++;
          }
        }
      }

      // Add flow summary
      const completionRate = flowScheduledDays > 0 ? ((flowCompleted + flowPartial) / flowScheduledDays) * 100 : 0;
      flowSummaries.push({
        flowId: flow.id,
        flowTitle: flow.title,
        flowType: flow.trackingType || 'Binary',
        completed: flowCompleted,
        partial: flowPartial,
        failed: flowFailed,
        skipped: flowSkipped,
        inactive: flowInactive,
        currentStreak: flowCurrentStreak,
        longestStreak: flowLongestStreak,
        completionRate: completionRate,
        scheduledDays: flowScheduledDays,
        points: flowPoints
      });

      // Aggregate totals
      totalCompleted += flowCompleted;
      totalPartial += flowPartial;
      totalFailed += flowFailed;
      totalSkipped += flowSkipped;
      totalInactive += flowInactive;
      totalPoints += flowPoints;
      totalEmotionBonus += flowEmotionBonus;
      totalNotesCount += flowNotesCount;
      totalCheatEntries += flowCheatEntries;
      totalScheduledDays += flowScheduledDays;
      longestStreak = Math.max(longestStreak, flowLongestStreak);
    });

    // Calculate success metrics
    const totalSuccessfulDays = totalCompleted + totalPartial;
    const totalFailedDays = totalFailed + totalSkipped;
    const successRate = totalScheduledDays > 0 ? (totalSuccessfulDays / totalScheduledDays) * 100 : 0;
    const pureCompletionRate = totalScheduledDays > 0 ? (totalCompleted / totalScheduledDays) * 100 : 0;
    const partialSuccessRate = totalScheduledDays > 0 ? (totalPartial / totalScheduledDays) * 100 : 0;
    const failureRate = totalScheduledDays > 0 ? (totalFailed / totalScheduledDays) * 100 : 0;
    const skipRate = totalScheduledDays > 0 ? (totalSkipped / totalScheduledDays) * 100 : 0;

    // Generate weekly trends (last 7 days)
    for (let i = 6; i >= 0; i--) {
      const date = now.clone().subtract(i, 'days');
      const dayKey = date.format('YYYY-MM-DD');
      
      let dayCompleted = 0, dayScheduled = 0;
      
      filteredFlows.forEach(flow => {
        const isScheduled = flow.repeatType === 'day' 
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(date.format('ddd')))
          : flow.repeatType === 'month' && flow.selectedMonthDays && flow.selectedMonthDays.includes(date.date().toString())
          || true;

        if (isScheduled) {
          dayScheduled++;
          const dayStat = flow.status?.[dayKey];
          if (dayStat) {
            const { symbol } = dayStat;
            if (symbol === '+' || symbol === '✅') {
              dayCompleted++;
            }
          }
        }
      });

      const percentage = dayScheduled > 0 ? (dayCompleted / dayScheduled) * 100 : 0;
      weeklyTrends.push({
        date: dayKey,
        displayDate: date.format('MMM D'),
        percentage: percentage,
        completed: dayCompleted,
        scheduled: dayScheduled
      });
    }

    // Generate achievements
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

    // Generate heat map data
    const heatMapData = {};
    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    
    for (let date = startOfMonth.clone(); date.isSameOrBefore(endOfMonth); date.add(1, 'day')) {
      const dayKey = date.format('YYYY-MM-DD');
      let count = 0;
      
      filteredFlows.forEach(flow => {
        const isScheduled = flow.repeatType === 'day' 
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(date.format('ddd')))
          : flow.repeatType === 'month' && flow.selectedMonthDays && flow.selectedMonthDays.includes(date.date().toString())
          || true;

        if (isScheduled) {
          const dayStat = flow.status?.[dayKey];
          if (dayStat && (dayStat.symbol === '+' || dayStat.symbol === '✅')) {
            count++;
          }
        }
      });

      heatMapData[dayKey] = count;
    }

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
      options
    };
  };

  const getFlowSummary = (flowId) => {
    const flow = flows.find((f) => f.id === flowId) || {};
    if (!flow.id) {
      return {
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
      };
    }

    const scoreboardData = getScoreboard(flowId);
    
    return {
      flowId: flow.id,
      flowTitle: flow.title,
      flowType: flow.trackingType || 'Binary',
      completed: scoreboardData.completed || 0,
      partial: scoreboardData.partial || 0,
      failed: scoreboardData.failed || 0,
      skipped: scoreboardData.skipped || 0,
      inactive: scoreboardData.inactive || 0,
      currentStreak: scoreboardData.currentStreak || 0,
      longestStreak: scoreboardData.longestStreak || 0,
      completionRate: scoreboardData.completionRate || 0,
      scheduledDays: scoreboardData.scheduledDays || 0,
      points: scoreboardData.finalScore || 0
    };
  };

  const getScoreboard = (flowId) => {
    console.log('ActivityContext: getScoreboard called with flowId:', flowId, 'type:', typeof flowId);
    console.log('ActivityContext: Available flows:', flows.map(f => ({ id: f.id, title: f.title, startDate: f.startDate, createdAt: f.createdAt, idType: typeof f.id })));
    const flow = flows.find((f) => f.id === flowId || f.id === String(flowId) || f.id === Number(flowId)) || {};
    console.log('ActivityContext: found flow:', { id: flow.id, title: flow.title, startDate: flow.startDate, createdAt: flow.createdAt });
    const status = flow.status || {};
    const startDate = moment(flow.startDate || flow.createdAt);
    if (!startDate.isValid()) {
      console.warn('Invalid startDate for flow:', flow.id, flow.title, 'startDate:', flow.startDate, 'createdAt:', flow.createdAt);
      return {
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
      };
    }
    const endDate = moment();
    const diffDays = endDate.diff(startDate, 'days') + 1;

    let completed = 0, partial = 0, failed = 0, skipped = 0, inactive = 0;
    let streak = 0, streakBonus = 0, emotionBonus = 0, notesCount = 0;
    let emotionsPositive = 0, emotionsNegative = 0;
    let scheduledDays = 0;
    let totalDuration = 0, totalPauses = 0, totalCount = 0;

    for (let i = 0; i < diffDays; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        flow.repeatType === 'day'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.repeatType === 'month' && flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString())
          || true;

      if (isScheduled) {
        scheduledDays++;
        const dayStat = status[dayKey];
        if (!dayStat) {
          inactive++;
          streak = 0;
          continue;
        }

        const { symbol, emotion, note, quantitative, timebased } = dayStat;
        if (flow.trackingType === 'Quantitative') {
          const count = quantitative?.count || 0;
          const goal = quantitative?.goal || flow.goal || 1;
          totalCount += count;
          if (count >= goal) {
            completed++;
            streak++;
            if (streak > 0 && streak % 7 === 0) {
              streakBonus += 5;
            }
          } else if (count >= goal * 0.5) {
            partial++;
            streak = 0;
          } else if (count > 0 || symbol === '+' || symbol === '-') {
            failed++;
            streak = 0;
          } else if (symbol === '-') {
            inactive++;
            streak = 0;
          }
        } else if (flow.trackingType === 'Time-based') {
          const duration = timebased?.totalDuration || 0;
          const goalSeconds = ((timebased?.hours || flow.hours || 0) * 3600) +
                            ((timebased?.minutes || flow.minutes || 0) * 60) +
                            (timebased?.seconds || flow.seconds || 0);
          totalDuration += duration;
          totalPauses += timebased?.pausesCount || 0;
          if (duration >= goalSeconds) {
            completed++;
            streak++;
            if (streak > 0 && streak % 7 === 0) {
              streakBonus += 5;
            }
          } else if (duration >= goalSeconds * 0.5) {
            partial++;
            streak = 0;
          } else if (duration > 0 || symbol === '+' || symbol === '-') {
            failed++;
            streak = 0;
          } else if (symbol === '-') {
            inactive++;
            streak = 0;
          }
        } else {
          // Binary flow logic
          if (symbol === '+' || symbol === '✅') {
            completed++;
            streak++;
            if (streak > 0 && streak % 7 === 0) {
              streakBonus += 5;
            }
          } else if (symbol === '*' || symbol === '~') {
            partial++;
            streak = 0;
          } else {
            if (symbol === '-' || symbol === '❌') failed++;
            else if (symbol === '/' || symbol === '⏭️') skipped++;
            else inactive++;
            streak = 0;
          }
        }

        if (emotion) {
          const emotionLower = emotion.toLowerCase();
          if (['happy', 'proud', 'motivated', 'excited', 'calm'].includes(emotionLower)) emotionsPositive++;
          else if (['sad', 'tired', 'angry'].includes(emotionLower)) emotionsNegative++;
        }
        if (note && note.trim().length > 0) notesCount++;
      }
    }

    emotionBonus = (2 * emotionsPositive) - (1 * emotionsNegative);
    const completionPoints = completed * 10;
    const partialPoints = partial * 5;
    const failedPoints = failed * -8;
    const inactivePoints = inactive * -4;
    const notesPoints = notesCount * 1;
    const totalPoints = completionPoints + partialPoints + failedPoints + inactivePoints + streakBonus + emotionBonus + notesPoints;

    const completionRate = scheduledDays > 0 ? ((completed + partial) / scheduledDays) * 100 : 0;
    const averageDuration = scheduledDays > 0 ? totalDuration / scheduledDays : 0;
    const averageCount = scheduledDays > 0 ? totalCount / scheduledDays : 0;

    return {
      completed,
      partial,
      failed,
      skipped,
      inactive,
      streak,
      streakBonus,
      emotionBonus,
      notesCount,
      completionRate: parseFloat(completionRate.toFixed(1)),
      finalScore: totalPoints,
      timeBasedStats: {
        totalDuration,
        averageDuration: parseFloat(averageDuration.toFixed(1)),
        totalPauses,
      },
      quantitativeStats: {
        totalCount,
        averageCount: parseFloat(averageCount.toFixed(1)),
        unitText: flow.unitText || '',
      },
    };
  };

  const getActivityStats = (flowId) => {
    console.log('ActivityContext: getActivityStats called with flowId:', flowId);
    const flow = flows.find((h) => h.id === flowId || h.id === String(flowId) || h.id === Number(flowId)) || {};
    console.log('ActivityContext: found flow for activity stats:', { id: flow.id, title: flow.title, startDate: flow.startDate, createdAt: flow.createdAt });
    const status = flow.status || {};
    const startDate = moment(flow.startDate || flow.createdAt);
    if (!startDate.isValid()) {
      console.warn('Invalid startDate for flow:', flow.id, flow.title, 'startDate:', flow.startDate, 'createdAt:', flow.createdAt);
      return { 
        total: 0, 
        byStatus: { Completed: 0, Partial: 0, Missed: 0, Inactive: 0, Skipped: 0 },
        timeBased: { totalDuration: 0, totalPauses: 0 },
        quantitative: { totalCount: 0, unitText: '' }
      };
    }
    const endDate = moment();
    const diffDays = endDate.diff(startDate, 'days') + 1;

    const activities = [];
    let totalDuration = 0, totalPauses = 0, totalCount = 0;

    for (let i = 0; i < diffDays; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        flow.repeatType === 'day'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.repeatType === 'month' && flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString())
          || true;

      if (isScheduled) {
        const dayStat = status[dayKey];
        if (!dayStat) {
          activities.push({ date: dayKey, status: 'Inactive' });
          continue;
        }
        if (flow.trackingType === 'Quantitative') {
          const count = dayStat.quantitative?.count || 0;
          const goal = dayStat.quantitative?.goal || flow.goal || 1;
          totalCount += count;
          if (count >= goal) {
            activities.push({ date: dayKey, status: 'Completed' });
          } else if (count >= goal * 0.5) {
            activities.push({ date: dayKey, status: 'Partial' });
          } else if (count > 0 || dayStat.symbol === '+' || dayStat.symbol === '-') {
            activities.push({ date: dayKey, status: 'Missed' });
          } else if (dayStat.symbol === '-') {
            activities.push({ date: dayKey, status: 'Inactive' });
          }
        } else if (flow.trackingType === 'Time-based') {
          const duration = dayStat.timebased?.totalDuration || 0;
          const pauses = dayStat.timebased?.pausesCount || 0;
          const goalSeconds = ((dayStat.timebased?.hours || flow.hours || 0) * 3600) +
                            ((dayStat.timebased?.minutes || flow.minutes || 0) * 60) +
                            (dayStat.timebased?.seconds || flow.seconds || 0);
          totalDuration += duration;
          totalPauses += pauses;
          if (duration >= goalSeconds) {
            activities.push({ date: dayKey, status: 'Completed' });
          } else if (duration >= goalSeconds * 0.5) {
            activities.push({ date: dayKey, status: 'Partial' });
          } else if (duration > 0 || dayStat.symbol === '+' || dayStat.symbol === '-') {
            activities.push({ date: dayKey, status: 'Missed' });
          } else if (dayStat.symbol === '-') {
            activities.push({ date: dayKey, status: 'Inactive' });
          }
        } else {
          activities.push({
            date: dayKey,
            status: dayStat.symbol === '+' || dayStat.symbol === '✅' ? 'Completed' :
                   dayStat.symbol === '*' || dayStat.symbol === '~' ? 'Partial' :
                   dayStat.symbol === '-' ? 'Missed' :
                   dayStat.symbol === '/' ? 'Skipped' : 'Inactive',
          });
        }
      }
    }

    return {
      total: activities.length,
      byStatus: activities.reduce((acc, { status }) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, { Completed: 0, Partial: 0, Missed: 0, Inactive: 0, Skipped: 0 }),
      timeBased: {
        totalDuration,
        totalPauses,
      },
      quantitative: {
        totalCount,
        unitText: flow.unitText || '',
      },
    };
  };

  const getEmotionalActivity = (flowId) => {
    console.log('ActivityContext: getEmotionalActivity called with flowId:', flowId);
    const flow = flows.find((h) => h.id === flowId || h.id === String(flowId) || h.id === Number(flowId)) || {};
    console.log('ActivityContext: found flow for emotional activity:', { id: flow.id, title: flow.title, startDate: flow.startDate, createdAt: flow.createdAt });
    const status = flow.status || {};
    
    // Use createdAt as fallback if startDate is not available
    const startDate = moment(flow.startDate || flow.createdAt);
    if (!startDate.isValid()) {
      console.warn('Invalid startDate for flow:', flow.id, flow.title, 'startDate:', flow.startDate, 'createdAt:', flow.createdAt);
      return { totalEmotions: 0, byEmotion: { Happy: 0, Sad: 0, Angry: 0, Excited: 0, Calm: 0 } };
    }
    const endDate = moment();
    const diffDays = endDate.diff(startDate, 'days') + 1;

    const emotions = [];
    let scheduledDays = 0;
    for (let i = 0; i < diffDays; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        flow.repeatType === 'day'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.repeatType === 'month' && flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString())
          || true;

      if (isScheduled) {
        scheduledDays++;
        const dayStat = status[dayKey];
        if (dayStat && dayStat.emotion) {
          emotions.push({
            date: dayKey,
            emotion: dayStat.emotion,
          });
        }
      }
    }

    return {
      totalEmotions: emotions.length,
      byEmotion: emotions.reduce((acc, { emotion }) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, { Happy: 0, Sad: 0, Angry: 0, Excited: 0, Calm: 0 }),
    };
  };

  const value = useMemo(
    () => ({
      getAllStats,
      getScoreboard,
      getActivityStats,
      getEmotionalActivity,
      getFlowSummary,
    }),
    [flows]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};