// src/utils/authStatusChecker.js
// Simple authentication status checker for debugging

import sessionApiService from '../services/sessionApiService';

class AuthStatusChecker {
  constructor() {
    this.status = {
      jwtUser: null,
      hasToken: false,
      isAuthenticated: false,
      lastCheck: null,
      errors: []
    };
  }

  async checkAuthStatus() {
    console.log('🔍 === AUTH STATUS CHECK ===');
    
    try {
      // 1. Check JWT authentication status
      const isJWTAuthenticated = await sessionApiService.isUserAuthenticated();
      console.log('🔍 JWT authentication:', {
        isAuthenticated: isJWTAuthenticated
      });

      // 2. Check token
      let hasToken = false;
      let tokenPreview = null;
      try {
        const token = await sessionApiService.getAuthToken();
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
        isAuthenticated = await sessionApiService.isUserAuthenticated();
        console.log('🔍 API authentication:', isAuthenticated);
      } catch (authError) {
        console.error('🔍 Auth check error:', authError.message);
      }

      // 4. Test API call
      let apiTestResult = null;
      try {
        console.log('🔍 Testing API call...');
        const testResult = await sessionApiService.testApiConnection();
        apiTestResult = testResult;
        console.log('🔍 API test result:', testResult);
      } catch (apiError) {
        console.error('🔍 API test error:', apiError.message);
        apiTestResult = { success: false, error: apiError.message };
      }

      // Update status
      this.status = {
        jwtUser: isJWTAuthenticated,
        hasToken,
        tokenPreview,
        isAuthenticated: isJWTAuthenticated && hasToken,
        apiTestResult,
        lastCheck: new Date().toISOString(),
        errors: []
      };

      console.log('🔍 === AUTH STATUS SUMMARY ===');
      console.log('JWT Authentication:', this.status.jwtUser ? '✅' : '❌');
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
    
    if (!this.status.jwtUser) {
      issues.push('No JWT authentication - user needs to login');
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
    
    if (issues.some(issue => issue.includes('No JWT authentication'))) {
      recommendations.push('1. User needs to login with email/password');
      recommendations.push('2. Check JWT authentication configuration');
    }
    
    if (issues.some(issue => issue.includes('No authentication token'))) {
      recommendations.push('1. Check JWT token storage');
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
