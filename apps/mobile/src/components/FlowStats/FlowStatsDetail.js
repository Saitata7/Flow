import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, Alert } from 'react-native';
import SafeAreaWrapper from '../common/SafeAreaWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';
import { colors, layout, typography } from '../../../styles';
import { LineChart } from 'react-native-chart-kit';
import Card from '../common/card';

const { width: screenWidth } = Dimensions.get('window');

const FlowStatsDetail = ({ route, navigation }) => {
  const { flowId } = route?.params || {};
  const { flows, deleteFlow } = useContext(FlowsContext);
  const { getScoreboard, getActivityStats, getEmotionalActivity } = useContext(ActivityContext);
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('weekly');

  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isDark = theme === 'dark';

  // Find the flow - this needs to be done after all hooks are called
  const flow = flows?.find((f) => f.id === flowId);

  // Check for error conditions after all hooks are called
  const hasError = !flowId || !flows || !flow;

  // No longer need flowStats since we're using ActivityContext

  // Chart configuration with theme colors
  const chartConfig = {
    backgroundColor: themeColors.background,
    backgroundGradientFrom: themeColors.background,
    backgroundGradientTo: themeColors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: (opacity = 1) => `${themeColors.primaryText}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    style: {
      borderRadius: layout.borderRadius.lg,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: themeColors.primaryOrange,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: themeColors.progressBackground,
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

  // Generate heat map data for the last 30 days using ActivityContext
  const generateHeatMapData = () => {
    const heatMapData = [];
    const today = moment();
    
    for (let i = 29; i >= 0; i--) {
      const date = today.clone().subtract(i, 'days');
      const dayKey = date.format('YYYY-MM-DD');
      
      let intensity = 0;
      const status = flow.status?.[dayKey];
      
      if (flow.trackingType === 'Binary') {
        intensity = status?.symbol === '✅' ? 1 : 0;
      } else if (flow.trackingType === 'Quantitative') {
        const quantitative = status?.quantitative;
        const value = quantitative?.count || 0;
        const goal = flow.goal || 1;
        intensity = Math.min(value / goal, 1);
      } else if (flow.trackingType === 'Time-based') {
        const timebased = status?.timebased;
        const time = timebased?.totalDuration || 0;
        const goalSeconds = ((flow.hours || 0) * 3600) + ((flow.minutes || 0) * 60) + (flow.seconds || 0);
        const goal = goalSeconds || 1;
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
      if (intensity === 0) return themeColors.progressBackground + '15';
      if (intensity <= 0.2) return themeColors.success + '40';
      if (intensity <= 0.4) return themeColors.success + '60';
      if (intensity <= 0.6) return themeColors.success + '80';
      if (intensity <= 0.8) return themeColors.success;
      return themeColors.primaryOrange;
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
            <Ionicons name="calendar" size={24} color={themeColors.primaryOrange} />
            <Text style={[styles.chartTitle, { color: themeColors.primaryText, marginLeft: layout.spacing.sm }]}>{title}</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>{subtitle}</Text>
        </View>
        
        {/* Statistics Bar */}
        <View style={styles.heatMapStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.success }]}>{activeDays}</Text>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Active Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.primaryOrange }]}>{(averageIntensity * 100).toFixed(0)}%</Text>
            <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Avg Intensity</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.info }]}>{bestDay.day}</Text>
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
                              borderColor: day.isToday ? themeColors.primaryOrange : 'transparent',
                              borderWidth: day.isToday ? 3 : 0,
                              shadowColor: day.intensity > 0.5 ? themeColors.primaryOrange : 'transparent',
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
                    <Ionicons name="information-circle" size={20} color={themeColors.primaryOrange} />
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
              <View style={[styles.legendColor, { backgroundColor: themeColors.progressBackground + '15' }]} />
              <View style={[styles.legendColor, { backgroundColor: themeColors.success + '40' }]} />
              <View style={[styles.legendColor, { backgroundColor: themeColors.success + '60' }]} />
              <View style={[styles.legendColor, { backgroundColor: themeColors.success + '80' }]} />
              <View style={[styles.legendColor, { backgroundColor: themeColors.success }]} />
              <View style={[styles.legendColor, { backgroundColor: themeColors.primaryOrange }]} />
            </View>
            <Text style={[styles.legendLabel, { color: themeColors.secondaryText }]}>More</Text>
          </View>
        </View>
      </Card>
    );
  };

  // Get flow type specific analytics using ActivityContext with timeframe filtering
  const getFlowTypeAnalytics = () => {
    if (!flowId) return null;

    // Get date range based on selected timeframe
    const getDateRange = () => {
      const now = moment();
      switch (selectedTimeframe) {
        case 'weekly':
          return {
            start: now.clone().subtract(7, 'days'),
            end: now,
            label: 'Last 7 days'
          };
        case 'monthly':
          return {
            start: now.clone().subtract(30, 'days'),
            end: now,
            label: 'Last 30 days'
          };
        case 'yearly':
          return {
            start: now.clone().subtract(365, 'days'),
            end: now,
            label: 'Last year'
          };
        default:
          return {
            start: now.clone().subtract(7, 'days'),
            end: now,
            label: 'Last 7 days'
          };
      }
    };

    const dateRange = getDateRange();
    const scoreboard = getScoreboard(flowId);
    const activityStats = getActivityStats(flowId);
    const emotionalActivity = getEmotionalActivity(flowId);

    // Generate daily data for the selected timeframe
    const generateDailyData = () => {
      const dailyData = [];
      const daysDiff = dateRange.end.diff(dateRange.start, 'days');
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = dateRange.start.clone().add(i, 'days');
        const dayKey = date.format('YYYY-MM-DD');
        const status = flow.status?.[dayKey];
        
        let completed = 0;
        let value = 0;
        
        if (status?.symbol === '✅') {
          completed = 1;
          if (flow.trackingType === 'Quantitative') {
            value = status?.quantitative?.count || 0;
          } else if (flow.trackingType === 'Time-based') {
            value = status?.timebased?.totalDuration || 0;
          }
        }
        
        dailyData.push({
          date: dayKey,
          displayDate: date.format('MMM DD'),
          completed,
          value,
        });
      }
      
      return dailyData;
    };

    // Generate chart data based on selected timeframe
    const generateChartData = () => {
      const dailyData = generateDailyData();
      
      const getDataValue = (day) => {
        switch (flow.trackingType) {
          case 'Binary':
            return day.completed ? 100 : 0;
          case 'Quantitative':
            return day.value || 0;
          case 'Time-based':
            return Math.floor((day.value || 0) / 60); // Convert seconds to minutes
          default:
            return day.completed ? 100 : 0;
        }
      };
      
      switch (selectedTimeframe) {
        case 'weekly':
          // For weekly, show daily data (already generated)
          return {
            labels: dailyData.map(d => d.displayDate),
            datasets: [{
              data: dailyData.map(getDataValue),
              color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
              strokeWidth: 3,
            }],
          };
          
        case 'monthly':
          // For monthly, group by weeks with week numbers resetting per month
          const weeklyData = [];
          let currentMonth = null;
          let weekNumber = 1;
          
          for (let i = 0; i < dailyData.length; i += 7) {
            const weekData = dailyData.slice(i, i + 7);
            const weekStart = weekData[0]?.date;
            const weekMonth = moment(weekStart).format('MMM');
            
            // Reset week number when month changes
            if (currentMonth !== weekMonth) {
              currentMonth = weekMonth;
              weekNumber = 1;
            }
            
            // Use month name with week number for cleaner labels
            const weekLabel = `${weekMonth}(W${weekNumber})`;
            
            let weekValue;
            if (flow.trackingType === 'Binary') {
              const weekCompleted = weekData.filter(d => d.completed).length;
              const weekTotal = weekData.length;
              weekValue = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0;
            } else {
              weekValue = weekData.reduce((sum, d) => sum + getDataValue(d), 0);
            }
            
            weeklyData.push({
              label: weekLabel,
              value: weekValue
            });
            weekNumber++;
          }
          
          return {
            labels: weeklyData.map(w => w.label),
            datasets: [{
              data: weeklyData.map(w => w.value),
              color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
              strokeWidth: 3,
            }],
          };
          
        case 'yearly':
          // For yearly, group by months
          const monthlyData = [];
          const monthGroups = {};
          
          dailyData.forEach(day => {
            const monthKey = moment(day.date).format('YYYY-MM');
            if (!monthGroups[monthKey]) {
              monthGroups[monthKey] = [];
            }
            monthGroups[monthKey].push(day);
          });
          
          Object.keys(monthGroups).sort().forEach(monthKey => {
            const monthDays = monthGroups[monthKey];
            const monthLabel = moment(monthKey).format('MMM');
            
            let monthValue;
            if (flow.trackingType === 'Binary') {
              const monthCompleted = monthDays.filter(d => d.completed).length;
              const monthTotal = monthDays.length;
              monthValue = monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0;
            } else {
              monthValue = monthDays.reduce((sum, d) => sum + getDataValue(d), 0);
            }
            
            monthlyData.push({
              label: monthLabel,
              value: monthValue
            });
          });
          
          return {
            labels: monthlyData.map(m => m.label),
            datasets: [{
              data: monthlyData.map(m => m.value),
              color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
              strokeWidth: 3,
            }],
          };
          
        default:
          return {
            labels: dailyData.map(d => d.displayDate),
            datasets: [{
              data: dailyData.map(getDataValue),
              color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
              strokeWidth: 3,
            }],
          };
      }
    };

    const dailyData = generateDailyData();

    switch (flow.trackingType) {
      case 'Binary':
        return {
          primaryMetric: `${scoreboard.completionRate.toFixed(1)}%`,
          primaryLabel: 'Success Rate',
          timeframeLabel: dateRange.label,
          secondaryMetrics: [
            { title: 'Completed Days', value: `${scoreboard.completed}`, icon: 'checkmark-circle', color: themeColors.success },
            { title: 'Total Days', value: `${scoreboard.completed + scoreboard.failed + scoreboard.skipped + scoreboard.inactive}`, icon: 'calendar', color: themeColors.primaryOrange },
            { title: 'Success Rate', value: `${scoreboard.completionRate.toFixed(1)}%`, icon: 'trophy', color: themeColors.info },
            { title: 'Final Score', value: `${scoreboard.finalScore}`, icon: 'star', color: themeColors.warning },
          ],
          chartData: generateChartData(),
          chartTitle: selectedTimeframe === 'weekly' ? 'Daily Completion Rate' : 
                     selectedTimeframe === 'monthly' ? 'Weekly Completion Rate' : 
                     'Monthly Completion Rate',
          chartSubtitle: `Your daily success rate over ${dateRange.label.toLowerCase()}`,
          heatMapData: generateHeatMapData(),
        };
      
      case 'Quantitative':
        return {
          primaryMetric: `${scoreboard.quantitativeStats.totalCount.toLocaleString()}`,
          primaryLabel: 'Total Count',
          timeframeLabel: dateRange.label,
          secondaryMetrics: [
            { title: 'Daily Average', value: `${scoreboard.quantitativeStats.averageCount.toFixed(1)}`, icon: 'trending-up', color: themeColors.success },
            { title: 'Success Rate', value: `${scoreboard.completionRate.toFixed(1)}%`, icon: 'checkmark-circle', color: themeColors.info },
            { title: 'Completed Days', value: `${scoreboard.completed}`, icon: 'calendar', color: themeColors.primaryOrange },
            { title: 'Final Score', value: `${scoreboard.finalScore}`, icon: 'star', color: themeColors.warning },
          ],
          chartData: generateChartData(),
          chartTitle: selectedTimeframe === 'weekly' ? 'Daily Values' : 
                     selectedTimeframe === 'monthly' ? 'Weekly Values' : 
                     'Monthly Values',
          chartSubtitle: `Your daily values over ${dateRange.label.toLowerCase()}`,
          heatMapData: generateHeatMapData(),
          // Quantitative specific stats
          quantitativeStats: [
            { title: 'Total Count', value: `${scoreboard.quantitativeStats.totalCount.toLocaleString()}`, icon: 'bar-chart', color: themeColors.success },
            { title: 'Average Count', value: `${scoreboard.quantitativeStats.averageCount.toFixed(1)}`, icon: 'trending-up', color: themeColors.info },
            { title: 'Unit Text', value: scoreboard.quantitativeStats.unitText || 'units', icon: 'text', color: themeColors.primaryOrange },
            { title: 'Goal Achievement', value: `${((scoreboard.quantitativeStats.totalCount / (flow.goal || 1)) * 100).toFixed(1)}%`, icon: 'flag', color: themeColors.warning },
          ],
        };
      
      case 'Time-based':
        return {
          primaryMetric: `${Math.floor(scoreboard.timeBasedStats.totalDuration / 60)}h ${Math.floor(scoreboard.timeBasedStats.totalDuration % 60)}m`,
          primaryLabel: 'Total Time',
          timeframeLabel: dateRange.label,
          secondaryMetrics: [
            { title: 'Daily Average', value: `${Math.floor(scoreboard.timeBasedStats.averageDuration / 60)}h ${Math.floor(scoreboard.timeBasedStats.averageDuration % 60)}m`, icon: 'time', color: themeColors.success },
            { title: 'Success Rate', value: `${scoreboard.completionRate.toFixed(1)}%`, icon: 'checkmark-circle', color: themeColors.info },
            { title: 'Completed Days', value: `${scoreboard.completed}`, icon: 'calendar', color: themeColors.primaryOrange },
            { title: 'Total Pauses', value: `${scoreboard.timeBasedStats.totalPauses}`, icon: 'pause', color: themeColors.warning },
          ],
          chartData: generateChartData(),
          chartTitle: selectedTimeframe === 'weekly' ? 'Daily Time Spent' : 
                     selectedTimeframe === 'monthly' ? 'Weekly Time Spent' : 
                     'Monthly Time Spent',
          chartSubtitle: `Your daily time investment over ${dateRange.label.toLowerCase()}`,
          heatMapData: generateHeatMapData(),
          // Time-based specific stats
          timeBasedStats: [
            { title: 'Total Duration', value: `${Math.floor(scoreboard.timeBasedStats.totalDuration / 60)}h ${Math.floor(scoreboard.timeBasedStats.totalDuration % 60)}m`, icon: 'time', color: themeColors.success },
            { title: 'Average Duration', value: `${Math.floor(scoreboard.timeBasedStats.averageDuration / 60)}h ${Math.floor(scoreboard.timeBasedStats.averageDuration % 60)}m`, icon: 'hourglass', color: themeColors.info },
            { title: 'Total Pauses', value: `${scoreboard.timeBasedStats.totalPauses}`, icon: 'pause', color: themeColors.primaryOrange },
            { title: 'Goal Achievement', value: `${((scoreboard.timeBasedStats.totalDuration / ((flow.hours || 0) * 3600 + (flow.minutes || 0) * 60 + (flow.seconds || 0) || 1)) * 100).toFixed(1)}%`, icon: 'flag', color: themeColors.warning },
          ],
        };
      
      default:
        return null;
    }
  };

  const analytics = useMemo(() => getFlowTypeAnalytics(), [flowId, selectedTimeframe, flows]);

  if (!analytics) {
    return (
      <SafeAreaWrapper style={{ backgroundColor: themeColors.background }}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>⚠️</Text>
          <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>Unsupported Flow Type</Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
            This flow type is not supported for detailed analytics.
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Handle error states after all hooks are called
  if (hasError) {
    if (!flowId || !flows) {
      return (
        <SafeAreaWrapper style={{ backgroundColor: themeColors.background }}>
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>📊</Text>
            <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>Flow Data Unavailable</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
              Unable to load flow statistics. Please try again.
            </Text>
          </View>
        </SafeAreaWrapper>
      );
    }

    if (!flow) {
      return (
        <SafeAreaWrapper style={{ backgroundColor: themeColors.background }}>
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>❌</Text>
            <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>Flow Not Found</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
              The requested flow could not be found.
            </Text>
          </View>
        </SafeAreaWrapper>
      );
    }
  }

  return (
    <SafeAreaWrapper style={{ backgroundColor: themeColors.background }}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back to statistics"
            accessibilityHint="Returns to the main statistics page"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.primaryText} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>{flow.title}</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>
              {flow.trackingType} Flow Analytics
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('FlowDetails', { flowId: flow.id })}
              accessibilityLabel="Open flow calendar"
              accessibilityHint="View and manage flow entries in calendar view"
            >
              <Ionicons name="calendar-outline" size={24} color={themeColors.primaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('EditFlow', { flowId: flow.id })}
              accessibilityLabel="Edit flow"
              accessibilityHint="Modify flow settings and configuration"
            >
              <Ionicons name="create-outline" size={24} color={themeColors.primaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                Alert.alert(
                  'Delete Flow',
                  `Are you sure you want to delete "${flow.title}"? This action cannot be undone.`,
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        if (deleteFlow) {
                          deleteFlow(flow.id);
                          navigation.goBack();
                        }
                      },
                    },
                  ]
                );
              }}
              accessibilityLabel="Delete flow"
              accessibilityHint="Permanently delete this flow"
            >
              <Ionicons name="trash-outline" size={24} color={themeColors.error} />
            </TouchableOpacity>
          </View>
        </View>

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
              accessibilityHint={`View statistics for the ${timeframe.label.toLowerCase()} period`}
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
            withInnerLines={false}
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

        {/* Notes Tracking */}
        <Card variant="default" padding="lg" margin="md">
          <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Notes & Reflections</Text>
          <View style={styles.notesTracking}>
            {(() => {
              const scoreboard = getScoreboard(flowId);
              const notesCount = scoreboard.notesCount || 0;
              
              return (
                <View style={styles.notesSummary}>
                  <View style={styles.notesStat}>
                    <Ionicons name="document-text" size={24} color={themeColors.info} />
                    <View style={styles.notesStatInfo}>
                      <Text style={[styles.notesStatValue, { color: themeColors.primaryText }]}>{notesCount}</Text>
                      <Text style={[styles.notesStatLabel, { color: themeColors.secondaryText }]}>Total Notes</Text>
                    </View>
                  </View>
                  <View style={styles.notesStat}>
                    <Ionicons name="trending-up" size={24} color={themeColors.success} />
                    <View style={styles.notesStatInfo}>
                      <Text style={[styles.notesStatValue, { color: themeColors.primaryText }]}>
                        {notesCount > 0 ? 'Active' : 'None'}
                      </Text>
                      <Text style={[styles.notesStatLabel, { color: themeColors.secondaryText }]}>Reflection Status</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>
        </Card>

        {/* Emotional Tracking */}
        <Card variant="default" padding="lg" margin="md">
          <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Emotional Tracking</Text>
          <View style={styles.emotionalTrackingSingleLine}>
            {(() => {
              const emotionalData = getEmotionalActivity(flowId);
              const emotions = ['Happy', 'Sad', 'Angry', 'Excited', 'Calm'];
              const emotionIcons = {
                'Happy': '😊',
                'Sad': '😢', 
                'Angry': '😠',
                'Excited': '🎉',
                'Calm': '😌'
              };
              
              return emotions.map((emotion) => {
                const count = emotionalData.byEmotion?.[emotion] || 0;
                const percentage = emotionalData.totalEmotions > 0 ? (count / emotionalData.totalEmotions * 100).toFixed(1) : 0;
                
                return (
                  <View key={emotion} style={styles.emotionItemSingleLine}>
                    <Text style={[styles.emotionEmoji, { fontSize: 16 }]}>{emotionIcons[emotion]}</Text>
                    <Text style={[styles.emotionLabelSingleLine, { color: themeColors.primaryText }]}>{emotion}</Text>
                    <Text style={[styles.emotionCountSingleLine, { color: themeColors.primaryOrange }]}>{count}</Text>
                    <Text style={[styles.emotionPercentageSingleLine, { color: themeColors.secondaryText }]}>{percentage}%</Text>
                  </View>
                );
              });
            })()}
          </View>
        </Card>

        {/* Activity Tracking */}
        <Card variant="default" padding="lg" margin="md">
          <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Activity Tracking</Text>
          <View style={styles.activityTracking}>
            {(() => {
              const activityData = getActivityStats(flowId);
              
              return (
                <View style={styles.activityGrid}>
                  <View style={styles.activityStat}>
                    <Ionicons name="play-circle" size={24} color={themeColors.primaryOrange} />
                    <Text style={[styles.activityStatValue, { color: themeColors.primaryText }]}>
                      {activityData.totalSessions || 0}
                    </Text>
                    <Text style={[styles.activityStatLabel, { color: themeColors.secondaryText }]}>Sessions</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <Ionicons name="time" size={24} color={themeColors.info} />
                    <Text style={[styles.activityStatValue, { color: themeColors.primaryText }]}>
                      {Math.floor((activityData.totalDuration || 0) / 60)}h
                    </Text>
                    <Text style={[styles.activityStatLabel, { color: themeColors.secondaryText }]}>Total Time</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <Ionicons name="speedometer" size={24} color={themeColors.success} />
                    <Text style={[styles.activityStatValue, { color: themeColors.primaryText }]}>
                      {Math.floor(activityData.averageDuration || 0)}m
                    </Text>
                    <Text style={[styles.activityStatLabel, { color: themeColors.secondaryText }]}>Avg Duration</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <Ionicons name="pulse" size={24} color={themeColors.warning} />
                    <Text style={[styles.activityStatValue, { color: themeColors.primaryText }]}>
                      {activityData.totalPauses || 0}
                    </Text>
                    <Text style={[styles.activityStatLabel, { color: themeColors.secondaryText }]}>Pauses</Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </Card>

        {/* Insights */}
        <Card variant="default" padding="lg" margin="md">
          <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Insights</Text>
          <View style={styles.insightsList}>
            {(() => {
              const scoreboard = getScoreboard(flowId);
              const insights = [];
              
              if (scoreboard.completionRate >= 80) {
                insights.push(
                  <View key="excellent" style={styles.insightItem}>
                    <Ionicons name="trophy" size={20} color={themeColors.success} />
                    <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                      Excellent consistency! You're maintaining a {scoreboard.completionRate.toFixed(1)}% success rate.
                    </Text>
                  </View>
                );
              }
              
              if (scoreboard.completionRate < 50) {
                insights.push(
                  <View key="improve" style={styles.insightItem}>
                    <Ionicons name="trending-up" size={20} color={themeColors.error} />
                    <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                      Consider focusing on consistency. Your success rate is {scoreboard.completionRate.toFixed(1)}%.
                    </Text>
                  </View>
                );
              }
              
              if (flow.trackingType === 'Quantitative' && scoreboard.quantitativeStats.averageCount > 0) {
                insights.push(
                  <View key="quantitative" style={styles.insightItem}>
                    <Ionicons name="bar-chart" size={20} color={themeColors.info} />
                    <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                      Your daily average is {scoreboard.quantitativeStats.averageCount.toFixed(1)} {scoreboard.quantitativeStats.unitText || 'units'}.
                    </Text>
                  </View>
                );
              }
              
              if (flow.trackingType === 'Time-based' && scoreboard.timeBasedStats.averageDuration > 0) {
                insights.push(
                  <View key="timebased" style={styles.insightItem}>
                    <Ionicons name="time" size={20} color={themeColors.info} />
                    <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                      You spend an average of {Math.floor(scoreboard.timeBasedStats.averageDuration / 60)}h {Math.floor(scoreboard.timeBasedStats.averageDuration % 60)}m daily.
                    </Text>
                  </View>
                );
              }
              
              if (scoreboard.finalScore > 0) {
                insights.push(
                  <View key="score" style={styles.insightItem}>
                    <Ionicons name="star" size={20} color={themeColors.warning} />
                    <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
                      Your final score is {scoreboard.finalScore} points!
                    </Text>
                  </View>
                );
              }
              
              return insights;
            })()}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerActionButton: {
    padding: layout.spacing.sm,
    marginLeft: layout.spacing.sm,
    borderRadius: layout.borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    borderColor: 'rgba(255,149,0,0.3)',
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
    backgroundColor: 'rgba(0,0,0,0.03)',
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
    borderColor: 'rgba(0,0,0,0.1)',
  },
  // Emotional Tracking Styles
  emotionalTracking: {
    marginTop: layout.spacing.sm,
  },
  emotionalTrackingVertical: {
    marginTop: layout.spacing.sm,
  },
  emotionalTrackingHorizontal: {
    marginTop: layout.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emotionalTrackingSingleLine: {
    marginTop: layout.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  emotionItemSingleLine: {
    alignItems: 'center',
    paddingHorizontal: layout.spacing.xs,
    paddingVertical: layout.spacing.sm,
    minWidth: 60,
    maxWidth: 80,
  },
  emotionLabelSingleLine: {
    ...typography.styles.caption,
    fontWeight: '500',
    marginTop: layout.spacing.xs,
    textAlign: 'center',
    fontSize: 9,
  },
  emotionCountSingleLine: {
    ...typography.styles.caption,
    fontWeight: '700',
    marginTop: layout.spacing.xs,
    fontSize: 11,
  },
  emotionPercentageSingleLine: {
    ...typography.styles.caption,
    fontSize: 8,
    marginTop: layout.spacing.xs,
    textAlign: 'center',
  },
  emotionCardHorizontal: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.spacing.sm,
    padding: layout.spacing.sm,
  },
  emotionCardContentHorizontal: {
    alignItems: 'center',
  },
  emotionLabelHorizontal: {
    ...typography.styles.caption,
    fontWeight: '500',
    marginTop: layout.spacing.xs,
    textAlign: 'center',
  },
  emotionCountHorizontal: {
    ...typography.styles.title3,
    fontWeight: '700',
    marginTop: layout.spacing.xs,
  },
  emotionPercentageHorizontal: {
    ...typography.styles.caption,
    fontSize: 10,
    marginTop: layout.spacing.xs,
    textAlign: 'center',
  },
  emotionCardVertical: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.spacing.sm,
    padding: layout.spacing.md,
  },
  emotionCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emotionLabelVertical: {
    ...typography.styles.body,
    fontWeight: '500',
    marginLeft: layout.spacing.sm,
  },
  emotionCardStats: {
    alignItems: 'flex-end',
  },
  emotionCountVertical: {
    ...typography.styles.title3,
    fontWeight: '700',
  },
  emotionPercentageVertical: {
    ...typography.styles.caption,
    fontSize: 11,
    marginTop: layout.spacing.xs,
  },
  emotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  emotionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emotionEmoji: {
    fontSize: 20,
    marginRight: layout.spacing.sm,
  },
  emotionLabel: {
    ...typography.styles.body,
    fontWeight: '500',
  },
  emotionStats: {
    alignItems: 'flex-end',
  },
  emotionCount: {
    ...typography.styles.title3,
    fontWeight: '700',
  },
  emotionPercentage: {
    ...typography.styles.caption,
    fontSize: 11,
  },
  // Notes Tracking Styles
  notesTracking: {
    marginTop: layout.spacing.sm,
  },
  notesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  notesStat: {
    alignItems: 'center',
    flex: 1,
  },
  notesStatInfo: {
    alignItems: 'center',
    marginTop: layout.spacing.xs,
  },
  notesStatValue: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  notesStatLabel: {
    ...typography.styles.caption,
    textAlign: 'center',
  },
  // Activity Tracking Styles
  activityTracking: {
    marginTop: layout.spacing.sm,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityStat: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
    marginBottom: layout.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: layout.borderRadius.md,
  },
  activityStatValue: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginTop: layout.spacing.xs,
    marginBottom: layout.spacing.xs,
  },
  activityStatLabel: {
    ...typography.styles.caption,
    textAlign: 'center',
  },
});

export default FlowStatsDetail;
