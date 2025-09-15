import { apiClient } from '../../../src/services/apiClient';

// Mock fetch
global.fetch = jest.fn();

describe('API Client Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('GET Requests', () => {
    it('should make GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test Flow' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/flows');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/flows'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle GET request errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/flows')).rejects.toThrow('Network error');
    });

    it('should handle non-200 responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiClient.get('/flows/999')).rejects.toThrow('404 Not Found');
    });
  });

  describe('POST Requests', () => {
    it('should make POST request successfully', async () => {
      const mockData = { id: 1, name: 'New Flow' };
      const requestData = { name: 'New Flow' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.post('/flows', requestData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/flows'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle POST request errors', async () => {
      const requestData = { name: 'New Flow' };
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.post('/flows', requestData)).rejects.toThrow('Network error');
    });
  });

  describe('PUT Requests', () => {
    it('should make PUT request successfully', async () => {
      const mockData = { id: 1, name: 'Updated Flow' };
      const requestData = { name: 'Updated Flow' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.put('/flows/1', requestData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/flows/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('DELETE Requests', () => {
    it('should make DELETE request successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiClient.delete('/flows/1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/flows/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Authentication', () => {
    it('should include auth token in requests', async () => {
      const mockToken = 'mock-auth-token';
      apiClient.setAuthToken(mockToken);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.get('/flows');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should clear auth token', () => {
      apiClient.setAuthToken('mock-token');
      apiClient.clearAuthToken();
      
      expect(apiClient.getAuthToken()).toBeNull();
    });
  });

  describe('Request Interceptors', () => {
    it('should add request interceptor', () => {
      const interceptor = jest.fn();
      apiClient.addRequestInterceptor(interceptor);

      expect(apiClient.getRequestInterceptors()).toContain(interceptor);
    });

    it('should remove request interceptor', () => {
      const interceptor = jest.fn();
      apiClient.addRequestInterceptor(interceptor);
      apiClient.removeRequestInterceptor(interceptor);

      expect(apiClient.getRequestInterceptors()).not.toContain(interceptor);
    });
  });

  describe('Response Interceptors', () => {
    it('should add response interceptor', () => {
      const interceptor = jest.fn();
      apiClient.addResponseInterceptor(interceptor);

      expect(apiClient.getResponseInterceptors()).toContain(interceptor);
    });

    it('should remove response interceptor', () => {
      const interceptor = jest.fn();
      apiClient.addResponseInterceptor(interceptor);
      apiClient.removeResponseInterceptor(interceptor);

      expect(apiClient.getResponseInterceptors()).not.toContain(interceptor);
    });
  });

  describe('Base URL Configuration', () => {
    it('should use default base URL', () => {
      expect(apiClient.getBaseURL()).toBeDefined();
    });

    it('should update base URL', () => {
      const newBaseURL = 'https://api.example.com';
      apiClient.setBaseURL(newBaseURL);
      
      expect(apiClient.getBaseURL()).toBe(newBaseURL);
    });
  });
});
