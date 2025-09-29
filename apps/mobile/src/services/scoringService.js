/**
 * Scoring Service - Centralized scoring engine for flow entries
 * 
 * This service provides consistent scoring calculations across the app,
 * handling binary, quantitative, and time-based flows with proper
 * streak calculations, emotion bonuses, and cheat mode handling.
 */

import moment from 'moment';

// Scoring configuration constants
const SCORING_CONFIG = {
  // Base points for different completion levels
  POINTS: {
    COMPLETED: 10,
    PARTIAL: 5,
    FAILED: -8,
    INACTIVE: -4,
    SKIPPED: 0,
    NOTES_BONUS: 1,
    EMOTION_POSITIVE: 2,
    EMOTION_NEGATIVE: -1,
    STREAK_BONUS_PER_WEEK: 5,
  },
  
  // Streak configuration
  STREAK: {
    WEEKLY_BONUS_INTERVAL: 7,
    COUNT_CHEAT_IN_STREAK: false, // Whether cheat-edited entries count for streaks
  },
  
  // Cheat mode configuration
  CHEAT: {
    FACTOR: 0.5, // Points multiplier for cheat-edited entries
    EXCLUDE_FROM_STREAKS: true,
  },
  
  // Emotion definitions
  EMOTIONS: {
    POSITIVE: ['happy', 'proud', 'motivated', 'excited', 'calm'],
    NEGATIVE: ['sad', 'tired', 'angry', 'frustrated', 'anxious'],
  },
  
  // Partial completion thresholds
  THRESHOLDS: {
    PARTIAL_COMPLETION: 0.5, // 50% of goal counts as partial
  },
};

/**
 * Calculate comprehensive points for a flow entry
 * @param {Object} entry - Flow entry object
 * @param {Object} flow - Flow configuration object
 * @param {Object} options - Additional options
 * @returns {Object} Scoring result with points breakdown
 */
export const calculateEntryPoints = (entry, flow, options = {}) => {
  const {
    includeStreakBonus = true,
    includeEmotionBonus = true,
    includeNotesBonus = true,
    isCheatMode = false,
  } = options;

  // Default result structure
  const result = {
    finalPoints: 0,
    streakEligible: true,
    breakdown: {
      completion: 0,
      partial: 0,
      emotion: 0,
      notes: 0,
      streak: 0,
      cheat: 0,
    },
    status: 'inactive',
    completionRate: 0,
  };

  // Validate inputs
  if (!entry || !flow) {
    console.warn('Invalid entry or flow provided to calculateEntryPoints');
    return result;
  }

  // Determine completion status and base points
  const completionData = calculateCompletionStatus(entry, flow);
  result.status = completionData.status;
  result.completionRate = completionData.completionRate;
  result.breakdown.completion = completionData.points;

  // Calculate partial completion points
  if (completionData.isPartial) {
    result.breakdown.partial = SCORING_CONFIG.POINTS.PARTIAL;
  }

  // Calculate emotion bonus
  if (includeEmotionBonus && entry.emotion) {
    result.breakdown.emotion = calculateEmotionBonus(entry.emotion);
  }

  // Calculate notes bonus
  if (includeNotesBonus && entry.note && entry.note.trim().length > 0) {
    result.breakdown.notes = SCORING_CONFIG.POINTS.NOTES_BONUS;
  }

  // Determine streak eligibility
  result.streakEligible = determineStreakEligibility(entry, flow, isCheatMode);

  // Calculate streak bonus (if eligible and requested)
  if (includeStreakBonus && result.streakEligible && completionData.status === 'completed') {
    result.breakdown.streak = calculateStreakBonus(entry, flow);
  }

  // Apply cheat mode factor if applicable
  if (isCheatMode && entry.editedInCheatMode) {
    result.breakdown.cheat = -Math.abs(result.breakdown.completion) * (1 - SCORING_CONFIG.CHEAT.FACTOR);
  }

  // Calculate final points
  result.finalPoints = Object.values(result.breakdown).reduce((sum, points) => sum + points, 0);

  return result;
};

/**
 * Calculate completion status and base points for an entry
 * @param {Object} entry - Flow entry
 * @param {Object} flow - Flow configuration
 * @returns {Object} Completion data
 */
const calculateCompletionStatus = (entry, flow) => {
  const { symbol, quantitative, timebased } = entry;
  const { trackingType } = flow;

  let status = 'inactive';
  let points = 0;
  let completionRate = 0;
  let isPartial = false;

  if (trackingType === 'Quantitative') {
    const count = quantitative?.count || 0;
    const goal = quantitative?.goal || flow.goal || 1;
    completionRate = goal > 0 ? count / goal : 0;

    if (count >= goal) {
      status = 'completed';
      points = SCORING_CONFIG.POINTS.COMPLETED;
    } else if (count >= goal * SCORING_CONFIG.THRESHOLDS.PARTIAL_COMPLETION) {
      status = 'partial';
      points = SCORING_CONFIG.POINTS.PARTIAL;
      isPartial = true;
    } else if (count > 0 || symbol === '+' || symbol === '-') {
      status = 'failed';
      points = SCORING_CONFIG.POINTS.FAILED;
    } else {
      status = 'inactive';
      points = SCORING_CONFIG.POINTS.INACTIVE;
    }
  } else if (trackingType === 'Time-based') {
    const duration = timebased?.totalDuration || 0;
    const goalSeconds = ((flow.hours || 0) * 3600) + 
                      ((flow.minutes || 0) * 60) + 
                      (flow.seconds || 0);
    completionRate = goalSeconds > 0 ? duration / goalSeconds : 0;

    if (duration >= goalSeconds) {
      status = 'completed';
      points = SCORING_CONFIG.POINTS.COMPLETED;
    } else if (duration >= goalSeconds * SCORING_CONFIG.THRESHOLDS.PARTIAL_COMPLETION) {
      status = 'partial';
      points = SCORING_CONFIG.POINTS.PARTIAL;
      isPartial = true;
    } else if (duration > 0 || symbol === '+' || symbol === '-') {
      status = 'failed';
      points = SCORING_CONFIG.POINTS.FAILED;
    } else {
      status = 'inactive';
      points = SCORING_CONFIG.POINTS.INACTIVE;
    }
  } else {
    // Binary flow logic
    switch (symbol) {
      case '+':
      case '✅':
        status = 'completed';
        points = SCORING_CONFIG.POINTS.COMPLETED;
        completionRate = 1;
        break;
      case '*':
      case '~':
        status = 'partial';
        points = SCORING_CONFIG.POINTS.PARTIAL;
        completionRate = 0.5;
        isPartial = true;
        break;
      case '-':
      case '❌':
        status = 'failed';
        points = SCORING_CONFIG.POINTS.FAILED;
        break;
      case '/':
      case '⏭️':
        status = 'skipped';
        points = SCORING_CONFIG.POINTS.SKIPPED;
        break;
      default:
        status = 'inactive';
        points = SCORING_CONFIG.POINTS.INACTIVE;
        break;
    }
  }

  return {
    status,
    points,
    completionRate,
    isPartial,
  };
};

/**
 * Calculate emotion bonus points
 * @param {string} emotion - Emotion string
 * @returns {number} Emotion bonus points
 */
const calculateEmotionBonus = (emotion) => {
  if (!emotion) return 0;

  const emotionLower = emotion.toLowerCase();
  
  if (SCORING_CONFIG.EMOTIONS.POSITIVE.includes(emotionLower)) {
    return SCORING_CONFIG.POINTS.EMOTION_POSITIVE;
  } else if (SCORING_CONFIG.EMOTIONS.NEGATIVE.includes(emotionLower)) {
    return SCORING_CONFIG.POINTS.EMOTION_NEGATIVE;
  }
  
  return 0;
};

/**
 * Determine if an entry is eligible for streak counting
 * @param {Object} entry - Flow entry
 * @param {Object} flow - Flow configuration
 * @param {boolean} isCheatMode - Whether cheat mode is active
 * @returns {boolean} Whether entry is streak eligible
 */
const determineStreakEligibility = (entry, flow, isCheatMode) => {
  // If cheat mode is active and entry was edited in cheat mode, exclude from streaks
  if (isCheatMode && entry.editedInCheatMode && !SCORING_CONFIG.STREAK.COUNT_CHEAT_IN_STREAK) {
    return false;
  }

  // Entry must be completed to be streak eligible
  const completionData = calculateCompletionStatus(entry, flow);
  return completionData.status === 'completed';
};

/**
 * Calculate streak bonus points
 * @param {Object} entry - Flow entry
 * @param {Object} flow - Flow configuration
 * @returns {number} Streak bonus points
 */
const calculateStreakBonus = (entry, flow) => {
  // This would typically calculate based on current streak length
  // For now, return a simple weekly bonus calculation
  // TODO: Integrate with actual streak calculation from flow data
  return SCORING_CONFIG.POINTS.STREAK_BONUS_PER_WEEK;
};

/**
 * Calculate streak for a flow
 * @param {Object} flow - Flow object with status data
 * @param {string} endDate - End date for streak calculation (defaults to today)
 * @returns {Object} Streak data
 */
export const calculateStreak = (flow, endDate = null) => {
  const end = endDate ? moment(endDate) : moment();
  const startDate = moment(flow.startDate);
  
  if (!startDate.isValid()) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakEligibleDays: 0,
    };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let streakEligibleDays = 0;

  // Calculate streaks by iterating backwards from end date
  const diffDays = end.diff(startDate, 'days') + 1;
  
  for (let i = diffDays - 1; i >= 0; i--) {
    const currentDate = startDate.clone().add(i, 'days');
    const dayKey = currentDate.format('YYYY-MM-DD');
    
    // Check if this day is scheduled for the flow
    const isScheduled = isFlowScheduledForDate(flow, currentDate);
    
    if (isScheduled) {
      streakEligibleDays++;
      const dayStat = flow.status?.[dayKey];
      
      if (dayStat) {
        const scoringResult = calculateEntryPoints(dayStat, flow);
        
        if (scoringResult.streakEligible && scoringResult.status === 'completed') {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
          
          // If this is the most recent day, it's part of current streak
          if (i === diffDays - 1) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      } else {
        tempStreak = 0;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakEligibleDays,
  };
};

/**
 * Check if a flow is scheduled for a specific date
 * @param {Object} flow - Flow object
 * @param {moment} date - Date to check
 * @returns {boolean} Whether flow is scheduled for this date
 */
const isFlowScheduledForDate = (flow, date) => {
  // Handle both old and new flow structures
  const frequency = flow.frequency || (flow.repeatType === 'day' ? 'Daily' : flow.repeatType === 'month' ? 'Monthly' : 'Daily');
  
  if (frequency === 'Daily') {
    return flow.everyDay || 
           (flow.daysOfWeek && flow.daysOfWeek.length > 0 && flow.daysOfWeek.includes(date.format('ddd')));
  } else if (frequency === 'Monthly') {
    return flow.selectedMonthDays && 
           flow.selectedMonthDays.includes(date.date().toString());
  }
  
  // Default to daily if no frequency specified
  return true;
};

/**
 * Calculate comprehensive stats for a flow
 * @param {Object} flow - Flow object
 * @param {Object} options - Calculation options
 * @returns {Object} Comprehensive flow stats
 */
export const calculateFlowStats = (flow, options = {}) => {
  const {
    includeEmotions = true,
    includeNotes = true,
    includeCheatMode = false,
    startDate: customStartDate,
    endDate: customEndDate,
    timeframe,
  } = options;

  const includeEmotionBonus = includeEmotions;

  // Determine date range based on options
  let startDate, endDate;
  
  if (customStartDate && customEndDate) {
    startDate = moment(customStartDate);
    endDate = moment(customEndDate);
  } else if (timeframe) {
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
      case 'all':
        // For 'all' timeframe, use flow start date to present
        startDate = moment(flow.startDate);
        endDate = moment();
        break;
      default:
        startDate = moment(flow.startDate);
        endDate = moment();
        break;
    }
  } else {
    startDate = moment(flow.startDate);
    endDate = moment();
  }
  
  if (!startDate.isValid()) {
    console.warn('Invalid start date for flow:', flow.title || flow.id, 'startDate:', flow.startDate);
    return getDefaultFlowStats();
  }

  const diffDays = endDate.diff(startDate, 'days') + 1;
  
  let completed = 0;
  let partial = 0;
  let failed = 0;
  let skipped = 0;
  let inactive = 0;
  let scheduledDays = 0;
  let totalPoints = 0;
  let emotionBonus = 0;
  let notesCount = 0;
  let cheatEntriesCount = 0;
  
  // Quantitative and time-based specific stats
  let totalCount = 0;
  let totalDuration = 0;
  let totalPauses = 0;

  // Process each day
  let processedDays = 0;
  let scheduledDaysFound = 0;
  
  for (let i = 0; i < diffDays; i++) {
    const currentDate = startDate.clone().add(i, 'days');
    const dayKey = currentDate.format('YYYY-MM-DD');
    
    const isScheduled = isFlowScheduledForDate(flow, currentDate);
    
    if (isScheduled) {
      scheduledDays++;
      scheduledDaysFound++;
      const dayStat = flow.status?.[dayKey];
      
      if (!dayStat) {
        inactive++;
        continue;
      }

      // Calculate scoring for this entry
      const scoringResult = calculateEntryPoints(dayStat, flow, {
        includeStreakBonus: false, // We'll calculate streak separately
        includeEmotionBonus,
        includeNotesBonus: includeNotes,
        isCheatMode: includeCheatMode,
      });

      // Count by status
      switch (scoringResult.status) {
        case 'completed':
          completed++;
          break;
        case 'partial':
          partial++;
          break;
        case 'failed':
          failed++;
          break;
        case 'skipped':
          skipped++;
          break;
        default:
          inactive++;
          break;
      }

      // Accumulate points and bonuses
      totalPoints += scoringResult.finalPoints;
      emotionBonus += scoringResult.breakdown.emotion;
      
      if (scoringResult.breakdown.notes > 0) {
        notesCount++;
      }
      
      if (dayStat.editedInCheatMode) {
        cheatEntriesCount++;
      }

      // Track quantitative/time-based specific data
      if (flow.trackingType === 'Quantitative' && dayStat.quantitative) {
        totalCount += dayStat.quantitative.count || 0;
      } else if (flow.trackingType === 'Time-based' && dayStat.timebased) {
        totalDuration += dayStat.timebased.totalDuration || 0;
        totalPauses += dayStat.timebased.pausesCount || 0;
      }
    }
  }

  // Calculate streaks
  const streakData = calculateStreak(flow);
  
  // Calculate completion rate (including partial days)
  const completionRate = scheduledDays > 0 ? ((completed + partial) / scheduledDays) * 100 : 0;
  
  // Calculate averages
  const averageCount = scheduledDays > 0 ? totalCount / scheduledDays : 0;
  const averageDuration = scheduledDays > 0 ? totalDuration / scheduledDays : 0;
  
  // Calculate normalized score (0-100 scale)
  const maxPossiblePoints = scheduledDays * SCORING_CONFIG.POINTS.COMPLETED;
  const normalizedScore = maxPossiblePoints > 0 ? (totalPoints / maxPossiblePoints) * 100 : 0;

  return {
    completed,
    partial,
    failed,
    skipped,
    inactive,
    scheduledDays, // Add scheduledDays to the return object
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    streakEligibleDays: streakData.streakEligibleDays,
    streakBonus: 0, // TODO: Calculate actual streak bonus
    emotionBonus,
    notesCount,
    cheatEntriesCount,
    completionRate: parseFloat(completionRate.toFixed(1)),
    finalScore: totalPoints,
    normalizedScore: parseFloat(normalizedScore.toFixed(1)),
    quantitativeStats: {
      totalCount,
      averageCount: parseFloat(averageCount.toFixed(1)),
      unitText: flow.unitText || '',
    },
    timeBasedStats: {
      totalDuration,
      averageDuration: parseFloat(averageDuration.toFixed(1)),
      totalPauses,
    },
  };
};

/**
 * Get default flow stats structure
 * @returns {Object} Default stats object
 */
const getDefaultFlowStats = () => ({
  completed: 0,
  partial: 0,
  failed: 0,
  skipped: 0,
  inactive: 0,
  scheduledDays: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakEligibleDays: 0,
  streakBonus: 0,
  emotionBonus: 0,
  notesCount: 0,
  cheatEntriesCount: 0,
  completionRate: 0,
  finalScore: 0,
  normalizedScore: 0,
  quantitativeStats: {
    totalCount: 0,
    averageCount: 0,
    unitText: '',
  },
  timeBasedStats: {
    totalDuration: 0,
    averageDuration: 0,
    totalPauses: 0,
  },
});

/**
 * Calculate emotion distribution for a flow
 * @param {Object} flow - Flow object
 * @returns {Object} Emotion distribution data
 */
export const calculateEmotionDistribution = (flow) => {
  const startDate = moment(flow.startDate);
  const endDate = moment();
  
  if (!startDate.isValid()) {
    return {
      totalEmotions: 0,
      byEmotion: { Happy: 0, Sad: 0, Angry: 0, Excited: 0, Calm: 0 },
      positiveCount: 0,
      negativeCount: 0,
    };
  }

  const diffDays = endDate.diff(startDate, 'days') + 1;
  const emotions = [];
  let positiveCount = 0;
  let negativeCount = 0;

  for (let i = 0; i < diffDays; i++) {
    const currentDate = startDate.clone().add(i, 'days');
    const dayKey = currentDate.format('YYYY-MM-DD');
    
    const isScheduled = isFlowScheduledForDate(flow, currentDate);
    
    if (isScheduled) {
      const dayStat = flow.status?.[dayKey];
      if (dayStat && dayStat.emotion) {
        emotions.push({
          date: dayKey,
          emotion: dayStat.emotion,
        });

        // Count positive/negative emotions
        const emotionLower = dayStat.emotion.toLowerCase();
        if (SCORING_CONFIG.EMOTIONS.POSITIVE.includes(emotionLower)) {
          positiveCount++;
        } else if (SCORING_CONFIG.EMOTIONS.NEGATIVE.includes(emotionLower)) {
          negativeCount++;
        }
      }
    }
  }

  return {
    totalEmotions: emotions.length,
    byEmotion: emotions.reduce((acc, { emotion }) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, { Happy: 0, Sad: 0, Angry: 0, Excited: 0, Calm: 0 }),
    positiveCount,
    negativeCount,
  };
};

/**
 * Get scoring configuration for external use
 * @returns {Object} Scoring configuration object
 */
export const getScoringConfig = () => SCORING_CONFIG;

/**
 * Validate flow entry data
 * @param {Object} entry - Flow entry to validate
 * @param {Object} flow - Flow configuration
 * @returns {Object} Validation result
 */
export const validateFlowEntry = (entry, flow) => {
  const errors = [];
  
  if (!entry) {
    errors.push('Entry is required');
    return { isValid: false, errors };
  }
  
  if (!flow) {
    errors.push('Flow configuration is required');
    return { isValid: false, errors };
  }
  
  // Validate tracking type specific fields
  if (flow.trackingType === 'Quantitative') {
    if (entry.quantitative && typeof entry.quantitative.count !== 'number') {
      errors.push('Quantitative count must be a number');
    }
  } else if (flow.trackingType === 'Time-based') {
    if (entry.timebased && typeof entry.timebased.totalDuration !== 'number') {
      errors.push('Time-based duration must be a number');
    }
  }
  
  // Validate emotion if provided
  if (entry.emotion && typeof entry.emotion !== 'string') {
    errors.push('Emotion must be a string');
  }
  
  // Validate note if provided
  if (entry.note && typeof entry.note !== 'string') {
    errors.push('Note must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calculate notes engagement rate
 * @param {Object} flow - Flow object
 * @returns {number} Notes engagement rate (0-100)
 */
export const calculateNotesEngagementRate = (flow) => {
  const emotionData = calculateEmotionDistribution(flow);
  const flowStats = calculateFlowStats(flow);
  
  if (flowStats.streakEligibleDays === 0) {
    return 0;
  }
  
  return parseFloat(((emotionData.totalEmotions / flowStats.streakEligibleDays) * 100).toFixed(1));
};

export default {
  calculateEntryPoints,
  calculateStreak,
  calculateFlowStats,
  calculateEmotionDistribution,
  getScoringConfig,
  validateFlowEntry,
  calculateNotesEngagementRate,
  SCORING_CONFIG,
};
