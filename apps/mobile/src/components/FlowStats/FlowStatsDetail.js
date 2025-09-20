import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ThemeContext } from '../../context/ThemeContext';
import { colors, layout, typography } from '../../../styles';
import { LineChart } from 'react-native-chart-kit';
import Card from '../common/card';
import statsService from '../../services/statsService';

const { width: screenWidth } = Dimensions.get('window');

const FlowStatsDetail = ({ route, navigation }) => {
  const { flowId } = route?.params || {};
  const { flows } = useContext(FlowsContext);
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('7D');

  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isDark = theme === 'dark';

  if (!flowId || !flows) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>📊</Text>
          <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>Flow Data Unavailable</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
            Unable to load flow statistics. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const flow = flows.find((f) => f.id === flowId);

  if (!flow) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>❌</Text>
          <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>Flow Not Found</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
            The requested flow could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate flow statistics using the stats service
  const flowStats = useMemo(() => {
    if (!flow) return null;
    
    return statsService.calculateFlowStats(flow, {
      timeframe: selectedTimeframe,
      selectedPeriod: 'weekly',
      selectedYear: moment().year()
    });
  }, [flow, selectedTimeframe]);

  // Chart configuration (same as main stats page)
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

  // Generate heat map data for the last 30 days
  const generateHeatMapData = () => {
    const heatMapData = [];
    const today = moment();
    
    for (let i = 29; i >= 0; i--) {
      const date = today.clone().subtract(i, 'days');
      const dayKey = date.format('YYYY-MM-DD');
      
      let intensity = 0;
      if (flow.trackingType === 'Binary') {
        const status = flow.status?.[dayKey];
        intensity = status?.symbol === '✅' ? 1 : 0;
      } else if (flow.trackingType === 'Quantitative') {
        const status = flow.status?.[dayKey];
        const value = status?.value || 0;
        const goal = flow.goal || 1;
        intensity = Math.min(value / goal, 1);
      } else if (flow.trackingType === 'Time-based') {
        const status = flow.status?.[dayKey];
        const time = status?.time || 0;
        const goal = flow.goal || 1;
        intensity = Math.min(time / goal, 1);
      }
      
      heatMapData.push({
        date: date.format('YYYY-MM-DD'),
        day: date.format('DD'),
        month: date.format('MMM'),
        intensity,
        isToday: date.isSame(today, 'day'),
      });
    }
    
    return heatMapData;
  };

  // Render metric card (same style as main stats page)
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

  // Impressive Heat Map Component
  const HeatMap = ({ data, title, subtitle }) => {
    const [selectedDay, setSelectedDay] = useState(null);
    const [animatedValues] = useState(() => 
      data.map(() => new Animated.Value(0))
    );

    React.useEffect(() => {
      // Staggered animation for heat map squares
      const animations = animatedValues.map((animValue, index) => 
        Animated.timing(animValue, {
          toValue: 1,
          duration: 300,
          delay: index * 20,
          useNativeDriver: true,
        })
      );
      
      Animated.stagger(50, animations).start();
    }, []);

    const getIntensityColor = (intensity) => {
      if (intensity === 0) return colors.light.progressBackground + '15';
      if (intensity <= 0.2) return '#FFE4B5';
      if (intensity <= 0.4) return '#FFD700';
      if (intensity <= 0.6) return '#FF8C00';
      if (intensity <= 0.8) return '#FF6347';
      return '#FF4500';
    };

    const getIntensityTextColor = (intensity) => {
      return intensity > 0.4 ? '#FFFFFF' : themeColors.primaryText;
    };

    const getIntensityLabel = (intensity) => {
      if (intensity === 0) return 'No activity';
      if (intensity <= 0.2) return 'Low activity';
      if (intensity <= 0.4) return 'Moderate activity';
      if (intensity <= 0.6) return 'Good activity';
      if (intensity <= 0.8) return 'High activity';
      return 'Excellent activity';
    };

    // Group data by weeks
    const weeks = [];
    for (let i = 0; i < data.length; i += 7) {
      weeks.push(data.slice(i, i + 7));
    }

    // Calculate statistics
    const totalDays = data.length;
    const activeDays = data.filter(day => day.intensity > 0).length;
    const averageIntensity = data.reduce((sum, day) => sum + day.intensity, 0) / totalDays;
    const bestDay = data.reduce((best, day) => day.intensity > best.intensity ? day : best, data[0]);

    return (
      <Card variant="default" padding="lg" margin="md">
        <View style={styles.heatMapHeader}>
          <View style={styles.heatMapTitleContainer}>
            <Ionicons name="calendar" size={24} color={colors.light.primaryOrange} />
            <Text style={[styles.chartTitle, { color: themeColors.primaryText, marginLeft: layout.spacing.sm }]}>{title}</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>{subtitle}</Text>
        </View>
        
        {/* Statistics Bar */}
        <View style={styles.heatMapStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.light.success }]}>{activeDays}</Text>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Active Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.light.primaryOrange }]}>{(averageIntensity * 100).toFixed(0)}%</Text>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Avg Intensity</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.light.info }]}>{bestDay.day}</Text>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Best Day</Text>
          </View>
        </View>
        
        <View style={styles.heatMapContainer}>
          {/* Month labels */}
          <View style={styles.monthLabels}>
            {weeks.map((week, index) => {
              const firstDay = week[0];
              const month = moment(firstDay.date).format('MMM');
              return (
                <Text key={index} style={[styles.monthLabel, { color: themeColors.secondaryText }]}>
                  {month}
                </Text>
              );
            })}
          </View>
          
          {/* Day labels */}
          <View style={styles.dayLabels}>
            <Text style={[styles.dayLabel, { color: themeColors.secondaryText }]}>S</Text>
            <Text style={[styles.dayLabel, { color: themeColors.secondaryText }]}>M</Text>
            <Text style={[styles.dayLabel, { color: themeColors.secondaryText }]}>T</Text>
            <Text style={[styles.dayLabel, { color: themeColors.secondaryText }]}>W</Text>
            <Text style={[styles.dayLabel, { color: themeColors.secondaryText }]}>T</Text>
            <Text style={[styles.dayLabel, { color: themeColors.secondaryText }]}>F</Text>
            <Text style={[styles.dayLabel, { color: themeColors.secondaryText }]}>S</Text>
          </View>
          
          {/* Heat map grid */}
          <View style={styles.heatMapGrid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.heatMapWeek}>
                {week.map((day, dayIndex) => {
                  const globalIndex = weekIndex * 7 + dayIndex;
                  return (
                    <Animated.View
                      key={day.date}
                      style={[
                        styles.heatMapDayContainer,
                        {
                          opacity: animatedValues[globalIndex],
                          transform: [
                            {
                              scale: animatedValues[globalIndex].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.heatMapDay,
                          {
                            backgroundColor: getIntensityColor(day.intensity),
                            borderColor: day.isToday ? colors.light.primaryOrange : 'transparent',
                            borderWidth: day.isToday ? 3 : 0,
                            shadowColor: day.intensity > 0.5 ? colors.light.primaryOrange : 'transparent',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: day.intensity > 0.5 ? 0.3 : 0,
                            shadowRadius: 4,
                            elevation: day.intensity > 0.5 ? 3 : 0,
                          }
                        ]}
                        onPress={() => setSelectedDay(selectedDay === day.date ? null : day.date)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.heatMapDayText,
                            { color: getIntensityTextColor(day.intensity) }
                          ]}
                        >
                          {day.day}
                        </Text>
                        {day.intensity > 0.7 && (
                          <View style={styles.intensityIndicator}>
                            <Ionicons name="star" size={8} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ))}
          </View>
          
          {/* Selected Day Info */}
          {selectedDay && (
            <Animated.View style={[styles.selectedDayInfo, { backgroundColor: themeColors.cardBackground }]}>
              {(() => {
                const day = data.find(d => d.date === selectedDay);
                return (
                  <View style={styles.selectedDayContent}>
                    <Ionicons name="information-circle" size={20} color={colors.light.primaryOrange} />
                    <View style={styles.selectedDayText}>
                      <Text style={[styles.selectedDayDate, { color: themeColors.primaryText }]}>
                        {moment(day.date).format('MMMM DD, YYYY')}
                      </Text>
                      <Text style={[styles.selectedDayIntensity, { color: themeColors.secondaryText }]}>
                        {getIntensityLabel(day.intensity)} • {(day.intensity * 100).toFixed(0)}% intensity
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </Animated.View>
          )}
          
          {/* Enhanced Legend */}
          <View style={styles.heatMapLegend}>
            <Text style={[styles.legendLabel, { color: themeColors.secondaryText }]}>Less</Text>
            <View style={styles.legendColors}>
              <View style={[styles.legendColor, { backgroundColor: colors.light.progressBackground + '15' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#FFE4B5' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#FFD700' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#FF8C00' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#FF6347' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#FF4500' }]} />
            </View>
            <Text style={[styles.legendLabel, { color: themeColors.secondaryText }]}>More</Text>
          </View>
        </View>
      </Card>
    );
  };

  // Get flow type specific analytics
  const getFlowTypeAnalytics = () => {
    if (!flowStats) return null;

    const { metrics, streaks, completionRates, trends } = flowStats;

    switch (flow.trackingType) {
      case 'Binary':
        return {
          primaryMetric: `${completionRates?.overall?.toFixed(1) || 0}%`,
          primaryLabel: 'Success Rate',
          secondaryMetrics: [
            { title: 'Current Streak', value: `${streaks?.current || 0} days`, icon: 'flame', color: colors.light.warning },
            { title: 'Best Streak', value: `${streaks?.best || 0} days`, icon: 'trophy', color: colors.light.success },
            { title: 'Completed', value: `${metrics?.completed || 0}`, icon: 'checkmark-circle', color: colors.light.info },
            { title: 'Total Days', value: `${metrics?.scheduled || 0}`, icon: 'calendar', color: colors.light.primaryOrange },
          ],
          chartData: {
            labels: trends?.dailyData?.map(d => d.displayDate).slice(-7) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              data: trends?.dailyData?.map(d => d.percentage).slice(-7) || [0, 0, 0, 0, 0, 0, 0],
              color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              strokeWidth: 3,
            }],
          },
          chartTitle: 'Daily Completion Rate',
          chartSubtitle: 'Your daily success rate over the last 7 days',
          heatMapData: generateHeatMapData(),
        };
      
      case 'Quantitative':
        return {
          primaryMetric: `${metrics?.totalValue?.toLocaleString() || 0}`,
          primaryLabel: 'Total Value',
          secondaryMetrics: [
            { title: 'Daily Average', value: `${metrics?.avgDailyValue?.toFixed(1) || 0}`, icon: 'trending-up', color: colors.light.success },
            { title: 'Success Rate', value: `${completionRates?.overall?.toFixed(1) || 0}%`, icon: 'checkmark-circle', color: colors.light.info },
            { title: 'Completed Days', value: `${metrics?.completed || 0}`, icon: 'calendar', color: colors.light.primaryOrange },
            { title: 'Best Streak', value: `${streaks?.best || 0} days`, icon: 'trophy', color: colors.light.warning },
          ],
          chartData: {
            labels: trends?.dailyData?.map(d => d.displayDate).slice(-7) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              data: trends?.dailyData?.map(d => d.value).slice(-7) || [0, 0, 0, 0, 0, 0, 0],
              color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              strokeWidth: 3,
            }],
          },
          chartTitle: 'Daily Values',
          chartSubtitle: 'Your daily values over the last 7 days',
          heatMapData: generateHeatMapData(),
          // Quantitative specific stats
          quantitativeStats: [
            { title: 'Highest Day', value: `${metrics?.maxDailyValue?.toFixed(1) || 0}`, icon: 'trending-up', color: colors.light.success },
            { title: 'Lowest Day', value: `${metrics?.minDailyValue?.toFixed(1) || 0}`, icon: 'trending-down', color: colors.light.error },
            { title: 'Goal Achievement', value: `${((metrics?.totalValue || 0) / (flow.goal || 1) * 100).toFixed(1)}%`, icon: 'flag', color: colors.light.info },
            { title: 'Consistency Score', value: `${(metrics?.consistencyScore || 0).toFixed(1)}`, icon: 'bar-chart', color: colors.light.primaryOrange },
          ],
        };
      
      case 'Time-based':
        return {
          primaryMetric: `${Math.floor((metrics?.totalTime || 0) / 60)}h ${Math.floor((metrics?.totalTime || 0) % 60)}m`,
          primaryLabel: 'Total Time',
          secondaryMetrics: [
            { title: 'Daily Average', value: `${Math.floor((metrics?.avgDailyTime || 0) / 60)}h ${Math.floor((metrics?.avgDailyTime || 0) % 60)}m`, icon: 'time', color: colors.light.success },
            { title: 'Success Rate', value: `${completionRates?.overall?.toFixed(1) || 0}%`, icon: 'checkmark-circle', color: colors.light.info },
            { title: 'Completed Days', value: `${metrics?.completed || 0}`, icon: 'calendar', color: colors.light.primaryOrange },
            { title: 'Best Streak', value: `${streaks?.best || 0} days`, icon: 'trophy', color: colors.light.warning },
          ],
          chartData: {
            labels: trends?.dailyData?.map(d => d.displayDate).slice(-7) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              data: trends?.dailyData?.map(d => d.time).slice(-7) || [0, 0, 0, 0, 0, 0, 0],
              color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              strokeWidth: 3,
            }],
          },
          chartTitle: 'Daily Time Spent',
          chartSubtitle: 'Your daily time investment over the last 7 days',
          heatMapData: generateHeatMapData(),
          // Time-based specific stats
          timeBasedStats: [
            { title: 'Longest Session', value: `${Math.floor((metrics?.maxDailyTime || 0) / 60)}h ${Math.floor((metrics?.maxDailyTime || 0) % 60)}m`, icon: 'time', color: colors.light.success },
            { title: 'Shortest Session', value: `${Math.floor((metrics?.minDailyTime || 0) / 60)}h ${Math.floor((metrics?.minDailyTime || 0) % 60)}m`, icon: 'hourglass', color: colors.light.error },
            { title: 'Goal Achievement', value: `${((metrics?.totalTime || 0) / (flow.goal || 1) * 100).toFixed(1)}%`, icon: 'flag', color: colors.light.info },
            { title: 'Focus Score', value: `${(metrics?.focusScore || 0).toFixed(1)}`, icon: 'eye', color: colors.light.primaryOrange },
          ],
        };
      
      default:
        return null;
    }
  };

  const analytics = getFlowTypeAnalytics();

  if (!analytics || !flowStats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>⚠️</Text>
          <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>Unsupported Flow Type</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
            This flow type is not supported for detailed analytics.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.primaryText} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>{flow.title}</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>
              {flow.trackingType} Flow Analytics
            </Text>
          </View>
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

        {/* Primary Metric */}
        <Card variant="default" padding="lg" margin="md">
          <View style={styles.primaryMetricContainer}>
            <Text style={[styles.primaryMetricValue, { color: themeColors.primaryText }]}>
              {analytics.primaryMetric}
            </Text>
            <Text style={[styles.primaryMetricLabel, { color: themeColors.secondaryText }]}>
              {analytics.primaryLabel}
            </Text>
          </View>
        </Card>

        {/* Secondary Metrics */}
        <View style={styles.metricsGrid}>
          {analytics.secondaryMetrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
            />
          ))}
        </View>

        {/* Chart */}
        <Card variant="default" padding="lg" margin="md">
          <Text style={[styles.chartTitle, { color: themeColors.primaryText }]}>
            {analytics.chartTitle}
          </Text>
          <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>
            {analytics.chartSubtitle}
          </Text>
          <LineChart
            data={analytics.chartData}
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
        </Card>

        {/* Heat Map */}
        <HeatMap
          data={analytics.heatMapData}
          title="Activity Heat Map"
          subtitle={`Your ${flow.trackingType.toLowerCase()} activity over the last 30 days`}
        />

        {/* Type-Specific Stats */}
        {flow.trackingType === 'Quantitative' && analytics.quantitativeStats && (
          <Card variant="default" padding="lg" margin="md">
            <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Quantitative Analysis</Text>
            <View style={styles.metricsGrid}>
              {analytics.quantitativeStats.map((stat, index) => (
                <MetricCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                />
              ))}
            </View>
          </Card>
        )}

        {flow.trackingType === 'Time-based' && analytics.timeBasedStats && (
          <Card variant="default" padding="lg" margin="md">
            <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Time Analysis</Text>
            <View style={styles.metricsGrid}>
              {analytics.timeBasedStats.map((stat, index) => (
                <MetricCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                />
              ))}
            </View>
          </Card>
        )}

        {/* Insights */}
        <Card variant="default" padding="lg" margin="md">
          <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Insights</Text>
          <View style={styles.insightsList}>
            {flowStats.completionRates?.overall >= 80 && (
              <View style={styles.insightItem}>
                <Ionicons name="trophy" size={20} color={colors.light.success} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  Excellent consistency! You're maintaining a {flowStats.completionRates.overall.toFixed(1)}% success rate.
                </Text>
              </View>
            )}
            {flowStats.streaks?.current >= 7 && (
              <View style={styles.insightItem}>
                <Ionicons name="flame" size={20} color={colors.light.warning} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  Great streak! You've been consistent for {flowStats.streaks.current} days.
                </Text>
              </View>
            )}
            {flowStats.completionRates?.overall < 50 && (
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={20} color={colors.light.error} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  Consider focusing on consistency. Your success rate is {flowStats.completionRates.overall.toFixed(1)}%.
                </Text>
              </View>
            )}
            {flow.trackingType === 'Quantitative' && flowStats.metrics?.avgDailyValue > 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="bar-chart" size={20} color={colors.light.info} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  Your daily average is {flowStats.metrics.avgDailyValue.toFixed(1)} units.
                </Text>
              </View>
            )}
            {flow.trackingType === 'Time-based' && flowStats.metrics?.avgDailyTime > 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="time" size={20} color={colors.light.info} />
                <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                  You spend an average of {Math.floor(flowStats.metrics.avgDailyTime / 60)}h {Math.floor(flowStats.metrics.avgDailyTime % 60)}m daily.
                </Text>
              </View>
            )}
          </View>
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
    padding: layout.spacing.sm,
    paddingBottom: layout.spacing.xl + 80,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  backButton: {
    padding: layout.spacing.sm,
    marginRight: layout.spacing.sm,
  },
  headerContent: {
    flex: 1,
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
  primaryMetricContainer: {
    alignItems: 'center',
    padding: layout.spacing.lg,
  },
  primaryMetricValue: {
    ...typography.styles.largeTitle,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  primaryMetricLabel: {
    ...typography.styles.title2,
    opacity: 0.8,
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
  chartSubtitle: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginBottom: layout.spacing.sm,
    opacity: 0.8,
    fontSize: 11,
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.lg,
  },
  insightsTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
  },
  insightsList: {
    // Container for insights
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
  // Impressive Heat Map Styles
  heatMapHeader: {
    marginBottom: layout.spacing.md,
  },
  heatMapTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.xs,
  },
  heatMapStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.light.progressBackground + '20',
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  statLabel: {
    ...typography.styles.caption,
    fontSize: 10,
    textAlign: 'center',
  },
  heatMapContainer: {
    alignItems: 'center',
    marginTop: layout.spacing.sm,
  },
  monthLabels: {
    flexDirection: 'row',
    marginBottom: layout.spacing.xs,
    paddingLeft: layout.spacing.lg,
  },
  monthLabel: {
    ...typography.styles.caption,
    fontSize: 9,
    width: 28,
    textAlign: 'center',
    marginHorizontal: 2,
    fontWeight: '600',
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: layout.spacing.xs,
    paddingLeft: layout.spacing.lg,
  },
  dayLabel: {
    ...typography.styles.caption,
    fontSize: 10,
    width: 28,
    textAlign: 'center',
    marginHorizontal: 2,
    fontWeight: '600',
  },
  heatMapGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heatMapWeek: {
    flexDirection: 'column',
    marginRight: layout.spacing.xs,
  },
  heatMapDayContainer: {
    marginBottom: 2,
  },
  heatMapDay: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heatMapDayText: {
    ...typography.styles.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  intensityIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  selectedDayInfo: {
    marginTop: layout.spacing.md,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.primaryOrange + '30',
  },
  selectedDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDayText: {
    marginLeft: layout.spacing.sm,
    flex: 1,
  },
  selectedDayDate: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  selectedDayIntensity: {
    ...typography.styles.caption,
    fontSize: 11,
  },
  heatMapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: layout.spacing.lg,
    backgroundColor: colors.light.progressBackground + '10',
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
  },
  legendLabel: {
    ...typography.styles.caption,
    fontSize: 10,
    marginHorizontal: layout.spacing.sm,
    fontWeight: '600',
  },
  legendColors: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
});

export default FlowStatsDetail;
