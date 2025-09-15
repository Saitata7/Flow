/**
 * PlansDashboard Component Unit Tests
 * Tests the PlansDashboard component rendering and interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlansDashboard } from '../../../src/components/PlansDashboard';
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
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

// Mock the auth context
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

// Mock the plans service
const mockPlansService = {
  getPlans: jest.fn(),
  createPlan: jest.fn(),
  joinPlan: jest.fn(),
  leavePlan: jest.fn(),
  updatePlan: jest.fn(),
  deletePlan: jest.fn(),
};

jest.mock('../../../src/services/plansService', () => mockPlansService);

describe('PlansDashboard Component', () => {
  const mockPlans = [
    {
      id: '1',
      title: 'Test Plan 1',
      description: 'Test plan description 1',
      visibility: 'public',
      owner_id: '123',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      participants: 5,
      is_owner: true,
    },
    {
      id: '2',
      title: 'Test Plan 2',
      description: 'Test plan description 2',
      visibility: 'private',
      owner_id: '456',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
      participants: 3,
      is_owner: false,
    },
  ];

  const TestWrapper = ({ children }) => (
    <AuthContext.Provider value={mockAuthContext}>
      <ThemeContext.Provider value={mockTheme}>
        {children}
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlansService.getPlans.mockResolvedValue(mockPlans);
  });

  it('should render plans dashboard with plans', async () => {
    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Plan 1')).toBeInTheDocument();
      expect(screen.getByText('Test Plan 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Test plan description 1')).toBeInTheDocument();
    expect(screen.getByText('Test plan description 2')).toBeInTheDocument();
  });

  it('should display plan statistics', async () => {
    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('5 participants')).toBeInTheDocument();
      expect(screen.getByText('3 participants')).toBeInTheDocument();
    });
  });

  it('should show create plan button for authenticated users', async () => {
    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Plan')).toBeInTheDocument();
    });
  });

  it('should not show create plan button for unauthenticated users', async () => {
    const unauthenticatedContext = {
      ...mockAuthContext,
      user: null,
      isAuthenticated: false,
    };

    render(
      <AuthContext.Provider value={unauthenticatedContext}>
        <ThemeContext.Provider value={mockTheme}>
          <PlansDashboard />
        </ThemeContext.Provider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Create Plan')).not.toBeInTheDocument();
    });
  });

  it('should handle create plan click', async () => {
    const mockOnCreatePlan = jest.fn();
    
    render(
      <TestWrapper>
        <PlansDashboard onCreatePlan={mockOnCreatePlan} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Plan')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Plan');
    fireEvent.click(createButton);

    expect(mockOnCreatePlan).toHaveBeenCalled();
  });

  it('should handle plan click', async () => {
    const mockOnPlanClick = jest.fn();
    
    render(
      <TestWrapper>
        <PlansDashboard onPlanClick={mockOnPlanClick} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Plan 1')).toBeInTheDocument();
    });

    const planCard = screen.getByText('Test Plan 1').closest('[data-testid="plan-card"]');
    fireEvent.click(planCard);

    expect(mockOnPlanClick).toHaveBeenCalledWith(mockPlans[0]);
  });

  it('should display loading state', () => {
    mockPlansService.getPlans.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display error state', async () => {
    mockPlansService.getPlans.mockRejectedValue(new Error('Failed to fetch plans'));

    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load plans')).toBeInTheDocument();
    });
  });

  it('should filter plans by visibility', async () => {
    render(
      <TestWrapper>
        <PlansDashboard showPublicOnly={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Plan 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Plan 2')).not.toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Plan 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search plans...');
    fireEvent.change(searchInput, { target: { value: 'Plan 1' } });

    await waitFor(() => {
      expect(screen.getByText('Test Plan 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Plan 2')).not.toBeInTheDocument();
    });
  });

  it('should handle empty state', async () => {
    mockPlansService.getPlans.mockResolvedValue([]);

    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No plans found')).toBeInTheDocument();
      expect(screen.getByText('Create your first plan to get started')).toBeInTheDocument();
    });
  });

  it('should refresh plans on refresh button click', async () => {
    render(
      <TestWrapper>
        <PlansDashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Plan 1')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);

    expect(mockPlansService.getPlans).toHaveBeenCalledTimes(2);
  });
});
