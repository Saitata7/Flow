// src/App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomeScreen from './screens/home/HomePage';
import StatsScreen from './screens/Stats';
import SettingsScreen from './screens/settings/Settings';
import AddHabitScreen from './screens/AddHabit';
import { HabitsProvider } from './context/HabitContext';
import { ThemeProvider } from './context/ThemeContext';
import { ActivityProvider } from './context/ActivityContext';
import ViewHabit from './components/ViewHabit';
import EditHabitScreen from './screens/EditHabit';
import Login from './screens/auth/Login';
import Register from './screens/auth/Register';
import ForgotPassword from './screens/auth/ForgotPassword';
import useAuth from './hooks/useAuth';

// Create QueryClient instance with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

function AuthScreens({ onSkip }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen
        name="Login"
        component={Login}
        initialParams={{ onSkip }}
      />
      <AuthStack.Screen name="Register" component={Register} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
    </AuthStack.Navigator>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Stats') iconName = 'bar-chart-outline';
          else if (route.name === 'Settings') iconName = 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9500',
        tabBarInactiveTintColor: '#86868B',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainScreens() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ title: 'Add New Habit' }} />
      <Stack.Screen name="HabitStatsDetail" component={ViewHabit} />
      <Stack.Screen name="HabitDetails" component={ViewHabit} />
      <Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ title: 'Edit Habit' }} />
    </Stack.Navigator>
  );
}

// Main App component that wraps everything with QueryClientProvider
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

// AppContent component that uses React Query hooks
function AppContent() {
  const { user, isLoading, error, skipAuth } = useAuth();

  useEffect(() => {
    console.log('useAuth state:', { user, isLoading, error });
  }, [user, isLoading, error]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <HabitsProvider>
        <ActivityProvider>
          <SafeAreaProvider>
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle="dark-content"
            />
            <NavigationContainer>
              {user ? <MainScreens /> : <AuthScreens onSkip={() => skipAuth()} />}
            </NavigationContainer>
          </SafeAreaProvider>
        </ActivityProvider>
      </HabitsProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
  },
});