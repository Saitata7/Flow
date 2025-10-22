// navigation/AppNavigator.js
import React, { useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
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
  try {
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
      Haptics.selectionAsync();
      
      // Initialize background sync service
      try {
        backgroundSyncService.init();
      } catch (error) {
        console.error('❌ Error initializing background sync service:', error);
      }
    }, []);

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
      // Only go to Main if we have a REAL authenticated user
      if (user && user.uid && user.email && !user.isAnonymous) {
        return 'Main';
      }
      
      // Default to Auth screen for ANY uncertainty
      return 'Auth';
    };

    const initialRoute = getInitialRoute();

    // FIXED: Use single NavigationContainer with all routes
    return (
      <SafeAreaProvider>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <NavigationContainer>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          Navigation Error: {error.message}
        </Text>
      </View>
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