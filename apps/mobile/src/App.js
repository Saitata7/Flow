// src/App.js - Step 4: Add Real Login Screen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JWTAuthProvider } from './context/JWTAuthContext';
import Login from './screens/auth/Login';

const Stack = createNativeStackNavigator();

// Simple home screen for testing
function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Flow App - Home Screen</Text>
      <Text style={styles.subtext}>Login successful! Navigation working!</Text>
    </View>
  );
}

// Navigation component
function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hide headers for cleaner look
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App component with JWT Auth Provider and Navigation
export default function App() {
  return (
    <JWTAuthProvider>
      <AppNavigator />
    </JWTAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});