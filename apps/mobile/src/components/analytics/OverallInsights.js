import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { colors, typography, layout } from '../../../styles';

const OverallInsights = ({ flows, theme = 'light' }) => {
  const themeColors = theme === 'light' ? colors.light : colors.dark;

  const insights = useMemo(() => {
    const now = moment();
    const insights = [];
    
    // Calculate comprehensive stats
    let totalCompleted = 0;
    let totalScheduled = 0;
    let totalPoints = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let weeklyData = [];
    let flowPerformance = [];
    let categoryData = {};

    // Generate weekly trend data
    for (let i = 6; i >= 0; i--) {
      const date = now.clone().subtract(i, 'days');
      const dayKey = date.format('YYYY-MM-DD');
      
      let dayCompleted = 0;
      let dayScheduled = 0;

      flows.forEach(flow => {
        const isScheduled = flow.repeatType === 'day' 
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(date.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(date.date().toString());

        if (isScheduled) {
          dayScheduled++;
          totalScheduled++;
          const status = flow.status?.[dayKey];
          if (status?.symbol === '✅') {
            dayCompleted++;
            totalCompleted++;
            totalPoints += 10;
          }
        }
      });

      weeklyData.push({
        date: date.format('ddd'),
        percentage: dayScheduled > 0 ? (dayCompleted / dayScheduled) * 100 : 0,
      });
    }

    // Calculate flow performance
    flows.forEach(flow => {
      let flowCompleted = 0;
      let flowScheduled = 0;
      let flowStreak = 0;
      let maxStreak = 0;

      for (let i = 0; i < 30; i++) {
        const date = now.clone().subtract(i, 'days');
        const dayKey = date.format('YYYY-MM-DD');
        
        const isScheduled = flow.repeatType === 'day' 
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(date.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(date.date().toString());

        if (isScheduled) {
          flowScheduled++;
          const status = flow.status?.[dayKey];
          if (status?.symbol === '✅') {
            flowCompleted++;
            flowStreak++;
            maxStreak = Math.max(maxStreak, flowStreak);
          } else {
            flowStreak = 0;
          }
        }
      }

      const performance = flowScheduled > 0 ? (flowCompleted / flowScheduled) * 100 : 0;
      flowPerformance.push({
        name: flow.title,
        performance,
        completed: flowCompleted,
        scheduled: flowScheduled,
        streak: maxStreak,
        type: flow.trackingType,
      });

      // Category data
      if (!categoryData[flow.trackingType]) {
        categoryData[flow.trackingType] = { completed: 0, scheduled: 0 };
      }
      categoryData[flow.trackingType].completed += flowCompleted;
      categoryData[flow.trackingType].scheduled += flowScheduled;
    });

    const successRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
    const avgWeeklyCompletion = weeklyData.reduce((sum, day) => sum + day.percentage, 0) / weeklyData.length;
    
    // Generate comprehensive insights
    insights.push({
      type: 'overview',
      title: 'Overall Performance',
      value: `${successRate.toFixed(1)}%`,
      subtitle: `${totalCompleted} of ${totalScheduled} completed`,
      icon: 'analytics',
      color: successRate >= 80 ? colors.light.success : successRate >= 60 ? colors.light.warning : colors.light.error,
      trend: successRate >= 80 ? 'excellent' : successRate >= 60 ? 'good' : 'needs_improvement',
    });

    insights.push({
      type: 'consistency',
      title: 'Daily Consistency',
      value: `${avgWeeklyCompletion.toFixed(1)}%`,
      subtitle: 'Average daily completion rate',
      icon: 'calendar',
      color: avgWeeklyCompletion >= 80 ? colors.light.success : avgWeeklyCompletion >= 60 ? colors.light.warning : colors.light.error,
      trend: avgWeeklyCompletion >= 80 ? 'excellent' : avgWeeklyCompletion >= 60 ? 'good' : 'needs_improvement',
    });

    insights.push({
      type: 'streak',
      title: 'Best Streak',
      value: `${bestStreak} days`,
      subtitle: 'Longest consecutive completion',
      icon: 'flame',
      color: bestStreak >= 30 ? colors.light.success : bestStreak >= 7 ? colors.light.warning : colors.light.error,
      trend: bestStreak >= 30 ? 'excellent' : bestStreak >= 7 ? 'good' : 'needs_improvement',
    });

    insights.push({
      type: 'points',
      title: 'Total Points',
      value: totalPoints.toLocaleString(),
      subtitle: 'Points earned this month',
      icon: 'star',
      color: colors.light.primaryOrange,
      trend: totalPoints >= 1000 ? 'excellent' : totalPoints >= 500 ? 'good' : 'needs_improvement',
    });

    // Flow category insights
    const binaryFlows = flowPerformance.filter(f => f.type === 'Binary');
    const quantitativeFlows = flowPerformance.filter(f => f.type === 'Quantitative');
    const timeBasedFlows = flowPerformance.filter(f => f.type === 'Time-based');

    if (binaryFlows.length > 0) {
      const avgBinaryPerformance = binaryFlows.reduce((sum, f) => sum + f.performance, 0) / binaryFlows.length;
      insights.push({
        type: 'category',
        title: 'Binary Flows',
        value: `${avgBinaryPerformance.toFixed(1)}%`,
        subtitle: `${binaryFlows.length} habit${binaryFlows.length > 1 ? 's' : ''} tracked`,
        icon: 'checkmark-circle',
        color: avgBinaryPerformance >= 80 ? colors.light.success : avgBinaryPerformance >= 60 ? colors.light.warning : colors.light.error,
        trend: avgBinaryPerformance >= 80 ? 'excellent' : avgBinaryPerformance >= 60 ? 'good' : 'needs_improvement',
      });
    }

    if (quantitativeFlows.length > 0) {
      const avgQuantitativePerformance = quantitativeFlows.reduce((sum, f) => sum + f.performance, 0) / quantitativeFlows.length;
      insights.push({
        type: 'category',
        title: 'Quantitative Flows',
        value: `${avgQuantitativePerformance.toFixed(1)}%`,
        subtitle: `${quantitativeFlows.length} metric${quantitativeFlows.length > 1 ? 's' : ''} tracked`,
        icon: 'bar-chart',
        color: avgQuantitativePerformance >= 80 ? colors.light.success : avgQuantitativePerformance >= 60 ? colors.light.warning : colors.light.error,
        trend: avgQuantitativePerformance >= 80 ? 'excellent' : avgQuantitativePerformance >= 60 ? 'good' : 'needs_improvement',
      });
    }

    if (timeBasedFlows.length > 0) {
      const avgTimeBasedPerformance = timeBasedFlows.reduce((sum, f) => sum + f.performance, 0) / timeBasedFlows.length;
      insights.push({
        type: 'category',
        title: 'Time-based Flows',
        value: `${avgTimeBasedPerformance.toFixed(1)}%`,
        subtitle: `${timeBasedFlows.length} time tracking flow${timeBasedFlows.length > 1 ? 's' : ''}`,
        icon: 'time',
        color: avgTimeBasedPerformance >= 80 ? colors.light.success : avgTimeBasedPerformance >= 60 ? colors.light.warning : colors.light.error,
        trend: avgTimeBasedPerformance >= 80 ? 'excellent' : avgTimeBasedPerformance >= 60 ? 'good' : 'needs_improvement',
      });
    }

    return insights;
  }, [flows]);

  const InsightCard = ({ insight }) => (
    <TouchableOpacity style={styles.insightCard} activeOpacity={0.8}>
      <LinearGradient
        colors={[insight.color + '20', insight.color + '10']}
        style={styles.insightGradient}
      >
        <View style={styles.insightHeader}>
          <View style={[styles.insightIconContainer, { backgroundColor: insight.color + '30' }]}>
            <Ionicons name={insight.icon} size={20} color={insight.color} />
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: themeColors.primaryText }]}>
              {insight.title}
            </Text>
            <Text style={[styles.insightValue, { color: insight.color }]}>
              {insight.value}
            </Text>
            <Text style={[styles.insightSubtitle, { color: themeColors.secondaryText }]}>
              {insight.subtitle}
            </Text>
          </View>
          <View style={[styles.trendIndicator, { backgroundColor: insight.color }]}>
            <Ionicons 
              name={insight.trend === 'excellent' ? 'trending-up' : insight.trend === 'good' ? 'checkmark' : 'trending-down'} 
              size={16} 
              color="#FFFFFF" 
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>
        Overall Insights
      </Text>
      <Text style={[styles.sectionSubtitle, { color: themeColors.secondaryText }]}>
        Comprehensive analysis of your flow performance
      </Text>
      
      <View style={styles.insightsGrid}>
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: layout.spacing.md,
  },
  sectionTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
    textAlign: 'center',
  },
  sectionSubtitle: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginBottom: layout.spacing.lg,
    opacity: 0.8,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    width: '48%',
    marginBottom: layout.spacing.md,
  },
  insightGradient: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
    ...layout.elevation.low,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  insightValue: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  insightSubtitle: {
    ...typography.styles.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OverallInsights;
