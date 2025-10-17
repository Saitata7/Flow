// src/utils/authStatusChecker.js
// Simple authentication status checker for debugging

import auth from '@react-native-firebase/auth';
import apiService from '../services/apiService';

class AuthStatusChecker {
  constructor() {
    this.status = {
      firebaseUser: null,
      hasToken: false,
      isAuthenticated: false,
      lastCheck: null,
      errors: []
    };
  }

  async checkAuthStatus() {
    console.log('🔍 === AUTH STATUS CHECK ===');
    
    try {
      // 1. Check Firebase user
      const firebaseUser = auth().currentUser;
      console.log('🔍 Firebase user:', {
        exists: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified,
        isAnonymous: firebaseUser?.isAnonymous
      });

      // 2. Check token
      let hasToken = false;
      let tokenPreview = null;
      try {
        const token = await apiService.getAuthToken();
        hasToken = !!token;
        tokenPreview = token ? token.substring(0, 20) + '...' : null;
        console.log('🔍 Auth token:', {
          hasToken,
          preview: tokenPreview,
          length: token?.length
        });
      } catch (tokenError) {
        console.error('🔍 Token error:', tokenError.message);
      }

      // 3. Check API authentication
      let isAuthenticated = false;
      try {
        isAuthenticated = await apiService.isUserAuthenticated();
        console.log('🔍 API authentication:', isAuthenticated);
      } catch (authError) {
        console.error('🔍 Auth check error:', authError.message);
      }

      // 4. Test API call
      let apiTestResult = null;
      try {
        console.log('🔍 Testing API call...');
        const testResult = await apiService.testApiConnection();
        apiTestResult = testResult;
        console.log('🔍 API test result:', testResult);
      } catch (apiError) {
        console.error('🔍 API test error:', apiError.message);
        apiTestResult = { success: false, error: apiError.message };
      }

      // Update status
      this.status = {
        firebaseUser: firebaseUser ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous
        } : null,
        hasToken,
        tokenPreview,
        isAuthenticated,
        apiTestResult,
        lastCheck: new Date().toISOString(),
        errors: []
      };

      console.log('🔍 === AUTH STATUS SUMMARY ===');
      console.log('Firebase User:', this.status.firebaseUser ? '✅' : '❌');
      console.log('Has Token:', this.status.hasToken ? '✅' : '❌');
      console.log('Is Authenticated:', this.status.isAuthenticated ? '✅' : '❌');
      console.log('API Test:', this.status.apiTestResult?.success ? '✅' : '❌');
      console.log('Last Check:', this.status.lastCheck);

      return this.status;

    } catch (error) {
      console.error('🔍 Auth status check failed:', error);
      this.status.errors.push(error.message);
      return this.status;
    }
  }

  getStatus() {
    return this.status;
  }

  // Quick check for common issues
  getQuickDiagnosis() {
    const issues = [];
    
    if (!this.status.firebaseUser) {
      issues.push('No Firebase user found - user needs to login');
    } else if (this.status.firebaseUser.isAnonymous) {
      issues.push('User is anonymous - anonymous users cannot access API');
    } else if (!this.status.firebaseUser.emailVerified) {
      issues.push('Email not verified - may cause API authentication issues');
    }
    
    if (!this.status.hasToken) {
      issues.push('No authentication token available');
    }
    
    if (!this.status.isAuthenticated) {
      issues.push('API authentication check failed');
    }
    
    if (this.status.apiTestResult && !this.status.apiTestResult.success) {
      issues.push(`API test failed: ${this.status.apiTestResult.error}`);
    }
    
    return {
      hasIssues: issues.length > 0,
      issues,
      recommendations: this.getRecommendations(issues)
    };
  }

  getRecommendations(issues) {
    const recommendations = [];
    
    if (issues.some(issue => issue.includes('No Firebase user'))) {
      recommendations.push('1. User needs to login with email/password');
      recommendations.push('2. Check Firebase configuration');
    }
    
    if (issues.some(issue => issue.includes('anonymous'))) {
      recommendations.push('1. User needs to sign up or login (not anonymous)');
      recommendations.push('2. Clear anonymous session and login properly');
    }
    
    if (issues.some(issue => issue.includes('Email not verified'))) {
      recommendations.push('1. Verify email address in Firebase Console');
      recommendations.push('2. Or disable email verification requirement');
    }
    
    if (issues.some(issue => issue.includes('No authentication token'))) {
      recommendations.push('1. Check Firebase Auth initialization');
      recommendations.push('2. Ensure user is properly logged in');
    }
    
    if (issues.some(issue => issue.includes('API test failed'))) {
      recommendations.push('1. Check API server status');
      recommendations.push('2. Verify API configuration');
      recommendations.push('3. Check network connectivity');
    }
    
    return recommendations;
  }
}

export default new AuthStatusChecker();
