/**
 * Navigation Integration Tests
 * Tests navigation flow and context integration
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from '../../../src/navigation/TabNavigator';
import { AuthContext } from '../../../src/context/AuthContext';
import { ThemeContext } from '../../../src/context/ThemeContext';

// Mock the theme context
const mockTheme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

// Mock screens
const MockHomeScreen = ({ navigation }) => (
  <div testID="home-screen">
    <button 
      testID="navigate-to-flows"
      onPress={() => navigation.navigate('Flows')}
    >
      Go to Flows
    </button>
  </div>
);

const MockFlowsScreen = ({ navigation }) => (
  <div testID="flows-screen">
    <button 
      testID="navigate-to-add-flow"
      onPress={() => navigation.navigate('AddFlow')}
    >
      Add Flow
    </button>
  </div>
);

const MockAddFlowScreen = ({ navigation }) => (
  <div testID="add-flow-screen">
    <button 
      testID="go-back"
      onPress={() => navigation.goBack()}
    >
      Go Back
    </button>
  </div>
);

// Mock the screens
jest.mock('../../../src/screens/home/HomeScreen', () => MockHomeScreen);
jest.mock('../../../src/screens/flow/FlowsScreen', () => MockFlowsScreen);
jest.mock('../../../src/screens/flow/AddFlow', () => MockAddFlowScreen);

describe('Navigation Integration', () => {
  const mockAuthContext = {
    user: {
      id: '123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    isAuthenticated: true,
    isLoading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  };

  const TestWrapper = ({ children }) => (
    <NavigationContainer>
      <AuthContext.Provider value={mockAuthContext}>
        <ThemeContext.Provider value={mockTheme}>
          {children}
        </ThemeContext.Provider>
      </AuthContext.Provider>
    </NavigationContainer>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render authenticated navigation', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TabNavigator />
      </TestWrapper>
    );

    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('should navigate between tabs', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TabNavigator />
      </TestWrapper>
    );

    // Navigate to Flows tab
    const flowsTab = getByTestId('flows-tab');
    fireEvent.press(flowsTab);

    await waitFor(() => {
      expect(getByTestId('flows-screen')).toBeTruthy();
    });
  });

  it('should navigate to nested screens', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TabNavigator />
      </TestWrapper>
    );

    // Navigate to Flows tab first
    const flowsTab = getByTestId('flows-tab');
    fireEvent.press(flowsTab);

    await waitFor(() => {
      expect(getByTestId('flows-screen')).toBeTruthy();
    });

    // Navigate to Add Flow screen
    const addFlowButton = getByTestId('navigate-to-add-flow');
    fireEvent.press(addFlowButton);

    await waitFor(() => {
      expect(getByTestId('add-flow-screen')).toBeTruthy();
    });
  });

  it('should handle back navigation', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TabNavigator />
      </TestWrapper>
    );

    // Navigate to Flows tab
    const flowsTab = getByTestId('flows-tab');
    fireEvent.press(flowsTab);

    await waitFor(() => {
      expect(getByTestId('flows-screen')).toBeTruthy();
    });

    // Navigate to Add Flow screen
    const addFlowButton = getByTestId('navigate-to-add-flow');
    fireEvent.press(addFlowButton);

    await waitFor(() => {
      expect(getByTestId('add-flow-screen')).toBeTruthy();
    });

    // Go back
    const goBackButton = getByTestId('go-back');
    fireEvent.press(goBackButton);

    await waitFor(() => {
      expect(getByTestId('flows-screen')).toBeTruthy();
    });
  });

  it('should render unauthenticated navigation', () => {
    const unauthenticatedContext = {
      ...mockAuthContext,
      user: null,
      isAuthenticated: false,
    };

    const { getByTestId } = render(
      <NavigationContainer>
        <AuthContext.Provider value={unauthenticatedContext}>
          <ThemeContext.Provider value={mockTheme}>
            <TabNavigator />
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </NavigationContainer>
    );

    expect(getByTestId('auth-screen')).toBeTruthy();
  });

  it('should handle loading state', () => {
    const loadingContext = {
      ...mockAuthContext,
      isLoading: true,
    };

    const { getByTestId } = render(
      <NavigationContainer>
        <AuthContext.Provider value={loadingContext}>
          <ThemeContext.Provider value={mockTheme}>
            <TabNavigator />
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </NavigationContainer>
    );

    expect(getByTestId('loading-screen')).toBeTruthy();
  });

  it('should maintain navigation state across context updates', async () => {
    const { getByTestId, rerender } = render(
      <TestWrapper>
        <TabNavigator />
      </TestWrapper>
    );

    // Navigate to Flows tab
    const flowsTab = getByTestId('flows-tab');
    fireEvent.press(flowsTab);

    await waitFor(() => {
      expect(getByTestId('flows-screen')).toBeTruthy();
    });

    // Update context
    const updatedContext = {
      ...mockAuthContext,
      user: {
        ...mockAuthContext.user,
        displayName: 'Updated User',
      },
    };

    rerender(
      <NavigationContainer>
        <AuthContext.Provider value={updatedContext}>
          <ThemeContext.Provider value={mockTheme}>
            <TabNavigator />
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </NavigationContainer>
    );

    // Should still be on Flows screen
    expect(getByTestId('flows-screen')).toBeTruthy();
  });
});