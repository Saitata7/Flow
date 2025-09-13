// src/App.js
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './navigation/AppNavigator';
import { PlanProvider } from './context/PlanContext';

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
    <QueryClientProvider client={queryClient}>
      <PlanProvider>
        <AppNavigator />
      </PlanProvider>
    </QueryClientProvider>
  );
}