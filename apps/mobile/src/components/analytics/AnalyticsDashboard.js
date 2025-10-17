import React, { useState, useMemo } from 'react';
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
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { colors, typography, layout } from '../../../styles';
import ModernChart from '../charts/ModernChart';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsDashboard = ({ flows, theme = 'light', navigation, stats }) => {
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [selectedTimeframe, setSelectedTimeframe] = useState('weekly');

  const themeColors = theme === 'light' ? colors.light : colors.dark;

  // Use stats from ActivityContext or calculate fallback
  const analytics = useMemo(() => {
    if (stats && stats.flowSummaries) {
      console.log('AnalyticsDashboard: Using ActivityContext stats:', {
        totalFlows: stats.flowSummaries.length,
        flowSummaries: stats.flowSummaries.map(f => ({
          id: f.flowId,
          title: f.flowTitle,
          completionRate: f.completionRate,
          completed: f.completed,
          scheduled: f.scheduledDays
        }))
      });
      
      // Use ActivityContext data
      const flowPerformance = stats.flowSummaries.map(flow => ({
        id: flow.flowId,
        name: flow.flowTitle,
        performance: flow.completionRate || 0,
        completed: flow.completed || 0,
        scheduled: flow.scheduledDays || 0,
        type: flow.flowType || 'Binary',
      }));

      const categoryData = {};
      flowPerformance.forEach(flow => {
        if (!categoryData[flow.type]) {
          categoryData[flow.type] = { completed: 0, scheduled: 0 };
        }
        categoryData[flow.type].completed += flow.completed;
        categoryData[flow.type].scheduled += flow.scheduled;
      });

      return {
        totalCompleted: stats.overall?.totalCompleted || 0,
        totalScheduled: stats.overall?.totalScheduledDays || 0,
        totalPoints: stats.overall?.totalPoints || 0,
        successRate: stats.overall?.completionRate || 0,
        avgDailyCompletion: stats.overall?.avgDailyCompletion || 0,
        weeklyData: stats.weeklyTrends || [],
        flowPerformance,
        categoryData,
      };
    }

    // Fallback calculation if no stats provided
    console.log('AnalyticsDashboard: Using fallback calculation - no stats from ActivityContext');
    return {
      totalCompleted: 0,
      totalScheduled: 0,
      totalPoints: 0,
      successRate: 0,
      avgDailyCompletion: 0,
      weeklyData: [],
      flowPerformance: [],
      categoryData: {},
    };
  }, [stats, selectedTimeframe]);

  // Render metric card
  const MetricCard = ({ title, value, subtitle, icon, color, trend, onPress }) => (
    <TouchableOpacity
      style={styles.metricCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.metricGradient}
      >
        <View style={styles.metricHeader}>
          <Ionicons name={icon} size={20} color={color} />
          {trend && (
            <View style={[styles.trendIndicator, { backgroundColor: trend > 0 ? colors.light.success : colors.light.error }]}>
              <Ionicons 
                name={trend > 0 ? 'trending-up' : 'trending-down'} 
                size={12} 
                color="#FFFFFF" 
              />
            </View>
          )}
        </View>
        <Text style={[styles.metricValue, { color: themeColors.primaryText }]}>{value}</Text>
        <Text style={[styles.metricTitle, { color: themeColors.secondaryText }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.metricSubtitle, { color: themeColors.tertiaryText }]}>{subtitle}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render flow performance card
  const FlowPerformanceCard = ({ flow }) => (
    <TouchableOpacity
      style={[styles.flowCard, { backgroundColor: themeColors.cardBackground }]}
      activeOpacity={0.8}
      onPress={() => navigation?.navigate('FlowStatsDetail', { flowId: flow.id })}
    >
      <View style={styles.flowCardHeader}>
        <View style={styles.titleRow}>
          <Text style={[styles.flowCardTitle, { color: themeColors.primaryText }]}>{flow.name}</Text>
          {flow.streak > 3 && (
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={16} color="#F59E0B" style={styles.streakIcon} />
              <Text style={styles.streakText}>{flow.streak}</Text>
            </View>
          )}
        </View>
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

  const performanceChartData = {
    labels: analytics.weeklyData.map(d => d.date).slice(-7),
    datasets: [
      {
        data: analytics.weeklyData.map(d => d.percentage).slice(-7),
        color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const categoryChartData = Object.entries(analytics.categoryData).map(([category, data]) => ({
    name: category,
    population: data.completed,
    color: category === 'Binary' ? colors.light.success : category === 'Quantitative' ? colors.light.info : colors.light.warning,
    legendFontColor: themeColors.primaryText,
    legendFontSize: 12,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Timeframe Selector */}
      <View style={styles.timeframeSelector}>
        {[
          { key: 'weekly', label: 'Weekly' },
          { key: 'monthly', label: 'Monthly' },
          { key: 'yearly', label: 'Yearly' }
        ].map((timeframe) => (
          <TouchableOpacity
            key={timeframe.key}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe.key && styles.activeTimeframeButton,
              { backgroundColor: selectedTimeframe === timeframe.key ? colors.light.primaryOrange : themeColors.cardBackground }
            ]}
            onPress={() => setSelectedTimeframe(timeframe.key)}
          >
            <Text
              style={[
                styles.timeframeText,
                { color: selectedTimeframe === timeframe.key ? '#FFFFFF' : themeColors.primaryText }
              ]}
            >
              {timeframe.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Success Rate"
          value={`${analytics.successRate.toFixed(1)}%`}
          subtitle={`${analytics.totalCompleted}/${analytics.totalScheduled} completed`}
          icon="checkmark-circle"
          color={colors.light.success}
          trend={analytics.successRate - 75}
        />
        <MetricCard
          title="Total Points"
          value={analytics.totalPoints.toLocaleString()}
          subtitle="This period"
          icon="star"
          color={colors.light.primaryOrange}
        />
        <MetricCard
          title="Avg Daily"
          value={`${analytics.avgDailyCompletion.toFixed(1)}%`}
          subtitle="Completion rate"
          icon="calendar"
          color={colors.light.info}
        />
        <MetricCard
          title="Active Flows"
          value={flows.length.toString()}
          subtitle="Currently tracking"
          icon="list"
          color={colors.light.warning}
        />
      </View>

      {/* Performance Chart */}
      <View style={[styles.chartContainer, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[styles.chartTitle, { color: themeColors.primaryText }]}>
          Daily Performance Trend
        </Text>
        <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>
          Your daily completion rate over the last 7 days
        </Text>
        <LineChart
          data={{
            labels: analytics.weeklyData.map(d => d.date).slice(-7),
            datasets: [
              {
                data: analytics.weeklyData.map(d => d.percentage).slice(-7),
                color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
                strokeWidth: 3,
              },
            ],
          }}
          width={screenWidth - 64}
          height={220}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(${theme === 'dark' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '3',
              stroke: '#FF9500',
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: themeColors.border,
              strokeWidth: 1,
            },
            fillShadowGradient: '#FF9500',
            fillShadowGradientOpacity: 0.1,
          }}
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
      </View>

      {/* Category Distribution */}
      <ModernChart
        type="pie"
        data={categoryChartData}
        title="Flow Categories"
        subtitle="Distribution by tracking type"
        height={200}
        theme={theme}
      />

      {/* Overall Insights */}
      <View style={styles.placeholderPanel}>
        <Text style={[styles.placeholderText, { color: themeColors.primaryText }]}>
          Overall Insights
        </Text>
      </View>

      {/* Achievements Panel */}
      <View style={styles.placeholderPanel}>
        <Text style={[styles.placeholderText, { color: themeColors.primaryText }]}>
          Achievements Panel
        </Text>
      </View>

      {/* Heat Map Panel */}
      <View style={styles.placeholderPanel}>
        <Text style={[styles.placeholderText, { color: themeColors.primaryText }]}>
          Heat Map Panel
        </Text>
      </View>

      {/* Insights Panel */}
      <View style={styles.placeholderPanel}>
        <Text style={[styles.placeholderText, { color: themeColors.primaryText }]}>
          Insights Panel
        </Text>
      </View>

      {/* Flow Performance */}
      <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>
        Flow Performance
      </Text>
      <View style={styles.flowsContainer}>
        {analytics.flowPerformance.map((flow, index) => (
          <FlowPerformanceCard key={index} flow={flow} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.spacing.lg,
    backgroundColor: colors.light.progressBackground + '30',
    borderRadius: layout.radii.large,
    padding: layout.spacing.xs,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.radii.base,
    alignItems: 'center',
  },
  activeTimeframeButton: {
    shadowColor: colors.light.primaryOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeframeText: {
    ...typography.styles.title3,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.lg,
  },
  metricCard: {
    width: '48%',
    marginBottom: layout.spacing.md,
  },
  metricGradient: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
    ...layout.elevation.low,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  trendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    ...typography.largeTitle,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  metricTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  metricSubtitle: {
    ...typography.styles.caption,
    fontSize: 11,
    opacity: 0.8,
  },
  sectionTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
    marginTop: layout.spacing.lg,
  },
  flowsContainer: {
    marginBottom: layout.spacing.lg,
  },
  flowCard: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
    marginBottom: layout.spacing.sm,
    ...layout.elevation.low,
  },
  flowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  flowCardTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: layout.spacing.sm,
  },
  streakIcon: {
    marginRight: 2,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  performanceBadge: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.radii.small,
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
    ...typography.styles.title3,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  flowStatLabel: {
    ...typography.styles.caption,
    fontSize: 11,
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
  chartContainer: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
    marginVertical: layout.spacing.md,
    ...layout.elevation.low,
  },
  chartTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
    textAlign: 'center',
  },
  chartSubtitle: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginBottom: layout.spacing.md,
    opacity: 0.8,
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.radii.large,
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
  placeholderPanel: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.radii.large,
    marginVertical: layout.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    ...layout.elevation.low,
  },
  placeholderText: {
    ...typography.styles.body,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});

export default AnalyticsDashboard;
