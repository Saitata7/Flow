const axios = require('axios');

class FlowApiClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:4000/v1';
    this.apiKey = options.apiKey || null;
    this.timeout = options.timeout || 10000;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers['X-API-Key'] = this.apiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error status
          throw new Error(error.response.data.message || error.response.data.error || 'API request failed');
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Network error - no response received');
        } else {
          // Something else happened
          throw new Error(error.message);
        }
      }
    );
  }

  // Set authentication token
  setAuthToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health');
  }

  // Flows API
  async createFlow(flowData) {
    return this.client.post('/flows', flowData);
  }

  async getFlows(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.archived !== undefined) params.append('archived', options.archived);
    if (options.visibility) params.append('visibility', options.visibility);
    
    return this.client.get(`/flows?${params.toString()}`);
  }

  async getFlow(id) {
    return this.client.get(`/flows/${id}`);
  }

  async updateFlow(id, updateData) {
    return this.client.put(`/flows/${id}`, updateData);
  }

  async archiveFlow(id) {
    return this.client.patch(`/flows/${id}/archive`);
  }

  async deleteFlow(id) {
    return this.client.delete(`/flows/${id}`);
  }

  async searchFlows(query, options = {}) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (options.tags) {
      const tags = Array.isArray(options.tags) ? options.tags : [options.tags];
      tags.forEach(tag => params.append('tags', tag));
    }
    if (options.trackingType) params.append('trackingType', options.trackingType);
    if (options.visibility) params.append('visibility', options.visibility);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    
    return this.client.get(`/flows/search?${params.toString()}`);
  }

  async getFlowStats(id) {
    return this.client.get(`/flows/${id}/stats`);
  }

  // Flow Entries API
  async createFlowEntry(entryData) {
    return this.client.post('/entries', entryData);
  }

  async getFlowEntries(options = {}) {
    const params = new URLSearchParams();
    if (options.flowId) params.append('flowId', options.flowId);
    if (options.date) params.append('date', options.date);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    
    return this.client.get(`/entries?${params.toString()}`);
  }

  async getFlowEntry(id) {
    return this.client.get(`/entries/${id}`);
  }

  async updateFlowEntry(id, updateData) {
    return this.client.put(`/entries/${id}`, updateData);
  }

  async deleteFlowEntry(id) {
    return this.client.delete(`/entries/${id}`);
  }

  // Plans API
  async createPlan(planData) {
    return this.client.post('/plans', planData);
  }

  async getPlans(options = {}) {
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.status) params.append('status', options.status);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    
    return this.client.get(`/plans?${params.toString()}`);
  }

  async getPlan(id) {
    return this.client.get(`/plans/${id}`);
  }

  async updatePlan(id, updateData) {
    return this.client.put(`/plans/${id}`, updateData);
  }

  async joinPlan(id) {
    return this.client.post(`/plans/${id}/join`);
  }

  async leavePlan(id) {
    return this.client.post(`/plans/${id}/leave`);
  }

  // Profiles API
  async getProfile(id) {
    return this.client.get(`/profiles/${id}`);
  }

  async updateProfile(id, profileData) {
    return this.client.put(`/profiles/${id}`, profileData);
  }

  async getPublicProfile(id) {
    return this.client.get(`/profiles/${id}/public`);
  }

  // Settings API
  async getSettings() {
    return this.client.get('/settings');
  }

  async updateSettings(settingsData) {
    return this.client.put('/settings', settingsData);
  }

  // Stats API
  async getLeaderboard(options = {}) {
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.timeframe) params.append('timeframe', options.timeframe);
    if (options.limit) params.append('limit', options.limit);
    
    return this.client.get(`/stats/leaderboard?${params.toString()}`);
  }

  async getUserStats(userId) {
    return this.client.get(`/stats/user/${userId}`);
  }

  async getTrends(options = {}) {
    const params = new URLSearchParams();
    if (options.flowId) params.append('flowId', options.flowId);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    
    return this.client.get(`/stats/trends?${params.toString()}`);
  }
}

// Factory function for creating client instances
const createClient = (options) => {
  return new FlowApiClient(options);
};

// Default client instance
const defaultClient = new FlowApiClient();

module.exports = {
  FlowApiClient,
  createClient,
  defaultClient,
};
