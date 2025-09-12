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
  spacing,
  shadows,
  radius,
  typo,
  flexCenter,
  flexRow,
  flexRowBetween,
  container,
  screen,
  withOpacity,
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
    <SafeAreaView style={[screen, { backgroundColor: themeColors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[container, { backgroundColor: themeColors.background }]}>
          <View style={[styles.headerContainer, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[typo.h1, { color: themeColors.primaryText }]}>Home</Text>
          </View>
          <View style={[styles.cardsContainer, { backgroundColor: themeColors.cardBackground }]}>
            <View style={styles.habitCardContainer}>
              <View style={styles.habitCard}>
                <View style={styles.navigationPlaceholder} />
                <View style={styles.flowsMainContainer}>
                  {flows.length === 0 ? (
                    <Text style={[typo.body, { color: themeColors.secondaryText, textAlign: 'center' }]}>No flows yet</Text>
                  ) : (
                    flows.map((flow) => (
                      <View key={flow.id} style={styles.flowRow}>
                        <TouchableOpacity
                          style={styles.flowItemLeft}
                          onPress={() => navigation.navigate('FlowDetails', { flowId: flow.id })}
                        >
                          <Text style={[typo.body, { color: themeColors.primaryText }]}>{flow.title}</Text>
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
                  <View style={[styles.navigationContainer, { backgroundColor: withOpacity(themeColors.cardBackground, 0.8) }]}>
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
                              typo.caption,
                              { color: themeColors.secondaryText },
                              day.isToday && { color: themeColors.primaryOrange, fontWeight: typography.weights.bold }
                            ]}>
                              {day.day}
                            </Text>
                            <Text style={[
                              typo.body,
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
                      <Text style={[typo.caption, { color: themeColors.tertiaryText, textAlign: 'center' }]}>No flows to track</Text>
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
              <Text style={[typo.h3, { color: themeColors.cardBackground, marginBottom: spacing.sm }]}>Quote of the day</Text>
              <Text style={[typo.body, { color: themeColors.cardBackground, opacity: 0.95 }]}>
                It takes at least 21 days to make a flow, and one to break it.
              </Text>
            </LinearGradient>
          </View>
        </View>
        <View style={[styles.todayContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.todaySection}>
            <Text style={[typo.h2, { color: themeColors.primaryText, marginBottom: spacing.md }]}>Today Flows</Text>
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
    ...flexCenter,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  cardsContainer: {
    ...flexRow,
    marginBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'stretch',
    ...shadows.elevatedShadow,
    borderRadius: radius.xl,
    padding: 3,
    minHeight: 200,
  },
  habitCardContainer: {
    flex: 1,
    minWidth: 0,
  },
  habitCard: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  statusCardContainer: {
    flex: 1.2,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    minWidth: 0,
  },
  statusCard: {
    flex: 1,
    padding: spacing.lg,
  },
  navigationHeader: {
    marginBottom: spacing.md,
    ...flexCenter,
  },
  navigationContainer: {
    ...flexRow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  swipeIndicatorLeft: {
    ...flexCenter,
    width: 20,
    height: 28,
    marginRight: spacing.sm,
  },
  swipeIndicatorRight: {
    ...flexCenter,
    width: 20,
    height: 28,
    marginLeft: spacing.sm,
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
    ...flexRow,
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dayColumn: {
    ...flexCenter,
    minWidth: 36,
  },
  navigationPlaceholder: {
    height: 48,
    marginBottom: spacing.md,
  },
  flowsMainContainer: {
    width: '100%',
    flex: 1,
    ...flexCenter,
  },
  flowRow: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 48,
    ...flexCenter,
  },
  flowItemLeft: {
    paddingRight: spacing.sm,
    ...flexCenter,
    flex: 1,
  },
  statusGridContainer: {
    width: '100%',
    flex: 1,
    ...flexCenter,
  },
  statusRow: {
    ...flexRowBetween,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 52,
  },
  statusCell: {
    ...flexCenter,
    width: 28,
    height: 28,
  },
  statusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    ...flexCenter,
    ...shadows.buttonShadow,
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
    ...flexCenter,
    paddingVertical: spacing.lg,
  },
  quoteCardContainer: {
    marginBottom: spacing.lg,
    ...shadows.elevatedShadow,
    borderRadius: radius.xl,
  },
  quoteCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.light.cardBackground,
  },
  todayContainer: {
    flex: 1,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  todaySection: {
    marginBottom: spacing.lg,
  },
  bottomSpacing: {
    height: 120,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    ...flexCenter,
  },
  addButton: {
    width: '100%',
    height: 56,
    borderRadius: radius.pill,
  },
});