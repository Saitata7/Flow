import React, { useContext, useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { FlowsContext } from '../../context/FlowContext';
import { useProfile } from '../../hooks/useProfile';
import moment from 'moment';
import TodaysFlows from '../../components/flow/todayResponse/TodaysFlows';
import NotificationScreen from './NotificationScreen';
import FTUEOverlay from '../../components/home/FTUEOverlay';
import { useFTUE } from '../../hooks/useFTUE';

// Import centralized styles and components
import {
  colors,
  typography,
  layout,
  commonStyles,
  useAppTheme,
} from '../../../styles';
import { Button, Card, Icon, Badge, FlowGrid } from '../../components';

const SIDE_PADDING = 16;

export default function HomePage({ navigation }) {
  const [dayOffset, setDayOffset] = useState(0); // Controls which set of 3 days to show
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count
  
  // FTUE (First-Time User Experience)
  const { showFTUE, completeFTUE, startFTUE } = useFTUE();

  const { flows, loadData } = useContext(FlowsContext) || { flows: [], loadData: () => {} };
  const { theme, textSize, highContrast, cheatMode } = useContext(ThemeContext) || {
    theme: 'light',
    textSize: 'medium',
    highContrast: false,
    cheatMode: false,
  };

  // Use centralized theme hook
  const { colors: themeColors, isDark } = useAppTheme();
  
  // Get user profile for greeting
  const { profile } = useProfile();

  // Refresh flows when home page comes into focus (only if flows are empty)
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomePage: Checking flows on focus - current count:', flows.length);
      if (flows.length === 0) {
        console.log('HomePage: No flows found, loading data');
        loadData();
      } else {
        console.log('HomePage: Flows already loaded, skipping refresh');
      }
    }, [loadData, flows.length])
  );

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

  // Helper functions for greeting and streak
  const getGreeting = () => {
    const hour = moment().hour();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    return profile?.displayName || profile?.name || 'there';
  };

  const calculateStreak = () => {
    // Calculate current streak based on completed flows
    let streak = 0;
    const today = moment().format('YYYY-MM-DD');
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const hasCompletedFlow = flows.some(flow => {
        const status = flow.status?.[checkDate];
        return status?.symbol === '✅';
      });
      
      if (hasCompletedFlow) {
        streak++;
      } else if (i > 0) { // Don't break streak on first day if no flows
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  const visibleFlows = flows.filter((flow) => {
    // Normalize frequency/repeatType
    const frequency = flow.frequency || (flow.repeatType === 'day' ? 'Daily' : flow.repeatType === 'month' ? 'Monthly' : 'Daily');
    
    // For group flows, be more lenient with scheduling
    const isGroupFlow = flow.groupId || flow.planId;
    const isTodayScheduled = isGroupFlow 
      ? true // Group flows are always visible (they're daily by default)
      : frequency === 'Daily'
        ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(today))
        : flow.selectedMonthDays && flow.selectedMonthDays.includes(todayDate);

    console.log(`HomePage: Flow "${flow.title}" - frequency: ${frequency}, everyDay: ${flow.everyDay}, daysOfWeek: ${JSON.stringify(flow.daysOfWeek)}, isTodayScheduled: ${isTodayScheduled}, groupId: ${flow.groupId}, isGroupFlow: ${isGroupFlow}`);

    if (!isTodayScheduled) {
      console.log(`HomePage: Flow "${flow.title}" - EXCLUDED: not scheduled for today`);
      return false;
    }

    // Include flows regardless of time/reminderTime unless time-based filtering is explicitly required
    // Optionally, check startDate if present
    const startDate = flow.startDate ? moment(flow.startDate) : null;
    const isStarted = !startDate || now.isSameOrAfter(startDate, 'day');

    console.log(`HomePage: Flow "${flow.title}" - isStarted: ${isStarted}, will be visible: ${isStarted}`);

    if (!isStarted) {
      console.log(`HomePage: Flow "${flow.title}" - EXCLUDED: not started yet`);
      return false;
    }

    console.log(`HomePage: Flow "${flow.title}" - INCLUDED: visible on home page`);
    return true;
  });

  console.log('HomePage: All flows:', flows.map(f => ({ id: f.id, title: f.title })));
  console.log('HomePage: Todays flows:', visibleFlows.map(f => ({ id: f.id, title: f.title })));

  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: '#FEDFCD' }]} edges={['top']}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[commonStyles.container, { backgroundColor: '#FEDFCD' }]}>
          {/* Enhanced Header */}
          <View style={[styles.headerContainer, { backgroundColor: '#FEDFCD' }]}>
            {/* Top Row - Logo and Icons */}
            <View style={styles.headerTopRow}>
              <View style={styles.logoContainer}>
                <Text style={[styles.logoText, { color: themeColors.primaryOrange }]}>Flow</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => navigation.navigate('NotificationScreen')}
                  testID="notification-icon-button"
                >
                  <Ionicons name="notifications-outline" size={24} color={themeColors.primaryText} />
                  {notificationCount > 0 && (
                    <Badge count={notificationCount} size="small" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => startFTUE()}
                  testID="info-icon-button"
                >
                  <Ionicons name="information-circle-outline" size={24} color={themeColors.primaryText} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Greeting Section */}
            <View style={styles.greetingSection}>
              <Text style={[styles.greetingText, { color: themeColors.primaryText }]}>
                {getGreeting()}, {getUserName()}! 👋
              </Text>
              <Text style={[styles.subtitleText, { color: themeColors.secondaryText }]}>
                Track your daily flows and build better habits
              </Text>
            </View>
            
          </View>
          
          {/* Flow Grid */}
          <FlowGrid 
            onFlowPress={(flow) => {
              console.log('HomePage: FlowGrid onFlowPress called with:', {
                id: flow.id,
                title: flow.title,
                trackingType: flow.trackingType
              });
              navigation.navigate('FlowDetails', { flowId: flow.id });
            }}
            cheatMode={cheatMode}
          />
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
        <View style={[styles.todayContainer, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.todaySection}>
            <Text style={[typography.styles.title2, { color: themeColors.primaryText, marginBottom: layout.spacing.md }]}>Today Flows</Text>
            <TodaysFlows navigation={navigation} visibleFlows={visibleFlows} />
          </View>
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      <View style={styles.fixedButtonContainer}>
        <LinearGradient
          colors={['#FFB366', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Button
            variant="fab"
            title="+ Add Flow"
            onPress={() => navigation.navigate('AddFlow')}
            style={styles.addButton}
          />
        </LinearGradient>
      </View>
      
      {/* FTUE Overlay */}
      <FTUEOverlay
        visible={showFTUE}
        onComplete={completeFTUE}
      />
    </SafeAreaView>
  );
}

// Refactored styles using centralized system
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: layout.spacing.xl,
    paddingBottom: layout.spacing.lg,
    paddingHorizontal: layout.spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md, // Reduced gap
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: typography.sizes.title1,
    fontWeight: typography.weights.bold,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: layout.spacing.sm,
    marginLeft: layout.spacing.sm,
    position: 'relative',
  },
  greetingSection: {
    alignItems: 'center',
    marginBottom: layout.spacing.sm, // Further reduced gap
  },
  greetingText: {
    fontSize: typography.sizes.title3, // Reduced size to match FlowGrid
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: layout.spacing.xs,
  },
  subtitleText: {
    fontSize: typography.sizes.caption1, // Reduced size to match FlowGrid
    textAlign: 'center',
    opacity: 0.8,
  },
  quoteCardContainer: {
    marginTop: layout.spacing.md, // Reduced gap from FlowGrid
    marginBottom: 0, // No gap to next section
    paddingHorizontal: layout.spacing.lg, // Match FlowGrid width
  },
  quoteCard: {
    padding: layout.spacing.xl,
    borderRadius: layout.borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.light.cardBackground,
  },
  todayContainer: {
    flex: 1,
    marginTop: layout.spacing.md, // Reduced gap
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
  addButtonGradient: {
    borderRadius: layout.button.pillRadius,
    overflow: 'hidden',
  },
});