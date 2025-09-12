// navigation/AppNavigator.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from 'react-native-haptic-feedback';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import useAuth from '../hooks/useAuth';
import { HabitsProvider } from '../context/HabitContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ActivityProvider } from '../context/ActivityContext';
import { colors } from '../styles';

const screenOptions = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: { animation: 'spring', config: { stiffness: 90, damping: 20, mass: 1 } },
    close: { animation: 'spring', config: { stiffness: 90, damping: 20, mass: 1 } },
  },
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
      transform: [{
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0],
        }),
      }],
    },
  }),
};

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    Haptics.trigger('selection');
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.light.primaryOrange} />
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
              <Stack.Navigator screenOptions={screenOptions}>
                {user ? (
                  <Stack.Screen name="Main" component={TabNavigator} />
                ) : (
                  <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </ActivityProvider>
      </HabitsProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.background,
  },
});

export default AppNavigator;