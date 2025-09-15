/**
 * FlowCard Component Unit Tests
 * Tests the FlowCard component rendering and interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FlowCard } from '../../../src/components/flow/FlowCard';

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

// Mock the theme context
jest.mock('../../../src/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('FlowCard Component', () => {
  const mockFlow = {
    id: '1',
    title: 'Test Flow',
    description: 'Test flow description',
    tracking_type: 'binary',
    visibility: 'private',
    owner_id: '123',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    current_streak: 5,
    longest_streak: 10,
    total_entries: 25,
    completion_rate: 80,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render flow card with correct information', () => {
    const { getByText, getByTestId } = render(
      <FlowCard flow={mockFlow} onPress={jest.fn()} />
    );

    expect(getByText('Test Flow')).toBeTruthy();
    expect(getByText('Test flow description')).toBeTruthy();
    expect(getByText('5')).toBeTruthy(); // current streak
    expect(getByText('10')).toBeTruthy(); // longest streak
    expect(getByText('25')).toBeTruthy(); // total entries
    expect(getByText('80%')).toBeTruthy(); // completion rate
  });

  it('should call onPress when card is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <FlowCard flow={mockFlow} onPress={mockOnPress} />
    );

    const card = getByTestId('flow-card');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledWith(mockFlow);
  });

  it('should display correct tracking type icon', () => {
    const { getByTestId } = render(
      <FlowCard flow={mockFlow} onPress={jest.fn()} />
    );

    const icon = getByTestId('tracking-type-icon');
    expect(icon).toBeTruthy();
  });

  it('should display visibility indicator', () => {
    const { getByTestId } = render(
      <FlowCard flow={mockFlow} onPress={jest.fn()} />
    );

    const visibilityIndicator = getByTestId('visibility-indicator');
    expect(visibilityIndicator).toBeTruthy();
  });

  it('should handle long press for context menu', async () => {
    const mockOnLongPress = jest.fn();
    const { getByTestId } = render(
      <FlowCard 
        flow={mockFlow} 
        onPress={jest.fn()} 
        onLongPress={mockOnLongPress}
      />
    );

    const card = getByTestId('flow-card');
    fireEvent(card, 'longPress');

    await waitFor(() => {
      expect(mockOnLongPress).toHaveBeenCalledWith(mockFlow);
    });
  });

  it('should render with different tracking types', () => {
    const quantitativeFlow = {
      ...mockFlow,
      tracking_type: 'quantitative',
    };

    const { getByTestId } = render(
      <FlowCard flow={quantitativeFlow} onPress={jest.fn()} />
    );

    const icon = getByTestId('tracking-type-icon');
    expect(icon).toBeTruthy();
  });

  it('should render with different visibility settings', () => {
    const publicFlow = {
      ...mockFlow,
      visibility: 'public',
    };

    const { getByTestId } = render(
      <FlowCard flow={publicFlow} onPress={jest.fn()} />
    );

    const visibilityIndicator = getByTestId('visibility-indicator');
    expect(visibilityIndicator).toBeTruthy();
  });

  it('should handle missing optional data gracefully', () => {
    const minimalFlow = {
      id: '2',
      title: 'Minimal Flow',
      tracking_type: 'binary',
      visibility: 'private',
      owner_id: '123',
    };

    const { getByText } = render(
      <FlowCard flow={minimalFlow} onPress={jest.fn()} />
    );

    expect(getByText('Minimal Flow')).toBeTruthy();
  });

  it('should display correct completion rate format', () => {
    const flowWithDecimalRate = {
      ...mockFlow,
      completion_rate: 85.5,
    };

    const { getByText } = render(
      <FlowCard flow={flowWithDecimalRate} onPress={jest.fn()} />
    );

    expect(getByText('85.5%')).toBeTruthy();
  });

  it('should handle zero values correctly', () => {
    const zeroFlow = {
      ...mockFlow,
      current_streak: 0,
      longest_streak: 0,
      total_entries: 0,
      completion_rate: 0,
    };

    const { getByText } = render(
      <FlowCard flow={zeroFlow} onPress={jest.fn()} />
    );

    expect(getByText('0')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
  });
});
