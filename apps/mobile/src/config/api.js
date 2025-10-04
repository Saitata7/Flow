// config/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

// Base API configuration
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.10.94:4000/v1'  // Local development server
  : 'https://flow-api-c57f3te5va-uc.a.run.app/v1';   // Production Cloud Run URL

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Platform': 'mobile',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get auth token from storage (Firebase token)
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.log('Unauthorized access - redirecting to login');
      // You can dispatch a logout action here
    }
    
    // Handle network errors gracefully
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.log('Network error - backend may not be available');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get auth token from Firebase
const getAuthToken = async () => {
  try {
    const user = auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export { apiClient, getAuthToken };
export default apiClient;
