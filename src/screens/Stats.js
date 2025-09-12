import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import { ProgressChart } from 'react-native-chart-kit';
import { HabitsContext } from '../context/HabitContext';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; // Assuming expo vector icons for arrows

const { width: screenWidth } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
  const { habits } = useContext(HabitsContext);
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const now = moment();

  // Calculate current streak for a single habit
  const calculateCurrentStreak = (habit) => {
    let currentStreak = 0;
    const startDate = moment(habit.startDate);
    const endDate = now;
    for (let i = 0; i <= endDate.diff(startDate, 'days'); i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        habit.repeatType === 'day'
          ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
          : habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        const status = habit.status?.[dayKey];
        if (status?.symbol === '✅') currentStreak++;
        else currentStreak = 0;
      }
    }
    return currentStreak;
  };

  // Calculate best streak for a single habit
  const calculateBestStreak = (habit) => {
    let maxStreak = 0;
    let currentStreak = 0;
    const startDate = moment(habit.startDate);
    const endDate = now;
    for (let i = 0; i <= endDate.diff(startDate, 'days'); i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        habit.repeatType === 'day'
          ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
          : habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        const status = habit.status?.[dayKey];
        if (status?.symbol === '✅') currentStreak++;
        else currentStreak = 0;
        maxStreak = Math.max(maxStreak, currentStreak);
      }
    }
    return maxStreak;
  };

  // Scoreboard calculation for a single habit
  const getScoreboard = (habitId, currentMonth) => {
    const habit = habits.find((h) => h.id === habitId) || {};
    const status = habit.status || {};
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

    habits.forEach((habit) => {
      const startDate = moment(habit.startDate);
      if (!startDate.isValid()) return;

      const endDate = now;
      const diffInDays = endDate.diff(startDate, 'days') + 1;

      for (let i = 0; i < diffInDays; i++) {
        const currentDate = startDate.clone().add(i, 'days');
        const dayKey = currentDate.format('YYYY-MM-DD');
        const isScheduled =
          habit.repeatType === 'day'
            ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
            : habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());

        if (isScheduled) {
          scheduledDays++;
          const status = habit.status?.[dayKey];
          if (status?.symbol === '✅') completed++;
          else if (status?.symbol === '❌') missed++;
          else inactive++;
        }
      }

      // Sum finalScore for each habit in the current month
      const scoreboard = getScoreboard(habit.id, currentMonth);
      overallPoints += scoreboard.finalScore;
    });

    const overallScore = scheduledDays > 0 ? (completed / scheduledDays) * 100 : 0;
    const consistency = scheduledDays > 0 ? (completed / scheduledDays) * 100 : 0;
    const currentStreak = Math.max(...habits.map(calculateCurrentStreak), 0); // Ensure non-negative
    const bestStreak = Math.max(...habits.map(calculateBestStreak), 0); // Ensure non-negative

    return { completed, missed, inactive, overallScore, scheduledDays, consistency, currentStreak, bestStreak, overallPoints };
  };

  const { completed, missed, inactive, overallScore, scheduledDays, consistency, currentStreak, bestStreak, overallPoints } = calculateOverallStats();

  // Calculate habit-specific stats
  const calculateHabitStats = (habit) => {
    const startDate = moment(habit.startDate);
    const endDate = now;
    const diffDays = endDate.diff(startDate, 'days') + 1;

    let completed = 0;
    let habitScheduledDays = 0;

    for (let i = 0; i < diffDays; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled =
        habit.repeatType === 'day'
          ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
          : habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());

      if (isScheduled) {
        habitScheduledDays++;
        const status = habit.status?.[dayKey];
        if (status?.symbol === '✅') completed++;
      }
    }

    const score = habitScheduledDays > 0 ? (completed / habitScheduledDays) * 100 : 0;
    return { completed, habitScheduledDays, score };
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
    labels: habits.map(habit => habit.title),
    data: habits.map(habit => {
      const { score } = calculateHabitStats(habit);
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
      habits.forEach(habit => {
        const isScheduled =
          habit.repeatType === 'day'
            ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
            : habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
        if (isScheduled) {
          const status = habit.status?.[dayKey];
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
    habits.forEach(habit => {
      const { completed, score } = calculateHabitStats(habit);
      const currentStreak = calculateCurrentStreak(habit);
      const bestStreak = calculateBestStreak(habit);

      if (completed >= 10) {
        achievements.push({ title: `Milestone: ${habit.title}`, icon: '🎉', description: `You’ve completed ${habit.title} 10 times! Keep going for a new milestone.` });
      }
      if (score >= 80) {
        achievements.push({ title: `High Consistency: ${habit.title}`, icon: '🌟', description: `Amazing dedication! Your consistency rate for ${habit.title} is above 80%.` });
      }
      if (currentStreak >= 7 || bestStreak >= 7) {
        achievements.push({ title: `Streak Star: ${habit.title}`, icon: '⭐', description: `Streak Star! You’ve hit a 7-day streak for ${habit.title}.` });
      }
      if (currentStreak >= 21 || bestStreak >= 21) {
        achievements.push({ title: `Streak Champion: ${habit.title}`, icon: '🏆', description: `21 consecutive days for ${habit.title}—impressive!` });
      }
      if (currentStreak >= 30 || bestStreak >= 30) {
        achievements.push({ title: `Month Master: ${habit.title}`, icon: '🔥', description: `Month Master! 30 consecutive days for ${habit.title}—outstanding!` });
      }
    });
    return achievements;
  };

  // Insights logic
  const generateInsights = () => {
    const insights = [];
    const today = now.format('YYYY-MM-DD');
    const todayHabits = habits.filter(habit => {
      const isScheduled =
        habit.repeatType === 'day'
          ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(now.format('ddd')))
          : habit.selectedMonthDays && habit.selectedMonthDays.includes(now.date().toString());
      return isScheduled;
    });

    if (todayHabits.length >= 5) {
      insights.push({ text: 'You have a productivity day! Keep up the great work.', icon: '🚀' });
    } else if (todayHabits.length <= 2) {
      insights.push({ text: 'Today is a relax day. Take time to recharge.', icon: '😌' });
    }

    const todayCompleted = todayHabits.reduce((count, habit) => {
      const status = habit.status?.[today];
      return status?.symbol === '✅' ? count + 1 : count;
    }, 0);
    if (todayCompleted >= 4) {
      insights.push({ text: 'Excellent consistency! You’re building strong habits.', icon: '✅' });
    } else if (todayCompleted <= 1) {
      insights.push({ text: 'Let’s try to complete more habits tomorrow for even better progress.', icon: '📅' });
    }

    const todayMissed = todayHabits.reduce((count, habit) => {
      const status = habit.status?.[today];
      return status?.symbol === '❌' ? count + 1 : count;
    }, 0);
    if (todayMissed >= 3) {
      insights.push({ text: 'You missed several habits today. Reflect on what held you back.', icon: '🤔' });
    } else if (todayMissed === 0) {
      insights.push({ text: 'Great job on sticking to your habits!', icon: '🎉' });
    }

    const todayInactive = todayHabits.reduce((count, habit) => {
      const status = habit.status?.[today];
      return !status ? count + 1 : count;
    }, 0);
    if (todayInactive >= 3) {
      insights.push({ text: 'You haven’t updated your habits much today. Stay engaged!', icon: '⏰' });
    } else if (todayInactive === 0) {
      insights.push({ text: 'You’re actively tracking your habits. Well done!', icon: '👍' });
    }

    const todaySadLogs = todayHabits.reduce((count, habit) => {
      const status = habit.status?.[today];
      return status?.emotion === 'sad' ? count + 1 : count;
    }, 0);
    if (todaySadLogs >= 3) {
      insights.push({ text: 'You’ve had several sad moments recently. Time to do something uplifting!', icon: '😔' });
    } else if (todaySadLogs === 0) {
      insights.push({ text: 'Your mood looks positive lately. Keep it up!', icon: '😊' });
    }

    const todayNotes = todayHabits.reduce((count, habit) => {
      const status = habit.status?.[today];
      return status?.note ? count + 1 : count;
    }, 0);
    if (todayNotes >= 3) {
      insights.push({ text: 'Your reflections are insightful. Keep journaling for better self-awareness.', icon: '📝' });
    } else if (todayNotes === 0) {
      insights.push({ text: 'Try adding notes to capture your thoughts and feelings about your habits.', icon: '✍️' });
    }

    return insights;
  };

  const achievements = determineAchievements();
  const insights = generateInsights();

  const renderHabitCard = (habit) => {
    const scaleAnim = new Animated.Value(1);
    const { score } = calculateHabitStats(habit);
    const streak = calculateCurrentStreak(habit);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
      <Animated.View
        style={[styles.habitCard, dynamicStyles.habitCard, { transform: [{ scale: scaleAnim }] }]}
        key={habit.id}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('HabitStatsDetail', { habitId: habit.id })}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.habitRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.habitCardTitle, dynamicStyles.habitCardTitle]}>{habit.title}</Text>
              {streak >= 7 && (
                <Text style={[dynamicStyles.habitCardText, { color: '#FFA500', marginLeft: 8 }]}>
                  Streak: {streak}
                </Text>
              )}
            </View>
            <Text style={[styles.habitCardText, dynamicStyles.habitCardText]}>
              Score: {score.toFixed(0)}%
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
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
              ? theme === 'light' ? '#ebedf0' : '#333'
              : `rgba(0, 128, 0, ${0.3 + intensity * 0.7})`;
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
              ? theme === 'light' ? '#ebedf0' : '#333'
              : `rgba(0, 128, 0, ${0.3 + intensity * 0.7})`;
          return (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.heatMapSquare, { backgroundColor, width: 14, height: 14 }]} />
              <Text style={[dynamicStyles.statText]}>{count} {count === 1 ? 'task' : 'tasks'}</Text>
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

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#FAF9F6' : '#121212',
    },
    header: {
      fontSize: textSize === 'small' ? 24 : textSize === 'large' ? 32 : 28,
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
      fontWeight: highContrast ? '800' : '700',
      textAlign: 'center',
      marginBottom: 16,
      paddingVertical: 8,
    },
    statsCard: {
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1e1e1e',
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    scoreBox: {
      fontSize: textSize === 'small' ? 48 : textSize === 'large' ? 60 : 54,
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 4,
    },
    scoreDenominator: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#666' : '#a0a0a0',
      fontWeight: highContrast ? '600' : '500',
      textAlign: 'center',
    },
    statBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
    },
    statLabel: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: '#1D3557',
      fontWeight: 'bold',
    },
    statValue: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
      fontWeight: '600',
    },
    chartCard: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      padding: 0,
      marginBottom: 16,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      elevation: 0,
    },
    chartTitle: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#333' : '#ccc',
      fontWeight: highContrast ? '700' : '600',
      textAlign: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: textSize === 'small' ? 20 : textSize === 'large' ? 24 : 22,
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
      fontWeight: highContrast ? '700' : '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    habitCard: {
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1e1e1e',
      borderRadius: 20,
      padding: 12,
      marginBottom: 12,
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    habitCardTitle: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
      fontWeight: highContrast ? '700' : '600',
    },
    habitCardText: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: theme === 'light' ? '#666' : '#a0a0a0',
      fontWeight: highContrast ? '600' : '500',
    },
    emptyText: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#dc3545' : '#ff6b6b',
      fontWeight: highContrast ? '700' : '600',
      textAlign: 'center',
      marginTop: 20,
    },
    achievementItem: {
      alignItems: 'center',
      width: '30%',
      backgroundColor: '#FFD700',
      borderRadius: 20,
      padding: 10,
      opacity: 0.9,
    },
    heatMapSquare: {
      margin: 2,
      borderRadius: 4,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 8,
    },
    monthNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
  });

  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
    color2: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
    color3: (opacity = 1) => `rgba(158, 158, 158, ${opacity})`,
    labelColor: (opacity = 1) => (theme === 'light' ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`),
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
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.header, dynamicStyles.header]}>Habit Statistics</Text>
        <View style={[styles.statsCard, dynamicStyles.statsCard]}>
          <Text style={[dynamicStyles.scoreBox]}>{overallScore.toFixed(0)}</Text>
          <Text style={[dynamicStyles.scoreDenominator]}>/100</Text>
          <Text style={[dynamicStyles.sectionTitle]}>Overall Habit Score</Text>
          <View style={[dynamicStyles.statBox]}>
            <Text style={[dynamicStyles.statLabel, { textAlign: 'left' }]}>Overall Points: {overallPoints}</Text>
            <Text style={[dynamicStyles.statValue, { textAlign: 'right' }]}>Streak: {currentStreak}</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Key Metrics</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={[styles.statsCard, dynamicStyles.statsCard, { width: '48%' }]}>
            <Text style={[dynamicStyles.statTitle]}>Success Rate</Text>
            <Text style={[dynamicStyles.statValue]}>{overallScore.toFixed(0)}%</Text>
          </View>
          <View style={[styles.statsCard, dynamicStyles.statsCard, { width: '48%' }]}>
            <Text style={[dynamicStyles.statTitle]}>Best Streak</Text>
            <Text style={[dynamicStyles.statValue]}>{bestStreak} days</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Activity Breakdown</Text>
        <View style={[styles.chartCard, dynamicStyles.chartCard]}>
          <ProgressChart
            data={activityBreakdownData}
            width={screenWidth - 32}
            height={200}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
          />
        </View>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Overall Habit Chart</Text>
        <View style={[styles.chartCard, dynamicStyles.chartCard]}>
          <ProgressChart
            data={overallHabitData}
            width={screenWidth - 32}
            height={200}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
          />
        </View>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Monthly Activity</Text>
        <View style={[styles.chartCard, dynamicStyles.chartCard]}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePreviousMonth}>
              <Ionicons name="chevron-back" size={24} color={theme === 'light' ? '#1a1a1a' : '#e0e0e0'} />
            </TouchableOpacity>
            <Text style={[dynamicStyles.chartTitle]}>Contribution Heat Map ({currentMonth.format('MMMM YYYY')})</Text>
            <TouchableOpacity onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={24} color={theme === 'light' ? '#1a1a1a' : '#e0e0e0'} />
            </TouchableOpacity>
          </View>
          {renderHeatMap()}
          {renderHeatMapLegend()}
        </View>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Habit Performance</Text>
        <View style={[styles.statsCard, dynamicStyles.statsCard]}>
          {habits.length === 0 ? (
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No habits to display</Text>
          ) : (
            habits.map(renderHabitCard)
          )}
        </View>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Achievements</Text>
        <View style={[styles.statsCard, dynamicStyles.statsCard]}>
          <View style={styles.achievementRow}>
            {achievements.length === 0 ? (
              <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No achievements yet</Text>
            ) : (
              achievements.map((ach, index) => (
                <View key={index} style={[styles.achievementItem, dynamicStyles.achievementItem]}>
                  <Text style={[dynamicStyles.statText]}>{ach.icon}</Text>
                  <Text style={[dynamicStyles.statText]}>{ach.title}</Text>
                  <Text style={[dynamicStyles.statText, { fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14 }]}>
                    {ach.description}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Insights</Text>
        <View style={[styles.statsCard, dynamicStyles.statsCard]}>
          {insights.length === 0 ? (
            <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No insights available</Text>
          ) : (
            insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={[dynamicStyles.statText]}>{insight.icon}</Text>
                <Text style={[dynamicStyles.statText]}>{insight.text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 20 },
  header: { marginBottom: 16, textAlign: 'center' },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: { marginBottom: 8 },
  statText: { marginVertical: 4 },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: { marginBottom: 12 },
  sectionTitle: { marginBottom: 12 },
  habitCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  habitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  habitCardTitle: { marginBottom: 4 },
  habitCardText: { marginBottom: 4 },
  emptyText: { textAlign: 'center', padding: 20 },
  achievementRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  insightItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  heatMap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', padding: 5 },
  heatMapSquare: { margin: 2, borderRadius: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
});

export default StatsScreen;