import React, { useContext, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/card';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const StatsScreen = ({ navigation }) => {
  const { flows, activeFlows } = useContext(FlowsContext);
  const { getAllStats } = useContext(ActivityContext);
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('weekly');
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));

  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isDark = theme === 'dark';

  // Calculate comprehensive stats using ActivityContext
  const stats = useMemo(() => {
    console.log('Stats calculation - flows:', flows);
    console.log('Stats calculation - flows length:', flows?.length);
    
    if (!flows || flows.length === 0) {
      console.log('Stats calculation - No flows found, returning default values');
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

    const allStats = getAllStats({
      timeframe: 'all',
      currentMonth: currentMonth,
      includeArchived: false,
      includeDeleted: false
    });

    console.log('Stats calculation - allStats:', allStats);

    // Transform ActivityContext data to match the expected format
    return {
      overall: {
        totalCompleted: allStats.totalCompleted,
        totalScheduled: allStats.totalScheduledDays,
        totalPoints: allStats.totalPoints,
        totalFlows: allStats.totalFlows,
        activeFlows: flows.filter(f => !f.archived && !f.deletedAt).length,
        successRate: allStats.successMetrics?.successRate || allStats.averageCompletionRate,
        pureCompletionRate: allStats.successMetrics?.pureCompletionRate || allStats.pureCompletionRate,
        avgDailyCompletion: allStats.successMetrics?.successRate || allStats.averageCompletionRate,
        dailyData: allStats.weeklyTrends || [],
        // Additional success metrics
        successMetrics: allStats.successMetrics || {
          totalSuccessfulDays: allStats.totalCompleted + allStats.totalPartial,
          totalFailedDays: allStats.totalFailed + allStats.totalSkipped,
          successRate: allStats.averageCompletionRate,
          pureCompletionRate: allStats.pureCompletionRate,
          partialSuccessRate: 0,
          failureRate: 0,
          skipRate: 0,
        }
      },
      flowPerformance: allStats.flowSummaries.map(flow => ({
        id: flow.flowId,
        name: flow.flowTitle,
        type: flow.flowType,
        completed: flow.completed,
        currentStreak: flow.currentStreak,
        longestStreak: flow.longestStreak,
        performance: flow.completionRate
      })),
      weeklyTrends: allStats.weeklyTrends || [],
      achievements: allStats.achievements || [],
      heatMapData: allStats.heatMapData || { contributionData: [], maxCount: 0 }
    };
  }, [flows, currentMonth, getAllStats]);

  // Chart configurations
  const chartConfig = {
    backgroundColor: themeColors.background,
    backgroundGradientFrom: themeColors.background,
    backgroundGradientTo: themeColors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: (opacity = 1) => `${themeColors.primaryText}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    style: {
      borderRadius: layout.radii.large,
    },
    paddingLeft: 0, // Reduce left padding
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: themeColors.primaryOrange,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: themeColors.surface,
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 10,
      fill: themeColors.primaryText,
    },
    propsForVerticalLabels: {
      fontSize: 10,
      fill: themeColors.primaryText,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      fill: themeColors.primaryText,
    },
  };

  // Handle empty state
  if (!flows || flows.length === 0) {
    return (
      <SafeAreaWrapper style={{ backgroundColor: themeColors.background }} excludeBottom={true}>
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
            accessibilityLabel="Create your first flow to start tracking habits"
            accessibilityHint="Navigates to the add flow screen"
          />
        </View>
      </SafeAreaWrapper>
    );
  }

  // Render metric card
  const MetricCard = ({ title, value, subtitle, icon, color }) => {
    const safeColor = color || '#007AFF'; // Fallback color
    return (
      <View style={styles.metricCard}>
        <LinearGradient
          colors={[safeColor + '20', safeColor + '10']}
          style={styles.metricGradient}
        >
          <View style={styles.metricHeader}>
            <Ionicons name={icon} size={20} color={safeColor} />
          </View>
          <Text style={[styles.metricValue, { color: themeColors.primaryText }]}>{value}</Text>
          <Text style={[styles.metricTitle, { color: themeColors.secondaryText }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.metricSubtitle, { color: themeColors.secondaryText }]}>{subtitle}</Text>
          )}
        </LinearGradient>
      </View>
    );
  };

  // Render flow performance card
  const FlowPerformanceCard = ({ flow }) => (
    <TouchableOpacity
      style={[styles.flowCard, { backgroundColor: themeColors.cardBackground }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('FlowStatsDetail', { flowId: flow.id })}
      accessibilityLabel={`${flow.name} performance: ${flow.performance.toFixed(0)}%`}
      accessibilityHint={`View detailed statistics for ${flow.name}`}
    >
      <View style={styles.flowCardHeader}>
        <View style={styles.flowTitleRow}>
          <View style={styles.flowNameContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.flowCardTitle, { color: themeColors.primaryText }]}>{flow.name}</Text>
              {flow.currentStreak > 3 && (
                <View style={styles.streakContainer}>
                  <Ionicons name="flame" size={16} color="#F59E0B" />
                  <Text style={[styles.streakText, { color: "#F59E0B" }]}>{flow.currentStreak}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.flowTypeText, { color: themeColors.secondaryText, opacity: 0.7 }]}>{flow.type}</Text>
          </View>
        </View>
        <View style={[styles.performanceBadge, { backgroundColor: flow.performance >= 80 ? themeColors.success : flow.performance >= 60 ? '#F2A005' : themeColors.error }]}>
          <Text style={styles.performanceText}>{flow.performance.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={styles.flowCardBody}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${flow.performance}%`,
                backgroundColor: flow.performance >= 80 ? themeColors.success : flow.performance >= 60 ? '#F2A005' : themeColors.error
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
    if (count === 0) return themeColors.surface;
    
    const intensity = count / maxCount;
    if (intensity <= 0.25) return themeColors.success + '40';
    if (intensity <= 0.5) return themeColors.success + '60';
    if (intensity <= 0.75) return themeColors.success + '80';
    return themeColors.success;
  };

  // Process chart data based on timeframe
  const processChartData = (dailyData, timeframe) => {
    if (timeframe === 'weekly') {
      return {
        labels: dailyData.map(d => d.displayDate).slice(-7),
        data: dailyData.map(d => d.percentage).slice(-7)
      };
    } else if (timeframe === 'monthly') {
      // Group by actual calendar weeks within months
      const weeklyData = [];
      const weekGroups = {};
      
      // Group data by month and week
      dailyData.forEach(day => {
        const date = moment(day.date);
        const month = date.format('MMM');
        const weekOfMonth = Math.ceil(date.date() / 7);
        const weekKey = `${month}-W${weekOfMonth}`;
        
        if (!weekGroups[weekKey]) {
          weekGroups[weekKey] = {
            month: month,
            week: weekOfMonth,
            percentages: [],
            label: `${month}(W${weekOfMonth})`
          };
        }
        weekGroups[weekKey].percentages.push(day.percentage);
      });
      
      // Convert to array and calculate averages
      Object.values(weekGroups).forEach(weekGroup => {
        const avgPercentage = weekGroup.percentages.reduce((sum, p) => sum + p, 0) / weekGroup.percentages.length;
        weeklyData.push({
          label: weekGroup.label,
          percentage: avgPercentage
        });
      });
      
      // Sort by date to maintain chronological order
      weeklyData.sort((a, b) => {
        const aMatch = a.label.match(/(\w+)\(W(\d+)\)/);
        const bMatch = b.label.match(/(\w+)\(W(\d+)\)/);
        if (aMatch && bMatch) {
          const aMonth = moment(aMatch[1], 'MMM').month();
          const bMonth = moment(bMatch[1], 'MMM').month();
          if (aMonth !== bMonth) return aMonth - bMonth;
          return parseInt(aMatch[2]) - parseInt(bMatch[2]);
        }
        return 0;
      });
      
      return {
        labels: weeklyData.map(w => w.label),
        data: weeklyData.map(w => w.percentage)
      };
    } else if (timeframe === 'yearly') {
      // Group by actual calendar months
      const monthlyData = [];
      const monthGroups = {};
      
      // Group data by month
      dailyData.forEach(day => {
        const date = moment(day.date);
        const monthKey = date.format('MMM');
        
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = {
            month: monthKey,
            percentages: []
          };
        }
        monthGroups[monthKey].percentages.push(day.percentage);
      });
      
      // Convert to array and calculate averages
      Object.values(monthGroups).forEach(monthGroup => {
        const avgPercentage = monthGroup.percentages.reduce((sum, p) => sum + p, 0) / monthGroup.percentages.length;
        monthlyData.push({
          label: monthGroup.month,
          percentage: avgPercentage
        });
      });
      
      // Sort by month order
      monthlyData.sort((a, b) => {
        const aMonth = moment(a.label, 'MMM').month();
        const bMonth = moment(b.label, 'MMM').month();
        return aMonth - bMonth;
      });
      
      return {
        labels: monthlyData.map(m => m.label),
        data: monthlyData.map(m => m.percentage)
      };
    }
    
    // Default to weekly
    return {
      labels: dailyData.map(d => d.displayDate).slice(-7),
      data: dailyData.map(d => d.percentage).slice(-7)
    };
  };

  const chartData = processChartData(stats.overall.dailyData, selectedTimeframe);

  const performanceChartData = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
        strokeWidth: selectedTimeframe === 'yearly' ? 2 : 3,
      },
    ],
  };

  const activityDistributionData = [
    {
      name: 'Completed',
      population: stats.overall.totalCompleted,
      color: themeColors.success,
      legendFontColor: themeColors.primaryText,
      legendFontSize: 12,
    },
    {
      name: 'Missed',
      population: Math.max(0, stats.overall.totalScheduled - stats.overall.totalCompleted),
      color: themeColors.error,
      legendFontColor: themeColors.primaryText,
      legendFontSize: 12,
    },
  ];

  return (
    <SafeAreaWrapper style={{ backgroundColor: themeColors.background }} excludeBottom={true}>
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

        {/* Analytics */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Analytics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Success Rate"
            value={`${stats.overall.successRate.toFixed(1)}%`}
            subtitle={`${stats.overall.successMetrics?.totalSuccessfulDays || stats.overall.totalCompleted}/${stats.overall.totalScheduled} successful`}
            icon="checkmark-circle"
            color={themeColors.success || '#4CAF50'}
          />
          <MetricCard
            title="Total Points"
            value={stats.overall.totalPoints.toLocaleString()}
            subtitle="This period"
            icon="star"
            color={themeColors.primaryOrange || '#FF9500'}
          />
        </View>

        {/* Daily Performance Trend */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Daily Performance Trend</Text>
        
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
                { backgroundColor: selectedTimeframe === timeframe.key ? themeColors.primaryOrange : themeColors.cardBackground }
              ]}
              onPress={() => setSelectedTimeframe(timeframe.key)}
              accessibilityLabel={`Select ${timeframe.label.toLowerCase()} timeframe`}
              accessibilityHint={`View chart for the ${timeframe.label.toLowerCase()} period`}
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
        
        <Card variant="default" padding="sm" margin="sm" backgroundColor={themeColors.cardBackground}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>
              Your daily completion rate over the last {selectedTimeframe === 'weekly' ? '7 days' : selectedTimeframe === 'monthly' ? '30 days' : '52 weeks'}
            </Text>
            <View style={styles.chartStats}>
              <View style={styles.chartStatItem}>
                <Text style={[styles.chartStatValue, { color: themeColors.primaryText }]}>
                  {stats.overall.avgDailyCompletion.toFixed(1)}%
                </Text>
                <Text style={[styles.chartStatLabel, { color: themeColors.secondaryText }]}>Avg</Text>
              </View>
              <View style={styles.chartStatItem}>
                <Text style={[styles.chartStatValue, { color: themeColors.success }]}>
                  {stats.overall.dailyData.length > 0 ? Math.max(...stats.overall.dailyData.map(d => d.percentage)).toFixed(1) : '0.0'}%
                </Text>
                <Text style={[styles.chartStatLabel, { color: themeColors.secondaryText }]}>Best</Text>
              </View>
              <View style={styles.chartStatItem}>
                <Text style={[styles.chartStatValue, { color: themeColors.primaryOrange }]}>
                  {stats.overall.activeFlows}
                </Text>
                <Text style={[styles.chartStatLabel, { color: themeColors.secondaryText }]}>Active Flows</Text>
              </View>
            </View>
          </View>
          <LineChart
            data={performanceChartData}
            width={(screenWidth - 10) * 0.98}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={true}
            withShadow={false}
            withInnerLines={false}
            withOuterLines={false}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: themeColors.primaryOrange }]} />
              <Text style={[styles.legendText, { color: themeColors.secondaryText }]}>
                Daily Completion Rate (%)
              </Text>
            </View>
          </View>
        </Card>

        {/* Flow Performance */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Flow Performance ({stats.flowPerformance.length})</Text>
          <Card variant="default" padding="md" margin="none" backgroundColor={themeColors.cardBackground}>
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
        </View>

        {/* Achievements */}
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Achievements</Text>
          <Card variant="default" padding="md" margin="none" backgroundColor={themeColors.cardBackground}>
            {stats.achievements.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>🏆</Text>
                <Text style={[styles.emptyText, { color: themeColors.secondaryText }]}>No achievements yet</Text>
                <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
                  Complete activities to unlock achievements!
                </Text>
              </View>
            ) : (
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
            )}
          </Card>
        </View>

        {/* Success Rate Breakdown */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Success Rate Breakdown</Text>
        <Card variant="default" padding="md" margin="none" backgroundColor={themeColors.cardBackground}>
            <View style={styles.successBreakdown}>
              <View style={styles.successRow}>
                <Text style={[styles.successLabel, { color: themeColors.primaryText }]}>Overall Success Rate</Text>
                <Text style={[styles.successValue, { color: themeColors.success }]}>
                  {stats.overall.successRate.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={[styles.successLabel, { color: themeColors.primaryText }]}>Pure Completion Rate</Text>
                <Text style={[styles.successValue, { color: themeColors.primaryOrange }]}>
                  {stats.overall.pureCompletionRate?.toFixed(1) || '0.0'}%
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={[styles.successLabel, { color: themeColors.primaryText }]}>Partial Success Rate</Text>
                <Text style={[styles.successValue, { color: '#F2A005' }]}>
                  {stats.overall.successMetrics?.partialSuccessRate?.toFixed(1) || '0.0'}%
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={[styles.successLabel, { color: themeColors.primaryText }]}>Failure Rate</Text>
                <Text style={[styles.successValue, { color: themeColors.error }]}>
                  {stats.overall.successMetrics?.failureRate?.toFixed(1) || '0.0'}%
                </Text>
              </View>
              <View style={styles.successRow}>
                <Text style={[styles.successLabel, { color: themeColors.primaryText }]}>Skip Rate</Text>
                <Text style={[styles.successValue, { color: themeColors.secondaryText }]}>
                  {stats.overall.successMetrics?.skipRate?.toFixed(1) || '0.0'}%
                </Text>
              </View>
            </View>
          </Card>

        {/* Overall Insights */}
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Overall Insights</Text>
        <Card variant="default" padding="xs" margin="xs" backgroundColor={themeColors.cardBackground}>
            <View style={styles.insightsContainer}>
              {stats.overall.successRate >= 80 && (
                <View style={styles.insightItem}>
                  <Ionicons name="trophy" size={20} color={themeColors.success} />
                  <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                    Excellent consistency! You're maintaining a {stats.overall.successRate.toFixed(1)}% success rate.
                  </Text>
                </View>
              )}
              {stats.overall.avgDailyCompletion < 50 && (
                <View style={styles.insightItem}>
                  <Ionicons name="trending-up" size={20} color="#F2A005" />
                  <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                    Consider focusing on consistency. Your daily average is {stats.overall.avgDailyCompletion.toFixed(1)}%.
                  </Text>
                </View>
              )}
              {stats.overall.activeFlows >= 5 && (
                <View style={styles.insightItem}>
                  <Ionicons name="star" size={20} color={themeColors.primaryOrange} />
                  <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                    You're tracking {stats.overall.activeFlows} flows! Keep up the great work.
                  </Text>
                </View>
              )}
              {stats.overall.totalPoints >= 1000 && (
                <View style={styles.insightItem}>
                  <Ionicons name="medal" size={20} color={themeColors.primaryOrange} />
                  <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                    Amazing! You've earned {stats.overall.totalPoints.toLocaleString()} points this period.
                  </Text>
                </View>
              )}
            </View>
          </Card>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: layout.spacing.sm,
    paddingBottom: layout.spacing.x5l + 80, // Extra padding for bottom tab + safe area
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: layout.radii.base,
    padding: layout.spacing.xs,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: layout.spacing.xs,
    paddingHorizontal: layout.spacing.sm,
    borderRadius: layout.radii.small,
    alignItems: 'center',
  },
  activeTimeframeButton: {
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
  sectionWrapper: {
    marginBottom: layout.spacing.md,
  },
  metricCard: {
    width: '48%',
    marginBottom: layout.spacing.sm,
  },
  metricGradient: {
    padding: layout.spacing.sm,
    borderRadius: layout.radii.base,
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
    marginLeft: -10, // Reduce left spacing
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
    borderRadius: layout.radii.small,
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
    marginBottom: layout.spacing.xs, // Reduced from sm to xs to minimize gap with card
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
    borderRadius: layout.radii.base,
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
    borderRadius: layout.radii.base,
    marginBottom: layout.spacing.sm,
  },
  flowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.sm,
  },
  flowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: layout.spacing.sm,
  },
  flowNameContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: layout.spacing.sm,
  },
  streakText: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  flowCardTitle: {
    ...typography.styles.body,
    fontWeight: '600',
    fontSize: 16,
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
    marginTop: 0,
  },
  flowTypeRow: {
    marginBottom: layout.spacing.sm,
  },
  flowTypeText: {
    ...typography.styles.caption,
    fontWeight: '500',
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
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
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  successBreakdown: {
    marginTop: layout.spacing.sm,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  successLabel: {
    ...typography.styles.body,
    fontSize: 14,
    flex: 1,
  },
  successValue: {
    ...typography.styles.title3,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default StatsScreen;