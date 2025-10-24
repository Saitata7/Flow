// navigation/AppNavigator.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import Splash from '../screens/info/Splash';
import Onboarding from '../screens/info/Onboarding';
import Firsttime from '../screens/info/Firsttime';
import { useAuth } from '../context/JWTAuthContext';
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


const AppNavigator = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigationRef = useRef(null);

  useEffect(() => {
    Haptics.selectionAsync();
    
    // Initialize background sync service
    try {
      backgroundSyncService.init();
    } catch (error) {
      console.error('❌ Error initializing background sync service:', error);
    }
  }, []);

  // Handle navigation based on authentication state changes
  useEffect(() => {
    if (!authLoading && navigationRef.current) {
      console.log('🔍 AppNavigator: Auth state changed, user:', user);
      
      if (user && user.id && user.email) {
        console.log('✅ AppNavigator: User authenticated, navigating to Main');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        console.log('🔍 AppNavigator: No authenticated user, navigating to Auth');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    }
  }, [user, authLoading]);

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.light.primaryOrange} />
          <Text style={{ marginTop: 20, color: colors.light.primaryText }}>
            Loading...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Determine initial route based on authentication and guest mode
  const getInitialRoute = () => {
    try {
      console.log('🔍 AppNavigator: Determining initial route');
      console.log('🔍 AppNavigator: User:', user);
      console.log('🔍 AppNavigator: AuthLoading:', authLoading);
      
      // Only go to Main if we have a REAL authenticated user
      // For newly registered users, emailVerified might be false initially
      if (user && user.id && user.email) {
        console.log('✅ AppNavigator: User authenticated, going to Main');
        return 'Main';
      }
      
      // Default to Auth screen for ANY uncertainty
      console.log('🔍 AppNavigator: No authenticated user, going to Auth');
      return 'Auth';
    } catch (error) {
      console.error('❌ Error determining initial route:', error);
      return 'Auth';
    }
  };

  const initialRoute = getInitialRoute();

  // FIXED: Use single NavigationContainer with all routes
  try {
    return (
      <SafeAreaProvider>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator 
            screenOptions={screenOptions}
            initialRouteName={initialRoute}
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
    );
  } catch (error) {
    console.error('❌ AppNavigator Error:', error);
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
            Navigation Error: {error.message}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }
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