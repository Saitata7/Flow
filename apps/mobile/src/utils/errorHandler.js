// utils/errorHandler.js
// Enhanced error handling with graceful fallbacks

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.isOnline = true;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    // This would integrate with NetInfo in a real implementation
    // For now, we'll assume online status
  }

  /**
   * Handle API errors with graceful fallbacks
   */
  async handleApiError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      code: error.code,
      status: error.status,
      context,
      timestamp: new Date().toISOString(),
      isOnline: this.isOnline
    };

    logger.error('API Error:', errorInfo);

    // Handle specific error types
    switch (error.status) {
      case 401:
        return this.handleUnauthorizedError(error, context);
      case 403:
        return this.handleForbiddenError(error, context);
      case 404:
        return this.handleNotFoundError(error, context);
      case 409:
        return this.handleConflictError(error, context);
      case 429:
        return this.handleRateLimitError(error, context);
      case 500:
      case 502:
      case 503:
        return this.handleServerError(error, context);
      default:
        return this.handleGenericError(error, context);
    }
  }

  /**
   * Handle unauthorized errors (401)
   */
  async handleUnauthorizedError(error, context) {
    logger.warn('Unauthorized access - user needs to login');
    
    // Queue the operation for retry after login
    if (context.operation) {
      await this.queueOperationForRetry(context.operation);
    }

    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Please login to continue',
      shouldRetry: true,
      requiresAuth: true
    };
  }

  /**
   * Handle forbidden errors (403)
   */
  async handleForbiddenError(error, context) {
    logger.warn('Forbidden access - insufficient permissions');
    
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'You don\'t have permission to perform this action',
      shouldRetry: false,
      requiresAuth: false
    };
  }

  /**
   * Handle not found errors (404)
   */
  async handleNotFoundError(error, context) {
    logger.warn('Resource not found');
    
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'The requested resource was not found',
      shouldRetry: false,
      requiresAuth: false
    };
  }

  /**
   * Handle conflict errors (409)
   */
  async handleConflictError(error, context) {
    logger.warn('Conflict error - resource already exists');
    
    return {
      success: false,
      error: 'CONFLICT',
      message: 'This item already exists. Please choose a different name.',
      shouldRetry: false,
      requiresAuth: false
    };
  }

  /**
   * Handle rate limit errors (429)
   */
  async handleRateLimitError(error, context) {
    logger.warn('Rate limit exceeded');
    
    // Queue for retry with exponential backoff
    if (context.operation) {
      await this.queueOperationForRetry(context.operation, 60000); // 1 minute delay
    }

    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      shouldRetry: true,
      retryAfter: 60000
    };
  }

  /**
   * Handle server errors (5xx)
   */
  async handleServerError(error, context) {
    logger.error('Server error occurred');
    
    // Queue for retry with exponential backoff
    if (context.operation) {
      await this.queueOperationForRetry(context.operation, 30000); // 30 second delay
    }

    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Server is temporarily unavailable. Please try again later.',
      shouldRetry: true,
      retryAfter: 30000
    };
  }

  /**
   * Handle generic errors
   */
  async handleGenericError(error, context) {
    logger.error('Generic error occurred:', error);
    
    // Check if it's a network error
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, context);
    }

    return {
      success: false,
      error: 'UNKNOWN',
      message: 'An unexpected error occurred. Please try again.',
      shouldRetry: true,
      requiresAuth: false
    };
  }

  /**
   * Handle network errors
   */
  async handleNetworkError(error, context) {
    logger.warn('Network error - storing operation for offline retry');
    
    // Store operation for offline retry
    if (context.operation) {
      await this.storeOfflineOperation(context.operation);
    }

    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'No internet connection. Changes will be saved when you\'re back online.',
      shouldRetry: true,
      isOffline: true
    };
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(error) {
    const networkErrors = [
      'Network request failed',
      'fetch failed',
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];
    
    return networkErrors.some(networkError => 
      error.message?.toLowerCase().includes(networkError.toLowerCase())
    );
  }

  /**
   * Queue operation for retry after login
   */
  async queueOperationForRetry(operation, delay = 0) {
    try {
      const retryQueue = await AsyncStorage.getItem('retry_queue') || '[]';
      const queue = JSON.parse(retryQueue);
      
      queue.push({
        ...operation,
        queuedAt: new Date().toISOString(),
        retryAfter: delay
      });
      
      await AsyncStorage.setItem('retry_queue', JSON.stringify(queue));
      logger.log('Operation queued for retry:', operation.type);
    } catch (error) {
      logger.error('Failed to queue operation for retry:', error);
    }
  }

  /**
   * Store operation for offline retry
   */
  async storeOfflineOperation(operation) {
    try {
      const offlineQueue = await AsyncStorage.getItem('offline_queue') || '[]';
      const queue = JSON.parse(offlineQueue);
      
      queue.push({
        ...operation,
        storedAt: new Date().toISOString(),
        isOffline: true
      });
      
      await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
      logger.log('Operation stored for offline retry:', operation.type);
    } catch (error) {
      logger.error('Failed to store offline operation:', error);
    }
  }

  /**
   * Show user-friendly error message
   */
  showUserError(errorResult) {
    const { error, message, requiresAuth, isOffline } = errorResult;
    
    if (requiresAuth) {
      Alert.alert(
        'Authentication Required',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {
            // Navigate to login screen
            logger.log('User chose to login');
          }}
        ]
      );
    } else if (isOffline) {
      Alert.alert(
        'Offline Mode',
        message,
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Error',
        message,
        [{ text: 'OK', style: 'default' }]
      );
    }
  }

  /**
   * Process retry queue when back online
   */
  async processRetryQueue() {
    try {
      const retryQueue = await AsyncStorage.getItem('retry_queue') || '[]';
      const queue = JSON.parse(retryQueue);
      
      if (queue.length === 0) return;
      
      logger.log(`Processing ${queue.length} queued operations`);
      
      for (const operation of queue) {
        try {
          // Retry the operation
          await this.retryOperation(operation);
          
          // Remove from queue on success
          const updatedQueue = queue.filter(op => op !== operation);
          await AsyncStorage.setItem('retry_queue', JSON.stringify(updatedQueue));
          
          logger.log('Successfully retried operation:', operation.type);
        } catch (error) {
          logger.warn('Failed to retry operation:', operation.type, error.message);
        }
      }
    } catch (error) {
      logger.error('Failed to process retry queue:', error);
    }
  }

  /**
   * Retry a specific operation
   */
  async retryOperation(operation) {
    // This would implement the actual retry logic
    // For now, we'll just log it
    logger.log('Retrying operation:', operation);
  }
}

// Export singleton instance
export default new ErrorHandler();