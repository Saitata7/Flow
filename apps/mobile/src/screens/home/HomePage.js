import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../../context/ThemeContext';
import { FlowsContext } from '../../context/FlowContext';
import moment from 'moment';
import TodaysFlows from '../../components/flow/todayResponse/TodaysFlows';

// Import centralized styles and components
import {
  colors,
  typography,
  layout,
  commonStyles,
  useAppTheme,
} from '../../../styles';
import { Button, Card, Icon } from '../../components';

const SIDE_PADDING = 16;

export default function HomePage({ navigation }) {
  const [dayOffset, setDayOffset] = useState(0); // Controls which set of 3 days to show

  const { flows } = useContext(FlowsContext) || { flows: [] };
  const { theme, textSize, highContrast, cheatMode } = useContext(ThemeContext) || {
    theme: 'light',
    textSize: 'medium',
    highContrast: false,
    cheatMode: false,
  };

  // Use centralized theme hook
  const { colors: themeColors, isDark } = useAppTheme();

  const now = moment();
  const today = moment().format('ddd'); // e.g., 'Mon'
  const todayDate = moment().format('D'); // e.g., '21'

  const getNextNDays = () => {
    const days = [];
    const startOffset = dayOffset * 3 - 1; // Start from previous day of the current set
    for (let i = 0; i < 3; i++) {
      const date = moment().add(startOffset + i, 'days');
      days.push({
        day: date.format('ddd'),
        date: date.format('D'),
        fullDate: date.format('YYYY-MM-DD'),
        isToday: startOffset + i === 0,
      });
    }
    return days;
  };

  const nextDays = getNextNDays();

  const canSlidePrevious = () => {
    return dayOffset > -10; // Allow up to 30 days previous (10 sets of 3)
  };

  const canSlideNext = () => {
    return dayOffset < 10; // Allow up to 30 days future (10 sets of 3)
  };

  const slideToPrevious = () => {
    if (canSlidePrevious()) {
      setDayOffset(dayOffset - 1);
    }
  };

  const slideToNext = () => {
    if (canSlideNext()) {
      setDayOffset(dayOffset + 1);
    }
  };

  const visibleFlows = flows.filter((flow) => {
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

  const isFlowScheduledForDay = (flow, date) => {
    const dayOfWeek = moment(date).format('ddd');
    const dayOfMonth = moment(date).format('D');
    const frequency = flow.frequency || (flow.repeatType === 'day' ? 'Daily' : flow.repeatType === 'month' ? 'Monthly' : 'Daily');
    if (frequency === 'Daily') {
      return flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(dayOfWeek));
    }
    return flow.selectedMonthDays && flow.selectedMonthDays.includes(dayOfMonth);
  };

  const getStatusIcon = (flow, date) => {
    if (!isFlowScheduledForDay(flow, date)) return null; // No icon for unscheduled days
    const status = flow.status?.[date]?.symbol;
    if (status === '✅') return '✓';
    if (status === '❌') return '×';
    return null; // Inactive (white circle, no icon)
  };

  const getStatusStyle = (flow, date) => {
    if (!isFlowScheduledForDay(flow, date)) {
      return {
        backgroundColor: 'transparent', // No color for unscheduled days
        iconColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
      };
    }
    const status = flow.status?.[date]?.symbol;
    if (status === '✅') {
      return {
        backgroundColor: themeColors.flowCompleted, // Use theme colors
        iconColor: themeColors.cardBackground, // White tick
        borderColor: 'transparent',
        borderWidth: 0,
      };
    }
    if (status === '❌') {
      return {
        backgroundColor: themeColors.flowMissed, // Use theme colors
        iconColor: themeColors.cardBackground, // White cross
        borderColor: 'transparent',
        borderWidth: 0,
      };
    }
    return {
      backgroundColor: themeColors.cardBackground, // White circle for inactive
      iconColor: themeColors.tertiaryText, // Gray (not used since no icon)
      borderColor: themeColors.tertiaryText, // Dark border for inactive
      borderWidth: 1,
    };
  };

  console.log('All flows:', flows);
  console.log('Todays flows:', visibleFlows);

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[commonStyles.container, { backgroundColor: themeColors.background }]}>
          <View style={[styles.headerContainer, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[typography.styles.title1, { color: themeColors.primaryText }]}>Home</Text>
            <Text style={[typography.styles.body, { color: themeColors.secondaryText, marginTop: layout.spacing.xs }]}>
              Track your daily flows and build better habits
            </Text>
          </View>
          <View style={[styles.cardsContainer, { backgroundColor: themeColors.cardBackground }]}>
            <View style={styles.habitCardContainer}>
              <View style={styles.habitCard}>
                <View style={styles.navigationPlaceholder} />
                <View style={styles.flowsMainContainer}>
                  {flows.length === 0 ? (
                    <Text style={[typography.styles.body, { color: themeColors.secondaryText, textAlign: 'center' }]}>No flows yet</Text>
                  ) : (
                    flows.map((flow) => (
                      <View key={flow.id} style={styles.flowRow}>
                        <TouchableOpacity
                          style={styles.flowItemLeft}
                          onPress={() => navigation.navigate('FlowDetails', { flowId: flow.id })}
                        >
                          <Text style={[typography.styles.body, { color: themeColors.primaryText }]}>{flow.title}</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
            <View style={[styles.statusCardContainer, { backgroundColor: themeColors.progressBackground }]}>
              <View style={styles.statusCard}>
                <View style={styles.navigationHeader}>
                  <View style={[styles.navigationContainer, { backgroundColor: themeColors.cardBackground }]}>
                    {canSlidePrevious() && (
                      <TouchableOpacity style={styles.swipeIndicatorLeft} onPress={slideToPrevious}>
                        <View style={[styles.swipeDot, { backgroundColor: themeColors.secondaryText }]} />
                        <View style={[styles.swipeDot, { backgroundColor: themeColors.secondaryText }]} />
                      </TouchableOpacity>
                    )}
                    <View style={styles.daysContainerSquircle}>
                      <View style={styles.daysContainer}>
                        {nextDays.map((day, index) => (
                          <View key={index} style={styles.dayColumn}>
                            <Text style={[
                              typography.styles.caption1,
                              { color: themeColors.secondaryText },
                              day.isToday && { color: themeColors.primaryOrange, fontWeight: typography.weights.bold }
                            ]}>
                              {day.day}
                            </Text>
                            <Text style={[
                              typography.styles.body,
                              { color: themeColors.primaryText, fontWeight: typography.weights.bold },
                              day.isToday && { color: themeColors.primaryOrange }
                            ]}>
                              {day.date}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {canSlideNext() && (
                      <TouchableOpacity style={styles.swipeIndicatorRight} onPress={slideToNext}>
                        <View style={[styles.swipeDot, { backgroundColor: themeColors.secondaryText }]} />
                        <View style={[styles.swipeDot, { backgroundColor: themeColors.secondaryText }]} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.statusGridContainer}>
                  {flows.length > 0 ? (
                    flows.map((flow, flowIndex) => (
                      <View key={flow.id} style={styles.statusRow}>
                        {nextDays.map((day, dayIndex) => {
                          const statusIcon = getStatusIcon(flow, day.fullDate);
                          const statusStyle = getStatusStyle(flow, day.fullDate);
                          return (
                            <View key={dayIndex} style={styles.statusCell}>
                              {statusStyle.backgroundColor !== 'transparent' ? (
                                <View style={[styles.statusCircle, {
                                  backgroundColor: statusStyle.backgroundColor,
                                  borderColor: statusStyle.borderColor,
                                  borderWidth: statusStyle.borderWidth,
                                }]}>
                                  {statusIcon && (
                                    <Text style={[styles.statusIcon, { color: statusStyle.iconColor }]}>
                                      {statusIcon}
                                    </Text>
                                  )}
                                </View>
                              ) : (
                                <View style={styles.emptyStatusCell} />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ))
                  ) : (
                    <View style={styles.noFlowsStatusContainer}>
                      <Text style={[typography.styles.caption1, { color: themeColors.tertiaryText, textAlign: 'center' }]}>No flows to track</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
          <View style={styles.quoteCardContainer}>
            <LinearGradient
              colors={[themeColors.primaryOrange, themeColors.primaryOrangeVariants.light]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quoteCard}
            >
              <Text style={[typography.styles.title3, { color: themeColors.cardBackground, marginBottom: layout.spacing.sm }]}>Quote of the day</Text>
              <Text style={[typography.styles.body, { color: themeColors.cardBackground, opacity: 0.95 }]}>
                It takes at least 21 days to make a flow, and one to break it.
              </Text>
            </LinearGradient>
          </View>
        </View>
        <View style={[styles.todayContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.todaySection}>
            <Text style={[typography.styles.title2, { color: themeColors.primaryText, marginBottom: layout.spacing.md }]}>Today Flows</Text>
            <TodaysFlows navigation={navigation} visibleFlows={visibleFlows} />
          </View>
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      <View style={styles.fixedButtonContainer}>
        <Button
          variant="fab"
          title="+ Add Flow"
          onPress={() => navigation.navigate('AddFlow')}
          style={styles.addButton}
        />
      </View>
    </SafeAreaView>
  );
}

// Refactored styles using centralized system
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: layout.spacing.xl,
    paddingBottom: layout.spacing.lg,
  },
  cardsContainer: {
    flexDirection: 'row',
    marginBottom: layout.spacing.lg,
    gap: layout.spacing.sm,
    alignItems: 'stretch',
    ...layout.shadows.elevatedShadow,
    borderRadius: layout.borderRadius.xl,
    padding: 3,
    minHeight: 200,
  },
  habitCardContainer: {
    flex: 1,
    minWidth: 0,
  },
  habitCard: {
    flex: 1,
    padding: layout.spacing.lg,
    justifyContent: 'space-between',
  },
  statusCardContainer: {
    flex: 1.2,
    borderTopRightRadius: layout.borderRadius.xl,
    borderBottomRightRadius: layout.borderRadius.xl,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    minWidth: 0,
  },
  statusCard: {
    flex: 1,
    padding: layout.spacing.lg,
  },
  navigationHeader: {
    marginBottom: layout.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
  },
  swipeIndicatorLeft: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 28,
    marginRight: layout.spacing.sm,
  },
  swipeIndicatorRight: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 28,
    marginLeft: layout.spacing.sm,
  },
  swipeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginVertical: 2,
  },
  daysContainerSquircle: {
    backgroundColor: 'transparent',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: layout.spacing.lg,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
  },
  dayColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
  },
  navigationPlaceholder: {
    height: 48,
    marginBottom: layout.spacing.md,
  },
  flowsMainContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowRow: {
    paddingVertical: layout.spacing.sm,
    marginBottom: layout.spacing.xs,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowItemLeft: {
    paddingRight: layout.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  statusGridContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.spacing.sm,
    marginBottom: layout.spacing.xs,
    minHeight: 52,
  },
  statusCell: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
    height: 28,
  },
  statusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...layout.shadows.buttonShadow,
  },
  emptyStatusCell: {
    width: 28,
    height: 28,
    backgroundColor: 'transparent',
  },
  statusIcon: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
  },
  noFlowsStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layout.spacing.lg,
  },
  quoteCardContainer: {
    marginBottom: layout.spacing.lg,
    ...layout.shadows.elevatedShadow,
    borderRadius: layout.borderRadius.xl,
  },
  quoteCard: {
    padding: layout.spacing.xl,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.light.cardBackground,
  },
  todayContainer: {
    flex: 1,
    marginTop: layout.spacing.lg,
    paddingHorizontal: layout.spacing.md,
  },
  todaySection: {
    marginBottom: layout.spacing.lg,
  },
  bottomSpacing: {
    height: 120,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 100, // Move above the bottom tab bar (80 + 20 padding)
    left: layout.spacing.md,
    right: layout.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Below tab bar but above content
  },
  addButton: {
    width: '100%',
    height: 56,
    borderRadius: layout.button.pillRadius,
  },
});