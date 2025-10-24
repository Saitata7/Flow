// src/App.js - Main App Entry Point
import React from 'react';
import { JWTAuthProvider } from './context/JWTAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FlowsProvider } from './context/FlowContext';
import { ActivityProvider } from './context/ActivityContext';
import { NotificationProvider } from './context/NotificationContext';
import AppNavigator from './navigation/AppNavigator';

// Main App component with JWT Auth Provider and Full Navigation
export default function App() {
  return (
    <ThemeProvider>
      <JWTAuthProvider>
        <FlowsProvider>
          <ActivityProvider>
            <NotificationProvider>
              <AppNavigator />
            </NotificationProvider>
          </ActivityProvider>
        </FlowsProvider>
      </JWTAuthProvider>
    </ThemeProvider>
  );
}