// API Configuration for Flow Mobile App
// Update this file with your actual GCP Cloud Run URL after deployment

export const API_CONFIG = {
  // Replace this with your actual Cloud Run URL after deployment
  // Format: https://SERVICE_NAME-hash-REGION.a.run.app/v1
  DEVELOPMENT_URL: 'https://flow-api-hash-us-central1.a.run.app/v1',
  
  // Production custom domain (if configured)
  PRODUCTION_URL: 'https://api.flow.app/v1',
  
  // Current active URL (will be set based on environment)
  get baseURL() {
    return __DEV__ ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
  },
  
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Instructions:
// 1. Deploy your API to GCP Cloud Run using: ./deploy-quick.sh
// 2. Copy the service URL from the deployment output
// 3. Replace the DEVELOPMENT_URL above with your actual Cloud Run URL
// 4. Test the mobile app with the new URL
