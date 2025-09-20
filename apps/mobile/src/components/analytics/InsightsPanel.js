import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const InsightsPanel = ({ flows, theme = 'light' }) => {
  const themeColors = theme === 'light' ? colors.light : colors.dark;

  const insights = useMemo(() => {
    const now = moment();
    const insights = [];
    
    // Calculate overall stats
    let totalCompleted = 0;
    let totalScheduled = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let weeklyTrend = [];
    let flowStrengths = [];
    let flowWeaknesses = [];

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
          }
        }
      });

      weeklyTrend.push({
        date: date.format('ddd'),
        percentage: dayScheduled > 0 ? (dayCompleted / dayScheduled) * 100 : 0,
      });
    }

    // Calculate flow-specific insights
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
      
      if (performance >= 80) {
        flowStrengths.push({ name: flow.title, performance, streak: maxStreak });
      } else if (performance < 50) {
        flowWeaknesses.push({ name: flow.title, performance, streak: maxStreak });
      }
    });

    const successRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
    const avgWeeklyCompletion = weeklyTrend.reduce((sum, day) => sum + day.percentage, 0) / weeklyTrend.length;
    
    // Generate insights based on data
    if (successRate >= 85) {
      insights.push({
        type: 'success',
        icon: 'trophy',
        title: 'Excellent Performance',
        description: `You're maintaining an outstanding ${successRate.toFixed(1)}% success rate. Keep up the great work!`,
        color: colors.light.success,
      });
    } else if (successRate >= 70) {
      insights.push({
        type: 'good',
        icon: 'checkmark-circle',
        title: 'Good Consistency',
        description: `You're doing well with a ${successRate.toFixed(1)}% success rate. Small improvements can make it even better.`,
        color: colors.light.info,
      });
    } else if (successRate < 50) {
      insights.push({
        type: 'warning',
        icon: 'trending-up',
        title: 'Room for Improvement',
        description: `Your current success rate is ${successRate.toFixed(1)}%. Focus on consistency to build better habits.`,
        color: colors.light.warning,
      });
    }

    // Weekly trend insights
    const recentTrend = weeklyTrend.slice(-3).reduce((sum, day) => sum + day.percentage, 0) / 3;
    const earlierTrend = weeklyTrend.slice(0, 3).reduce((sum, day) => sum + day.percentage, 0) / 3;
    
    if (recentTrend > earlierTrend + 10) {
      insights.push({
        type: 'trending',
        icon: 'trending-up',
        title: 'Improving Trend',
        description: 'Your performance has been improving over the past week. Great momentum!',
        color: colors.light.success,
      });
    } else if (recentTrend < earlierTrend - 10) {
      insights.push({
        type: 'trending',
        icon: 'trending-down',
        title: 'Declining Trend',
        description: 'Your performance has declined recently. Consider adjusting your approach.',
        color: colors.light.error,
      });
    }

    // Flow-specific insights
    if (flowStrengths.length > 0) {
      insights.push({
        type: 'strength',
        icon: 'star',
        title: 'Strong Flows',
        description: `${flowStrengths.map(f => f.name).join(', ')} are performing excellently. Use this momentum!`,
        color: colors.light.success,
      });
    }

    if (flowWeaknesses.length > 0) {
      insights.push({
        type: 'weakness',
        icon: 'bulb',
        title: 'Focus Areas',
        description: `${flowWeaknesses.map(f => f.name).join(', ')} need more attention. Consider simplifying or adjusting these flows.`,
        color: colors.light.warning,
      });
    }

    // Consistency insights
    if (avgWeeklyCompletion >= 80) {
      insights.push({
        type: 'consistency',
        icon: 'calendar',
        title: 'High Consistency',
        description: 'You maintain excellent daily consistency. This is the foundation of successful habit building.',
        color: colors.light.info,
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
            <Text style={[styles.insightDescription, { color: themeColors.secondaryText }]}>
              {insight.description}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (insights.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="analytics" size={48} color={themeColors.secondaryText} />
        <Text style={[styles.emptyText, { color: themeColors.secondaryText }]}>
          Keep tracking your flows to see personalized insights
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>
        Personalized Insights
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsContainer}
      >
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </ScrollView>
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
    marginBottom: layout.spacing.md,
    textAlign: 'center',
  },
  insightsContainer: {
    paddingHorizontal: layout.spacing.md,
  },
  insightCard: {
    width: screenWidth * 0.8,
    marginRight: layout.spacing.md,
  },
  insightGradient: {
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.small,
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
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  insightDescription: {
    ...typography.styles.body,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xl,
  },
  emptyText: {
    ...typography.styles.body,
    textAlign: 'center',
    marginTop: layout.spacing.md,
    opacity: 0.8,
  },
});

export default InsightsPanel;
