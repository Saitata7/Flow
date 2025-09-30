import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, Alert, Modal } from 'react-native';
import SafeAreaWrapper from '../common/SafeAreaWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';
import { colors, layout, typography } from '../../../styles';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import Svg, { Circle, Path } from 'react-native-svg';
import Card from '../common/card';

const { width: screenWidth } = Dimensions.get('window');

// Circular Progress Component
const CircularProgress = ({ size = 120, strokeWidth = 8, progress = 0, color = '#4CAF50', backgroundColor = '#E0E0E0' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* Background Circle */}
      <Circle
        stroke={backgroundColor}
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      {/* Progress Circle */}
      <Circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </Svg>
  );
};

const FlowStatsDetail = ({ route, navigation }) => {
  const { flowId } = route?.params || {};
  const { flows, deleteFlow } = useContext(FlowsContext);
  const { getScoreboard, getActivityStats, getEmotionalActivity } = useContext(ActivityContext);
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('weekly');
  const [dateOffset, setDateOffset] = useState(0); // For navigating through date ranges
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

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
      borderRadius: layout.radii.large,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: themeColors.primaryOrange,
    },
    propsForDataPointLabels: {
      fontSize: 10,
      fill: themeColors.primaryOrange,
      fontWeight: 'bold',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: themeColors.progressBackground,
      strokeWidth: 1,
    },
    propsForVerticalLines: {
      stroke: themeColors.progressBackground,
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 9,
      fill: themeColors.primaryText,
    },
    propsForVerticalLabels: {
      fontSize: 8, // Show Y-axis labels
      fill: themeColors.primaryText,
    },
    propsForHorizontalLabels: {
      fontSize: 0, // Hide x-axis labels
      fill: 'transparent',
    },
    // Center the chart properly - add right padding for gap
    paddingRight: 10,

    paddingLeft: 10,
    paddingTop: 20,
    paddingBottom: 10,
  };

  // Generate heat map data for the last 3 months using ActivityContext
  const generateHeatMapData = () => {
    const heatMapData = [];
    const today = moment();
    
    // Generate data for last 3 months (approximately 90 days)
    for (let i = 89; i >= 0; i--) {
      const date = today.clone().subtract(i, 'days');
      const dayKey = date.format('YYYY-MM-DD');
      
      let intensity = 0;
      const status = flow.status?.[dayKey];
      
      if (flow.trackingType === 'Binary') {
        intensity = (status?.symbol === '✅' || status?.symbol === '+') ? 1 : 0;
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
      <Card variant="default" padding="lg" margin="xs">
        <View style={styles.heatMapHeader}>
          <View style={styles.heatMapTitleContainer}>
            <Ionicons name="calendar" size={24} color={themeColors.primaryOrange} />
            <Text style={[styles.chartTitle, { color: themeColors.primaryText, marginLeft: layout.spacing.sm }]}>{title}</Text>
          </View>
          <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>{subtitle}</Text>
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
          
          {/* Active Days Count */}
          <View style={styles.heatMapLegend}>
            <Text style={[styles.legendLabel, { color: themeColors.secondaryText }]}>
              Active Days: {analytics.heatMapData.filter(day => day.intensity > 0).length}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  // Get flow type specific analytics using ActivityContext with timeframe filtering
  const getFlowTypeAnalytics = () => {
    if (!flowId) return null;

    // Get date range based on selected timeframe and date offset
    const getDateRange = () => {
      const now = moment();
      const offsetDays = dateOffset * (selectedTimeframe === 'weekly' ? 7 : selectedTimeframe === 'monthly' ? 30 : 365);
      
      switch (selectedTimeframe) {
        case 'weekly':
          return {
            start: now.clone().subtract(7, 'days').add(offsetDays, 'days'),
            end: now.clone().add(offsetDays, 'days'),
            label: dateOffset === 0 ? 'Last 7 days' : 
                   dateOffset > 0 ? `Next ${Math.abs(dateOffset)} week${Math.abs(dateOffset) > 1 ? 's' : ''}` :
                   `Previous ${Math.abs(dateOffset)} week${Math.abs(dateOffset) > 1 ? 's' : ''}`
          };
        case 'monthly':
          return {
            start: now.clone().subtract(30, 'days').add(offsetDays, 'days'),
            end: now.clone().add(offsetDays, 'days'),
            label: dateOffset === 0 ? 'Last 30 days' : 
                   dateOffset > 0 ? `Next ${Math.abs(dateOffset)} month${Math.abs(dateOffset) > 1 ? 's' : ''}` :
                   `Previous ${Math.abs(dateOffset)} month${Math.abs(dateOffset) > 1 ? 's' : ''}`
          };
        case 'yearly':
          return {
            start: now.clone().subtract(365, 'days').add(offsetDays, 'days'),
            end: now.clone().add(1, 'month').add(offsetDays, 'days'),
            label: dateOffset === 0 ? 'Last year + next month' : 
                   dateOffset > 0 ? `Next ${Math.abs(dateOffset)} year${Math.abs(dateOffset) > 1 ? 's' : ''} + next month` :
                   `Previous ${Math.abs(dateOffset)} year${Math.abs(dateOffset) > 1 ? 's' : ''} + next month`
          };
        default:
          return {
            start: now.clone().subtract(7, 'days').add(offsetDays, 'days'),
            end: now.clone().add(offsetDays, 'days'),
            label: dateOffset === 0 ? 'Last 7 days' : 
                   dateOffset > 0 ? `Next ${Math.abs(dateOffset)} week${Math.abs(dateOffset) > 1 ? 's' : ''}` :
                   `Previous ${Math.abs(dateOffset)} week${Math.abs(dateOffset) > 1 ? 's' : ''}`
          };
      }
    };

    const dateRange = getDateRange();
    const scoreboard = getScoreboard(flowId, { 
      timeframe: selectedTimeframe,
      startDate: dateRange.start,
      endDate: dateRange.end
    });
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
        
        if (status?.symbol === '✅' || status?.symbol === '+') {
          completed = 1;
          if (flow.trackingType === 'Quantitative') {
            value = status?.quantitative?.count || 0;
          } else if (flow.trackingType === 'Time-based') {
            value = status?.timebased?.totalDuration || 0;
          }
        } else if (flow.trackingType === 'Time-based' && status?.timebased?.totalDuration > 0) {
          // For time-based flows, include any entry with duration data
          value = status?.timebased?.totalDuration || 0;
          // Mark as completed if duration meets goal
          const goalSeconds = ((status?.timebased?.hours || flow.hours || 0) * 3600) +
                            ((status?.timebased?.minutes || flow.minutes || 0) * 60) +
                            (status?.timebased?.seconds || flow.seconds || 0);
          if (value >= goalSeconds) {
            completed = 1;
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
            // Focus on completion: 100 for completed, 0 for not completed
            return day.completed ? 100 : 0;
          case 'Quantitative':
            // Focus on count: show actual count values
            return day.value || 0;
          case 'Time-based':
            // Focus on duration: return seconds for chart data
            return day.value || 0;
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
            dataPointLabels: dailyData.map(d => {
              if (flow.trackingType === 'Time-based') {
                const seconds = getDataValue(d);
                if (seconds < 60) {
                  return `${seconds}s`;
                } else if (seconds < 3600) {
                  return `${Math.floor(seconds / 60)}m`;
                } else {
                  return `${Math.floor(seconds / 3600)}h`;
                }
              }
              return getDataValue(d).toString();
            }),
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
              // Focus on completion: calculate completion percentage for the week
              const weekCompleted = weekData.filter(d => d.completed).length;
              const weekTotal = weekData.length;
              weekValue = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0;
            } else if (flow.trackingType === 'Quantitative') {
              // Focus on count: sum all counts for the week
              weekValue = weekData.reduce((sum, d) => sum + (d.value || 0), 0);
            } else if (flow.trackingType === 'Time-based') {
              // Focus on duration: sum all durations for the week (in seconds)
              weekValue = weekData.reduce((sum, d) => sum + (d.value || 0), 0);
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
            dataPointLabels: weeklyData.map(w => {
              if (flow.trackingType === 'Time-based') {
                const seconds = Math.round(w.value);
                if (seconds < 60) {
                  return `${seconds}s`;
                } else if (seconds < 3600) {
                  return `${Math.floor(seconds / 60)}m`;
                } else {
                  return `${Math.floor(seconds / 3600)}h`;
                }
              }
              return Math.round(w.value).toString();
            }),
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
              // Focus on completion: calculate completion percentage for the month
              const monthCompleted = monthDays.filter(d => d.completed).length;
              const monthTotal = monthDays.length;
              monthValue = monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0;
            } else if (flow.trackingType === 'Quantitative') {
              // Focus on count: sum all counts for the month
              monthValue = monthDays.reduce((sum, d) => sum + (d.value || 0), 0);
            } else if (flow.trackingType === 'Time-based') {
              // Focus on duration: sum all durations for the month (in seconds)
              monthValue = monthDays.reduce((sum, d) => sum + (d.value || 0), 0);
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
            dataPointLabels: monthlyData.map(m => {
              if (flow.trackingType === 'Time-based') {
                const seconds = Math.round(m.value);
                if (seconds < 60) {
                  return `${seconds}s`;
                } else if (seconds < 3600) {
                  return `${Math.floor(seconds / 60)}m`;
                } else {
                  return `${Math.floor(seconds / 3600)}h`;
                }
              }
              return Math.round(m.value).toString();
            }),
          };
          
        default:
          return {
            labels: dailyData.map(d => d.displayDate),
            datasets: [{
              data: dailyData.map(getDataValue),
              color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
              strokeWidth: 3,
            }],
            dataPointLabels: dailyData.map(d => {
              if (flow.trackingType === 'Time-based') {
                const seconds = getDataValue(d);
                if (seconds < 60) {
                  return `${seconds}s`;
                } else if (seconds < 3600) {
                  return `${Math.floor(seconds / 60)}m`;
                } else {
                  return `${Math.floor(seconds / 3600)}h`;
                }
              }
              return getDataValue(d).toString();
            }),
          };
      }
    };

    const dailyData = generateDailyData();

    switch (flow.trackingType) {
      case 'Binary':
        return {
          primaryMetric: '',
          primaryLabel: '',
          timeframeLabel: dateRange.label,
          secondaryMetrics: [
          ],
          chartData: generateChartData(),
          chartTitle: selectedTimeframe === 'weekly' ? 'Daily Completion' : 
                     selectedTimeframe === 'monthly' ? 'Weekly Completion' : 
                     'Monthly Completion',
          chartSubtitle: `Your completion rate over ${dateRange.label.toLowerCase()}`,
          heatMapData: generateHeatMapData(),
        };
      
      case 'Quantitative':
        return {
          primaryMetric: '',
          primaryLabel: '',
          timeframeLabel: dateRange.label,
          secondaryMetrics: [
          ],
          chartData: generateChartData(),
          chartTitle: selectedTimeframe === 'weekly' ? 'Daily Count' : 
                     selectedTimeframe === 'monthly' ? 'Weekly Count' : 
                     'Monthly Count',
          chartSubtitle: `Your daily count progress over ${dateRange.label.toLowerCase()}`,
          heatMapData: generateHeatMapData(),
          // Quantitative specific stats
          quantitativeStats: [
            { title: 'Total Count', value: `${scoreboard.quantitativeStats.totalCount.toLocaleString()}`, icon: 'bar-chart', color: themeColors.success },
            { title: 'Average Count', value: `${scoreboard.quantitativeStats.averageCount.toFixed(1)}`, icon: 'trending-up', color: themeColors.primaryOrange },
            { title: 'Unit Text', value: scoreboard.quantitativeStats.unitText || 'units', icon: 'text', color: themeColors.primaryOrange },
            { title: 'Goal Achievement', value: flow.goal ? `${((scoreboard.quantitativeStats.averageCount / flow.goal) * 100).toFixed(1)}%` : 'No goal set', icon: 'flag', color: themeColors.warning },
          ],
        };
      
      case 'Time-based':
        return {
          primaryMetric: '',
          primaryLabel: '',
          timeframeLabel: dateRange.label,
          secondaryMetrics: [
          ],
          chartData: generateChartData(),
          chartTitle: selectedTimeframe === 'weekly' ? 'Daily Duration' : 
                     selectedTimeframe === 'monthly' ? 'Weekly Duration' : 
                     'Monthly Duration',
          chartSubtitle: `Your daily time investment over ${dateRange.label.toLowerCase()}`,
          heatMapData: generateHeatMapData(),
          // Time-based specific stats
          timeBasedStats: (() => {
            const timeframeTotalDuration = dailyData.reduce((sum, day) => sum + (day.value || 0), 0);
            const timeframeAverageDuration = dailyData.length > 0 ? timeframeTotalDuration / dailyData.length : 0;
            const goalSeconds = ((flow.hours || 0) * 3600) + ((flow.minutes || 0) * 60) + (flow.seconds || 0);
            
            return [
              { title: 'Total Duration', value: `${Math.floor(timeframeTotalDuration / 3600)}h ${Math.floor((timeframeTotalDuration % 3600) / 60)}m`, icon: 'time', color: themeColors.success },
              { title: 'Average Duration', value: `${Math.floor(timeframeAverageDuration / 3600)}h ${Math.floor((timeframeAverageDuration % 3600) / 60)}m`, icon: 'hourglass', color: themeColors.primaryOrange },
              { title: 'Total Pauses', value: `${scoreboard.timeBasedStats.totalPauses}`, icon: 'pause', color: themeColors.primaryOrange },
              { title: 'Goal Achievement', value: goalSeconds > 0 ? `${((timeframeAverageDuration / goalSeconds) * 100).toFixed(1)}%` : 'No goal set', icon: 'flag', color: themeColors.warning },
            ];
          })(),
        };
      
      default:
        return null;
    }
  };

  const analytics = useMemo(() => getFlowTypeAnalytics(), [flowId, selectedTimeframe, flows, dateOffset]);

  // Handle donut chart tap
  const handleDonutChartTap = (chartType) => {
    setSelectedChart(chartType);
    setShowCalculationModal(true);
  };

  // Get calculation breakdown
  const getCalculationBreakdown = () => {
    if (!scoreboardData) return null;

    const breakdown = {
      completed: scoreboardData.completed || 0,
      partial: scoreboardData.partial || 0,
      failed: scoreboardData.failed || 0,
      inactive: scoreboardData.inactive || 0,
      streakBonus: scoreboardData.streakBonus || 0,
      emotionBonus: scoreboardData.emotionBonus || 0,
      notesCount: scoreboardData.notesCount || 0,
    };

    const calculations = {
      completionPoints: breakdown.completed * 10,
      partialPoints: breakdown.partial * 5,
      failedPoints: breakdown.failed * -8,
      inactivePoints: breakdown.inactive * -4,
      notesPoints: breakdown.notesCount * 1,
    };

    const total = calculations.completionPoints + calculations.partialPoints + 
                  calculations.failedPoints + calculations.inactivePoints + 
                  breakdown.streakBonus + breakdown.emotionBonus + calculations.notesPoints;

    return { breakdown, calculations, total };
  };

  // Get scoreboard data for donut charts
  const scoreboardData = useMemo(() => {
    if (!flowId) return null;
    
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
    return getScoreboard(flowId, { 
      timeframe: selectedTimeframe,
      startDate: dateRange.start,
      endDate: dateRange.end
    });
  }, [flowId, selectedTimeframe, getScoreboard]);

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
    <SafeAreaWrapper style={{ backgroundColor: themeColors.background }} excludeBottom={true}>
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
              style={styles.calendarButton}
              onPress={() => navigation.navigate('FlowDetails', { flowId: flow.id })}
              accessibilityLabel="Open flow calendar"
              accessibilityHint="View and manage flow entries in calendar view"
            >
              <Ionicons name="calendar-outline" size={24} color={themeColors.primaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(true)}
              accessibilityLabel="Flow options"
              accessibilityHint="Show edit and delete options"
            >
              <Ionicons name="ellipsis-vertical" size={24} color={themeColors.primaryText} />
            </TouchableOpacity>
          </View>
        </View>


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

        {/* Donut Charts Section */}
        {analytics && scoreboardData && (
          <View style={styles.donutChartsContainer}>
            <View style={styles.donutChartsGrid}>
            {/* Success Rate Donut Chart */}
            <TouchableOpacity style={styles.donutChartItem} onPress={() => handleDonutChartTap('successRate')}>
              <View style={styles.donutChartContainer}>
                <CircularProgress
                  size={60}
                  strokeWidth={5}
                  progress={scoreboardData.completionRate || 0}
                  color="hsl(120, 60%, 65%)"
                  backgroundColor="hsl(0, 0%, 90%)"
                />
                <View style={styles.donutChartOverlay}>
                  <Text style={[styles.donutChartValue, { color: 'hsl(120, 60%, 65%)' }]}>
                    {Math.round(scoreboardData.completionRate || 0)}%
                  </Text>
                </View>
              </View>
              <Text style={[styles.donutChartTitle, { color: themeColors.primaryText }]}>Success Rate</Text>
            </TouchableOpacity>

            {/* Completed Days Donut Chart */}
            <TouchableOpacity style={styles.donutChartItem} onPress={() => handleDonutChartTap('completedDays')}>
              <View style={styles.donutChartContainer}>
                <CircularProgress
                  size={60}
                  strokeWidth={5}
                  progress={((scoreboardData.completed || 0) / (scoreboardData.scheduledDays || 30)) * 100}
                  color="hsl(200, 70%, 65%)"
                  backgroundColor="hsl(0, 0%, 90%)"
                />
                <View style={styles.donutChartOverlay}>
                  <Text style={[styles.donutChartValue, { color: 'hsl(200, 70%, 65%)' }]}>
                    {scoreboardData.completed || 0}
                  </Text>
                </View>
              </View>
              <Text style={[styles.donutChartTitle, { color: themeColors.primaryText }]}>Completed Days</Text>
            </TouchableOpacity>

            {/* Final Score Donut Chart */}
            <TouchableOpacity style={styles.donutChartItem} onPress={() => handleDonutChartTap('finalScore')}>
              <View style={styles.donutChartContainer}>
                <CircularProgress
                  size={60}
                  strokeWidth={5}
                  progress={scoreboardData.finalScore || 0}
                  color="hsl(30, 80%, 65%)"
                  backgroundColor="hsl(0, 0%, 90%)"
                />
                <View style={styles.donutChartOverlay}>
                  <Text style={[styles.donutChartValue, { color: 'hsl(30, 80%, 65%)' }]}>
                    {scoreboardData.finalScore || 0}
                  </Text>
                </View>
              </View>
              <Text style={[styles.donutChartTitle, { color: themeColors.primaryText }]}>Final Score</Text>
            </TouchableOpacity>

            {/* Current Streak Donut Chart */}
            <TouchableOpacity style={styles.donutChartItem} onPress={() => handleDonutChartTap('streak')}>
              <View style={styles.donutChartContainer}>
                <CircularProgress
                  size={60}
                  strokeWidth={5}
                  progress={Math.min(100, (scoreboardData.streak || 0) * 10)}
                  color="hsl(0, 80%, 65%)"
                  backgroundColor="hsl(0, 0%, 90%)"
                />
                <View style={styles.donutChartOverlay}>
                  <Text style={[styles.donutChartValue, { color: 'hsl(0, 80%, 65%)' }]}>
                    {scoreboardData.streak || 0}
                  </Text>
                </View>
              </View>
              <Text style={[styles.donutChartTitle, { color: themeColors.primaryText }]}>Current Streak</Text>
            </TouchableOpacity>

            {/* Total Count Donut Chart - Only for Quantitative flows */}
            {flow.trackingType === 'Quantitative' && (
              <View style={styles.donutChartItem}>
                <View style={styles.donutChartContainer}>
                  <CircularProgress
                    size={60}
                    strokeWidth={5}
                    progress={Math.min(100, ((scoreboardData.quantitativeStats?.totalCount || 0) / (flow.goal || 100)) * 100)}
                    color="hsl(280, 70%, 65%)"
                    backgroundColor="hsl(0, 0%, 90%)"
                  />
                  <View style={styles.donutChartOverlay}>
                    <Text style={[styles.donutChartValue, { color: 'hsl(280, 70%, 65%)' }]}>
                      {scoreboardData.quantitativeStats?.totalCount || 0}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.donutChartTitle, { color: themeColors.primaryText }]}>Total Count</Text>
              </View>
            )}

            {/* Total Time Donut Chart - Only for Time-based flows */}
            {flow.trackingType === 'Time-based' && (
              <View style={styles.donutChartItem}>
                <View style={styles.donutChartContainer}>
                  <CircularProgress
                    size={60}
                    strokeWidth={5}
                    progress={Math.min(100, ((scoreboardData.timeBasedStats?.totalDuration || 0) / ((flow.hours || 0) * 3600 + (flow.minutes || 0) * 60 + (flow.seconds || 0) || 3600)) * 100)}
                    color="hsl(60, 80%, 65%)"
                    backgroundColor="hsl(0, 0%, 90%)"
                  />
                  <View style={styles.donutChartOverlay}>
                    <Text style={[styles.donutChartValue, { color: 'hsl(60, 80%, 65%)', fontSize: 10 }]}>
                      {(() => {
                        const totalSeconds = scoreboardData.timeBasedStats?.totalDuration || 0;
                        if (totalSeconds < 60) {
                          return `${totalSeconds}s`;
                        } else if (totalSeconds < 3600) {
                          return `${Math.floor(totalSeconds / 60)}m`;
                        } else {
                          return `<1h`;
                        }
                      })()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.donutChartTitle, { color: themeColors.primaryText }]}>Total Time</Text>
              </View>
            )}
            </View>
          </View>
        )}

        {/* Timeframe Selector - positioned directly above chart */}
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

        {/* Chart */}
        <View style={styles.chartHeaderContainer}>
          <TouchableOpacity 
            style={styles.navigationArrowLeft}
            onPress={() => setDateOffset(prev => prev - 1)}
            disabled={dateOffset <= -10}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={dateOffset <= -10 ? themeColors.disabled : themeColors.primaryOrange} 
            />
          </TouchableOpacity>
          
          <View style={styles.chartTitleContainer}>
            <Text style={[styles.chartTitle, { color: themeColors.primaryText }]}>
              {analytics.chartTitle}
            </Text>
            <Text style={[styles.chartSubtitle, { color: themeColors.secondaryText }]}>
              {analytics.chartSubtitle}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.navigationArrowRight}
            onPress={() => setDateOffset(prev => prev + 1)}
            disabled={dateOffset >= 10}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={dateOffset >= 10 ? themeColors.disabled : themeColors.primaryOrange} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartContainer}>
          {/* Debug: Log chart data */}
          {console.log('Chart Data Labels:', analytics.chartData.labels)}
          {console.log('Chart Data Values:', analytics.chartData.datasets[0].data)}
          <BarChart
            data={analytics.chartData}
            width={screenWidth + 20}
            height={220}
            chartConfig={chartConfig}
            style={[styles.chart, { marginLeft: -50 }]}
            withVerticalLabels={true}
            withHorizontalLabels={false}
            fromZero={true}
            showValuesOnTopOfBars={true}
            withInnerLines={false}
            segments={4}
            barPercentage={0.6}
            yLabelsOffset={-10}
            xLabelsOffset={-10}
          />
        </View>

        {/* Heat Map */}
        <View style={styles.sectionContainer}>
          <HeatMap
            data={analytics.heatMapData}
            title="Activity Heat Map"
            subtitle={`Your ${flow.trackingType.toLowerCase()} activity over the last 3 months`}
          />
          <TouchableOpacity
            style={styles.viewCalendarButton}
            onPress={() => navigation.navigate('FlowDetails', { flowId: flow.id })}
          >
            <Ionicons name="calendar-outline" size={16} color={themeColors.primaryOrange} />
            <Text style={[styles.viewCalendarText, { color: themeColors.primaryOrange }]}>View Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Type-Specific Stats */}
        {flow.trackingType === 'Quantitative' && analytics.quantitativeStats && (
          <Card variant="default" padding="lg" margin="xs">
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
          <Card variant="default" padding="lg" margin="xs">
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
        <Card variant="default" padding="lg" margin="xs">
          <View style={styles.sectionHeader}>
            <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Notes & Reflections</Text>
            <TouchableOpacity
              style={styles.viewNotesButton}
              onPress={() => navigation.navigate('FlowDetails', { flowId: flow.id })}
            >
              <Ionicons name="document-text-outline" size={16} color={themeColors.primaryOrange} />
              <Text style={[styles.viewNotesText, { color: themeColors.primaryOrange }]}>View Notes</Text>
            </TouchableOpacity>
          </View>
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
        <Card variant="default" padding="lg" margin="xs">
          <View style={styles.sectionHeader}>
            <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Emotional Tracking</Text>
            <TouchableOpacity
              style={styles.viewEmotionsButton}
              onPress={() => navigation.navigate('FlowDetails', { flowId: flow.id })}
            >
              <Ionicons name="heart-outline" size={16} color={themeColors.primaryOrange} />
              <Text style={[styles.viewEmotionsText, { color: themeColors.primaryOrange }]}>View</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emotionalTrackingSingleLine}>
            {(() => {
              const emotionalData = getEmotionalActivity(flowId);
              console.log('FlowStatsDetail: Emotional data for flowId', flowId, ':', emotionalData);
              console.log('FlowStatsDetail: Flow object:', { id: flow?.id, title: flow?.title, statusKeys: Object.keys(flow?.status || {}) });
              
              // Debug: Check specific status entries
              if (flow?.status) {
                Object.entries(flow.status).forEach(([date, status]) => {
                  if (status.emotion) {
                    console.log(`FlowStatsDetail: Found emotion on ${date}:`, status.emotion);
                  }
                });
              }
              
              const emotions = ['Sad', 'Slightly worried', 'Neutral', 'Slightly smiling', 'Big smile'];
              const emotionIcons = {
                'Sad': '😞',
                'Slightly worried': '😟', 
                'Neutral': '😐',
                'Slightly smiling': '🙂',
                'Big smile': '😃'
              };
              
              return emotions.map((emotion) => {
                const count = emotionalData.byEmotion?.[emotion] || 0;
                const percentage = emotionalData.totalEmotions > 0 ? (count / emotionalData.totalEmotions * 100).toFixed(1) : 0;
                
                return (
                  <View key={emotion} style={styles.emotionItemSingleLine}>
                    <Text style={[styles.emotionEmoji, { fontSize: 16 }]}>{emotionIcons[emotion]}</Text>
                    <Text style={[styles.emotionLabelSingleLine, { color: themeColors.primaryText }]}>{emotion}</Text>
                    {/* Only show percentage with color */}
                    <Text style={[styles.emotionPercentageSingleLine, { color: themeColors.primaryOrange }]}>{percentage}%</Text>
                  </View>
                );
              });
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

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Calculation Modal */}
      <Modal
        visible={showCalculationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalculationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.primaryText }]}>
                {selectedChart === 'finalScore' ? 'Final Score Calculation' :
                 selectedChart === 'successRate' ? 'Success Rate Calculation' :
                 selectedChart === 'completedDays' ? 'Completed Days Calculation' :
                 selectedChart === 'streak' ? 'Streak Calculation' : 'Calculation'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalculationModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.primaryText} />
              </TouchableOpacity>
            </View>

            {selectedChart === 'finalScore' && (() => {
              const calc = getCalculationBreakdown();
              if (!calc) return null;
              
              return (
                <View style={styles.calculationContent}>
                  <Text style={[styles.calculationTitle, { color: themeColors.primaryText }]}>
                    How your {calc.total} points were calculated:
                  </Text>
                  
                  <View style={styles.calculationRow}>
                    <Text style={[styles.calculationLabel, { color: themeColors.primaryText }]}>
                      ✅ Completed Days ({calc.breakdown.completed})
                    </Text>
                    <Text style={[styles.calculationValue, { color: themeColors.success }]}>
                      +{calc.calculations.completionPoints}
                    </Text>
                  </View>
                  
                  {calc.breakdown.partial > 0 && (
                    <View style={styles.calculationRow}>
                      <Text style={[styles.calculationLabel, { color: themeColors.primaryText }]}>
                        ~ Partial Days ({calc.breakdown.partial})
                      </Text>
                      <Text style={[styles.calculationValue, { color: themeColors.warning }]}>
                        +{calc.calculations.partialPoints}
                      </Text>
                    </View>
                  )}
                  
                  {calc.breakdown.failed > 0 && (
                    <View style={styles.calculationRow}>
                      <Text style={[styles.calculationLabel, { color: themeColors.primaryText }]}>
                        ❌ Failed Days ({calc.breakdown.failed})
                      </Text>
                      <Text style={[styles.calculationValue, { color: themeColors.error }]}>
                        {calc.calculations.failedPoints}
                      </Text>
                    </View>
                  )}
                  
                  {calc.breakdown.inactive > 0 && (
                    <View style={styles.calculationRow}>
                      <Text style={[styles.calculationLabel, { color: themeColors.primaryText }]}>
                        ⏸️ Inactive Days ({calc.breakdown.inactive})
                      </Text>
                      <Text style={[styles.calculationValue, { color: themeColors.error }]}>
                        {calc.calculations.inactivePoints}
                      </Text>
                    </View>
                  )}
                  
                  {calc.breakdown.streakBonus > 0 && (
                    <View style={styles.calculationRow}>
                      <Text style={[styles.calculationLabel, { color: themeColors.primaryText }]}>
                        🔥 Streak Bonus
                      </Text>
                      <Text style={[styles.calculationValue, { color: themeColors.warning }]}>
                        +{calc.breakdown.streakBonus}
                      </Text>
                    </View>
                  )}
                  
                  {calc.breakdown.emotionBonus > 0 && (
                    <View style={styles.calculationRow}>
                      <Text style={[styles.calculationLabel, { color: themeColors.primaryText }]}>
                        😊 Emotion Bonus
                      </Text>
                      <Text style={[styles.calculationValue, { color: themeColors.info }]}>
                        +{calc.breakdown.emotionBonus}
                      </Text>
                    </View>
                  )}
                  
                  {calc.calculations.notesPoints > 0 && (
                    <View style={styles.calculationRow}>
                      <Text style={[styles.calculationLabel, { color: themeColors.primaryText }]}>
                        📝 Notes Bonus ({calc.breakdown.notesCount})
                      </Text>
                      <Text style={[styles.calculationValue, { color: themeColors.info }]}>
                        +{calc.calculations.notesPoints}
                      </Text>
                    </View>
                  )}
                  
                  <View style={[styles.calculationRow, styles.totalRow]}>
                    <Text style={[styles.calculationLabel, styles.totalLabel, { color: themeColors.primaryText }]}>
                      🎯 Total Score
                    </Text>
                    <Text style={[styles.calculationValue, styles.totalValue, { color: themeColors.primaryOrange }]}>
                      {calc.total}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {selectedChart === 'successRate' && (
              <View style={styles.calculationContent}>
                <Text style={[styles.calculationTitle, { color: themeColors.primaryText }]}>
                  Success Rate = (Completed + Partial) ÷ Total Scheduled Days × 100
                </Text>
                <Text style={[styles.calculationText, { color: themeColors.primaryText }]}>
                  = ({scoreboardData.completed || 0} + {scoreboardData.partial || 0}) ÷ {scoreboardData.completed + scoreboardData.partial + scoreboardData.failed + scoreboardData.skipped + scoreboardData.inactive || 1} × 100
                </Text>
                <Text style={[styles.calculationText, { color: themeColors.primaryText }]}>
                  = {scoreboardData.completionRate?.toFixed(1) || 0}%
                </Text>
              </View>
            )}

            {selectedChart === 'completedDays' && (
              <View style={styles.calculationContent}>
                <Text style={[styles.calculationTitle, { color: themeColors.primaryText }]}>
                  Completed Days: {scoreboardData.completed || 0}
                </Text>
                <Text style={[styles.calculationText, { color: themeColors.primaryText }]}>
                  Days where you marked the flow as completed
                </Text>
              </View>
            )}

            {selectedChart === 'streak' && (
              <View style={styles.calculationContent}>
                <Text style={[styles.calculationTitle, { color: themeColors.primaryText }]}>
                  Current Streak: {scoreboardData.streak || 0} days
                </Text>
                <Text style={[styles.calculationText, { color: themeColors.primaryText }]}>
                  Consecutive completed days from today backwards
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: themeColors.cardBackground }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('EditFlow', { flowId: flow.id });
              }}
            >
              <Ionicons name="create-outline" size={20} color={themeColors.primaryText} />
              <Text style={[styles.menuItemText, { color: themeColors.primaryText }]}>Edit</Text>
            </TouchableOpacity>
            
            <View style={[styles.menuDivider, { backgroundColor: themeColors.border }]} />
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
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
            >
              <Ionicons name="trash-outline" size={20} color={themeColors.error} />
              <Text style={[styles.menuItemText, { color: themeColors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: layout.spacing.sm,
    paddingBottom: layout.spacing.lg,
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
  calendarButton: {
    padding: layout.spacing.sm,
    marginRight: layout.spacing.sm,
  },
  menuButton: {
    padding: layout.spacing.sm,
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
    marginBottom: layout.spacing.xs,
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
  chartSubtitle: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginBottom: layout.spacing.sm,
    opacity: 0.8,
    fontSize: 11,
  },
  chartHeaderContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.spacing.sm,
    minHeight: 60,
  },
  chartTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationArrowLeft: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: layout.spacing.sm,
    borderRadius: layout.radii.medium,
  },
  navigationArrowRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: layout.spacing.sm,
    borderRadius: layout.radii.medium,
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.radii.large,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: layout.spacing.md,
    paddingRight: 0,
  },
  insightsTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
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
    marginBottom: layout.spacing.xs,
  },
  heatMapTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.xs,
  },
  heatMapContainer: {
    alignItems: 'center',
    marginTop: layout.spacing.xs,
    paddingHorizontal: 0,
    paddingVertical: layout.spacing.xs,
  },
  monthLabels: {
    flexDirection: 'row',
    marginBottom: layout.spacing.xs,
    paddingLeft: 0,
  },
  monthLabel: {
    ...typography.styles.caption,
    fontSize: 8,
    width: 24,
    textAlign: 'center',
    marginHorizontal: 1,
    fontWeight: '600',
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: layout.spacing.xs,
    paddingLeft: 0,
  },
  dayLabel: {
    ...typography.styles.caption,
    fontSize: 8,
    width: 24,
    textAlign: 'center',
    marginHorizontal: 1,
    fontWeight: '600',
  },
  heatMapGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heatMapWeek: {
    flexDirection: 'column',
    marginRight: 1,
  },
  heatMapDayContainer: {
    marginBottom: 1,
  },
  heatMapDay: {
    width: 24,
    height: 24,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heatMapDayText: {
    ...typography.styles.caption,
    fontSize: 8,
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
    borderRadius: layout.radii.base,
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
    alignItems: 'center',
    marginTop: layout.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: layout.spacing.sm,
    borderRadius: layout.radii.base,
  },
  legendLabel: {
    ...typography.styles.caption,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
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
    marginTop: layout.spacing.xs,
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
    borderRadius: layout.radii.base,
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
    borderRadius: layout.radii.base,
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
  // Donut Charts Styles
  donutChartsContainer: {
    marginVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.md,
  },
  sectionTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
    textAlign: 'center',
  },
  donutChartsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  donutChartItem: {
    alignItems: 'center',
    marginVertical: layout.spacing.sm,
    minWidth: 80,
  },
  donutChartTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
    textAlign: 'center',
  },
  donutChartValue: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginTop: layout.spacing.xs,
    textAlign: 'center',
  },
  donutChartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutChartBackground: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  donutChartProgress: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  donutInnerCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutChartOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
  },
  modalContent: {
    borderRadius: layout.radii.lg,
    padding: layout.spacing.lg,
    maxWidth: '90%',
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.lg,
  },
  modalTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    flex: 1,
  },
  calculationContent: {
    gap: layout.spacing.md,
  },
  calculationTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
  },
  calculationText: {
    ...typography.styles.body,
    marginBottom: layout.spacing.xs,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.spacing.xs,
  },
  calculationLabel: {
    ...typography.styles.body,
    flex: 1,
  },
  calculationValue: {
    ...typography.styles.body,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  // Menu styles
  menuContainer: {
    borderRadius: layout.radii.md,
    padding: layout.spacing.sm,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.sm,
  },
  menuItemText: {
    ...typography.styles.body,
    marginLeft: layout.spacing.sm,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginVertical: layout.spacing.xs,
  },
  // Section navigation styles
  sectionContainer: {
    position: 'relative',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  viewCalendarButton: {
    position: 'absolute',
    top: layout.spacing.md,
    right: layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.radii.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  viewCalendarText: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginLeft: layout.spacing.xs,
    fontSize: 12,
  },
  viewNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,149,0,0.1)',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.radii.sm,
  },
  viewNotesText: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginLeft: layout.spacing.xs,
    fontSize: 12,
  },
  viewEmotionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,149,0,0.1)',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.radii.sm,
  },
  viewEmotionsText: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginLeft: layout.spacing.xs,
    fontSize: 12,
  },
  bottomSpacing: {
    height: layout.spacing.xl * 2,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: layout.spacing.sm,
    paddingTop: layout.spacing.sm,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalValue: {
    fontWeight: '700',
    fontSize: 18,
  },
});

export default FlowStatsDetail;
