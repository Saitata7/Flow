// navigation/AppNavigator.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import Splash from '../screens/info/Splash';
import Onboarding from '../screens/info/Onboarding';
import Firsttime from '../screens/info/Firsttime';
import { AuthProvider, useAuth } from '../context/AuthContext';
import useFirstTime from '../hooks/useFirstTime';
import { FlowsProvider } from '../context/FlowContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ActivityProvider } from '../context/ActivityContext';
import { SettingsProvider } from '../context/SettingsContext';
import backgroundSyncService from '../services/backgroundSyncService';
import { colors } from '../../styles';

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

const AppNavigatorContent = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isFirstLaunch, isLoading: firstTimeLoading } = useFirstTime();

  useEffect(() => {
    Haptics.selectionAsync();
    
    // Initialize background sync service
    console.log('🔄 Initializing background sync service...');
    backgroundSyncService.init();
  }, []);

  // Show loading while checking auth and first time status
  if (authLoading || firstTimeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.light.primaryOrange} />
      </View>
    );
  }

  // Determine initial route based on authentication and first-time status
  const getInitialRoute = () => {
    // If user is already logged in, go directly to main app
    if (user) {
      return 'Main';
    }
    
    // If it's first launch, show onboarding
    if (isFirstLaunch) {
      return 'Onboarding';
    }
    
    // Otherwise, show auth (login/register)
    return 'Auth';
  };

  return (
    <ThemeProvider>
      <SettingsProvider>
        <FlowsProvider>
          <ActivityProvider>
            <SafeAreaProvider>
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle="dark-content"
            />
            <NavigationContainer>
              <Stack.Navigator 
                screenOptions={screenOptions}
                initialRouteName={getInitialRoute()}
              >
                {/* Show splash screen first */}
                <Stack.Screen name="Splash" component={Splash} />
                
                {/* Show onboarding for first time users */}
                <Stack.Screen name="Onboarding" component={Onboarding} />
                
                {/* Show first time welcome screen */}
                <Stack.Screen name="Firsttime" component={Firsttime} />
                
                {/* Auth navigation */}
                <Stack.Screen name="Auth" component={AuthNavigator} />
                
                {/* Main app navigation */}
                <Stack.Screen name="Main" component={TabNavigator} />
              </Stack.Navigator>
            </NavigationContainer>
            </SafeAreaProvider>
          </ActivityProvider>
        </FlowsProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

const AppNavigator = () => {
  return (
    <AuthProvider>
      <AppNavigatorContent />
    </AuthProvider>
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