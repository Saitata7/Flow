import React, { useState, useMemo, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { useAppTheme } from '../../../styles';
import { colors, typography, layout, hslUtils, commonStyles } from '../../../styles';

const FlowGrid = ({ onFlowPress, cheatMode = false }) => {
  const { flows } = useContext(FlowsContext);
  const { colors: themeColors } = useAppTheme();
  const [dateOffset, setDateOffset] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Get active flows (daily flows) - same logic as HomePage
  const activeFlows = useMemo(() => {
    const today = moment().format('ddd'); // e.g., 'Mon'
    const todayDate = moment().format('D'); // e.g., '21'
    const now = moment();
    
    const filteredFlows = flows.filter((flow) => {
      // First filter out deleted and archived flows
      if (flow.deletedAt || flow.archived) {
        return false;
      }
      
      // Normalize frequency/repeatType
      const frequency = flow.frequency || (flow.repeatType === 'day' ? 'Daily' : flow.repeatType === 'month' ? 'Monthly' : 'Daily');
      const isTodayScheduled =
        frequency === 'Daily'
          ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(today))
          : flow.selectedMonthDays && flow.selectedMonthDays.includes(todayDate);

      if (!isTodayScheduled) return false;

      // Include flows regardless of time/reminderTime unless time-based filtering is explicitly required
      // Optionally, check startDate if present
      const startDate = flow.startDate ? moment(flow.startDate) : null;
      const isStarted = !startDate || now.isSameOrAfter(startDate, 'day');

      return isStarted;
    });
    
    console.log('FlowGrid: Active flows:', filteredFlows.map(f => ({ 
      id: f.id, 
      title: f.title, 
      frequency: f.frequency,
      repeatType: f.repeatType,
      everyDay: f.everyDay,
      daysOfWeek: f.daysOfWeek,
      selectedMonthDays: f.selectedMonthDays,
      startDate: f.startDate
    })));
    return filteredFlows;
  }, [flows]);

  // Generate date range centered on today + offset
  const dateRange = useMemo(() => {
    const today = moment().add(dateOffset, 'days');
    const dates = [];
    
    // Show 3 days: yesterday, today, tomorrow
    for (let i = -1; i <= 1; i++) {
      dates.push(today.clone().add(i, 'days'));
    }
    
    console.log('FlowGrid: Generated date range:', dates.map(d => d.format('ddd D')));
    return dates;
  }, [dateOffset]);

  // Get flow status for a specific date
  const getFlowStatus = (flow, date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const status = flow.status?.[dateStr];
    
    if (!status) {
      return 'none'; // Not scheduled
    }
    
    // Check if this is a future date (tomorrow or later)
    const today = moment().format('YYYY-MM-DD');
    const isFutureDate = dateStr > today;
    
    // For future dates, don't show any status unless explicitly set
    if (isFutureDate && !status.symbol) {
      return 'none'; // Future dates with no symbol should show as not scheduled
    }
    
    // Check the symbol field which is used in the existing system
    if (status.symbol === '+') {
      return 'done';
    } else if (status.symbol === '-') {
      return 'missed';
    } else if (status.symbol === '~' || status.symbol === '≈' || status.symbol === 'p' || status.symbol === '/') {
      return 'partial'; // Partial completion or incomplete
    } else if (status.symbol === 's' || status.symbol === 'skip') {
      return 'skip'; // Skipped
    } else {
      return 'available'; // Scheduled but not completed
    }
  };


  // Handle swipe gesture
  const onGestureEvent = (event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = 50;
      
      if (Math.abs(translationX) > threshold) {
        setAnimating(true);
        const direction = translationX > 0 ? -1 : 1;
        setDateOffset(prev => prev + direction);
        
        // Reset animation state after transition
        setTimeout(() => setAnimating(false), 300);
      }
    }
  };


  // Render status circle
  const renderStatusCircle = (flow, date, flowIndex, dateIndex) => {
    const status = getFlowStatus(flow, date);
    const isToday = date.isSame(moment(), 'day');

    const getCircleStyle = () => {
      const baseStyle = {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF', // White border on orange background
      };

      switch (status) {
        case 'done':
          return {
            ...baseStyle,
            backgroundColor: hslUtils.tint(120, 40.2, 50.2, 30), // Same light green as Today flows
            borderColor: '#FFFFFF',
          };
        case 'missed':
          return {
            ...baseStyle,
            backgroundColor: hslUtils.tint(3, 100, 69.0, 20), // Same light red as Today flows
            borderColor: '#FFFFFF',
          };
        case 'partial':
        case 'skip':
          return {
            ...baseStyle,
            backgroundColor: hslUtils.tint(39.2, 96.0, 48.4, 25), // Light orange from HSL warning color
            borderColor: '#FFFFFF',
          };
        case 'available':
          return {
            ...baseStyle,
            backgroundColor: '#FFFFFF', // White circle on orange background
            borderColor: '#FFB366',
          };
        case 'none':
        default:
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderColor: '#FFFFFF',
            borderWidth: 2,
          };
      }
    };

    const getIcon = () => {
      switch (status) {
        case 'done':
          return <View style={commonStyles.flowGridCompletedIcon} />;
        case 'missed':
          return <View style={commonStyles.flowGridMissedIcon} />;
        case 'partial':
        case 'skip':
          return <View style={commonStyles.flowGridPartialIcon} />;
        default:
          return null;
      }
    };

    return (
      <View style={styles.statusContainer}>
        <Animated.View
        style={[
          getCircleStyle(),
            animating && {
              opacity: 0.7,
              transform: [{ scale: 0.95 }],
            },
        ]}
      >
        {getIcon()}
        </Animated.View>
      </View>
    );
  };

  // Render date header
  const renderDateHeader = () => (
    <View style={styles.headerRow}>
      <View style={styles.leftPanelHeader}>
        <Text style={styles.headerText}>
          Flows
        </Text>
      </View>
      <View style={styles.rightPanelHeader}>
        {dateRange.map((date, index) => {
          const isToday = date.isSame(moment(), 'day');
          return (
            <View key={index} style={styles.dateColumn}>
          <View style={[
            styles.dateContainer,
                isToday && styles.todayDateContainer
          ]}>
            <Text style={[
              styles.dateDay,
                  isToday && styles.todayDateDay
            ]}>
                  {date.format('ddd')}
            </Text>
            <Text style={[
              styles.dateNumber,
                  isToday && styles.todayDateNumber
            ]}>
                  {date.format('D')}
            </Text>
          </View>
    </View>
  );
        })}
      </View>
          </View>
  );


  // Empty state
  if (activeFlows.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyCard, { backgroundColor: themeColors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>
              No Daily Flows
          </Text>
          <Text style={[styles.emptyMessage, { color: themeColors.secondaryText }]}>
              Create your first daily flow to start tracking your habits
          </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onGestureEvent}>
        <View style={styles.gridContainer}>
          <View style={styles.mainCard}>
            <View style={styles.cardContent}>
              <View style={styles.gridBody}>
                <View style={styles.leftPanelContainer}>
                  <View style={styles.leftPanelHeader}>
                    <Text style={styles.headerText}>
                      Flows
                    </Text>
                  </View>
                  {activeFlows.map((flow, flowIndex) => {
                    console.log(`FlowGrid: Rendering flow ${flowIndex}:`, flow.id, flow.title);
                    return (
                      <TouchableOpacity
                        key={`flow-title-${flow.id}-${flowIndex}`}
                        style={styles.flowTitleRow}
                        onPress={() => {
                          console.log('FlowGrid: Clicking flow:', {
                            id: flow.id,
                            title: flow.title,
                            trackingType: flow.trackingType,
                            frequency: flow.frequency,
                            fullFlow: flow
                          });
                          onFlowPress(flow);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text 
                          style={[
                            styles.flowTitle,
                            flow.title.length > 10 && styles.flowTitleSmall,
                            flow.title.length > 15 && styles.flowTitleExtraSmall
                          ]}
                          numberOfLines={2}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.7}
                        >
                          {flow.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.rightPanelContainer}>
                  <View style={styles.rightPanelHeader}>
                    {dateRange.map((date, index) => {
                      const isToday = date.isSame(moment(), 'day');
                      console.log(`FlowGrid: Rendering date header ${index}:`, date.format('ddd D'));
                      return (
                        <View key={index} style={styles.dateColumn}>
                          <View style={[
                            styles.dateContainer,
                            isToday && styles.todayDateContainer
                          ]}>
                            <Text style={[
                              styles.dateDay,
                              isToday && styles.todayDateDay
                            ]}>
                              {date.format('ddd')}
                            </Text>
                            <Text style={[
                              styles.dateNumber,
                              isToday && styles.todayDateNumber
                            ]}>
                              {date.format('D')}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  {activeFlows.map((flow, flowIndex) => {
                    console.log(`FlowGrid: Rendering status row ${flowIndex}:`, flow.id, flow.title);
                    return (
                      <View key={`flow-status-${flow.id}-${flowIndex}`} style={styles.statusRow}>
                        {dateRange.map((date, dateIndex) => {
                          console.log(`FlowGrid: Rendering status circle ${dateIndex} for flow ${flowIndex}:`, date.format('ddd D'));
                          return (
                            <View key={`status-${flowIndex}-${dateIndex}`} style={styles.statusColumn}>
                              {renderStatusCircle(flow, date, flowIndex, dateIndex)}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
      </View>
    </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: layout.spacing.md, // Keep horizontal padding
  },
  gridContainer: {
    width: '100%',
  },
  mainCard: {
    backgroundColor: '#FFFFFF', // White background card panel
    borderRadius: 22, // Squircle formula
    ...layout.elevation.medium,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 0, // No padding since we're using margins for gaps
  },
  leftPanelHeader: {
    backgroundColor: '#FFFFFF', // White background for entire left panel
    paddingVertical: layout.spacing.xs, // Reduced gap
    paddingHorizontal: layout.spacing.sm, // Reduced gap
    borderRadius: 18, // Squircle formula for panels
    height: 50, // Fixed height to match right panel header exactly
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2, // 2px gap between header and content
  },
  rightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: layout.spacing.xs, // Reduced gap
    paddingHorizontal: layout.spacing.xs, // Further reduced gap to give more space for columns
    height: 50, // Fixed height to match left panel header exactly
    alignItems: 'center',
    marginBottom: 2, // 2px gap between header and content
  },
  gridBody: {
    flexDirection: 'row',
    alignItems: 'stretch', // Make both panels stretch to same height
  },
  leftPanelContainer: {
    flex: 1.5, // Balanced size for left panel - enough space for flow names
    backgroundColor: '#FFFFFF', // White background for left panel
    borderRadius: 18, // Squircle formula for panels
    marginRight: 1, // 1px gap from right panel
    paddingVertical: layout.spacing.xs, // Reduced gap
    paddingHorizontal: layout.spacing.sm, // Better padding for readability
    justifyContent: 'flex-start', // Align content to top
  },
  rightPanelContainer: {
    flex: 2.3, // Reduced size to create gap from parent panel edges
    backgroundColor: '#FFB366', // Continuous orange background for entire right panel area
    borderTopRightRadius: 18, // Squircle formula for top-right corner
    borderBottomRightRadius: 18, // Squircle formula for bottom-right corner
    borderTopLeftRadius: 0, // Straight left line - no rounding
    borderBottomLeftRadius: 0, // Straight left line - no rounding
    marginLeft: 1, // 1px gap from left panel
    marginRight: 2, // 2px gap from parent panel edge
    marginTop: 2, // 2px gap from parent panel top
    marginBottom: 2, // 2px gap from parent panel bottom
    paddingVertical: layout.spacing.xs, // Reduced gap
    paddingHorizontal: layout.spacing.xs, // Minimal padding
    justifyContent: 'flex-start', // Align content to top
  },
  flowTitleRow: {
    paddingVertical: layout.spacing.sm, // Better spacing for readability
    minHeight: 50, // Minimum height, can expand for longer names
    justifyContent: 'center',
    alignItems: 'flex-start', // Left alignment for flow names
    paddingLeft: layout.spacing.sm, // Better left padding for readability
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: layout.spacing.sm, // Better spacing for readability
    minHeight: 50, // Minimum height, can expand to match flow title row
    paddingHorizontal: layout.spacing.sm, // Better spacing for columns
  },
  headerText: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#000000', // Black text
  },
  dateColumn: {
    alignItems: 'center',
    flex: 1, // Each date column takes equal width
  },
  dateContainer: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xs,
    paddingHorizontal: layout.spacing.sm,
    borderRadius: 20, // Proper squircle formula for date containers
    minWidth: 50,
    justifyContent: 'center',
  },
  todayDateContainer: {
    backgroundColor: '#FFFFFF', // White background for today's date
  },
  dateDay: {
    fontSize: typography.sizes.caption2, // Smaller font for weekday
    fontWeight: typography.weights.medium,
    lineHeight: 14,
    color: '#000000', // Black text for all days
    marginBottom: 2, // Small gap between weekday and date
  },
  todayDateDay: {
    color: '#000000', // Black text for all days
  },
  dateNumber: {
    fontSize: typography.sizes.body, // Further reduced font size for date number
    fontWeight: typography.weights.bold,
    lineHeight: 14,
    color: '#000000', // Black text for all days
  },
  todayDateNumber: {
    color: '#FFB366', // Orange text for today's date number
  },
  flowsContainer: {
    paddingTop: 0, // Remove top padding to eliminate space after flow grid
    paddingBottom: 20, // Add 20px bottom space
  },
  flowTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium, // Medium-weight text
    lineHeight: 20,
    color: '#000000', // Black text for all days
  },
  flowTitleSmall: {
    fontSize: typography.sizes.caption1,
    lineHeight: 18,
  },
  flowTitleExtraSmall: {
    fontSize: typography.sizes.caption2,
    lineHeight: 16,
  },
  statusColumn: {
    alignItems: 'center',
    flex: 1, // Each status column takes equal width
  },
  statusIcon: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.bold,
    color: 'white',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF', // White background
    borderRadius: 22, // Squircle formula
    ...layout.elevation.medium,
    padding: layout.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    marginBottom: layout.spacing.sm,
    color: '#000000', // Black text for all days
  },
  emptyMessage: {
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 20,
    color: '#666666', // Gray text
  },
});

export default FlowGrid;