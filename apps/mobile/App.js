// src/App.js
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { PlanProvider } from './src/context/PlanContext';
import { FlowsProvider } from './src/context/FlowContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

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

// Main App component that wraps everything with QueryClientProvider
export default function App() {
  console.log('🔍 App: Starting to render');
  
  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <FlowsProvider>
                <PlanProvider>
                  <AppNavigator />
                </PlanProvider>
              </FlowsProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error('App Error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          App Error: {error.message}
        </Text>
      </View>
    );
  }
}