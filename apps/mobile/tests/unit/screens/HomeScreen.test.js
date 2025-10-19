import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomePage from '../../../src/screens/home/HomePage';
import { FlowsContext } from '../../../src/context/FlowContext';
import { ThemeContext } from '../../../src/context/ThemeContext';

// Mock the components and hooks
// jest.mock('../../../src/hooks/useProfile', () => ({
//   useProfile: () => ({
//     profile: {
//       displayName: 'Test User',
//       name: 'Test User',
//     },
//   }),
// }));

jest.mock('../../../src/components/flow/todayResponse/TodaysFlows', () => {
  return function MockTodaysFlows({ navigation, visibleFlows }) {
    return null; // Mock component
  };
});

jest.mock('../../../src/screens/home/InfoModal', () => {
  return function MockInfoModal({ visible, onClose }) {
    return null; // Mock component
  };
});

jest.mock('expo-linear-gradient', () => {
  return function MockLinearGradient({ children, style }) {
    return <div style={style}>{children}</div>;
  };
});

jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return moment;
});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock context values
const mockFlowsContext = {
  flows: [
    {
      id: '1',
      title: 'Morning Workout',
      trackingType: 'Binary',
      frequency: 'Daily',
      status: {
        '2024-01-01': { symbol: '+' },
        '2024-01-02': { symbol: '-' },
      },
    },
    {
      id: '2',
      title: 'Drink Water',
      trackingType: 'Quantitative',
      frequency: 'Daily',
      status: {
        '2024-01-01': { symbol: '+' },
        '2024-01-02': { symbol: '+' },
      },
    },
  ],
};

const mockThemeContext = {
  theme: 'light',
  textSize: 'medium',
  highContrast: false,
  cheatMode: false,
};

const renderWithProviders = (component) => {
  return render(
    <NavigationContainer>
      <ThemeContext.Provider value={mockThemeContext}>
        <FlowsContext.Provider value={mockFlowsContext}>
          {component}
        </FlowsContext.Provider>
      </ThemeContext.Provider>
    </NavigationContainer>
  );
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with flows', () => {
    const { getByText } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Check if greeting is displayed
    expect(getByText(/Good morning|Good afternoon|Good evening/)).toBeTruthy();
    expect(getByText('Test User! 👋')).toBeTruthy();
  });

  it('displays streak information', () => {
    const { getByText } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Check if streak is displayed
    expect(getByText('day streak')).toBeTruthy();
    expect(getByText('Keep it up! 🔥')).toBeTruthy();
  });

  it('opens info modal when info icon is pressed', async () => {
    const { getByTestId } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Find and press the info icon
    const infoButton = getByTestId('info-icon-button');
    fireEvent.press(infoButton);

    // The InfoModal should be triggered (mocked component)
    await waitFor(() => {
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  it('navigates to notifications when notification icon is pressed', () => {
    const { getByTestId } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Find and press the notification icon
    const notificationButton = getByTestId('notification-icon-button');
    fireEvent.press(notificationButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('NotificationScreen');
  });

  it('displays notification badge when there are notifications', () => {
    const { getByText } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Check if notification badge is displayed
    expect(getByText('3')).toBeTruthy(); // Mock notification count
  });

  it('navigates to AddFlow when FAB is pressed', () => {
    const { getByText } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Find and press the Add Flow button
    const addFlowButton = getByText('+ Add Flow');
    fireEvent.press(addFlowButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddFlow');
  });

  it('displays flows in the habit tracker', () => {
    const { getByText } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Check if flows are displayed
    expect(getByText('Morning Workout')).toBeTruthy();
    expect(getByText('Drink Water')).toBeTruthy();
  });

  it('displays quote of the day', () => {
    const { getByText } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Check if quote is displayed
    expect(getByText('Quote of the day')).toBeTruthy();
    expect(getByText(/It takes at least 21 days to make a flow/)).toBeTruthy();
  });

  it('displays Today Flows section', () => {
    const { getByText } = renderWithProviders(
      <HomePage navigation={mockNavigation} />
    );

    // Check if Today Flows section is displayed
    expect(getByText('Today Flows')).toBeTruthy();
  });

  it('handles empty flows gracefully', () => {
    const emptyFlowsContext = {
      flows: [],
    };

    const { getByText } = render(
      <NavigationContainer>
        <ThemeContext.Provider value={mockThemeContext}>
          <FlowsContext.Provider value={emptyFlowsContext}>
            <HomePage navigation={mockNavigation} />
          </FlowsContext.Provider>
        </ThemeContext.Provider>
      </NavigationContainer>
    );

    // Should still display greeting and basic UI
    expect(getByText(/Good morning|Good afternoon|Good evening/)).toBeTruthy();
  });
});
