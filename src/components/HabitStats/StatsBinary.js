import React, { useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { ProgressChart } from 'react-native-chart-kit';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const StatsBinary = ({ habit, selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear }) => {
  const { getScoreboard, getActivityStats, getEmotionalActivity } = useContext(ActivityContext) || {};
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};

  // Debug context values
  console.log('ActivityContext:', { getScoreboard, getActivityStats, getEmotionalActivity });
  console.log('ThemeContext:', { theme, textSize, highContrast });

  if (!getScoreboard || !getActivityStats || !getEmotionalActivity) {
    return <Text style={[styles.errorText, dynamicStyles.errorText]}>Data unavailable</Text>;
  }

  const scoreboard = getScoreboard(habit.id);
  const activityStats = getActivityStats(habit.id);
  const emotionalActivity = getEmotionalActivity(habit.id);

  // Debug scoreboard data
  console.log('Scoreboard:', scoreboard);

  // Fallback for scoreboard
  if (!scoreboard) {
    return <Text style={[styles.errorText, dynamicStyles.errorText]}>Scoreboard data unavailable</Text>;
  }

  // Ensure all required scoreboard properties with fallbacks
  const safeScoreboard = {
    completed: scoreboard.completed || 0,
    failed: scoreboard.failed || 0,
    inactive: scoreboard.inactive || 0,
    streakBonus: scoreboard.streakBonus || 0,
    emotionBonus: scoreboard.emotionBonus || 0,
    notesCount: scoreboard.notesCount || 0,
    finalScore: scoreboard.finalScore || 0,
  };

  const now = moment();
  const startDate = moment(habit.startDate);
  if (!startDate.isValid()) {
    return <Text style={[styles.errorText, dynamicStyles.errorText]}>Invalid habit start date</Text>;
  }
  const endDate = now;
  const diffDays = endDate.diff(startDate, 'days') + 1;

  // Calculate current streak (excluding today)
  const calculateCurrentStreak = () => {
    let currentStreak = 0;
    const sortedDates = [];
    for (let i = 0; i < diffDays - 1; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = habit.repeatType === 'day'
        ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
        : habit.repeatType === 'month' && habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        sortedDates.push({ date: currentDate, dayKey });
      }
    }
    for (let j = sortedDates.length - 1; j >= 0; j--) {
      const pastStatus = habit.status?.[sortedDates[j].dayKey];
      if (pastStatus?.symbol === '✅') {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  };

  const currentStreak = calculateCurrentStreak();

  // Calculate stats for charts
  const weeklyData = [];
  const monthlyData = [];
  const yearlyData = [];
  const weeklyLabels = [];
  const monthlyLabels = [];
  const yearlyLabels = [];

  // Weekly data: Last 7 full weeks
  const totalWeeks = Math.ceil(diffDays / 7);
  const startWeekIndex = Math.max(0, totalWeeks - 7);
  for (let w = startWeekIndex; w < startWeekIndex + 7 && w < totalWeeks; w++) {
    let weekCompleted = 0;
    let weekMissed = 0;
    let weekInactive = 0;
    let weekScheduled = 0;
    const weekStart = startDate.clone().add(w * 7, 'days').startOf('week');
    const weekEnd = weekStart.clone().endOf('week');
    for (let d = 0; d <= weekEnd.diff(weekStart, 'days'); d++) {
      const currentDate = weekStart.clone().add(d, 'days');
      if (currentDate.isAfter(endDate) || currentDate.isBefore(startDate)) continue;
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = habit.repeatType === 'day'
        ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
        : habit.repeatType === 'month' && habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        weekScheduled++;
        const status = habit.status?.[dayKey];
        if (status?.symbol === '✅') {
          weekCompleted++;
        } else if (status?.symbol === '❌') {
          weekMissed++;
        } else {
          weekInactive++;
        }
      }
    }
    weeklyData.push({
      completed: weekScheduled > 0 ? weekCompleted : 0,
      missed: weekScheduled > 0 ? weekMissed : 0,
      inactive: weekScheduled > 0 ? weekInactive : 0,
    });
    weeklyLabels.push(`W${w + 1}`);
  }

  // Monthly data: Last 12 months
  for (let m = 0; m < 12; m++) {
    let monthCompleted = 0;
    let monthMissed = 0;
    let monthInactive = 0;
    let monthScheduled = 0;
    const monthStart = moment().year(selectedYear).month(m).startOf('month');
    const monthEnd = monthStart.clone().endOf('month');
    for (let d = 0; d <= monthEnd.diff(monthStart, 'days'); d++) {
      const currentDate = monthStart.clone().add(d, 'days');
      if (currentDate.isAfter(endDate) || currentDate.isBefore(startDate)) continue;
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = habit.repeatType === 'day'
        ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
        : habit.repeatType === 'month' && habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        monthScheduled++;
        const status = habit.status?.[dayKey];
        if (status?.symbol === '✅') {
          monthCompleted++;
        } else if (status?.symbol === '❌') {
          monthMissed++;
        } else {
          monthInactive++;
        }
      }
    }
    monthlyData.push({
      completed: monthScheduled > 0 ? monthCompleted : 0,
      missed: monthScheduled > 0 ? monthMissed : 0,
      inactive: monthScheduled > 0 ? monthInactive : 0,
    });
    monthlyLabels.push(moment().month(m).format('MMM'));
  }

  // Yearly data: Last 5 years
  for (let y = 0; y < 5; y++) {
    let yearCompleted = 0;
    let yearMissed = 0;
    let yearInactive = 0;
    let yearScheduled = 0;
    const yearStart = moment().year(selectedYear - 4 + y).startOf('year');
    const yearEnd = yearStart.clone().endOf('year');
    for (let d = 0; d <= yearEnd.diff(yearStart, 'days'); d++) {
      const currentDate = yearStart.clone().add(d, 'days');
      if (currentDate.isAfter(endDate) || currentDate.isBefore(startDate)) continue;
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = habit.repeatType === 'day'
        ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
        : habit.repeatType === 'month' && habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        yearScheduled++;
        const status = habit.status?.[dayKey];
        if (status?.symbol === '✅') {
          yearCompleted++;
        } else if (status?.symbol === '❌') {
          yearMissed++;
        } else {
          yearInactive++;
        }
      }
    }
    yearlyData.push({
      completed: yearScheduled > 0 ? yearCompleted : 0,
      missed: yearScheduled > 0 ? yearMissed : 0,
      inactive: yearScheduled > 0 ? yearInactive : 0,
    });
    yearlyLabels.push(yearStart.format('YYYY'));
  }

  // Calculate previous month points for comparison
  let prevMonthPoints = 0;
  const lastMonth = now.clone().subtract(1, 'month');
  for (let i = 0; i <= endDate.diff(startDate, 'days'); i++) {
    const currentDate = startDate.clone().add(i, 'days');
    if (currentDate.isBetween(lastMonth.clone().startOf('month'), lastMonth.clone().endOf('month'), 'day', '[]')) {
      const dayKey = currentDate.format('YYYY-MM-DD');
      const isScheduled = habit.repeatType === 'day'
        ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(currentDate.format('ddd')))
        : habit.repeatType === 'month' && habit.selectedMonthDays && habit.selectedMonthDays.includes(currentDate.date().toString());
      if (isScheduled) {
        const status = habit.status?.[dayKey];
        if (status?.symbol === '✅') prevMonthPoints++;
      }
    }
  }
  const pointsChange = prevMonthPoints > 0 ? ((safeScoreboard.completed - prevMonthPoints) / prevMonthPoints * 100).toFixed(1) : 0;

  // Emotion Tracker Data
  const emotionData = [
    { emoji: '😊', key: 'Happy', count: emotionalActivity.byEmotion?.Happy || 0 },
    { emoji: '😢', key: 'Sad', count: emotionalActivity.byEmotion?.Sad || 0 },
    { emoji: '😣', key: 'Angry', count: emotionalActivity.byEmotion?.Angry || 0 },
    { emoji: '🎉', key: 'Excited', count: emotionalActivity.byEmotion?.Excited || 0 },
    { emoji: '😌', key: 'Calm', count: emotionalActivity.byEmotion?.Calm || 0 },
  ].map(item => ({
    ...item,
    percentage: emotionalActivity.totalEmotions > 0 ? ((item.count / emotionalActivity.totalEmotions) * 100).toFixed(0) : 0,
  }));

  const maxEmotion = emotionData.reduce((max, item) => item.count > max.count ? item : max, emotionData[0]);

  // Activity Chart Data
  const activityChartData = {
    labels: ['Completed', 'Missed', 'Inactive'],
    data: [
      activityStats.total > 0 ? (activityStats.byStatus.Completed || 0) / activityStats.total : 0,
      activityStats.total > 0 ? (activityStats.byStatus.Missed || 0) / activityStats.total : 0,
      activityStats.total > 0 ? (activityStats.byStatus.Inactive || 0) / activityStats.total : 0,
    ],
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1, index) => {
      const activityColors = [
        `rgba(144, 238, 144, ${opacity})`, // Light green for Completed
        `rgba(255, 182, 193, ${opacity})`, // Light red for Missed
        `rgba(255, 218, 185, ${opacity})`, // Light orange for Inactive
      ];
      return activityColors[index % activityColors.length];
    },
    labelColor: (opacity = 1) => (theme === 'light' ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`),
    style: { borderRadius: 0 },
    barPercentage: 0.5,
  };

  // Custom Bar Chart Component
  const BarChartCustom = ({ data = [], labels = [], width, height, title, subtitle }) => {
    const scrollViewRef = useRef(null);

    if (!Array.isArray(data) || !Array.isArray(labels) || data.length !== labels.length) {
      console.warn('Invalid BarChartCustom props:', { data, labels });
      return (
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, dynamicStyles.chartTitle]}>{title}</Text>
          <Text style={[styles.chartSubtitle, dynamicStyles.chartSubtitle]}>No data available</Text>
        </View>
      );
    }

    const barWidth = 24;
    const spacing = 6;
    const groupSpacing = 32;
    const totalBars = data.length * 3;
    const totalWidth = Math.max(totalBars * barWidth + (data.length - 1) * groupSpacing + (totalBars - data.length) * spacing, width);
    const chartWidth = totalWidth;
    const chartHeight = height - 120;
    const maxValue = Math.max(...data.map(d => Math.max(d.completed || 0, d.missed || 0, d.inactive || 0)), 1);

    // Auto-scroll to current week/month/year
    useEffect(() => {
      if (scrollViewRef.current && data.length > 0) {
        const barGroupWidth = barWidth * 3 + groupSpacing;
        let scrollX = 0;

        if (selectedPeriod === 'weekly') {
          // Scroll to the last week (current week)
          scrollX = Math.max(0, (data.length - 1) * barGroupWidth - (width - barGroupWidth) / 2);
        } else if (selectedPeriod === 'monthly') {
          // Center the current month
          const currentMonthIndex = moment().month();
          const targetIndex = monthlyLabels.indexOf(moment().month(currentMonthIndex).format('MMM'));
          if (targetIndex !== -1) {
            scrollX = Math.max(0, targetIndex * barGroupWidth - (width - barGroupWidth) / 2);
          }
        } else if (selectedPeriod === 'yearly') {
          // Center the current year
          const currentYearIndex = yearlyLabels.indexOf(moment().year().toString());
          if (currentYearIndex !== -1) {
            scrollX = Math.max(0, currentYearIndex * barGroupWidth - (width - barGroupWidth) / 2);
          }
        }

        // Ensure scrollX is within bounds
        scrollX = Math.max(0, Math.min(scrollX, totalWidth - width));
        scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
      }
    }, [selectedPeriod, data, labels, width]);

    return (
      <View style={[styles.chartContainer, { minHeight: height }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.chartTitle, dynamicStyles.chartTitle]}>
            {selectedPeriod === 'yearly' ? selectedYear : title}
          </Text>
          <Text style={[styles.chartSubtitle, dynamicStyles.chartSubtitle]}>{subtitle}</Text>
        </View>
        
        {/* Legend */}
        <View style={styles.chartLegend}>
          {[
            { color: '#90EE90', label: 'Completed' },
            { color: '#FFB6C1', label: 'Missed' },
            { color: '#FFDAB9', label: 'Inactive' },
          ].map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, dynamicStyles.legendText]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: chartWidth, paddingHorizontal: 16 }}
        >
          <Svg width={chartWidth} height={height}>
            {data.map((item, index) => {
              const xBase = index * (barWidth * 3 + groupSpacing);
              const bars = [
                { value: item.completed || 0, color: '#90EE90', label: 'C' },
                { value: item.missed || 0, color: '#FFB6C1', label: 'M' },
                { value: item.inactive || 0, color: '#FFDAB9', label: 'I' },
              ];
              return bars.map((bar, barIndex) => {
                const barHeight = (bar.value / maxValue) * (chartHeight - 20);
                const x = xBase + barIndex * (barWidth + spacing);
                const y = chartHeight - barHeight;
                if (isNaN(barHeight) || isNaN(x) || isNaN(y)) {
                  console.warn('Invalid SVG attributes:', { barHeight, x, y });
                  return null;
                }
                return (
                  <React.Fragment key={`${index}-${barIndex}`}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 0)}
                      fill={bar.color}
                      rx={6}
                      ry={6}
                    />
                    {bar.value > 0 && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={y - 8}
                        fill={theme === 'light' ? '#333' : '#FFF'}
                        fontSize={11}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {bar.value}
                      </SvgText>
                    )}
                  </React.Fragment>
                );
              });
            })}
            {labels.map((label, index) => {
              const xBase = index * (barWidth * 3 + groupSpacing);
              return (
                <SvgText
                  key={index}
                  x={xBase + (barWidth * 1.5 + spacing)}
                  y={chartHeight + 25}
                  fill={theme === 'light' ? '#333' : '#FFF'}
                  fontSize={12}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </Svg>
        </ScrollView>
        
        {selectedPeriod === 'yearly' && (
          <View style={styles.yearNavigation}>
            <TouchableOpacity
              onPress={() => setSelectedYear(selectedYear - 1)}
              style={styles.yearNavButton}
            >
              <Text style={[dynamicStyles.chevron, { marginRight: 20 }]}>◄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedYear(selectedYear + 1)}
              disabled={selectedYear >= moment().year()}
              style={[styles.yearNavButton, { opacity: selectedYear < moment().year() ? 1 : 0.3 }]}
            >
              <Text style={[dynamicStyles.chevron, { marginLeft: 20 }]}>►</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 20,
    },
    scoreCard: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      borderRadius: 24,
      margin: 20,
      backgroundColor: theme === 'light' ? '#FAFAFA' : '#333',
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: highContrast ? 0.3 : 0.2,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 1000,
    },
    scoreContent: {
      padding: 20,
      borderRadius: 20,
      flexDirection: 'column',
      alignItems: 'center',
    },
    habitTitle: {
      fontSize: textSize === 'small' ? 20 : textSize === 'large' ? 28 : 24,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    scoreText: {
      fontSize: textSize === 'small' ? 40 : textSize === 'large' ? 52 : 48,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: '700',
    },
    labelText: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#666' : '#AAA',
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 12,
    },
    scoreFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 16,
    },
    changeText: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: pointsChange >= 0 ? '#2ECC71' : '#E74C3C',
      fontWeight: '600',
    },
    streakText: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: '600',
    },
    emotionCard: {
      backgroundColor: theme === 'light' ? '#FAFAFA' : '#333',
      borderRadius: 20,
      marginBottom: 24,
      padding: 20,
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: highContrast ? 0.3 : 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    emotionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    emotionBox: {
      width: (screenWidth - 80) / 5,
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#444',
      borderWidth: 2,
      borderColor: theme === 'light' ? '#EEE' : '#555',
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    highlightedEmotionBox: {
      borderWidth: 2,
      borderColor: '#FFA500',
      shadowColor: '#FFA500',
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 5,
    },
    emotionEmoji: {
      fontSize: textSize === 'small' ? 24 : textSize === 'large' ? 32 : 28,
      marginBottom: 8,
    },
    emotionPercentage: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: '600',
    },
    statsCard: {
      backgroundColor: theme === 'light' ? '#FAFAFA' : '#333',
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      shadowColor: theme === 'light' ? '#000' : '#fff',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: highContrast ? 0.3 : 0.15,
      shadowRadius: 8,
      elevation: 6,
      minHeight: 200,
    },
    statTitle: {
      fontSize: textSize === 'small' ? 20 : textSize === 'large' ? 24 : 22,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
      paddingHorizontal: 10,
    },
    statIcon: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      marginRight: 10,
    },
    statLabel: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 18 : 16,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: 'bold',
    },
    statSubtext: {
      fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 14 : 12,
      color: theme === 'light' ? '#666' : '#AAA',
    },
    statScore: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 18 : 16,
      fontWeight: 'bold',
    },
    chartTitle: {
      fontSize: textSize === 'small' ? 20 : textSize === 'large' ? 24 : 22,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: highContrast ? '700' : '600',
      textAlign: 'center',
      marginBottom: 4,
    },
    chartSubtitle: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: theme === 'light' ? '#666' : '#AAA',
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 12,
    },
    errorText: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#dc3545' : '#ff6b6b',
      fontWeight: highContrast ? '700' : '600',
      textAlign: 'center',
      marginTop: 20,
    },
    periodButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
      marginBottom: 20,
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#333',
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#FFA500',
      height: 48,
      overflow: 'hidden',
      shadowColor: '#FFA500',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 22,
    },
    selectedButton: {
      backgroundColor: '#FFE4B5',
      shadowColor: '#FFA500',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    buttonText: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: '#999',
      fontWeight: '600',
      textAlign: 'center',
    },
    selectedButtonText: {
      color: '#FFA500',
      fontWeight: 'bold',
    },
    chevron: {
      fontSize: textSize === 'small' ? 20 : textSize === 'large' ? 28 : 24,
      color: '#FFA500',
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
      paddingHorizontal: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendColor: {
      width: 15,
      height: 15,
      borderRadius: 8,
      marginRight: 8,
    },
    legendText: {
      fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 14 : 13,
      color: theme === 'light' ? '#666' : '#AAA',
    },
    yearNavigation: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
    },
    yearNavButton: {
      opacity: 1,
    },
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Score Card (Fixed to Top) */}
      <View style={[dynamicStyles.scoreCard]}>
        <LinearGradient
          colors={['#FFA500', theme === 'light' ? '#FFFFFF' : '#333']}
          style={[dynamicStyles.scoreContent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[dynamicStyles.habitTitle]}>{habit.title || 'Habit'}</Text>
          <Text style={[dynamicStyles.scoreText]}>{safeScoreboard.finalScore} points</Text>
          <Text style={[dynamicStyles.labelText]}>Habit Score</Text>
          <View style={[dynamicStyles.scoreFooter]}>
            {prevMonthPoints > 0 && (
              <Text style={[dynamicStyles.changeText]}>
                {pointsChange >= 0 ? `▲ ${pointsChange}%` : `▼ ${Math.abs(pointsChange)}%`} vs last month
              </Text>
            )}
            <Text style={[dynamicStyles.streakText]}>🔥 {currentStreak}-day streak</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Main Content */}
      <ScrollView
        style={[dynamicStyles.container]}
        contentContainerStyle={{ paddingTop: 180, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Emotion Tracker */}
        <View style={[dynamicStyles.emotionCard]}>
          <Text style={[styles.chartTitle, dynamicStyles.chartTitle]}>Emotional Trends</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[dynamicStyles.emotionContainer]}
          >
            {emotionData.map((item, index) => (
              <View
                key={index}
                style={[
                  dynamicStyles.emotionBox,
                  item.key === maxEmotion.key && emotionalActivity.totalEmotions > 0 ? dynamicStyles.highlightedEmotionBox : {},
                ]}
              >
                <Text style={[dynamicStyles.emotionEmoji]}>{item.emoji}</Text>
                <Text style={[dynamicStyles.emotionPercentage]}>{item.percentage}%</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Activity Breakdown */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, dynamicStyles.chartTitle]}>Activity Breakdown</Text>
          <ProgressChart
            data={activityChartData}
            width={screenWidth - 48}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
          />
        </View>

        {/* Completion Overview */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, dynamicStyles.chartTitle]}>Completion Overview</Text>
          <View style={dynamicStyles.periodButtonContainer}>
            <TouchableOpacity
              style={[dynamicStyles.button, selectedPeriod === 'weekly' ? dynamicStyles.selectedButton : {}]}
              onPress={() => setSelectedPeriod('weekly')}
            >
              <Text style={[dynamicStyles.buttonText, selectedPeriod === 'weekly' ? dynamicStyles.selectedButtonText : {}]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.button, selectedPeriod === 'monthly' ? dynamicStyles.selectedButton : {}]}
              onPress={() => setSelectedPeriod('monthly')}
            >
              <Text style={[dynamicStyles.buttonText, selectedPeriod === 'monthly' ? dynamicStyles.selectedButtonText : {}]}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.button, selectedPeriod === 'yearly' ? dynamicStyles.selectedButton : {}]}
              onPress={() => setSelectedPeriod('yearly')}
            >
              <Text style={[dynamicStyles.buttonText, selectedPeriod === 'yearly' ? dynamicStyles.selectedButtonText : {}]}>Year</Text>
            </TouchableOpacity>
          </View>
          <BarChartCustom
            data={selectedPeriod === 'weekly' ? weeklyData : selectedPeriod === 'monthly' ? monthlyData : yearlyData}
            labels={selectedPeriod === 'weekly' ? weeklyLabels : selectedPeriod === 'monthly' ? monthlyLabels : yearlyLabels}
            width={screenWidth - 48}
            height={280}
            title={selectedPeriod === 'weekly' ? 'Weekly Completion' : selectedPeriod === 'monthly' ? 'Monthly Completion' : selectedYear}
            subtitle="Completed, Missed, Inactive Days"
          />
        </View>

        {/* Score Breakdown */}
        <View style={[styles.statsCard, dynamicStyles.statsCard]}>
          <Text style={[styles.statTitle, dynamicStyles.statTitle]}>Score Breakdown</Text>
          <View style={[dynamicStyles.statRow]}>
            <Text style={[dynamicStyles.statIcon]}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.statLabel]}>Completion</Text>
              <Text style={[dynamicStyles.statSubtext]}>{safeScoreboard.completed} completed days × 10 points</Text>
            </View>
            <Text style={[dynamicStyles.statScore, { color: '#2ECC71' }]}>+{safeScoreboard.completed * 10}</Text>
          </View>
          <View style={[dynamicStyles.statRow]}>
            <Text style={[dynamicStyles.statIcon]}>❌</Text>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.statLabel]}>Missed</Text>
              <Text style={[dynamicStyles.statSubtext]}>{safeScoreboard.failed} missed days × -8 points</Text>
            </View>
            <Text style={[dynamicStyles.statScore, { color: '#E74C3C' }]}>{safeScoreboard.failed * -8}</Text>
          </View>
          <View style={[dynamicStyles.statRow]}>
            <Text style={[dynamicStyles.statIcon]}>➖</Text>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.statLabel]}>Inactive</Text>
              <Text style={[dynamicStyles.statSubtext]}>{safeScoreboard.inactive} inactive days × -4 points</Text>
            </View>
            <Text style={[dynamicStyles.statScore, { color: '#E74C3C' }]}>{safeScoreboard.inactive * -4}</Text>
          </View>
          <View style={[dynamicStyles.statRow]}>
            <Text style={[dynamicStyles.statIcon]}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.statLabel]}>Streak Bonus</Text>
              <Text style={[dynamicStyles.statSubtext]}>{Math.floor(currentStreak / 7)} weekly streaks × 5 points</Text>
            </View>
            <Text style={[dynamicStyles.statScore, { color: '#2ECC71' }]}>+{safeScoreboard.streakBonus}</Text>
          </View>
          <View style={[dynamicStyles.statRow]}>
            <Text style={[dynamicStyles.statIcon]}>😊</Text>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.statLabel]}>Emotion Bonus</Text>
              <Text style={[dynamicStyles.statSubtext]}>
                {safeScoreboard.emotionBonus >= 0
                  ? `${safeScoreboard.emotionBonus / 2} positive emotions × 2 points`
                  : `${Math.abs(safeScoreboard.emotionBonus)} negative emotions × -1 point`}
              </Text>
            </View>
            <Text style={[dynamicStyles.statScore, { color: safeScoreboard.emotionBonus >= 0 ? '#2ECC71' : '#E74C3C' }]}>{safeScoreboard.emotionBonus}</Text>
          </View>
          <View style={[dynamicStyles.statRow]}>
            <Text style={[dynamicStyles.statIcon]}>📝</Text>
            <View style={{ flex: 1 }}>
              <Text style={[dynamicStyles.statLabel]}>Notes/Reflection</Text>
              <Text style={[dynamicStyles.statSubtext]}>{safeScoreboard.notesCount} insightful notes × 1 point</Text>
            </View>
            <Text style={[dynamicStyles.statScore, { color: '#2ECC71' }]}>+{safeScoreboard.notesCount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  chartTitle: {
    marginBottom: 8,
  },
  chartSubtitle: {
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    marginBottom: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  yearNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  yearNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
  },
});

export default StatsBinary;