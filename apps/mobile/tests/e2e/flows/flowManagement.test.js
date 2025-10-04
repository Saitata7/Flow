import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { FlowProvider } from '../../../src/context/FlowContext';
import { AuthProvider } from '../../../src/context/AuthContext';
import { AddFlow } from '../../../src/screens/flow/AddFlow';
import { ViewFlow } from '../../../src/screens/flow/ViewFlow';

// Mock API calls
const mockCreateFlow = jest.fn();
const mockGetFlows = jest.fn();
const mockUpdateFlow = jest.fn();
const mockDeleteFlow = jest.fn();

jest.mock('../../../src/services/flowService', () => ({
  createFlow: mockCreateFlow,
  getFlows: mockGetFlows,
  updateFlow: mockUpdateFlow,
  deleteFlow: mockDeleteFlow,
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

describe('Flow Management E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <NavigationContainer>
        <AuthProvider>
          <FlowProvider>
            {component}
          </FlowProvider>
        </AuthProvider>
      </NavigationContainer>
    );
  };

  describe('Create Flow', () => {
    it('should create a new flow successfully', async () => {
      const mockFlow = {
        id: '1',
        title: 'Morning Routine',
        description: 'Daily morning routine',
        tracking_type: 'binary',
        visibility: 'private',
      };

      mockCreateFlow.mockResolvedValue(mockFlow);

      const { getByTestId, getByText } = renderWithProviders(<AddFlow />);

      // Fill in flow details
      const titleInput = getByTestId('flow-title-input');
      const descriptionInput = getByTestId('flow-description-input');
      const createButton = getByTestId('create-flow-button');

      fireEvent.changeText(titleInput, 'Morning Routine');
      fireEvent.changeText(descriptionInput, 'Daily morning routine');

      // Submit form
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockCreateFlow).toHaveBeenCalledWith({
          title: 'Morning Routine',
          description: 'Daily morning routine',
          tracking_type: 'binary',
          visibility: 'private',
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('ViewFlow', { flowId: '1' });
    });

    it('should handle flow creation errors', async () => {
      const errorMessage = 'Failed to create flow';
      mockCreateFlow.mockRejectedValue(new Error(errorMessage));

      const { getByTestId, getByText } = renderWithProviders(<AddFlow />);

      const titleInput = getByTestId('flow-title-input');
      const createButton = getByTestId('create-flow-button');

      fireEvent.changeText(titleInput, 'Morning Routine');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
      });
    });

    it('should validate required fields', async () => {
      const { getByTestId, getByText } = renderWithProviders(<AddFlow />);

      const createButton = getByTestId('create-flow-button');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Title is required')).toBeTruthy();
      });

      expect(mockCreateFlow).not.toHaveBeenCalled();
    });
  });

  describe('View Flow', () => {
    it('should display flow details', async () => {
      const mockFlow = {
        id: '1',
        title: 'Morning Routine',
        description: 'Daily morning routine',
        tracking_type: 'binary',
        visibility: 'private',
        created_at: '2024-01-15T10:00:00Z',
      };

      mockGetFlows.mockResolvedValue([mockFlow]);

      const { getByTestId, getByText } = renderWithProviders(
        <ViewFlow route={{ params: { flowId: '1' } }} />
      );

      await waitFor(() => {
        expect(getByText('Morning Routine')).toBeTruthy();
        expect(getByText('Daily morning routine')).toBeTruthy();
      });
    });

    it('should handle flow not found', async () => {
      mockGetFlows.mockResolvedValue([]);

      const { getByTestId, getByText } = renderWithProviders(
        <ViewFlow route={{ params: { flowId: '999' } }} />
      );

      await waitFor(() => {
        expect(getByText('Flow not found')).toBeTruthy();
      });
    });

    it('should edit flow', async () => {
      const mockFlow = {
        id: '1',
        title: 'Morning Routine',
        description: 'Daily morning routine',
        tracking_type: 'binary',
        visibility: 'private',
      };

      const updatedFlow = {
        ...mockFlow,
        title: 'Updated Morning Routine',
        description: 'Updated daily morning routine',
      };

      mockGetFlows.mockResolvedValue([mockFlow]);
      mockUpdateFlow.mockResolvedValue(updatedFlow);

      const { getByTestId, getByText } = renderWithProviders(
        <ViewFlow route={{ params: { flowId: '1' } }} />
      );

      await waitFor(() => {
        expect(getByText('Morning Routine')).toBeTruthy();
      });

      // Edit flow
      const editButton = getByTestId('edit-flow-button');
      fireEvent.press(editButton);

      const titleInput = getByTestId('flow-title-input');
      const saveButton = getByTestId('save-flow-button');

      fireEvent.changeText(titleInput, 'Updated Morning Routine');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockUpdateFlow).toHaveBeenCalledWith('1', {
          title: 'Updated Morning Routine',
          description: 'Daily morning routine',
          tracking_type: 'binary',
          visibility: 'private',
        });
      });
    });

    it('should delete flow', async () => {
      const mockFlow = {
        id: '1',
        title: 'Morning Routine',
        description: 'Daily morning routine',
        tracking_type: 'binary',
        visibility: 'private',
      };

      mockGetFlows.mockResolvedValue([mockFlow]);
      mockDeleteFlow.mockResolvedValue();

      const { getByTestId, getByText } = renderWithProviders(
        <ViewFlow route={{ params: { flowId: '1' } }} />
      );

      await waitFor(() => {
        expect(getByText('Morning Routine')).toBeTruthy();
      });

      // Delete flow
      const deleteButton = getByTestId('delete-flow-button');
      fireEvent.press(deleteButton);

      const confirmButton = getByTestId('confirm-delete-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockDeleteFlow).toHaveBeenCalledWith('1');
      });

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Flow Entries', () => {
    it('should add flow entry', async () => {
      const mockFlow = {
        id: '1',
        title: 'Morning Routine',
        description: 'Daily morning routine',
        tracking_type: 'binary',
        visibility: 'private',
      };

      mockGetFlows.mockResolvedValue([mockFlow]);

      const { getByTestId, getByText } = renderWithProviders(
        <ViewFlow route={{ params: { flowId: '1' } }} />
      );

      await waitFor(() => {
        expect(getByText('Morning Routine')).toBeTruthy();
      });

      // Add entry
      const addEntryButton = getByTestId('add-entry-button');
      fireEvent.press(addEntryButton);

      const entryInput = getByTestId('entry-input');
      const saveEntryButton = getByTestId('save-entry-button');

      fireEvent.changeText(entryInput, 'Completed morning routine');
      fireEvent.press(saveEntryButton);

      await waitFor(() => {
        expect(getByText('Entry added successfully')).toBeTruthy();
      });
    });

    it('should edit flow entry', async () => {
      const mockFlow = {
        id: '1',
        title: 'Morning Routine',
        description: 'Daily morning routine',
        tracking_type: 'binary',
        visibility: 'private',
        entries: [
          {
            id: '1',
            content: 'Completed morning routine',
            symbol: '+',
            date: '2024-01-15',
          },
        ],
      };

      mockGetFlows.mockResolvedValue([mockFlow]);

      const { getByTestId, getByText } = renderWithProviders(
        <ViewFlow route={{ params: { flowId: '1' } }} />
      );

      await waitFor(() => {
        expect(getByText('Completed morning routine')).toBeTruthy();
      });

      // Edit entry
      const editEntryButton = getByTestId('edit-entry-button');
      fireEvent.press(editEntryButton);

      const entryInput = getByTestId('entry-input');
      const saveEntryButton = getByTestId('save-entry-button');

      fireEvent.changeText(entryInput, 'Updated morning routine');
      fireEvent.press(saveEntryButton);

      await waitFor(() => {
        expect(getByText('Entry updated successfully')).toBeTruthy();
      });
    });

    it('should delete flow entry', async () => {
      const mockFlow = {
        id: '1',
        title: 'Morning Routine',
        description: 'Daily morning routine',
        tracking_type: 'binary',
        visibility: 'private',
        entries: [
          {
            id: '1',
            content: 'Completed morning routine',
            symbol: '+',
            date: '2024-01-15',
          },
        ],
      };

      mockGetFlows.mockResolvedValue([mockFlow]);

      const { getByTestId, getByText } = renderWithProviders(
        <ViewFlow route={{ params: { flowId: '1' } }} />
      );

      await waitFor(() => {
        expect(getByText('Completed morning routine')).toBeTruthy();
      });

      // Delete entry
      const deleteEntryButton = getByTestId('delete-entry-button');
      fireEvent.press(deleteEntryButton);

      const confirmButton = getByTestId('confirm-delete-button');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(getByText('Entry deleted successfully')).toBeTruthy();
      });
    });
  });
});
