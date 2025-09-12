// navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Haptics from 'react-native-haptic-feedback';
import HomeScreen from '../screens/home/HomePage';
import StatsScreen from '../screens/Stats';
import SettingsScreen from '../screens/settings/Settings';
import AddHabitScreen from '../screens/AddHabit';
import ViewHabit from '../components/ViewHabit';
import EditHabitScreen from '../screens/EditHabit';
import Icon from '../common/Icon';
import { StyleSheet } from 'react-native';
import { colors, layout } from '../styles';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: 'rgba(255,255,255,0.8)',
          borderRadius: layout.squircle.borderRadius,
          borderCurve: 'continuous',
          height: 60,
          ...layout.shadows.cardShadow,
        },
        tabBarActiveTintColor: colors.light.primaryOrange,
        tabBarInactiveTintColor: colors.light.secondaryText,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="bar-chart-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="settings-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AddHabit"
        component={AddHabitScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="HabitStatsDetail"
        component={ViewHabit}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="HabitDetails"
        component={ViewHabit}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="EditHabit"
        component={EditHabitScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;