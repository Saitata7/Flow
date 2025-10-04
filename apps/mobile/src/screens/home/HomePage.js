import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
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
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { FlowsContext } from '../../context/FlowContext';
import { useAchievements } from '../../hooks/useAchievements';
import moment from 'moment';
import TodaysFlows from '../../components/flow/todayResponse/TodaysFlows';
import FTUEOverlay from '../../components/home/FTUEOverlay';
import { useFTUE } from '../../hooks/useFTUE';
import SettingsMenu from '../settings/SettingsMenu';

// Import centralized styles and components
import {
  colors,
  typography,
  layout,
  commonStyles,
  useAppTheme,
} from '../../../styles';
import { Button, Card, Icon, FlowGrid } from '../../components';

export default function HomePage({ navigation }) {
  console.log('HomePage: Component rendering...');
  
  const [dayOffset, setDayOffset] = useState(0); // Controls which set of 3 days to show
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const insets = useSafeAreaInsets(); // Get safe area insets for proper positioning
  
  console.log('HomePage: State initialized');
  
  // Animation for FAB subtle attention effect
  const gentlePulse = useRef(new Animated.Value(1)).current;
  const subtleGlow = useRef(new Animated.Value(0)).current;
  const borderRotate = useRef(new Animated.Value(0)).current;
  
  // FTUE (First-Time User Experience)
  const { showFTUE, completeFTUE, startFTUE } = useFTUE();

  const { flows, loadData } = useContext(FlowsContext) || { flows: [], loadData: () => {} };
  const { theme, textSize, highContrast, cheatMode } = useContext(ThemeContext) || {
    theme: 'light',
    textSize: 'medium',
    highContrast: false,
    cheatMode: false,
  };
  const { processFlows } = useAchievements();

  // Use centralized theme hook
  const { colors: themeColors, isDark } = useAppTheme();
  console.log('HomePage: Theme loaded', { themeColors, isDark });

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

  // Start the subtle attention animation
  useEffect(() => {
    // Gentle pulse - very subtle scaling
    const startGentlePulse = () => {
      gentlePulse.setValue(1);
      Animated.loop(
        Animated.sequence([
          Animated.timing(gentlePulse, {
            toValue: 1.08,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(gentlePulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1000), // Pause between pulses
        ])
      ).start();
    };

    // Subtle glow - soft opacity change
    const startSubtleGlow = () => {
      subtleGlow.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(subtleGlow, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(subtleGlow, {
            toValue: 0,
            duration: 1500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(2000), // Longer pause between glows
        ])
      ).start();
    };

    // Circular border rotation
    const startBorderRotation = () => {
      borderRotate.setValue(0);
      Animated.loop(
        Animated.timing(borderRotate, {
          toValue: 1,
          duration: 3000, // 3 seconds per rotation
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startGentlePulse();
    startSubtleGlow();
    startBorderRotation();
  }, [gentlePulse, subtleGlow, borderRotate]);

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
    return 'there';
  };

  const calculateStreak = () => {
    // Calculate current streak based on completed flows
    let streak = 0;
    const today = moment().format('YYYY-MM-DD');
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const hasCompletedFlow = flows.some(flow => {
        const status = flow.status?.[checkDate];
        return status?.symbol === '+';
      });
      
      if (hasCompletedFlow) {
        streak++;
      } else if (i > 0) { // Don't break streak on first day if no flows
        break;
      }
    }
    
    return streak >= 4 ? streak : 0; // Only show if 4+ streaks, otherwise 0 (don't show)
  };

  const currentStreak = calculateStreak();

  // Check for achievements when flows are loaded
  useEffect(() => {
    if (flows.length > 0) {
      // Process flows to check for new achievements
      processFlows(flows);
    }
  }, [flows, processFlows]);

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
  console.log('HomePage: All flows with status:', flows.map(f => ({ 
    id: f.id, 
    title: f.title, 
    statusKeys: f.status ? Object.keys(f.status) : 'No status',
    status: f.status ? JSON.stringify(f.status, null, 2) : 'No status'
  })));
  console.log('HomePage: Todays flows:', visibleFlows.map(f => ({ id: f.id, title: f.title })));


  console.log('HomePage: About to render...');
  
  try {
    return (
    <LinearGradient
      colors={['#FFE3C3', '#FFFFFF']}
      style={[commonStyles.container]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={[commonStyles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDark ? "light-content" : "dark-content"}
        />
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={[commonStyles.container, { backgroundColor: 'transparent' }]}>
            {/* Enhanced Header */}
            <View style={[styles.headerContainer, { backgroundColor: 'transparent' }]}>
            {/* Top Row - Logo and Icons */}
            <View style={styles.headerTopRow}>
              <View style={styles.logoContainer}>
                <Text style={[styles.logoText, { color: themeColors.primaryOrange }]}>Flow</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => setShowSettingsModal(true)}
                  accessibilityLabel="Open settings"
                  accessibilityHint="Tap to open app settings and preferences"
                >
                  <Ionicons name="settings-outline" size={24} color={themeColors.primaryText} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => startFTUE()}
                  testID="info-icon-button"
                  accessibilityLabel="Show app information"
                  accessibilityHint="Tap to view app information and help"
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
              
              {/* Achievement Streak Display */}
              {currentStreak > 0 && (
                <View style={styles.streakContainer}>
                  <Ionicons name="flame" size={16} color={themeColors.primaryOrange} />
                  <Text style={[styles.streakText, { color: themeColors.primaryOrange }]}>
                    {currentStreak} day streak!
                  </Text>
                </View>
              )}
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
          <View style={[styles.todayContainer, { backgroundColor: 'transparent' }]}>
            <View style={styles.todaySection}>
              <Text style={[typography.styles.title2, { color: themeColors.primaryText, marginBottom: layout.spacing.md }]}>Today Flows</Text>
              <TodaysFlows navigation={navigation} visibleFlows={visibleFlows} />
            </View>
            <View style={styles.bottomSpacing} />
          </View>
          
          {/* Gradient continues to bottom */}
          <View style={[styles.whiteBackgroundExtension, { backgroundColor: 'transparent' }]} />
        </View>
        </ScrollView>
      
      {/* Floating Action Button - Add Flow */}
      <View style={[styles.fabContainer, { bottom: 60 + insets.bottom + layout.spacing.lg }]}>
        {/* Circular Shining Border */}
        <Animated.View
          style={[
            styles.circularBorder,
            {
              transform: [
                {
                  rotate: borderRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#F7BA53', '#FFD700', '#FFA500', '#F7BA53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.borderGradient}
          />
        </Animated.View>
        
        {/* Subtle Glow Effect */}
        <Animated.View
          style={[
            styles.subtleGlow,
            {
              opacity: subtleGlow,
              transform: [{ scale: gentlePulse }],
            },
          ]}
        />
        
        {/* Main FAB Button */}
        <Animated.View
          style={{
            transform: [{ scale: gentlePulse }],
          }}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => navigation.navigate('AddFlow')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F7BA53', '#F7A053']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fabGradient}
            >
              <Ionicons 
                name="add" 
                size={28} 
                color="#FFFFFF" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* FTUE Overlay */}
      <FTUEOverlay
        visible={showFTUE}
        onComplete={completeFTUE}
      />
      
      {/* Settings Modal */}
      <SettingsMenu 
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      </SafeAreaView>
    </LinearGradient>
  );
  } catch (error) {
    console.error('HomePage: Render error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          Error: {error.message}
        </Text>
      </View>
    );
  }
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
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.spacing.xs,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: 12,
  },
  streakText: {
    fontSize: typography.sizes.caption1,
    fontWeight: typography.weights.semibold,
    marginLeft: layout.spacing.xs,
  },
  todayContainer: {
    flex: 1,
    marginTop: layout.spacing.x3l, // Use spacing token instead of hardcoded 40px
    paddingHorizontal: layout.spacing.base,
  },
  todaySection: {
    marginBottom: layout.spacing.lg,
  },
  bottomSpacing: {
    height: layout.spacing.x5l + layout.spacing.x2l, // Space for FAB button (64px + 32px padding)
  },
  whiteBackgroundExtension: {
    minHeight: layout.spacing.x5l * 3, // Ensure enough white background coverage (192px)
    flex: 1,
  },
  // Floating Action Button (FAB) - Right Corner
  fabContainer: {
    position: 'absolute',
    // bottom: calculated dynamically with safe area
    right: layout.spacing.lg, // Right corner positioning using spacing token
    width: 68, // Larger to accommodate circular border
    height: 68,
    zIndex: 999, // Above content, below tab bar
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBorder: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2, // Border thickness
  },
  borderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  subtleGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(247, 186, 83, 0.2)', // Very subtle orange glow
    // Soft shadow
    shadowColor: '#F7BA53',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabButton: {
    width: 56, // Standard FAB size (components.fab.size)
    height: 56,
    borderRadius: 28, // Perfect circle (components.fab.borderRadius)
    // Standard shadow for floating effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.14, // elevation.high shadowOpacity
    shadowRadius: 16, // elevation.high shadowRadius
    elevation: 12, // elevation.high Android shadow
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});