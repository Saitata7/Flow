import React, { useContext, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/card';
import Button from '../../components/common/Button';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ModernStats = ({ navigation }) => {
  const { flows } = useContext(FlowsContext);
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('7D');
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isDark = theme === 'dark';

  // Animate on mount
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const now = moment();
    const startDate = moment().subtract(
      selectedTimeframe === '7D' ? 7 : selectedTimeframe === '30D' ? 30 : 365,
      'days'
    );

    let totalCompleted = 0;
    let totalScheduled = 0;
    let totalPoints = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let weeklyData = [];
    let flowPerformance = [];

    // Generate weekly data for charts
    for (let i = 0; i < (selectedTimeframe === '7D' ? 7 : selectedTimeframe === '30D' ? 30 : 52); i++) {
      const date = startDate.clone().add(i, 'days');
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
        date: date.format('MMM DD'),
        completed: dayCompleted,
        scheduled: dayScheduled,
        percentage: dayScheduled > 0 ? (dayCompleted / dayScheduled) * 100 : 0,
      });
    }

    // Calculate flow performance
    flows.forEach(flow => {
      let flowCompleted = 0;
      let flowScheduled = 0;
      let flowStreak = 0;
      let maxStreak = 0;

      for (let i = 0; i < (selectedTimeframe === '7D' ? 7 : selectedTimeframe === '30D' ? 30 : 365); i++) {
        const date = startDate.clone().add(i, 'days');
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
        id: flow.id, // Add the flow ID for navigation
        name: flow.title,
        performance,
        completed: flowCompleted,
        scheduled: flowScheduled,
        streak: maxStreak,
        type: flow.trackingType,
      });
    });

    const successRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
    const avgDailyCompletion = weeklyData.length > 0 
      ? weeklyData.reduce((sum, day) => sum + day.percentage, 0) / weeklyData.length 
      : 0;

    return {
      totalCompleted,
      totalScheduled,
      totalPoints,
      successRate,
      avgDailyCompletion,
      currentStreak,
      bestStreak,
      weeklyData,
      flowPerformance,
    };
  }, [flows, selectedTimeframe]);

  // Chart configurations
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#FF9500',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: themeColors.border,
      strokeWidth: 1,
    },
  };

  const pieChartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  // Render metric card
  const MetricCard = ({ title, value, subtitle, icon, color, trend }) => (
    <Animated.View
      style={[
        styles.metricCard,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
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
    </Animated.View>
  );

  // Render flow performance card
  const FlowPerformanceCard = ({ flow }) => (
    <TouchableOpacity
      style={[styles.flowCard, { backgroundColor: themeColors.cardBackground }]}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>Analytics</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>
            Track your flow performance
          </Text>
        </View>

        {/* Use the new Analytics Dashboard */}
        <AnalyticsDashboard flows={flows} theme={theme} navigation={navigation} />
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
    paddingBottom: layout.spacing.xl + 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: layout.spacing.lg,
  },
  headerTitle: {
    ...typography.styles.largeTitle,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  headerSubtitle: {
    ...typography.styles.body,
    opacity: 0.8,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.spacing.lg,
    backgroundColor: colors.light.progressBackground + '30',
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.xs,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
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
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.medium,
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
    ...typography.styles.largeTitle,
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
  chartTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
    textAlign: 'center',
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.lg,
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
    borderRadius: layout.borderRadius.lg,
    marginBottom: layout.spacing.sm,
    ...layout.shadows.small,
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
});

export default ModernStats;
