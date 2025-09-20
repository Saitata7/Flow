import React, { useContext, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/card';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import statsService from '../../services/statsService';
import FlowStatsSummary from '../../components/FlowStats/FlowStatsSummary';

const { width: screenWidth } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
  const { flows, activeFlows } = useContext(FlowsContext);
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('7D');
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'summary'

  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isDark = theme === 'dark';

  // Calculate comprehensive stats using the stats service
  const stats = useMemo(() => {
    if (!flows || flows.length === 0) {
      return {
        overall: {
          totalCompleted: 0,
          totalScheduled: 0,
          totalPoints: 0,
          totalFlows: 0,
          activeFlows: 0,
          successRate: 0,
          avgDailyCompletion: 0,
          dailyData: []
        },
        flowPerformance: [],
        weeklyTrends: [],
        achievements: [],
        heatMapData: { contributionData: [], maxCount: 0 }
      };
    }

    return statsService.calculateOverallStats(flows, {
      timeframe: selectedTimeframe,
      currentMonth: currentMonth,
      includeArchived: false,
      includeDeleted: false
    });
  }, [flows, selectedTimeframe, currentMonth]);

  // Chart configurations
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: '#FF9500',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E5E5E5',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 10,
      fill: '#000000',
    },
    propsForVerticalLabels: {
      fontSize: 10,
      fill: '#000000',
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      fill: '#000000',
    },
  };

  // Handle empty state
  if (!flows || flows.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>📊</Text>
          <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>No Flows Yet</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
            Create your first flow to start tracking your habits and see analytics here.
          </Text>
          <Button
            variant="primary"
            title="Create Flow"
            onPress={() => navigation.navigate('AddFlow')}
            style={styles.emptyButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Render metric card
  const MetricCard = ({ title, value, subtitle, icon, color }) => (
    <View style={styles.metricCard}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.metricValue, { color: themeColors.primaryText }]}>{value}</Text>
        <Text style={[styles.metricTitle, { color: themeColors.secondaryText }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.metricSubtitle, { color: themeColors.tertiaryText }]}>{subtitle}</Text>
        )}
      </LinearGradient>
    </View>
  );

  // Render flow performance card
  const FlowPerformanceCard = ({ flow }) => (
    <TouchableOpacity
      style={[styles.flowCard, { backgroundColor: themeColors.cardBackground }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('FlowStatsDetail', { flowId: flow.id })}
    >
      <View style={styles.flowCardHeader}>
        <Text style={[styles.flowCardTitle, { color: themeColors.primaryText }]}>{flow.name}</Text>
        <View style={[styles.performanceBadge, { backgroundColor: flow.performance >= 80 ? colors.light.success : flow.performance >= 60 ? colors.light.warning : colors.light.error }]}>
          <Text style={styles.performanceText}>{flow.performance.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={styles.flowCardBody}>
        <View style={styles.flowStats}>
          <View style={styles.flowStat}>
            <Text style={[styles.flowStatValue, { color: themeColors.primaryText }]}>{flow.completed}</Text>
            <Text style={[styles.flowStatLabel, { color: themeColors.secondaryText }]}>Completed</Text>
          </View>
          <View style={styles.flowStat}>
            <Text style={[styles.flowStatValue, { color: themeColors.primaryText }]}>{flow.streak}</Text>
            <Text style={[styles.flowStatLabel, { color: themeColors.secondaryText }]}>Best Streak</Text>
          </View>
          <View style={styles.flowStat}>
            <Text style={[styles.flowStatValue, { color: themeColors.primaryText }]}>{flow.type}</Text>
            <Text style={[styles.flowStatLabel, { color: themeColors.secondaryText }]}>Type</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${flow.performance}%`,
                backgroundColor: flow.performance >= 80 ? colors.light.success : flow.performance >= 60 ? colors.light.warning : colors.light.error
              }
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Generate heat map data
  const generateHeatMapData = () => {
    const startOfMonth = moment(currentMonth).startOf('month');
    const endOfMonth = moment(currentMonth).endOf('month');
    const daysInMonth = endOfMonth.diff(startOfMonth, 'days') + 1;
    
    const contributionData = [];
    let maxCount = 0;

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = startOfMonth.clone().add(i, 'days');
      const dayKey = currentDate.format('YYYY-MM-DD');
      let count = 0;
      
      flows.forEach(flow => {
        const isScheduled = flow.repeatType === 'day' 
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(currentDate.format('ddd')))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(currentDate.date().toString());
        
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
  };

  const heatMapData = generateHeatMapData();

  const getIntensityColor = (count, maxCount) => {
    if (count === 0) return themeColors.progressBackground;
    
    const intensity = count / maxCount;
    if (intensity <= 0.25) return colors.light.success + '40';
    if (intensity <= 0.5) return colors.light.success + '60';
    if (intensity <= 0.75) return colors.light.success + '80';
    return colors.light.success;
  };

  const performanceChartData = {
    labels: stats.overall.dailyData.map(d => d.displayDate).slice(-7),
    datasets: [
      {
        data: stats.overall.dailyData.map(d => d.percentage).slice(-7),
        color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const activityDistributionData = [
    {
      name: 'Completed',
      population: stats.overall.totalCompleted,
      color: colors.light.success,
      legendFontColor: themeColors.primaryText,
      legendFontSize: 12,
    },
    {
      name: 'Missed',
      population: stats.overall.totalScheduled - stats.overall.totalCompleted,
      color: colors.light.error,
      legendFontColor: themeColors.primaryText,
      legendFontSize: 12,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>Statistics</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>
            Track your progress and discover insights
          </Text>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeSelector}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'overview' && styles.activeViewModeButton,
              { backgroundColor: viewMode === 'overview' ? colors.light.primaryOrange : themeColors.cardBackground }
            ]}
            onPress={() => setViewMode('overview')}
          >
            <Text
              style={[
                styles.viewModeText,
                { color: viewMode === 'overview' ? '#FFFFFF' : themeColors.primaryText }
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'summary' && styles.activeViewModeButton,
              { backgroundColor: viewMode === 'summary' ? colors.light.primaryOrange : themeColors.cardBackground }
            ]}
            onPress={() => setViewMode('summary')}
          >
            <Text
              style={[
                styles.viewModeText,
                { color: viewMode === 'summary' ? '#FFFFFF' : themeColors.primaryText }
              ]}
            >
              Summary
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeSelector}>
          {['7D', '30D', '1Y'].map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.activeTimeframeButton,
                { backgroundColor: selectedTimeframe === timeframe ? colors.light.primaryOrange : themeColors.cardBackground }
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  { color: selectedTimeframe === timeframe ? '#FFFFFF' : themeColors.primaryText }
                ]}
              >
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Render based on view mode */}
        {viewMode === 'summary' ? (
          <FlowStatsSummary navigation={navigation} />
        ) : (
          <>

        {/* Analytics */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Analytics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Success Rate"
            value={`${stats.overall.successRate.toFixed(1)}%`}
            subtitle={`${stats.overall.totalCompleted}/${stats.overall.totalScheduled} completed`}
            icon="checkmark-circle"
            color={colors.light.success}
          />
          <MetricCard
            title="Total Points"
            value={stats.overall.totalPoints.toLocaleString()}
            subtitle="This period"
            icon="star"
            color={colors.light.primaryOrange}
          />
          <MetricCard
            title="Avg Daily"
            value={`${stats.overall.avgDailyCompletion.toFixed(1)}%`}
            subtitle="Completion rate"
            icon="calendar"
            color={colors.light.info}
          />
          <MetricCard
            title="Active Flows"
            value={`${stats.overall.activeFlows}`}
            subtitle="Currently tracking"
            icon="list"
            color={colors.light.warning}
          />
        </View>

        {/* Daily Performance Trend */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Daily Performance Trend</Text>
        <Card variant="default" padding="lg" margin="md">
          <View style={styles.chartHeader}>
            <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>
              Your daily completion rate over the last 7 days
            </Text>
            <View style={styles.chartStats}>
              <View style={styles.chartStatItem}>
                <Text style={[styles.chartStatValue, { color: themeColors.primaryText }]}>
                  {stats.overall.avgDailyCompletion.toFixed(1)}%
                </Text>
                <Text style={[styles.chartStatLabel, { color: themeColors.secondaryText }]}>Avg</Text>
              </View>
              <View style={styles.chartStatItem}>
                <Text style={[styles.chartStatValue, { color: colors.light.success }]}>
                  {Math.max(...stats.overall.dailyData.map(d => d.percentage)).toFixed(1)}%
                </Text>
                <Text style={[styles.chartStatLabel, { color: themeColors.secondaryText }]}>Best</Text>
              </View>
              <View style={styles.chartStatItem}>
                <Text style={[styles.chartStatValue, { color: colors.light.error }]}>
                  {Math.min(...stats.overall.dailyData.map(d => d.percentage)).toFixed(1)}%
                </Text>
                <Text style={[styles.chartStatLabel, { color: themeColors.secondaryText }]}>Lowest</Text>
              </View>
            </View>
          </View>
          <LineChart
            data={performanceChartData}
            width={screenWidth - 64}
            height={160}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={true}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={false}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.light.primaryOrange }]} />
              <Text style={[styles.legendText, { color: themeColors.secondaryText }]}>
                Daily Completion Rate (%)
              </Text>
            </View>
          </View>
        </Card>

        {/* Flow Performance */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Flow Performance</Text>
        <Card variant="default" padding="lg" margin="md">
          {stats.flowPerformance.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>📊</Text>
              <Text style={[styles.emptyText, { color: themeColors.secondaryText }]}>No flows to display</Text>
            </View>
          ) : (
            <View style={styles.flowsList}>
              {stats.flowPerformance.map((flow, index) => (
                <FlowPerformanceCard key={index} flow={flow} />
              ))}
            </View>
          )}
        </Card>

        {/* Achievements */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Achievements</Text>
        <Card variant="default" padding="lg" margin="md">
          <View style={styles.achievementGrid}>
            {stats.achievements.map((achievement, index) => (
              <View key={index} style={[styles.achievementCard, { backgroundColor: achievement.color + '20' }]}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[styles.achievementTitle, { color: themeColors.primaryText }]}>{achievement.title}</Text>
                <Text style={[styles.achievementDescription, { color: themeColors.secondaryText }]}>
                  {achievement.description}
                </Text>
                <Text style={[styles.achievementProgress, { color: achievement.color }]}>
                  {achievement.progress}/{achievement.target}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Overall Insights */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Overall Insights</Text>
        <Card variant="default" padding="lg" margin="md">
          <View style={styles.insightsContainer}>
            {stats.overall.successRate >= 80 && (
              <View style={styles.insightItem}>
                <Ionicons name="trophy" size={20} color={colors.light.success} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  Excellent consistency! You're maintaining a {stats.overall.successRate.toFixed(1)}% success rate.
                </Text>
              </View>
            )}
            {stats.overall.avgDailyCompletion < 50 && (
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={20} color={colors.light.warning} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  Consider focusing on consistency. Your daily average is {stats.overall.avgDailyCompletion.toFixed(1)}%.
                </Text>
              </View>
            )}
            {stats.overall.activeFlows >= 5 && (
              <View style={styles.insightItem}>
                <Ionicons name="star" size={20} color={colors.light.primaryOrange} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  You're tracking {stats.overall.activeFlows} flows! Keep up the great work.
                </Text>
              </View>
            )}
            {stats.overall.totalPoints >= 1000 && (
              <View style={styles.insightItem}>
                <Ionicons name="medal" size={20} color={colors.light.info} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  Amazing! You've earned {stats.overall.totalPoints.toLocaleString()} points this period.
                </Text>
              </View>
            )}
          </View>
        </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: layout.spacing.sm,
    paddingBottom: layout.spacing.xl + 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  headerTitle: {
    ...typography.styles.title1,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  headerSubtitle: {
    ...typography.styles.caption,
    opacity: 0.8,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.spacing.md,
    backgroundColor: colors.light.progressBackground + '30',
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.xs,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: layout.spacing.xs,
    paddingHorizontal: layout.spacing.sm,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
  },
  activeTimeframeButton: {
    shadowColor: colors.light.primaryOrange,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeText: {
    ...typography.styles.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.md,
  },
  metricCard: {
    width: '48%',
    marginBottom: layout.spacing.sm,
  },
  metricGradient: {
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  metricValue: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  metricTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
    fontSize: 12,
  },
  metricSubtitle: {
    ...typography.styles.caption,
    fontSize: 10,
    opacity: 0.8,
  },
  chartTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
    textAlign: 'center',
  },
  chartHeader: {
    marginBottom: layout.spacing.sm,
  },
  chartSubtitle: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginBottom: layout.spacing.sm,
    opacity: 0.8,
    fontSize: 11,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
  },
  chartStatItem: {
    alignItems: 'center',
  },
  chartStatValue: {
    ...typography.styles.title3,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  chartStatLabel: {
    ...typography.styles.caption,
    fontSize: 10,
    opacity: 0.8,
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.lg,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: layout.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: layout.spacing.xs,
  },
  legendText: {
    ...typography.styles.caption,
    fontSize: 11,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  heatMap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    padding: layout.spacing.xs,
  },
  heatMapSquare: {
    margin: 2,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    ...typography.styles.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    alignItems: 'center',
    marginTop: layout.spacing.md,
  },
  legendTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: layout.spacing.xs,
  },
  sectionTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
    marginTop: layout.spacing.md,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.spacing.sm,
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 20,
    marginBottom: layout.spacing.xs,
  },
  achievementTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: layout.spacing.xs,
    fontSize: 11,
  },
  achievementDescription: {
    ...typography.styles.caption,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: layout.spacing.xs,
  },
  achievementProgress: {
    ...typography.styles.caption,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 11,
  },
  insightsContainer: {
    marginTop: layout.spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  insightText: {
    ...typography.styles.body,
    flex: 1,
    marginLeft: layout.spacing.sm,
    lineHeight: 20,
  },
  flowsList: {
    // Container for flow cards list
  },
  flowCard: {
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.spacing.sm,
  },
  flowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  flowCardTitle: {
    ...typography.styles.body,
    fontWeight: '600',
    flex: 1,
    fontSize: 14,
  },
  performanceBadge: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
  },
  performanceText: {
    ...typography.styles.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  flowCardBody: {
    marginTop: layout.spacing.sm,
  },
  flowStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.sm,
  },
  flowStat: {
    alignItems: 'center',
  },
  flowStatValue: {
    ...typography.styles.body,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
    fontSize: 13,
  },
  flowStatLabel: {
    ...typography.styles.caption,
    fontSize: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.light.progressBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: layout.spacing.md,
  },
  emptyTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.styles.body,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: layout.spacing.lg,
  },
  emptyButton: {
    marginTop: layout.spacing.md,
  },
  viewModeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.spacing.sm,
    backgroundColor: colors.light.progressBackground + '30',
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.xs,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: layout.spacing.xs,
    paddingHorizontal: layout.spacing.sm,
    borderRadius: layout.borderRadius.sm,
    alignItems: 'center',
  },
  activeViewModeButton: {
    shadowColor: colors.light.primaryOrange,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    ...typography.styles.caption,
    fontWeight: '600',
    fontSize: 12,
  },
});

export default StatsScreen;