import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const HeatMapPanel = ({ flows, theme = 'light' }) => {
  const [selectedMonth, setSelectedMonth] = useState(moment().startOf('month'));
  const themeColors = theme === 'light' ? colors.light : colors.dark;

  const heatMapData = useMemo(() => {
    const startOfMonth = moment(selectedMonth).startOf('month');
    const endOfMonth = moment(selectedMonth).endOf('month');
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
        isFuture: currentDate.isAfter(moment(), 'day'),
      });
      
      maxCount = Math.max(maxCount, count);
    }

    return { contributionData, maxCount };
  }, [flows, selectedMonth]);

  const getIntensityColor = (count, maxCount) => {
    if (count === 0) return themeColors.progressBackground;
    
    const intensity = count / maxCount;
    if (intensity <= 0.25) return colors.light.success + '40';
    if (intensity <= 0.5) return colors.light.success + '60';
    if (intensity <= 0.75) return colors.light.success + '80';
    return colors.light.success;
  };

  const getIntensityLevel = (count) => {
    if (count === 0) return 'No activity';
    if (count === 1) return 'Low activity';
    if (count <= 3) return 'Medium activity';
    return 'High activity';
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(moment(selectedMonth).subtract(1, 'month').startOf('month'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(moment(selectedMonth).add(1, 'month').startOf('month'));
  };

  const renderHeatMap = () => {
    const { contributionData, maxCount } = heatMapData;
    const squareSize = (screenWidth - 80) / 7;
    
    // Group data by weeks
    const weeks = [];
    let currentWeek = [];
    
    contributionData.forEach((day, index) => {
      currentWeek.push(day);
      
      // Start new week on Sunday or end of month
      if (day.dayOfWeek === 0 || index === contributionData.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return (
      <View style={styles.heatMapContainer}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={[styles.dayLabel, { color: themeColors.secondaryText }]}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Heat map grid */}
        <View style={styles.heatMapGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => (
                <View
                  key={day.date}
                  style={[
                    styles.heatMapSquare,
                    {
                      width: squareSize,
                      height: squareSize,
                      backgroundColor: getIntensityColor(day.count, maxCount),
                      borderColor: day.isToday ? colors.light.primaryOrange : 'transparent',
                      borderWidth: day.isToday ? 2 : 0,
                    },
                  ]}
                >
                  <Text style={[
                    styles.dayNumber,
                    { 
                      color: day.isFuture ? themeColors.tertiaryText : themeColors.primaryText,
                      fontWeight: day.isToday ? '700' : '400',
                    }
                  ]}>
                    {day.day}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderLegend = () => {
    const { maxCount } = heatMapData;
    const levels = [
      { count: 0, label: 'No activity' },
      { count: 1, label: 'Low activity' },
      { count: Math.ceil(maxCount * 0.5), label: 'Medium activity' },
      { count: maxCount, label: 'High activity' },
    ];

    return (
      <View style={styles.legend}>
        <Text style={[styles.legendTitle, { color: themeColors.secondaryText }]}>
          Activity Levels
        </Text>
        <View style={styles.legendItems}>
          {levels.map((level, index) => (
            <View key={index} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendSquare,
                  { backgroundColor: getIntensityColor(level.count, maxCount) }
                ]} 
              />
              <Text style={[styles.legendText, { color: themeColors.secondaryText }]}>
                {level.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>
          Monthly Activity Heat Map
        </Text>
        <Text style={[styles.sectionSubtitle, { color: themeColors.secondaryText }]}>
          Track your daily flow completion
        </Text>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: themeColors.progressBackground }]}
          onPress={handlePreviousMonth}
        >
          <Ionicons name="chevron-back" size={20} color={themeColors.primaryText} />
        </TouchableOpacity>
        
        <Text style={[styles.monthTitle, { color: themeColors.primaryText }]}>
          {selectedMonth.format('MMMM YYYY')}
        </Text>
        
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: themeColors.progressBackground }]}
          onPress={handleNextMonth}
        >
          <Ionicons name="chevron-forward" size={20} color={themeColors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Heat Map */}
      {renderHeatMap()}

      {/* Legend */}
      {renderLegend()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: layout.spacing.md,
    borderRadius: layout.radii.large,
    marginVertical: layout.spacing.md,
    ...layout.elevation.low,
  },
  header: {
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  sectionTitle: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  sectionSubtitle: {
    ...typography.styles.caption,
    opacity: 0.8,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...typography.styles.title3,
    fontWeight: '600',
  },
  heatMapContainer: {
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: layout.spacing.sm,
  },
  dayLabel: {
    ...typography.styles.caption,
    fontWeight: '600',
    width: (screenWidth - 80) / 7,
    textAlign: 'center',
  },
  heatMapGrid: {
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  heatMapSquare: {
    borderRadius: 4,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    ...typography.styles.caption,
    fontSize: 10,
  },
  legend: {
    alignItems: 'center',
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout?.spacing?.sm || 8,
    marginBottom: layout.spacing.xs,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: layout.spacing.xs,
  },
  legendText: {
    ...typography.styles.caption,
    fontSize: 11,
  },
});

export default HeatMapPanel;
