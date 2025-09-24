import React, { createContext, useContext, useMemo } from 'react';
import moment from 'moment';
import { FlowsContext } from './FlowContext';

export const ActivityContext = createContext({
  getScoreboard: () => ({}),
  getActivityStats: () => ({}),
  getEmotionalActivity: () => ({}),
});

export const ActivityProvider = ({ children }) => {
  const { flows = [] } = useContext(FlowsContext) || {};

  const getScoreboard = (flowId) => {
    const flow = flows.find((f) => f.id === flowId) || {};
    const status = flow.status || {};
    const startDate = moment(flow.startDate);
    if (!startDate.isValid()) {
      console.warn('Invalid startDate for flow:', flow.id, flow.title);
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
          if (symbol === '+') {
            completed++;
            streak++;
            if (streak > 0 && streak % 7 === 0) {
              streakBonus += 5;
            }
          } else {
            if (symbol === '-') failed++;
            else if (symbol === '/') skipped++;
            else if (symbol === '-') inactive++;
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

    const completionRate = scheduledDays > 0 ? (completed / scheduledDays) * 100 : 0;
    const averageDuration = scheduledDays > 0 ? totalDuration / scheduledDays : 0;
    const averageCount = scheduledDays > 0 ? totalCount / scheduledDays : 0;

    return {
      completed,
      partial,
      failed,
      skipped,
      inactive,
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
    const flow = flows.find((h) => h.id === flowId) || {};
    const status = flow.status || {};
    const startDate = moment(flow.startDate);
    if (!startDate.isValid()) {
      console.warn('Invalid startDate for flow:', flow.id, flow.title);
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
            status: dayStat.symbol === '+' ? 'Completed' :
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
    const flow = flows.find((h) => h.id === flowId) || {};
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
      getScoreboard,
      getActivityStats,
      getEmotionalActivity,
    }),
    [flows]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};