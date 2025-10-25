import React, { useContext, useState, useMemo, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import CardComponent from '../../components/common/CardComponent';
import Button from '../../components/common/Button';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ModernStats = ({ navigation }) => {
  const { flows } = useContext(FlowsContext);
  const { getAllStats } = useContext(ActivityContext);
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('weekly');
  const [animatedValue] = useState(new Animated.Value(0));
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isDark = theme === 'dark';

  // Load stats using ActivityContext
  useEffect(() => {
    const loadStats = async () => {
      if (!flows || flows.length === 0) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('ModernStats: Loading stats using ActivityContext...');
        
        
        console.log('ModernStats: Calling getAllStats with timeframe:', selectedTimeframe);
        const allStats = await getAllStats({
          timeframe: selectedTimeframe,
          includeArchived: false,
          includeDeleted: false
        });
        console.log('ModernStats: getAllStats returned:', {
          hasFlowSummaries: !!allStats?.flowSummaries,
          flowSummariesCount: allStats?.flowSummaries?.length || 0,
          flowSummaries: allStats?.flowSummaries?.map(f => ({
            id: f.flowId,
            title: f.flowTitle,
            completionRate: f.completionRate,
            completed: f.completed,
            scheduled: f.scheduledDays
          }))
        });
        
        console.log('ModernStats: Stats loaded:', allStats);
        setStats(allStats);
      } catch (error) {
        console.error('ModernStats: Failed to load stats:', error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [flows, selectedTimeframe, getAllStats]);

  // Animate on mount
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);


  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingTitle, { color: themeColors.primaryText }]}>Loading...</Text>
          <Text style={[styles.loadingMessage, { color: themeColors.secondaryText }]}>
            Loading analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
  const MetricCardComponent = ({ title, value, subtitle, icon, color, trend }) => (
    <Animated.View
      style={[
        styles.metricCardComponent,
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
  const FlowPerformanceCardComponent = ({ flow }) => (
    <TouchableOpacity
      style={[styles.flowCardComponent, { backgroundColor: themeColors.cardBackground }]}
      onPress={() => navigation.navigate('FlowStatsDetail', { flowId: flow.id })}
    >
      <View style={styles.flowCardComponentHeader}>
        <Text style={[styles.flowCardComponentTitle, { color: themeColors.primaryText }]}>{flow.name}</Text>
        <View style={[styles.performanceBadge, { backgroundColor: flow.performance >= 80 ? colors.light.success : flow.performance >= 60 ? colors.light.warning : colors.light.error }]}>
          <Text style={styles.performanceText}>{flow.performance?.toFixed(0) || '0'}%</Text>
        </View>
      </View>
      
      <View style={styles.flowCardComponentBody}>
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
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>Analytics</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>
            Track your flow performance
          </Text>
        </View>

        {/* Use the new Analytics Dashboard with ActivityContext data */}
        <AnalyticsDashboard flows={flows} theme={theme} navigation={navigation} stats={stats} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layout.spacing.xl,
  },
  loadingTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
    textAlign: 'center',
  },
  loadingMessage: {
    ...typography.styles.body,
    textAlign: 'center',
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
    ...typography.largeTitle,
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
  metricCardComponent: {
    width: '48%',
    marginBottom: layout.spacing.md,
  },
  metricGradient: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
    ...layout.elevation.medium,
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
  chartTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
    textAlign: 'center',
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.radii.large,
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
  flowCardComponent: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
    marginBottom: layout.spacing.sm,
    ...layout.elevation.low,
  },
  flowCardComponentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  flowCardComponentTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    flex: 1,
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
  flowCardComponentBody: {
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
