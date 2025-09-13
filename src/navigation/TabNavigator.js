// navigation/TabNavigator.js
import React, { useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Dimensions, View, useColorScheme, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/home/HomePage';
import StatsStack from './StatsStack';
import ProfileStack from './ProfileStack';
import PlansStack from './PlansStack';
import SettingsStack from './SettingsStack';
import AddFlowScreen from '../screens/flow/AddFlow';
import ViewFlow from '../components/flow/ViewFlow';
import EditFlowScreen from '../screens/flow/EditFlow';
import Badge from '../components/common/Badge';
import { colors, layout, typography } from '../../styles';
import { ThemeContext } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Tab = createBottomTabNavigator();

// Enhanced Custom Tab Bar with proper alignment and animations
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const colorScheme = useColorScheme();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const insets = useSafeAreaInsets();
  
  // Robust theme handling with proper fallbacks
  const currentTheme = theme || colorScheme || 'light';
  const themeColors = colors[currentTheme] || colors.light;
  
  // Enhanced responsive calculations
  const isTablet = screenWidth >= 768;
  const isSmallDevice = screenWidth <= 375;
  const isLargeDevice = screenWidth >= 414;
  
  // Dynamic sizing based on device characteristics
  const iconSize = isTablet ? 28 : isSmallDevice ? 22 : isLargeDevice ? 26 : 24;
  const labelFontSize = isTablet ? typography.sizes.footnote : isSmallDevice ? typography.sizes.caption2 : typography.sizes.caption1;
  
  // Android-optimized tab bar height
  const baseHeight = isTablet ? 90 : Platform.OS === 'android' ? 76 : 80;
  const tabBarHeight = Platform.OS === 'android' ? baseHeight : baseHeight + insets.bottom;
  
  // Animation values for each tab
  const [scaleAnimations] = useState(() => 
    state.routes.reduce((acc, route) => {
      acc[route.key] = new Animated.Value(1);
      return acc;
    }, {})
  );

  const getIconName = (routeName, focused) => {
    const iconMap = {
      Home: focused ? "home" : "home-outline",
      Stats: focused ? "bar-chart" : "bar-chart-outline", 
      Plans: focused ? "clipboard" : "clipboard-outline",
      Profile: focused ? "person" : "person-outline",
    };
    return iconMap[routeName] || "home-outline";
  };

  const handleTabPress = (route, index) => {
    const isFocused = state.index === index;
    
    if (!isFocused) {
      // Android-optimized haptic feedback
      if (Platform.OS === 'android') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Android-optimized animation (slightly more pronounced for better feedback)
      const scaleValue = Platform.OS === 'android' ? 0.85 : 0.9;
      const duration = Platform.OS === 'android' ? 120 : 100;
      
      Animated.sequence([
        Animated.timing(scaleAnimations[route.key], {
          toValue: scaleValue,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimations[route.key], {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start();
      
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: tabBarHeight,
      paddingBottom: Platform.OS === 'android' ? 8 : insets.bottom,
      paddingTop: Platform.OS === 'android' ? 12 : 8,
      backgroundColor: themeColors.cardBackground,
      borderTopWidth: Platform.OS === 'android' ? 0.5 : 1,
      borderTopColor: themeColors.progressBackground,
      // Android-optimized shadow and elevation
      ...Platform.select({
        ios: {
          shadowColor: themeColors.shadow || '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 16, // Higher elevation for better Android shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        },
      }),
      zIndex: 1000,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: baseHeight,
        paddingHorizontal: Platform.OS === 'android' ? 20 : 16, // More padding on Android for better touch targets
      }}>
        {state.routes
          .filter(route => {
            // Only show the 4 main tabs in the tab bar
            const mainTabs = ['Home', 'Stats', 'Plans', 'Profile'];
            return mainTabs.includes(route.name);
          })
          .map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            // Find the actual index in the full routes array
            const actualIndex = state.routes.findIndex(r => r.key === route.key);
            const isFocused = state.index === actualIndex;
            const color = isFocused ? themeColors.primaryOrange : themeColors.secondaryText;

            return (
              <Animated.View
                key={route.key}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: Platform.OS === 'android' ? 10 : 8,
                  paddingHorizontal: Platform.OS === 'android' ? 6 : 4,
                  minHeight: Platform.OS === 'android' ? 48 : 44, // Larger touch targets on Android
                  transform: [{ scale: scaleAnimations[route.key] }],
                }}
              >
                <Animated.View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                  onTouchEnd={() => handleTabPress(route, actualIndex)}
                >
                  {/* Icon Container with perfect centering - Android optimized */}
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: Platform.OS === 'android' ? 6 : 4,
                    width: iconSize + (Platform.OS === 'android' ? 12 : 8),
                    height: iconSize + (Platform.OS === 'android' ? 12 : 8),
                  }}>
                    {route.name === 'Plans' ? (
                      <View style={{ 
                        position: 'relative', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Ionicons 
                          name={getIconName(route.name, isFocused)} 
                          color={color} 
                          size={iconSize}
                        />
                        {/* Dynamic badge - in real app, this would come from state */}
                        <Badge count={0} size="small" />
                      </View>
                    ) : (
                      <Ionicons 
                        name={getIconName(route.name, isFocused)} 
                        color={color} 
                        size={iconSize}
                      />
                    )}
                  </View>
                  
                  {/* Label with perfect centering */}
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  }}>
                    <Animated.Text style={{
                      fontSize: labelFontSize,
                      fontWeight: isFocused ? typography.weights.bold : typography.weights.semibold,
                      fontFamily: typography.fonts.family.medium,
                      textAlign: 'center',
                      color: color,
                      lineHeight: Platform.OS === 'android' ? labelFontSize * 1.3 : labelFontSize * 1.2, // Better line height for Android
                      maxWidth: '100%',
                      numberOfLines: 1,
                      // Android-specific text rendering optimizations
                      ...Platform.select({
                        android: {
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                        },
                      }),
                    }}>
                      {label}
                    </Animated.Text>
                  </View>
                </Animated.View>
              </Animated.View>
            );
          })}
      </View>
    </View>
  );
};

const TabNavigator = () => {
  const colorScheme = useColorScheme();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  
  // Robust theme handling
  const currentTheme = theme || colorScheme || 'light';
  const themeColors = colors[currentTheme] || colors.light;

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab, shows your daily flows and progress',
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsStack}
        options={{
          tabBarLabel: 'Stats',
          tabBarAccessibilityLabel: 'Statistics tab, view your progress and analytics',
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansStack}
        options={{
          tabBarLabel: 'Plans',
          tabBarAccessibilityLabel: 'Plans tab, create and join rituals and challenges',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab, view and edit your profile',
        }}
      />
      <Tab.Screen
        name="AddFlow"
        component={AddFlowScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="FlowDetails"
        component={ViewFlow}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="EditFlow"
        component={EditFlowScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;