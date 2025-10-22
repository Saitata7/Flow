// src/App.js
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { FlowsProvider } from './context/FlowContext';
import { ActivityProvider } from './context/ActivityContext';
// Environment variables are handled via React Native's built-in support
// No need to import dotenv in React Native environment

import './config/firebaseInit'; // Initialize Firebase

// Firebase is initialized via firebaseInit.js
console.log('🔥 Firebase initialized with React Native Firebase');

// Global error handler
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out known non-critical errors
  const errorMessage = args.join(' ');
  if (
    errorMessage.includes('CanceledError') ||
    errorMessage.includes('Request canceled') ||
    errorMessage.includes('Network Error') ||
    errorMessage.includes('timeout')
  ) {
    // These are expected errors, don't log them as errors
    console.log('ℹ️ Expected error (not critical):', ...args);
    return;
  }
  
  // Log other errors normally
  originalConsoleError(...args);
};

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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FlowsProvider>
            <ActivityProvider>
              <NotificationProvider>
                <AppNavigator />
              </NotificationProvider>
            </ActivityProvider>
          </FlowsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}