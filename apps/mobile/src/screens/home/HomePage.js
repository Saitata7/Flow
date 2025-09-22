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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { FlowsContext } from '../../context/FlowContext';
import { useProfile } from '../../hooks/useProfile';
import moment from 'moment';
import TodaysFlows from '../../components/flow/todayResponse/TodaysFlows';
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
import { Button, Card, Icon, FlowGrid } from '../../components';

const SIDE_PADDING = 16;

export default function HomePage({ navigation }) {
  const [dayOffset, setDayOffset] = useState(0); // Controls which set of 3 days to show
  const insets = useSafeAreaInsets(); // Get safe area insets for proper positioning
  
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
    // First filter out deleted and archived flows
    if (flow.deletedAt || flow.archived) {
      return false;
    }
    // Normalize frequency/repeatType
    const frequency = flow.frequency || (flow.repeatType === 'day' ? 'Daily' : flow.repeatType === 'month' ? 'Monthly' : 'Daily');
    
    // For group flows, be more lenient with scheduling
    const isGroupFlow = flow.groupId || flow.planId;
    const isTodayScheduled = isGroupFlow 
      ? true // Group flows are always visible (they're daily by default)
      : frequency === 'Daily'
        ? flow.everyDay || (flow.daysOfWeek && flow.daysOfWeek.includes(today))
        : frequency === 'Monthly'
          ? flow.daysOfWeek && flow.daysOfWeek.includes(todayDate.toString())
          : false;

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
          
          {/* Today Flows - Moved inside ScrollView */}
          <View style={[styles.todayContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.todaySection}>
              <Text style={[typography.styles.title2, { color: themeColors.primaryText, marginBottom: layout.spacing.md }]}>Today Flows</Text>
              <TodaysFlows navigation={navigation} visibleFlows={visibleFlows} />
            </View>
            <View style={styles.bottomSpacing} />
          </View>
          
          {/* White background extension to cover remaining area */}
          <View style={styles.whiteBackgroundExtension} />
        </View>
        </ScrollView>
      
      {/* Floating Action Button - Add Flow */}
      <TouchableOpacity
        style={[styles.fabContainer, { bottom: 60 + insets.bottom + 20 }]} // Tab bar height (60) + safe area + padding
        onPress={() => navigation.navigate('AddFlow')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[themeColors.primaryOrange, themeColors.primaryOrangeVariants.light]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Ionicons 
            name="add" 
            size={28} 
            color={themeColors.cardBackground} 
          />
        </LinearGradient>
      </TouchableOpacity>
      
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
    marginBottom: 0, // Remove gap after greetings
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
  todayContainer: {
    flex: 1,
    marginTop: 40, // Add 30px top space
    paddingHorizontal: layout.spacing.md,
  },
  todaySection: {
    marginBottom: layout.spacing.lg,
  },
  bottomSpacing: {
    height: 120, // Space for FAB button (56px + padding)
  },
  whiteBackgroundExtension: {
    backgroundColor: '#FFFFFF',
    minHeight: 200, // Ensure enough white background coverage
    flex: 1,
  },
  // Floating Action Button (FAB) - Right Corner
  fabContainer: {
    position: 'absolute',
    // bottom: calculated dynamically with safe area
    right: 20, // Right corner positioning
    width: 56, // Standard FAB size
    height: 56,
    borderRadius: 28, // Perfect circle
    zIndex: 999, // Above content, below tab bar
    // Shadow for floating effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});