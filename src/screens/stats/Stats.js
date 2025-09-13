import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import { ProgressChart } from 'react-native-chart-kit';
import { FlowsContext } from '../../context/FlowContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/card';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
  const { flows } = useContext(FlowsContext);
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const now = moment();

  // Get theme colors
  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isDark = theme === 'dark';

  // Calculate current streak for a single flow
  const calculateCurrentStreak = (flow) => {
    let currentStreak = 0;
    const startDate = moment(flow.startDate);
    const endDate = now;
    for (let i = 0; i <= endDate.diff(startDate, 'days'); i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        flow.repeatType === 'day'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        const status = flow.status?.[dayKey];
        if (status?.symbol === '✅') currentStreak++;
        else currentStreak = 0;
      }
    }
    return currentStreak;
  };

  // Calculate best streak for a single flow
  const calculateBestStreak = (flow) => {
    let maxStreak = 0;
    let currentStreak = 0;
    const startDate = moment(flow.startDate);
    const endDate = now;
    for (let i = 0; i <= endDate.diff(startDate, 'days'); i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        flow.repeatType === 'day'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        const status = flow.status?.[dayKey];
        if (status?.symbol === '✅') currentStreak++;
        else currentStreak = 0;
        maxStreak = Math.max(maxStreak, currentStreak);
      }
    }
    return maxStreak;
  };

  // Scoreboard calculation for a single flow
  const getScoreboard = (flowId, currentMonth) => {
    const flow = flows.find((h) => h.id === flowId) || {};
    const status = flow.status || {};
    const daysInMonth = moment(currentMonth).daysInMonth();
    let completed = 0;
    let failed = 0;
    let skipped = 0;
    let streakBonus = 0;
    let emotionBonus = 0;
    let notesCount = 0;
    let currentStreak = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = moment(currentMonth).date(day).format('YYYY-MM-DD');
      const dayStatus = status[dateKey]?.symbol;
      const hasEmotion = !!status[dateKey]?.emotion;
      const hasNote = status[dateKey]?.note && status[dateKey].note.trim().length > 0;

      if (dayStatus === '✅') {
        completed++;
        currentStreak++;
        if (currentStreak >= 2) {
          streakBonus += 5; // +5 points for each day in a streak (2+ consecutive days)
        }
      } else {
        currentStreak = 0; // Reset streak on failed or skipped
        if (dayStatus === '❌') {
          failed++;
        } else {
          skipped++;
        }
      }

      if (hasEmotion) {
        emotionBonus += 2; // +2 points for each day with an emotion
      }
      if (hasNote) {
        notesCount += 1; // +1 point for each day with a note
      }
    }

    const completionRate = daysInMonth > 0 ? (completed / daysInMonth) * 100 : 0;
    const finalScore = (completed * 10) + streakBonus + emotionBonus + notesCount;

    return {
      completed,
      failed,
      skipped,
      streakBonus,
      emotionBonus,
      notesCount,
      completionRate: parseFloat(completionRate.toFixed(1)),
      finalScore,
    };
  };

  // Calculate overall stats
  const calculateOverallStats = () => {
    let completed = 0;
    let missed = 0;
    let inactive = 0;
    let scheduledDays = 0;
    let overallPoints = 0;

    flows.forEach((flow) => {
      const startDate = moment(flow.startDate);
      if (!startDate.isValid()) return;

      const endDate = now;
      const diffInDays = endDate.diff(startDate, 'days') + 1;

      for (let i = 0; i < diffInDays; i++) {
        const currentDate = startDate.clone().add(i, 'days');
        const dayKey = currentDate.format('YYYY-MM-DD');
        const isScheduled =
          flow.repeatType === 'day'
            ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
            : flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString());

        if (isScheduled) {
          scheduledDays++;
          const status = flow.status?.[dayKey];
          if (status?.symbol === '✅') completed++;
          else if (status?.symbol === '❌') missed++;
          else inactive++;
        }
      }

      // Sum finalScore for each flow in the current month
      const scoreboard = getScoreboard(flow.id, currentMonth);
      overallPoints += scoreboard.finalScore;
    });

    const overallScore = scheduledDays > 0 ? (completed / scheduledDays) * 100 : 0;
    const consistency = scheduledDays > 0 ? (completed / scheduledDays) * 100 : 0;
    const currentStreak = Math.max(...flows.map(calculateCurrentStreak), 0); // Ensure non-negative
    const bestStreak = Math.max(...flows.map(calculateBestStreak), 0); // Ensure non-negative

    return { completed, missed, inactive, overallScore, scheduledDays, consistency, currentStreak, bestStreak, overallPoints };
  };

  const { completed, missed, inactive, overallScore, scheduledDays, consistency, currentStreak, bestStreak, overallPoints } = calculateOverallStats();

  // Calculate flow-specific stats
  const calculateFlowStats = (flow) => {
    const startDate = moment(flow.startDate);
    const endDate = now;
    const diffDays = endDate.diff(startDate, 'days') + 1;

    let completed = 0;
    let flowScheduledDays = 0;

    for (let i = 0; i < diffDays; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        flow.repeatType === 'day'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString());

      if (isScheduled) {
        flowScheduledDays++;
        const status = flow.status?.[dayKey];
        if (status?.symbol === '✅') completed++;
      }
    }

    const score = flowScheduledDays > 0 ? (completed / flowScheduledDays) * 100 : 0;
    return { completed, flowScheduledDays, score };
  };

  // Progress Trend for combined Activity Breakdown chart
  const activityBreakdownData = {
    labels: ['Completed', 'Missed', 'Inactive'],
    data: [
      scheduledDays > 0 ? completed / scheduledDays : 0,
      scheduledDays > 0 ? missed / scheduledDays : 0,
      scheduledDays > 0 ? inactive / scheduledDays : 0,
    ],
  };

  // Overall Habit Chart data
  const overallHabitData = {
    labels: flows.map(flow => flow.title),
    data: flows.map(flow => {
      const { score } = calculateFlowStats(flow);
      return score / 100; // Normalize to 0-1 for ProgressChart
    }),
  };

  // Custom Heat Map data for Monthly Activity
  const generateContributionData = () => {
    const startOfMonth = moment(currentMonth).startOf('month');
    const endOfMonth = moment(currentMonth).endOf('month');
    const daysInMonth = endOfMonth.diff(startOfMonth, 'days') + 1;
    const contributionData = [];

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = startOfMonth.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      let count = 0;
      flows.forEach(flow => {
        const isScheduled =
          flow.repeatType === 'day'
            ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
            : flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString());
        if (isScheduled) {
          const status = flow.status?.[dayKey];
          if (status?.symbol === '✅') count++;
        }
      });
      contributionData.push({ date: dayKey, count });
    }
    return contributionData;
  };

  const contributionData = generateContributionData();
  const maxCount = Math.max(...contributionData.map(d => d.count), 1); // Avoid division by zero
  const uniqueCounts = [...new Set(contributionData.map(d => d.count))].sort((a, b) => a - b); // Unique task counts for legend

  // Achievements logic
  const determineAchievements = () => {
    const achievements = [];
    flows.forEach(flow => {
      const { completed, score } = calculateFlowStats(flow);
      const currentStreak = calculateCurrentStreak(flow);
      const bestStreak = calculateBestStreak(flow);

      if (completed >= 10) {
        achievements.push({ title: `Milestone: ${flow.title}`, icon: '🎉', description: `You’ve completed ${flow.title} 10 times! Keep going for a new milestone.` });
      }
      if (score >= 80) {
        achievements.push({ title: `High Consistency: ${flow.title}`, icon: '🌟', description: `Amazing dedication! Your consistency rate for ${flow.title} is above 80%.` });
      }
      if (currentStreak >= 7 || bestStreak >= 7) {
        achievements.push({ title: `Streak Star: ${flow.title}`, icon: '⭐', description: `Streak Star! You’ve hit a 7-day streak for ${flow.title}.` });
      }
      if (currentStreak >= 21 || bestStreak >= 21) {
        achievements.push({ title: `Streak Champion: ${flow.title}`, icon: '🏆', description: `21 consecutive days for ${flow.title}—impressive!` });
      }
      if (currentStreak >= 30 || bestStreak >= 30) {
        achievements.push({ title: `Month Master: ${flow.title}`, icon: '🔥', description: `Month Master! 30 consecutive days for ${flow.title}—outstanding!` });
      }
    });
    return achievements;
  };

  // Insights logic
  const generateInsights = () => {
    const insights = [];
    const today = now.format('YYYY-MM-DD');
    const todayHabits = flows.filter(flow => {
      const isScheduled =
        flow.repeatType === 'day'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(now.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(now.date().toString());
      return isScheduled;
    });

    if (todayHabits.length >= 5) {
      insights.push({ text: 'You have a productivity day! Keep up the great work.', icon: '🚀' });
    } else if (todayHabits.length <= 2) {
      insights.push({ text: 'Today is a relax day. Take time to recharge.', icon: '😌' });
    }

    const todayCompleted = todayHabits.reduce((count, flow) => {
      const status = flow.status?.[today];
      return status?.symbol === '✅' ? count + 1 : count;
    }, 0);
    if (todayCompleted >= 4) {
      insights.push({ text: 'Excellent consistency! You’re building strong flows.', icon: '✅' });
    } else if (todayCompleted <= 1) {
      insights.push({ text: 'Let’s try to complete more flows tomorrow for even better progress.', icon: '📅' });
    }

    const todayMissed = todayHabits.reduce((count, flow) => {
      const status = flow.status?.[today];
      return status?.symbol === '❌' ? count + 1 : count;
    }, 0);
    if (todayMissed >= 3) {
      insights.push({ text: 'You missed several flows today. Reflect on what held you back.', icon: '🤔' });
    } else if (todayMissed === 0) {
      insights.push({ text: 'Great job on sticking to your flows!', icon: '🎉' });
    }

    const todayInactive = todayHabits.reduce((count, flow) => {
      const status = flow.status?.[today];
      return !status ? count + 1 : count;
    }, 0);
    if (todayInactive >= 3) {
      insights.push({ text: 'You haven’t updated your flows much today. Stay engaged!', icon: '⏰' });
    } else if (todayInactive === 0) {
      insights.push({ text: 'You’re actively tracking your flows. Well done!', icon: '👍' });
    }

    const todaySadLogs = todayHabits.reduce((count, flow) => {
      const status = flow.status?.[today];
      return status?.emotion === 'sad' ? count + 1 : count;
    }, 0);
    if (todaySadLogs >= 3) {
      insights.push({ text: 'You’ve had several sad moments recently. Time to do something uplifting!', icon: '😔' });
    } else if (todaySadLogs === 0) {
      insights.push({ text: 'Your mood looks positive lately. Keep it up!', icon: '😊' });
    }

    const todayNotes = todayHabits.reduce((count, flow) => {
      const status = flow.status?.[today];
      return status?.note ? count + 1 : count;
    }, 0);
    if (todayNotes >= 3) {
      insights.push({ text: 'Your reflections are insightful. Keep journaling for better self-awareness.', icon: '📝' });
    } else if (todayNotes === 0) {
      insights.push({ text: 'Try adding notes to capture your thoughts and feelings about your flows.', icon: '✍️' });
    }

    return insights;
  };

  const achievements = determineAchievements();
  const insights = generateInsights();

  const renderFlowCard = (flow) => {
    const { score } = calculateFlowStats(flow);
    const streak = calculateCurrentStreak(flow);

    return (
      <Card
        key={flow.id}
        variant="default"
        padding="md"
        margin="sm"
        style={styles.flowCard}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('FlowStatsDetail', { flowId: flow.id, initialTab: 'stats' })}
          style={styles.flowButton}
          accessibilityLabel={`View details for ${flow.title} flow`}
          accessibilityHint="Double tap to view detailed statistics for this flow"
        >
          <View style={styles.flowRow}>
            <View style={styles.flowTitleContainer}>
              <Text style={[styles.flowCardTitle, { color: themeColors.primaryText }]}>{flow.title}</Text>
              {streak >= 7 && (
                <Text style={[styles.streakText, { color: themeColors.warning }]}>
                  🔥 {streak} day streak
                </Text>
              )}
            </View>
            <View style={styles.flowScoreContainer}>
              <Text style={[styles.flowScoreText, { color: themeColors.primaryText }]}>
                {score.toFixed(0)}%
              </Text>
              <Text style={[styles.flowScoreLabel, { color: themeColors.secondaryText }]}>
                Score
            </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  // Custom Heat Map rendering
  const renderHeatMap = () => {
    const squareSize = (screenWidth - 48) / 7 * 0.8; // Reduced by 20%
    return (
      <View style={styles.heatMap}>
        {contributionData.map((item, index) => {
          const intensity = item.count / maxCount;
          const backgroundColor =
            item.count === 0
              ? themeColors.progressBackground
              : `rgba(52, 199, 89, ${0.3 + intensity * 0.7})`; // Using success color
          return (
            <View
              key={index}
              style={[styles.heatMapSquare, { backgroundColor, width: squareSize, height: squareSize }]}
            />
          );
        })}
      </View>
    );
  };

  // Custom Heat Map Legend
  const renderHeatMapLegend = () => {
    return (
      <View style={styles.legend}>
        {uniqueCounts.map((count, index) => {
          const intensity = count / maxCount;
          const backgroundColor =
            count === 0
              ? themeColors.progressBackground
              : `rgba(52, 199, 89, ${0.3 + intensity * 0.7})`; // Using success color
          return (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.heatMapSquare, { backgroundColor, width: 14, height: 14 }]} />
              <Text style={[styles.legendText, { color: themeColors.secondaryText }]}>{count} {count === 1 ? 'task' : 'tasks'}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(moment(currentMonth).subtract(1, 'month').startOf('month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(moment(currentMonth).add(1, 'month').startOf('month'));
  };

  // Handle empty states
  const renderEmptyState = (message, icon = '📊') => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>{icon}</Text>
      <Text style={[styles.emptyText, { color: themeColors.secondaryText }]}>{message}</Text>
    </View>
  );


  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`, // Using primaryOrange
    color2: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`, // Using error color
    color3: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`, // Using secondaryText
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 0,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      elevation: 0,
    },
    barPercentage: 0.5,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: layout.spacing.xl + 80 }]} // Account for tab bar
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.header, { color: themeColors.primaryText }]}>Statistics</Text>
          <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>
            Track your progress and discover insights
          </Text>
        </View>

        {/* Overall Score Card */}
        <Card variant="default" padding="lg" margin="md">
          <View style={styles.scoreContainer}>
            <View style={styles.scoreMainRow}>
              <View style={styles.scoreNumberContainer}>
                <Text style={[styles.scoreNumber, { color: themeColors.primaryOrange }]}>{overallScore.toFixed(0)}</Text>
                <Text style={[styles.scoreDenominator, { color: themeColors.secondaryText }]}>/100</Text>
              </View>
              <View style={styles.scoreStatsContainer}>
                <View style={styles.scoreStatItem}>
                  <Text style={[styles.scoreStatValue, { color: themeColors.primaryText }]}>{overallPoints}</Text>
                  <Text style={[styles.scoreStatLabel, { color: themeColors.secondaryText }]}>Points</Text>
                </View>
                <View style={styles.scoreStatItem}>
                  <Text style={[styles.scoreStatValue, { color: themeColors.primaryText }]}>{currentStreak}</Text>
                  <Text style={[styles.scoreStatLabel, { color: themeColors.secondaryText }]}>Streak</Text>
          </View>
        </View>
          </View>
            <Text style={[styles.scoreLabel, { color: themeColors.primaryText }]}>Overall Flow Score</Text>
          </View>
        </Card>

        {/* Key Metrics */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Key Metrics</Text>
        <View style={styles.metricsRow}>
          <Card variant="default" padding="md" margin="sm" style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: themeColors.secondaryText }]}>Success Rate</Text>
            <Text style={[styles.metricValue, { color: themeColors.primaryText }]}>{overallScore.toFixed(0)}%</Text>
          </Card>
          <Card variant="default" padding="md" margin="sm" style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: themeColors.secondaryText }]}>Best Streak</Text>
            <Text style={[styles.metricValue, { color: themeColors.primaryText }]}>{bestStreak} days</Text>
          </Card>
        </View>

        {/* Activity Breakdown Chart */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Activity Breakdown</Text>
        <Card variant="default" padding="md" margin="md">
          <ProgressChart
            data={activityBreakdownData}
            width={screenWidth - 64}
            height={200}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
          />
        </Card>

        {/* Overall Habit Chart */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Overall Flow Chart</Text>
        <Card variant="default" padding="md" margin="md">
          <ProgressChart
            data={overallHabitData}
            width={screenWidth - 64}
            height={200}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
          />
        </Card>

        {/* Monthly Activity Heat Map */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Monthly Activity</Text>
        <Card variant="default" padding="md" margin="md">
          <View style={styles.monthNav}>
            <Button
              variant="icon"
              onPress={handlePreviousMonth}
              accessibilityLabel="Previous month"
              accessibilityHint="Double tap to view previous month's activity"
            >
              <Ionicons name="chevron-back" size={24} color={themeColors.primaryText} />
            </Button>
            <Text style={[styles.chartTitle, { color: themeColors.primaryText }]}>
              {currentMonth.format('MMMM YYYY')}
            </Text>
            <Button
              variant="icon"
              onPress={handleNextMonth}
              accessibilityLabel="Next month"
              accessibilityHint="Double tap to view next month's activity"
            >
              <Ionicons name="chevron-forward" size={24} color={themeColors.primaryText} />
            </Button>
          </View>
          {renderHeatMap()}
          {renderHeatMapLegend()}
        </Card>

        {/* Habit Performance */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Flow Performance</Text>
        <Card variant="default" padding="md" margin="md">
          {flows.length === 0 ? (
            renderEmptyState('No flows to display', '📊')
          ) : (
            <View style={styles.flowsList}>
              {flows.map(renderFlowCard)}
            </View>
          )}
        </Card>

        {/* Achievements */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Achievements</Text>
        <Card variant="default" padding="md" margin="md">
            {achievements.length === 0 ? (
            renderEmptyState('No achievements yet', '🏆')
          ) : (
            <View style={styles.achievementGrid}>
              {achievements.map((ach, index) => (
                <Card key={index} variant="filled" padding="sm" margin="xs" style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>{ach.icon}</Text>
                  <Text style={[styles.achievementTitle, { color: themeColors.primaryText }]}>{ach.title}</Text>
                  <Text style={[styles.achievementDescription, { color: themeColors.secondaryText }]}>
                    {ach.description}
                  </Text>
                </Card>
              ))}
                </View>
          )}
        </Card>

        {/* Insights */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Insights</Text>
        <Card variant="default" padding="md" margin="md">
          {insights.length === 0 ? (
            renderEmptyState('No insights available', '💡')
          ) : (
            insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>{insight.text}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: layout.spacing.md,
  },
  headerContainer: {
    marginBottom: layout.spacing.lg,
    alignItems: 'center',
  },
  header: {
    ...typography.styles.title1,
    marginBottom: layout.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.styles.body,
    textAlign: 'center',
    opacity: 0.8,
  },
  sectionTitle: {
    ...typography.styles.title2,
    marginBottom: layout.spacing.md,
    textAlign: 'center',
  },
  
  // Score Section
  scoreContainer: {
    alignItems: 'center',
  },
  scoreMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: layout.spacing.md,
  },
  scoreNumberContainer: {
    alignItems: 'center',
    flex: 1,
  },
  scoreNumber: {
    ...typography.styles.largeTitle,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  scoreDenominator: {
    ...typography.styles.title3,
    opacity: 0.7,
  },
  scoreStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-around',
  },
  scoreStatItem: {
    alignItems: 'center',
  },
  scoreStatValue: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  scoreStatLabel: {
    ...typography.styles.caption,
    opacity: 0.8,
  },
  scoreLabel: {
    ...typography.styles.title2,
    textAlign: 'center',
  },
  
  // Metrics Section
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.lg,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.styles.caption,
    marginBottom: layout.spacing.xs,
  },
  metricValue: {
    ...typography.styles.title2,
    fontWeight: '700',
  },
  
  // Chart Section
  chartTitle: {
    ...typography.styles.title3,
    textAlign: 'center',
    marginBottom: layout.spacing.sm,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  
  // Heat Map
  heatMap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: layout.spacing.xs,
  },
  heatMapSquare: {
    margin: 2,
    borderRadius: layout.borderRadius.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: layout.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.spacing.sm,
  },
  legendText: {
    ...typography.styles.caption,
  },
  
  // Flow Cards
  flowsList: {
    // Container for flow cards list
  },
  flowCard: {
    marginBottom: layout.spacing.sm,
  },
  flowButton: {
    width: '100%',
    padding: 0,
    backgroundColor: 'transparent',
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  flowTitleContainer: {
    flex: 1,
  },
  flowCardTitle: {
    ...typography.styles.title3,
    marginBottom: layout.spacing.xs,
  },
  streakText: {
    ...typography.styles.caption,
    fontWeight: '600',
  },
  flowScoreContainer: {
    alignItems: 'flex-end',
  },
  flowScoreText: {
    ...typography.styles.title3,
    fontWeight: '700',
  },
  flowScoreLabel: {
    ...typography.styles.caption,
  },
  
  // Achievements
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: colors.light.warning + '20', // 20% opacity
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: layout.spacing.xs,
  },
  achievementTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: layout.spacing.xs,
  },
  achievementDescription: {
    ...typography.styles.caption,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Insights
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: layout.spacing.sm,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: layout.spacing.sm,
  },
  insightText: {
    ...typography.styles.body,
    flex: 1,
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: layout.spacing.md,
  },
  emptyText: {
    ...typography.styles.body,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default StatsScreen;