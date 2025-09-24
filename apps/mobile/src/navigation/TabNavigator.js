// navigation/TabNavigator.js
import React, { useContext, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, Dimensions, View, useColorScheme, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/home/HomePage';
import HomeInfo from '../screens/info/HomeInfo';
import StatsStack from './StatsStack';
import SettingsStack from './SettingsStack';
import AddFlowScreen from '../screens/flow/AddFlow';
import FlowDetail from '../screens/track/FlowDetails';
import EditFlowScreen from '../screens/flow/EditFlow';
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
  
  // Consistent sizing according to specifications
  const iconSize = 26; // 26-28px as specified
  const labelFontSize = 12; // 12-13px caption style
  
  // Tab bar height: 60-70px (platform safe area included)
  const baseHeight = 60;
  const tabBarHeight = baseHeight + insets.bottom;
  
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
    };
    return iconMap[routeName] || "home-outline";
  };

  const handleTabPress = (route, index) => {
    const isFocused = state.index === index;
    console.log(`🔥 TAB PRESSED: ${route.name}, isFocused: ${isFocused}, index: ${index}`);
    
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
      
      console.log(`🚀 NAVIGATING TO: ${route.name}`);
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
      paddingTop: 6, // 6-8px padding-top as specified
      backgroundColor: themeColors.cardBackground,
      borderTopLeftRadius: 16, // Rounded top corners
      borderTopRightRadius: 16,
      // Shadow/elevation for floating feel
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 8,
        },
      }),
      zIndex: 1000,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: baseHeight,
        paddingHorizontal: 16,
      }}>
        {state.routes
          .filter(route => {
            // Only show the 2 main tabs in the tab bar
            const mainTabs = ['Home', 'Stats'];
            return mainTabs.includes(route.name);
          })
          .map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            // Find the actual index in the full routes array
            const actualIndex = state.routes.findIndex(r => r.key === route.key);
            const isFocused = state.index === actualIndex;
            const color = isFocused ? themeColors.primaryOrange : '#999999'; // Active tint: app accent, Inactive tint: medium grey

            return (
              <Animated.View
                key={route.key}
                style={{
                  flex: 1, // Even horizontal spacing
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: scaleAnimations[route.key] }],
                }}
              >
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: 44, // Minimum 44x44 dp touch target for accessibility
                    minWidth: 44,
                  }}
                  onPress={() => handleTabPress(route, actualIndex)}
                  activeOpacity={0.7}
                >
                  {/* Icon + label stacked (column) */}
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Icon */}
                    <View style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 4,
                    }}>
                      <Ionicons 
                        name={getIconName(route.name, isFocused)} 
                        color={color} 
                        size={iconSize}
                      />
                    </View>
                    
                    {/* Label */}
                    <Animated.Text style={{
                      fontSize: labelFontSize,
                      fontWeight: isFocused ? typography.weights.bold : typography.weights.medium,
                      fontFamily: typography.fonts.family.medium,
                      textAlign: 'center',
                      color: color,
                      lineHeight: labelFontSize * 1.2,
                      maxWidth: '100%',
                      numberOfLines: 1,
                    }}>
                      {label}
                    </Animated.Text>
                  </View>
                </TouchableOpacity>
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
        name="AddFlow"
        component={AddFlowScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="FlowDetails"
        component={FlowDetail}
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
        name="HomeInfo"
        component={HomeInfo}
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