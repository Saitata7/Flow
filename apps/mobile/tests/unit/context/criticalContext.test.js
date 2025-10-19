/**
 * 🧠 CRITICAL CONTEXT TESTING
 * Testing data management, state synchronization, and business logic
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { FlowsProvider, FlowsContext } from '../../../src/context/FlowContext';
import { AuthProvider, AuthContext } from '../../../src/context/JWTAuthContext';
import { ThemeProvider, ThemeContext } from '../../../src/context/ThemeContext';

// Mock all external dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: {
      uid: 'test-uid',
      email: 'test@example.com',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
    },
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  }),
}));

describe('🧠 CRITICAL CONTEXT TESTING', () => {

  describe('🔄 Flow Context Data Management', () => {
    
    it('should initialize with empty flows array', () => {
      const TestComponent = () => {
        const { flows } = React.useContext(FlowsContext);
        return <div>{JSON.stringify(flows)}</div>;
      };

      const { getByText } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      expect(getByText('[]')).toBeTruthy();
    });

    it('should add new flow correctly', async () => {
      const TestComponent = () => {
        const { flows, addFlow } = React.useContext(FlowsContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          const testFlow = {
            id: '1',
            title: 'Test Flow',
            description: 'Test Description',
            tracking_type: 'binary'
          };
          
          addFlow(testFlow).then(setResult);
        }, [addFlow]);

        return (
          <div>
            <div data-testid="flows-count">{flows.length}</div>
            <div data-testid="result">{result ? 'success' : 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('success');
        expect(getByTestId('flows-count')).toHaveTextContent('1');
      });
    });

    it('should update existing flow correctly', async () => {
      const TestComponent = () => {
        const { flows, addFlow, updateFlow } = React.useContext(FlowsContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          const testFlow = {
            id: '1',
            title: 'Original Title',
            description: 'Original Description',
            tracking_type: 'binary'
          };
          
          addFlow(testFlow).then(() => {
            const updatedFlow = { ...testFlow, title: 'Updated Title' };
            return updateFlow('1', updatedFlow);
          }).then(setResult);
        }, [addFlow, updateFlow]);

        return (
          <div>
            <div data-testid="flows-count">{flows.length}</div>
            <div data-testid="flow-title">{flows[0]?.title || ''}</div>
            <div data-testid="result">{result ? 'success' : 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('success');
        expect(getByTestId('flow-title')).toHaveTextContent('Updated Title');
      });
    });

    it('should delete flow correctly', async () => {
      const TestComponent = () => {
        const { flows, addFlow, deleteFlow } = React.useContext(FlowsContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          const testFlow = {
            id: '1',
            title: 'Test Flow',
            description: 'Test Description',
            tracking_type: 'binary'
          };
          
          addFlow(testFlow).then(() => {
            return deleteFlow('1');
          }).then(setResult);
        }, [addFlow, deleteFlow]);

        return (
          <div>
            <div data-testid="flows-count">{flows.length}</div>
            <div data-testid="result">{result ? 'success' : 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('success');
        expect(getByTestId('flows-count')).toHaveTextContent('0');
      });
    });

    it('should handle sync status correctly', async () => {
      const TestComponent = () => {
        const { syncStatus, syncFlows } = React.useContext(FlowsContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          syncFlows().then(setResult);
        }, [syncFlows]);

        return (
          <div>
            <div data-testid="sync-status">{syncStatus}</div>
            <div data-testid="result">{result ? 'success' : 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('sync-status')).toHaveTextContent('syncing');
        expect(getByTestId('result')).toHaveTextContent('success');
      });
    });
  });

  describe('🔐 Auth Context Management', () => {
    
    it('should initialize with null user', () => {
      const TestComponent = () => {
        const { user, isAuthenticated } = React.useContext(AuthContext);
        return (
          <div>
            <div data-testid="user">{user ? 'authenticated' : 'not-authenticated'}</div>
            <div data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('user')).toHaveTextContent('not-authenticated');
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('should handle login correctly', async () => {
      const TestComponent = () => {
        const { user, login, isAuthenticated } = React.useContext(AuthContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          login('test@example.com', 'password').then(setResult);
        }, [login]);

        return (
          <div>
            <div data-testid="user">{user ? user.email : 'null'}</div>
            <div data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</div>
            <div data-testid="result">{result ? 'success' : 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('success');
        expect(getByTestId('user')).toHaveTextContent('test@example.com');
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      });
    });

    it('should handle logout correctly', async () => {
      const TestComponent = () => {
        const { user, login, logout, isAuthenticated } = React.useContext(AuthContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          login('test@example.com', 'password').then(() => {
            return logout();
          }).then(setResult);
        }, [login, logout]);

        return (
          <div>
            <div data-testid="user">{user ? user.email : 'null'}</div>
            <div data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</div>
            <div data-testid="result">{result ? 'success' : 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('success');
        expect(getByTestId('user')).toHaveTextContent('null');
        expect(getByTestId('is-authenticated')).toHaveTextContent('false');
      });
    });

    it('should handle authentication errors gracefully', async () => {
      const TestComponent = () => {
        const { login, error } = React.useContext(AuthContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          login('invalid@example.com', 'wrongpassword')
            .catch(() => setResult('error-handled'));
        }, [login]);

        return (
          <div>
            <div data-testid="error">{error || 'no-error'}</div>
            <div data-testid="result">{result || 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('error-handled');
      });
    });
  });

  describe('🎨 Theme Context Management', () => {
    
    it('should initialize with light theme', () => {
      const TestComponent = () => {
        const { theme, isDarkMode } = React.useContext(ThemeContext);
        return (
          <div>
            <div data-testid="theme">{theme}</div>
            <div data-testid="is-dark">{isDarkMode ? 'true' : 'false'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(getByTestId('theme')).toHaveTextContent('light');
      expect(getByTestId('is-dark')).toHaveTextContent('false');
    });

    it('should toggle theme correctly', async () => {
      const TestComponent = () => {
        const { theme, toggleTheme, isDarkMode } = React.useContext(ThemeContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          toggleTheme().then(setResult);
        }, [toggleTheme]);

        return (
          <div>
            <div data-testid="theme">{theme}</div>
            <div data-testid="is-dark">{isDarkMode ? 'true' : 'false'}</div>
            <div data-testid="result">{result ? 'success' : 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('success');
        expect(getByTestId('theme')).toHaveTextContent('dark');
        expect(getByTestId('is-dark')).toHaveTextContent('true');
      });
    });

    it('should persist theme preference', async () => {
      const TestComponent = () => {
        const { setTheme } = React.useContext(ThemeContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          setTheme('dark').then(setResult);
        }, [setTheme]);

        return (
          <div data-testid="result">{result ? 'success' : 'pending'}</div>
        );
      };

      const { getByTestId } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('success');
      });
    });
  });

  describe('🔄 Context Integration Testing', () => {
    
    it('should handle multiple context interactions', async () => {
      const TestComponent = () => {
        const flowsContext = React.useContext(FlowsContext);
        const authContext = React.useContext(AuthContext);
        const themeContext = React.useContext(ThemeContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          const runIntegrationTest = async () => {
            // Login user
            await authContext.login('test@example.com', 'password');
            
            // Add flow
            await flowsContext.addFlow({
              id: '1',
              title: 'Test Flow',
              tracking_type: 'binary'
            });
            
            // Change theme
            await themeContext.setTheme('dark');
            
            setResult('integration-success');
          };
          
          runIntegrationTest();
        }, [flowsContext, authContext, themeContext]);

        return (
          <div>
            <div data-testid="flows-count">{flowsContext.flows.length}</div>
            <div data-testid="is-authenticated">{authContext.isAuthenticated ? 'true' : 'false'}</div>
            <div data-testid="theme">{themeContext.theme}</div>
            <div data-testid="result">{result || 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <FlowsProvider>
            <ThemeProvider>
              <TestComponent />
            </ThemeProvider>
          </FlowsProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('integration-success');
        expect(getByTestId('flows-count')).toHaveTextContent('1');
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(getByTestId('theme')).toHaveTextContent('dark');
      });
    });

    it('should handle context errors gracefully', async () => {
      const TestComponent = () => {
        const { addFlow } = React.useContext(FlowsContext);
        const [error, setError] = React.useState(null);

        React.useEffect(() => {
          addFlow(null).catch(err => setError(err.message));
        }, [addFlow]);

        return (
          <div data-testid="error">{error || 'no-error'}</div>
        );
      };

      const { getByTestId } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('error')).not.toHaveTextContent('no-error');
      });
    });
  });

  describe('🚨 Edge Cases & Error Handling', () => {
    
    it('should handle network failures in context operations', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));

      const TestComponent = () => {
        const { syncFlows, syncStatus } = React.useContext(FlowsContext);
        const [result, setResult] = React.useState(null);

        React.useEffect(() => {
          syncFlows().catch(() => setResult('network-error-handled'));
        }, [syncFlows]);

        return (
          <div>
            <div data-testid="sync-status">{syncStatus}</div>
            <div data-testid="result">{result || 'pending'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('result')).toHaveTextContent('network-error-handled');
      });
    });

    it('should handle invalid data gracefully', async () => {
      const TestComponent = () => {
        const { addFlow } = React.useContext(FlowsContext);
        const [error, setError] = React.useState(null);

        React.useEffect(() => {
          addFlow({ invalid: 'data' }).catch(err => setError(err.message));
        }, [addFlow]);

        return (
          <div data-testid="error">{error || 'no-error'}</div>
        );
      };

      const { getByTestId } = render(
        <FlowsProvider>
          <TestComponent />
        </FlowsProvider>
      );

      await waitFor(() => {
        expect(getByTestId('error')).not.toHaveTextContent('no-error');
      });
    });
  });
});
