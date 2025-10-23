// src/App.js - Main App Entry Point
import React from 'react';
import { JWTAuthProvider } from './context/JWTAuthContext';
import AppNavigator from './navigation/AppNavigator';

// Main App component with JWT Auth Provider and Full Navigation
export default function App() {
  return (
    <JWTAuthProvider>
      <AppNavigator />
    </JWTAuthProvider>
  );
}