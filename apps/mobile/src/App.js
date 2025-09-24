// src/App.js
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './navigation/AppNavigator';
import { NotificationProvider } from './context/NotificationContext';
import './config/firebaseInit'; // Initialize Firebase

// Firebase is initialized via firebaseInit.js
console.log('🔥 Firebase initialized with React Native Firebase');

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
        <NotificationProvider>
          <AppNavigator />
        </NotificationProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}